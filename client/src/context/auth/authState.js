import React, { useReducer,useState } from 'react';
import axios from 'axios';
import AuthContext from './authContext';
import AuthReducer from './authReducer';
import setAuthToken from '../../utils/setAuthToken';
import {
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  USER_LOADED,
  AUTH_ERROR,
  LOGIN_SUCCESS,
  LOGIN_FAIL,
  LOGOUT,
  UPDATE_USER,
  UPDATE_COMPANY,
  ALL_USERS,
  USER_ERROR,
  COMPANY_ERROR,
  ALL_COMPANIES,
  CLEAR_ERRORS
} from '../types';

const AuthState = props => {
  // -------------------
  const initialState = {
    token: localStorage.getItem('token'),
    isAuthenticated: null,
    loading: true,
    user: {},
    users: null,
    companies: null,
    error: null
  };
  // --------------------
  const [state, dispatch] = useReducer(AuthReducer, initialState);
  const [mTimer,setTimer] = useState([]);
  // ---------
  // LOAD USER
  // ---------
  const loadUser = async () => {
    // ------------------------------
    setAuthToken(localStorage.token);
    // ------------------------------
    try {
      const res = await axios.get('/api/auth');
      // -------
      dispatch({
        type: USER_LOADED,
        payload: res.data
      });
    } catch (err) {
      dispatch({ type: AUTH_ERROR });
    }
    try{  
      getAllUsers();
    } catch (err) {

    }
  };
  // -----------------
  // UPDATE USER STATE
  // -----------------
  const updateUser = async (user) => {
    const config = {
      headers: { 'Content-Type': 'application/json' }
    };
    try {
      // --------------
      const res = await axios.put( `/api/users/${user._id}`, user, config);
      // -------------------
      dispatch({
        type: UPDATE_USER,
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: USER_ERROR,
        payload: err.response.msg
      });
    }
  };
  // --------------------
  // UPDATE COMPANY STATE
  // --------------------
  const updateCompany = async (company) => {
    const config = {
      headers: { 'Content-Type': 'application/json' }
    };
    try {
      const res = await axios.put( `/api/companies/${company._id}`, company, config);
      // -------------------
      dispatch({
        type: UPDATE_COMPANY,
        payload: res.data
      });
    } catch (err) {
      dispatch({
        type: COMPANY_ERROR,
        payload: err.response.msg
      });
    }
  }
  // -------------
  // GET ALL USERS
  // -------------
  const getAllUsers = async() => {
    // --------
    try {
      const res = await axios.get('/api/users');
      // -------
      dispatch({
        type: ALL_USERS,
        payload: res.data
      });
    } catch (err) {
      dispatch({ type: AUTH_ERROR });
    }
  }
  // -------------
  // GET ALL COMPANIES
  // -------------
  const getAllCompanies = async() => {
    // const params = { totalLines : 88 };
    axios.get('/api/users/companies').then (res => {
      // -------
      dispatch({
        type: ALL_COMPANIES,
        payload: res.data
      });
    }).catch ( err => {
    })
  }
  // -------------
  // REGISTER USER
  // -------------
  const register = async formData => {
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    // -------
    try {
      const res = await axios.post('/api/users', formData, config);
      dispatch({
        type: REGISTER_SUCCESS,
        payload: res.data
      });
      // --------
      loadUser();
      // --------
    } catch (err) {
      dispatch({
        type: REGISTER_FAIL,
        payload: err.response.data.msg
      });
    }
  };
  // ----------
  // Login User
  // ----------
  const login = async formData => {
    // ------
    const config = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    try {
      const res = await axios.post('/api/auth', formData, config);
      dispatch({
        type: LOGIN_SUCCESS,
        payload: res.data
      });
      // --------
      loadUser();
      // --------
    } catch (err) {
      // ---------
      dispatch({
        type: LOGIN_FAIL,
        payload: err.response.data.msg
      });
    }
  };
  // ------
  // Logout
  // ------
  const logout = () => {
    // ------
    mTimer.forEach( _mTimer => {
      clearTimeout(_mTimer)
    });
    // ---------
    setTimer([])
    dispatch({ type: LOGOUT });
    // ------------------------
  }
  // ------------
  // ADD TIMER FOR TRACKING - TO BE CLEAN UP WHEN LOGOUT
  // -------------
  const addTimer = (_mTimer) => {
    mTimer.push(_mTimer);
    setTimer(mTimer);
  }
  // ------------
  // Clear Errors
  // ------------
  const clearErrors = () => dispatch({ type: CLEAR_ERRORS });
  // --------------
  return (
    <AuthContext.Provider
      value={{
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        loading: state.loading,
        user: state.user,
        companies:state.companies,
        users: state.users,
        error: state.error,
        register,
        loadUser,
        getAllUsers,
        getAllCompanies,
        updateUser,
        updateCompany,
        login,
        logout,
        addTimer,
        clearErrors
      }}
    >
      {props.children}
    </AuthContext.Provider>
  );
};

export default AuthState;
