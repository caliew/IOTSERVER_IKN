import React, { useContext, useEffect } from 'react';
import SensorItem from './SensorItem';
import Spinner from '../layout/Spinner';
import { MDBRow,MDBCardGroup } from 'mdbreact';
import SensorContext from '../../context/sensor/sensorContext';

const Sensors = ({SelectSensor}) => {
	// ---------------------
	// ACCESS SENSOR CONTEXT
	// ---------------------
	const sensorContext = useContext(SensorContext);
	const { sensors, filtered, getSensors, loading, } = sensorContext;
	// ---------------
	useEffect( ()=> {
			getSensors(30,null,null);
			// eslint-disable-next-line
	},[])
	// ---------
	return (
		<MDBRow className="masonry-with-columns">
			<MDBCardGroup deck className="justify-content-center">
				{sensors !== null && !loading ? (
					filtered !== null ? filtered.map(sensor => (<SensorItem sensor={sensor} SelectSensor={SelectSensor}/>))
								: sensors.map(sensor => (<SensorItem sensor={sensor} SelectSensor={SelectSensor}/>))
				) : (
					<Spinner />
				)}
			</MDBCardGroup>
		</MDBRow >
	)
}

export default Sensors
