import React, {useReducer} from 'react';
import axios from 'axios';
import MaintEventContext from './maintEventContext';
import MaintEventReducer from './maintEventReducer';
import {ADD_MAINTEVENT,UPDATE_MAINTEVENT,DELETE_MAINTEVENT, MAINTEVENT_ERROR, SET_MAINTEVENTS} from '../types';

const initialState = {
  maintEvents: []
};
// --------
const MaintEventState = props => {
  // -------------------
  const [state, dispatch] = useReducer(MaintEventReducer, initialState);
  // -----------------
  // GET NOTIFICATIONS
  // -----------------
  const getMaintEvents = (user) => {
    try {
      // -------------------------
      const params = { totalLines : 88, companyname: user.companyname, email: user.email };
      axios.get('/api/maintEvents', { params } ).then (res => {
        // -------
        dispatch({ type:SET_MAINTEVENTS, payload: res.data });
      }).catch ( err => {
        console.log(`..MAINTEVENTSTATE.JS .. MAINTEVENT_ERROR`);
        dispatch({ type:MAINTEVENT_ERROR, payload: null });
      })
      // --------------
    } catch (err) {
    }    
  };
  // --------------------
  // ADD MAINTENANC EVENT
  // --------------------
  const addMaintEvent = async maintEvent => {
    console.log(`.. API/MAINTEVENTS [POST]..`)
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    try {
      const res = await axios.post('/api/maintEvents', maintEvent, config);
      console.log(res.data);
      dispatch({ type:ADD_MAINTEVENT, payload: res.data });
    } catch (err) {
    }
  };
  const updateMaintEvent = async maintEvent => {
    const config = {
      headers: { 'Content-Type': 'application/json' }
    };
    try {
      const res = await axios.put( `/api/maintEvents/${maintEvent._id}`, maintEvent, config);
      console.log(res.data);
      dispatch({ type:UPDATE_MAINTEVENT,payload: res.data });
    } catch (err) {
    }
    // ---------------
  }
  const removeMaintEvent = async id => {
    try {
      console.log(`.. API/MAINTEVENTS [DELETE]..`)
      await axios.delete(`/api/maintEvents/${id}`);
      // --------------------------------------
      dispatch({ type:DELETE_MAINTEVENT, payload: id });
    } catch (err) {
    }
    // ---------------
  };
  // -----
  return (
    <MaintEventContext.Provider
      value={{
        maintEvents: state.maintEvents,
        getMaintEvents,
        addMaintEvent,
        updateMaintEvent,
        removeMaintEvent
      }}>
      {props.children}
    </MaintEventContext.Provider>
  );
};

export default MaintEventState;
