import React, { Fragment } from 'react';
import { MDBRow } from 'mdbreact';

import TDK_AHU from './svg/AHU';
import TDK_AHU_PUMP from './svg/AHU_PUMP';
import TDK_CHILLER from './svg/CHILLER';
import TDK_CHILLER_PUMP from './svg/CHILLER_PUMP';
import TDK_COOLINGTOWER from './svg/COOLINGTOWER';
import TDK_COOLINGTOWER_PUMP from './svg/COOLINGTOWER_PUMP';
import TDK_WCPU from './svg/WCPU';

import SparklinePlots from '../data-ui/SparklinePlots';

import Chart from "react-google-charts";
import Thermometer from './Thermometer'

import { 
  CTW_A_TEMP1,CTW_A_TEMP2,CTW_A_FLOWRATE,CTW_A_ELECTPWR, 
  CTW_B_TEMP1,CTW_B_TEMP2,CTW_B_FLOWRATE,CTW_B_ELECTPWR,
  CTW_A_CWS_PRESS1,CTW_A_CWS_PRESS2,CTW_A_CWR_PRESS,
  CTW_B_CWS_PRESS1,CTW_B_CWS_PRESS2,CTW_B_CWR_PRESS,

  WCPU_A_TEMP1, WCPU_A_TEMP2, WCPU_A_FLOWRATE, WCPU_A_ELECTPWR,
  WCPU_B_TEMP1, WCPU_B_TEMP2, WCPU_B_FLOWRATE, WCPU_B_ELECTPWR,
  WCPU_A_CWS_PRESS1, WCPU_A_CWS_PRESS2, WCPU_A_CWR_PRESS,
  WCPU_B_CWS_PRESS1, WCPU_B_CWS_PRESS2, WCPU_B_CWR_PRESS,

  AHU_A_TEMP1,AHU_A_TEMP2,AHU_A_FLOWRATE,AHU_A_ELECTPWR,
  AHU_B_TEMP1,AHU_B_TEMP2,AHU_B_FLOWRATE,AHU_B_ELECTPWR,
  AHU_A_CHR_PRESS1, AHU_A_CHR_PRESS2, AHU_A_CHS_PRESS,
  AHU_B_CHR_PRESS1, AHU_B_CHR_PRESS2, AHU_B_CHS_PRESS,

  CHILLER_A_CH_TEMP1, CHILLER_A_CH_TEMP2, CHILLER_A_CH_FLOWRATE, 
  CHILLER_A_CW_TEMP1, CHILLER_A_CW_TEMP2, CHILLER_A_CW_FLOWRATE,
  CHILLER_B_CH_TEMP1, CHILLER_B_CH_TEMP2, CHILLER_B_CH_FLOWRATE, 
  CHILLER_B_CW_TEMP1, CHILLER_B_CW_TEMP2, CHILLER_B_CW_FLOWRATE,
  CHILLER_A_ELECTPWR, CHILLER_B_ELECTPWR,
  CHILLER_A_CHS_PRESS1, CHILLER_A_CHS_PRESS2, CHILLER_A_CHR_PRESS,
  CHILLER_A_CWS_PRESS1, CHILLER_A_CWS_PRESS2, CHILLER_A_CWR_PRESS,
  CHILLER_B_CHS_PRESS1, CHILLER_B_CHS_PRESS2, CHILLER_B_CHR_PRESS,
  CHILLER_B_CWS_PRESS1, CHILLER_B_CWS_PRESS2, CHILLER_B_CWR_PRESS,

  PUMP_AHU_1_ELECTPWR, PUMP_AHU_2_ELECTPWR, PUMP_AHU_3_ELECTPWR,
  PUMP_CTW_1_ELECTPWR, PUMP_CTW_2_ELECTPWR, PUMP_CTW_3_ELECTPWR
} from '../types';

