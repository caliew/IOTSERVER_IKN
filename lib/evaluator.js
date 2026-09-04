/*
 * Sensor Data Evaluator & Threshold Alert Logic
 * Handles bytecode parsing and threshold evaluations for all sensor types:
 * - WATER LEVEL
 * - AC CURRENT (CT Ratio vs Signed Hex)
 * - AIR PRESSURE & DIFF PRESS (AP mode vs WiSensor mode)
 * - WISENSOR & TEMP & RH (with Temp/RH Offsets)
 * - DEW PT.METER
 */

const helpers = require('./helpers');

const filterLIMITS = {
  TEMPERATURE_MAX: 100,
  TEMPERATURE_MIN: -100,
  HUMIDITY_MIN: 20,
  CURRENT_MAX: 1000,
  CURRENT_MIN: -1,
  PRESSURE_MAX: 10,
  PRESSURE_MIN: -10,
  DIFF_PRESSURE_MAX: 100,
};

/**
 * Evaluates sensor readings against sensor threshold settings.
 * @param {Object} params
 * @param {string} params.type - Sensor type
 * @param {Object} params.sensorSetting - Settings object for sensor
 * @param {Object} params.readings - Raw or parsed sensor readings
 * @returns {Object|null} Evaluation result { isAlert, isFalseSignal, alertObj, message }
 */
