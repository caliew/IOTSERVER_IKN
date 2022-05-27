import React, { useContext,useState,useEffect,useRef } from 'react';
import { CSVDownload,CSVLink } from 'react-csv';
import { saveAs } from 'file-saver';
import axios from 'axios';
import Spinner from '../layout/Spinner';
import SensorContext from '../../context/sensor/sensorContext';
import AlertContext from '../../context/alert/alertContext';
import { MDBCard,MDBBtn, MDBTable, MDBTableBody, MDBTableHead } from 'mdbreact';

import SparklinePlots from '../data-ui/SparklinePlots';
import HeatMap from './Heatmap';

// ----------------------
const ReportPage = () => {
	//	-----------------
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const linkRef = useRef();
  // -----------
  const [wiSensors, setWiSensor] = useState([]);
  const [reportSensors, setReportSensors] = useState([]);
  const [sensorStatsData, setSensorStats] = useState([]);
  const [fileName, setFileName] = useState('Clue_Mediator_Report_Async.csv');
  const [headers,setHeaders] = useState([]);
  const [reportData,setReportData] = useState([]);
  const sensorContext = useContext(SensorContext);
  const {sensors, DownLoadData, AbstractSensorStats,  getSensors } = sensorContext;
  // --------------
  const csvReport = {
    data: reportData,
    headers: headers,
    filename: fileName
  };
  // ---------
  useEffect(()=>{
    // ---------------
    if (sensors === null) getSensors(30,null,null);
    // ---------------
    abstactWiSensor();
    // ---------------
  },[sensors])
  // ---------------------------
  const abstactWiSensor = () => {
      if (sensors === null) 
      return;
      // -----------------
      // ABSTRACT WISENSOR
      // -----------------
      let _sLabels = [];
      let _wiSensors = [];
      let _sensorIDs = [];
      let _tempDatas = [];
      let _humdDatas = [];
      // -----------------
      sensors.map( sensor => {
        if (sensor.type === 'WISENSOR') {
            _wiSensors.push(sensor);
            _sensorIDs.push(`${sensor._id}`)
            _sLabels.push(sensor.name);
            sensor.logsdata[0] && _tempDatas.push(Number(sensor.logsdata[0].Temperature));
            sensor.logsdata[0] && _humdDatas.push(['HUMD',Number(sensor.logsdata[0].Humidity)]);
        }
        return null;
      })
      // ---------------------
      setWiSensor(_wiSensors);
      setReportSensors(_sensorIDs);
      abstractSensorsStats(_wiSensors);
      // --------------------
  }
  const abstractSensorsStats = (_wiSensors) => {
    // ---------
    let sensorsArr = [];
    _wiSensors.map( _sensor => {
      sensorsArr.push(_sensor);
    })
		// ----------------------------------------------
    AbstractSensorStats(sensorsArr,callbackSensorStats);
    // -------------------
  }
	const callbackSensorStats = (data) => {
		// -----------------
		let SensorStatsObj = {};
    // ---------------
		data && data.forEach( _sensor => {
      if (_sensor.length > 0) {
        const _key = `${_sensor[0].dtuId}_${_sensor[0].sensorId}`;
        SensorStatsObj[_key] = _sensor[0].statsdata
      }
		})
		// -------------------------
		setSensorStats(SensorStatsObj);
		// ---------------
	}
  // ------------------
	const HandleDownload = (strLabel) => {
		// --------------------------
		setAlert(`...DOWNLOAD..>>>> SENSOR ID=${strLabel}..`, 'primary');
		setFileName(`${strLabel}.csv`);
		// -----------------------------------
		const logsdata = DownLoadData(strLabel);
		// -------------------
		const _reportData = [];
		const _reportHeader = [{label:'DATE',key:'date'},{label:'time',key:'time'},{label:'modelID',key:'modelID'},
					{label:'Temperature',key:'Temperature'},{label:'Humidity',key:'Humidity'}];
		setHeaders(_reportHeader)
		for (let i=0; i< logsdata.length; i++) {
			const {modelID,modelType,TIMESTAMP,Temperature,Humidity}  = logsdata[i];
			const _date = new Date(TIMESTAMP);
			let data = { date:_date.toLocaleDateString(), time:`${_date.toLocaleDateString()} ${_date.toLocaleTimeString()}`,
						modelID:modelID,Temperature,Humidity}
			_reportData.push(data);
		}
		setReportData(_reportData);
	}
  const createAndDownloadPdf = () => {
    let sensorsState = {
      name : '',
      receiptId : 0,
      price1 : 0,
      price2 : 0,
      reportSensors : reportSensors
    }
    console.log('.. AXIOS APIS.... /CREATE-PDF')
    try {
      axios.post('/create-pdf',sensorsState)
        .then(() => axios.get('/fetch-pdf', {responseType:'blob'}))
        .then((res) => {
          console.log('.. AXIOS APIS.... /FETCH-PDF');
          const pdfBlob = new Blob([res.data],{type:'application/pdf'});
          saveAs(pdfBlob,'Report.pdf');
        })
    }
    catch {
    }
  }
  // ------
  const DownloadPdfNOV = () => {
    console.log('..AXIOS APIS.... /FETCH-PDF-NOV');
    try {
      axios.get('/fetch-pdf-NOV2021', {responseType:'blob'}).then((res)=>{
        const pdfBlob = new Blob([res.data],{type:'application/pdf'});
        saveAs(pdfBlob,'NOV2021-Report.pdf');
      })
    } catch{

    }
  }
  const DownloadPdfDEC = () => {
    console.log('..AXIOS APIS.... /FETCH-PDF-DEC');
    try {
      axios.get('/fetch-pdf-DEC2021', {responseType:'blob'}).then((res)=>{
        const pdfBlob = new Blob([res.data],{type:'application/pdf'});
        saveAs(pdfBlob,'DEC2021-Report.pdf');
      })
    } catch{

    }
  }
  const DownloadPdfJAN = () => {
    console.log('..AXIOS APIS.... /FETCH-PDF-JAN');
    try {
      axios.get('/fetch-pdf-JAN2022', {responseType:'blob'}).then((res)=>{
        const pdfBlob = new Blob([res.data],{type:'application/pdf'});
        saveAs(pdfBlob,'JAN2022-Report.pdf');
      })
    } catch{

    }
  }
  const DownloadPdfFEB = () => {
    console.log('..AXIOS APIS.... /FETCH-PDF-FEB');
    try {
      axios.get('/fetch-pdf-FEB2022', {responseType:'blob'}).then((res)=>{
        const pdfBlob = new Blob([res.data],{type:'application/pdf'});
        saveAs(pdfBlob,'FEB2022-Report.pdf');
      })
    } catch{

    }
  }
  // ---------------------------
  return(
    <main style={{ marginTop: '2rem' }}>
      <MDBBtn onClick={()=>DownloadPdfNOV()}>NOV 2021 REPORT</MDBBtn>
      <MDBBtn onClick={()=>DownloadPdfDEC()}>DEC 2021 REPORT</MDBBtn>
      <MDBBtn onClick={()=>DownloadPdfJAN()}>JAN 2022 REPORT</MDBBtn>
      <MDBBtn onClick={()=>DownloadPdfFEB()}>FEB 2022 REPORT</MDBBtn>
      <div className="d-flex flex-row justify-content-center flex-wrap" >
      {
        wiSensors.length === 0 ? <Spinner /> : wiSensors.map((sensor,index) => {
          // -----
          let { datas } = getDatas(sensor);
          // -----
          return (
            <MDBCard className='p-2 m-2 align-items-center justify-content-center' center style={{width:'550px'}}>
              { getTableSensorInfo(sensor) }
              { getTableSensorData(sensor) }
              <div className="d-flex flex-row justify-content-center flex-wrap" >
                <SparklinePlots systemComponent={sensor.logsdata} sensorData={datas[0]} limits={sensor.limits} dataName='TEMPERATURE'/>
                {
                  datas[1][0] && datas[1][0].y > -999 && <SparklinePlots systemComponent = {sensor.logsdata} sensorData={datas[1]} dataName='HUMIDITY' />
                }
              </div>
              {/* <HeatMapLegend/> */}
              <div className="d-flex flex-column justify-content-center" >
                <div className="d-flex flex-row align-items-baseline justify-content-center flex-wrap">
                  {/* { sensorStatsData[keySensorStat] && <HeatMap title="MIN-TEMP" sensorData={sensorStatsData[keySensorStat]} index='0'/> } */}
                  {/* { sensorStatsData[keySensorStat] && <HeatMap title="MAX-TEMP" sensorData={sensorStatsData[keySensorStat]} index='1'/> } */}
                </div>
                <div>
                  <MDBBtn color="white" size="lg" onClick={()=>HandleDownload(`${sensor.sensorId}`)}>
                    <CSVLink {...csvReport} ref={linkRef}>Export HISTORIES DATA TO CSV</CSVLink>
                  </MDBBtn>
                </div>
              </div>
            </MDBCard>
          )
        })
      }
      </div>
      </main>
  )
}
// ------------
const getTableSensorInfo = (sensor) => (
  <MDBTable small striped style={{width:'auto'}}>
    <MDBTableHead >
      <tr >
        <th>SENSOR NAME</th>
        <th>SENSOR ID</th>
        <th>LOCATION</th>
        <th>LAST READING</th>
      </tr>
    </MDBTableHead>
    <MDBTableBody>
      <tr >
        <td >{sensor.name}</td>
        <td >{sensor.sensorId}</td>
        <td >{sensor.location}</td>
        <td >{ sensor.logsdata && sensor.logsdata.length > 0 ? getDateTimeLabel(sensor.logsdata[0].TIMESTAMP) : null }</td>
      </tr>
    </MDBTableBody>
  </MDBTable>)
