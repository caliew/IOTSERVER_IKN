import React, { useContext } from 'react';
import NotificationMngt from '../notification/NotificationMngt';
import SensorDirectory from '../sensors/SensorDirectory';
import AuthContext from '../../context/auth/authContext';

const Admin = () => {
	
  const authContext = useContext(AuthContext);
  const { isAuthenticated, logout, user, loadUser } = authContext;

	return (
    <main style={{ marginTop: '2rem' }}>
			{ user && user.name ==="superuser"  && <NotificationMngt /> }
			<SensorDirectory/>
	</main>
	)
}

export default Admin
