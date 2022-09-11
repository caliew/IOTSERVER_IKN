import React, { useContext, useRef, useEffect } from 'react';
import { MDBContainer,MDBJumbotron,MDBIcon,MDBCardBody,MDBCard,MDBCardText } from 'mdbreact';
import SensorContext from '../../context/sensor/sensorContext';

const styledFilter = {
  display: 'inline-flex',
  alignItems:'center',
  gap:'20px'
}

const SensorFilter = () => {
  // ---------------
  const text = useRef('');
  const sensorContext = useContext(SensorContext);
  const { filterSensors, sensors, clearFilter, filtered } = sensorContext;
  // --------------
  useEffect(() => {
    if (filtered === null) {
      text.current.value = '';
    }
  });
  const onChange = e => {
    // NEED TO WAIT FOR LOADING COMPLETE
    if (!sensors) return;
    if (text.current.value !== '') {
      filterSensors(e.target.value);
    } else {
      clearFilter();
    }
  };
  // ----------
  return (
		<MDBContainer >
			<MDBJumbotron className="p-4">
        <h5>TOTAL SENSORS {sensors && sensors.length} &nbsp;&nbsp;
            FILTER BY SENSOR NAME,LOCATION,DTU ID,SENSOR ID</h5>
          <MDBIcon icon="filter" />&nbsp;&nbsp;
          <input ref={text} type='text' placeholder='(Name,Type,ID)...' onChange={onChange} />&nbsp;&nbsp;
          { sensors && ` .. FILTERED [${filtered ? filtered.length : 0 }]` }
      </MDBJumbotron>
    </MDBContainer>
  );
};

export default SensorFilter;
