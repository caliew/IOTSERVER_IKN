import React, { useState, useContext, useEffect } from 'react';
// import Canvas from '../../components/react-three-fiber/Canvas';
import SensorContext from '../../context/sensor/sensorContext';

import { FullScreenContainer,ActiveRingChart, Decoration2 } from '@jiaminghi/data-view-react'

import Navbar from '../layout/Navbar'

import TopHeader from './TopHeader'
import DigitalFlop from './DigitalFlop'
import RankingBoard from './RankingBoard'
import RoseChart from './RoseChart'
import WaterLevelChart from './WaterLevelChart'
import ScrollBoard from './ScrollBoard'
import Cards from './Cards'
// ----------------------
import TDK_HVAC_IsoView from '../systems/svg/TDK_HVAC_IsoView';
import TDK_HVAC_PlanView from '../systems/svg/TDK_HVAC_PlanView';
// ----------------
import TDK_AHU from '../systems/svg/AHU';
import TDK_AHU_PUMP from '../systems/svg/AHU_PUMP';
import TDK_CHILLER from '../systems/svg/CHILLER';
import TDK_CHILLER_PUMP from '../systems/svg/CHILLER_PUMP';
import TDK_COOLINGTOWER from '../systems/svg/COOLINGTOWER';
import TDK_COOLINGTOWER_PUMP from '../systems/svg/COOLINGTOWER_PUMP';
import TDK_WCPU from '../systems/svg/WCPU';
// ---------------------
import { ReactComponent as SVGPLOT} from '../systems/svg/files/TDK_ISOVIEW_COLOR_1.svg';
import './index.less'

export default () => {
  // -----------
  const sensorContext = useContext(SensorContext);  
  const [showNavbar,setShow] = useState(false);
  const { filterSensors, sensorsData, getSensorsData, clearFilter, filtered } = sensorContext;
  const [systemComponent, setSystemComponent] = useState(null);
  // ----------------
  function createData() {
    // ----------------------------------
    // CALL SENSOR REDUCER TO UPDATE DATA
    // ----------------------------------
    getSensorsData(100);
  }
  // --------------
  useEffect(() => {
      // -------------
      // createData();
      // -------------
      // getSensorsData(100);
      const timer = setInterval(createData, 5000);    // 5000
      return () => clearInterval(timer)
  }, [])
  // ------------------
  const handleComponetSelection = (sysName) => {
    setSystemComponent(sysName);
    // filterSensors(sysName);
  } 
  // ---------
  const showhideNavBar = () => {
    setShow(!showNavbar);    
  }
  const style = { width: '5px' }
  return (
    <div class="container">
        <TopHeader title='TDK ELECTRONICS SDN BHD (MALAYSIA)' showhideNavBar={showhideNavBar}/>
        {
          showNavbar && <Navbar title='IOT PLATFORM' icon='fa fa-rss fa-1x' className='navbartop'/>
        }
        <div style={{border:'solid 1px blue'}}>
          <TDK_HVAC_IsoView color='black' sensorsData={sensorsData} handleComponetSelection={handleComponetSelection} systemComponent={systemComponent} />
        </div>
    </div>
  )
}