function evaluateSensorReadings({ type, sensorSetting, readings }) {
  if (!sensorSetting) return null;

  const sensorName = sensorSetting.NAME || 'UNKNOWN';
  const dtuId = sensorSetting.DTUID || readings.modelID || '';
  const group = sensorSetting.GROUP || '';
  const unitSystem = sensorSetting.UNITSYSTEM ? sensorSetting.UNITSYSTEM.toUpperCase() : null;

  const alertObj = {
    TYPE: type,
    DTU: dtuId,
    NAME: sensorName,
    GROUP: group,
    TIMESTAMP: new Date(),
  };

  let flag = false;
  let falseSignal = false;
  let message = `${helpers.GetTIMEStamp()} [${sensorName.toUpperCase()}] `;

  const wtrMin = sensorSetting.WTR_MIN ? Number(sensorSetting.WTR_MIN) : null;
  const wtrMax = sensorSetting.WTR_MAX ? Number(sensorSetting.WTR_MAX) : null;
  const ampMax = sensorSetting.AMP_MAX !== undefined && sensorSetting.AMP_MAX !== null ? Number(sensorSetting.AMP_MAX) : null;
  const ampMin = sensorSetting.AMP_MIN !== undefined && sensorSetting.AMP_MIN !== null ? Number(sensorSetting.AMP_MIN) : null;
  const pressMax = sensorSetting.PRESS_MAX !== undefined && sensorSetting.PRESS_MAX !== null ? Number(sensorSetting.PRESS_MAX) : null;
  const pressMin = sensorSetting.PRESS_MIN !== undefined && sensorSetting.PRESS_MIN !== null ? Number(sensorSetting.PRESS_MIN) : null;
  const tempMax = sensorSetting.TEMP_MAX !== undefined && sensorSetting.TEMP_MAX !== null ? Number(sensorSetting.TEMP_MAX) : null;
  const tempMin = sensorSetting.TEMP_MIN !== undefined && sensorSetting.TEMP_MIN !== null ? Number(sensorSetting.TEMP_MIN) : null;
  const rhMax = sensorSetting.RH_MAX !== undefined && sensorSetting.RH_MAX !== null ? Number(sensorSetting.RH_MAX) : null;
  const rhMin = sensorSetting.RH_MIN !== undefined && sensorSetting.RH_MIN !== null ? Number(sensorSetting.RH_MIN) : null;
  const dewMax = sensorSetting.DEW_MAX !== undefined && sensorSetting.DEW_MAX !== null ? Number(sensorSetting.DEW_MAX) : null;
  const dewMin = sensorSetting.DEW_MIN !== undefined && sensorSetting.DEW_MIN !== null ? Number(sensorSetting.DEW_MIN) : null;
  const offsetPress = sensorSetting.OFFSET_PRESS ? Number(sensorSetting.OFFSET_PRESS) : 0;
  const offsetTemp = sensorSetting.OFFSET_Temp ? Number(sensorSetting.OFFSET_Temp) : 0;
  const offsetRh = sensorSetting._OFFSET_RH ? Number(sensorSetting._OFFSET_RH) : 0;

  const hex = readings.hex || '';

  switch (type) {
    case 'WATER LEVEL': {
      let flagWtr = false;
      let readingWtrLvl = readings.waterlevel ?? readings.waterLevel;
      if (readingWtrLvl === undefined && hex) {
        readingWtrLvl = parseInt(hex, 16);
      }
      alertObj.WATERLEVEL = readingWtrLvl;

      if (wtrMax !== null && readingWtrLvl > wtrMax) {
        flag = true;
        message += ` WATER LEVEL=${readingWtrLvl} > ${wtrMax}MM`;
      }
      flagWtr = flagWtr || flag;

      flag = wtrMin !== null ? readingWtrLvl < wtrMin : false;
      if (flag) {
        message += ` WATER LEVEL=${readingWtrLvl} < ${wtrMin}MM`;
      }
      flag = flagWtr || flag;
      break;
    }

    case 'AC CURRENT': {
      let flagCurr = false;
      let readingCurrent = readings.current;

      if (readingCurrent === undefined && hex) {
        const cleanHex = String(hex).trim();

        if (readings.useCtRatio || (sensorSetting.CTRATIO !== undefined && sensorSetting.CTRATIO !== 1)) {
          // AP Mode / F8L10ST DTU CT Ratio decoding
          const ctRatio = sensorSetting.CTRATIO ?? 1;
          if (ctRatio !== 1) {
            readingCurrent = (Math.abs(helpers.hexToDecimal(cleanHex)) * ctRatio) / 5.0;
          } else {
            readingCurrent = Math.abs(helpers.HEXTOINT(cleanHex) / 100.0);
          }
          readingCurrent = Number(Number(readingCurrent).toFixed(0));

          if (readingCurrent > Number(filterLIMITS.CURRENT_MAX)) {
            return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
          }
        } else {
          // Standard WiSensor hex division
          let targetHex = cleanHex;
          if (cleanHex.length === 8 && !cleanHex.startsWith('0000')) {
            targetHex = cleanHex.slice(-4);
          }
          readingCurrent = Number((helpers.hexToSignedInt(targetHex) / 100).toFixed(2));
        }
      }
      alertObj.CURRENT = readingCurrent;

      if (ampMax !== null && readingCurrent > ampMax) {
        flag = true;
        message += ` CURRENT=${readingCurrent} > ${ampMax}A`;
      }
      flagCurr = flagCurr || flag;

      flag = ampMin !== null ? readingCurrent < ampMin : false;
      if (flag) {
        message += ` CURRENT=${readingCurrent} < ${ampMin}A`;
      }
      flag = flagCurr || flag;
      break;
    }

    case 'DIFF PRESS': {
      let flagPress = false;
      let readingPressure = readings.pressure;
      if (readingPressure === undefined && hex) {
        const cleanHex = String(hex).trim();
        if (cleanHex.length <= 4) {
          // 2-byte hex (4 chars or less) for Pressure is intermittent noise -> ignore
          return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
        } else if (cleanHex.length === 8) {
          // Check if valid 32-bit IEEE float (direct or word-swapped)
          const hex1 = cleanHex.slice(0, 4);
          const hex2 = cleanHex.slice(4, 8);
          const swappedHex = hex2 + hex1;
          const directFloat = helpers.parseFloat(`0x${cleanHex}`);
          const swappedFloat = helpers.parseFloat(`0x${swappedHex}`);

          let candidateFloat = null;
          if (
            typeof directFloat === 'number' &&
            !isNaN(directFloat) &&
            isFinite(directFloat) &&
            Math.abs(directFloat) >= 0.001 &&
            Math.abs(directFloat) <= 100000
          ) {
            candidateFloat = directFloat;
          } else if (
            typeof swappedFloat === 'number' &&
            !isNaN(swappedFloat) &&
            isFinite(swappedFloat) &&
            Math.abs(swappedFloat) >= 0.001 &&
            Math.abs(swappedFloat) <= 100000
          ) {
            candidateFloat = swappedFloat;
          }

          if (candidateFloat !== null) {
            readingPressure = unitSystem === 'BAR' ? candidateFloat : candidateFloat * 1.0e-5;
          } else {
            // Not a valid 32-bit float -> 2-byte data + CRC noise -> ignore
            return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
          }
        } else {
          let value = parseInt(hex, 16);
          if (value > 0x7fff) {
            value -= 0x10000;
            value = value * 10.0;
          }
          readingPressure = value / 10.0 + offsetPress;
          readingPressure = unitSystem === 'BAR' ? (readingPressure * 1.0e-5).toFixed(2) : readingPressure;
        }
      }
      const calcPressMax = unitSystem === 'BAR' ? (pressMax * 1.0e-5).toFixed(2) : pressMax;
      const calcPressMin = unitSystem === 'BAR' ? (pressMin * 1.0e-5).toFixed(2) : pressMin;

      falseSignal = readingPressure > Number(filterLIMITS.DIFF_PRESSURE_MAX);
      if (falseSignal) {
        return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
      }

      flag = calcPressMax !== null ? readingPressure > calcPressMax : false;
      if (flag) message += ` PRESS=${readingPressure} > ${calcPressMax} ${unitSystem || ''}`;
      flagPress = flagPress || flag;

      flag = calcPressMin !== null ? readingPressure < calcPressMin : false;
      if (flag) message += ` PRESS=${readingPressure} < ${calcPressMin} ${unitSystem || ''}`;
      flag = flag || flagPress;

      alertObj.PRESSURE = readingPressure;
      break;
    }

    case 'AIR PRESSURE': {
      let flagPress = false;
      let readingPressure = readings.pressure;
      if (readingPressure === undefined && hex) {
        const cleanHex = String(hex).trim();
        let parsedVal = null;

        if (cleanHex.length <= 4) {
          // 2-byte hex (4 chars or less) for Pressure is intermittent noise -> ignore
          return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
        } else if (cleanHex.length === 8) {
          // Check if valid 32-bit IEEE float (direct or word-swapped)
          const hex1 = cleanHex.slice(0, 4);
          const hex2 = cleanHex.slice(4, 8);
          const swappedHex = hex2 + hex1;
          const directFloat = helpers.parseFloat(`0x${cleanHex}`);
          const swappedFloat = helpers.parseFloat(`0x${swappedHex}`);

          let candidateFloat = null;
          if (
            typeof directFloat === 'number' &&
            !isNaN(directFloat) &&
            isFinite(directFloat) &&
            Math.abs(directFloat) >= 0.001 &&
            Math.abs(directFloat) <= 100000
          ) {
            candidateFloat = directFloat;
          } else if (
            typeof swappedFloat === 'number' &&
            !isNaN(swappedFloat) &&
            isFinite(swappedFloat) &&
            Math.abs(swappedFloat) >= 0.001 &&
            Math.abs(swappedFloat) <= 100000
          ) {
            candidateFloat = swappedFloat;
          }

          if (candidateFloat !== null) {
            parsedVal = unitSystem === 'BAR' ? candidateFloat : candidateFloat * 1.0e-5;
          } else {
            // 8-character hex that fails float test (e.g. '04181CC4') -> 2-byte int + CRC noise -> ignore
            return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
          }
        } else {
          // Other invalid lengths -> ignore as noise
          return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
        }

        if (parsedVal !== null) {
          readingPressure = Number((parsedVal + offsetPress).toFixed(2));
        }
      }
      const calcPressMax = unitSystem === 'BAR' ? pressMax : (pressMax !== null ? (pressMax * 1.0e-5).toFixed(2) : null);
      const calcPressMin = unitSystem === 'BAR' ? pressMin : (pressMin !== null ? (pressMin * 1.0e-5).toFixed(2) : null);

      falseSignal = readingPressure > Number(filterLIMITS.PRESSURE_MAX);
      if (falseSignal) {
        return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
      }

      flag = calcPressMax !== null ? readingPressure > calcPressMax : false;
      if (flag) message += ` PRESS=${readingPressure} > ${calcPressMax} ${unitSystem || ''}`;
      flagPress = flagPress || flag;

      flag = calcPressMin !== null ? readingPressure < calcPressMin : false;
      if (flag) message += ` PRESS=${readingPressure} < ${calcPressMin} ${unitSystem || ''}`;
      flag = flag || flagPress;

      alertObj.PRESSURE = readingPressure;
      break;
    }

    case 'WISENSOR':
    case 'TEMP & RH': {
      let flagTempRh = false;
      let readingTemp = readings.temperature ?? readings.Temperature;
      let readingRh = readings.humidity ?? readings.Humidity;

      if ((readingTemp === undefined || readingRh === undefined) && hex) {
        // AP Mode hex slice for TEMP & RH
        readingTemp = helpers.hexToSignedInt(hex.slice(4, 8)) / 10;
        readingRh = helpers.hexToSignedInt(hex.slice(0, 4)) / 10;
      } else if (readings.useCtRatio && type === 'WISENSOR') {
        // AP Mode WISENSOR with payload offsets
        readingTemp = Number(readings.Temperature ?? 0);
        readingRh = Number(readings.Humidity ?? 0);
        readingTemp += offsetTemp;
        readingRh = (readingRh + offsetRh) / 10.0;
      } else if (type === 'TEMP & RH' && hex) {
        readingTemp = Number(readingTemp) + offsetTemp;
        readingRh = Number(readingRh) + offsetRh;
      }

      readingTemp = Number(Number(readingTemp).toFixed(2));
      readingRh = Number(Number(readingRh).toFixed(0));

      alertObj.TEMP = readingTemp;
      alertObj.RH = readingRh;

      falseSignal =
        readingTemp > Number(filterLIMITS.TEMPERATURE_MAX) ||
        readingTemp < Number(filterLIMITS.TEMPERATURE_MIN);
      if (falseSignal) {
        return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
      }

      flag = tempMax !== null ? readingTemp > tempMax : false;
      if (flag) message += ` TEMP=${readingTemp} > ${tempMax}C`;
      flagTempRh = flagTempRh || flag;

      flag = tempMin !== null ? readingTemp < tempMin : false;
      if (flag) message += ` TEMP=${readingTemp} < ${tempMin}C`;
      flagTempRh = flagTempRh || flag;

      if (readingRh > 0) {
        flag = rhMax !== null ? readingRh > rhMax : false;
        if (flag) message += ` RH=${readingRh}% > ${rhMax}%`;
        flagTempRh = flagTempRh || flag;

        flag = rhMin !== null ? readingRh < rhMin : false;
        if (flag) message += ` RH=${readingRh}% < ${rhMin}%`;
      }
      flag = flagTempRh || flag;
      break;
    }

    case 'DEW PT.METER': {
      let flagDew = false;
      let readingRh = readings.humidity;
      let readingDew = readings.dew;
      let readingTemp = readings.temperature;

      if (hex) {
        readingRh = helpers.hexToSignedInt(hex.slice(0, 4)) / 10;
        readingDew = helpers.hexToSignedInt(hex.slice(4, 8)) / 10;
        readingTemp = helpers.hexToSignedInt(hex.slice(8, 12)) / 10;
      }

      if (readingRh > 100 || readingDew > 100) {
        return { isAlert: false, isFalseSignal: true, alertObj: null, message: '' };
      }

      alertObj.TEMP = readingTemp;
      alertObj.RH = readingRh;
      alertObj.DEW = readingDew;

      flag = tempMax !== null ? readingTemp > tempMax : false;
      if (flag) message += ` TEMP ${readingTemp} > ${tempMax}C`;
      flagDew = flag || flagDew;

      flag = tempMin !== null ? readingTemp < tempMin : false;
      if (flag) message += ` TEMP ${readingTemp} < ${tempMin}C`;
      flagDew = flag || flagDew;

      flag = rhMax !== null ? readingRh > rhMax : false;
      if (flag) message += ` RH ${readingRh} > ${rhMax}%`;
      flagDew = flag || flagDew;

      flag = rhMin !== null ? readingRh < rhMin : false;
      if (flag) message += ` RH ${readingRh} < ${rhMin}%`;
      flagDew = flag || flagDew;

      flag = dewMax !== null ? readingDew > dewMax : false;
      if (flag) message += ` DEW ${readingDew} > ${dewMax}C`;
      flagDew = flag || flagDew;

      flag = dewMin !== null ? readingDew < dewMin : false;
      if (flag) message += ` DEW ${readingDew} < ${dewMin}C`;

      flag = flag || flagDew;
      break;
    }

    default:
      break;
  }

  if (flag) {
    alertObj.MESSAGE = message;
  }

  return { isAlert: flag, isFalseSignal: false, alertObj, message };
}

module.exports = {
  filterLIMITS,
  evaluateSensorReadings,
};
