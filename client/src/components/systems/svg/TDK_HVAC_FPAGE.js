import React, { useContext,useEffect,useState } from 'react'
import SensorContext from '../../../context/sensor/sensorContext';
import { MDBIcon } from 'mdbreact';

import {
	HEXCHANGER_TEMP,
  CTW_A_TEMP1,CTW_A_TEMP2,CTW_B_TEMP1,CTW_B_TEMP2,
  WCPU_A_TEMP1, WCPU_A_TEMP2,WCPU_B_TEMP1, WCPU_B_TEMP2,
  AHU_A_TEMP1,AHU_A_TEMP2,AHU_B_TEMP1,AHU_B_TEMP2,
  CHILLER_A_CH_TEMP1, CHILLER_A_CH_TEMP2,CHILLER_A_CW_TEMP1, CHILLER_A_CW_TEMP2,
  CHILLER_B_CH_TEMP1, CHILLER_B_CH_TEMP2,CHILLER_B_CW_TEMP1, CHILLER_B_CW_TEMP2,
	AIR_COMPRESSOR1,AIR_COMPRESSOR2,AIR_COMPRESSOR3,
	AIRFLOW_RH1,AIRFLOW_RH2,AIRFLOW_RH3,
	AIRFLW_VEL1,AIRFLW_VEL2,AIRFLW_VEL3,AIRFLW_VEL4,AIRFLW_VEL5,
	AIRFLW_VEL6,AIRFLW_VEL7,AIRFLW_VEL8,AIRFLW_VEL9,AIRFLW_VEL10,
	PWRMTR_01,PWRMTR_02,PWRMTR_03,PWRMTR_04,PWRMTR_05,PWRMTR_06,PWRMTR_07,PWRMTR_08,PWRMTR_09,PWRMTR_10,
	PWRMTR_11,PWRMTR_12,PWRMTR_13,PWRMTR_14,PWRMTR_15,PWRMTR_16,PWRMTR_17,PWRMTR_18,PWRMTR_19,PWRMTR_20,
	PWRMTR_21,PWRMTR_22,PWRMTR_23,PWRMTR_24,PWRMTR_25,PWRMTR_26,PWRMTR_27,PWRMTR_28,PWRMTR_29,PWRMTR_30
} from '../../types';

