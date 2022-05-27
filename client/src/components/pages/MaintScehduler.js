import React, { Component,useState,useEffect,useContext } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import "bootstrap-css-only/css/bootstrap.min.css";
import "mdbreact/dist/css/mdb.css";
import DateTimePicker from 'react-datetime-picker';
import Calendar from 'react-awesome-calendar';
import Lottie from 'react-lottie';
import {v4 as uuidv4} from 'uuid';
import animationData from "../../lottie/43885-laptop-working.json";

import MaintEventContext from '../../context/maintEvents/maintEventContext';
import AuthContext from '../../context/auth/authContext';

import "react-datepicker/dist/react-datepicker.css";
import { MDBBtn, MDBCard, MDBIcon, MDBBadge, MDBContainer, MDBRow, MDBCol} from "mdbreact";
// import "./index.css";

// ---------------
const defaultOptions = {
	loop: true,
	autoplay: true,
	animationData: animationData,
	rendererSettings: {
		// preserveAspectRatio: "xMidYMid slice"
	}
};

const MaintScehduler = () => {
  // -------------------------------------
  const [events,setEvents] = useState([]);
  const [editEvent,setEditEvent] = useState();
  // --------------------------------------
	const maintEventContext = useContext(MaintEventContext);
  const authContext       = useContext(AuthContext);
	const { maintEvents,getMaintEvents,addMaintEvent,updateMaintEvent,removeMaintEvent } = maintEventContext;
  const { user } = authContext;
  // --------------------------------------
  const [inputEvent, setInputEvent] = useState({datetimeFrom:new Date(),datetimeTo:new Date(),
                                           title:null,location:null,description:null});
  const [showHideEvent, setAddEvent] = useState(false);
  const [AddMode, setAddMode] = useState(true);
  // ---------------------
  useEffect(()=>{ getMaintEvents(user); },[])
  // -----------
  useEffect(()=> {
    setEvents(maintEvents);
    console.log(maintEvents);
    // getMaintEvents(user);
  },[maintEvents])
  // -------------------
  const onFetchMaintSchedule = () => {
    getMaintEvents(user);
  }
  const onHandleAddEvent = () => {
    setAddMode(true);
    setAddEvent(!showHideEvent);
    setInputEvent({datetimeFrom:new Date(),datetimeTo:new Date(),title:null,location:null,description:null})
  }
  const onChange = (e) => {
    const name = e.target.name;
    const value = e.target.value;
    setInputEvent({ ...inputEvent, [name]: value });
  }
  const addEvent = (e) => {
    console.log(`..ADD EVENT/EDIT EVENT...${AddMode}`)
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const { datetimeFrom,datetimeTo,title,location,description} = inputEvent;
    const _dateFrom = datetimeFrom.toLocaleDateString('fr-CA', options);
    const _timeFrom = datetimeFrom.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }); 
    const _dateTo   = datetimeTo.toLocaleDateString('fr-CA', options);
    const _timeTo   = datetimeTo.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' }); 
    // -----------
    if (inputEvent.datetimeFrom && inputEvent.datetimeTo && inputEvent.title && 
        inputEvent.location && inputEvent.description) {
      // ----------
      let newEvent = {
        id: uuidv4(),
        date:`${_dateFrom}`,
        time:`${_timeFrom}`,
        from: `${_dateFrom}T${_timeFrom}+00:00`,
        to: `${_dateTo}T${_timeTo}+00:00`,
        color: '#3694DF',
        title: title,
        companyname: user.companyname,
        email: user.email,
        location: location,        
        description: description
      }
      // ---------
      setAddEvent(false);
      // -------
      if (AddMode) {
        console.log('ADD EVENT')
        addMaintEvent(newEvent);
      } else {
        console.log('EDIT EVENT',editEvent.id)
        newEvent = { ...newEvent, id:editEvent.id }
        updateMaintEvent(newEvent);
      }
      getMaintEvents(user);
    }
  }
  const onDelete = (eventId) => {
    // ----------------------
    console.log(eventId);
    removeMaintEvent(eventId);
    getMaintEvents(user);
  }
  const onEdit = (eventId) => {
    console.log(`..onEdit..${eventId}`)
    let _foundEvent = events.find(_event => _event.id === eventId);
    // --------------
    if (_foundEvent) {
      setAddMode(false);
      setAddEvent(true);
      let date0 = new Date(_foundEvent.from);
      let date1 = new Date(_foundEvent.to);
      setEditEvent(_foundEvent);
      // ------------
      setInputEvent({
        ...inputEvent,
        datetimeFrom: new Date(date0.getTime() + date0.getTimezoneOffset()*60*1000),
        datetimeTo:   new Date(date1.getTime() + date1.getTimezoneOffset()*60*1000),
        title:_foundEvent.title,
        location:_foundEvent.location,
        description:_foundEvent.description});
    }
  }
  const onClickEvent = (eventId) => {
    console.info(`..onClickEvent ${eventId}...`)
    let _foundEvent = events.find(_evnt => _evnt.id === eventId);
  }
  function compareByDate(a, b) {
    var dateA = new Date(a.from); // ignore upper and lowercase
    var dateB = new Date(b.from); // ignore upper and lowercase
    if (dateA < dateB) {
      return -1;
    }
    if (dateA > dateB) {
      return 1;
    }
    // names must be equal
    return 0;
  }
    // ------
  return (
    <main style={{ marginTop: '6rem' }}>
      <MDBContainer>
        <MDBRow>
          <MDBCol md="9" className="mb-r">
            <div>
              <Calendar onClickEvent={onClickEvent} events={events} />
            </div>
            <h2 className="text-uppercase my-3">Today:</h2>
            <div id="schedule-items">
              {events && events.sort(compareByDate).map(event => (
                <Event
                  onDelete={onDelete}
                  onEdit={onEdit}
                  key={event.id}
                  id={event.id}
                  date={event.date}
                  time={event.time}
                  title={event.title}
                  location={event.location}
                  description={event.description}
                />
              ))}
            </div>
          </MDBCol>
          <MDBCol md="3">
            <hr/>
            <div>
              <MDBBtn stcolor="white" size="lg" className='center w-100' onClick={()=>onFetchMaintSchedule()}>FETCH DATA FROM DATABASE</MDBBtn>
              <MDBBtn stcolor="white" size="lg" className='center w-100' onClick={()=>onHandleAddEvent()}>SHOW/HIDE ADD EVENT</MDBBtn>
              {
                showHideEvent && (
                  <div className='center p-2'>
                    <h6>EVENT DATE FROM
                    <DateTimePicker calendarAriaLabel="Toggle calendar"
                      clearAriaLabel="Clear value" dayAriaLabel="Day" hourAriaLabel="Hour"
                      minuteAriaLabel="Minute"
                      nativeInputAriaLabel="Date and time"  
                      yearAriaLabel="Year"
                      value={inputEvent.datetimeFrom}
                      onChange={(e)=>setInputEvent({...inputEvent,datetimeFrom:e,datetimeTo:inputEvent.datetimeTo})}/>
                      EVENT DATE END
                    <DateTimePicker calendarAriaLabel="Toggle calendar"
                      clearAriaLabel="Clear value" dayAriaLabel="Day" hourAriaLabel="Hour"
                      minuteAriaLabel="Minute"
                      nativeInputAriaLabel="Date and time"  
                      yearAriaLabel="Year"
                      value={inputEvent.datetimeTo}
                      onChange={(e)=>setInputEvent({...inputEvent,datetimeFrom:inputEvent.datetimeFrom,datetimeTo:e})}/></h6>
                    <MDBCard className="p-2 my-4 w-80" style={{ width: "14rem" }}>
                      {/* <h6>START DATE TIME : {inputEvent.datetimeFrom}</h6> */}
                      {/* <h6>END   DATE TIME : {inputEvent.datetimeTo}</h6> */}
                      <h6>TITLE
                        <input type='text' placeholder='TITLE' className="form-control" value={inputEvent.title}
                              name='title' onChange={onChange}/></h6>
                      <div>
                        <h6>LOCATION/COMPONENTS
                          <input  type='text' placeholder='Location' value={inputEvent.location}
                                  className="form-control" name='location'  onChange={onChange}/></h6>
                      </div>
                      <h6>DESCRIPTION
                          <input type='text' placeholder='DESCRIPTION' value={inputEvent.description}
                                className="form-control" name='description' onChange={onChange} /></h6>
                      <MDBBtn color='primary' size="lg"className='center' 
                              onClick={addEvent} >{AddMode ? 'ADD NEW EVENT' : 'EDIT EVENT'}</MDBBtn>
                    </MDBCard >
                  </div>)
              }
            </div>
            <hr />
            <h4 className="text-uppercase text-center my-3">Schedule</h4>
            <h6 className="my-3">
              It's going to be busy that today. You have{" "}
              <b>{events.length} events </b> today.
            </h6>
            <hr />
            <h4 className="my-3">
              <MDBRow>
                <MDBCol size="3" className="text-center">
                  <MDBIcon icon="sun" fixed />
                </MDBCol>
                <MDBCol size="6">Sunny</MDBCol>
              </MDBRow>
              <MDBRow>
                <MDBCol size="3" className="text-center">
                <MDBIcon icon="thermometer-three-quarters" fixed />                  
                </MDBCol>
                <MDBCol size="6">23°C</MDBCol>
              </MDBRow>

            </h4>
            <hr />
            <h4 className="text-uppercase text-center my-3">HIGHLIGHT</h4>
            
              <Lottie options={defaultOptions} height={200} width={200} />

          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </main>
  )
}

