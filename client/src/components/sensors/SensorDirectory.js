import React, { useState } from 'react';
import Sensors from './Sensor';
import SensorForm from './SensorForm';
import SensorFilter from './SensorFilter';
import { MDBContainer,MDBRow,MDBCol } from 'mdbreact';

const SensorDirectory = ({user}) => {
  // -------------
  const [SensorInfo,setSensor] = useState(null);
  // ------
  const SelectSensor = (sensor) => {
    // ---------------
    setSensor(sensor);
    // ---------------
  }
  const ClearSelectSensor = () => {
    setSensor(null)
  }
  // ------
  return (
  <MDBContainer style={{width: "auto",position: "relative",marginTop: '2rem',zIndex: 0}} >
    <SensorFilter />
    <MDBRow className="py-2 px-2">
      <MDBCol md='9'>
        <Sensors SelectSensor={SelectSensor}/>
      </MDBCol>
      {
        SensorInfo && (
          <MDBCol md='3'>
            <SensorForm SensorInfo={SensorInfo} ClearSelectSensor={ClearSelectSensor}/>
          </MDBCol>
        )
      }
    </MDBRow>
  </MDBContainer>
  )
}

export default SensorDirectory