// ----------
const getTableSensorData = (sensor) => {
  let { datas,maxTempDateTime,minTempDateTime,maxHumdDateTime,minHumdDateTime,
        maxHumd,minHumd,maxTemp,minTemp,rmsTemp } = getDatas(sensor);
  return (
  <MDBTable small striped style={{width:'auto'}}>
    <MDBTableHead >
      <tr >
        <th>VARIABLES</th>
        <th>RMS</th>
        <th>MAX</th>
        <th>DATETIME</th>
        <th>MIN</th>
        <th>DATETIME</th>
      </tr>
    </MDBTableHead>              
    <MDBTableBody>
      <tr>
        <td >TEMPERATURE</td>
        <td >{ sensor.logsdata && sensor.logsdata.length > 0 ? sensor.logsdata[0].Temperature : null}C</td>
        <td >{maxTemp}</td>
        <td >{maxTempDateTime}</td>
        <td >{minTemp}</td>
        <td >{minTempDateTime}</td>
      </tr>
      { datas[1][0] && datas[1][0].y && datas[1][0].y > -999 && getHUMDDATA(sensor) }
    </MDBTableBody>
  </MDBTable>)
}
// --------------------
function getHUMDDATA(sensor){
  let { datas,maxTempDateTime,minTempDateTime,maxHumdDateTime,minHumdDateTime,
    maxHumd,minHumd,maxTemp,minTemp,rmsTemp } = getDatas(sensor);
  return (
    <tr>
      <td >HUMIDITY</td>
      <td >{ sensor.logsdata && sensor.logsdata.length > 0 ? sensor.logsdata[0].Humidity : null} %</td>
      <td >{maxHumd}</td>
      <td >{maxHumdDateTime}</td>
      <td >{minHumd}</td>
      <td >{minHumdDateTime}</td>
    </tr>      
  )
}
// -------------
// Data Download
// -------------

