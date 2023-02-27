import React, { useState, useContext, useEffect } from 'react';
import SensorContext from '../../context/sensor/sensorContext';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';
import { MDBCard,MDBRow,MDBBtn,MDBContainer,MDBCol   } from 'mdbreact';

const SensorForm = ({SensorInfo,ClearSelectSensor}) => {
	//	-----------------
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const authContext = useContext(AuthContext);
  const { user, companies } = authContext;
  // -------------------
  // USE SENSOR CONTEXT
  // -------------------
  const sensorContext = useContext(SensorContext);
  const { addSensor, updateSensor } = sensorContext;
  // ---------
  // USE STATE
  // ---------
  const [companyState,setCompanyState] = useState(null);
  const [sensor, setSensor] = useState({ name:'',dtuId:'',sensorId:'',type:'',ratingMin:'',company:null,ratingMax:'',variables:[],limits:{} });
  const { name, dtuId, sensorId, type, ratingMin, ratingMax,limits,location } = sensor;
  // ----------
  // USE EFFECT
  // ----------
  useEffect(() => {
    // ---------------
    setSensor(SensorInfo);
    // --------------------
    if (SensorInfo !== null) {
      // -------------------
      let sensorcompanies = SensorInfo.company ? SensorInfo.company : [];
      // ----------------------------------
      let updatedStates= null;
      // ---------------------
      if (sensorcompanies && companies) {
        updatedStates = companies.map( x => {
          let nIndex=sensorcompanies.indexOf(x.companyname);
          (nIndex > -1 ) ? x.status = true : x.status = false;
          return x;
        });
        setCompanyState(updatedStates)
      }
      // -------------------------
    } 
    //  -----------
    // eslint-disable-next-line
  }, [SensorInfo]);
  // ---------
  // FUNCTIONS
  // ---------
  const onChangeType = e => {
    const name = e.target.name;
    const sensorType = e.target.value;
    switch (sensorType)
    {
      case 'WISENSOR':
        setSensor({...sensor, dtuId:'-1', ratingMin:'-1', ratingMax:'-1',[name]:sensorType,
          limits: {TEMPERATURE_MIN:'MIN',TEMPERATURE_MAX:'MAX',HUMIDITY_MIN:'MIN',HUMIDITY_MAX:'MAX'},
          variables:['TEMPERATURE','HUMIDITY']});
        return;
      case 'HONEYWELL':
        setSensor({...sensor, dtuId:'-1', ratingMin:'-1', ratingMax:'-1',[name]:sensorType,
          limits: {FIRE_DETECTED:'FLAG'},
          variables:['FIRE DETECTED']});
        return;
      case 'RH(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'-1', ratingMax:'-1',[name]:sensorType,
          limits: {TEMPERATURE_MIN:'MIN',TEMPERATURE_MAX:'MAX',HUMIDITY_MIN:'MIN',HUMIDITY_MAX:'MAX'},
          variables:['TEMPERATURE','HUMIDITY']});
        return;
      case 'PWRMTR(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'1', ratingMax:'1',[name]:sensorType,
          limits: {VOLTAGE_MIN:'MIN',VOLTAGE_MAX:'MAX',CURRENT_MIN:'MIN',CURRENT_MAX:'MAX',POWER_CONSUMPTION_RATE:'MAX RATE',TOTAL_POWER_CONSUMPTION:'TOTAL'},
          variables:['VOLTAGE','CURRENT','POWER CONSUMPTION']});
        return;
      case 'WTRLEAK(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'-1', ratingMax:'-1',[name]:sensorType,
          limits: {WATER_LEAK:'FLAG'},
          variables:['WATER LEAK']});
        return;
      case 'PIR(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'-1', ratingMax:'-1',[name]:sensorType,
          limits: {PIRE_DETECTED:'FLAG'},
          variables:['INTRUDER DETECTED']});
        return;
      case 'AIRFLW(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'1', ratingMax:'1',[name]:sensorType,
          limits: {VELOCITY_MIN:'0',VELOCITY_MAX:'0',FLOW_RATE_MIN:'0',FLOW_RATE_MAX:'0'},
          variables:['VELOCITY','FLOW RATE']});
        return;
      case 'AIRRH(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'1', ratingMax:'1',[name]:sensorType,
          limits: {TEMPERATURE_MIN:'MIN',TEMPERATURE_MAX:'MAX',HUMIDITY_MIN:'MIN',HUMIDITY_MAX:'MAX'},
          variables:['TEMPERATURE','HUMIDITY']});
        return;
      case 'WTRTEMP(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'1', ratingMax:'1',[name]:sensorType,
          limits: {TEMPERATURE_MIN:'MIN',TEMPERATURE_MAX:'MAX'},
          variables:['TEMPERATURE']});
        return;
      case 'WTRPRS(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'1', ratingMax:'1',[name]:sensorType,
          limits: {PRESSURE_MIN:'MIN',PRESSURE_MAX:'MAX'},
          variables:['PRESSURE 1','PRESSURE 2']});
        return;
      case 'ADC(485)':
        setSensor({...sensor, dtuId:'0',ratingMin:'1', ratingMax:'1',[name]:sensorType,
          limits: {TEMPERATURE_MIN:'MIN',TEMPERATURE_MAX:'MAX',HUMIDITY_MIN:'MIN',HUMIDITY_MAX:'MAX'},
          variables:['TEMPERATURE','HUMIDITY']});
        return;
      default:
        return;
    }
  }
  const onChange = e => { 
    const name = e.target.name;
    const value = e.target.value;
    setSensor({ ...sensor, [name]: value });
  }
  const onSetLimits = e => {
    const name = e.target.name;
    const value = e.target.value;
    console.log(sensor.limits);
    const currentLimits = sensor.limits;
    currentLimits[name] = value;
    setSensor({ ...sensor, limits :currentLimits})
  }
  // -----------------------
  const onChangeCompanyState = (e,company) => {
    // ------------
    company.status = e.target.checked;
    // -----------
    setCompanyState(companyState.map(_company =>
      _company._id === company._id ? company : _company
    ))
    let checkStates = [...new Set(companyState.filter( x => x.status))];
    let sensorCompany = checkStates.map(x=> x.companyname);
    console.log(sensorCompany)
    setSensor({...sensor, company:sensorCompany });
  }
  // ---------------
  const onSubmit = e => {
    // ----------------
    e.preventDefault();
    // ----------------
    if (name === '' || dtuId === '' || sensorId === '' || type === '' || ratingMin === '' || ratingMax === '' || limits.length === 'undefined') {
      // ------------------------------------
      setAlert('MISSING FIELD(S)', 'danger');
      // -------------------------------------
    } else {
      // -------------------------
      if (sensor === null) {
        console.log(`[SENSORFOMR.JS] .. ADD SENSOR`)
        addSensor(sensor);
      } else {
        console.log(`[SENSORFOMR.JS] .. UPDATE SENSOR`)
        updateSensor(sensor);
      }
      clearAll();
    }
  };
  const onSubmitAdd = () => {
    console.log(sensor);
    addSensor(sensor);
  }
  // ----------------
  const clearAll = () => { ClearSelectSensor(); };
  // ----------------------
  return (
    <MDBCard className='p-3'>
      <form onSubmit={onSubmit}>

        <MDBRow className="mb-3 justify-content-center">
          {user && user.name ==="superuser" && <MDBBtn color="primary" onClick={onSubmitAdd}>{'Add Sensor'}</MDBBtn>}
          <MDBBtn color="primary" onClick={onSubmit}>{'Update Sensor'}</MDBBtn>
          {sensor && <MDBBtn active color="primary" onClick={clearAll}>CLEAR</MDBBtn>}
        </MDBRow>

        <MDBCard className="p-2 mb-2">
          <h6>NAME
            <input type='text' placeholder='Sensor Name' className="form-control" 
                   name='name' value={name} onChange={onChange} /></h6>
          <div>
            <h6>DTU ID
              <input  type='text' placeholder='DTU ID (Set -1 For LORA Sensor)' 
                      className="form-control" 
                      name='dtuId' value={dtuId} onChange={onChange} /></h6>
          </div>
          <h6>SENSOR ID
              <input type='text' placeholder='Sensor ID or Machine ID' 
                     className="form-control" 
                     name='sensorId' value={sensorId} onChange={onChange}/></h6>
          <h6>LOCATION
            <input type='text' placeholder='Sensor Location' 
                   className="form-control" 
                   name='location' value={location} onChange={onChange}/></h6>
        </MDBCard >

        { user.name.toLowerCase() === "superuser" &&

          <MDBCard className='p-2 m-2'>
            <MDBContainer>
              <MDBRow className="header d-flex grey lighten-2 m-1 justify-content-center">
                  <h6 className="deep-grey-text mt-2 mb-2 pb-1">COMPANIES</h6></MDBRow>
              { 
                companyState && companyState.map(company => { return (
                  <MDBRow>
                    { company.status && <MDBCol size='1'><input type='checkbox' id={company.companyname} checked onChange={(e)=>onChangeCompanyState(e,company)}/></MDBCol> }
                    { !company.status && <MDBCol size='1'><input type='checkbox' id={company.companyname} onChange={(e)=>onChangeCompanyState(e,company)}/></MDBCol> }
                  <MDBCol size='10'><label for={company.companyname}>{company.companyname}</label></MDBCol>
                  </MDBRow>
                )})
              }
            </MDBContainer>
          </MDBCard>
          
        }

        {/* <MDBInputGroup> */}
          <MDBCard className="shadow-box-example z-depth-1 p-3" >
            <MDBRow className="header d-flex grey lighten-2 m-1 justify-content-center">
              <h6 className="deep-grey-text mt-2 mb-2 pb-1">SENSOR TYPE</h6>
            </MDBRow>
            <div><input type='radio' name='type' id='WISENSOR' value='WISENSOR'
              checked={type === 'WISENSOR'}onChange={onChangeType}/>
              <label for='WISENSOR'>&nbsp;WI-SENSOR</label>
            </div>
            <div><input type='radio' name='type' value='HONEYWELL' id='HONEYWELL'
              checked={type === 'HONEYWELL'} onChange={onChangeType}/>
              <label for='HONEYWELL'>&nbsp;SMOKE DER</label>
            </div>
            <div><input type='radio' name='type' value='RH(485)' id='RH(485)'
              checked={type === 'RH(485)'} onChange={onChangeType}/>
              <label for='RH(485)'>&nbsp;RH SENSOR</label>
            </div>
            <div><input type='radio' name='type' value='WTRLEAK(485)' id='WTRLEAK(485)'
              checked={type === 'WTRLEAK(485)'} onChange={onChangeType}/>
              <label for='WTRLEAK(485)'>&nbsp;WATER LEAK</label>
            </div>
            <div><input type='radio' name='type' value='PIR(485)' id='PIR(485)'
              checked={type === 'PIR(485)'} onChange={onChangeType}/>
              <label for='PIR(485)'>&nbsp;PIR</label>
            </div>
            <div><input type='radio' name='type' value='PWRMTR(485)' id='PWRMTR(485)'
              checked={type === 'PWRMTR(485)'} onChange={onChangeType}/>
              <label for='PWRMTR(485)'>&nbsp;POWER METER</label>
            </div>
            <div><input type='radio' name='type' value='AIRFLW(485)' id='AIRFLW(485)'
              checked={type === 'AIRFLW(485)'} onChange={onChangeType}/>
              <label for='AIRFLW(485)'>&nbsp;AIR FLOW VELOCITY</label>
            </div>
            <div><input type='radio' name='type' value='AIRRH(485)' id='AIRRH(485)'
              checked={type === 'AIRRH(485)'} onChange={onChangeType}/>
              <label for='AIRRH(485)'>&nbsp;AIR FLOW RH</label>
            </div>
            <div><input type='radio' name='type' value='WTRTEMP(485)' id='WTRTEMP(485)'
              checked={type === 'WTRTEMP(485)'} onChange={onChangeType}/>
              <label for='WTRTEMP(485)'>&nbsp;WATER TEMP</label>
            </div>
            <div><input type='radio' name='type' value='WTRPRS(485)' id='WTRPRS(485)'
              checked={type === 'WTRPRS(485)'} onChange={onChangeType}/>
              <label for='WTRPRS(485)'>&nbsp;WATER PRESSURE</label>
            </div>
            <div><input type='radio' name='type' value='ADC(485)' id='ADC(485)'
              checked={type === 'ADC(485)'} onChange={onChangeType}/>
              <label for='ADC(485)'>&nbsp;ADC</label>
            </div>
          </MDBCard>
        {/* </MDBInputGroup> */}

        <MDBCard className="shadow-box-example z-depth-1 mt-2 p-3" >
            <div className=''>
              <MDBRow className="header d-flex grey lighten-2 m-1 justify-content-center">
                <h6 className="deep-grey-text mt-2 mb-2 pb-1">RATINGS</h6>
              </MDBRow>
              {
                ratingMax !== '-1' && ratingMin !=='-1' && (
                  <>
                    <h6>MIN 
                      <input type='text' placeholder='RATING (MIN)' name='ratingMin' 
                            className="form-control" value={ratingMin} 
                            onChange={onChange}/></h6>
                    <h6>MAX 
                      <input type='text' placeholder='RATING (MAX)' name='ratingMax' 
                            className="form-control" value={ratingMax} 
                            onChange={onChange}/></h6>
                  </>
                )
              }
            </div>
        </MDBCard >

        <MDBCard className="shadow-box-example z-depth-1 mt-2 p-3" >
          { limits && Object.keys(limits).length > 0 && 
            (<div>
              <MDBRow className="header d-flex grey lighten-2 m-1 justify-content-center">
                <h6 className="deep-grey-text mt-2 mb-2 pb-1">ALERT SETTINGS</h6>
              </MDBRow>
              { 
                  Object.keys(limits).map( key => {
                    return ( 
                    <h6 htmlFor={key}>{key}
                      <input type='text' placeholder={key} name={key} 
                            className="form-control" value={limits[key]} 
                            onChange={onSetLimits}/>
                    </h6>
                )})}
            </div>)
          }
        </MDBCard >

      </form>    
    </MDBCard>
  );
};

export default SensorForm;
