import React, { useState, useEffect, useContext, Fragment } from 'react';
import { MDBContainer,MDBCard,MDBCardTitle,MDBCardText,MDBRow,MDBCardBody,  } from 'mdbreact';
import {
  CTW_A_TEMP1,CTW_A_TEMP2,CTW_B_TEMP1,CTW_B_TEMP2,
  CTW_A_CWS_PRESS1,CTW_A_CWS_PRESS2,CTW_A_CWR_PRESS,
  CTW_B_CWS_PRESS1,CTW_B_CWS_PRESS2,CTW_B_CWR_PRESS,
  WCPU_A_TEMP1, WCPU_A_TEMP2,
  WCPU_A_CWS_PRESS, WCPU_A_CWR_PRESS1,WCPU_A_CWR_PRESS2,
  WCPU_B_TEMP1, WCPU_B_TEMP2,  
  WCPU_B_CWR_PRESS, WCPU_B_CWS_PRESS1,WCPU_B_CWS_PRESS2,
  AHU_A_TEMP1,AHU_A_TEMP2,
  AHU_A_CHR_PRESS1,AHU_A_CHR_PRESS2,AHU_A_CHS_PRESS,
  AHU_B_TEMP1,AHU_B_TEMP2,
  AHU_B_CHR_PRESS1,AHU_B_CHR_PRESS2,AHU_B_CHS_PRESS,

  CHILLER_A_CH_TEMP1, CHILLER_A_CH_TEMP2, CHILLER_A_CW_TEMP1, CHILLER_A_CW_TEMP2,
  CHILLER_A_CHS_PRESS1,CHILLER_A_CHS_PRESS2,CHILLER_A_CHR_PRESS,CHILLER_A_CWS_PRESS1,CHILLER_A_CWS_PRESS2,CHILLER_A_CWR_PRESS,
  CHILLER_B_CH_TEMP1, CHILLER_B_CH_TEMP2,CHILLER_B_CW_TEMP1, CHILLER_B_CW_TEMP2,  
  CHILLER_B_CHS_PRESS1,CHILLER_B_CHS_PRESS2,CHILLER_B_CHR_PRESS,CHILLER_B_CWS_PRESS1,CHILLER_B_CWS_PRESS2,

	AIR_COMPRESSOR1,AIR_COMPRESSOR2,AIR_COMPRESSOR3,
	AIRFLOW_RH1,AIRFLOW_RH2,AIRFLOW_RH3,
	AIRFLW_VEL1,AIRFLW_VEL2,AIRFLW_VEL3,AIRFLW_VEL4,AIRFLW_VEL5,
	AIRFLW_VEL6,AIRFLW_VEL7,AIRFLW_VEL8,AIRFLW_VEL9,AIRFLW_VEL10,
	PWRMTR_01,PWRMTR_02,PWRMTR_03,PWRMTR_04,PWRMTR_05,PWRMTR_06,PWRMTR_07,PWRMTR_08,PWRMTR_09,PWRMTR_10,
	PWRMTR_11,PWRMTR_12,PWRMTR_13,PWRMTR_14,PWRMTR_15,PWRMTR_16,PWRMTR_17,PWRMTR_18,PWRMTR_19,PWRMTR_20,
	PWRMTR_21,PWRMTR_22,PWRMTR_23,PWRMTR_24,PWRMTR_25,PWRMTR_26,PWRMTR_27,PWRMTR_28,PWRMTR_29,PWRMTR_30
} from '../types';

