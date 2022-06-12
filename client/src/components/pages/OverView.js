import React, { useState } from 'react';
import { MDBContainer,MDBRow,MDBCardGroup,MDBCardBody,MDBCard,MDBCardText,MDBJumbotron,MDBCardTitle } from 'mdbreact';

const OverView = () => {
  // ------  
  const [toggle,setToggle] = useState(false);
  // ------
  function ToggleButton(title) {
    return (
      <div className='custom-control custom-switch'>
        <input
          type='checkbox'
          className='custom-control-input'
          id='overviewSwitches'
          checked={toggle}
          onChange={()=>setToggle(!toggle)}
        />
        <label className='custom-control-label' htmlFor='overviewSwitches'>
          <h5>{title}</h5>
        </label>
      </div>  
    )
  }
  // ------
  return (
		<MDBContainer style={{width: "auto",position: "relative",marginTop: '2rem'}} >
      <MDBCard className="p-4">
        <MDBCardTitle>{ ToggleButton('STATUS OVERVIEW') }</MDBCardTitle>
      </MDBCard>
		</MDBContainer>
  )
}

export default OverView