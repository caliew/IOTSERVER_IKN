import { SET_NOTIFICATION, REMOVE_NOTIFICATION } from '../types';

const notificationReducer = (state, action) => {
  switch (action.type) {
    case SET_NOTIFICATION:
      return {
        ...state,
        notifications: action.payload
      };
    case REMOVE_NOTIFICATION:
      return state.filter(alert => alert.id !== action.payload);
    default:
      return state;
  }
};

export default notificationReducer;
