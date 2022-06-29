import React, { useEffect,useState,useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import { MDBContainer,MDBTable,MDBTableBody,MDBProgress,MDBCard,MDBTooltip,MDBCardTitle } from 'mdbreact';

const OverView = () => {
  // ------  
  const [toggle,setToggle] = useState(false);
  const [statsData,setStatsData] = useState(null);
  const [sensorTypes,setSensorTypes] = useState(null);
  const [weekDays,setWeekDay] = useState(null);
  // --------------
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  // -------------
  useEffect(()=>{
    LOADSTATS();
  },[])
  // -------
  const LOADSTATS = () => {
    try {
      // -------
      const params = { id: user._id };
      axios.get('api/sensors/statsDAYData',{params}).then(res => {
        // -------------------
        let _mapSensorType = res.data.reduce((map,sensor) => { 
          if (map[sensor.SENSORTYPE] === undefined) {
            map[sensor.SENSORTYPE] = [];
            map[sensor.SENSORTYPE].push(sensor);
          } else {
            map[sensor.SENSORTYPE].push(sensor); 
          };
          return map; },{}
        );
        // -------------------
        setStatsData(_mapSensorType);
        let ObjKEYS = Object.keys(_mapSensorType);
        setSensorTypes(ObjKEYS);
        // --------------------
      }).then(res => {
      }).catch( err => {

      })
    } catch (err) {

    }
  }  
  function ToggleButton(title) {
    return (
      <div className='custom-control custom-switch'>
        <input
          type='checkbox'
          className='custom-control-input'
          id='overviewSwitches'
          checked={toggle}
          onChange={()=>setToggle(!toggle)}
        />
        <label className='custom-control-label' htmlFor='overviewSwitches'>
          <h5>{title}</h5>
        </label>
      </div>  
    )
  }
  function STATSView() {
    // --------------------
    let _now = new Date();
    let _arrHours = [];
    for (let i=0; i < _now.getHours()+1; i++) {
      _arrHours.push(String(i));
    }
    // -----
    return (
      <MDBTable small>
        <MDBTableBody>
        <tr className='text-center align-middle' >
          <td className='text-center align-middle' rowspan="2">SENSOR TYPES</td>
          <td colspan="24">TOTAL SENSORS CONNECTED/DISCONNECTED WITHIN HOUR OF THE DAY</td>
        </tr>
        <tr>
          {
            _arrHours.map((elm,index) => {
              return <td style={{backgroundColor:'LightGray',border:'1px solid black',lineHeight:'0.8em'}} className='text-center align-middle'>{elm}</td>
            })
          }
        </tr>
        {
          sensorTypes.map((elm,index)=>{
            // -----------
            let ObjSensors = statsData[elm];
            return getHourRow(index,elm,_arrHours,ObjSensors);
            // -----------
          })
        }
        </MDBTableBody>
      </MDBTable>
    )
  }
  function PROGRESSView() {
    return (
      <>
        <MDBProgress height='1'>
        </MDBProgress>

        <br />

        <MDBProgress height='20'>
        </MDBProgress>
      </>
      
    )
  }
  function getHourRow(nIndex,key,_arrHours,ObjSensors) {
    // ------
    let ObjHourCount = {};
    let ObjHourMissingSensors = {};
    let ObjHourActiveSensors = {};
    let _now = new Date();
    // --------
    for (let i=0; i < _now.getHours()+1; i++) {
      ObjHourCount[i] = 0;
      ObjHourMissingSensors[i] = [];
      ObjHourActiveSensors[i] = [];
    }
    // --------------------------
    ObjSensors && ObjSensors.forEach((elm,index)=> {
      // --------
      _arrHours && _arrHours.forEach( hour => {
        // ---------------
        if(elm.DAYHOURS) {
          if(elm.DAYHOURS.includes(hour)) {
            ObjHourCount[hour] += 1;
            ObjHourActiveSensors[hour].push(elm);
          } else {
            ObjHourMissingSensors[hour].push(elm);
          }
        }
      })
    })
    // -----
    let ObjDataCallback = {
      index : nIndex,
      SensorType : key,
      HourNow : _now.getHours(),
      Sensors : ObjSensors,
      TotalSensors : ObjSensors.length,
      Hours : _arrHours,
      HourSensorCount : ObjHourCount,
      ActiveSensors : ObjHourActiveSensors,
      MissingSensors : ObjHourMissingSensors
    }
    // ------
    return (
      <>
      <tr>
        <td className='text-center align-middle' rowspan="2">{key}<br/>TOTAL SENSORS={ObjSensors.length}</td>
        {
          _arrHours.map((elm,index)=>{
            return (
            <td style={{backgroundColor:'SpringGreen',lineHeight:'0.8em'}} className='text-center align-middle'>
              <a href="#" data-toggle="tooltip" data-placement="top" title={getText(ObjHourActiveSensors[elm])}>{ObjHourCount[elm]}</a>              
            </td>)
          })
        }
      </tr>
      <tr>
        {
          _arrHours.map((elm,index)=>{
            return (
            <td style={{backgroundColor:'yellow',border:'1px solid black',lineHeight:'0.8em'}} className='text-center align-middle'>
              <a href="#" data-toggle="tooltip" data-placement="top" title={getText(ObjHourMissingSensors[elm])} style={{color:'black'}}>
                {ObjHourMissingSensors[elm].length}
              </a>
            </td>)
          })
        }
      </tr>
      </>
    )
  }
  function getText(elem) {
    let _TEXT = '';
    elem && elem.forEach( (elm,index) => {
      _TEXT += `${index+1}:${elm.SENSORNAME} ${String.fromCharCode(13)}`;
    })
    return _TEXT;
  }
  function getSENSORSTYPE_STATUS(key,ObjSensors,nHour1,nHour2) {
    // ---------------------
    // console.log(key,nHour,ObjSensors);
    let nCOUNT = 0;
    console.log(key,ObjSensors)
    // ------------
    ObjSensors.map((elm,index) => {
      // console.log(`KEY=${key} <${ObjSensors.length}> ..[${index}]..${elm.SENSORNAME}...INDEX=<${index}> LENGTH=${elm.DATA.length}...${nCOUNT}`);
      nCOUNT ++;
    })
    return nCOUNT;
    // --------------------
  }
  // ------
  return (
		<MDBContainer style={{width: "auto",position: "relative",marginTop: '2rem'}} >
      <MDBCard className="p-4">
        <MDBCardTitle>{ ToggleButton('DAILY STATUS OVERVIEW') }</MDBCardTitle>
        { toggle && sensorTypes && STATSView() }
        {/* { toggle && sensorTypes && PROGRESSView() } */}
      </MDBCard>
		</MDBContainer>
  )
}

export default OverView