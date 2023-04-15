import React, { useState, useEffect, useContext } from 'react';
import SensorContext from '../../context/sensor/sensorContext';
import SensorList from './SensorList';
import { MDBTable,MDBTableBody, MDBRow,MDBCard,MDBCol, MDBCardTitle } from 'mdbreact';

import Chart from "react-google-charts";
import Page from './StatsComp';

// https://jpg-svg.com/#
// https://imageresizer.com/transparent-background
// https://picsvg.com/
// https://products.aspose.app/svg/en/image-vectorization/view
// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function AIRCompSysModule({ model, color, systemComponent, handleComponetSelection, title, type }) {
    // -----------
    const [airFlowSensors, setAFSensor] = useState([]);
    const [sensorType,setSensorType] = useState();
    const [airPressData, setAPressData] = useState([]);
    const [toggleListing,setToggleListing] = useState(false);
    const [toggleGauge,setToggleGauge] = useState(false);
    const [toggleSparkline,setToggleSparkline] = useState(false);
    const [toggleOverview,setOverview] = useState(false);
		// -------------------------------------------
    const sensorContext = useContext(SensorContext);
    const { sensors, getSensors } = sensorContext;
    // --------------
    useEffect(()=>{
      if (sensors === null) getSensors(30,null,null);
      abstactAIRPRESSSensor();
      //  -----------
      // eslint-disable-next-line
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
          return null;
        })
        // --------------------
        setSensorType(_AFSensors[0].type);
        setAFSensor(_AFSensors.sort(compareByName));
        setAPressData(_airpressureDatas);
        // -------------------------
    }
    // --------------
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
    }
    function ToggleSTATSButton(title) {
      return (
        <div className='custom-control custom-switch'>
          <input
            type='checkbox'
            className='custom-control-input'
            id='customSTATSSwitches'
            checked={toggleOverview}
            onChange={()=>setOverview(!toggleOverview)}
          />
          <label className='custom-control-label' htmlFor='customSTATSSwitches'>
            <h5>{title}</h5>
          </label>
        </div>  
      )
    }
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // width="645" height="459" viewBox="0 0 645 459"
    // --------------------------------------------
    return (
      <>
        <MDBRow center>
          <MDBCard className="p-4 m-2"style={{ width: "70rem" }}>
            <div className='d-flex'>{ ToggleSTATSButton('OVERVIEW') }</div>
            { toggleOverview && airPressData && airPressData.length>0 && <Page title="AIR PRESSURE" data={airPressData} type={sensorType} /> }
          </MDBCard>
        </MDBRow>
        <MDBRow center>
          <MDBCard className="p-4 m-2"style={{ width: "40rem" }}>
            <div className='d-flex'>
              {ToggleListing(title='AIR COMPRESSOR')}&nbsp;&nbsp;&nbsp;
              {ToggleSparkline('AIR COMPRESSOR')}
            </div>
            {
              toggleListing && (
                <MDBTable striped small autoWidth responsive>
                  <MDBTableBody>
                  {
                      airFlowSensors && airFlowSensors.sort().map( (sensor,index) => { return (<SensorList sensor={sensor} 
                        index={index} toggleSparkline={toggleSparkline}/>)})
                  }
                  </MDBTableBody>
                </MDBTable>
              )
            }
          </MDBCard>

          <MDBCard className="p-4 m-2" style={{ width: "40rem" }}>
            <MDBCardTitle>{ToggleGauges(title='AIR COMPRESSOR')}</MDBCardTitle>
            { toggleGauge && getDialGauge( { 
                title : 'PRESSURE',
                data : airPressData, 
                redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}            
          </MDBCard>

        </MDBRow>
      </>
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
    <MDBRow center className="p-2 m-2">
      {/* <div className="d-flex row p-4 justify-content-center"> */}
      {
        data.sort().map( (sensor,index) => {
          let _gauge = [];
          let _data = [sensor.unit,sensor.pressure];
          _gauge.push(['Label', 'Value'])
					_gauge.push(_data);
          return(
            <MDBCol md="3" className='text-center'>
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
  var float = 0, sign,  mantissa, exp,
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
  exp = ((int >>> 23) & 0xff) - 127;
  mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
  for (i=0; i<mantissa.length; i+=1) {
      float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
      exp--;
  }
  return float*sign;
}
//  -----------
// Set default props
AIRCompSysModule.defaultProps = {
  color: "black",
  handleComponetSelection: null,
  title:'PRODUCTION FLOOR PLAN'
};
export default AIRCompSysModule