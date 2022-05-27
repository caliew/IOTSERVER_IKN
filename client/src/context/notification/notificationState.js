import React, {useReducer} from 'react';
import axios from 'axios';
import NotificationContext from './notificationContext';
import notificationReducer from './notificationReducer';
import {SET_NOTIFICATION, NOTIFICATION_ERROR} from '../types';

const initialState = {
  notifications: null
};

const NotificationState = props => {
  // -------------------
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  // -----------------
  // GET NOTIFICATIONS
  // -----------------
  const getNotification = () => {
    try {
      const params = { totalLines : 88 };
      axios.get('/api/alerts', { params } ).then (res => {
        // -------
        dispatch({
          type: SET_NOTIFICATION,
          payload: res.data
        });
      }).catch ( err => {
        dispatch({
          type: NOTIFICATION_ERROR,
          payload: null
        });
      })
      // --------------
    } catch (err) {
    }
    
  };
  // ------
  return (
    <NotificationContext.Provider
      value={{
        notifications: state.notifications,
        getNotification,
      }}>
      {props.children}
    </NotificationContext.Provider>
  );
};

export default NotificationState;
