import React, { useContext,useEffect,useState } from 'react'
import { useHistory } from 'react-router-dom'
import NotificationBoard from '../notification/NotificationBoard';
import OverView from './OverView'
import { MDBContainer,MDBIcon,MDBCardGroup,MDBCard,MDBCardBody,MDBCardFooter } from 'mdbreact';
	
import AuthContext from '../../context/auth/authContext';
import SensorContext from '../../context/sensor/sensorContext';
import NotificationContext from '../../context/notification/notificationContext';

import AHUAirflowSysModule from '../systems/AHUAirflowSysModule';
import AHUAirTempSysModule from '../systems/AHUAirTempSysModule';
import ENVSysModule from '../systems/ENVSysModule';
import AIRCompSysModule from '../systems/AIRCompSysModule';
import PIPEWTRTempSysModule from '../systems/PIPEWTRTempSysModule';
import SYSTEMPERFModule from '../systems/SYSTEMPERFModule';
import ELECTCompSysModule from '../systems/ELECTCompSysModule';
import TDK_HVAC_PlanView from '../systems/svg/TDK_HVAC_PlanView';

const HomePage = () => {
	// --------------------------
  const history = useHistory();
	// --------------------------
  const authContext = useContext(AuthContext);
  const { isAuthenticated, user, addTimer, getAllCompanies } = authContext;
	// ------------------------
	const notificationContext = useContext(NotificationContext);
	const { getNotification } = notificationContext;
	// ---------------------------------------------
	const sensorContext = useContext(SensorContext);
  const { filterSensors, sensorsData, getSensors } = sensorContext;
	// ---------------------
	const [selection,setSelection] = useState(null);
  const [systemComponent, setSystemComponent] = useState(null);
	let mTimer;
	// --------------
	useEffect(()=> {
		// -----------
		user && user.companyname === "Nippon Glass" && history.push('/NipponGlass')
		!isAuthenticated && history.push('/login');
		// -----------
		if (isAuthenticated)  {
			// ----------
			getSensors(30,null,null);
			getNotification();
			getAllCompanies();
			// ---------
			// SET TIMER
			// ---------
			if (mTimer === null) {
				const _mTimer = setInterval(handleTimer, 1000*60*5);
				addTimer(_mTimer);
			}
		}
		//  -----------
		// eslint-disable-next-line
	},[]);
  // --------------------------------------------
	const handleTimer = () => {
		// ----------
		getSensors(30,null,null);
		getNotification();
	}
  const handleComponetSelection = (sysName) => {
		// --------------------------
    setSystemComponent(sysName);
    filterSensors(sysName);
		// --------------------
  }
	// -----
	return (
    <main className='clearfix"' style={{ marginTop: '2rem' }}>

			{ isAuthenticated && <NotificationBoard />} 

			{ isAuthenticated && user && (user.companyname !== "AWC" && user.companyname !== "IKN" && user.companyname !== "Nippon Glass") && <OverView /> }

			<MDBContainer className="my-3">
					<MDBCardGroup >

						<MDBCard onClick={()=>setSelection('ENV_RH')} className={selection==='ENV_RH' && 'grey lighten-2'}>
							<MDBIcon icon="temperature-high" size="3x" className="d-flex pt-4 justify-content-center" />
							{/* <MDBCardImage src="https://mdbootstrap.com/img/Photos/Others/images/49.jpg" alt="MDBCard image cap" top hover overlay="white-strong" />								 */}
							<MDBCardBody tag="h5">ENV. TEMP, RH & ABS</MDBCardBody>
							<MDBCardFooter small muted></MDBCardFooter>
						</MDBCard>

						{ user && (user.companyname !== "AWC" && user.companyname !== "IKN" && user.companyname !== "Nippon Glass") && (
							<>
								<MDBCard onClick={()=>setSelection('AHU_AFLW')} className={selection==='AHU_AFLW' && 'grey lighten-2'}>
									<MDBIcon fas icon="wind" size='4x' className="d-flex pt-4 justify-content-center"/>
									{/* <MDBCardImage src="https://mdbootstrap.com/img/Photos/Others/images/49.jpg" alt="MDBCard image cap" top hover overlay="white-strong" />								 */}
									<MDBCardBody tag="h5">HVAC DUCT AIRFLOW</MDBCardBody>
									<MDBCardFooter small muted></MDBCardFooter>
								</MDBCard>
								<MDBCard onClick={()=>setSelection('AHU_ATMP')} className={selection==='AHU_ATMP' && 'grey lighten-2'}>
									<MDBIcon icon='thermometer-half' size="4x" className="d-flex pt-4 justify-content-center" />
									{/* <MDBCardImage src="https://mdbootstrap.com/img/Photos/Others/images/49.jpg" alt="MDBCard image cap" top hover overlay="white-strong" />								 */}
									<MDBCardBody tag="h5">AHU DUCT TEMP.</MDBCardBody>
									<MDBCardFooter small muted></MDBCardFooter>
								</MDBCard>
								<MDBCard onClick={()=>setSelection('SYS_AIR_COMPR')} className={selection==='SYS_AIR_COMPR' && 'grey lighten-2'}>
									{/* <MDBIcon fas icon="wind" size='2x' className="d-flex pt-4 justify-content-center"/> */}
									<MDBIcon fas icon="tachometer-alt" size="4x" className="d-flex pt-4 justify-content-center" />
									{/* <MDBCardImage src="https://mdbootstrap.com/img/Photos/Others/images/49.jpg" alt="MDBCard image cap" top hover overlay="white-strong" />								 */}
									<MDBCardBody tag="h5">AIR CMPSR</MDBCardBody>
									<MDBCardFooter small muted></MDBCardFooter>
								</MDBCard>
								<MDBCard onClick={()=>setSelection('SYS_PIPE_TEMP')} className={selection==='SYS_PIPE_TEMP' && 'grey lighten-2'}>
									<MDBIcon icon="water" size="4x" className="d-flex pt-4 justify-content-center" />
										<MDBCardBody tag="h5">WATER PIPE TEMP</MDBCardBody>
										<MDBCardFooter small muted></MDBCardFooter>
								</MDBCard>
								<MDBCard onClick={()=>setSelection('SYS_ELECT')} className={selection==='SYS_ELECT' && 'grey lighten-2'}>
									<MDBIcon far icon="lightbulb" size="4x" className="d-flex pt-4 justify-content-center" />
										<MDBCardBody tag="h5">ELECT SYSTEM</MDBCardBody>
										<MDBCardFooter small muted></MDBCardFooter>
								</MDBCard>
								<MDBCard onClick={()=>setSelection('SYS_PERF')} className={selection==='SYS_PERF' && 'grey lighten-2'}>
									<MDBIcon far icon="snowflake" size="4x" className="d-flex pt-4 justify-content-center" />
										<MDBCardBody tag="h5">SYSTEM PERF</MDBCardBody>
										<MDBCardFooter small muted></MDBCardFooter>
								</MDBCard>
							</>
						)}

						{ 
							// user && (user.companyname != "AWC" && user.companyname != "IKN" && user.companyname != "Nippon Glass") && (
							// <MDBCard onClick={()=>setSelection('SYS_HVAC')} className={selection==='SYS_HVAC' && 'grey lighten-2'}>
							// 	<MDBIcon far icon="snowflake" size="4x" className="d-flex pt-4 justify-content-center" />
							// 	{/* <MDBCardImage src="https://mdbootstrap.com/img/Photos/Others/images/49.jpg" alt="MDBCard image cap" top hover overlay="white-strong" />								 */}
							// 	<MDBCardBody tag="h5">HVAC SYSTEM</MDBCardBody>
							// 	<MDBCardFooter small muted></MDBCardFooter>
							// </MDBCard>)
							}
						
					</MDBCardGroup>
			</MDBContainer>

			{
				selection && user && user.companyname && (
				<MDBContainer fluid>
					{ selection === 'AHU_AFLW' && <AHUAirflowSysModule /> }
					{ selection === 'AHU_ATMP' && <AHUAirTempSysModule /> }
					{ selection === 'ENV_RH' && <ENVSysModule type='1' userCompanyName={user.companyname}/> }
					{ selection === 'SYS_AIR_COMPR' && <AIRCompSysModule /> }
					{ selection === 'SYS_PIPE_TEMP' && <PIPEWTRTempSysModule /> }
					{ selection === 'SYS_ELECT' && <ELECTCompSysModule /> }
					{ selection === 'SYS_PERF' && <SYSTEMPERFModule sensorsData={sensorsData} /> }
					{ selection === 'SYS_HVAC1' && 
							// eslint-disable-next-line react/jsx-pascal-case
							<TDK_HVAC_PlanView model='4' color='black' 
								sensorsData={sensorsData} 
								handleComponetSelection={handleComponetSelection} 
								systemComponent={systemComponent} /> }
				</MDBContainer>)
			}
    </main>
	)
}

export default HomePage