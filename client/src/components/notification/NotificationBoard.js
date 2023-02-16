import React, { useState,useEffect,useContext } from 'react';
import NotificationContext from '../../context/notification/notificationContext';
import SensorContext from '../../context/sensor/sensorContext';
import { MDBContainer,MDBListGroup,MDBListGroupItem,MDBBadge,MDBJumbotron,MDBCardTitle,MDBRow } from 'mdbreact';

const Notification = () => {
	// ---------------------------
  const notificationContext = useContext(NotificationContext);	
  const { notifications } = notificationContext;
	const [userNotifications,setNotifications] = useState(null);
	const [toggleListing,setToggleListing] = useState(true); 
	const [toggleTODAYListing,setToggleTODAYListing] = useState(true); 
	// const [userNotificationsMap,setNotificationsMap] = useState(null)
	// const [userSensors,setUserSensors] = useState([]);
	// ---------------------------------------------
	const sensorContext = useContext(SensorContext);
  const { sensors } = sensorContext;
	// --------------
	useEffect(() => {
		// ----------
		let sensorsArr = [];
		if (sensors) {
			sensors.map(sensor => {
				let key = `${sensor.dtuId}:${sensor.sensorId}`;
				sensorsArr.push(key)
			})
			// setUserSensors(sensorsArr);
		}
		// -----------------
		let userNotificationArr = [];
		// -----------------
		if (notifications) {
			// ---------------
			notifications.sort().forEach( notice => {
				let key = `${notice.dtuId}:${notice.sensorId}`;
				if(sensorsArr.includes(key)) {
					let _date = new Date(notice.date);
					if (_date.getMonth() == new Date().getMonth()) userNotificationArr.push(notice);
				}
			})
			// -------------
			let noticeMap = userNotificationArr.reduce((map,notice)=>{
				let key = `${notice.dtuId}:${notice.sensorId}`;
				if (map[key] == null) {
					map[key] = [];
					map[key].push(notice);
				} else {
					map[key].push(notice);
				}
				return map
			},{});
			// -------------------
			userNotificationArr = [];
			Object.entries(noticeMap).forEach(([key, value]) => {
				let alert = value[value.length-1];
				alert['Flag'] = value.length;
				userNotificationArr.push(alert);
			});
			// --------------------
			setNotifications(userNotificationArr.sort(compareByDate));
			// setNotificationsMap(noticeMap);
		}
	},[notifications,sensors]);
	// -------------------------
	function compareByDate(a, b) {
		var dateA = new Date(a.date);
		var dateB = new Date(b.date);
		if (dateA > dateB) return 1;
		if (dateA < dateB) return -1;
	}	
	// ---------------------------
	const getTimeDateLabel = (date) => {
		let _date = new Date(date);
		let mm = _date.getMonth()+1;
		let dd = _date.getDate();
		let hours = ("0" + _date.getHours()).slice(-2);
		let minutes = ("0" + _date.getMinutes()).slice(-2);
		return `${dd}/${mm} ${hours}:${minutes}`
	}
	// -----
	// userNotifications && Object.entries(userNotifications).forEach(([key, value]) => {
	// let arrNotice = value[0]
	// console.log(arrNotice)
	// });
	const getAlertText = (name,sensorId,type,sensorType,reading,limit) => {
		let strAlert = '';
		const getSymbol = () => sensorType == 'RH' ? '%' : 'C';
		if (reading > limit) strAlert = ` ${name} [${sensorId}] ...${sensorType} ${reading}>${limit}` 
		if (reading < limit) strAlert = ` ${name} [${sensorId}] ...${sensorType} ${reading}<${limit}` 
		return strAlert;
	}
	const isToday = (someDate) => {
		const today = new Date()
		return someDate.getDate() == today.getDate() &&
			someDate.getMonth() == today.getMonth() &&
			someDate.getFullYear() == today.getFullYear()
	}	
	const getALERTEVENTS = () => {
		// ----------
		if (userNotifications.length === 0) return <h5>.. SEARCHING ALERT MESSAGES ...</h5>
		let _alertDatas = userNotifications.map((note) => {
			// ------
			let color = note.type;
			let dateTime = new Date(note.date);
			let flag = toggleTODAYListing ? isToday(dateTime) : true;
			if (flag) {
				return (
					<h6 className="my-0">
						<MDBListGroupItem color={color}>{getTimeDateLabel(note.date)}<span>&nbsp;&nbsp;&nbsp;</span>
							<MDBBadge color={color}>{color.toUpperCase()}</MDBBadge> &nbsp;&nbsp;
							<i class="far fa-bell" />{note.Flag} &nbsp;&nbsp;
							{getAlertText(note.name,note.sensorId,note.type,note.sensorType,note.reading,note.limit)}
						</MDBListGroupItem>
					</h6>
				);
			} 
		});
		return _alertDatas;
	}
	function ToggleListing(title) {
		return (
			<div className='custom-control custom-switch'>
				<input
					type='checkbox'
					className='custom-control-input'
					id='customSwitchesNotificationListing'
					checked={toggleListing}
					onChange={()=>setToggleListing(!toggleListing)}
				/>
				<label className='custom-control-label' htmlFor='customSwitchesNotificationListing'>
					<h5>{title} (LISTING CURRENT MONTH)</h5>
				</label>
			</div>  
		)
	}
	function ToggleTODAYListing(title) {
		return (
			<div className='custom-control custom-switch'>
				<input
					type='checkbox'
					className='custom-control-input'
					id='customSwitchesTODAYNotificationListing'
					checked={toggleTODAYListing}
					onChange={()=>setToggleTODAYListing(!toggleTODAYListing)}
				/>
				<label className='custom-control-label' htmlFor='customSwitchesTODAYNotificationListing'>
					<h5>{title}</h5>
				</label>
			</div>  
		)
	}
	// --------
	return (
		<MDBContainer style={{width: "auto",position: "relative",marginTop: '2rem'}} >
			<MDBJumbotron className="p-4">
				<div className='d-flex'>
					<div>{ ToggleListing('NOTIFICATION BOARD')}</div>&nbsp;&nbsp;&nbsp;&nbsp;
					<div>{ toggleListing && ToggleTODAYListing('TODAY ONLY ')}</div>
				</div>
				<MDBListGroup className="my-1 mx-1" >
					{
						userNotifications === null ?  <h5>.. DATA LOADING ..</h5> : (toggleListing && getALERTEVENTS())
					}
				</MDBListGroup>
			</MDBJumbotron>
		</MDBContainer>
	)
}

export default Notification
