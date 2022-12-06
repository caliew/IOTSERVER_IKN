import React, { useEffect, useState } from 'react';
import ReactLEDDisplay from './ReactLEDDisplay';
import { format } from 'date-fns';
// import './index.css'

const LEDPanel = () => {

    return (
      <div className='clearfix"' style={{ marginTop: '2rem' }}>
        <div style={{margin:'10px auto'}}>
          <div className='flex justify-content-evenly align-items-center text-center'>
            <h1>... LED PANEL DISPLAY DEMO....</h1>
              <ReactLEDDisplay displayValue='32.50'/> 
          </div>
        </div>
      </div>
    )
}
export default LEDPanel