const HVACSysModule = ({sensorsData,systemComponent}) => {
    // ---------
    return (
			<MDBRow center>
				{/* AIR HANDLING UNITS */}
				<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
					{sensorsData && systemComponent && systemComponent === 'AHU' && getThemrmometer( { 
											title : 'AHU',
											sensors : ['A_CHS','A_CHR','B_CHS','B_CHR'],
											data : [ sensorsData[AHU_A_TEMP1], sensorsData[AHU_A_TEMP2], sensorsData[AHU_B_TEMP1], sensorsData[AHU_B_TEMP2] ],
											redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					{sensorsData && systemComponent && systemComponent === 'AHU' && getDialGauge( { 
							title : 'AHU (PRESSURE GAUGE)',
							sensors : ['CHR_A_1','CHR_A_2','CHS_A','CHR_B_1','CHR_B_2','CHS_B'],
							data : [['Label', 'Value'],
											['bar',Number(sensorsData['AHU_A_CHR_PRESS1'])/100], ['bar',Number(sensorsData['AHU_A_CHR_PRESS2'])/100],
											['bar',Number(sensorsData['AHU_A_CHS_PRESS'])/100], ['bar',Number(sensorsData['AHU_B_CHR_PRESS1'])/100],
											['bar',Number(sensorsData['AHU_B_CHR_PRESS2'])/100], ['bar',Number(sensorsData['AHU_B_CHS_PRESS'])/100] ],
											redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					{sensorsData && systemComponent && systemComponent === 'AHU' && getDialGauge( { 
											title : 'AHU (FLOWRATE) COMPUTED',
											sensors : ['A_CHS','B_CHS'],
											data : [['Label', 'Value'],
															['m3/s',sensorsData[AHU_A_FLOWRATE]], ['m3/s',sensorsData[AHU_B_FLOWRATE]] ],
											redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					{sensorsData && systemComponent && systemComponent === 'AHU' && getPowerMeter( { 
							title : 'WCPU POWER METER',
							sensors : ['AHU CLEAN ROOM','PRE-COOL FE','AHU-FE','DEHUMIDIFIER 1','DEHUMIDIFIER 2','DEHUMIDIFIER 3','HEAT EXCHANGER'],
							data : [ ['Label', 'Value'],
											['m3/s',sensorsData[WCPU_A_FLOWRATE]], ['m3/s',sensorsData[WCPU_B_FLOWRATE]] ],
							redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
				</div>
				{/* CHILLER */}
				<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
					{sensorsData && systemComponent && systemComponent === 'CHILLER' && getThemrmometer( { 
							title : 'CHILLER',
							sensors : ['A_CHS','A_CHR','A_CWS','A_CWR','B_CHS','B_CHR','B_CWS','B_CWR'],
							data : [ Number(sensorsData[CHILLER_A_CH_TEMP1]), Number(sensorsData[CHILLER_A_CH_TEMP2]), Number(sensorsData[CHILLER_A_CW_TEMP1]),
											 Number(sensorsData[CHILLER_A_CW_TEMP2]), Number(sensorsData[CHILLER_B_CH_TEMP1]), Number(sensorsData[CHILLER_B_CH_TEMP2]), 
											 Number(sensorsData[CHILLER_B_CW_TEMP1]), Number(sensorsData[CHILLER_B_CW_TEMP2]) ],
							redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					{sensorsData && systemComponent && systemComponent === 'CHILLER' && getDialGauge( { 
							title : 'CHILLER A (PRESSURE GAUGE)',
							sensors : ['CHS_A_1','CHS_A_2','CHR_A','CWS_A_1','CWS_A_2','CWR_A'],
							data : [['Label', 'Value'],
											['bar',Number(sensorsData[CHILLER_A_CHS_PRESS1])/100], ['bar',Number(sensorsData[CHILLER_A_CHS_PRESS2])/100],
											['bar',Number(sensorsData[CHILLER_A_CHR_PRESS])/100], ['bar',Number(sensorsData[CHILLER_A_CWS_PRESS1])/100],
											['bar',Number(sensorsData[CHILLER_A_CWS_PRESS2])/100], ['bar',Number(sensorsData[CHILLER_A_CWR_PRESS])/100] ],
							redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					{sensorsData && systemComponent && systemComponent === 'CHILLER' && getDialGauge( { 
							title : 'CHILLER B (PRESSURE GAUGE)',
							sensors : ['CHS_B_1','CHS_B_2','CHR_B','CWS_B_1','CWS_B_2','CWR_B'],
							data : [['Label', 'Value'],
											['bar',Number(sensorsData[CHILLER_B_CHS_PRESS1])/100], ['bar',Number(sensorsData[CHILLER_B_CHS_PRESS2])/100],
											['bar',Number(sensorsData[CHILLER_B_CHR_PRESS])/100], ['bar',Number(sensorsData[CHILLER_B_CWS_PRESS1])/100],
											['bar',Number(sensorsData[CHILLER_B_CWS_PRESS2])/100], ['bar',Number(sensorsData[CHILLER_B_CWR_PRESS])/100] ],
							redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					{sensorsData && systemComponent && systemComponent === 'CHILLER' && getDialGauge( { 
							title : 'CHILLER (FLOW RATE) COMPUTED',
							sensors : ['CHS_A','CHS_B','CWS_A','CWS_B'],
							data : [['Label', 'Value'],
											['m3/s',Number(sensorsData[CHILLER_A_CH_FLOWRATE])], ['m3/s',Number(sensorsData[CHILLER_A_CW_FLOWRATE])],
											['m3/s',Number(sensorsData[CHILLER_B_CH_FLOWRATE])], ['m3/s',Number(sensorsData[CHILLER_B_CW_FLOWRATE])] ],
							redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
					{sensorsData && systemComponent && systemComponent === 'CHILLER' && getPowerMeter( { 
							title : 'WCPU POWER METER',
							sensors : ['CHILLER_A','CHILLER_B'],
							data : [ ['Label', 'Value'],
											['m3/s',Number(sensorsData[WCPU_A_FLOWRATE])], ['m3/s',Number(sensorsData[WCPU_B_FLOWRATE])] ],
							redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
				</div>
				{/* COOLING TOWER */}
				<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'CTW' && getThemrmometer( { 
										title : 'COOLING TOWER',
										sensors : ['A_CWS','A_CWR','B_CWS','B_CWR'],
										data : [sensorsData[CTW_A_TEMP1],sensorsData[CTW_A_TEMP2],sensorsData[CTW_B_TEMP1],sensorsData[CTW_B_TEMP2] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
						<Fragment>
							{sensorsData && systemComponent && systemComponent === 'CTW' && getDialGauge( { 
									title : 'COOLING TOWER (PRESSURE GAUGE)',
									sensors : ['CWS_A_1','CWS_A_2','CWR_A','CWS_B_1','CWS_B_2','CWR_B'],
									data : [['Label', 'Value'],
													['bar',Number(sensorsData[CTW_A_CWS_PRESS1])/100], ['bar',Number(sensorsData[CTW_A_CWS_PRESS2])/100],
													['bar',Number(sensorsData[CTW_A_CWR_PRESS])/100], ['bar',Number(sensorsData[CTW_B_CWS_PRESS1])/100],
													['bar',Number(sensorsData[CTW_B_CWS_PRESS2])/100], ['bar',Number(sensorsData[CTW_B_CWR_PRESS])/100] ],
									redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'CTW' && getDialGauge( { 
										title : 'COOLING TOWER (FLOW RATE) COMPUTED',
										sensors : ['CWS_A','CWS_B'],
										data : [['Label', 'Value'],
														['m3/s',sensorsData[CTW_A_TEMP1]], ['m3/s',sensorsData[CTW_A_TEMP2]] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'CTW' && getPowerMeter( { 
										title : 'WCPU POWER METER',
										sensors : ['CTW_A','CTW_B'],
										data : [ ['Label', 'Value'],
														['m3/s',sensorsData[WCPU_A_FLOWRATE]], ['m3/s',sensorsData[WCPU_B_FLOWRATE]] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
				</div>
				{/* WATER COOLING PACK  */}
				<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'WCPU' && getThemrmometer( { 
										title : 'WCPU (TEMPERATURE)',
										sensors : ['A_CWS','A_CWR','B_CWS','B_CWR'],
										data : [ sensorsData[WCPU_A_TEMP1], sensorsData[WCPU_A_TEMP2], sensorsData[WCPU_B_TEMP1], sensorsData[WCPU_B_TEMP2] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'WCPU' && getDialGauge( { 
										title : 'WCPU (PRESSURE GAUGE)',
										sensors : ['CWS_A_1','CWS_A_2','CWR_A','CWS_B_1','CWS_B_2','CWR_B'],
										data : [['Label', 'Value'],
														['bar',Number(sensorsData[WCPU_A_CWS_PRESS1])/100], ['bar',Number(sensorsData[WCPU_A_CWS_PRESS2])/100],
														['bar',Number(sensorsData[WCPU_A_CWR_PRESS])/100], ['bar',Number(sensorsData[WCPU_B_CWS_PRESS1])/100],
														['bar',Number(sensorsData[WCPU_B_CWS_PRESS2])/100], ['bar',Number(sensorsData[WCPU_B_CWR_PRESS])/100] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'WCPU' && getDialGauge( { 
										title : 'WCPU (FLOW RATE) COMPUTED',
										sensors : ['CWS_A','CWS_B'],
										data : [ ['Label', 'Value'],
														['m3/s',sensorsData[WCPU_A_FLOWRATE]], ['m3/s',sensorsData[WCPU_B_FLOWRATE]] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'WCPU' && getPowerMeter( { 
										title : 'WCPU POWER METER',
										sensors : ['WCPU_B'],
										data : [ ['Label', 'Value'],
														['m3/s',sensorsData[WCPU_A_FLOWRATE]], ['m3/s',sensorsData[WCPU_B_FLOWRATE]] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
				</div>
				{/* PUMP AHU */}
				<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'PMP_AHU' && getPowerMeter( { 
										title : 'AHU PUMP POWER METER',
										sensors : ['CHWP_1','CHWP_2','CHWP_3'],
										data : [ ['Label', 'Value'],
														['m3/s',sensorsData[WCPU_A_FLOWRATE]], ['m3/s',sensorsData[WCPU_B_FLOWRATE]] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
				</div>
				{/* PUMP CTW */}
				<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center',flexDirection:'column'}}>
						<Fragment>
								{sensorsData && systemComponent && systemComponent === 'PMP_CW' && getPowerMeter( { 
										title : 'CTW PUMP POWER METER',
										sensors : ['CWP_1','CWP_2','CWP_3'],
										data : [ ['Label', 'Value'],
														['m3/s',sensorsData[WCPU_A_FLOWRATE]], ['m3/s',sensorsData[WCPU_B_FLOWRATE]] ],
										redFrom: 90, redTo: 100, yellowFrom: 75, yellowTo: 90, minorTicks: 5})}
						</Fragment>
				</div>
				{/* COMPONENTS SVG */}
				<div style={{margin:'5px'}}>
						{ sensorsData && systemComponent && systemComponent === 'AHU' &&  <TDK_AHU color='blue' sensorsData={sensorsData}/> }
						{ sensorsData && systemComponent && systemComponent === 'PMP_AHU' &&  <TDK_AHU_PUMP color='blue' /> }
						{ sensorsData && systemComponent && systemComponent === 'CHILLER' &&  <TDK_CHILLER color='blue' sensorsData={sensorsData}/> }
						{ sensorsData && systemComponent && systemComponent === 'PMP_CHILLER' &&  <TDK_CHILLER_PUMP color='blue' /> }
						{ sensorsData && systemComponent && systemComponent === 'CTW' &&  <TDK_COOLINGTOWER color='blue' sensorsData={sensorsData} /> }
						{ sensorsData && systemComponent && systemComponent === 'PMP_CW' &&  <TDK_COOLINGTOWER_PUMP color='blue' /> }
						{ sensorsData && systemComponent && systemComponent === 'WCPU' &&  <TDK_WCPU color='blue' sensorsData={sensorsData}/> }
				</div>
				{/* SPARKLINE PLOTS */}
				<div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'center'}}>
					{/* AIR HANDLING UNITS */}
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'AHU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={ [AHU_A_TEMP1,AHU_A_TEMP2,AHU_B_TEMP1,AHU_B_TEMP2] }/> }
					</Fragment>
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'AHU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={ [AHU_A_CHR_PRESS1,AHU_A_CHR_PRESS2,AHU_A_CHS_PRESS,AHU_B_CHR_PRESS1,AHU_B_CHR_PRESS2,AHU_B_CHS_PRESS] }/> }
					</Fragment>
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'AHU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={ [AHU_A_FLOWRATE,AHU_B_FLOWRATE] }/> }
					</Fragment>
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'AHU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={ [AHU_A_ELECTPWR,AHU_B_ELECTPWR] }/> }
					</Fragment>
					{/* PUMP AIR HANDLING UNITS */}
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'PMP_AHU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={ [PUMP_AHU_1_ELECTPWR,PUMP_AHU_2_ELECTPWR,PUMP_AHU_3_ELECTPWR] }/> }
					</Fragment>
					{/* CHILLERS */}
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CHILLER' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[CHILLER_A_CH_TEMP1,CHILLER_A_CH_TEMP2,CHILLER_A_CW_TEMP1,CHILLER_A_CW_TEMP2,
																					CHILLER_B_CH_TEMP1,CHILLER_B_CH_TEMP2,CHILLER_B_CW_TEMP1,CHILLER_B_CW_TEMP2]}/> }
					</Fragment>
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CHILLER' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[  CHILLER_A_CHS_PRESS1, CHILLER_A_CHS_PRESS2, CHILLER_A_CHR_PRESS, CHILLER_A_CWS_PRESS1, CHILLER_A_CWS_PRESS2, CHILLER_A_CWR_PRESS ]}/> }
					</Fragment>
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CHILLER' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[  CHILLER_B_CHS_PRESS1, CHILLER_B_CHS_PRESS2, CHILLER_B_CHR_PRESS, CHILLER_B_CWS_PRESS1, CHILLER_B_CWS_PRESS2, CHILLER_B_CWR_PRESS ]}/> }
					</Fragment>
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CHILLER' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[CHILLER_A_CH_FLOWRATE,CHILLER_B_CH_FLOWRATE,CHILLER_A_CW_FLOWRATE,CHILLER_B_CW_FLOWRATE]}/> }
					</Fragment>
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CHILLER' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[CHILLER_A_ELECTPWR,CHILLER_B_ELECTPWR]}/> }
					</Fragment>                
					{/* PUMPS CHILLERS */}
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'PMP_CHILLER' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[]}/> }
					</Fragment>
					{/* COOLING TOWER */}
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CTW' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[CTW_A_TEMP1,CTW_A_TEMP2,CTW_B_TEMP1,CTW_B_TEMP2]}/> }
					</Fragment>
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CTW' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[CTW_A_CWS_PRESS1,CTW_A_CWS_PRESS2,CTW_A_CWR_PRESS,CTW_B_CWS_PRESS1,CTW_B_CWS_PRESS2,CTW_B_CWR_PRESS,]}/> }
					</Fragment>
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CTW' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[CTW_A_FLOWRATE,CTW_B_FLOWRATE]}/> }
					</Fragment>
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'CTW' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[CTW_A_ELECTPWR,CTW_B_ELECTPWR]}/> }
					</Fragment>
					{/* PUMP COOLING TOWER */}
					<Fragment>
									{ sensorsData && systemComponent && systemComponent === 'PMP_CW' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[PUMP_CTW_1_ELECTPWR,PUMP_CTW_2_ELECTPWR,PUMP_CTW_3_ELECTPWR]}/> }
					</Fragment>
					{/* WATER COOLING PACK UNITS */}
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'WCPU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[WCPU_A_TEMP1,WCPU_A_TEMP2,WCPU_B_TEMP1,WCPU_B_TEMP2]}/> }
					</Fragment>
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'WCPU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[WCPU_A_CWS_PRESS1, WCPU_A_CWS_PRESS2, WCPU_A_CWR_PRESS,WCPU_B_CWS_PRESS1, WCPU_B_CWS_PRESS2, WCPU_B_CWR_PRESS]}/> }
					</Fragment>
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'WCPU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[WCPU_A_FLOWRATE,WCPU_B_FLOWRATE]}/> }
					</Fragment>
					< Fragment>
									{ sensorsData && systemComponent && systemComponent === 'WCPU' &&  <SparklinePlots systemComponent = {systemComponent}
													sensorsData={null} 
													dataNames={[WCPU_A_ELECTPWR,WCPU_B_ELECTPWR]}/> }
					</Fragment>
				</div>
			</MDBRow>
    )
}

const getDialGauge = ({title,sensors,data}) => {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexWrap:'wrap',margin:'0px'}}>
        <p>{title}</p>
        <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap: '5px',margin:'0px'}}>
        {
            sensors.map( (sensor,index) => {
                let _gauge = [];
                _gauge.push(data[0])
                _gauge.push(data[index+1]);
                return(
                    <Fragment>
                        <hr />
                        <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center'}}>
                                <Chart width={120} height={120} chartType="Gauge"
                                        loader={<div>Loading Chart</div>}
                                        data={_gauge}
                                        options={{
																								max: 6,
                                                redFrom: 5,
                                                redTo: 6,
                                                yellowFrom: 4,
                                                yellowTo: 5,
                                                minorTicks: 5,}}
                                        rootProps={{ 'data-testid': '1' }}
                                />
                                <div style={{display:'inline-flex',justifyContent:'space-around',flexWrap:'wrap',gap: '20px',margin:'0px 0px'}}>
                                <p>{sensor}</p>
                                </div>
                        </div>
                        <hr />
                    </Fragment>
                )
            })
        }
        </div>        
    </div>
  )
}
const getThemrmometer = (data) => {
  return (
    <div style={{display:'flex',width:'90%',justifyContent:'center',flexWrap:'wrap',gap: '10px',margin:'25px 0px'}}>
        {
          data.data.map( (tempReading,index) => (    
            <div style={{display:'inline-flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexWrap:'wrap',margin:'0px'}}>
                <Thermometer reverseGradient='true' theme="dark" value={tempReading} max="32" steps="3" format="°C" size="small" height="120" />
                <p>{data.sensors[index]}</p>
            </div>
          ))
        }
     </div>
  )
}
const getPowerMeter = (data) => {
  return (
    <div style={{display:'inline-flex',flexDirection:'row',justifyContent:'space-around',flexWrap:'wrap',gap: '10px',alignItems:'flex-end',padding:'0px 5px 0px 10px'}}>
        {
          data.sensors.map( sensor => {
                return ( 
                     <div style={{display:'inline-flex',flexDirection:'row',alignItems:'center',borderRadius:'20px',border:'double gold 2px',
                                  justifyContent:'space-around',flexWrap:'wrap',gap: '1px',background:'blue',color:'white',padding:'10px'}}>
                        <p style={{padding:'10px'}}>  {sensor}  </p>
                        <div style={{border:'1px solid white',background:'black',padding:'2px 10px',textAlign:'right'}}>
                                <p>V(Average)</p>
                                <p>I(Average)</p>
                                <p>P(Total)</p>
                                <p>E(Delta)</p>
                        </div>
                        <div style={{border:'1px solid white',background:'black',padding:'2px 10px',textAlign:'left'}}>
                                <p>{randomExtend(210,225)}V</p>
                                <p>{randomExtend(10,30)}A</p>
                                <p>{randomExtend(20000,30000)}kW</p>
                                <p>{randomExtend(100,200)}Whr</p>
                        </div>
                     </div>   
                )
          })
        }
    </div>
  )
}
//  -----------
//  RANDOM DATA
//  -----------
function randomExtend(minNum, maxNum) {
  if (arguments.length === 1) {
    return parseInt(Math.random() * minNum + 1, 10)
  } else {
    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
  }
}
export default HVACSysModule;