import React, { useReducer,useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import SensorContext from './sensorContext';
import SensorReducer from './sensorReducer';
import {
  SET_FETCH_DATETIME,
  SET_SENSORS,
  SET_PLOTSENSORDATA,
  CLEAR_PLOTSENSORDATA,
  SET_RAWSENSORS,
  ADD_SENSOR,
  SENSOR_ERROR,
  UPDATE_SENSOR,
  UPDATE_SENSORSTATS,
  DELETE_SENSOR,
  SET_CURRENT_SENSOR,
  FILTER_SENSORS,
  CLEAR_CURRENT_SENSOR,
  CLEAR_FILTER_SENSORS,
  GET_SENSORS_DATA
} from '../types';

const initialState = {
  sensors: null,
  wisensors:null,
  sensorTypeMap:null,
  plotSensorMap:null,
  rawsensors: null,
  current: null,
  fetchDateTime : null,
  sensorsData: null,
  sensorStatsData: null,
  locationSensorsMap : null,
  filtered: null,
  loading: false,
  error: null
};

const SensorState = props => {
  // ------------
  const [state, dispatch] = useReducer(SensorReducer, initialState);
  // -------------
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  // ------------
  // GET SENSORS
  // ------------
  const getSensors = async (datasets,date0,date1) => {
    try {
      // --------------------------------
      const params = { totalLines : datasets, id: user._id, date0, date1 };
      axios.get('/api/sensors', { params } ).then (res => {
        // ----------------
        // console.log(res.data.filter(_sensor => _sensor.sensorId==='B0-BC-82-C4-C4-41'));
        dispatch({ type:SET_SENSORS,payload: res.data});
        dispatch({ type:SET_FETCH_DATETIME,payload:new Date()});
        // ----------------
      })
      .then( res => { getSensorsData(); })
      .catch ( err => { dispatch({ type:SENSOR_ERROR});} )
      // --------------
    } catch (err) {
    }
  }
  const getSensorPlotData = async (datasets,date0,date1) => {
    try {
      // --------------------------------
      dispatch({ type:CLEAR_PLOTSENSORDATA})
      const params = { totalLines : datasets, id: user._id, date0, date1 };
      // --------------------
      axios.get('/api/sensors', { params } ).then (res => {
        // ----------------
        dispatch({ type:SET_PLOTSENSORDATA,payload: res.data});
        // ----------------
      })
      .then( res => { getSensorsData(); })
      .catch ( err => { dispatch({ type:SENSOR_ERROR});} )
      // --------------
    } catch (err) {
    }
  }
  // --------------------
  // GET RAW SENSORS DATA
  // --------------------
  const getRawSensors = async() => {
    try {
      // --------------------------------
      axios.get('/api/sensors/rawsensordata', { } ).then (res => {
        // ----------------
        dispatch({ type:SET_RAWSENSORS,payload: res.data});
        // ----------------
      }).then( res => {
      }).catch ( err => {
        dispatch({ type:SENSOR_ERROR });
      })
      // --------------

    } catch (err) {

    }
  }
  // -----------
  // SET CURRENT SENSOR
  // -----------
  const setCurrent = sensor => {
    dispatch({ type:SET_CURRENT_SENSOR, payload: sensor });
  }
  // ---------------
  // GET SENSOR DATA
  // ---------------
  function DownLoadData(strSensorLabel) {
    // ---------------------------------
    let downloadDataQueryString = { id: strSensorLabel };
    console.log('...SENSORSTATE.JS...DOWNLOADDATA',strSensorLabel);
    // ----------------------------------
    let selSensor = state.sensors.find((sensor) => { 
      return sensor.sensorId === strSensorLabel 
    })
    axios.get(`api/sensors/sensordatadownload/${strSensorLabel}`,downloadDataQueryString)
    .then(res => console.log(res) )
    return selSensor.logsdata; 
  }
  // -----------
  function AbstractSensorStats(sensorsArr,callback) {
    // ---------
    let sensorsStatsData = [];
    try {
      let count =0;
      sensorsArr.forEach( _sensor => {
        let QueryString = { sensorId:_sensor.sensorId, dtuId:_sensor.dtuId };
        axios.get(`api/sensors/sensorstats/${_sensor.dtuId}&${_sensor.sensorId}`,QueryString).then(res => {
          ++count;
          sensorsStatsData.push(res.data);
          if (count === sensorsArr.length) {
            dispatch({ type:UPDATE_SENSORSTATS, payload: sensorsStatsData });
            callback(sensorsStatsData);
            // ---------
          }
        });
      })
    } catch (err) {
      dispatch({ type:SENSOR_ERROR, payload: err.response.msg });
    }
  }
  // -------------
  // UPDATE SENSOR
  // -------------
  const updateSensor = async sensor => {
    const config = {
      headers: { 'Content-Type': 'application/json' }
    };
    try {
      const res = await axios.put( `/api/sensors/${sensor._id}`, sensor, config);
      dispatch({ type:UPDATE_SENSOR, payload: res.data });
    } catch (err) {
      dispatch({ type:SENSOR_ERROR,payload: err.response.msg });
    }
  }
  // ----------
  // ADD SENSOR
  // ----------
  const addSensor = async (sensor) => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    try {
      const res = await axios.post('/api/sensors', sensor, config);
      console.log(res);
      dispatch({ type:ADD_SENSOR, payload: res.data });
    } catch (err) {
      console.log(err.response);
      dispatch({ type:SENSOR_ERROR, payload: err.response.msg });
    }
  }
  // --------------
  // DELETE SENSOR
  // --------------
  const deleteSensor = async id => {
    try {
      await axios.delete(`/api/sensors/${id}`);
      // --------------------------------------
      dispatch({ type:DELETE_SENSOR, payload: id });
    } catch (err) {
      dispatch({ type:SENSOR_ERROR, payload: err.response.msg });
    }
  };
  // --------------
  // FILTER SENSORS
  // --------------
  const filterSensors = text => {
    dispatch({ type:FILTER_SENSORS, payload: text });
  }  
  // ---------------------
  // CLEAR CURRENT CONTACT
  // ---------------------
  const clearCurrent = () => {
    dispatch({ type:CLEAR_CURRENT_SENSOR });
  };
  // ------------
  // CLEAR FILTER
  // ------------
  const clearFilter = () => {
    dispatch({ type:CLEAR_FILTER_SENSORS });
  };
  // ---------------
  // GET SENSOR DATA
  // ---------------
  const getSensorsData = () => {
    // ----
    dispatch({ type:GET_SENSORS_DATA});
    // -----
  }
  // ---------
  return (
    <SensorContext.Provider
      value={{
        fetchDateTime : state.fetchDateTime,
        sensors : state.sensors,
        wisensors : state.wisensors,
        sensorTypeMap : state.sensorTypeMap,
        plotSensorMap : state.plotSensorMap,
        rawsensors : state.rawsensors,
        current: state.current,
        filtered : state.filtered,
        sensorsData : state.sensorsData,
        sensorStatsData : state.sensorStatsData,
        locationSensorsMap : state.locationSensorsMap,
        error : state.error,
        loading : state.loading,
        setCurrent,
        addSensor,
        updateSensor,
        deleteSensor,
        getSensors,
        getSensorPlotData,
        getRawSensors,
        filterSensors,
        clearFilter,
        clearCurrent,
        getSensorsData,
        DownLoadData,
        AbstractSensorStats
      }}
    >
      {props.children}
    </SensorContext.Provider>
  );
};

export default SensorState;
