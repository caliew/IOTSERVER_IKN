import React, { useContext,useState,useEffect,useRef } from 'react';
import SensorContext from '../../context/sensor/sensorContext';
import { MDBContainer, MDBTable,MDBTableHead,MDBTableBody,MDBCol,MDBCard,MDBBtn,MDBInput,MDBRow,MDBBox } from 'mdbreact';
import ReactEcharts from "echarts-for-react";
import { CSVLink } from 'react-csv';
import AlertContext from '../../context/alert/alertContext';
import DateRangePicker from '@wojtekmaj/react-daterange-picker'

// ----------------------
const ChartsPage = () => {
	//	-----------------
  const [keys, setKEYS] = useState([]);
	const [RHTempMin, setBandRHTempMin] = useState('0');
	const [RHTempMax, setBandRHTempMax] = useState('0');
	const [RHHumdMin, setBandRHHumdMin] = useState('0');
	const [RHHumdMax, setBandRHHumdMax] = useState('0');
	const [AIRVelMin, setBandAIRVelMin] = useState('0');
	const [AIRVelMax, setBandAIRVelMax] = useState('0');
	const [PRESSMin, setBandPRESSMin] = useState('0');
	const [PRESSMax, setBandPRESSMax] = useState('0');
	// ------------------------------------------------
	const [plotRHSensors,setPlotRHSensor] = useState([]);
	const [plotVELSensors,setPlotVELSensor] = useState([]);
	const [plotPWRMTRSensors,setPlotPWRMTRSensor] = useState([]);
	const [plotPRESSSensors,setPlotPRESSSensor] = useState([]);
	// -------------------
  const [reportData1,setReportData1] = useState([]);
	const [fileName1, setFileName1] = useState(null);
  const [headers1,setHeaders1] = useState([]);
	// -------------
  const [reportData2,setReportData2] = useState([]);
	const [fileName2, setFileName2] = useState(null);
  const [headers2,setHeaders2] = useState([]);
	// ---------
  const [reportData3,setReportData3] = useState([]);
	const [fileName3, setFileName3] = useState(null);
  const [headers3,setHeaders3] = useState([]);
	// ---------
  const [reportData4,setReportData4] = useState([]);
	const [fileName4, setFileName4] = useState(null);
  const [headers4,setHeaders4] = useState([]);
	// ---------
	const [key,setKEY] = useState(null);
	const [selection,setSelection] = useState(null);
	const [period,setPeriod] = useState(0);
  const [dateRange, onDateChangePicker] = useState([null, null]);
	const [_loadMode, setLoadData] = useState(0);
		// -------------------------------------
	const alertContext = useContext(AlertContext);
	const sensorContext = useContext(SensorContext);
	const { setAlert } = alertContext;
	const linkRef = useRef();
  const { plotSensorMap, getSensorPlotData } = sensorContext;
  // --------------
	const getOptionRHA = ({title}) => {
		// ----------------
		return ({
			title: { text: `${title}` },
			tooltip: { trigger: "axis" },
			legend: { width: "83%", height: "17%", bottom: "91%", top: "10%", data: getLegendsRHData() },
			xAxis: { type: 'time', boundaryGap: false, splitLine: { show: false } },
			yAxis: { type: 'value', axisLabel: { formatter: '{value} C' }, boundaryGap: [0, '100%'], splitLine: { show: false } },		
			grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
			toolbox: { show: true, feature: { dataZoom: { yAxisIndex: 'none' }, dataView: { readOnly: false }, 
								magicType: { type: ['line', 'bar'] }, restore: {}, saveAsImage: {} } },
			dataZoom: [
				{ type: 'slider', xAxisIndex: 0, filterMode: 'none' },
				{ type: 'slider', yAxisIndex: 0, filterMode: 'none' },
				{ type: 'inside', xAxisIndex: 0, filterMode: 'none' },
				{ type: 'inside', yAxisIndex: 0, filterMode: 'none' }
			],
			series: getSeriesRH(0)
		})
	};
	const getOptionRHB = ({title}) => {
		// ----------
		return ({
			title: { text: `${title}` },
			tooltip: { trigger: "axis" },
			legend: { 
				width: "83%",
				height: "17%",
				bottom: "91%",
				top: "10%",
				data: getLegendsRHData()
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true
			},
			toolbox: {
				show: true,
				feature: {
					dataZoom: { yAxisIndex: 'none' },
					dataView: { readOnly: false },
					magicType: { type: ['line', 'bar'] },
					restore: {},
					saveAsImage: {},
				}
			},
			xAxis: {
				type: 'time',
				boundaryGap: false,
				splitLine: { show: false }
			},
			yAxis: {
				type: 'value',
				axisLabel: { formatter: '{value} %' },
				boundaryGap: [0, '100%'],
				splitLine: { show: false }
			},
			dataZoom: [
				{
					type: 'slider',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'slider',
					yAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					yAxisIndex: 0,
					filterMode: 'none'
				}
			],
			series: getSeriesRH(1)
		})
	};
	const getOptionVEL = ({title}) => {
		return ({
			title: { text: `${title}` },
			tooltip: { trigger: "axis" },
			legend: { 
				width: "83%",
				height: "17%",
				bottom: "91%",
				top: "10%",
				data: getLegends2Data()
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true
			},
			toolbox: {
				show: true,
				feature: {
					dataZoom: { yAxisIndex: 'none' },
					dataView: { readOnly: false },
					magicType: { type: ['line', 'bar'] },
					restore: {},
					saveAsImage: {},
				}
			},
			xAxis: {
				type: 'time',
				boundaryGap: false,
				splitLine: { show: false }
			},
			yAxis: {
				type: 'value',
				axisLabel: { formatter: '{value} m/s' },
				boundaryGap: [0, '100%'],
				splitLine: { show: false }
			},
			dataZoom: [
				{
					type: 'slider',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'slider',
					yAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					yAxisIndex: 0,
					filterMode: 'none'
				}
			],
			series: getSeriesVELOCITY(0)
		})
	};
	// --------
	const getOptionPRESS = ({title}) => {
		return ({
			title: { text: `${title}` },
			tooltip: { trigger: "axis" },
			legend: { 
				width: "83%",
				height: "17%",
				bottom: "91%",
				top: "10%"
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true
			},
			toolbox: {
				show: true,
				feature: {
					dataZoom: { yAxisIndex: 'none' },
					dataView: { readOnly: false },
					magicType: { type: ['line', 'bar'] },
					restore: {},
					saveAsImage: {},
				}
			},
			xAxis: {
				type: 'time',
				boundaryGap: false,
				splitLine: { show: false }
			},
			yAxis: {
				type: 'value',
				axisLabel: { formatter: '{value} bar' },
				boundaryGap: [0, '100%'],
				splitLine: { show: false }
			},
			dataZoom: [
				{
					type: 'slider',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'slider',
					yAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					yAxisIndex: 0,
					filterMode: 'none'
				}
			],
			series: getSeriesPRESSURE(0)
		})
	};
	const getOptionPWRMTRTOTAL = ({title}) => {
		return ({
			title: { text: `${title}` },
			tooltip: { trigger: "axis" },
			legend: { 
				width: "83%",
				height: "17%",
				bottom: "91%",
				top: "10%"
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true
			},
			toolbox: {
				show: true,
				feature: {
					dataZoom: { yAxisIndex: 'none' },
					dataView: { readOnly: false },
					magicType: { type: ['line', 'bar'] },
					restore: {},
					saveAsImage: {},
				}
			},
			xAxis: {
				type: 'time',
				boundaryGap: false,
				splitLine: { show: false }
			},
			yAxis: {
				type: 'value',
				axisLabel: { formatter: '{value} kWh' },
				boundaryGap: [0, '100%'],
				splitLine: { show: false }
			},			
			dataZoom: [
				{
					type: 'slider',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'slider',
					yAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					yAxisIndex: 0,
					filterMode: 'none'
				}
			],
			series: getSeriesPWRMTR(0)
		})
	};
	const getOptionPWRMTRRATE = ({title}) => {
		return ({
			title: { text: `${title}` },
			tooltip: { trigger: "axis" },
			legend: { 
				width: "83%",
				height: "17%",
				bottom: "91%",
				top: "10%"
			},
			grid: {
				left: "3%",
				right: "4%",
				bottom: "3%",
				containLabel: true
			},
			toolbox: {
				show: true,
				feature: {
					dataZoom: { yAxisIndex: 'none' },
					dataView: { 
						show:true, 
						readOnly: false },
					magicType: { type: ['line', 'bar'] },
					restore: {},
					saveAsImage: {},
				}
			},
			xAxis: {
				type: 'time',
				boundaryGap: false,
				splitLine: { show: false }
			},
			yAxis: {
				type: 'value',
				axisLabel: { formatter: '{value} kWh/h' },
				boundaryGap: [0, '100%'],
				splitLine: { show: false }
			},
			dataZoom: [
				{
					type: 'slider',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'slider',
					yAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					xAxisIndex: 0,
					filterMode: 'none'
				},
				{
					type: 'inside',
					yAxisIndex: 0,
					filterMode: 'none'
				}
			],
			series: getSeriesPWRMTR(1)
		})
	};
	// --------
	const getLegendsRHData = () => {
		let _datas = [];
		plotRHSensors && plotRHSensors.forEach( _data => {
			_datas.push(_data.name)
		})
		return _datas;
	}
	const getLegends2Data = () => {
		let _datas = [];
		plotVELSensors && plotVELSensors.forEach( _data => {
			_datas.push(_data.name)
		})
		return _datas;
	}
	// ----------------
	const getSeriesRH = (index) => {
		// ----------------------
		let _seriesdata = [];
		plotRHSensors && plotRHSensors.forEach( _sensor => {
			// ---------------------------------
			let _rslt = getSensorData(_sensor,index);
			// ---------------
			let _object = {
				name : _sensor.name,
				type : 'line',
				smooth: false,
				symbol: 'none',
				data : _rslt,
				duration: 100,
				markArea: {
					itemStyle: {
						color: 'rgba(0, 255, 0, 0.1)'
					},
					data: [
						[ { name: '',yAxis: index===0 ? `${RHTempMin}`:`${RHHumdMin}`},{ yAxis: index===0 ? `${RHTempMax}`:`${RHHumdMax}`} ],
					]
				}	
			}
			_seriesdata.push(_object)
		})
		// ---------------------
		return _seriesdata;
	}
	const getSeriesVELOCITY = (index) => {
		// ----------------------
		let _seriesdata = [];
		plotVELSensors && plotVELSensors.forEach( _sensor => {
			// ---------------------------------
			let _rslt = getSensorData(_sensor,index);
			// ---------------
			let _object = {
				name : _sensor.name,
				type : 'line',
				smooth: false,
				symbol: 'none',
				data : _rslt,
				duration: 100,
				markArea: {
					itemStyle: {
						color: 'rgba(0, 255, 0, 0.1)'
					},
					data: [
						[ { name: '',yAxis: `${AIRVelMin}`},{yAxis: `${AIRVelMax}`} ],
					]
				}
			}
			_seriesdata.push(_object)
		})
		// ---------------------
		return _seriesdata;
	}
	const getSeriesPRESSURE = (index) => {
		// ----------------------
		let _seriesdata = [];
		plotPRESSSensors && plotPRESSSensors.forEach( _sensor => {
			// ---------------------------------
			let _rslt = getSensorData(_sensor,index);
			// ---------------
			let _object = {
				name : _sensor.name,
				type : 'line',
				smooth: false,
				symbol: 'none',
				data : _rslt,
				duration: 100,
				markArea: {
					itemStyle: {
						color: 'rgba(0, 255, 0, 0.1)'
					},
					data: [
						[ { name: '',yAxis: `${PRESSMin}`},{yAxis: `${PRESSMax}`} ],
					]
				}
			}
			_seriesdata.push(_object)
		})
		// ---------------------
		return _seriesdata;
	}
	const getSeriesPWRMTR = (index) => {
		// ----------------------
		let _seriesdata = [];
		plotPWRMTRSensors && plotPWRMTRSensors.forEach( _sensor => {
			// ---------------------------------
			let _rslt = getSensorData(_sensor,index);
			// ---------------
			let _object = {
				name : _sensor.name,
				type : 'line',
				step: 'start',
				smooth: false,
				symbol: 'none',
				data : _rslt,
				duration: 100,
				markArea: {
					itemStyle: {
						color: 'rgba(0, 255, 0, 0.1)'
					},
					data: [
						[ { name: '',yAxis: ''},{yAxis: ''} ],
					]
				}
			}
			_seriesdata.push(_object)
		})
		// ---------------------
		return _seriesdata;
	}
	// ----------------
	function diff_hours(dt2, dt1) 
	{
 
	 var diff =(dt2.getTime() - dt1.getTime()) / 1000;
	 diff /= (60 * 60);
	 return diff.toFixed(2);
	}
	// -----------------
	const getSensorData = (sensor,nIndex) => {
		// ---------------
		let dataArray = [];
		let _reading0,_reading;
		let _DATEIME0;
			// -------------------------
		sensor.logsdata && sensor.logsdata.map( (_data,index) => {
			// -----------
			let _dateTime = new Date(_data.TIMESTAMP);
			let _timeDIFF = (index===0) ? 0 : diff_hours(_DATEIME0,_dateTime)
			// -----------
			switch (sensor.type) {
				case "WTRPRS(485)":
					_reading = `0x${_data.RCV_BYTES[0]}${_data.RCV_BYTES[1]}`;
					_reading = parseFloat(_reading);
					_reading = _reading.toFixed(2)/100.0;
					_reading = Number(_reading);
					break;
				case "AIRRH(485)":
					_reading = nIndex === 0 ? Number(_data.DATAS[1])/10.0 : Number(_data.DATAS[0])/10.0;
					break;
				case "WTRTEMP(485)":
					_reading = nIndex === 0 ? Number(_data.DATAS[1])/10.0 : null;
					break;
				case "AIRFLW(485)":
					_reading = Number(_data.DATAS[0])/10.0;
					break;
				case "PWRMTR(485)":
					let _HEXStr = _data.RCV_BYTES[0] + _data.RCV_BYTES[1];
					let _HEXInt = parseInt(_HEXStr,16) * 0.01;
					let _reading1 = Number(_HEXInt);
					if (index === 0) {
						_reading = null;					
					} else {
						_reading = _reading0 - _reading1;
						// _reading = _reading /(diff_hours(_DATEIME0,_dateTime));
						_reading = _reading / _timeDIFF;
						_reading = _reading.toFixed(2);
					}
					_reading0 = _reading1;
					_reading = nIndex === 0 ? _reading1 : _reading;
					break;
				case "WISENSOR":
					_reading = nIndex === 0 ? (_data.Temperature ? Number(_data.Temperature):null) : ( _data.Humidity ? Number(_data.Humidity) : null) ;
					break;
				default:
					break;
			}
			// ----------------------
			_DATEIME0 = _dateTime;
			if (Math.abs(_timeDIFF) > 2.50) { 
				console.log(index,_reading,_dateTime.toTimeString(),_timeDIFF);
				dataArray.push([_dateTime,null]);
			}
			if (_reading !== null && _reading  !== -999) {
				 dataArray.push([_dateTime,_reading]);
			}
			// ----------------------
			return null;
		})
		// -------------
		return dataArray;
	}
	// ----------------------
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
	// --------------
	// INITIALIZATION
	// --------------
  useEffect(()=>{
    // -----------------
		if (plotSensorMap !==null) {
			let _keys = Object.keys(plotSensorMap);
			setKEYS(_keys);
		}
  },[plotSensorMap])
  // ------------------------
	const HandleSelection = (_key) => {
		// ---------------
		let object = plotSensorMap[_key];
		setSelection(object.sort(compareByName));
		setKEY(_key);
		// ---------------
	}
	const SelectedSensor = (sensor) => {
		// -----------------
		let _found;
		// -------------------------------
		// plotRHSensors = TEMPERATURE & HUMIDITY
		// plotVELSensors = VELOCITY
		// plotPRESSSensors = PRESSURE
		// plotPWRMTRSensors = POWER METER
		// ---------------------------------
		if (sensor.type === 'PWRMTR(485)') {
			_found = plotPWRMTRSensors.find( el => el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId)
			if (_found === undefined) {
				let _plotPWRMTRSensors = [ ...plotPWRMTRSensors ];
				_plotPWRMTRSensors.push(sensor);
				setPlotPWRMTRSensor(_plotPWRMTRSensors);
			} else {
				let _plotPWRMTRSensors = plotPWRMTRSensors.filter( el =>  !(el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
				setPlotPWRMTRSensor(_plotPWRMTRSensors);
			}
		}
		// --------------------------------
		if (sensor.type === 'WTRPRS(485)') {
			_found = plotPRESSSensors.find( el => el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId)
			if (_found === undefined) {
				let _plotPRESSSensors = [ ...plotPRESSSensors ];
				_plotPRESSSensors.push(sensor);
				setPlotPRESSSensor(_plotPRESSSensors);
			} else {
				let _plotPRESSSensors = plotPRESSSensors.filter( el =>  !(el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
				setPlotPRESSSensor(_plotPRESSSensors);
			}
		}
		// ----------------------
		if (sensor.type === 'AIRFLW(485)') {
			_found = plotVELSensors.find( el => el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId)
			if (_found === undefined) {
				let _plotVELsensors = [ ...plotVELSensors ];
				_plotVELsensors.push(sensor);
				setPlotVELSensor(_plotVELsensors);
			} else {
				let _plotVELsensors = plotVELSensors.filter( el =>  !(el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
				setPlotVELSensor(_plotVELsensors);
			}
		}
		// ----------------------
		if (sensor.type === 'WISENSOR' || sensor.type==='AIRRH(485)' || sensor.type==='WTRTEMP(485)') {
			_found = plotRHSensors.find( el => el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId)
			if (_found === undefined) {
				let _plotRHsensors = [ ...plotRHSensors ];
				_plotRHsensors.push(sensor);
				setPlotRHSensor(_plotRHsensors);
			} else {
				let _plotRHsensors = plotRHSensors.filter( el =>  !(el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
				setPlotRHSensor(_plotRHsensors);
			}
		}
		// ---------
	}
	const getPWRMETER = (RCV_BYTES) => {
		let _HEXStr = RCV_BYTES[0] + RCV_BYTES[1];
		let _HEXInt = parseInt(_HEXStr,16) * 0.01;
		let _reading = Number(_HEXInt);
		return _reading.toFixed(0);
	}
	const getWeekOfYear = (_dateTime) => {
		let currentdate = new Date();
		let oneJan = new Date(currentdate.getFullYear(),0,1);
		let numberOfDays = Math.floor((_dateTime - oneJan) / (24 * 60 * 60 * 1000));
		let weekOfYear = _dateTime ? Math.ceil(( _dateTime.getDay() + numberOfDays) / 7) : -1 ;
		return weekOfYear;
	}
	const getPWRMTRSTATS = () => {
		let sensorDataArr = [];
		plotPWRMTRSensors.map((item, i) => {
			let sensorName = item.name;
			let sensordata = item.logsdata;
			let weekPWRReading = {};
			let _min = 999999;
			let _max = null;
			// -----------
			sensordata.map( _data => {
				let _dateTime = new Date(_data.TIMESTAMP)
				let _weekOfYear = getWeekOfYear(_dateTime)
				let _PWRREADING = getPWRMETER(_data.RCV_BYTES);
				if (_min > _PWRREADING) _min = _PWRREADING;
				if (_max < _PWRREADING) _max = _PWRREADING;
				weekPWRReading[_weekOfYear] = { DATE:_dateTime , READING:_PWRREADING };
				return null;
			})
			let obj = {
				name:sensorName,
				sensordata,
				weekPWRReading,
				_min, _max
			}
			sensorDataArr.push(obj);
			return null;
		})
		return ( 
		<MDBTable>
			<MDBTableHead><td >NAME</td><th>WEEK</th><th>MIN (KWh)</th><th>MAX (kWh)</th><th>kWhr</th></MDBTableHead>
				<MDBTableBody>
					{
						sensorDataArr.map((item, i) => {
							let keys = Object.keys(item.weekPWRReading);
							return (
								<tr>
									<td>{item.name}</td>
									<td>{keys[0]}</td>
									<td>{item._min}</td>
									<td>{item._max}</td>
									<td>{item._max - item._min}</td>
								</tr>
								)
							})
					}
				</MDBTableBody>
		</MDBTable>
		)
	}
	const checkState = (sensor) => {
		let _found1 = plotRHSensors.find( el => (el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
		let _found2 = plotVELSensors.find( el => (el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
		let _found3 = plotPRESSSensors.find( el => (el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
		let _found4 = plotPWRMTRSensors.find( el => (el.dtuId === sensor.dtuId && el.sensorId === sensor.sensorId))
		// ----------------------
		if (_found1 === undefined && _found2 === undefined && _found3 === undefined && _found4 === undefined) {
			return false;
		} else {
			return true;
		}
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
  const csvReport1 = {
    data: reportData1,
    headers: headers1,
    filename: fileName1
  };
  const csvReport2 = {
    data: reportData2,
    headers: headers2,
    filename: fileName2
  };
  const csvReport3 = {
    data: reportData3,
    headers: headers3,
    filename: fileName3
  };
  const csvReport4 = {
    data: reportData4,
    headers: headers4,
    filename: fileName4
  };
	// --------
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
  };
	// -------
	async function cvsDownloadsAll(_label) {
		await csvRHMTR(_label);
		await csvPWRMTR(_label);
		await csvPRESSMTR(_label);
		await csvAIRFLOWMTR(_label);
	}
	function csvPWRMTR(_label) {
		if (plotPWRMTRSensors.length === 0) {
			return;
		}
		// ----------
		setFileName1(`${_label}_PWRMTR.csv`);
		const _reportData = [];
		const _reportHeader = [{label:'DATE',key:'date'},{label:'time',key:'time'},{label:'modelID',key:'modelID'},
					{label:'ELECT PWR (kWh)',key:'kWh'}];
		setHeaders1(_reportHeader);
		// -----------------------
		plotPWRMTRSensors.forEach(element => {
			// ----------
			let _objMap = plotSensorMap[element.type];
			const logsdata = element.logsdata;
			let _foundObject = _objMap.find(_elm => _elm.dtuId === element.dtuId && _elm.sensorId === element.sensorId);
			// --------------------
			for (let i=0; i< logsdata.length; i++) {
				// --------------
				const {TIMESTAMP,RCV_BYTES}  = logsdata[i];
				let _kWhr = (hexToSignedInt(RCV_BYTES[0]+RCV_BYTES[1])*0.01).toFixed(0);
				const _date = new Date(TIMESTAMP);
				let data = { date:_date.toLocaleDateString(), time:`${_date.toLocaleDateString()} ${_date.toLocaleTimeString([], {
					hour: '2-digit',minute: '2-digit'})}`,
					modelID:_foundObject.name,
					kWh:_kWhr};
				_reportData.push(data);
			}
			_reportData.push({});
		});
		// ----------
		setReportData1(_reportData);
	}
	function csvRHMTR(_label) {
		// ------
		if (plotRHSensors.length === 0 ) return;
		// ------
		setFileName2(`${_label}_RHMTR.csv`);
		const _reportData = [];
		const _reportHeader = [{label:'DATE',key:'date'},{label:'time',key:'time'},{label:'modelID',key:'modelID'},
					{label:'TEMP (C)',key:'Temperature'},{label:'HUMD (%)',key:'Humidity'}];
		setHeaders2(_reportHeader);
		// -----------------------
		plotRHSensors.forEach(element => {
			// ---------
			let _objMap = plotSensorMap[element.type];
			const logsdata = element.logsdata;
			let _foundObject = _objMap.find(_elm => _elm.dtuId === element.dtuId && _elm.sensorId === element.sensorId);
			// --------------------
			for (let i=0; i< logsdata.length; i++) {
				// --------------
				const {TIMESTAMP,Temperature,Humidity,DATAS}  = logsdata[i];
				const _date = new Date(TIMESTAMP);
				let data = { date:_date.toLocaleDateString(), time:`${_date.toLocaleDateString()} ${_date.toLocaleTimeString([], {
					hour: '2-digit',minute: '2-digit'})}`,
					modelID:_foundObject.name};
				// -------------
				if (element.type==='WISENSOR') {
					data['Temperature'] = Temperature;
					data['Humidity'] = Humidity;
				}
				if (element.type==='WTRTEMP(485)') {
					let _reading = DATAS ? Number(DATAS[1])/10.0 : null
					data['Temperature'] = _reading;
				}
				if (element.type==='AIRRH(485)') {
					let _reading1 = DATAS ? Number(DATAS[0])/10.0 : null
					let _reading2 = DATAS ? Number(DATAS[1])/10.0 : null
					data['Temperature'] = _reading2;
					data['Humidity'] = _reading1;
				}
				_reportData.push(data);
			}
			_reportData.push({});
		});
		// ----------
		setReportData2(_reportData);
	}
	function csvPRESSMTR(_label) {
		if (plotPRESSSensors.length === 0) {
			return;
		}
		// ----------
		setFileName3(`${_label}_PRESSMTR.csv`);
		const _reportData = [];
		const _reportHeader = [{label:'DATE',key:'date'},{label:'time',key:'time'},{label:'modelID',key:'modelID'},
					{label:'PRESSURE (bar)',key:'PRESS'}];
		setHeaders3(_reportHeader);
		// -----------------------
		plotPRESSSensors.forEach(element => {
			// ----------
			let _objMap = plotSensorMap[element.type];
			const logsdata = element.logsdata;
			let _foundObject = _objMap.find(_elm => _elm.dtuId === element.dtuId && _elm.sensorId === element.sensorId);
			// --------------------
			for (let i=0; i< logsdata.length; i++) {
				// --------------
				const {TIMESTAMP,RCV_BYTES}  = logsdata[i];
				let _reading = `0x${RCV_BYTES[0]}${RCV_BYTES[1]}`;
				_reading = parseFloat(_reading);
				_reading = _reading.toFixed(2)/100.0;
				_reading = Number(_reading);
				const _date = new Date(TIMESTAMP);
				let data = { date:_date.toLocaleDateString(), time:`${_date.toLocaleDateString()} ${_date.toLocaleTimeString([], {
					hour: '2-digit',minute: '2-digit'})}`,
					modelID:_foundObject.name,
					PRESS:_reading};
				_reportData.push(data);
			}
			_reportData.push({});
		});
		// ----------
		setReportData3(_reportData);
	}
	function csvAIRFLOWMTR(_label) {
		if (plotVELSensors.length === 0) {
			return;
		}
		// ----------
		setFileName4(`${_label}_AIRFLWMTR.csv`);
		const _reportData = [];
		const _reportHeader = [{label:'DATE',key:'date'},{label:'time',key:'time'},{label:'modelID',key:'modelID'},
					{label:'VELOCITY (m/s)',key:'AIRFLOW'}];
		setHeaders4(_reportHeader);
		// -----------------------
		plotVELSensors.forEach(element => {
			// ----------
			let _objMap = plotSensorMap[element.type];
			const logsdata = element.logsdata;
			let _foundObject = _objMap.find(_elm => _elm.dtuId === element.dtuId && _elm.sensorId === element.sensorId);
			// --------------------
			for (let i=0; i< logsdata.length; i++) {
				// --------------
				const {TIMESTAMP,DATAS}  = logsdata[i];
				let _reading = Number(DATAS[0])/10.0;
				const _date = new Date(TIMESTAMP);
				let data = { date:_date.toLocaleDateString(), time:`${_date.toLocaleDateString()} ${_date.toLocaleTimeString([], {
					hour: '2-digit',minute: '2-digit'})}`,
					modelID:_foundObject.name,
					AIRFLOW:_reading};
				_reportData.push(data);
			}
			_reportData.push({});
		});
		// ----------
		setReportData4(_reportData);
	}
	// ----------
	const HandleDownload = () => {
		// --------------------------
		let _dateTime = new Date();
		let _label = `${_dateTime.getDate()}_${_dateTime.getMonth()}_${_dateTime.getFullYear()}`
		// ----------------
		setAlert('PREPARE DATA TO CVS FILE FOR DOWNLOAD','primary')
		cvsDownloadsAll(_label);
		// ---------------
	}
	// -------
	const loadChartData = () => {
		// ---------------
		setPeriod(period);
		setLoadData(1);
		// ---------------
		let date0 = new Date(dateRange[0]);
		let date1 = new Date(dateRange[1]);
		// ------------------------
		getSensorPlotData(-1,date0,date1);
		// ------------------------
		setPlotRHSensor([]);
		setPlotVELSensor([]);
		setPlotPRESSSensor([]);
		setPlotPWRMTRSensor([]);
		// --------------------
		setKEYS([]);
		setSelection(null);
		// ----------------
	}
	const BandMaxChange = (_index,_value) => {
		let value = Number(_value);
		if (value)	{
			_index===1 && setBandRHTempMin(value);
			_index===2 && setBandRHTempMax(value);
			_index===3 && setBandRHHumdMin(value);
			_index===4 && setBandRHHumdMax(value);
			_index===5 && setBandAIRVelMin(value);
			_index===6 && setBandAIRVelMax(value);
			_index===7 && setBandPRESSMin(value);
			_index===8 && setBandPRESSMax(value);
		}
	}
	const getLOADINGTEXT = () => {
		// -------
		let _STATE = 'SELECT DATE RANGE';
		if (dateRange[0] !== null ) _STATE = keys.length > 0 ? 'DATA LOADED': ( _loadMode === 0 ? 'CLICK TO LOAD DATA' : 'LOADING..');
		return _STATE;
	}
	// ------
	// RENDER
	// ------
  return(
    <MDBContainer size="lg" style={{ marginTop: '2rem'}}>
			
      <MDBRow center>
				<MDBCol md="12" className="mb-r">
					<DateRangePicker onChange={onDateChangePicker} value={dateRange} />
					<MDBBtn  color={dateRange[0] !== null ? keys.length > 0 ? 'success': ( _loadMode === 0 ? 'secondary' : 'danger') : 'primary'} size="lg" onClick={()=>loadChartData()}>{getLOADINGTEXT()}</MDBBtn >
					<MDBBtn  color='default' size="lg" onClick={()=>setSelection(null)}>CLEAR SELECTION</MDBBtn >
				</MDBCol>				
			</MDBRow>
      <MDBRow center>
				{
					keys.length > 0 && keys.map((_key,index) => {
						return (
							<MDBCard color='primary' className='p-2 m-2 align-items-center justify-content-center' center style={{width:'150px'}} onClick={()=>HandleSelection(`${_key}`)}>
								<div className="d-flex flex-column justify-content-center" >
								<span>{_key}</span>
								</div>
							</MDBCard>
						)
					})
				}
			</MDBRow>
      <div className="d-flex flex-row justify-content-center flex-wrap" >
      </div>

      <MDBRow center>
				<MDBCol size='3'>
					<MDBCard className="p-2 m-2" >
						<MDBRow center>
							{ selection && <h5 style={{color:'black',textDecorationLine:'underline',textAlign:'left',paddingTop:'5px'}}>{key}</h5> }
							<MDBCol size='11'>
							{
								selection && selection.map((_sensor,index) => {
									// ---------------------------
									let _id = `${_sensor.dtuId}-${_sensor.sensorId}`;
									let _label = _sensor.name;
									// ----------------------------
									return(
										<div class="custom-control custom-checkbox">
											<input type="checkbox" checked={checkState(_sensor)} class="custom-control-input" id={_id} onClick={()=>SelectedSensor(_sensor)}></input>
											<label class="custom-control-label" for={_id}>{_label}</label>
										</div>
									)
								})
							}
							</MDBCol>
						</MDBRow>
						<MDBRow center>
							<MDBBtn  color='warning' size="lg" >SENSOR SELECTED</MDBBtn >
							<MDBCol size='11'>
								{ plotRHSensors && (<div style={{color:'blue',paddingTop:'5px'}}>TEMPERATURE SENSOR</div>) }
								{ 
									plotRHSensors && plotRHSensors.map((_sensor,index) => {
										// ---------------------------
										let _id = `P-${_sensor.dtuId}-${_sensor.sensorId}`;
										let _label = _sensor.name;
										// ----------------------------
										return(
											<div class="custom-control custom-checkbox">
												<input type="checkbox" checked={checkState(_sensor)} class="custom-control-input" id={_id} onClick={()=>SelectedSensor(_sensor)}></input>
												<label class="custom-control-label" for={_id}>{_label}</label>
											</div>
										)
									}) 
								}
								{ plotVELSensors && (<div style={{color:'blue',paddingTop:'5px'}}>AIR FLOW SENSOR</div>) }
								{ 
									plotVELSensors && plotVELSensors.map((_sensor,index) => {
										// ---------------------------
										let _id = `P-${_sensor.dtuId}-${_sensor.sensorId}`;
										let _label = _sensor.name;
										// ----------------------------
										return(
											<div class="custom-control custom-checkbox">
												<input type="checkbox" checked={checkState(_sensor)} class="custom-control-input" id={_id} onClick={()=>SelectedSensor(_sensor)}></input>
												<label class="custom-control-label" for={_id}>{_label}</label>
											</div>
										)
									}) 
								}
								{ plotPRESSSensors && (<div style={{color:'blue',paddingTop:'5px'}}>PRESSURE SENSOR</div>) }
								{ 
									plotPRESSSensors && plotPRESSSensors.map((_sensor,index) => {
										// ---------------------------
										let _id = `P-${_sensor.dtuId}-${_sensor.sensorId}`;
										let _label = _sensor.name;
										// ----------------------------
										return(
											<div class="custom-control custom-checkbox">
												<input type="checkbox" checked={checkState(_sensor)} class="custom-control-input" id={_id} onClick={()=>SelectedSensor(_sensor)}></input>
												<label class="custom-control-label" for={_id}>{_label}</label>
											</div>
										)
									}) 
								}
								{ plotPWRMTRSensors && (<div style={{color:'blue',paddingTop:'5px'}}>POWER METER</div>) }
								{ 
									plotPWRMTRSensors && plotPWRMTRSensors.map((_sensor,index) => {
										// ---------------------------
										let _id = `P-${_sensor.dtuId}-${_sensor.sensorId}`;
										let _label = _sensor.name;
										// ----------------------------
										return(
											<div class="custom-control custom-checkbox">
												<input type="checkbox" checked={checkState(_sensor)} class="custom-control-input" id={_id} onClick={()=>SelectedSensor(_sensor)}></input>
												<label class="custom-control-label" for={_id}>{_label}</label>
											</div>
										)
									}) 
								}
							</MDBCol>
						</MDBRow>
						<MDBRow center>
							<MDBBtn  color='black' size="lg" onClick={()=>HandleDownload()}>
								Export HISTORIES DATA TO CSV
								{fileName1 && <div><CSVLink {...csvReport1} ref={linkRef} onClick={()=>HandleDownload()}>POWER METERS</CSVLink></div>}
								{fileName2 && <div><CSVLink {...csvReport2} ref={linkRef} onClick={()=>HandleDownload()}>PH SENSORS</CSVLink></div>}
								{fileName3 && <div><CSVLink {...csvReport3} ref={linkRef} onClick={()=>HandleDownload()}>PRESSURE SENSOR</CSVLink></div>}
								{fileName4 && <div><CSVLink {...csvReport4} ref={linkRef} onClick={()=>HandleDownload()}>AIRFLOW SENSOR</CSVLink></div>}
							</MDBBtn >
						</MDBRow>
					</MDBCard>
				</MDBCol>				

				<MDBCol size='9'>
					<MDBCard className="p-3 m-2">
						{ plotRHSensors.length > 0 && (
							<MDBBox display="flex" >
								<MDBInput label="BAND MIN" outline onChange={(e)=>{BandMaxChange(1,e.target.value)}}></MDBInput>
								<MDBInput label="BAND MAX" outline onChange={(e)=>{BandMaxChange(2,e.target.value)}}></MDBInput>
							</MDBBox >
							)}
						{ plotRHSensors.length > 0 && (
								<ReactEcharts
									option={getOptionRHA({title:'TEMPERATURE C'})}
									style={{ height: "500px", width: "100%" }}
								/>				
						)}
						{ plotRHSensors.length > 0 && (
							<MDBBox display="flex" >
								<MDBInput label="BAND MAX" outline onChange={(e)=>{BandMaxChange(3,e.target.value)}}/>
								<MDBInput label="BAND MIN" outline onChange={(e)=>{BandMaxChange(4,e.target.value)}}/>
							</MDBBox >)}
						{ plotRHSensors.length > 0 && (
								<ReactEcharts
									option={getOptionRHB({title:'HUMIDITY %'})}
									style={{ height: "500px", width: "100%" }}
								/>				
						)}
						{ plotVELSensors.length > 0 && (
							<MDBBox display="flex" >
								<MDBInput label="BAND MAX" outline onChange={(e)=>{BandMaxChange(5,e.target.value)}}/>
								<MDBInput label="BAND MIN" outline onChange={(e)=>{BandMaxChange(6,e.target.value)}}/>
							</MDBBox >)}
						{ plotVELSensors.length > 0 && (
								<ReactEcharts
									option={getOptionVEL({title:'VELOCITY'})}
									style={{ height: "500px", width: "100%" }}
								/>				
						)}
						{ plotPRESSSensors.length > 0 && (
							<MDBBox display="flex" >
								<MDBInput label="BAND MAX" outline onChange={(e)=>{BandMaxChange(7,e.target.value)}}/>
								<MDBInput label="BAND MIN" outline onChange={(e)=>{BandMaxChange(8,e.target.value)}}/>
							</MDBBox >)}
						{ plotPRESSSensors.length > 0 && (
								<ReactEcharts
									option={getOptionPRESS({title:'PRESSURE(BAR)'})}
									style={{ height: "500px", width: "100%" }}
								/>				
						)}
						{ plotPWRMTRSensors.length > 0 && (<MDBBox display="flex" ><MDBInput label="BAND MAX" outline onChange={(e)=>{BandMaxChange(5,e.target.value)}}/><MDBInput label="BAND MIN" outline/></MDBBox >)}
						{ plotPWRMTRSensors.length > 0 && (
								<ReactEcharts
									option={getOptionPWRMTRTOTAL({title:'TOTAL POWER CONSUMPTION (KWH)'})}
									style={{ height: "500px", width: "100%" }}
								/>				
						)}
						{ plotPWRMTRSensors.length > 0 && (<MDBBox display="flex" ><MDBInput label="BAND MAX" outline onChange={(e)=>{BandMaxChange(6,e.target.value)}}/><MDBInput label="BAND MIN" outline/></MDBBox >)}
						{ plotPWRMTRSensors.length > 0 && (
								<ReactEcharts
									option={getOptionPWRMTRRATE({title:'RATE POWER CONSUMPTION (KWH)/HOUR'})}
									style={{ height: "500px", width: "100%" }}
								/>				
						)}
						{ plotPWRMTRSensors.length > 0 && getPWRMTRSTATS()}
					</MDBCard>
				</MDBCol>
			</MDBRow>

		</MDBContainer>
  )
}

// ----------------------
export default ChartsPage