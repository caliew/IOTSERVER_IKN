import {
  SET_SENSORS,
  SET_PLOTSENSORDATA,
  CLEAR_PLOTSENSORDATA,
  SET_RAWSENSORS,
  SENSOR_ERROR,
  ADD_SENSOR,
  UPDATE_SENSOR,
  UPDATE_SENSORSTATS,
  DELETE_SENSOR,
  SET_CURRENT_SENSOR,
  CLEAR_CURRENT_SENSOR,
  FILTER_SENSORS,
  CLEAR_FILTER_SENSORS,
  CLEAR_SENSORS,
  GET_SENSORS_DATA
} from '../types';

/*
function randomExtend(minNum, maxNum) {
  if (arguments.length === 1) {
    return parseInt(Math.random() * minNum + 1, 10)
  } else {
    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
  }
}
*/
function parseFloat(str) {
  var float = 0, sign, mantissa, exp,
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
// -----------
function getReading(sensor) {
	const { logsdata } = sensor
	let reading;
	// ------------------
	switch (sensor.type)
	{
		case 'AIRRH(485)':
			reading = logsdata.length > 0 ? logsdata[0].DATAS[1]/10.0.toFixed(1) + '°C  ' + logsdata[0].DATAS[0]/10.0.toFixed(1) + '%': '°C %';
			break;
		case 'AIRFLW(485)':
			reading = logsdata.length > 0 ? Number(logsdata[0].DATAS[0]/10.0).toFixed(1) + ' m/s': '- m/s';
			break;
		case 'WTRPRS(485)':
      // ----- FLOATING VALUES
      // console.log(logsdata[0].RCV_BYTES,parseFloat(`0x${logsdata[0].RCV_BYTES[0]}${logsdata[0].RCV_BYTES[1]}`).toFixed(4))
			reading = logsdata.length > 0 ? (parseFloat(`0x${logsdata[0].RCV_BYTES[0]}${logsdata[0].RCV_BYTES[1]}`)/100.0).toFixed(2) : '0';
			break;
		case 'WTRTEMP(485)':
			reading = logsdata.length > 0 ? logsdata[0].DATAS[1]/10.0.toFixed(1): '0';
			break;
		case 'WTRRH(485)':
			reading = logsdata.length > 0 ? logsdata[0].DATAS[1]/10.0.toFixed(1) + '°C': '°C';
			break;
		case 'PWRMTR(485)':
      let PWRRDG = logsdata[0] ? `${logsdata[0].RCV_BYTES[0]}${logsdata[0].RCV_BYTES[1]}` : '';
			reading = logsdata.length > 0 ? Number(hexToSignedInt(PWRRDG)*0.01).toFixed(0) : null;
			break;
		case 'WISENSOR':
			reading = logsdata.length > 0 ? `${logsdata[0].Temperature.toFixed(1)}°C`: '°C';
			break;
		default:
			reading = null
			break;
	}
  // ----------------
  let Obj = { name:sensor.name, type:sensor.type, sensorId: sensor.sensorId, dtuId: sensor.dtuId, reading:reading }
  // -----------------
  return Obj;
}
function findSensor(sensors,dtuId,sensorId) {
  let sensor = sensors.find(sensor => (Number(sensor.dtuId) === dtuId && Number(sensor.sensorId) === sensorId));
  return sensor ? getReading(sensor) : '0';
}
// --------------
function createData(sensors) {
  // --------
  if (!sensors) {
    return null;
  }
  //  ----------
  return {
    CTW_A_TEMP1 : findSensor(sensors,201,4),
    CTW_A_TEMP2 : findSensor(sensors,201,36),
    CTW_A_FLOWRATE : findSensor(sensors,0,0),
    CTW_A_ELECTPWR : findSensor(sensors,0,0),

    CTW_A_CWS_PRESS1 : findSensor(sensors,201,65),
    CTW_A_CWS_PRESS2 : findSensor(sensors,201,5),
    CTW_A_CWR_PRESS  : findSensor(sensors,201,49),
    
    CTW_B_TEMP1 : findSensor(sensors,204,38),
    CTW_B_TEMP2 : findSensor(sensors,204,10),
    CTW_B_FLOWRATE : findSensor(sensors,0,0),
    CTW_B_ELECTPWR : findSensor(sensors,0,0),

    CTW_B_CWS_PRESS1 : findSensor(sensors,204,51),
    CTW_B_CWS_PRESS2 : findSensor(sensors,204,63),
    CTW_B_CWR_PRESS  : findSensor(sensors,204,15),
    
    WCPU_A_TEMP1 : findSensor(sensors,214,32),
    WCPU_A_TEMP2 : findSensor(sensors,214,34),
    WCPU_A_FLOWRATE : findSensor(sensors,0,0),
    WCPU_A_ELECTPWR : findSensor(sensors,0,0),
    WCPU_A_CWR_PRESS1 : findSensor(sensors,214,59),
    WCPU_A_CWR_PRESS2 : findSensor(sensors,214,45),
    WCPU_A_CWS_PRESS : findSensor(sensors,214,47),
    
    WCPU_B_TEMP1 : findSensor(sensors,215,22),
    WCPU_B_TEMP2 : findSensor(sensors,215,30),
    WCPU_B_FLOWRATE : findSensor(sensors,0,0),
    WCPU_B_ELECTPWR : findSensor(sensors,0,0),
    WCPU_B_CWS_PRESS1 : findSensor(sensors,215,31),
    WCPU_B_CWS_PRESS2 : findSensor(sensors,215,33),
    WCPU_B_CWR_PRESS : findSensor(sensors,215,43),

    AHU_A_TEMP1 : findSensor(sensors,202,52), // HEAT EXCHANGER
    AHU_A_TEMP2 : findSensor(sensors,202,52), //  14=>52 (FAULTY SENSOR TO BE REPLACED... CURRENTLY MAP SENSOR 52)
    AHU_A_FLOWRATE : findSensor(sensors,0,0),
    AHU_A_ELECTPWR : findSensor(sensors,0,0),
    AHU_A_CHR_PRESS1 : findSensor(sensors,202,9),
    AHU_A_CHR_PRESS2 : findSensor(sensors,202,11),
    AHU_A_CHS_PRESS : findSensor(sensors,202,19),
    
    AHU_B_TEMP1 : findSensor(sensors,209,50),
    AHU_B_TEMP2 : findSensor(sensors,209,48),
    AHU_B_FLOWRATE : findSensor(sensors,0,0),
    AHU_B_ELECTPWR : findSensor(sensors,0,0),
    AHU_B_CHR_PRESS1 : findSensor(sensors,209,27),
    AHU_B_CHR_PRESS2 : findSensor(sensors,209,29),
    AHU_B_CHS_PRESS : findSensor(sensors,209,39),
    
    CHILLER_A_CH_TEMP1 : findSensor(sensors,207,16),
    CHILLER_A_CH_TEMP2 : findSensor(sensors,207,44),
    CHILLER_A_CH_FLOWRATE : findSensor(sensors,0,0),
    CHILLER_A_CW_TEMP1 : findSensor(sensors,207,12),
    CHILLER_A_CW_TEMP2 : findSensor(sensors,207,18),
    CHILLER_A_CW_FLOWRATE : findSensor(sensors,0,0),
    
    CHILLER_B_CH_TEMP1 : findSensor(sensors,200,46),
    CHILLER_B_CH_TEMP2 : findSensor(sensors,200,42),
    CHILLER_B_CH_FLOWRATE : findSensor(sensors,0,0),
    CHILLER_B_CW_TEMP1 : findSensor(sensors,205,40),
    CHILLER_B_CW_TEMP2 : findSensor(sensors,205,8),
    CHILLER_B_CW_FLOWRATE : findSensor(sensors,0,0),

    CHILLER_A_ELECTPWR : findSensor(sensors,0,0),
    CHILLER_B_ELECTPWR : findSensor(sensors,0,0),

    CHILLER_A_CHS_PRESS1 : findSensor(sensors,207,35),
    CHILLER_A_CHS_PRESS2 : findSensor(sensors,207,37),
    CHILLER_A_CHR_PRESS : findSensor(sensors,207,21),

    CHILLER_A_CWS_PRESS1 : findSensor(sensors,207,23),
    CHILLER_A_CWS_PRESS2 : findSensor(sensors,207,25),
    CHILLER_A_CWR_PRESS : findSensor(sensors,207,17),

    CHILLER_B_CHS_PRESS1 : findSensor(sensors,200,1),
    CHILLER_B_CHS_PRESS2 : findSensor(sensors,200,3),
    CHILLER_B_CHR_PRESS : findSensor(sensors,200,41),

    CHILLER_B_CWS_PRESS1 : findSensor(sensors,205,55),
    CHILLER_B_CWS_PRESS2 : findSensor(sensors,205,57),
    CHILLER_B_CWR_PRESS : findSensor(sensors,205,90),

    AIR_COMPRESSOR1 : findSensor(sensors,219,40),
    AIR_COMPRESSOR2 : findSensor(sensors,215,41),
    AIR_COMPRESSOR3 : findSensor(sensors,215,42),

    AIRFLOW_RH1 : findSensor(sensors,206,20),
    AIRFLOW_RH2 : findSensor(sensors,215,21),
    AIRFLOW_RH3 : findSensor(sensors,203,22),

    CHWP_1 : findSensor(sensors,205,90),
    CHWP_2 : findSensor(sensors,205,90),
    CHWP_3 : findSensor(sensors,205,90),

    AIRFLW_VEL1 : findSensor(sensors,203,60),
    AIRFLW_VEL2 : findSensor(sensors,219,61),
    AIRFLW_VEL3 : findSensor(sensors,217,62),
    AIRFLW_VEL4 : findSensor(sensors,203,63),
    AIRFLW_VEL5 : findSensor(sensors,206,64),
    AIRFLW_VEL6 : findSensor(sensors,206,65),
    AIRFLW_VEL7 : findSensor(sensors,203,66),
    AIRFLW_VEL8 : findSensor(sensors,203,67),
    AIRFLW_VEL9 : findSensor(sensors,206,68),
    AIRFLW_VEL10 : findSensor(sensors,215,69),

    PWRMTR_01 : findSensor(sensors,107,1),
    PWRMTR_02 : findSensor(sensors,107,2),
    PWRMTR_03 : findSensor(sensors,101,3),
    PWRMTR_04 : findSensor(sensors,111,4),
    PWRMTR_05 : findSensor(sensors,110,5),
    PWRMTR_06 : findSensor(sensors,113,6),
    PWRMTR_07 : findSensor(sensors,112,7),
    PWRMTR_08 : findSensor(sensors,112,8),
    PWRMTR_09 : findSensor(sensors,111,9),
    PWRMTR_10 : findSensor(sensors,100,19),
    PWRMTR_11 : findSensor(sensors,102,11),
    PWRMTR_12 : findSensor(sensors,100,12),
    PWRMTR_13 : findSensor(sensors,112,14),
    PWRMTR_14 : findSensor(sensors,110,15),
    PWRMTR_15 : findSensor(sensors,110,16),
    PWRMTR_16 : findSensor(sensors,100,17),
    PWRMTR_17 : findSensor(sensors,100,18),
    PWRMTR_18 : findSensor(sensors,100,20),
    PWRMTR_19 : findSensor(sensors,1,1),
    PWRMTR_20 : findSensor(sensors,2,1),
    PWRMTR_21 : findSensor(sensors,3,1),
    PWRMTR_22 : findSensor(sensors,3,2),
    PWRMTR_23 : findSensor(sensors,4,1),
    PWRMTR_24 : findSensor(sensors,4,2),
    PWRMTR_25 : findSensor(sensors,5,1),
    PWRMTR_26 : findSensor(sensors,5,2),
    PWRMTR_27 : findSensor(sensors,6,1),
    PWRMTR_28 : findSensor(sensors,6,2),
    PWRMTR_29 : findSensor(sensors,7,1),
    PWRMTR_30 : findSensor(sensors,7,2),

    NIPPON_1: findSensor(sensors,50,101)

  };
  // -------
}
// -------
const sensorReducer = (state, action) => {
  // ----------------
  switch (action.type) {
    case SET_SENSORS:
      let _mapSensorType = action.payload.reduce((map,sensor) => { 
        if (map[sensor.type] === undefined) {
          map[sensor.type] = [];
          map[sensor.type].push(sensor);
        } else {
          map[sensor.type].push(sensor); 
        };
        return map; },{}
        );
      return {
        ...state,
        sensors: action.payload,
        wisensors:action.payload.filter(el => el.type === 'WISENSOR'),
        sensorTypeMap : _mapSensorType,
        locationSensorsMap : action.payload.reduce((map,sensor) => { 
            if (map[sensor.location] === undefined) {
            map[sensor.location] = [];
            map[sensor.location].push(sensor);
          } else {
            map[sensor.location].push(sensor); };
          return map; },{}),
        loading: false
      };
    case CLEAR_PLOTSENSORDATA:
      return {
        ...state,
        plotSensorMap : null,
        loading:true
      };
    case SET_PLOTSENSORDATA:
      let _plotsensormap = action.payload.reduce((map,sensor) => { 
        if (map[sensor.type] === undefined) {
          map[sensor.type] = [];
          map[sensor.type].push(sensor);
        } else {
          map[sensor.type].push(sensor); 
        };
        return map; },{}
        );
      return {
        ...state,
        plotSensorMap : _plotsensormap,
        loading: false
      };
    case SET_RAWSENSORS:
      return {
        ...state,
        rawsensors:action.payload,
        loading: false
      };
    case ADD_SENSOR:
      console.log(`... REDUCER ADD SENSOR...`)
      console.log(action.payload)
      return {
        ...state,
        sensors: [action.payload, ...state.sensors],
        loading: false
      };
    case UPDATE_SENSOR:
      console.log(`... REDUCER UPDATE SENSOR...`)
      return {
        ...state,
        sensors: state.sensors.map(sensor =>
          sensor._id === action.payload._id ? action.payload : sensor
        ),
        loading: false
      };
    case UPDATE_SENSORSTATS:
      return {
        ...state,
        sensorStatsData: action.payload,
        loading:false
      };
    case DELETE_SENSOR:
      console.log(`... REDUCER DELETE SENSOR...`)
      return {
        ...state,
        sensors: state.sensors.filter(
          contact => contact._id !== action.payload
        ),
        loading: false
      };
    case CLEAR_SENSORS:
      console.log(`... REDUCER CLEAR SENSORS...`)
      return {
        ...state,
        sensors: null,
        filtered: null,
        error: null,
        current: null
      };
    case SET_CURRENT_SENSOR:
      return {
        ...state,
        current: action.payload
      };
    case CLEAR_CURRENT_SENSOR:
      return {
        ...state,
        current: null
      };
    case FILTER_SENSORS:
      const regex = new RegExp(`${action.payload}`, 'gi');
      return {
        ...state,
        filtered: state.sensors.filter(sensor => {
          return sensor.name.match(regex) || sensor.type.match(regex) || sensor.dtuId.match(regex) || sensor.sensorId.match(regex);
        })
      };
    case CLEAR_FILTER_SENSORS:
      console.log(`... REDUCER CLEAR FILTERED SENSOR...`)
      return {
        ...state,
        filtered: null
      };
    case GET_SENSORS_DATA :
      return {
        ...state,
        sensorsData : createData(state.sensors)
      };
    case SENSOR_ERROR:
      return {
        ...state,
        error: action.payload
      };
    default:
      return state;
  }
};

export default sensorReducer;