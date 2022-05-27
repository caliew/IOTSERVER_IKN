import React from 'react'

import { Decoration5, Decoration8 } from '@jiaminghi/data-view-react'

import './TopHeader.less'

export default ({title,showhideNavBar}) => {
  // -------
  return (
    <div id="top-header" style={{ marginTop: '0rem' }}>
      <Decoration8 className="header-left-decoration" />
      <Decoration5 className="header-center-decoration" />
      <Decoration8 className="header-right-decoration" reverse={true} />
      <div className="center-title" onClick={showhideNavBar}>{title}</div>
    </div>
  )
}
