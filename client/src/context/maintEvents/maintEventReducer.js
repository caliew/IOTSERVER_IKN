import { SET_MAINTEVENTS, ADD_MAINTEVENT, UPDATE_MAINTEVENT, DELETE_MAINTEVENT } from '../types';

export default (state, action) => {
  // -------------------
  let _maintEvents = state.maintEvents;
  switch (action.type) {
    case SET_MAINTEVENTS:
      return {
        ...state,
        maintEvents: action.payload
      }
    case ADD_MAINTEVENT:
      _maintEvents.push(action.payload);
      return {
        ...state,
        maintEvents:_maintEvents
      }
    case UPDATE_MAINTEVENT:
      let _filtered = _maintEvents.filter(_evnt => _evnt.id !== action.payload.id);
      _filtered.push(action.payload)
      return {
        ...state,
        maintEvents:_filtered
      }
    case DELETE_MAINTEVENT:
      let _updatedEvents = state.maintEvents.filter(event => event.id !== action.payload);
      return {
        ...state,
        maintEvents: _updatedEvents
      }
    default:
      return state;
  }
};
