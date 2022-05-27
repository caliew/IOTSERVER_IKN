import React, { useState, useEffect, useContext, Fragment } from 'react';
import SensorContext from '../../context/sensor/sensorContext';
import SensorList from './SensorList';
import { MDBTable,MDBTableBody, MDBRow,MDBCard,MDBCol, MDBCardTitle, MDBCardText } from 'mdbreact';

import SparklinePlots from '../data-ui/SparklinePlots';

import Chart from "react-google-charts";
import Thermometer from './Thermometer'

import { 
  CTW_A_TEMP1,CTW_A_TEMP2,CTW_A_FLOWRATE,CTW_A_ELECTPWR, 
  CTW_B_TEMP1,CTW_B_TEMP2,CTW_B_FLOWRATE,CTW_B_ELECTPWR,
  WCPU_A_TEMP1, WCPU_A_TEMP2, WCPU_A_FLOWRATE, WCPU_A_ELECTPWR,
  WCPU_B_TEMP1, WCPU_B_TEMP2, WCPU_B_FLOWRATE, WCPU_B_ELECTPWR,
  AHU_A_TEMP1,AHU_A_TEMP2,AHU_A_FLOWRATE,AHU_A_ELECTPWR,
  AHU_B_TEMP1,AHU_B_TEMP2,AHU_B_FLOWRATE,AHU_B_ELECTPWR, 
  CHILLER_A_CH_TEMP1, CHILLER_A_CH_TEMP2, CHILLER_A_CH_FLOWRATE,
  CHILLER_A_CW_TEMP1, CHILLER_A_CW_TEMP2, CHILLER_A_CW_FLOWRATE,
  CHILLER_B_CH_TEMP1, CHILLER_B_CH_TEMP2, CHILLER_B_CH_FLOWRATE,
  CHILLER_B_CW_TEMP1, CHILLER_B_CW_TEMP2, CHILLER_B_CW_FLOWRATE,
  CHILLER_A_ELECTPWR, CHILLER_B_ELECTPWR
} from '../types';

