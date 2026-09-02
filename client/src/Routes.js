import React from 'react';
import { Route, Switch } from 'react-router-dom';

import AdminPage from './components/pages/AdminPage';
import BigDATAView from './components/pages/BIgDATAView'
import MaintScehduler from './components/pages/MaintScehduler';
import LEDPanel from './components/pages/LEDPanel';
import GISMapPage from './components/pages/GISMapPage'
import HomePage from './components/pages/HomePage';
import RegisterPage from './components/pages/RegisterPage';
import ReportPage from './components/pages/ReportPage';
import ChartsPage from './components/pages/ChartsPage';
import NipponGlassPage from './components/pages/NipponGlassPage'
import TestPage from './components/pages/TestPage';
import AboutPage from './components/pages/AboutPage';
import LoginPage from './components/pages/LoginPage';
import NotFoundPage from './components/pages/NotFoundPage';

class Routes extends React.Component {
  render() {
    return (
      <Switch>
        <Route exact path='/' component={HomePage} />
        <Route exact path='/BigDATAView' component={BigDATAView} />
        <Route exact path='/NipponGlass' component={NipponGlassPage}/>
        <Route exact path='/cmms' component={MaintScehduler} />
        <Route exact path='/led' component={LEDPanel} />
        <Route exact path='/gismap' component={GISMapPage} />
        <Route exact path='/admin' component={AdminPage} />
        <Route exact path='/register' component={RegisterPage} />
        <Route exact path='/charting' component={ChartsPage} />
        <Route exact path='/report' component={ReportPage} />
        <Route exact path='/test' component={TestPage} />
        <Route exact path='/about' component={AboutPage} />
        <Route exact path='/login' component={LoginPage} />
        <Route component={NotFoundPage} />
      </Switch>
    );
  }
}

export default Routes;
