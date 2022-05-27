import React from 'react'

import { WaterLevelPond } from '@jiaminghi/data-view-react'

import './WaterLevelChart.less'

export default ({title,efficiency}) => {
  const config = {
    data: [efficiency],
    shape: 'round',
    waveHeight: 11,
    waveNum: 2,
  }

  return (
    <div id="water-level-chart">
      <div className="water-level-chart-title">{title}</div>

      <div className="water-level-chart-details">
        PERFORMANCE INDEX<span>{efficiency}</span>%
      </div>

      <div className="chart-container">
        <WaterLevelPond config={config} />
      </div>
    </div>
  )
}
