import React, { useState, useEffect, useContext } from 'react'
import SensorContext from '../../context/sensor/sensorContext';

import { DigitalFlop, Decoration10 } from '@jiaminghi/data-view-react'
import './DigitalFlop.less'

function randomExtend(minNum, maxNum) {
  if (arguments.length === 1) {
    return parseInt(Math.random() * minNum + 1, 10)
  } else {
    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
  }
}

export default () => {
  // ---------------------
  // ACCESS SENSOR CONTEXT
  // ---------------------
  const sensorContext = useContext(SensorContext);
  const { sensors, locationSensorsMap, filtered, getSensors, loading, } = sensorContext;
  // --------------
  // USE STATE HOOK
  // --------------
  const [digitalFlopData, setData] = useState([]);
  // --------------------
  function createData() {
    // ---------------------
    let digitalFlopData = [];
    // ----------------------
    if (locationSensorsMap) {
      let keys = Object.keys(locationSensorsMap);
      keys.forEach( key => {
        let locSensors = locationSensorsMap[key];
        let DataObject = {
              title : key,
              number : {
              number: [randomExtend(70, 99)],
                content: '{nt}',
                textAlign: 'center',
                style: {
                  fill: '#4d99fc',
                  fontSize: 25,
                  fontWeight: 'normal',
                },
              },
              unit: '%',
          }
        digitalFlopData.push(DataObject)
      });
    }
    setData(digitalFlopData)
  }
  // ---------------
  useEffect(() => {
    // ----------
    createData();
    // ----------
    const timer = setInterval(createData, 1000)
    return () => clearInterval(timer)
  }, [])
  // ----------
  return (
    <div id="digital-flop">
      <p>EFFICIENCY</p>
      {digitalFlopData.map(item => (
        <div className="digital-flop-item" key={item.title}>
          <div className="digital-flop-title">{item.title}</div>
          <div className="digital-flop">
            <DigitalFlop config={item.number} style={{width:'36px',height:'36px'}}/>
            <div className="unit">{item.unit}</div>
          </div>
        </div>
      ))}
      <Decoration10 />
    </div>
  )
}