import { MDBCol,MDBCard } from 'mdbreact';
import { ReactComponent as SVGPLOT3} from '../svg/files/TDK_FPAGE_10.svg';
import { ReactComponent as SVGFPLAN} from '../svg/files/TDK_FPAGE_FLOORPLAN_3D.svg';
// 
// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'
// -------------------
const wiSensorList = [
	{ id:1, name:'RMS',uid:'B0-F8-97-C3-7C-87'},
	{ id:2, name:'VKL',uid:'B0-C0-E7-11-A7-E3'},
	{ id:3, name:'IQA STORE',uid:'B0-5A-AA-22-D5-1F'},
	{ id:4, name:'GFC STORE',uid:'B0-21-0A-47-FA-53'},
	{ id:5, name:'ELECTRODE',uid:'B0-66-72-ED-8C-51'},
	{ id:6, name:'PRODUCTION 1 (BACKEND)',uid:'B0-D8-BE-52-21-62'},
	{ id:7, name:'PRODUCTION 2 (BACKEND)',uid:'B0-8A-EA-86-E2-C9'},
	{ id:8, name:'CHEMICAL STORE',uid:'B0-84-88-E0-CE-E7'},
	{ id:9, name:'SERVER ROOM',uid:'B0-68-61-5E-F9-72'},
	{ id:10, name:'CLEAN ROOM 10K (MOV 5 OVEN)',uid:'B0-96-40-57-8B-E3'},
	{ id:11, name:'CLEAN ROOM 10 (MOUNTING)',uid:'B0-E1-64-78-DE-E0'},
	{ id:12, name:'CLEAN ROOM 100 (PASTING)',uid:'B0-58-A9-7D-C8-21'},
	{ id:13, name:'PASTE PREPARATION ROOM',uid:'B0-01-A1-1A-65-55'},
	{ id:14, name:'PRODUCTION (FRONT END)',uid:'B0-06-08-98-02-79'},
	{ id:15, name:'DLA PASTING ROOM 1',uid:'B0-33-3C-85-AC-53'},
	{ id:16, name:'DLA PASTING ROOM 2',uid:'B0-3E-81-9F-9B-4A'},
	{ id:17, name:'DLA MOUNTING ROOM 1',uid:'B0-59-52-90-F0-DF'},
	{ id:18, name:'DLA MOUNTING ROOM 2',uid:'B0-E8-21-1B-BD-0A'},
	{ id:19, name:'HVC PRODUCTION',uid:'B0-82-F1-93-8B-0D'},
	{ id:20, name:'CCU CALIBRATION',uid:'B0-DA-23-27-E0-2A'},
	{ id:21, name:'HVC HIGH TESTER ROOM',uid:'B0-C1-B8-8F-C8-A6'},
	{ id:22, name:'MULTIMATIC',uid:'B0-17-03-A8-FB-4B'},
	{ id:23, name:'MAIN SWITCH BOARD (MSB) ROOM',uid:'B0-20-56-1B-08-0C'},
	{ id:24, name:'TRANSFORMER ROOM',uid:'B0-02-3D-DE-70-5D'},
]
function TDK_IsoVIEW({ color, sensorsData, wisensors }) {
	// -------------------------------------
	const sensorContext = useContext(SensorContext);
	const { sensors, getSensors,fetchDateTime } = sensorContext;
	// ------------------------------------------
	const [counter,setCounter] = useState(0);
	// --------------------------------------
	const [colorRed1,setColorRed1] = useState('red');
	const [colorRed2,setColorRed2] = useState('white');
	const [colorBlue1,setColorBlue1] = useState('blue');
	const [colorBlue2,setColorBlue2] = useState('white');
	const [colorYellow1,setColorYellow1] = useState('yellow');
	const [colorYellow2,setColorYellow2] = useState('white');
	const [colorGreen1,setColorGreen1] = useState('green');
	const [colorGreen2,setColorGreen2] = useState('white');
	const [strkwidthTemp,setStrokeWidthTemp] = useState(12);
	const [strkwidthHumd,setStrokeWidthHumd] = useState(0);
	const [mode,setPlayMode] = useState("pause");
	// ----------------------
	useEffect(()=>{
		// if (sensors === null) getSensors(30,null,null);
		// ---------
		// SET TIMER
		// ---------
		const _mTimer = setTimeout(() => {
			// ----------
			setColorRed1(colorRed1 === 'red' ? 'white' : 'red' );
			setColorRed2(colorRed2 === 'red' ? 'white' : 'red' );
			setColorBlue1(colorBlue1 === 'blue' ? 'white' : 'blue' );
			setColorBlue2(colorBlue2 === 'blue' ? 'white' : 'blue' );
			setColorYellow1(colorYellow1 === 'yellow' ? 'black' : 'yellow' );
			setColorYellow2(colorYellow2 === 'yellow' ? 'black' : 'yellow' );
			setColorGreen1(colorGreen1 === 'green' ? 'white' : 'green' );
			setColorGreen2(colorGreen2 === 'green' ? 'white' : 'green' );
			setStrokeWidthTemp(strkwidthTemp === 12 ? 5 : 12 );
			setStrokeWidthHumd(strkwidthHumd === 12 ? 5 : 12 );
			// ----------
			mode === "play" && setCounter(counter > 30 ? 0 : counter + 1);
			// ---------
		}, 1000);
		return () => clearTimeout(_mTimer);
	})
	// --------------------------------------------
	// fill='green' stroke='black' stroke-width='1'
	// --------------------------------------------
	// console.log(`${CTW_A_CWS_PRESS1}....${sensorsData[CTW_A_CWS_PRESS1]}`);
	// console.log(sensorsData);
	// ----------------------
	const DrawREDLine = () => {
		return (
			<g transform="translate(15.0,20.0) scale(1.0,1.0)" fill={color} >
				<circle cx="790" cy="470" r='5' stroke="black" stroke-width="3" fill={getREDColor2()} />
				<circle cx="785" cy="540" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="770" cy="540" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="760" cy="640" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="755" cy="700" r='5' stroke="black" stroke-width="3"   fill={getREDColor2()} />

				<circle cx="570" cy="542" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="535" cy="640" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="515" cy="700" r='5' stroke="black" stroke-width="3" fill={getREDColor1()} />

				<circle cx="860" cy="470" r='5' stroke="black" stroke-width="3" fill={getREDColor2()} />
				<circle cx="865" cy="410" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="865" cy="350" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="865" cy="300" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="920" cy="300" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="965" cy="300" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="975" cy="348" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="1025" cy="348" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="1022" cy="400" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="1042" cy="480" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="1065" cy="565" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="1150" cy="565" r='5' stroke="red" stroke-width="3"   fill={getREDColor1()} />
				<circle cx="1300" cy="565" r='5' stroke="red" stroke-width="3"   fill={getREDColor2()} />
				<circle cx="1390" cy="565" r='5' stroke="black" stroke-width="3"   fill={getREDColor1()} />

				</g>
		)
	}
	const DrawBLUELine = () => {
		return (
			<g transform="translate(0.0,0.0) scale(1.0,1.0)" fill={color} >
				<circle cx="555" cy="794" r='5' stroke="black" stroke-width="3" fill={getBLUEColor1()} />
				<circle cx="620" cy="794" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor2()} />
				<circle cx="680" cy="794" r='5' stroke="black" stroke-width="3" fill={getBLUEColor1()} />
				<circle cx="860" cy="794" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor2()} />
				<circle cx="958" cy="794" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor1()} />
				<circle cx="950" cy="680" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor2()} />
				<circle cx="940" cy="550" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor1()} />
				<circle cx="1080" cy="530" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor2()} />
				<circle cx="1160" cy="530" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor1()} />
				<circle cx="1152" cy="568" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor2()} />
				<circle cx="1170" cy="550" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor2()} />
				<circle cx="1270" cy="550" r='5' stroke="blue" stroke-width="3" fill={getBLUEColor1()} />
				<circle cx="1380" cy="550" r='5' stroke="black" stroke-width="3" fill={getBLUEColor2()} />
		</g>
		)		
	}
	const DrawYELLOWLine = () => {
		return (
			<g transform="translate(0.0,0.0) scale(1.0,1.0)" fill={color} >
				<circle cx="560" cy="722" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="545" cy="690" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="445" cy="690" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="345" cy="690" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />

				<circle cx="290" cy="722" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="270" cy="690" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="200" cy="690" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />

				<circle cx="200" cy="690" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="235" cy="640" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="280" cy="570" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="295" cy="598" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor1()} />

				<circle cx="180" cy="598" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="130" cy="598" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="90" cy="598" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="152" cy="578" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="350" cy="578" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="405" cy="490" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="225" cy="490" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor1()} />


				<circle cx="315" cy="632" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="360" cy="632" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="395" cy="570" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="440" cy="490" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="472" cy="428" r='5' stroke="yellow" stroke-width="3" fill={getYELLOWColor2()} />
				<circle cx="550" cy="428" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor1()} />
				<circle cx="690" cy="428" r='5' stroke="black" stroke-width="3" fill={getYELLOWColor2()} />

			</g>
		)
	}
	const DrawGREENLine = () => {
		return (
			<g transform="translate(0.0,0.0) scale(1.0,1.0)" fill={color} >
				<circle cx="350" cy="715" r='5' stroke="black" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="380" cy="660" r='5' stroke="green" stroke-width="3" fill={getGREENColor2()} />
				<circle cx="445" cy="5450" r='5' stroke="green" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="325" cy="545" r='5' stroke="black" stroke-width="3" fill={getGREENColor2()} />
				<circle cx="220" cy="545" r='5' stroke="green" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="130" cy="545" r='5' stroke="black" stroke-width="3" fill={getGREENColor2()} />

				<circle cx="475" cy="478" r='5' stroke="green" stroke-width="3" fill={getGREENColor2()} />

				<circle cx="590" cy="715" r='5' stroke="black" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="605" cy="660" r='5' stroke="green" stroke-width="3" fill={getGREENColor2()} />
				<circle cx="622" cy="600" r='5' stroke="green" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="640" cy="540" r='5' stroke="green" stroke-width="3" fill={getGREENColor2()} />
				<circle cx="650" cy="497" r='5' stroke="green" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="550" cy="478" r='5' stroke="green" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="650" cy="478" r='5' stroke="green" stroke-width="3" fill={getGREENColor2()} />
				<circle cx="685" cy="476" r='5' stroke="green" stroke-width="3" fill={getGREENColor1()} />
				<circle cx="676" cy="400" r='5' stroke="black" stroke-width="3" fill={getGREENColor2()} />
			</g>
		)
	}
	// ---------------
	const getREDColor1 = () => { return colorRed1; }
	const getREDColor2 = () => { return colorRed2; }
	const getBLUEColor1 = () => { return colorBlue1; }
	const getBLUEColor2 = () => { return colorBlue2; }
	const getYELLOWColor1 = () => { return colorYellow1; }
	const getYELLOWColor2 = () => { return colorYellow2; }
	const getGREENColor1 = () => { return colorGreen1; }
	const getGREENColor2 = () => { return colorGreen2; }
	// ------------------
	// 3D SCHEMATIC MODEL
	// ------------------
	const DRAWSCHEMATIC = () => {
		return (
			<>
				<g transform="translate(5,5) scale(0.9,0.9)" fill={color} >				
					<g transform="translate(0,25)" >
					<SVGPLOT3 />
					</g>
					{/* CHILLED WATER RETURN (RED LINE) */}
					{ DrawREDLine() }

					{/* CHILLED WATER SUPPLIES (BLUE LINE) */}
					{ DrawBLUELine() }

					{/* COOLED WATER SUPPLIES (YELLOW LINE) */}
					{ DrawYELLOWLine() }

					{/* COOLED WATER RETURN (GREEN LINE) */}
					{ DrawGREENLine() }

					{/* HVAC WATER TEMPERATURE READINGS */}
					{ GETTEMPREADINGS() }

					{/* AIR COMPRESSOR PRESSURE*/}
					{ GETAIRCOMP() }

					{/* COMPONENTS LABELS */}
					{ GETLABELS() }

				</g>
				{ GETTABLEDATA() }
			</>
		)
	}
	// ----------
	// FLOOR PLAN
	// ----------
	const DRAWFPLAN = () => {
		// -----------
		return (
			<g transform="translate(0,0) scale(1.0,1.0)" fill={color} >
				<g transform="translate(0,0) scale(0.70,0.70)" fill={color} >
					<SVGFPLAN />
					{/* LOCATIONS */}
					<g transform="translate(0,0)">
						<g transform="translate(610,550)" >
							{/* <circle cx="0" cy="0" r="40" fill={getRHColor(1)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(1)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(1)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(1)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">01</text>
						</g>
						<g transform="translate(810,550)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(2)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(2)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(2)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(2)} stroke-width={strkwidthTemp} fill="none" />
							<circle cx="0" cy="0" r="10" fill="white" filter="url(#heatMap)" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">02</text>
						</g>
						<g transform="translate(310,450)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(3)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(3)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(3)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(3)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">03</text>
						</g>
						<g transform="translate(360,250)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(4)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(4)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(4)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(4)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">04</text>
						</g>
						<g transform="translate(1000,410)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(5)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(5)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(5)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(5)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">05</text>
						</g>
						<g transform="translate(1130,320)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(6)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(6)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(6)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(6)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">06</text>
						</g>
						<g transform="translate(940,280)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(7)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(7)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(7)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(7)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">07</text>
						</g>
						<g transform="translate(960,200)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(8)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(8)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(8)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(8)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">08</text>
						</g>
						<g transform="translate(460,280)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(9)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(9)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(9)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(9)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">09</text>
						</g>
						<g transform="translate(480,600)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor1(10)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(10)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(10)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(10)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">10</text>
						</g>
						<g transform="translate(655,210)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(11)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(11)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(11)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(11)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">11</text>
						</g>
						<g transform="translate(600,250)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(12)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(12)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(12)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(12)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">12</text>
						</g>
						<g transform="translate(600,180)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(13)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(13)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(13)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(13)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">13</text>
						</g>
						<g transform="translate(513,280)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(14)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(14)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(14)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(14)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">14</text>
						</g>
						<g transform="translate(640,360)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(15)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(15)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(15)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(15)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">15</text>
						</g>
						<g transform="translate(710,410)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(16)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(16)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(16)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(16)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">16</text>
						</g>
						<g transform="translate(650,410)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(17)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(17)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(17)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(17)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">17</text>
						</g>
						<g transform="translate(725,290)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(18)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(18)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(18)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(18)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-12" y="5" font-size='1.2rem' fill="white">18</text>
						</g>
						<g transform="translate(670,300)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(19)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(19)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(19)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(19)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">19</text>
						</g>
						<g transform="translate(510,400)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(20)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(20)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(20)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(20)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">20</text>
						</g>
						<g transform="translate(510,200)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor1(21)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor1(21)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor1(21)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor1(21)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">21</text>
						</g>
						<g transform="translate(760,140)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor2(22)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor2(22)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor2(22)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor2(22)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">22</text>
						</g>
						<g transform="translate(700,80)" >
							{/* <circle cx="0" cy="0" r="40" fill={getHumidityColor2(23)} filter="url(#heatMap)" /> */}
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor2(23)} filter="url(#heatMap)" />
							{/* <circle cx="0" cy="0" r="35" stroke={getHumidityColor1(23)} stroke-width={strkwidthHumd} fill="none" /> */}
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor2(23)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">23</text>
						</g>
						<g transform="translate(630,80)" >
							<circle cx="0" cy="0" r="40" fill={getHumidityColor2(24)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="25" fill={getTemperatureColor2(24)} filter="url(#heatMap)" />
							<circle cx="0" cy="0" r="35" stroke={getHumidityColor2(24)} stroke-width={strkwidthHumd} fill="none" />
							<circle cx="0" cy="0" r="20" stroke={getTemperatureColor2(24)} stroke-width={strkwidthTemp} fill="none" />
							<text x="-10" y="5" font-size='1.2rem' fill="white">24</text>
						</g>
					</g>
				</g>
				{/* LABELS*/}
				<g transform="translate(1250,60) scale(0.80,0.80)" >
					<g transform="translate(0,0) scale(1.0,1.00)" fill={color} >
						<text x="0" y="0"   font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(1)}>{`${getWiSensor(1)['id']} \u00A0\u00A0${getWiSensor(1)['name']} \u00A0\u00A0${getWiSensor(1)['temperature']}℃ RH=${getWiSensor(1)['RH']}% ABS=${getWiSensor(1)['ABS']}g/m3`}</text>
						<text x="0" y="30"  font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(2)}>{`${getWiSensor(2)['id']} \u00A0\u00A0${getWiSensor(2)['name']} \u00A0\u00A0${getWiSensor(2)['temperature']}℃ RH=${getWiSensor(2)['RH']}% ABS=${getWiSensor(2)['ABS']}g/m3`}</text>
						<text x="0" y="60"  font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(3)}>{`${getWiSensor(3)['id']} \u00A0\u00A0${getWiSensor(3)['name']} \u00A0\u00A0${getWiSensor(3)['temperature']}℃ RH=${getWiSensor(3)['RH']}% ABS=${getWiSensor(3)['ABS']}g/m3`}</text>
						<text x="0" y="90"  font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(4)}>{`${getWiSensor(4)['id']} \u00A0\u00A0${getWiSensor(4)['name']} \u00A0\u00A0${getWiSensor(4)['temperature']}℃ RH=${getWiSensor(4)['RH']}% ABS=${getWiSensor(4)['ABS']}g/m3`}</text>
						<text x="0" y="120" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(5)}>{`${getWiSensor(5)['id']} \u00A0\u00A0${getWiSensor(5)['name']} \u00A0\u00A0${getWiSensor(5)['temperature']}℃ RH=${getWiSensor(5)['RH']}% ABS=${getWiSensor(5)['ABS']}g/m3`}</text>
						<text x="0" y="150" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(6)}>{`${getWiSensor(6)['id']} \u00A0\u00A0${getWiSensor(6)['name']} \u00A0\u00A0${getWiSensor(6)['temperature']}℃ RH=${getWiSensor(6)['RH']}% ABS=${getWiSensor(6)['ABS']}g/m3`}</text>
						<text x="0" y="180" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(7)}>{`${getWiSensor(7)['id']} \u00A0\u00A0${getWiSensor(7)['name']} \u00A0\u00A0${getWiSensor(7)['temperature']}℃ RH=${getWiSensor(7)['RH']}% ABS=${getWiSensor(7)['ABS']}g/m3`}</text>
						<text x="0" y="210" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(8)}>{`${getWiSensor(8)['id']} \u00A0\u00A0${getWiSensor(8)['name']} \u00A0\u00A0${getWiSensor(8)['temperature']}℃ RH=${getWiSensor(8)['RH']}% ABS=${getWiSensor(8)['ABS']}g/m3`}</text>
						<text x="0" y="240" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(9)}>{`${getWiSensor(9)['id']} \u00A0\u00A0${getWiSensor(9)['name']} \u00A0\u00A0${getWiSensor(9)['temperature']}℃ RH=${getWiSensor(9)['RH']}% ABS=${getWiSensor(9)['ABS']}g/m3`}</text>
						<text x="0" y="270" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(10)}>{`${getWiSensor(10)['id']} \u00A0\u00A0${getWiSensor(10)['name']} \u00A0\u00A0${getWiSensor(10)['temperature']}℃ RH=${getWiSensor(10)['RH']}% ABS=${getWiSensor(10)['ABS']}g/m3`}</text>
						<text x="0" y="300" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(11)}>{`${getWiSensor(11)['id']} \u00A0\u00A0${getWiSensor(11)['name']} \u00A0\u00A0${getWiSensor(11)['temperature']}℃ RH=${getWiSensor(11)['RH']}% ABS=${getWiSensor(11)['ABS']}g/m3`}</text>
						<text x="0" y="330" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(12)}>{`${getWiSensor(12)['id']} \u00A0\u00A0${getWiSensor(12)['name']} \u00A0\u00A0${getWiSensor(12)['temperature']}℃ RH=${getWiSensor(12)['RH']}% ABS=${getWiSensor(12)['ABS']}g/m3`}</text>
						<text x="0" y="360" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(13)}>{`${getWiSensor(13)['id']} \u00A0\u00A0${getWiSensor(13)['name']} \u00A0\u00A0${getWiSensor(13)['temperature']}℃ RH=${getWiSensor(13)['RH']}% ABS=${getWiSensor(13)['ABS']}g/m3`}</text>
						<text x="0" y="390" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(14)}>{`${getWiSensor(14)['id']} \u00A0\u00A0${getWiSensor(14)['name']} \u00A0\u00A0${getWiSensor(14)['temperature']}℃ RH=${getWiSensor(14)['RH']}% ABS=${getWiSensor(14)['ABS']}g/m3`}</text>
						<text x="0" y="420" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(15)}>{`${getWiSensor(15)['id']} \u00A0\u00A0${getWiSensor(15)['name']} \u00A0\u00A0${getWiSensor(15)['temperature']}℃ RH=${getWiSensor(15)['RH']}% ABS=${getWiSensor(15)['ABS']}g/m3`}</text>
						<text x="0" y="450" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(16)}>{`${getWiSensor(16)['id']} \u00A0\u00A0${getWiSensor(16)['name']} \u00A0\u00A0${getWiSensor(16)['temperature']}℃ RH=${getWiSensor(16)['RH']}% ABS=${getWiSensor(16)['ABS']}g/m3`}</text>
						<text x="0" y="480" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(17)}>{`${getWiSensor(17)['id']} \u00A0\u00A0${getWiSensor(17)['name']} \u00A0\u00A0${getWiSensor(17)['temperature']}℃ RH=${getWiSensor(17)['RH']}% ABS=${getWiSensor(17)['ABS']}g/m3`}</text>
						<text x="0" y="510" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(18)}>{`${getWiSensor(18)['id']} \u00A0\u00A0${getWiSensor(18)['name']} \u00A0\u00A0${getWiSensor(18)['temperature']}℃ RH=${getWiSensor(18)['RH']}% ABS=${getWiSensor(18)['ABS']}g/m3`}</text>
						<text x="0" y="540" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(19)}>{`${getWiSensor(19)['id']} \u00A0\u00A0${getWiSensor(19)['name']} \u00A0\u00A0${getWiSensor(19)['temperature']}℃ RH=${getWiSensor(19)['RH']}% ABS=${getWiSensor(19)['ABS']}g/m3`}</text>
						<text x="0" y="570" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(20)}>{`${getWiSensor(20)['id']} \u00A0\u00A0${getWiSensor(20)['name']} \u00A0\u00A0${getWiSensor(20)['temperature']}℃ RH=${getWiSensor(20)['RH']}% ABS=${getWiSensor(20)['ABS']}g/m3`}</text>
						<text x="0" y="600" font-family="Tahoma" font-size='1.25rem' fill={getTemperatureColor1(21)}>{`${getWiSensor(21)['id']} \u00A0\u00A0${getWiSensor(21)['name']} \u00A0\u00A0${getWiSensor(21)['temperature']}℃ RH=${getWiSensor(21)['RH']}% ABS=${getWiSensor(21)['ABS']}g/m3`}</text>
					</g>
					<g transform="translate(0,100) scale(1.0,1.00)" fill={color} >
						<text x="0" y="650" font-family="Tahoma"font-size='1.25rem' fill={getTemperatureColor2(22)}>{`${getWiSensor(22)['id']} \u00A0\u00A0${getWiSensor(22)['name']} \u00A0\u00A0${getWiSensor(22)['temperature']}℃ RH=${getWiSensor(22)['RH']}% ABS=${getWiSensor(22)['ABS']}g/m3`}</text>
						<text x="0" y="680" font-family="Tahoma"font-size='1.25rem' fill={getTemperatureColor2(23)}>{`${getWiSensor(23)['id']} \u00A0\u00A0${getWiSensor(23)['name']} \u00A0\u00A0${getWiSensor(23)['temperature']}℃ RH=${getWiSensor(23)['RH']}% ABS=${getWiSensor(23)['ABS']}g/m3`}</text>
						<text x="0" y="710" font-family="Tahoma"font-size='1.25rem' fill={getTemperatureColor2(24)}>{`${getWiSensor(24)['id']} \u00A0\u00A0${getWiSensor(24)['name']} \u00A0\u00A0${getWiSensor(24)['temperature']}℃ RH=${getWiSensor(24)['RH']}% ABS=${getWiSensor(24)['ABS']}g/m3`}</text>
					</g>
				</g>
				<g transform="translate(1250,-20) scale(0.9,0.90)" >
					{ DRAWLEGENDS1() }
				</g>
				<g transform="translate(1250,580) scale(0.90,0.90)" >
					{ DRAWLEGENDS2() }
				</g>
			</g>
		)
	}
	const DRAWLEGENDS1 = () => {
		return (
			<>
				<g transform="translate(0,0)" >
						<text x="5" y="-5" font-family="Tahoma" fill="black" font-size="1.25em" >LEGENDS : TEMPERATURE </text>
						<rect x="0" y="0"  font-family="Tahoma" width="50" height="20" fill='darkred' /><text x="55" y="20" fill="black" font-size="1.25em" >DANGER &gt;30C </text>
						<rect x="0" y="20" font-family="Tahoma" width="50" height="20" fill='darkorange'/><text x="55" y="40" fill="black" font-size="1.25em" >WARNING &gt;25C &lt;30C </text>
						<rect x="0" y="40" font-family="Tahoma" width="50" height="20" fill='darkgreen' /><text x="55" y="60" fill="black" font-size="1.25em" >NORMAL &lt;25C </text>
				</g>
				<g transform="translate(320,0)" >
						<text x="5" y="-5" font-family="Tahoma" fill="black" font-size="1.25em" >LEGENDS : HUMIDITY </text>
						<rect x="0" y="0"  font-family="Tahoma" width="50" height="20" fill='red' /><text x="55" y="20" fill="black" font-size="1.25em" >DANGER &gt;40% </text>
						<rect x="0" y="20" font-family="Tahoma" width="50" height="20" fill='yellow'/><text x="55" y="40" fill="black" font-size="1.25em" >WARNING &gt;34% &lt;40% </text>
						<rect x="0" y="40" font-family="Tahoma" width="50" height="20" fill='green' /><text x="55" y="60" fill="black" font-size="1.25em" >NORMAL &lt;34% </text>
				</g>
			</>
		)
	}
	const DRAWLEGENDS2 = () => {
		return (
			<>
				<g transform="translate(0,0)" >
						<text x="5" y="-5" font-family="Tahoma" fill="black" font-size="1.25em" >LEGENDS : TEMPERATURE </text>
						<rect x="0" y="0"  font-family="Tahoma" width="50" height="20" fill='darkred' /><text x="55" y="20" fill="black" font-size="1.25em" >DANGER &gt;40C </text>
						<rect x="0" y="20" font-family="Tahoma" width="50" height="20" fill='darkorange'/><text x="55" y="40" fill="black" font-size="1.25em" >WARNING &gt;30C &lt;40C </text>
						<rect x="0" y="40" font-family="Tahoma" width="50" height="20" fill='darkgreen' /><text x="55" y="60" fill="black" font-size="1.25em" >NORMAL &lt;30C </text>
				</g>
				<g transform="translate(320,0)" >
						<text x="5" y="-5" font-family="Tahoma" fill="black" font-size="1.25em" >LEGENDS : HUMIDITY </text>
						<rect x="0" y="0"  font-family="Tahoma" width="50" height="20" fill='red' /><text x="55" y="20" fill="black" font-size="1.25em" >DANGER &gt;75% </text>
						<rect x="0" y="20" font-family="Tahoma" width="50" height="20" fill='yellow'/><text x="55" y="40" fill="black" font-size="1.25em" >WARNING &gt;50% &lt;75% </text>
						<rect x="0" y="40" font-family="Tahoma" width="50" height="20" fill='green' /><text x="55" y="60" fill="black" font-size="1.25em" >NORMAL &lt;50% </text>
				</g>
			</>
		)
	}
	const GETAIRCOMP = () => {
		return (
			<g>
				{
					sensorsData && sensorsData[AIR_COMPRESSOR1].reading > 1.0 && (
						<g transform="translate(320.0,190.0)">
							<rect x="0" y="0" width="90" height="20" fill='white	' />
							<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData[AIR_COMPRESSOR1].reading} bar</text>
						</g>
					)
				}
				{
					false && sensorsData && sensorsData[AIR_COMPRESSOR2].reading > 1.0 && (
						<g transform="translate(450.0,190.0)">
							<rect x="0" y="0" width="90" height="20" fill='white	' />
							<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData[AIR_COMPRESSOR2].reading} bar</text>
						</g>
					)
				}
				{
					false && sensorsData && sensorsData[AIR_COMPRESSOR3].reading > 1.0 && (
						<g transform="translate(580.0,190.0)">
							<rect x="0" y="0" width="90" height="20" fill='white	' />
							<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData[AIR_COMPRESSOR3].reading} bar</text>
						</g>
					)
				}
			</g>
		)
	}
	const GETLABELS = () => {
		return (
			<g>
				<g transform="translate(0.0,150.0)">
					{
						sensorsData && sensorsData[AIR_COMPRESSOR1].reading > 1.0 && (
							<>
							<rect x="320" y="13" width="90" height="30" fill='white	' />
							<text x="325" y="30" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CT1</text>
							</>
						)
					}
					{
						false && sensorsData && sensorsData[AIR_COMPRESSOR2].reading > 1.0 && (
							<>
							<rect x="450" y="13" width="90" height="30" fill='white	' />
							<text x="450" y="30" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CT2</text>
							</>
						)
					}
					{
						false && sensorsData && sensorsData[AIR_COMPRESSOR3].reading > 1.0 && (
							<>
							<rect x="580" y="13" width="90" height="30" fill='white	' />
							<text x="580" y="30" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CT3</text>
							</>
						)
					}
				</g>
				<g transform="translate(250.0,150.0)">
						<text x="580" y="35" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>FAN COIL UNIT</text>
				</g>
				<g transform="translate(650.0,250.0)">
						<text x="590" y="35" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>PRE-COOL (FE)</text>
				</g>
				<g transform="translate(480.0,600.0)">
						<text x="580" y="35" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>HEAT EXCHANGER</text>
				</g>
				<g transform="translate(900.0,350.0)">
						<text x="600" y="35" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>AHU</text>
				</g>
				<g transform="translate(250.0,520.0)">
						<text x="580" y="35" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CHWP</text>
				</g>
				<g transform="translate(100.0,690.0)">
						<text x="0" y="35" fill="BLACK" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CWP</text>
				</g>
				<g transform="translate(100.0,220.0)">
						<text x="-50" y="50" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CTA</text>
						<text x="150" y="50" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CTB</text>
				</g>
				<g transform="translate(350.0,470.0)">
						<text x="80" y="50" fill="BLACK" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CHILLER A</text>
						<text x="310" y="50" fill="BLACK" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>CHILLER B</text>
				</g>
				<g transform="translate(250.0,300.0)">
					<rect x="320" y="15" width="110" height="25" fill='white	' />
					<text x="325" y="35" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>WCPU A</text>
					<rect x="470" y="15" width="110" height="25" fill='white	' />
					<text x="475" y="35" fill="black" font-size="1.1em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>WCPU B</text>
				</g>
			</g>
			)
	}
	const GETTEMPREADINGS = () => {
		return (
			<g>
				{
					false && (
						<>
							<g transform="translate(950.0,510.0)">
									<rect x="0" y="0" width="100" height="20" fill='blue' />
									<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#52={sensorsData && sensorsData[AHU_A_TEMP1].reading}&deg;C</text>
							</g>
							<g transform="translate(950.0,630.0)">
									<rect x="0" y="0" width="100" height="20" fill='blue' />
									<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#14={sensorsData && sensorsData[AHU_A_TEMP2].reading}&deg;C</text>
							</g>
						</>
					)
				}
				<g transform="translate(1080.0,405.0)">
						<rect x="0" y="0" width="100" height="20" fill='blue' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#50={sensorsData && sensorsData[AHU_B_TEMP1].reading}&deg;C</text>
				</g>
				<g transform="translate(1080.0,365.0)">
						<rect x="0" y="0" width="100" height="20" fill='red' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#48={sensorsData && sensorsData[AHU_B_TEMP2].reading}&deg;C</text>
				</g>
				{/* HEAT EXCHANGER*/ }
				<g transform="translate(1080.0,640.0)">
						<rect x="0" y="0" width="90" height="20" fill='black' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='HEXCHANGER_TEMP' id='HEXCHANGER_TEMP'>#14={sensorsData && sensorsData[HEXCHANGER_TEMP].reading}&deg;C</text>
				</g>

				{/* CHILLER A - CHILLED WATER*/}
				<g transform="translate(720.0,760.0)">
						<rect x="0" y="0" width="90" height="20" fill='red' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#42={sensorsData && sensorsData[CHILLER_B_CH_TEMP2].reading}&deg;C</text>
				</g>
				<g transform="translate(710.0,790.0)">
						<rect x="0" y="0" width="100" height="20" fill='blue' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#46={sensorsData && sensorsData[CHILLER_B_CH_TEMP1].reading}&deg;C</text>
				</g>
				{/* CHILLER A - COOLED WATER*/}
				<g transform="translate(280.0,740.0)">
						<rect x="0" y="0" width="100" height="20" fill='yellow' />
						<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#12={sensorsData && sensorsData[CHILLER_A_CW_TEMP2].reading}&deg;C</text>
				</g>
				<g transform="translate(280.0,770.0)">
						<rect x="0" y="0" width="100" height="20" fill='green' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#18={sensorsData && sensorsData[CHILLER_A_CW_TEMP1].reading}&deg;C</text>
				</g>

				{/* CHILLER B - CHILLED WATER*/}
				<g transform="translate(460.0,760.0)">
						<rect x="0" y="0" width="100" height="20" fill='red' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#16={sensorsData && sensorsData[CHILLER_A_CH_TEMP2].reading}&deg;C</text>
				</g>
				<g transform="translate(450.0,790.0)">
						<rect x="0" y="0" width="100" height="20" fill='blue' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#44={sensorsData && sensorsData[CHILLER_A_CH_TEMP1].reading}&deg;C</text>
				</g>
				{/* CHILLER B - COOLED WATER*/}
				<g transform="translate(570.0,740.0)">
						<rect x="0" y="0" width="100" height="20" fill='yellow' />
						<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#08={sensorsData && sensorsData[CHILLER_B_CW_TEMP1].reading}&deg;C</text>
				</g>
				<g transform="translate(570.0,770.0)">
						<rect x="0" y="0" width="100" height="20" fill='green' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#40={sensorsData && sensorsData[CHILLER_B_CW_TEMP2].reading}&deg;C</text>
				</g>

				<g transform="translate(200.0,380.0)">
						<rect x="0" y="0" width="100" height="20" fill='yellow' />
						<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#36={sensorsData && sensorsData[CTW_A_TEMP2].reading}&deg;C</text>
				</g>
				<g transform="translate(80.0,500.0)">
						<rect x="0" y="0" width="100" height="20" fill='green' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#04={sensorsData && sensorsData[CTW_A_TEMP1].reading}&deg;C</text>
				</g>
				<g transform="translate(380.0,380.0)">
						<rect x="0" y="0" width="100" height="20" fill='yellow' />
						<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#10={sensorsData && sensorsData[CTW_B_TEMP2].reading}&deg;C</text>
				</g>
				<g transform="translate(245.0,500.0)">
						<rect x="0" y="0" width="100" height="20" fill='green' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#38={sensorsData && sensorsData[CTW_B_TEMP1].reading}&deg;C</text>
				</g>
				<g transform="translate(560.0,420.0)">
						<rect x="0" y="0" width="100" height="20" fill='yellow' />
						<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#32={sensorsData && sensorsData[WCPU_A_TEMP1].reading}&deg;C</text>
				</g>
				<g transform="translate(560.0,350.0)">
						<rect x="0" y="0" width="100" height="20" fill='green' />
						<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#34={sensorsData && sensorsData[WCPU_A_TEMP2].reading}&deg;C</text>
				</g>
				<g transform="translate(700.0,420.0)">
						<rect x="0" y="0" width="100" height="20" fill='yellow' />
						<text x="5" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#22={sensorsData && sensorsData[WCPU_B_TEMP1].reading}&deg;C</text>
				</g>
				<g transform="translate(700.0,350.0)">
					<rect x="0" y="0" width="100" height="20" fill='green' />
					<text x="5" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CH_TEMP1' id='CHILLER_A_CH_TEMP1'>#30={sensorsData && sensorsData[WCPU_B_TEMP2].reading}&deg;C</text>
				</g>							
			</g>
		)
	}
	// -----------------------------
	const getWiSensor = (index) => {
		// -----------------------
		let _object = wiSensorList.find(_el => _el.id === index);
		let _wisensor = _object && wisensors !== null ? wisensors.find( _el => JSON.stringify(_el.sensorId) === JSON.stringify(_object.uid)) : [];
		// -------------------------------
		let _name = _object ? _object.name : '---';
		let _uid = _object.uid;
		let _temperature = (_wisensor && _wisensor.logsdata) ? _wisensor.logsdata[0].Temperature : 0;
		let _humidity = (_wisensor && _wisensor.logsdata) ? _wisensor.logsdata[0].Humidity.toFixed(2) : 0;
		let absRH = (6.12 * Math.exp( (17.67*_temperature)/(_temperature+243.50)) * _humidity * 2.1674 / ( 273.15 + _temperature )).toFixed(2);
		// -------
		let _data = { id:index, uid:_uid, name:_name, temperature:_temperature, RH:_humidity, ABS:absRH }
		// -----------
		return _data;
		// return `${index} \u00A0${_object[0].uid} \u00A0\u00A0${_object[0].name} \u00A0\u00A0${_temperature}C ${_humidity}%`;
	}
	const getTemperatureColor1 = (index) => {
		let _Data = getWiSensor(index);
		let _temp = Number(_Data['temperature']);
		return _temp < 25 ? 'darkgreen' : _temp < 30 ? 'darkorange' : 'darkred';
	}
	const getTemperatureColor2 = (index) => {
		let _Data = getWiSensor(index);
		let _temp = Number(_Data['temperature']);
		return _temp < 30 ? 'darkgreen' : _temp < 40 ? 'darkorange' : 'darkred';
	}
	const getHumidityColor1 = (index) => {
		let _Data = getWiSensor(index);
		let _RH = Number(_Data['RH']);
		let _color = _RH < 34 ? 'green' : _RH < 40 ? 'yellow' : 'red';
		return _color;
	}
	const getHumidityColor2 = (index) => {
		let _Data = getWiSensor(index);
		let _RH = Number(_Data['RH']);
		let _color = _RH < 50 ? 'green' : _RH < 75 ? 'yellow' : 'red';
		return _color;
	}
	// -------------------------
	const GETTABLEDATA = () => {
		return (
			<g transform="translate(2,-15) scale(1.0,1.0)" fill={color} >
				{/* POWER METER */}
				<g transform="translate(20.0,-30.0)">
					
					{/* PWRMTR_09 = AIR COMPR C1 */}
					{/* PWRMTR_04 = AIR COMPR C2 */}
					{/* PWRMTR_06 = AIR COMPR C3 */}
					{/* PWRMTR_05 = CHILLER A  */}
					{/* PWRMTR_15 = CHILLER B */}
					<g transform="translate(0.0,0.0)">
						<g transform="translate(0.0,0.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' /><text x="15" y="15" fill="white" font-size="1.0em" >{sensorsData && sensorsData[PWRMTR_09].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' /><text x="190" y="15" fill="white" font-size="1.0em" >{sensorsData && sensorsData[PWRMTR_09].reading} kWh</text>
						</g>
						<g transform="translate(0.0,25.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_04].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_04].reading} kWh</text>
						</g>
						<g transform="translate(0.0,50.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_06].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_06].reading} kWh</text>
						</g>
						<g transform="translate(0.0,75.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_05].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_05].reading} kWh</text>
						</g>
						<g transform="translate(0.0,100.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_15].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_15].reading} kWh</text>
						</g>
					</g>

					{/* PWRMTR_17 = CWP1 */}
					{/* PWRMTR_18 = CWP2 */}
					{/* PWRMTR_10 = CWP3 */}
					{/* PWRMTR_12 = C.TOWER A */}
					{/* PWRMTR_16 = C.TOWER B */}
					<g transform="translate(300.0,0.0)">
						<g transform="translate(0.0,0.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_17].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_17].reading} kWh</text>
						</g>
						<g transform="translate(0.0,25.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_18].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_18].reading} kWh</text>
						</g>
						<g transform="translate(0.0,50.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_10].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_10].reading} kWh</text>
						</g>
						<g transform="translate(0.0,75.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_12].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_12].reading} kWh</text>
						</g>
						<g transform="translate(0.0,100.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_16].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_16].reading} kWh</text>
						</g>
					</g>

					{/* PWRMTR_14 = CHWP OVERALL */}
					{/* PWRMTR_03 = CLEAN ROOM DB */}
					{/* PWRMTR_07 = AHU FE */}
					{/* PWRMTR_11 = HEAT EXCHANGER */}
					{/* PWRMTR_13 = PRE-COOL FE */}
					<g transform="translate(600.0,0.0)">
						<g transform="translate(0.0,0.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_14].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_14].reading} kWh</text>
						</g>
						<g transform="translate(0.0,25.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_03].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_03].reading} kWh</text>
						</g>
						<g transform="translate(0.0,50.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_07].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_07].reading} kWh</text>
						</g>
						<g transform="translate(0.0,75.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_11].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_11].reading} kWh</text>
						</g>
						<g transform="translate(0.0,100.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_13].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_13].reading} kWh</text>
						</g>
					</g>

					{/* PWRMTR_08 = DH1 - FE/HVC/R&D */}
					{/* PWRMTR_01 = DH2 - FE/HVC/R&D */}
					{/* PWRMTR_02 = DH3 - PASTE RM */}
					{/* PWRMTR_19 = WCPU OVERALL */}
					<g transform="translate(900.0,0.0)">
						<g transform="translate(0.0,0.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_08].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_08].reading} kWh</text>
						</g>
						<g transform="translate(0.0,25.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_01].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_01].reading} kWh</text>
						</g>
						<g transform="translate(0.0,50.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_02].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_02].reading} kWh</text>
						</g>
						<g transform="translate(0.0,75.0)">
							<rect x="0" y="0" width="180" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_19].name}</text>
							<rect x="180" y="0" width="120" height="20" fill='blue	' />
							<text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_19].reading} kWh</text>
						</g>
						<g transform="translate(0.0,100.0)">
							{/* <rect x="0" y="0" width="180" height="20" fill='black' /> */}
							{/* <text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_20].name}</text> */}
							{/* <rect x="180" y="0" width="120" height="20" fill='blue	' /> */}
							{/* <text x="190" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_20].reading} kWh</text> */}
						</g>
					</g>

					<g transform="translate(1205.0,0.0)">
						{/* SSB2 */}
						<g transform="translate(0.0,0.0)">
							<rect x="0" y="0" width="100" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >SSB2</text>
							<rect x="100" y="0" width="200" height="20" fill='blue' />
							<text x="120" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && (Number(sensorsData[PWRMTR_21].reading) + Number(sensorsData[PWRMTR_22].reading)).toFixed(0) } kWh</text>
						</g>
						{/* SSB2-1 & SSB2-2 */}
						<g transform="translate(0.0,25.0)">
							<rect x="0" y="0" width="150" height="20" fill='green' />
							<text x="20" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_21].reading} kWh</text>
							<rect x="150" y="0" width="150" height="20" fill='green' />
							<text x="170" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_22].reading} kWh</text>
						</g>
						{/* SSB1 */}
						<g transform="translate(0.0,50.0)">
							<rect x="0" y="0" width="100" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >SSB1</text>
							<rect x="100" y="0" width="200" height="20" fill='blue' />
							<text x="120" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && (Number(sensorsData[PWRMTR_23].reading) + Number(sensorsData[PWRMTR_24].reading)).toFixed(0)} kWh</text>
						</g>
						{/* SSB1-1 & SSB1-2 */}
						<g transform="translate(0.0,75.0)">
							<rect x="0" y="0" width="150" height="20" fill='green' />
							<text x="20" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_23].reading} kWh</text>
							<rect x="150" y="0" width="150" height="20" fill='green	' />
							<text x="170" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_24].reading} kWh</text>
						</g>
						{/* SSB4 */}
						<g transform="translate(0.0,100.0)">
							<rect x="0" y="0" width="100" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_20].name}</text>
							<rect x="100" y="0" width="200" height="20" fill='blue	' />
							<text x="120" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_20].reading} kWh</text>
						</g>
					</g>
					<g transform="translate(1510.0,0.0)">
						{/* SSB6 */}
						<g transform="translate(0.0,0.0)">
							<rect x="0" y="0" width="100" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >SSB6</text>
							<rect x="100" y="0" width="200" height="20" fill='blue	' />
							<text x="120" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && (Number(sensorsData[PWRMTR_26].reading) + Number(sensorsData[PWRMTR_25].reading)).toFixed(0)} kWh</text>
						</g>
						{/* SSB6-1 & SSB6-2 */}
						<g transform="translate(0.0,25.0)">
							<rect x="0" y="0" width="150" height="20" fill='green' />
							<text x="20" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_25].reading} kWh</text>
							<rect x="150" y="0" width="150" height="20" fill='green	' />
							<text x="170" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_26].reading} kWh</text>
						</g>
						{/* SSB3 */}
						<g transform="translate(0.0,50.0)">
							<rect x="0" y="0" width="100" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >SSB3</text>
							<rect x="100" y="0" width="200" height="20" fill='blue	' />
							<text x="120" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && (Number(sensorsData[PWRMTR_27].reading) + Number(sensorsData[PWRMTR_28].reading)).toFixed(0)} kWh</text>
						</g>
						{/* SSB3-1 & SSB3-2 */}
						<g transform="translate(0.0,75.0)">
							<rect x="0" y="0" width="150" height="20" fill='green' />
							<text x="20" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_27].reading} kWh</text>
							<rect x="150" y="0" width="150" height="20" fill='green	' />
							<text x="170" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_28].reading} kWh</text>
						</g>
						{/* SSB5 */}
						<g transform="translate(0.0,100.0)">
							<rect x="0" y="0" width="100" height="20" fill='black' />
							<text x="15" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >SSB5</text>
							<rect x="100" y="0" width="200" height="20" fill='blue	' />
							<text x="120" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && (Number(sensorsData[PWRMTR_29].reading) + Number(sensorsData[PWRMTR_30].reading)).toFixed(0)} kWh</text>
						</g>
						{/* SSB5-1 & SSB5-2 */}
						<g transform="translate(0.0,125.0)">
							<rect x="0" y="0" width="150" height="20" fill='green' />
							<text x="20" y="15" fill="white" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[PWRMTR_29].reading} kWh</text>
							<rect x="150" y="0" width="150" height="20" fill='green	' />
							<text x="170" y="15" fill="white" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[PWRMTR_30].reading} kWh</text>
						</g>
					</g>
				</g>
				{/* AIR FLOW RH */}
				<g transform="translate(1450.0,150.0)">
					<g transform="translate(0.0,0.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLOW_RH1].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLOW_RH1].reading}</text>
					</g>
					<g transform="translate(0.0,25.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLOW_RH2].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLOW_RH2].reading}</text>
					</g>
					<g transform="translate(0.0,50.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLOW_RH3].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLOW_RH3].reading}</text>
					</g>
				</g>
				{/* AIR FLOW VELOCITY */}
				<g transform="translate(1450.0,250.0)">
					<g transform="translate(0.0,0.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL1].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL1].reading}</text>
					</g>
					<g transform="translate(0.0,25.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL2].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL2].reading}</text>
					</g>
					<g transform="translate(0.0,50.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL3].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL3].reading}</text>
					</g>
					<g transform="translate(0.0,75.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL4].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL4].reading}</text>
					</g>
					<g transform="translate(0.0,100.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL5].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL5].reading}</text>
					</g>
					<g transform="translate(0.0,125.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL6].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL6].reading}</text>
					</g>
					<g transform="translate(0.0,150.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL7].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL7].reading}</text>
					</g>
					<g transform="translate(0.0,175.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL8].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL8].reading}</text>
					</g>
					<g transform="translate(0.0,200.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL9].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL9].reading}</text>
					</g>
					<g transform="translate(0.0,225.0)">
						<rect x="0" y="0" width="250" height="20" fill='lightskyblue' />
						<text x="15" y="15" fill="darkblue" font-size="1.0em" name='AHU' id='AHU' >{sensorsData && sensorsData[AIRFLW_VEL10].name}</text>
						<rect x="250" y="0" width="120" height="20" fill='greenyellow	' />
						<text x="265" y="15" fill="black" font-size="1.0em" name='CHILLER_A_CHS_PRESS1' id='CHILLER_A_CHS_PRESS1'>{sensorsData && sensorsData[AIRFLW_VEL10].reading}</text>
					</g>
				</g>
			</g>
		)		
	}
	const handleChangeMode = () => {
		mode === "play" ? setPlayMode("pause") : setPlayMode("play")
	}
	const handleNextMode = () => {
		setCounter((counter<15) ? 17: 1);
	}
	const getFetchDateTimelabel = () => {
		let _date = new Date(fetchDateTime);
		return `LAST UPDATE ${_date.toLocaleDateString()}:${_date.toLocaleTimeString()}`;
	}
	// ---------------------
	return (
		// <MDBRow center>
			<MDBCol md="12">
				{ mode === "play"  && <MDBIcon far icon="pause-circle" size="2x" onClick={()=>handleChangeMode()}/> }
				{ mode === "pause" && <MDBIcon far icon="play-circle" size="2x"  onClick={()=>handleChangeMode()}/> }
				<MDBIcon far icon="arrow-alt-circle-right" size='2x' onClick={()=>handleNextMode()}/> { getFetchDateTimelabel() }
				
				<MDBCard className="p-0" style={{width:"auto"}} >
				<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="1800" height="780" 
						 viewBox="0 0 1800 780"  preserveAspectRatio="xMidYMid meet" >
					<g transform="translate(2,60) scale(0.90,0.90)" fill={color} >

						<def>
							<radialGradient id="grad1" cx="50%" cy="50%" r="25%" fx="25%" fy="25%">
									<stop offset="0%" style={{stopColor:'rgb(255,255,255)',stopOpacity:0}} />
									<stop offset="100%" style={{stopColor:'rgb(0,0,255)',stopOpacity:1}} />
							</radialGradient>
							<filter id="heatMap">
									{/* <!--Blur effect--> */}
									<feGaussianBlur in="SourceGraphic" stdDeviation="20"/>
							</filter>
						</def>

						{ counter > 15 ? DRAWFPLAN() : DRAWSCHEMATIC() }

					</g>
				</svg>
				</MDBCard>
			</MDBCol>
		// </MDBRow>
	)
}

// Set default props
TDK_IsoVIEW.defaultProps = {
  color: "black",
  handleComponetSelection: null
};
export default TDK_IsoVIEW