// ------------
function getDatas(sensor) {
  // console.log(sensor.logsdata);
  let datas = [];
  let TempData = [];
  let HumdData = [];
  let maxTemp = -999;
  let maxHumd = -999;
  let maxTempDateTime;
  let maxHumdDateTime;
  let minTempDateTime;
  let minHumdDateTime;
  let rmsTemp = 0;
  let minTemp = 999;
  let minHumd = 999;
  sensor.logsdata.map( (data,index) => {
    let _Date = new Date(data.TIMESTAMP);
    let _timeLabel = _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"});
    // -------------------------------------------------
    if (data.Temperature > maxTemp) {
      maxTemp = data.Temperature;
      maxTempDateTime = _timeLabel;
    }
    if (data.Humidity > maxHumd) {
      maxHumd = data.Humidity;
      maxHumdDateTime = _timeLabel;
    }
    // -------------------------
    if (data.Temperature < minTemp) {
      minTemp = data.Temperature;
      minTempDateTime = _timeLabel;
    }
    if (data.Humidity < minHumd) {
      minHumd = data.Humidity;
      minHumdDateTime = _timeLabel;
    }
    // ----------------------------------------------
    TempData.push({y:data.Temperature,x:_timeLabel});
    HumdData.push({y:data.Humidity,x:_timeLabel})    
  })
  datas.push(TempData)
  datas.push(HumdData)
  return { datas,maxTempDateTime,minTempDateTime,maxHumdDateTime,minHumdDateTime,
           maxTemp,maxHumd,minTemp,minHumd,rmsTemp };
}
function getDateTimeLabel (DateTime) {
  let _Date = new Date(DateTime);
  let _timeLabel = _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"});
  return _timeLabel;
}
// ----------------------
export default ReportPage