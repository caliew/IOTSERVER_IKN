import React, { useEffect,useState } from 'react';
import { MDBBtn, MDBDataTable } from 'mdbreact';
import axios from 'axios';

const Test = () => {
  // ---------------
  const [rawdata,setData] = useState(null);
  // ------------
	useEffect(()=> {
    // ------------
    RELOADRAWDARA();
	},[])
  // ---------------
  const RELOADRAWDARA = () => {
    try {
      // --------------------------------
      axios.get('/api/sensors/rawsensordata', { } ).then (res => {
        console.log('....GET API/SENSORS/RAWSENSORDATA....')
        let DataMap = [];
        if (res.data) {
          Object.keys(res.data).forEach(key => {
            let _data = res.data[key];
            DataMap.push(_data)
          })
        }
        DataMap.sort(function(a,b) { 
          return a.DTUID - b.DTUID
        });
        setData(DataMap);
        // ----------------
      }).then( res => {
        // --------------    
        // getSensorsData();
        // --------------
      }).catch ( err => {
      })
    } catch (err) {
    }
    // ---------
  }
  function byteArray(dataArr) {
    let strTEXT ="";
    dataArr && dataArr.forEach((_byte,index) => {
      strTEXT += _byte + " ";
    })
    return strTEXT;
  }
  // ------
  function hexToSignedInt(hex) {
    if (hex.length % 2 !== 0) {
      hex = "0" + hex;
    }
    var num = parseInt(hex, 16);
    var maxVal = Math.pow(2, (hex.length / 2) * 8);
    if (num > maxVal / 2 - 1) {
      num = num - maxVal;
    }
    return num;
  }
  // -----------------
  const getRows = () => {
    // --------------
    let DataArr = [];
    let activeSensors = {};
    // --------------------
    rawdata && rawdata.forEach((_sensor,index) => {
      let _dataArr = _sensor.sensorDataArr;
      let _key = `${_sensor.DTUID}_${_sensor.SENSORID}`;
      let Obj = { date:_sensor.DATESTAMP,time:_sensor.TIMESTAMP,dtuid:_sensor.DTUID,sensorid:_sensor.SENSORID,
        sensortype:_sensor.SENSORTYPE,energy:'-',voltage:'-',current:'-',power:'-',
        pressure:'-',temperature:'-',humidity:'-',velocity:'-' };
      // ---------------------------------------
      if (activeSensors.hasOwnProperty(_key)) Obj = activeSensors[_key];
      // ------- 
      switch(_sensor.SENSORTYPE) {
        case "WATER-PRES":
          Obj["pressure"]=`${Number(byteArray(_sensor.sensorDataFloatArr)).toFixed(2)} psi`;
          break;
        case "WATER-TEMP":
          Obj["temperature"]=`${(Number(_dataArr[1])/10).toFixed(2)} C`;
          break;
        case 'AIR-PRES':
          Obj["pressure"]=`${Number(byteArray(_sensor.sensorDataFloatArr)).toFixed(2)} psi`;
          break;
        case "AIRFLOW-VEL":
          Obj["velocity"]=`${Number(_dataArr[0])/10.0} m/s`;
          break;
        case "AIRFLOW-TEMP":
          Obj["temperature"]=`${(Number(_dataArr[1])/10).toFixed(2)} C`;
          Obj["humidity"]=`${(Number(_dataArr[0])/10).toFixed(2)} %`;
          break;
        case "PWR-METER-POWER":
          Obj["sensortype"]='POWER METER';
          Obj["energy"]=`${(Number(byteArray(_sensor.sensorDataIntArr))*0.01).toFixed(2)} kWh`;
          break;
        case 'PWR-METER-STATE':
          let bytesData = _sensor.RCV_BYTES;
          Obj["sensortype"]='POWER METER';
          Obj["voltage"]=`A=${(_dataArr[0]*0.1).toFixed(0)} B=${(_dataArr[1]*0.1).toFixed(0)} C=${(_dataArr[2]*0.1).toFixed(0)}`;
          Obj["current"]=`A=${(hexToSignedInt(bytesData[3]+bytesData[4])*0.001).toFixed(2)} B=${(hexToSignedInt(bytesData[5]+bytesData[6])*0.001).toFixed(2)} C=${(hexToSignedInt(bytesData[7]+bytesData[8])*0.001).toFixed(2)}`;
          Obj["power"]= `P=${(hexToSignedInt(bytesData[9]+bytesData[10])).toFixed(0)}W Q=${(hexToSignedInt(bytesData[11]+bytesData[12])).toFixed(0)}var S=${(hexToSignedInt(bytesData[13]+bytesData[14])).toFixed(0)}VA`
          Obj["powerfactor"]=`${(_dataArr[15]*0.0001).toFixed(2)}`;
          Obj["frequency"]=`${(_dataArr[16]*0.01).toFixed(0)}Hz`;
          // strREADING += `PF=<${(_dataArr[15]*0.0001).toFixed(2)}>\r\n`
          // strREADING += `F=<${(_dataArr[16]*0.01).toFixed(0)}Hz>\r\n`
          break;
        default:
          break;
      }
      activeSensors[`${_key}`] = Obj
      // ----------
    })
    // ---------
    activeSensors && Object.keys(activeSensors) && Object.keys(activeSensors).forEach( (_key,index) => {
      DataArr.push(activeSensors[_key]);
    })
    // -------------------
    return DataArr;
  };
  // -------
  const data = {
    columns: [
      { label: 'DATE', field: 'date', sort: 'asc', width: 10 },
      { label: 'TIME', field: 'time', sort: 'asc', width: 10 },
      { label: 'DTU ID', field: 'dtuid', sort: 'asc', width: 10 },
      { label: 'SNSR ID', field: 'sensorid', sort: 'asc', width: 10 },
      { label: 'TYPE', field: 'sensortype', sort: 'asc', width: 100 },
      { label: 'TEMP(C)', field: 'temperature', sort: 'asc', width: 30 },
      { label: 'HUM(%)', field: 'humidity', sort: 'asc', width: 30 },
      { label: 'PRESS(psi)', field: 'pressure', sort: 'asc', width: 30 },
      { label: 'VEL(m/s)', field: 'velocity', sort: 'asc', width: 30 },
      { label: 'ELECT.E(kWh)', field: 'energy', sort: 'asc', width: 30 },
      { label: 'VOLTAGE(V)', field: 'voltage', sort: 'asc', width: 100 },
      { label: 'CURRENT(A)', field: 'current', sort: 'asc', width: 100 },
      { label: 'ELECT.P', field: 'power', sort: 'asc', width: 100 },
      { label: 'PWR.F', field: 'powerfactor', sort: 'asc', width: 10 },
      { label: 'FREQ(Hz)', field: 'frequency', sort: 'asc', width: 10 }
    ],
    rows: getRows()
  };
  // -------------------  
	return (
    <main style={{ marginTop: '2rem' }}>
      <div class="container-fluid mt-5">
      <MDBBtn onClick={()=>RELOADRAWDARA()}>RELOAD DATA</MDBBtn>     
      <MDBDataTable 
        entriesOptions={[10, 20, 50, 100]}
        small
        entries={10}
        pagesAmount={10}
        striped
        responsive
        autoWidth 
        bordered
        materialSearch 
        data={data}/>
      </div>
		</main>
	)
}

export default Test
