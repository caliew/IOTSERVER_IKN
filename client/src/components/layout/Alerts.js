import React, { useContext } from 'react';
import AlertContext from '../../context/alert/alertContext';
import { MDBContainer,MDBCol,MDBRow,MDBCardBody,MDBCardTitle,MDBCardText,MDBCardFooter } from 'mdbreact';

const Alerts = () => {
  const alertContext = useContext(AlertContext);

  return (
    alertContext.alerts.length > 0 &&
    alertContext.alerts.map(alert => (
      <MDBContainer  >
    		<main className="d-flex flex-column p-3 warning-color fixed-top" style={{ marginTop: '3rem' }}>
          {/* <MDBRow > */}
            {/* <MDBCol className="warning-color"> */}
          <div key={alert.id} >
            <h5><i className='fas fa-info-circle' />&nbsp;&nbsp;{alert.msg}</h5>
          </div>
            {/* </MDBCol> */}
          {/* </MDBRow> */}
        </main>
      </MDBContainer>
    ))
  );
};

export default Alerts;
