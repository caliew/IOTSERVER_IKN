import { useState, useRef, useEffect, useContext } from 'react'
import { MDBContainer, MDBRow, MDBCol, MDBCard, MDBCardBody, MDBInput, MDBCardImage } from 'mdbreact';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

const Login = (props) => {

  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const authContext = useContext(AuthContext);
  const { login, error, clearErrors, isAuthenticated } = authContext;
  const [inputValue, setInputValue] = useState("");
  const previousInputValue = useRef("");

  useEffect(() => {
    if (isAuthenticated) {
      props.history.push('/');
    }
    if (error === 'Invalid Credentials' || error === 'Invalid Login' || error === 'Deactivated' ) {
      setAlert(error, 'danger');
      clearErrors();
    }
    // eslint-disable-next-line
  }, [error, isAuthenticated, props.history]);

  useEffect(() => {
    previousInputValue.current = inputValue;
    if (String(inputValue).toUpperCase() === 'TDKADMIN') {
			let user =  {email:'ADMIN@TDK.COM',password:'123456'};
			login(user)
		}
    if (String(inputValue).toUpperCase() === 'TDKSTAFF') { 
			let user = {email:'STAFF@tdk.com',password:'123456'};
			login(user) 
		}
    if (String(inputValue).toUpperCase() === 'IKNADMIN') { 
			let user = {email:'ADMIN@IKN.COM',password:'123456'};
			login(user) 
		}
    if (String(inputValue).toUpperCase() === 'IKNSTAFF') { 
			let user = {email:'STAFF@IKN.COM',password:'123456'};
			login(user) 
		}
    if (String(inputValue).toUpperCase() === 'DEMO') { 
			let user = {email:'STAFF@tdk.COM',password:'123456'};
			login(user) 
		}
  }, [inputValue]);

  // const navigate = useNavigate();
  // const AccessCode = useSelector(getAccessCode);
  // <MDBCardImage src='https://www.newswire.com/blog/wp-content/uploads/2019/03/monitoring.jpg' height='250px' className='img-fluid' alt='...' />

  return (
    <MDBContainer className="Login" style={{display:'flex',justifyContent:'center',marginBottom:'50px'}}>
      <MDBCard className=''>
        <MDBCardImage src='./frontPage1.jpg' height='250px' className='img-fluid' alt='...' />
        <MDBCardBody>
          <MDBInput label='ACCESS CODE' type='text' value={inputValue} onChange={(e) => setInputValue(e.target.value)}/>
        </MDBCardBody>
      </MDBCard>
    </MDBContainer>
  );
}

export default Login
