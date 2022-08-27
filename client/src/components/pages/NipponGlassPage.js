import React, { useEffect,useState } from 'react';
import { MDBBtn, MDBDataTable, MDBTabContent } from 'mdbreact';
import axios from 'axios';
import animationData from "../../lottie/43885-laptop-working.json";
import { ReactComponent as SVGPLOT1} from '../systems/svg/files/NIPPON_GLASS_FLOORPLAN.svg';


// ---------------
const defaultOptions = {
	loop: true,
	autoplay: true,
	animationData: animationData,
	rendererSettings: {
		// preserveAspectRatio: "xMidYMid slice"
	}
};
// ---------------
const NipponGlassPage = () => {
  // ---------------
  const [rawdata,setData] = useState(null);
	const [radius,setRadius] = useState("20");
  // ------------
	useEffect(()=> {
		// ---------
		// SET TIMER
		// ---------
		const _mTimer = setTimeout(() => {
			// ----------
			setRadius(radius > 50 ? 15 : radius + 5);
			// ---------
			radius > 50 && RELOADRAWDARA();
		}, 60000);
		return () => clearTimeout(_mTimer);
    // ------------
	})
	// -------
	const RELOADRAWDARA = () => {
		try {
			// --------------------------------
			axios.get('/api/sensors/nipponglass', { } ).then (res => {
				// ------------------
				console.log('..../api/sensors/nipponglass...')
				console.log(res);
				setData(res.data);
				// ---------
			}).then( res => {
				// --------------
			}).catch ( err => {
				// ---------
			})
		} catch (err) {
		}
		// ---------
	}
	const LOAD_TEAWAREHOUSEDATA = () => {
		try {
			// --------------------------------
			axios.get('/api/sensors/teawarehouse', { } ).then (res => {
				// ------------------
				console.log('..../api/sensors/teawarehouse...')
				console.log(res);
				// ---------
			}).catch ( err => {
				// ---------
			})
		} catch (err) {
		}
		// ---------
	}

	// -------
	const abstractData = (index) => {
		// ------------
		let Obj = null;
		let _DTUID, _SENSORID;
		let _BYTES1, _BYTES2
		let _TIME, _kWhr, _VoltageA, _VoltageB, _VoltageC, _CurrentA, _CurrentB, _CurrentC
		let _PowerP, _PowerQ, _PowerS
		let _PowerF, _FREQ
		// -------------
		_DTUID = (rawdata && rawdata['PWRMTR'][0]) ? rawdata['PWRMTR'][0].DTUID : -1;
		_SENSORID = (rawdata && rawdata['PWRMTR'][0]) ? rawdata['PWRMTR'][0].SENSORID : -1;
		// // --------------------------------------------------------------------------------
		if ( rawdata && rawdata['PWRMTR1'] && rawdata['PWRMTR1'].length > 0 && rawdata['PWRMTR1'].length > 0 ){

			_TIME = rawdata ? new Date(rawdata['PWRMTR1'][index].TIMESTAMP) : new Date();
			_BYTES1 = (rawdata && rawdata['PWRMTR'][index] ) ? rawdata['PWRMTR'][index].RCV_BYTES : null;
			_BYTES2 = (rawdata && rawdata['PWRMTR1'][index] ) ? rawdata['PWRMTR1'][index].RCV_BYTES : null;
	
			_kWhr = _BYTES1 ? hexToSignedInt(_BYTES1[0]+_BYTES1[1]).toFixed(0) : '';
	
			_VoltageA = _BYTES2 ? (hexToSignedInt(_BYTES2[0])*0.10).toFixed(0) : '';
			_VoltageB = _BYTES2 ? (hexToSignedInt(_BYTES2[1])*0.10).toFixed(0) : '';
			_VoltageC = _BYTES2 ? (hexToSignedInt(_BYTES2[2])*0.10).toFixed(0) : '';
			
			_CurrentA = _BYTES2 ? (hexToSignedInt(_BYTES2[3]+_BYTES2[4])*0.001).toFixed(2) : '';
			_CurrentB = _BYTES2 ? (hexToSignedInt(_BYTES2[5]+_BYTES2[6])*0.001).toFixed(2) : '';
			_CurrentC = _BYTES2 ? (hexToSignedInt(_BYTES2[7]+_BYTES2[8])*0.001).toFixed(2) : '';
	
			_PowerP = ( _BYTES2 && _BYTES2[9] ) ? (hexToSignedInt(_BYTES2[9]+_BYTES2[10])*1.0).toFixed(0) : '';
			_PowerQ = ( _BYTES2 && _BYTES2[11] ) ? (hexToSignedInt(_BYTES2[11]+_BYTES2[12])*1.0).toFixed(0) : '';
			_PowerS = ( _BYTES2 && _BYTES2[13] ) ? (hexToSignedInt(_BYTES2[13]+_BYTES2[14])*1.0).toFixed(0) : '';
	
			_PowerF = ( _BYTES2 && _BYTES2[15] ) ? (hexToSignedInt(_BYTES2[15])*0.0001).toFixed(2) : '';
			_FREQ = ( _BYTES2 && _BYTES2[16] ) ? (hexToSignedInt(_BYTES2[16])*0.01).toFixed(0) : '';
		}
		Obj = {_TIME, _DTUID, _SENSORID, _kWhr, _VoltageA, _VoltageB, _VoltageC, _CurrentA, _CurrentB, _CurrentC, _PowerP, _PowerQ, _PowerS, _PowerF, _FREQ}
		return Obj;
	}
	// ------
	const getRows1 = () => {
		let DataArr = [];
		rawdata && rawdata['sensorData'] && rawdata['sensorData'].length > 0  && rawdata['sensorData'].map((_sensor,index) => {
			// ---------------
			let { _DATE,_TIME,_READING } = _sensor;
      let Obj = { 
				date: _DATE,
				time: _TIME,
				pressure:_READING,};
				// -------------
			DataArr.push(Obj);
		})
		return DataArr;

	}
	const getRows2 = () => {
		// --------------
		let DataArr = [];
		rawdata && rawdata['PWRMTR1'] && rawdata['PWRMTR1'].length > 0  && rawdata['PWRMTR1'].map((_sensor,index) => {
			// ---------------		
			let { _TIME, _kWhr, _VoltageA, _VoltageB, _VoltageC, _CurrentA, _CurrentB, _CurrentC, _PowerF, _FREQ } = abstractData(index);
			// --------------------------------
      let Obj = { 
				date: `${_TIME.getDate()}/${_TIME.getMonth()+1}`,
				time: `${_TIME.getHours()}: ${_TIME.getMinutes().toString().padStart(2,"0")}`,
				pwr:_kWhr,
				voltA:_VoltageA,
				currA:_CurrentA, 
				voltB:_VoltageB,
				currB:_CurrentB, 
				voltC:_VoltageC,
				currC:_CurrentC, 
				pfactor:_PowerF,
				freq:_FREQ };
				// -------------
			DataArr.push(Obj);
		})
		return DataArr;
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
	// ----------
  const data2 = {
    columns: [
      { label: 'DATE', field: 'date', sort: 'asc', width: 20 },
      { label: 'TIME', field: 'time', sort: 'asc', width: 20 },
      { label: 'POWER CONSUMP (KWh)', field: 'pwr', sort: 'asc', width: 20 },
      { label: 'PHASE A (VOLTAGE)', field: 'voltA', sort: 'asc', width: 20 },
      { label: 'PHASE A (CURRENT)', field: 'currA', sort: 'asc', width: 20 },
      { label: 'PHASE B (VOLTAGE)', field: 'voltB', sort: 'asc', width: 20 },
      { label: 'PHASE B (CURRENT)', field: 'currB', sort: 'asc', width: 20 },
      { label: 'PHASE C (VOLTAGE)', field: 'voltC', sort: 'asc', width: 20 },
      { label: 'PHASE C (CURRENT)', field: 'currC', sort: 'asc', width: 20 },
      { label: 'POWER FACTOR', field: 'pfactor', sort: 'asc', width: 20 },
      { label: 'FREQ (Hz)', field: 'freq', sort: 'asc', width: 20 },
    ],
    rows: getRows2()
  };
	const data1 = {
    columns: [
      { label: 'DATE', field: 'date', sort: 'asc', width: 20 },
      { label: 'TIME', field: 'time', sort: 'asc', width: 20 },
      { label: 'PRESSURE (bar)', field: 'pressure', sort: 'asc', width: 20 }
    ],
    rows: getRows1()

	}

// ----------------------
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
}	// --------
	const getRadius = () => { return radius; }
	const getDate = () => { return rawdata && rawdata.sensorData ? rawdata.sensorData[0]._DATE : "-" }
	const drawSVG = () => {
		// -------------------
		let { _TIME, _DTUID, _SENSORID, _kWhr, _VoltageA, _VoltageB, _VoltageC, _CurrentA, _CurrentB, _CurrentC, _PowerF, _FREQ } = abstractData(0);
		let ObjPRESSURE = (rawdata && rawdata['sensorData'][0]) ? rawdata['sensorData'][0] : null;
		if (!ObjPRESSURE) return;
		// -------------------
		// let current     =`A=${(hexToSignedInt(bytesData[3]+bytesData[4])*0.001).toFixed(2)} B=${(hexToSignedInt(bytesData[5]+bytesData[6])*0.001).toFixed(2)} C=${(hexToSignedInt(bytesData[7]+bytesData[8])*0.001).toFixed(2)}`;
		// let powerfactor =`${(_dataArr[15]*0.0001).toFixed(2)}`;
		// lett frequency  =`${(_dataArr[16]*0.01).toFixed(0)}Hz`;
		// FA 06 04 0B 01 01 DB F2
		// FA 06 04 0B 01 00 01 17
		let _OBJTIME = ObjPRESSURE ? new Date(ObjPRESSURE.TIMESTAMP) : new Date();
		let _date = `${_OBJTIME.getDate()}/${_OBJTIME.getMonth()+1}`;
		let _time = `${_OBJTIME.getHours()}: ${_OBJTIME.getMinutes().toString().padStart(2,"0")}`;
		let _humidity,  _temperature,_pressText,_pressure = '';
		if (ObjPRESSURE && ObjPRESSURE.DATAS) {
			_humidity = ObjPRESSURE ? ObjPRESSURE.DATAS[0]*0.10 : 0.0;
			_temperature = ObjPRESSURE ? ObjPRESSURE.DATAS[1]*0.10 : 0.0;
		}
		if (ObjPRESSURE && ObjPRESSURE.RCV_BYTES) {
			_pressText = ObjPRESSURE ? `0x${ObjPRESSURE.RCV_BYTES[0]}${ObjPRESSURE.RCV_BYTES[1]}` : '';
			_pressure = ObjPRESSURE ? (parseFloat(_pressText)/10).toFixed(2): 0;
		}
		// Number(parseFloat(`0x${ObjPRESSURE.RCV_BYTES[0]}${ObjPRESSURE.RCV_BYTES[1]}`)/100).toFixed(2)
		// let _ADCBYTE = (rawdata && rawdata.sensorData.length > 0 ) ? rawdata.sensorData[0].DATAS : '';
		// let _ADCHEX = (rawdata && rawdata.sensorData.length > 0 )  ? rawdata.sensorData[0].DATAS.substr(10,4) : '';
		// let _ADCVALUE = hexToSignedInt(_ADCHEX)*1.0;
		// let _ADCCONV = (_ADCVALUE * 3.3 * 1000 / ( 4095 * 150 ) ).toFixed(1)
		// let _ADCCURR = _ADCCONV * 100 / 20;
		// ------------------
		return (
			<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="1400" height="550" viewBox="0 0 1400 550"  preserveAspectRatio="xMidYMid meet" >
	 			<g transform="translate(450,300) scale(1.0,1.0)" >
					<rect width="280" height="150" rx="5" stroke="yellow" stroke-width="4" fill="black"/>
	 				<g transform="translate(5,5)" >
						<text x="10" y="20"  fill="white" font-size="1.0em" >{_TIME && `${_TIME.getDate()}/${_TIME.getMonth()+1}`} </text>
						<text x="10" y="38"  fill="white" font-size="1.0em" >{_TIME && `${_TIME.getHours().toString().padStart(2,"0")}: ${_TIME.getMinutes().toString().padStart(2,"0")}`} </text>
						<text x="100" y="30" fill="white" font-size="1.5em" >{_kWhr}kWh</text>
						<g transform="translate(10,50)" >
							<rect width="80" height="40" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
							<text x="8" y="18"  fill="white" font-size="1.0em" >{_VoltageA}V</text>
							<text x="8" y="35"  fill="white" font-size="1.0em" >{_CurrentA}A</text>
							<text x="62" y="20"  fill="red" font-size="1.2em" >A</text>
						</g>						
						<g transform="translate(95,50)" >
							<rect width="80" height="40" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
							<text x="8" y="18"  fill="white" font-size="1.0em" >{_VoltageB}V</text>
							<text x="8" y="35"  fill="white" font-size="1.0em" >{_CurrentB}A</text>
							<text x="62" y="20"  fill="red" font-size="1.2em" >B</text>
						</g>
						<g transform="translate(180,50)" >
							<rect width="80" height="40" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
							<text x="8" y="18"  fill="white" font-size="1.0em" >{_VoltageC}V</text>
							<text x="8" y="35"  fill="white" font-size="1.0em" >{_CurrentC}A</text>
							<text x="62" y="20"  fill="red" font-size="1.2em" >C</text>
						</g>
						<g transform="translate(95,100)" >
							<rect width="50" height="30" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
							<text x="10" y="20"  fill="white" font-size="1.0em" >{_PowerF}</text>
						</g>
						<g transform="translate(150,100)" >
							<rect width="50" height="30" rx="0" stroke="yellow" stroke-width="1" fill="black"/>					
							<text x="5" y="20"  fill="white" font-size="1.0em" >{_FREQ}Hz</text>
						</g>
						<g transform="translate(10,100)" >
							<text x="5" y="20"  fill="white" font-size="1.0em" >{_DTUID} | {_SENSORID}</text>
						</g>
					</g>
				</g>
				<g transform="translate(450,460) scale(1.0,1.0)" >
					<rect width="280" height="50" rx="5" stroke="yellow" stroke-width="4" fill="blue"/>
					<text x="10" y="20"  fill="white" font-size="1.0em" >{ObjPRESSURE && `${_date}`} </text>
					<text x="10" y="38"  fill="white" font-size="1.0em" >{ObjPRESSURE && `${_time}`} </text>
					<text x="100" y="32" fill="white" font-size="1.5em" >{ObjPRESSURE && `${_pressure} BAR`}</text>
				</g>
				 <circle cx="310" cy="430" r={getRadius()} stroke="red" stroke-width="3" fill="none"  />
				 <circle cx="310" cy="430" r="10" stroke="red" stroke-width="3" fill="yellow"  />
			</svg>
		)
	}
	// ----------
	return (
    <main style={{ marginTop: '2rem' }}>
			<div class="container">
				<div>
				{/* <Lottie options={defaultOptions} height={200} width={200} /> */}
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="1400" height="550" viewBox="0 0 1400 550"  preserveAspectRatio="xMidYMid meet" >
						<g transform="translate(0.0,0.0) scale(0.8,0.8)">
							<SVGPLOT1 />
							{ drawSVG() }
						</g>
				</svg>
				</div>
			<MDBBtn onClick={()=>LOAD_TEAWAREHOUSEDATA()}>TEST DATA</MDBBtn>
			<MDBBtn onClick={()=>RELOADRAWDARA()}>REFRESH</MDBBtn>
				<MDBDataTable 
					entriesOptions={[10, 20, 50, 100]}
					small
					entries={10}
					pagesAmount={10}
					striped
					materialSearch 
					data={data1}/>
				<MDBDataTable 
					entriesOptions={[10, 20, 50, 100]}
					small
					entries={10}
					pagesAmount={10}
					striped
					materialSearch 
					data={data2}/>
			</div>
		</main>
	)
}

export default NipponGlassPage
