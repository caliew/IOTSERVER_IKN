import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/layout/Navbar'
import Alert from './components/layout/Alerts'

import AuthState from './context/auth/authState';
import AlertState from './context/alert/alertState';
import SensorState from './context/sensor/sensorState';
import MaintEventState from './context/maintEvents/maintEventState';
import NotificationState from './context/notification/notificationState';

const App = () => {
  // --------------------------
  return (
    <AuthState>
      <SensorState>
      <AlertState>
        <NotificationState>
        <MaintEventState>
          <Router>
            <Alert />
            <Navbar />
          </Router>
        </MaintEventState>
        </NotificationState>
      </AlertState>
      </SensorState>
    </AuthState>    
  );
}

export default App;
