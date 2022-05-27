import React, { useState, useEffect, useContext } from 'react'
import SensorContext from '../../context/sensor/sensorContext';

import { ScrollBoard } from '@jiaminghi/data-view-react'
import './ScrollBoard.less'

export default () => {
  // ---------------------
  // ACCESS SENSOR CONTEXT
  // ---------------------
  const sensorContext = useContext(SensorContext);
  const { sensors, locationSensorsMap, filtered, getSensors, loading, } = sensorContext;
  // --------------
  // USE STATE HOOK
  // --------------
  const [config, setData] = useState([]);

  // ---------------
  // GET SENSOR DATA
  // ---------------
  function getSensorData (sensor) {
    let _sensorIcon;
    let _sensorReading;
    let _highlight;
    // -----------------
    const { name, dtuId, sensorId, type, ratingMax, ratingMin, variables, logsdata } = sensor;
    let _lastDataReading = logsdata.length > 0 ? logsdata[0] : null;
    let _Date = _lastDataReading !== null ? new Date(_lastDataReading.TIMESTAMP) : null;
    let _timeLabel = _lastDataReading !== null ? _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"}) : 'ŃO DATA AVAILABLE';
    // --------------
    // let lastDataReading = logsdata.length > 0 ? logsdata[0] : null;
    // let _Date = lastDataReading !== null ? new Date(lastDataReading.TIMESTAMP) : null;
    // let _timeDiff = (new Date() - _Date) / 1000 / 60 / 60;
    let _sensorId = dtuId !== '-1' ? `${dtuId}_${sensorId}` : `${sensorId}`;
    // -------------
    switch (type) {
      case "WISENSOR" :
        _sensorIcon = "./icons/humidity.png";
        _sensorReading = _lastDataReading ? `${_lastDataReading.Temperature}C ${_lastDataReading.Humidity}%` : null;
        break;
      case "AIRFLW(485)":
        // -- 485 AIRFLOW SENSOR -
        _sensorIcon = "./icons/air-transmission.png";
        _sensorReading = _lastDataReading ? `${_lastDataReading.DATAS[0] / 10.0} m/s ${_lastDataReading.DATAS[1]}m3/hr` : null;
        break;
      case "AIRRH(485)":
        // -- 485 AIRFLOW RH SENSOR --
        _sensorIcon = "./icons/cooler.png";
        _sensorReading = _lastDataReading ? `${_lastDataReading.DATAS[0]/10.0}% ${_lastDataReading.DATAS[1] / 10.0}C` : null;
        break;
      case "RH(485)":
        // -- 485 RH SENSOR --
        _sensorIcon = "../../icons/temperature-control.png";
        _sensorReading = _lastDataReading ? `${Number(_lastDataReading.DATAS[0] / 10.0) }% ${Number(_lastDataReading.DATAS[1] / 10.0)}C` : null;
        break;
      case "WTRTEMP(485)":
        // -- 485 ANALOG DIGITAL CONVERTOR --
        _sensorIcon = "./icons/pipe-temperature.png";
        _sensorReading = _lastDataReading ? `|${_lastDataReading.DATAS[0] / 10.0 }|${_lastDataReading.DATAS[1] / 10.0}` : null;
        break;
      case "WTRPRS(485)":
        // -- 485 ANALOG DIGITAL CONVERTOR --
        _sensorIcon = "./icons/pipe-pressure.png";
        _sensorReading = _lastDataReading  ? `|${_lastDataReading.DATAS[0] / 10.0 }|${_lastDataReading.DATAS[1] / 10.0}` : null;
        break;
      case "ADC CONVERTOR (485)":
        // -- 485 ANALOG DIGITAL CONVERTOR --
        _sensorIcon = "./icons/switch.png";
        _sensorReading = _lastDataReading ? `|${_lastDataReading.DATAS[0] / 10.0}|${_lastDataReading.DATAS[1] / 10.0}` : null;
        break;
      case "WTRLEAK(485)":
        let state = _lastDataReading ? Number(_lastDataReading.DATAS[0]) : 0;
        _sensorIcon = "./icons/leak.png";
        if (state == 2) 
          _sensorReading = `${state}.. WATER DETECTED` //${_lastDataReading.RCV_BYTES}`
        else 
          _sensorReading = `${state}.. NO WATER DETECTED` // ${_lastDataReading.RCV_BYTES}`;
        break;
      case "PWRMTR(485)":
        // -- 485 POWER METER --
        let factor;
        let PConsumption, IA, IB, IC;
        let P, Q, S, PF, F;
        let PA, PB, PC, UA, UB, UC;
        PConsumption = _lastDataReading !== null ? (_lastDataReading.DATAS1[1] / 100).toFixed(2) : 0.0;
        if (ratingMax && ratingMin) 
          factor = ratingMax/ratingMin;
        // ----------------------------
        IA = _lastDataReading !== null ? _lastDataReading.DATAS2[3] * 100 + _lastDataReading.DATAS2[4] : 0.0;
        IB = _lastDataReading !== null ? _lastDataReading.DATAS2[5] * 100 + _lastDataReading.DATAS2[6] : 0.0;
        IC = _lastDataReading !== null ? _lastDataReading.DATAS2[7] * 100 + _lastDataReading.DATAS2[8] : 0.0;
        IA = _lastDataReading !== null ? ((IA / 1000) * factor).toFixed(2) : 0.0;
        IB = _lastDataReading !== null ? ((IB / 1000) * factor).toFixed(2) : 0.0;
        IC = _lastDataReading !== null ? ((IC / 1000) * factor).toFixed(2) : 0.0;
        F  = _lastDataReading !== null ? _lastDataReading.DATAS2[16] : 0.0;
        UA = _lastDataReading !== null ? _lastDataReading.DATAS2[0] / 10.0 : 0.0;
        UB = _lastDataReading !== null ? _lastDataReading.DATAS2[1] / 10.0 : 0.0;
        UC = _lastDataReading !== null ? _lastDataReading.DATAS2[2] / 10.0 : 0.0;
        // -------------
        _sensorIcon = "./icons/electric-meter.png";
        _sensorReading = `ACT.E=${PConsumption}kWh FREQ=${F/100.0}Hz UA=${UA}V IA=${IA}A UB=${UB}V IB=${IB}A UC=${UC}V IC=${IC}A`;
        _highlight = UA > parseFloat(sensor.upperlimit1) || UC > parseFloat(sensor.upperlimit1) || UC > parseFloat(sensor.upperlimit1) ? true : false;
        _highlight = IA > parseFloat(sensor.upperlimit2) || IB > parseFloat(sensor.upperlimit2) || IC > parseFloat(sensor.upperlimit2) ? true : _highlight;
        break;
      default:
        console.log(`..[APP.JS].. UNKNOWN SENSOR TYPE <${sensor.sensortype}>`)
        break;
    }
    // -------
    return { _timeLabel, _sensorReading, dtuId, _sensorId, name };
  };
  // ---------------
  function createData() {
    if (sensors == null)
      return;
    // -----------'
    let data = [];
    // -------------------
    sensors.map(sensor => {
      // -----------------
      const { _timeLabel, name, _sensorReading, _sensorId } = getSensorData(sensor);
      let ObjData = [];
      ObjData.push(_timeLabel);
      ObjData.push(_sensorId);
      ObjData.push(name);
      ObjData.push(_sensorReading);
      data.push(ObjData);
    })   
    // ------------
    const config = {
      header: ['TIME', 'SENSOR NAME', 'SENSOR ID', 'READING'],
      data: data,
      index: true,
      columnWidth: [30, 30, 50, 100],
      align: ['center'],
      rowNum: 7,
      headerBGC: '#1981f6',
      headerHeight: 45,
      oddRowBGC: 'rgba(0, 44, 81, 0.8)',
      evenRowBGC: 'rgba(10, 29, 50, 0.8)',
    }
    // ------------    
    setData(config);
    // -------------
  }
  // ----------
  useEffect(()=>{
    // ----------
    createData();
    // ----------
  },[]) 
  // -----------
  return (
    <div id="scroll-board">
      <ScrollBoard config={config} style={{width: '100%', height: '100%', lineHeight:'2rem'}} />
    </div>
  )
}
