import React, { useState, useEffect, useContext, Fragment } from 'react';
import SensorContext from '../../context/sensor/sensorContext';
import SensorList from './SensorList';
import { MDBTable,MDBTableBody,MDBRow,MDBCard,MDBCol, MDBCardTitle, MDBCardText } from 'mdbreact';

import SparklinePlots from '../data-ui/SparklinePlots';

import Chart from "react-google-charts";
import Thermometer from './Thermometer';
import TDKFloorPlan from './TDKFloorPlan';

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

function PIPEWTRTempSysModule ({ model, color, systemComponent, handleComponetSelection, title, type }) {
    // -----------
    const [airFlowSensors, setAFSensor] = useState([]);
    const [sensorLabels, setSensorLabels] = useState([]);
    const [airFlowData, setAFlowData] = useState([]);
    const [toggleListing,setToggleListing] = useState(true);
    const [toggleGauge,setToggleGauge] = useState(true);
    const [toggleSparkline,setToggleSparkline] = useState(false);
		// --------------------------
    const sensorContext = useContext(SensorContext);
    const { sensors, getSensors } = sensorContext;
    // --------------
    useEffect(()=>{
      // ---------------------
        if (sensors === null) getSensors(30,null,null);
        abstactAIRFLOWSensor();
        // ---------------------
    },[sensors])
    // ---------------------------
    const abstactAIRFLOWSensor = () => {
        if (sensors === null) 
        return;
        // -----------------
        // ABSTRACT WISENSOR
        // -----------------
        let _AFSensors = [];
        let _sLabels = [];
				let _plotDatas = [];
        let _airflowDatas = [];
        // -------------------
        sensors.map( sensor => {
					if (sensor.type === "WTRTEMP(485)") {
						let { datas } = getDatas(sensor);
						_AFSensors.push(sensor);
						_sLabels.push(sensor.name);
						_plotDatas.push(datas);
            let _dataObj = {
              name : sensor.name,
              temperature : sensor.logsdata[0] ? Number(sensor.logsdata[0].DATAS[1])/10.0 : 0.0
            }
						sensor.logsdata[0] && _airflowDatas.push(_dataObj);
					}
        })
        // --------------------
        setAFSensor(_AFSensors.sort(compareByName));
        setSensorLabels(_sLabels);
        setAFlowData(_airflowDatas.sort(compareByName));
    }
    // ----
    function ToggleListing(title) {
      return (
        <div className='custom-control custom-switch'>
          <input
            type='checkbox'
            className='custom-control-input'
            id='customSwitchesListing'
            checked={toggleListing}
            onChange={()=>setToggleListing(!toggleListing)}
          />
          <label className='custom-control-label' htmlFor='customSwitchesListing'>
            <h5>{title} (LISTING)</h5>
          </label>
        </div>  
      )
    }
    function ToggleGauges(title) {
      return (
        <div className='custom-control custom-switch'>
          <input
            type='checkbox'
            className='custom-control-input'
            id='customSwitchesGauges'
            checked={toggleGauge}
            onChange={()=>setToggleGauge(!toggleGauge)}
          />
          <label className='custom-control-label' htmlFor='customSwitchesGauges'>
            <h5>{title} (GAUGE)</h5>
          </label>
        </div>  
      )
    }
    function ToggleSparkline(title) {
      return (
        <div className='custom-control custom-switch'>
          <input
            type='checkbox'
            className='custom-control-input'
            id='customSwitchesSparkline'
            checked={toggleSparkline}
            onChange={()=>setToggleSparkline(!toggleSparkline)}
          />
          <label className='custom-control-label' htmlFor='customSwitchesSparkline'>
            <h5>SHOW SPARKLINE</h5>
          </label>
        </div>  
      )
    }    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // width="645" height="459" viewBox="0 0 645 459"
    // --------------------------------------------
    return (
			<MDBRow center>
				<MDBCard className="p-4 m-2" style={{ width: "40rem" }}>
				  <div className='d-flex'>
            {ToggleListing('WATER PIPE TEMP.')}&nbsp;&nbsp;&nbsp;
            {ToggleSparkline('WATER PIPE TEMP.')}
          </div>
          {
            toggleListing && (
              <MDBTable striped small autoWidth responsive>
                <MDBTableBody>
                {
                  airFlowSensors && airFlowSensors.sort().map( (sensor,index) => { return (<SensorList sensor={sensor} index={index} toggleSparkline={toggleSparkline}/>)})
                }
                </MDBTableBody>
              </MDBTable>
            )
          }
				</MDBCard>

        <MDBCard className="p-4 m-2" style={{ width: "40rem" }}>
          <MDBCardTitle>{ToggleGauges('WATER PIPE TEMP.')}</MDBCardTitle>
					{ toggleGauge && sensorLabels && airFlowData && getThemrmometer( { 
							title : 'AIR TEMP', 
							sensors : sensorLabels, 
							data : airFlowData, 
							redFrom: 90, redTo: 100, yellowFrom: 70, yellowTo: 90, minorTicks: 5})}
				</MDBCard>

			</MDBRow>
    )
}

// -------------------------
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
function getThemrmometer(data) {
  return (
    // <div className="d-flex flex-row align-items-center justify-content-center" >
    <MDBRow center className="p-2 m-2  text-center">

      {data.data.sort().map((_data, index) => (
        <MDBCol md="3">
          {/* <div className="d-flex flex-column px-4 align-items-center " > */}
          <Thermometer reverseGradient='true' theme="dark" value={_data.temperature} max="35" steps="1" format="°C" size="small" height="120" />
          <h6>{_data.name}</h6>
          {/* </div> */}
        </MDBCol>
      ))}
      {/* </div> */}

    </MDBRow>
  );
}
// ------------
function getDatas(sensor) {
  // console.log(sensor.logsdata);
  let datas = [];
  let VelData = [];
  let rmsVel = 0;
  let maxVel = -999;
  let minVel = 999;
  let maxVelDateTime;
  let minVelDateTime;
  sensor.logsdata.map( (data,index) => {
    let _Date = new Date(data.TIMESTAMP);
    let _timeLabel = _Date.toLocaleDateString([], {hour12: false,hour: "2-digit",minute: "2-digit"});
    // -------------------------------------------------
		let velocity = Number(data.DATAS[0])/10.0;
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
  })
  datas.push(VelData)
  return { datas,maxVelDateTime,minVelDateTime,maxVel,minVel,rmsVel };
}
//  -----------
PIPEWTRTempSysModule .defaultProps = {
  color: "black",
  handleComponetSelection: null,
  title:'PRODUCTION FLOOR PLAN'
};
export default PIPEWTRTempSysModule 