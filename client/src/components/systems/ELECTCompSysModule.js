import React, { useState, useEffect, useContext } from 'react';
import SensorContext from '../../context/sensor/sensorContext';
import SensorList from './SensorList';
import { MDBTable,MDBTableBody, MDBRow,MDBCard,MDBCol, MDBInput ,MDBCardTitle } from 'mdbreact';
import axios from 'axios';

// https://jpg-svg.com/#
// https://imageresizer.com/transparent-background
// https://picsvg.com/
// https://products.aspose.app/svg/en/image-vectorization/view
// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function ELECTCompSysModule({ model, color, systemComponent, handleComponetSelection, title, type }) {
    // -----------
    const [pwrMeters, setPWRMeter] = useState([]);
    const [rawdata,setData] = useState(null);
    const [statsData,setStatsData] = useState(null);
    const [weekDays,setWeekDay] = useState(null);
    const [yearMonths,setYearMonth] = useState(null);
    const [toggleSTATS,setToggleSTATS] = useState(false);
    const [toggleSTATSWEEK,setToggleSTATSWEEK] = useState(false);
    const [toggleListing,setToggleListing] = useState(false);
    const [toggleGauge,setToggleGauge] = useState(false);
    const [toggleSparkline,setToggleSparkline] = useState(false);
		// -------------------------------------------
    const sensorContext = useContext(SensorContext);
    const { sensors,  getSensors } = sensorContext;
    // --------------
    useEffect(()=>{
      RELOADRAWDARA();
      LOADSTATS();
    },[])
    useEffect(()=>{
        // ---------
        if (sensors === null) getSensors(30,null,null);
        // ------------------
        abstactELECTPWRMTR();
        // -------------
    },[sensors])
    // ---------------------------
    const abstactELECTPWRMTR = () => {
        if (sensors === null) 
        return;
        // -------------------------------
        // ABSTRACT ELECTRICAL POWER METER
        // -------------------------------
        let _PWRMeters = [];
        let _airPressDatas = [['Label', 'Value']];
        // -----------------------
        sensors.forEach( sensor => {
          // --------------------
          if (sensor.type==='PWRMTR(485)') {
            // ------------------------------
            let { datas } = getDatas(sensor);
            let _data = sensor.logsdata.length > 0 ? sensor.logsdata[0] : null;
            // ---------------------
            let _dataObj = {
              ...sensor,
              name : getName(sensor.dtuid,sensor.sensorid)
            }
            _PWRMeters.push(sensor);
            // --------------------
            let _HEXStr = _data ? _data.RCV_BYTES[0] + _data.RCV_BYTES[1] : '';
            let totaleEnergy = _data ? parseInt(_HEXStr,16)*0.01 : -999;
            sensor.logsdata[0] && _airPressDatas.push(['BAR',totaleEnergy]);
            // -------------------
          }
        })
        // --------------------
        setPWRMeter(_PWRMeters.sort(compareByName));
        // -------------------------
    }
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
   
    // ------------------
    function byteArray(dataArr) {
      let strTEXT ="";
      dataArr && dataArr.forEach((_byte,index) => {
        strTEXT += _byte + " ";
      })
      return strTEXT;
    }
    function hexToSignedInt(hex) {
      if (hex.length % 2 != 0) {
        hex = "0" + hex;
      }
      var num = parseInt(hex, 16);
      var maxVal = Math.pow(2, (hex.length / 2) * 8);
      if (num > maxVal / 2 - 1) {
        num = num - maxVal;
      }
      return num;
    }
    // -------------------------  
    const LOADSTATS = () => {
      try {
        axios.get('api/sensors/statsPWRMTRdata',{}).then(res => {
          // ---------------------
          setStatsData(res.data);
          let WeeksDays = [];
          let YearsMonths = [];
          // ----------------
          Object.entries(res.data).map(([index, data]) => {
            // ---------------
            let keys = Object.keys(data);
            // ---------------
            if (data['SENSORTYPE'] === "PWRMTR(485)") {
              // ---------
              keys.forEach(key => {
                if ( !WeeksDays.includes(key) && key.includes('WK')) WeeksDays.push(key);
                if ( !YearsMonths.includes(key) && key.includes('MNTH')) YearsMonths.push(key);
              })
            }
          })
          setWeekDay(WeeksDays);
          setYearMonth(YearsMonths);
          // ---------
        }).then(res => {
        }).catch( err => {

        })
      } catch (err) {

      }
    }
    const RELOADRAWDARA = () => {
      try {
        // --------------------------------
        axios.get('/api/sensors/rawsensordata', { } ).then (res => {
          // --------
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
          setData(getRows(DataMap));
          // ----------------
        }).then( res => {
          // --------------    
          // getSensorsData();
          // --------------
        }).catch ( err => {
        })
        // ------
      } catch (err) {
      }
      // ---------
    }
    const getRows = (DataMap) => {
      // --------------
      let DataArr = [];
      let activeSensors = {};
      // --------------------
      DataMap && DataMap.forEach((_sensor,index) => {
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
        let _TYPE = activeSensors[_key].sensortype;
        _TYPE === 'POWER METER' && DataArr.push(activeSensors[_key]);
      })
      // -------------------
      return DataArr;
    };
    function getRowsWeekDay() {
      // ------
      return (
        <>
          <tr className='text-center align-middle'>
            <td>NAME</td><td>DTU ID</td><td>SENSOR ID</td><td>TYPES</td>
            { toggleSTATSWEEK ? (weekDays && weekDays.map((wk,index) => {
                // -----
                return (<td>{wk}</td>)
                // ------
              })) : (yearMonths && yearMonths.map((mth,index) => {
                // -----
                if (index < yearMonths.length) return (<td>{mth.substring(5)}</td>)
                // ------
              }))
            }
          </tr>
          {
            Object.entries(statsData).map((data) => {
              // -------
              let _data = data[1]
              // ------
              if ( _data['SENSORTYPE'] === 'PWRMTR(485)') {
                return (
                  <tr className='text-center align-middle'>
                    <td>{_data['SENSORNAME']}</td>
                    <td>{_data['DTUID']}</td><td>{_data['SENSORID']}</td>
                    <td>TOTAL<br/>NETT</td>
                    { toggleSTATSWEEK && weekDays ? 
                      weekDays.map((wk,index) => {
                        // -------------
                        let _READING0 = _data[weekDays[index+1]] || 0;
                        let _READING = _data[weekDays[index]] || 0;
                        return (<td>{_READING}<br/>{_READING-_READING0}</td>)
                        // ------------
                      }) : yearMonths && yearMonths.map((mth,index) => {
                        // -----
                        let _READING0 = _data[yearMonths[index+1]]|| 0;
                        let _READING = _data[yearMonths[index]]|| 0;
                        return (<td>{_READING}<br/>{_READING-_READING0}</td>)
                        // ------
                      }) 
                    }
                  </tr>)
              }
          })}
        </>
      )
    }
    // ----------
    function getName(_dtuID,_sensorID) {
      // --------------------
      let sensorFound = pwrMeters.find(sensor => sensor.dtuId == _dtuID && sensor.sensorId == _sensorID);
      return sensorFound ? sensorFound.name : "";
    }
    // -----
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
    // -----
    function ToggleSTATSButton(title) {
      return (
        <div className='custom-control custom-switch'>
          <input
            type='checkbox'
            className='custom-control-input'
            id='customSTATSSwitches'
            checked={toggleSTATS}
            onChange={()=>setToggleSTATS(!toggleSTATS)}
          />
          <label className='custom-control-label' htmlFor='customSTATSSwitches'>
            <h5>{title}</h5>
          </label>
        </div>  
      )
    }
    function ToggleSTATSWEEKButton(title) {
      return (
        <div className='custom-control custom-switch'>
          <input
            type='checkbox'
            className='custom-control-input'
            id='customSTATSWEEKSwitches'
            checked={toggleSTATSWEEK}
            onChange={()=>setToggleSTATSWEEK(!toggleSTATSWEEK)}
          />
          <label className='custom-control-label' htmlFor='customSTATSWEEKSwitches'>
            <h5>{title}</h5>
          </label>
        </div>  
      )
    }
    function ToggleSTATSMONMTHButton(title) {
      return (
        <div className='custom-control custom-switch'>
          <input
            type='checkbox'
            className='custom-control-input'
            id='customSTATSWEEKSwitches'
            checked={!toggleSTATSWEEK}
            onChange={()=>setToggleSTATSWEEK(!toggleSTATSWEEK)}
          />
          <label className='custom-control-label' htmlFor='customSTATSWEEKSwitches'>
            <h5>{title}</h5>
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
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // width="645" height="459" viewBox="0 0 645 459"
    // --------------------------------------------
    return (
      <>
			<MDBRow center>
        <MDBCard className="p-4 m-2"style={{ width: "70rem" }}>
				  <div className='d-flex'>
            { ToggleSTATSButton('ELECTRICITY CONSUMPTION (Kwh)') }&nbsp;&nbsp;&nbsp;
            { toggleSTATS && ToggleSTATSWEEKButton('BY WEEK') }&nbsp;&nbsp;&nbsp;
            { toggleSTATS && ToggleSTATSMONMTHButton('BY MONTH') }
          </div>
          {
            toggleSTATS && (
            <MDBTable striped small autoWidth responsive>
              <MDBTableBody>
                { weekDays && getRowsWeekDay() }
              </MDBTableBody>
            </MDBTable>
            )
          }
        </MDBCard>
      </MDBRow>

			<MDBRow center>
				<MDBCard className="p-4 m-2"style={{ width: "40rem" }}>
				  <div className='d-flex'>
            {ToggleListing('ELECTRICAL POWER METER')}&nbsp;&nbsp;&nbsp;
            {ToggleSparkline('ELECTRICAL POWER METER')}
          </div>
          {
            toggleListing && (
              <MDBTable striped small autoWidth responsive>
                <MDBTableBody>
                {
                    pwrMeters && pwrMeters.map( (sensor,index) => { return (<SensorList sensor={sensor} index={index} toggleSparkline={toggleSparkline}/>)})
                }
                </MDBTableBody>
              </MDBTable>
            )
          }
				</MDBCard>

				<MDBCard className="p-4 m-2" style={{ width: "46rem" }}>
          <MDBCardTitle>{ToggleGauges('ELECTRICAL POWER METER')}</MDBCardTitle>
          <MDBRow center>
            { toggleGauge && pwrMeters && rawdata && rawdata.map((sensor,index) => {
                return (
                  <div className="d-flex justify-content-center">
                    { drawPWRMETER(sensor,getName(sensor.dtuid,sensor.sensorid)) }
                  </div>
                )              
            }) }
          </MDBRow>
				</MDBCard>
			</MDBRow>
      </>
    )
}
// -------------
// GET SVG MODEL
// -------------
function getDatas(sensor) {
  // console.log(sensor.logsdata);
  let datas = [];
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
    let _hexString = `${data.RCV_BYTES[0]+data.RCV_BYTES[1]}`
    let _hexInt = parseInt(_hexString, 16)*0.01;
    let pressure = Number(_hexInt).toFixed(0);
		// -------------------
    PressData.push({y:pressure,x:_timeLabel}); 
  })
  // -------------
  // datas.push(VelData)
  datas.push(PressData)
  // ----------------
  return { datas,maxVelDateTime,minVelDateTime,maxVel,minVel,rmsVel };
}
function drawPWRMETER(sensor,name) {
  // ------------
  let _DATE = sensor.date;
  let _TIME = sensor.time;
  let _DTUID = sensor.dtuid;
  let _SENSORID = sensor.sensorid;
  let _TITLE = name ? name : '';
  let ElectEnergy = Number(sensor.energy.split(' ')[0]).toFixed(0);
  // ------------
  let CurrentA = sensor.current.split(' ').length > 1 ? sensor.current.split(' ')[0].split('=')[1] : '';
  let CurrentB = sensor.current.split(' ').length > 1 ? sensor.current.split(' ')[1].split('=')[1] : '';
  let CurrentC = sensor.current.split(' ').length > 1 ? sensor.current.split(' ')[2].split('=')[1] : '';
  let VoltageA = sensor.voltage.split(' ').length > 1 ? sensor.voltage.split(' ')[0].split('=')[1] : '';
  let VoltageB = sensor.voltage.split(' ').length > 1 ? sensor.voltage.split(' ')[1].split('=')[1] : '';
  let VoltageC = sensor.voltage.split(' ').length > 1 ? sensor.voltage.split(' ')[2].split('=')[1] : '';
  // -----------
  let PowerP = sensor.power.split(' ')[0];
  let PowerQ = sensor.power.split(' ')[1];
  let PowerS = sensor.power.split(' ')[2];
  // ------------
  let PowerFactor = sensor.powerfactor;
  let Frequency = sensor.frequency;
  // ------------------------------
  return (
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"  preserveAspectRatio="xMidYMid meet" >
      <g transform="translate(0,0) scale(0.80,0.80)" >
        <rect width="300" height="300" rx="5" stroke="yellow" stroke-width="4" fill="black"/>
          <g transform="translate(5,5)" >
          <text x="10" y="20"  fill="white" font-size="1.0em" >{_DATE}</text>
          <text x="10" y="38"  fill="white" font-size="1.0em" >{_TIME}</text>
          <text x="100" y="30" fill="white" font-size="1.2em" >{ElectEnergy} kWh</text>
          <g transform="translate(10,50)" >
            <rect width="80" height="40" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
            <text x="8" y="18"  fill="white" font-size="1.0em" >{VoltageA} V</text>
            <text x="8" y="35"  fill="white" font-size="1.0em" >{CurrentA} A</text>
            <text x="62" y="20"  fill="red" font-size="1.2em" >A</text>
          </g>						
          <g transform="translate(95,50)" >
            <rect width="80" height="40" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
            <text x="8" y="18"  fill="white" font-size="1.0em" >{VoltageB} V</text>
            <text x="8" y="35"  fill="white" font-size="1.0em" >{CurrentB} A</text>
            <text x="62" y="20"  fill="red" font-size="1.2em" >B</text>
          </g>
          <g transform="translate(180,50)" >
            <rect width="80" height="40" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
            <text x="8" y="18"  fill="white" font-size="1.0em" >{VoltageC} V</text>
            <text x="8" y="35"  fill="white" font-size="1.0em" >{CurrentC} A</text>
            <text x="62" y="20"  fill="red" font-size="1.2em" >C</text>
          </g>
          <g transform="translate(130,100)"><text x="10" y="20"  fill="white" font-size="1.1em" > {_TITLE} </text></g>
          <g transform="translate(10,100)" >
            <rect width="60" height="30" rx="0" stroke="yellow" stroke-width="1" fill="black"/>
            <text x="10" y="20"  fill="white" font-size="1.0em" >{PowerFactor}</text>
          </g>
          <g transform="translate(80,100)" >
            <rect width="50" height="30" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
            <text x="5" y="20"  fill="white" font-size="1.0em" >{Frequency}</text>
          </g>
          <g transform="translate(10,140)" >
            <rect width="100" height="30" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
            <text x="5" y="20"  fill="white" font-size="1.0em" >{PowerP}</text>
          </g>
          <g transform="translate(10,170)" >
            <rect width="100" height="30" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
            <text x="5" y="20"  fill="white" font-size="1.0em" >{PowerQ}</text>
          </g>
          <g transform="translate(10,200)" >
            <rect width="100" height="30" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
            <text x="5" y="20"  fill="white" font-size="1.0em" >{PowerS}</text>
          </g>
        </g>
      </g>
    </svg>
  )
}
//  -----------
// Set default props
ELECTCompSysModule.defaultProps = {
  color: "black",
  handleComponetSelection: null,
  title:'PRODUCTION FLOOR PLAN'
};
export default ELECTCompSysModule