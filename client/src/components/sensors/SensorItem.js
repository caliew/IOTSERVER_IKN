import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import SensorContext from '../../context/sensor/sensorContext';
import AuthContext from '../../context/auth/authContext';
import { MDBContainer,MDBRow,MDBCol, MDBCardGroup, MDBIcon, MDBBtn,
         MDBCard, MDBCardBody, MDBListGroup , MDBCardTitle, MDBCardText } from 'mdbreact';

const SensorItem = ({ sensor,SelectSensor }) => {
  // ---------------
  const sensorContext = useContext(SensorContext);
  const { deleteSensor, setCurrent, clearCurrent } = sensorContext;

  const authContext = useContext(AuthContext);
  const { user, companies } = authContext;
  
  const { _id, name, dtuId, sensorId, type, location, company, variables } = sensor;

  const onDelete = () => {
    deleteSensor(_id);
    clearCurrent();
  };

  return (
    <MDBRow className="masonry-with-flex m-1">
      <MDBCard className="m-1" style={{width:'200px'}}>
        <MDBCardBody>
          <MDBCardText>
            {name}<hr/>TYPE={type}<br/>DTU={dtuId} <br/>
            { (dtuId > 0) ? `SENSOR ID=${sensorId}` : `${sensorId}` }<br/>
            LOCATION={location}
            <hr/>
            {user.name ==="superuser" && company && company.map(_comp => { return (<h6>{_comp}</h6>) } )}
          </MDBCardText>
        </MDBCardBody>
        
        <div className='d-inline-flex mdb-color lighten-3 pb-0 pt-1 text-center justify-content-center'>
          {/* <ul className='list-unstyled font-small '> */}
            {/* <li className='list-inline-item white-text'> */}
              <MDBBtn floating active color="primary" onClick={()=>SelectSensor(sensor)}><MDBIcon far icon="edit" size="1x"/></MDBBtn>
            {/* </li> */}
            {/* <li className='list-inline-item white-text'> */}
              <MDBBtn disabled color="danger" onClick={onDelete}><MDBIcon far icon="trash-alt" size="1x" /></MDBBtn>
            {/* </li> */}
            {/* <li className='list-inline-item white-text'><MDBIcon far icon='clock' size="2x"/></li> */}
          {/* </ul> */}
        </div>
      </MDBCard>
    </MDBRow>
  );
};

SensorItem.propTypes = {
  sensor: PropTypes.object.isRequired
};

export default SensorItem;