function SYSTEMPERFModule ( { sensorsData} ) {
  // -----
  const getReading = (sensor) => {
    let _label = ""
    if (sensor !== null) _label = `${sensor.reading}bar <${sensor.dtuId}#${sensor.sensorId}>`;
    return _label;
  }
  return (
    <MDBRow center>

        {/* CHILLER A */}
				<MDBCard className="p-3 m-2" style={{ width: "30rem" }}>
          <MDBCardTitle tag="h4">CHILLER A (DN125)</MDBCardTitle>
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">CHILLED WATER PIPE</MDBCardText>
              <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
                <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_A_CH_TEMP1].reading).toFixed(1)}&deg;C CHS TEMP</MDBCardText>
                <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_A_CH_TEMP2].reading).toFixed(1)}&deg;C CHR TEMP</MDBCardText>
                <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[CHILLER_A_CH_TEMP1].reading - sensorsData[CHILLER_A_CH_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
              </MDBContainer>
              <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
                <MDBCardText tag="h5">CHS PRESS1 = {sensorsData && getReading(sensorsData[CHILLER_A_CHS_PRESS1])}</MDBCardText>
                <MDBCardText tag="h5">CHS PRESS2 = {sensorsData && getReading(sensorsData[CHILLER_A_CHS_PRESS2])}</MDBCardText>
                <MDBCardText tag="h5">CHR PRESS = {sensorsData && getReading(sensorsData[CHILLER_A_CHR_PRESS])}</MDBCardText>
                <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
              </MDBContainer>
              <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
                <MDBCardText tag="h5">HEAT ENERGY</MDBCardText>
              </MDBContainer>
            </MDBContainer>
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">COOL WATER PIPE</MDBCardText>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_A_CW_TEMP1].reading).toFixed(1)}&deg;C CWS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_A_CW_TEMP2].reading).toFixed(1)}&deg;C CWR TEMP</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">CWR PRESS1 = {sensorsData && getReading(sensorsData[CHILLER_A_CWS_PRESS1])}</MDBCardText>
              <MDBCardText tag="h5">CWR PRESS2 = {sensorsData && getReading(sensorsData[CHILLER_A_CWS_PRESS2])}</MDBCardText>
              <MDBCardText tag="h5">CWS PRESS = {sensorsData && getReading(sensorsData[CHILLER_A_CWR_PRESS])}</MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
          </MDBContainer>
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_05].reading}kWHr</MDBCardText>
          </MDBContainer>
				</MDBCard>

        {/* CHILLER B */}
				<MDBCard className="p-3 m-2" style={{ width: "30rem" }}>
          <MDBCardTitle tag="h4">CHILLER B (DN125)</MDBCardTitle>
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">CHILLED WATER PIPE</MDBCardText>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_B_CH_TEMP1].reading).toFixed(1)}&deg;C CHS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_B_CH_TEMP2].reading).toFixed(1)}&deg;C CHR TEMP</MDBCardText>
              <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[CHILLER_B_CH_TEMP1].reading - sensorsData[CHILLER_B_CH_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">CHS PRESS1 = {sensorsData && getReading(sensorsData[CHILLER_B_CHS_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CHS PRESS2 = {sensorsData && getReading(sensorsData[CHILLER_B_CHS_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">CHR PRESS = {sensorsData && getReading(sensorsData[CHILLER_B_CHR_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">HEAT ENERGY</MDBCardText>
            </MDBContainer>
          </MDBContainer>
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">COOL WATER PIPE</MDBCardText>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_B_CW_TEMP1].reading).toFixed(1)}&deg;C CWS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CHILLER_B_CW_TEMP2].reading).toFixed(1)}&deg;C CWR TEMP</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">CWR PRESS1 = {sensorsData && getReading(sensorsData[CHILLER_B_CWS_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CWR PRESS2 = {sensorsData && getReading(sensorsData[CHILLER_B_CWS_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">CWS PRESS = {sensorsData && getReading(sensorsData[CHILLER_B_CHR_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
          </MDBContainer>
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_15].reading}kWHr</MDBCardText>
          </MDBContainer>
				</MDBCard>

        {/* COOLING TOWER A & B*/}
				<MDBCard className="p-3 m-2" style={{ width: "30rem" }}>
          <MDBCardTitle tag="h4">COOLING TOWER (DN80)</MDBCardTitle>
          {/* COOLING TOWER A */}
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">COOLING TOWER A</MDBCardText>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CTW_A_TEMP1].reading).toFixed(1)}&deg;C CTS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CTW_A_TEMP2].reading).toFixed(1)}&deg;C CTR TEMP</MDBCardText>
              <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[CTW_A_TEMP1].reading - sensorsData[CTW_A_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">CTS PRESS1 = {sensorsData && getReading(sensorsData[CTW_A_CWS_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CTS PRESS2 = {sensorsData && getReading(sensorsData[CTW_A_CWS_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">CTR PRESS = {sensorsData && getReading(sensorsData[CTW_A_CWR_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">HEAT ENERGY</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_12].reading}kWHr</MDBCardText>
            </MDBContainer>
          </MDBContainer>
          {/* COOLING TOWER B */}
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">COOLNG TOWER B</MDBCardText>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CTW_B_TEMP1].reading).toFixed(1)}&deg;C CTS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[CTW_B_TEMP2].reading).toFixed(1)}&deg;C CTR TEMP</MDBCardText>
              <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[CTW_B_TEMP1].reading - sensorsData[CTW_B_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%"}}>
              <MDBCardText tag="h5">CTS PRESS1 = {sensorsData && getReading(sensorsData[CTW_B_CWS_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CTS PRESS2 = {sensorsData && getReading(sensorsData[CTW_B_CWS_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">CTR PRESS = {sensorsData && getReading(sensorsData[CTW_B_CWR_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">HEAT ENERGY</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_16].reading}kWHr</MDBCardText>
            </MDBContainer>
          </MDBContainer>
				</MDBCard>

        {/* WCPU A & B */}
				<MDBCard className="p-3 m-2" style={{ width: "30rem" }}>
					<MDBCardTitle tag="h4">WCPU (DN80)</MDBCardTitle>
          {/* WCPU A */}
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">WCPU A</MDBCardText>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[WCPU_A_TEMP1].reading).toFixed(1)}&deg;C CWS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[WCPU_A_TEMP2].reading).toFixed(1)}&deg;C CWR TEMP</MDBCardText>
              <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[WCPU_A_TEMP1].reading - sensorsData[WCPU_A_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">CWS PRESS = {sensorsData && getReading(sensorsData[WCPU_A_CWS_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">CWR PRESS 1 = {sensorsData && getReading(sensorsData[WCPU_A_CWR_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CWR PRESS 2 = {sensorsData && getReading(sensorsData[WCPU_A_CWR_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">HEAT ENERGY</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">ELECTRICAL ENERGY</MDBCardText>
            </MDBContainer>
          </MDBContainer>
          {/* WCPU B */}
          <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
            <MDBCardText tag="h5">WCPU B</MDBCardText>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[WCPU_B_TEMP1].reading).toFixed(1)}&deg;C CTS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[WCPU_B_TEMP2].reading).toFixed(1)}&deg;C CTR TEMP</MDBCardText>
              <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[WCPU_B_TEMP1].reading - sensorsData[WCPU_B_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">CWR PRESS = {sensorsData && getReading(sensorsData[WCPU_B_CWR_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">CWS PRESS 1 = {sensorsData && getReading(sensorsData[WCPU_B_CWS_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CWS PRESS 2 = {sensorsData && getReading(sensorsData[WCPU_B_CWS_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">HEAT ENERGY</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">ELECTRICAL ENERGY</MDBCardText>
            </MDBContainer>
          </MDBContainer>
				</MDBCard>

        {/* PRE-COOL FE */}
				<MDBCard className="p-3 m-2" style={{ width: "30rem" }}>

          {/* HEAT EXCHANGER */}
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
  					<MDBCardTitle tag="h5">HEAT EXCHANGE</MDBCardTitle>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[AHU_A_TEMP1].reading).toFixed(1)}&deg;C CWS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[AHU_A_TEMP2].reading).toFixed(1)}&deg;C CWR TEMP</MDBCardText>
              <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[WCPU_A_TEMP1].reading - sensorsData[WCPU_A_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">CHR PRESS 1 = {sensorsData && getReading(sensorsData[AHU_A_CHR_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CHR PRESS 2 = {sensorsData && getReading(sensorsData[AHU_A_CHR_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">CHS PRESS = {sensorsData && getReading(sensorsData[AHU_A_CHS_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_11].reading}kWHr</MDBCardText>
            </MDBContainer>
          </MDBContainer>

          {/* PRE-COOL (FE) */}
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
					  <MDBCardTitle tag="h5">PRE-COOL (FE)</MDBCardTitle>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[AHU_B_TEMP1].reading).toFixed(1)}&deg;C CWS TEMP</MDBCardText>
              <MDBCardText tag="h5">{sensorsData && Number(sensorsData[AHU_B_TEMP2].reading).toFixed(1)}&deg;C CWR TEMP</MDBCardText>
              <MDBCardText tag="h5">ΔTemp = {sensorsData && (Number(sensorsData[WCPU_A_TEMP1].reading - sensorsData[WCPU_A_TEMP2].reading)).toFixed(1)}&deg;C</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-secondary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">CHR PRESS 1 = {sensorsData && getReading(sensorsData[AHU_B_CHR_PRESS1])} </MDBCardText>
              <MDBCardText tag="h5">CHR PRESS 2 = {sensorsData && getReading(sensorsData[AHU_B_CHR_PRESS2])} </MDBCardText>
              <MDBCardText tag="h5">CHS PRESS = {sensorsData && getReading(sensorsData[AHU_B_CHS_PRESS])} </MDBCardText>
              <MDBCardText tag="h5">FLOW RATE = Q = √(Kv × (ΔP/S))</MDBCardText>
            </MDBContainer>
            <MDBContainer className="p-2 m-2 border border-primary" style={{ width: "95%" }}>
              <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_13].reading}kWHr</MDBCardText>
            </MDBContainer>
          </MDBContainer>

          {/* FAN COIL UNITS */}
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
            <MDBCardTitle tag="h5">FAN COIL UNITS</MDBCardTitle>
          </MDBContainer>

				</MDBCard>

        {/* PUMPS - CHW & CW*/}
				<MDBCard className="p-3 m-2" style={{ width: "30rem" }}>
          <MDBCardTitle tag="h4">PUMPS</MDBCardTitle>
          {/* CHPUMP */}
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
            <MDBCardText tag="h5">CHILLED WATER PUMP</MDBCardText>
            <MDBCardText tag="h5">OVERALL ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_14].reading}kWHr</MDBCardText>
          </MDBContainer>
          {/* CWPUMP */}
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
            <MDBCardText tag="h5">COOLED WATER PUMP</MDBCardText>
            <MDBCardText tag="h5">CWP1 ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_17].reading}kWHr</MDBCardText>
            <MDBCardText tag="h5">CWP2 ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_18].reading}kWHr</MDBCardText>
            <MDBCardText tag="h5">CWP3 ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_10].reading}kWHr</MDBCardText>
          </MDBContainer>
				</MDBCard>

        {/* COMPRESSED AIR UNIT */}
				<MDBCard className="p-3 m-2" style={{ width: "30rem" }}>
					<MDBCardTitle tag="h4">COMPRESSED AIR UNIT</MDBCardTitle>
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
            <MDBCardText tag="h5">CT 1</MDBCardText>
            <MDBCardText tag="h5">PRESSURE READING  {sensorsData && Number(sensorsData[AIR_COMPRESSOR1].reading).toFixed(2)}bar</MDBCardText>
            <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_09].reading}kWHr</MDBCardText>
          </MDBContainer>
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
            <MDBCardText tag="h5">CT 2</MDBCardText>
            <MDBCardText tag="h5">PRESSURE READING  {sensorsData && Number(sensorsData[AIR_COMPRESSOR2].reading).toFixed(2)}bar</MDBCardText>
            <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_04].reading}kWHr</MDBCardText>
          </MDBContainer>
          <MDBContainer className="p-2 m-2 border border-primary"  style={{ width: "95%" }}>
            <MDBCardText tag="h5">CT 3</MDBCardText>
            <MDBCardText tag="h5">PRESSURE READING {sensorsData && Number(sensorsData[AIR_COMPRESSOR3].reading).toFixed(2)}bar</MDBCardText>
            <MDBCardText tag="h5">ELECTRICAL ENERGY {sensorsData && sensorsData[PWRMTR_06].reading}kWHr</MDBCardText>
          </MDBContainer>
				</MDBCard>
    </MDBRow>
  )
}
SYSTEMPERFModule .defaultProps = {
    color: "black",
    handleComponetSelection: null,
    title:'PRODUCTION FLOOR PLAN'
 };

export default SYSTEMPERFModule 