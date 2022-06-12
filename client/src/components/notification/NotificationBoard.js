import React, { useState,useEffect,useContext } from 'react';
import NotificationContext from '../../context/notification/notificationContext';
import SensorContext from '../../context/sensor/sensorContext';
import { MDBContainer,MDBListGroup,MDBListGroupItem,MDBBadge,MDBJumbotron } from 'mdbreact';

const Notification = () => {
	// ---------------------------
  const notificationContext = useContext(NotificationContext);	
  const { notifications } = notificationContext;
	const [userNotifications,setNotifications] = useState(null)
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
	const getAlertText = (name,sensorId,reading,limit) => {
		let strAlert = '';
		if (reading > limit) strAlert = ` ${name} [${sensorId}] ... ${reading}C > ${limit}C` 
		if (reading < limit) strAlert = ` ${name} [${sensorId}] ... ${reading}C < ${limit}C` 
		return strAlert;
	}
	const getALERTEVENTS = () => {
		// ----------
		let _alertDatas = userNotifications.map((note) => {
			let color = note.type;
			return (
				<h6 className="my-0">
					<MDBListGroupItem color={color}>{getTimeDateLabel(note.date)}<span>&nbsp;&nbsp;&nbsp;</span>
						<MDBBadge color={color}>{color.toUpperCase()}</MDBBadge> &nbsp;&nbsp;
						<i class="far fa-bell" />{note.Flag} &nbsp;&nbsp;
						{getAlertText(note.name,note.sensorId,note.reading,note.limit)}
					</MDBListGroupItem>
				</h6>
			)
		});
		if (userNotifications.length === 0) _alertDatas = <h5>.. SEARCHING ALERT MESSAGES ...</h5>
		return _alertDatas;
	}
	// --------
	return (
		<MDBContainer style={{width: "auto",position: "relative",marginTop: '2rem'}} >
			<MDBJumbotron className="p-4">

	      <h4>NOTIFICATION MANAGEMENT</h4>

				<MDBListGroup className="my-1 mx-1" >
					{
						userNotifications === null ?  <h5>.. DATA LOADING ..</h5> : getALERTEVENTS()
					}
				</MDBListGroup>
			</MDBJumbotron>
		</MDBContainer>
	)
}

export default Notification
