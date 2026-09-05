/*
 * Raw Buffer Recorder & Retesting Module
 * Captures and stores the last 20 raw buffer packets per open TCP port to .data/rawData/_PORT_<portId>.json
 * Provides API & offline retesting helper functions for development re-runs without live VPS hardware.
 */

const fs = require('fs');
const path = require('path');
const _data = require('./data');
const decoders = require('./decoders');
const evaluator = require('./evaluator');

const MAX_HISTORY_PER_PORT = 20;
const rawBuffersByPort = {};

const rawBufferRecorder = {};

/**
 * Record an incoming raw buffer packet for a specific port.
 * Keeps only the last 20 records per port and persists to .data/rawData/_PORT_<portId>.json.
 */
rawBufferRecorder.record = function (portId, siteName, rawBuffer, clientAddress = null) {
  if (!portId || !rawBuffer) return;
  const portKey = String(portId);

  if (!rawBuffersByPort[portKey]) {
    rawBuffersByPort[portKey] = [];
  }

  const record = {
    id: `${portKey}_${Date.now()}_${rawBuffersByPort[portKey].length + 1}`,
    index: rawBuffersByPort[portKey].length + 1,
    timestamp: new Date().toISOString(),
    timeLabel: new Date().toLocaleTimeString(),
    port: Number(portId),
    siteName: siteName || 'N/A',
    clientAddress: clientAddress || 'N/A',
    length: rawBuffer.length,
    rawBuffer: rawBuffer,
  };

  rawBuffersByPort[portKey].push(record);

  // Maintain rolling window of last N entries
  if (rawBuffersByPort[portKey].length > MAX_HISTORY_PER_PORT) {
    rawBuffersByPort[portKey].shift();
    rawBuffersByPort[portKey].forEach((rec, i) => (rec.index = i + 1));
  }

  // Persist to .data/rawData/_PORT_<portId>.json
  _data.update('rawData', `_PORT_${portKey}`, rawBuffersByPort[portKey], (err) => {
    if (err) {
      _data.create('rawData', `_PORT_${portKey}`, rawBuffersByPort[portKey], () => {});
    }
  });
};

/**
 * Retrieve saved raw buffer history for a specific port or all open ports.
 */
rawBufferRecorder.getBuffers = function (portId = null, callback) {
  if (portId) {
    const portKey = String(portId);
    _data.read('rawData', `_PORT_${portKey}`, (err, data) => {
      if (!err && Array.isArray(data)) {
        rawBuffersByPort[portKey] = data;
        return callback(null, data);
      }
      return callback(null, rawBuffersByPort[portKey] || []);
    });
  } else {
    _data.list('rawData', (err, files) => {
      if (err || !files) return callback(null, rawBuffersByPort);
      const portFiles = files.filter((f) => f.startsWith('_PORT_'));
      if (portFiles.length === 0) return callback(null, rawBuffersByPort);

      let completed = 0;
      const result = { ...rawBuffersByPort };

      portFiles.forEach((file) => {
        const pKey = file.replace('_PORT_', '');
        _data.read('rawData', file, (err, data) => {
          completed++;
          if (!err && Array.isArray(data)) {
            result[pKey] = data;
            rawBuffersByPort[pKey] = data;
          }
          if (completed === portFiles.length) {
            callback(null, result);
          }
        });
      });
    });
  }
};

/**
 * Retest a raw buffer packet offline through decoders and evaluator.
 */
rawBufferRecorder.retestBuffer = function ({ portId, buffer, siteName, sensorSetting = null }, callback) {
  if (!buffer) return callback('Missing raw buffer input', null);

  const _PORTID = portId || 1008;
  const _siteName = siteName || 'DEVELOPMENT_TEST';
  const DataArr = buffer.toString().toUpperCase().split('0D');
  const _APKEY = buffer.substring(0, 2).toString().toUpperCase();
  const _HEADER = DataArr[0] ? DataArr[0].substring(0, 2) : '';

  let decoderType = 'UNKNOWN';
  let decodedPayload = null;
  let statusCode = 0;

  const handleResult = (sc, payload) => {
    decodedPayload = payload;
    statusCode = sc;

    let evalResult = null;
    if (sensorSetting) {
      evalResult = evaluator.evaluateSensorReadings({
        type: sensorSetting.TYPE || 'AIR PRESSURE',
        sensorSetting,
        readings: { ...payload, hex: payload?._DATAHEX || payload?.hex },
      });
    }

    callback(null, {
      portId: _PORTID,
      siteName: _siteName,
      decoderUsed: decoderType,
      statusCode: statusCode,
      rawBuffer: buffer,
      decodedPayload: decodedPayload,
      evalResult: evalResult,
    });
  };

  if (['FA', 'FE', 'FD'].includes(_APKEY)) {
    decoderType = 'decodeF8L10ST_APIMODE';
    decoders.decodeF8L10ST_APIMODE(_PORTID, buffer, false, handleResult);
  } else if (['80', '01', 'FD'].includes(_APKEY) || _HEADER === '80') {
    decoderType = 'decodeWISensorV2';
    decoders.decodeWISensorV2(_PORTID, false, buffer, handleResult);
  } else if (DataArr.length < 4) {
    if (_HEADER === 'FA') {
      decoderType = 'decodeF8L10ST_ATMODE';
      decoders.decodeF8L10ST_ATMODE(_PORTID, buffer, false, handleResult);
    } else {
      decoderType = 'decode485Sensor';
      decoders.decode485Sensor(_PORTID, DataArr, handleResult);
    }
  } else if (DataArr.length >= 4) {
    decoderType = 'decodeWISensorV1';
    decoders.decodeWISensorV1(_PORTID, false, DataArr, handleResult);
  } else {
    callback('Unable to determine appropriate decoder for buffer header', null);
  }
};

module.exports = rawBufferRecorder;
