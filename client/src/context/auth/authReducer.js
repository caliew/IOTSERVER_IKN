import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  UPDATE_USER,
  UPDATE_COMPANY,
  ALL_USERS,
  ALL_COMPANIES,
  LOGOUT,
  CLEAR_ERRORS
} from '../types';

const authReducer = (state, action) => {
  // ----------------------
  switch (action.type) {
    case USER_LOADED:
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload
      };
    case REGISTER_SUCCESS:
    case LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false
      };
    case ALL_USERS:
      return {
        ...state,
        isAuthenticated: true,
        users:action.payload
      };
    case UPDATE_USER:
      return {
        ...state,
        sensors: state.users.map(user =>
          user._id === action.payload._id ? action.payload : user
        ),
      };
    case UPDATE_COMPANY:
      return {
        ...state,
        companies: state.companies.map(company =>
          company._id === action.payload._id ? action.payload : company
        ),
      };
    case ALL_COMPANIES:
      return {
        ...state,
        isAuthenticated:true,
        companies:action.payload
      };
    case REGISTER_FAIL:
    case AUTH_ERROR:
    case LOGIN_FAIL:
    case LOGOUT:
      localStorage.removeItem('token');
      console.log('..** AUTH REDUCER **.. LOGOUT ..')
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload
      };
    case CLEAR_ERRORS:
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export default authReducer;