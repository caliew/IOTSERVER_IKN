import React, { useContext } from 'react'

import SensorContext from '../../context/sensor/sensorContext';
import TDK_HVAC_FPAGE from '../systems/svg/TDK_HVAC_FPAGE';

const BigDATAView = ({userCompanyName="TDK"}) => {
  // -----------
  const sensorContext = useContext(SensorContext);
  const { sensorsData, wisensors } = sensorContext;

  // ----------------------
  return (
    <div class="container-fluid mb-4 mt-n3">
      {/* <DataV /> */}
      {/* <MDBContainer> */}
        <TDK_HVAC_FPAGE color='black' sensorsData={sensorsData} wisensors={wisensors}/>
				{/* <MDBCard className="px-4 py-4 m-2" style={{width:`${MDBRowWidth()}px`}}>
						width="700" height="534" 
						{ getFloorPlan() }
				</MDBCard> */}
        {/* <TDK_HVAC_PlanView model='4' color='black' sensorsData={sensorsData} /> */}
      {/* </MDBContainer> */}

        {/* <TDK_HVAC_IsoView color='black' sensorsData={sensorsData}/> */}
        {/* <TDK_HVAC_PlanView sensorsData={sensorsData} model='4' color='black' />       */}
    </div>
  )
}

export default BigDATAView