// https://jpg-svg.com/#
// https://imageresizer.com/transparent-background
// https://picsvg.com/
// https://products.aspose.app/svg/en/image-vectorization/view
// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function AIRCompSysModule({ model, color, systemComponent, handleComponetSelection, title, type }) {
    // -----------
    const [airFlowSensors, setAFSensor] = useState([]);
    const [sensorLabels, setSensorLabels] = useState([]);
    const [airPressData, setAPressData] = useState([]);
		const [plotDatas, setPlotDatas] = useState([]);
		// -------------------------------------------
    const sensorContext = useContext(SensorContext);
    const [showHide, setShowHide] = useState(true);
    const { sensors, getSensors } = sensorContext;
    // --------------
    useEffect(()=>{
        if (sensors === null) getSensors(30,null,null);
        abstactAIRPRESSSensor();
    },[sensors])
    // ---------------------------
    const abstactAIRPRESSSensor = () => {
        if (sensors === null) 
        return;
        // -----------------
        // ABSTRACT WISENSOR
        // -----------------
        let _AFSensors = [];
        let _airpressureDatas = [];
        // -----------------------
        sensors.sort().map( sensor => {
          // --------------------------
          // reading = logsdata.length > 0 ? Number(parseFloat(`0x${logsdata[0].RCV_BYTES[0]}${logsdata[0].RCV_BYTES[1]}`)/100).toFixed(2) + 'bar': 'bar';
          if (sensor.location === 'AIRCOMP' && sensor.type==='WTRPRS(485)') {
            // ------------------------------
            let pressure = sensor.logsdata.length > 0 ? Number(parseFloat(`0x${sensor.logsdata[0].RCV_BYTES[0]}${sensor.logsdata[0].RCV_BYTES[1]}`)/100).toFixed(2) : 0;
            pressure = Number(Number(pressure).toFixed(2));
            // -------
            _AFSensors.push(sensor);
            let _objSensor = {
              sensor : sensor,
              name : sensor.name,
              unit :'bar',
              pressure : pressure
            }
            sensor.logsdata[0] && _airpressureDatas.push(_objSensor);
            // -------------------
          }
        })
        // --------------------
        setAFSensor(_AFSensors.sort(compareByName));
        setAPressData(_airpressureDatas);
        // -------------------------
    }
    // --------------
    const componentNames = {
        sysCHILLER : 'CHILLER',
        sysAHU : 'AHU',
        sysWCPU : 'WCPU',
        sysCTW : "CTW",
        pumpCHILLER : "CH PUMP",
        pumpCTW : "CTW PUMP",
        pumpAHU : "AHU PUMP"
    }
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // width="645" height="459" viewBox="0 0 645 459"
    // --------------------------------------------
    return (

			<MDBRow center>

				<MDBCard className="p-3 m-2"style={{ width: "40rem" }}>
					<MDBCardTitle>AIR COMPRESSOR</MDBCardTitle>
					<MDBTable striped small>
						<MDBTableBody>
						{
								airFlowSensors && airFlowSensors.sort().map( (sensor,index) => { return (<SensorList sensor={sensor} index={index} />)})
						}
						</MDBTableBody>
					</MDBTable>
				</MDBCard>

				<MDBCard className="p-4 m-2" style={{ width: "40rem" }}>
          { showHide && getDialGauge( { 
              title : 'PRESSURE',
              data : airPressData, 
              redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}            
				</MDBCard>

			</MDBRow>
    )
}
// ---------
function compareByName(a, b) {
  var nameA = a.name.toUpperCase(); // ignore upper and lowercase
  var nameB = b.name.toUpperCase(); // ignore upper and lowercase
  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }
  // names must be equal
  return 0;
}
// -------------
// GET SVG MODEL
// -------------
const getDialGauge = ({data}) => {
  return (
    <MDBRow>
      {/* <div className="d-flex row p-4 justify-content-center"> */}
      {
        data.sort().map( (sensor,index) => {
          let _gauge = [];
          let _data = [sensor.unit,sensor.pressure];
          _gauge.push(['Label', 'Value'])
					_gauge.push(_data);
          return(
            <MDBCol md="3">
              {/* <div className="d-flex flex-column px-4 align-items-center " > */}
                <Chart width={120} height={120} chartType="Gauge"
                                loader={<div>Loading Chart</div>}
                                data={_gauge}
                                options={{
                                redFrom: 9,
                                redTo: 10,
                                yellowFrom: 7,
                                yellowTo: 9,
                                max:10,
                                min:0,
                                minorTicks: 5,}}
                                rootProps={{ 'data-testid': '1' }} />
                  <h6>{sensor.name}</h6>
              {/* </div> */}
            </MDBCol>
          )
        })
      }
      {/* </div> */}
    </MDBRow>

  )
}
// ------------
function parseFloat(str) {
  var float = 0, sign, order, mantissa, exp,
  int = 0, multi = 1;
  if (/^0x/.exec(str)) {
      int = parseInt(str, 16);
  }
  else {
      for (var i = str.length -1; i >=0; i -= 1) {
          if (str.charCodeAt(i) > 255) {
              console.log('Wrong string parameter');
              return false;
          }
          int += str.charCodeAt(i) * multi;
          multi *= 256;
      }
  }
  sign = (int >>> 31) ? -1 : 1;
  exp = (int >>> 23 & 0xff) - 127;
  mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
  for (i=0; i<mantissa.length; i+=1) {
      float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
      exp--;
  }
  return float*sign;
}
function getDatas(sensor) {
  // console.log(sensor.logsdata);
  let datas = [];
  let VelData = [];
  let PressData = [];
  let rmsVel = 0;
  let maxVel = -999;
  let minVel = 999;
  let maxVelDateTime;
  let minVelDateTime;
  // -----------------
  sensor.logsdata.map( (data,index) => {
    let _Date = new Date(data.TIMESTAMP);
    let _timeLabel = _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"});
    // -------------------------------------------------
		let velocity = Number(data.DATAS[0])/10.0;
    let pressure = Number(parseFloat(`0x${data.RCV_BYTES[0]}${data.RCV_BYTES[1]}`).toFixed(2)/100.0);
		// -------------------
    if (velocity > maxVel) {
      maxVel = velocity;
      maxVelDateTime = _timeLabel;
    }
    // -------------------------
    if (velocity < minVel) {
      minVel = velocity;
      minVelDateTime = _timeLabel;
    }
    // ----------------------------------------------
    VelData.push({y:velocity,x:_timeLabel}); 
    PressData.push({y:pressure,x:_timeLabel}); 
  })
  // -------------
  // datas.push(VelData)
  datas.push(PressData)
  // ----------------
  return { datas,maxVelDateTime,minVelDateTime,maxVel,minVel,rmsVel };
}
//  -----------
// Set default props
AIRCompSysModule.defaultProps = {
  color: "black",
  handleComponetSelection: null,
  title:'PRODUCTION FLOOR PLAN'
};
export default AIRCompSysModule