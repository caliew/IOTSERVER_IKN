import React, { useState, Fragment } from 'react';
import { MDBIcon } from 'mdbreact';

import {
  Sparkline,
  LineSeries,
	BarSeries,
  HorizontalReferenceLine,
  BandLine,
  PatternLines,
  PointSeries } from '@data-ui/sparkline';
import { allColors } from '@data-ui/theme'; // open-color colors


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
}
function diff_hours(dt2, dt1) 
 {

  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
  diff /= (60 * 60);
  return diff.toFixed(2);
 }
const sensorData = (sensor) => {
	// ---------------
	let dataArray = [];
	// let data = Array(25).fill().map(Math.random);
	// -------------------------------------------
	let _reading0,_reading;
	let _DATEIME;
	sensor.logsdata && sensor.logsdata.map( (_data,index) => {
		// -------------------------
		switch (sensor.type) {
			case "WTRPRS(485)":
				_reading = Number(parseFloat(`0x${_data.RCV_BYTES[0]}${_data.RCV_BYTES[1]}`).toFixed(2)/100.0);
				break;
			case "AIRRH(485)":
				_reading = Number(_data.DATAS[1])/10.0;
				break;
			case "WTRTEMP(485)":
				_reading = Number(_data.DATAS[1])/10.0;
				break;
			case "AIRFLW(485)":
				_reading = Number(_data.DATAS[0])/10.0;
				break;
			case "PWRMTR(485)":
				let _HEXStr = _data.RCV_BYTES[0] + _data.RCV_BYTES[1];
				let _HEXInt = parseInt(_HEXStr,16) * 0.01;
				let _reading1 = Number(_HEXInt);
				let _dateTime = new Date(_data.TIMESTAMP);
				if (index === 0) {
					_reading = null;					
				} else {
					_reading = _reading0 - _reading1;
					_reading = _reading /(diff_hours(_DATEIME,_dateTime));
				}
				_reading0 = _reading1;
				_DATEIME = _dateTime;
				break;
			case "WISENSOR":
				_reading = Number(_data.Temperature);
				break;
			default:
				break;
		}
		// ----------------------
		_reading !== null && dataArray.push(_reading);
		// ----------------------
	})
	// -------------
	return dataArray;
}
// -----------------------
const renderLabel = d => d.toFixed(1);
// ------------
const SensorList = ({companyName,sensor,index}) => {
	// -------------------
	const getDTUID = (dtuId) => `DTU ID:${dtuId}`;
	// ------------------
	const getTableRow = (index,sensor) => {
		const { name,logsdata,sensorId,dtuId } = sensor
		let reading,limits;
		const _date = sensor.logsdata.length > 0 ? new Date(logsdata[0].TIMESTAMP) : null;
		let mm = _date && _date.getMonth()+1;
		let dd = _date && _date.getDate();
		let batt = sensor.logsdata.length > 0 ? logsdata[0].BATT : null;
		let interval = sensor.logsdata.length > 0 ? logsdata[0].INTERVAL : null;
		let hours = _date && ("0" + _date.getHours()).slice(-2);
		let minutes = _date && ("0" + _date.getMinutes()).slice(-2);
		let _timediff = _date && (new Date().getTime()  - _date.getTime());
		_timediff = _date && _timediff/ (1000 * 60 * 60);
		// ------------------
		switch (sensor.type)
		{
			case 'AIRRH(485)':
				reading = logsdata.length > 0 ? logsdata[0].DATAS[1]/10.0.toFixed(1) + '°C': '°C';
				reading = logsdata.length > 0 ? `${reading}  ${logsdata[0].DATAS[0]/10.0.toFixed(1)}%` : `${reading}`;
				limits = '';
				break;
			case 'AIRFLW(485)':
				reading = logsdata.length > 0 ? logsdata[0].DATAS[0]/10.0.toFixed(2) + 'm/s': 'm/s';
				limits = '';
				break;
			case 'WTRPRS(485)':
				reading = logsdata.length > 0 ? Number(parseFloat(`0x${logsdata[0].RCV_BYTES[0]}${logsdata[0].RCV_BYTES[1]}`)/100).toFixed(2) + 'bar': 'bar';
				// logsdata.length > 0 && console.log(logsdata[0].RCV_BYTES,`0x${logsdata[0].RCV_BYTES[0]}${logsdata[0].RCV_BYTES[1]}`)
				// reading = logsdata.length > 0 ? logsdata[0].DATAS[2] + 'psi': 'psi';
				limits = '';
				break;
			case 'WTRTEMP(485)':
				reading = logsdata.length > 0 ? logsdata[0].DATAS[1]/10.0.toFixed(1) + '°C': '°C';
				limits = `${sensor.limits.TEMPERATURE_MIN}°C/${sensor.limits.TEMPERATURE_MAX}°C`			
				break;
			case 'WTRRH(485)':
				reading = logsdata.length > 0 ? logsdata[0].DATAS[1]/10.0.toFixed(1) + '°C': '°C';
				limits = `${sensor.limits.TEMPERATURE_MIN}°C/${sensor.limits.TEMPERATURE_MAX}°C`			
				break;
			case 'PWRMTR(485)':
				let _HEXStr = logsdata.length > 1 ? logsdata[0].RCV_BYTES[0] + logsdata[0].RCV_BYTES[1] : '';
				let _HEXInt = parseInt(_HEXStr,16)*0.01;
				reading = logsdata.length > 0 ? `${Number(_HEXInt.toFixed(0))} kHh` : '- kWh';
				limits = '';
				break;
			case 'WISENSOR':
				reading = (logsdata.length > 0 && logsdata[0].Temperature) ? `${logsdata[0].Temperature.toFixed(1)}°C`: '°C';
				//  ${logsdata[0].Humidity.toFixed(1)}%
				// ABSOLUTE HUMIDITY = 6.112 x ( e^((17.67xT)/(T+243.50)) ) x R H x2.1674 / (273.15+T)
				let _Temp = Number(logsdata[0].Temperature);
				let _RH = Number(logsdata[0].Humidity);
				// --------
				let absRH = 6.12 * Math.exp( (17.67*_Temp)/(_Temp+243.50)) * _RH * 2.1674 / ( 273.15 + _Temp );
				reading = ( logsdata[0].Humidity && logsdata[0].Humidity > 0) ? reading = `${reading} RH:${logsdata[0].Humidity.toFixed(1)}%  ABS:${absRH.toFixed(1)}%` : reading;
				limits = sensor.limits ? `${sensor.limits.TEMPERATURE_MIN}°C/${sensor.limits.TEMPERATURE_MAX}°C` : `NA/NA`			
				break;
			default:
				reading = null
				break;
		}
		// -----
		return (
			<tr>
				<td>{index}</td><td>{name}<br/>SENSOR ID:{sensorId}<br/>
				{ dtuId > 0 && getDTUID(dtuId) }
				</td>
				<td>{`${dd}/${mm}`}<br/>{`${hours}:${minutes}`}</td>
				<td>
					{reading}<br/>
					{limits}<br/>
					<MDBIcon icon="battery-full" size="2x"/>&nbsp;&nbsp;
					<MDBIcon icon={_timediff > 3 ? "unlink" : "link"} className={_timediff > 3 ? "red-text" : "green-text"} size="2x"/>
				</td>
				<td>
					{ companyName !== "IKN" && getSparkLine(sensor) }
				</td>
			</tr>
		)
	}
	const getSparkLine = (sensor) => {
		return (
			<Sparkline ariaLabel="SENSOR SPARKLINE PLOT" margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
								 width={200} height={100} data={sensorData(sensor)} valueAccessor={datum => datum} >
	
				{/* this creates a <defs> referenced for fill */}
				<PatternLines id="unique_pattern_id" height={6} width={6} stroke={allColors.green[6]} strokeWidth={1} orientation={['diagonal']} />
				{/* display innerquartiles of the data */}
				<BandLine band="innerquartiles" fill="url(#unique_pattern_id)" />
				{/* display the median */}
				<HorizontalReferenceLine stroke={allColors.grape[8]} strokeWidth={1} strokeDasharray="4 4" reference="median" />
				{/* Series children are passed the data from the parent Sparkline */}
				{
					sensor.type === 'PWRMTR(485)' ? <BarSeries  showArea={false} stroke={allColors.blue[7]} strokeWidth={1}/> : <LineSeries  showArea={false} stroke={allColors.blue[7]} strokeWidth={1}/>
				}
				<PointSeries fill={allColors.grape[3]} size={4} stroke="#fff" renderLabel={renderLabel} />
	
			</Sparkline>
		)
	}	
	// --------------	
	return (
		<>
			{ sensor.type === 'AIRRH(485)' && sensor.logsdata.length > 0 && getTableRow(index+1,sensor) }
			{ sensor.type === 'AIRFLW(485)' && sensor.logsdata.length > 0 && getTableRow(index+1,sensor) }
			{ sensor.type === 'WTRPRS(485)' && sensor.logsdata.length > 0 && getTableRow(index+1,sensor) }
			{ sensor.type === 'WTRTEMP(485)' && sensor.logsdata.length > 0 && getTableRow(index+1,sensor) }
			{ sensor.type === 'WTRRH(485)' && sensor.logsdata.length > 0 && getTableRow(index+1,sensor) }
			{ sensor.type === 'PWRMTR(485)' && getTableRow(index+1,sensor) }
			{ sensor.type === 'WISENSOR' && sensor.logsdata.length > 0 && getTableRow(index+1,sensor) }
		</>
	)

}

export default SensorList;