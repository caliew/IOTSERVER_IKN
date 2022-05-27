import React, { useState, useEffect, useContext, Fragment } from 'react';
import SensorContext from '../../context/sensor/sensorContext';
import { MDBRow,MDBCard, MDBTable, MDBTableBody, MDBCardTitle,MDBCol, MDBCardText } from 'mdbreact';

import SparklinePlots from '../data-ui/SparklinePlots';
import SensorList from './SensorList';

import Chart from "react-google-charts";
import Thermometer from './Thermometer';
import TDKFloorPlan from './TDKFloorPlan';

// https://jpg-svg.com/#
// https://imageresizer.com/transparent-background
// https://picsvg.com/
// https://products.aspose.app/svg/en/image-vectorization/view
// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function AHUAirflowSysModule({ model, color, systemComponent, handleComponetSelection, title, type }) {
    // -----------
    const [airFlowSensors, setAFSensor] = useState([]);
    const [airFlowData, setAFlowData] = useState([]);
		// -------------------------------------------
    const sensorContext = useContext(SensorContext);
    const [showHide, setShowHide] = useState(true);
    const { sensors, getSensors } = sensorContext;
    // --------------
    useEffect(()=>{
        if (sensors === null) getSensors(30,null,null);
        // ------------------
        abstactAIRFLOWSensor();
        //  ---------------
    },[sensors])
    // ---------------------------
    const abstactAIRFLOWSensor = () => {
        if (sensors === null) 
        return;
        // -----------------
        // ABSTRACT AIRFLOW METER
        // -----------------
        let _AFSensors = [];
        let _airflowDatas = [];
        sensors.map( sensor => {
          // -----------
					if (sensor.type === 'AIRFLW(485)' && sensor.location !== 'AIRCOMP') {
            // --------
						_AFSensors.push(sensor);
            let _objSensor = {
              sensor : sensor,
              name : sensor.name,
              unit : 'm/s',
              velocity : Number(sensor.logsdata[0].DATAS[0])/10.0
            }
						sensor.logsdata[0] && _airflowDatas.push(_objSensor);
					}
        })
        // ------------------------
        setAFSensor(_AFSensors.sort(compareByName));
        setAFlowData(_airflowDatas.sort(compareByName));
        // ----------------------
    }
    // ------
    return (
			<MDBRow center>

					<MDBCard className="p-3 m-2" style={{ width: "40rem" }}>
						<MDBCardTitle>AHU DUCT AIRFLOW</MDBCardTitle>
							<MDBTable striped small>
								<MDBTableBody>
									{
										airFlowSensors && airFlowSensors.map( (sensor,index) => { return (<SensorList sensor={sensor} index={index} />)})
									}
							</MDBTableBody>
						</MDBTable>
					</MDBCard>

          <MDBCard className="p-4 m-2" style={{ width: "40rem" }}>
					{ showHide && getDialGauge( { 
									title : 'FLOW RATE', 
									data : airFlowData, 
									redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					</MDBCard>
          
			</MDBRow>
    )
}

// -------------
// GET SVG MODEL
// -------------
const getDialGauge = ({data}) => {
  return (
    <MDBRow >
			{
				data.map( (sensor,index) => {
					let _gauge = [];
          let _data = [sensor.unit,sensor.velocity];
					_gauge.push(['Label', 'Value'])
					_gauge.push(_data);
					return(
						// <div className="d-flex flex-column px-4 align-items-center " >
            <MDBCol md="3">
							<Chart width={120} height={120} chartType="Gauge"
															loader={<div>Loading Chart</div>}
															data={_gauge}
															options={{
															redFrom: 13,
															redTo: 15,
															yellowFrom: 10,
															yellowTo: 13,
															max:15,
															min:0,
															minorTicks: 5,}}
															rootProps={{ 'data-testid': '1' }} />
								<h6>{sensor.name}</h6>
            </MDBCol>
						// </div>
					)
				})
			}
    </ MDBRow>
  )
}
// ------------
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
//  RANDOM DATA
//  -----------
const randomData = n =>
  Array.range(n).map((_, i) => ({
    y: Math.random() * (Math.random() > 0.2 ? 1 : 2),
    x: `${i + 1}`,
  }));
// Set default props
AHUAirflowSysModule.defaultProps = {
  color: "black",
  handleComponetSelection: null,
  title:'PRODUCTION FLOOR PLAN'
};
export default AHUAirflowSysModule