class Event extends Component {
  render() {
    return (
      <React.Fragment>
        <div className="media mt-1">
          <div>
            <h3 className="h3-responsive font-weight-bold mr-3">{this.props.date}</h3>
            <h3 className="h3-responsive font-weight-bold mr-3">{this.props.time}</h3>
          </div>
          <div className="media-body mb-3 mb-lg-3">
            <MDBBadge
              color="danger"
              className="ml-2 float-right"
              onClick={() => this.props.onDelete(this.props.id)}
            >DELETE</MDBBadge>
            <MDBBadge
              color="primary"
              className="ml-2 float-right"
              onClick={() => this.props.onEdit(this.props.id)}
            >EDIT</MDBBadge>
            <h6 className="mt-0 font-weight-bold">{this.props.title} </h6>{" "}
            <hr className="hr-bold my-2" />

            {this.props.location && (
              <React.Fragment>
                <p className="font-smaller mb-0">
                  <MDBIcon icon="location-arrow" /> {this.props.location}
                </p>
              </React.Fragment>
            )}
            <hr className="hr-bold my-2" />
            
            {this.props.description && (
              <p className="p-2 mb-4  blue-grey lighten-5 blue-grey lighten-5">
                {this.props.description}
              </p>
            )}

          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default MaintScehduler;