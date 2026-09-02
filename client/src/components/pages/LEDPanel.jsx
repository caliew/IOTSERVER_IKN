import React from 'react';
import ReactLEDDisplay from './ReactLEDDisplay';
import { MDBContainer } from 'mdbreact';
// import './index.css'

const LEDPanel = () => {

    return (
      <MDBContainer className='clearfix"' style={{ marginTop: '2rem' }}>
        <div className='d-flex justify-content-evenly align-items-center text-center'>
          <h3>FRONTEND</h3>
          <div className='d-inline-flex justify-content-center'>
            <div className='m-3'><h5>TEMPERATURE</h5><ReactLEDDisplay displayValue='23.3'/></div>
            <div className='m-3'><h5>REL.HUMIDITY</h5><ReactLEDDisplay displayValue='32.7'/></div>
            <div className='m-3'><h5>ABS.HUMIDITY</h5><ReactLEDDisplay displayValue='6.7'/></div>
          </div>
        </div>
        <div className='d-flex justify-content-evenly align-items-center text-center'>
          <h3>CLEAN ROOM</h3>
          <div className='d-inline-flex justify-content-center'>
            <div className='m-3'><h5>TEMPERATURE</h5><ReactLEDDisplay displayValue='23.8'/></div>
            <div className='m-3'><h5>REL.HUMIDITY</h5><ReactLEDDisplay displayValue='20.4'/></div>
            <div className='m-3'><h5>ABS.HUMIDITY</h5><ReactLEDDisplay displayValue='4.4'/></div>
          </div>
        </div>
        <div className='d-flex justify-content-evenly align-items-center text-center'>
          <h3>PASTE ROOM</h3>
          <div className='d-inline-flex justify-content-center'>
            <div className='m-3'><h5>TEMPERATURE</h5><ReactLEDDisplay displayValue='0.1'/></div>
            <div className='m-3'><h5>REL.HUMIDITY</h5><ReactLEDDisplay displayValue='0.0'/></div>
            <div className='m-3'><h5>ABS.HUMIDITY</h5><ReactLEDDisplay displayValue='-0.1'/></div>
          </div>
        </div>
      </MDBContainer>
    )
}
export default LEDPanel