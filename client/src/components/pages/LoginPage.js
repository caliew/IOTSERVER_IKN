import { useState, useRef, useEffect, useContext } from 'react'
import { MDBContainer, MDBCard, MDBCardBody, MDBInput, MDBCardImage } from 'mdbreact';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

const Login = (props) => {

  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const authContext = useContext(AuthContext);
  const { login, user, error, clearErrors, isAuthenticated } = authContext;
  const [inputValue, setInputValue] = useState("");
  const previousInputValue = useRef("");

  useEffect(() => {
    // ---------------------------
    console.log('..LOGIN PAGE .. USE EFFECT..',isAuthenticated,user)
    if (isAuthenticated && user.name !== 'undefined') {
      console.log('..LOGIN PAGE .. HISTORY PUSH /',isAuthenticated,user.name)
      props.history.push('/');
    }
    if (error === 'Invalid Credentials' || error === 'Invalid Login' || error === 'Deactivated' ) {
      setAlert(error, 'danger');
      clearErrors();
    }
    // ------------------------
    // eslint-disable-next-line
  }, [user]);

  useEffect(() => {
    // ---------------------------
    let user = null;
    previousInputValue.current = inputValue;
    if (String(inputValue).toUpperCase() === 'TDKADMIN') {
			user =  {email:'ADMIN@TDK.COM',password:'123456'};
		}
    if (String(inputValue).toUpperCase() === 'TDKSTAFF') { 
			user = {email:'STAFF@tdk.com',password:'123456'};
		}
    if (String(inputValue).toUpperCase() === 'IKNADMIN') { 
			user = {email:'ADMIN@IKN.COM',password:'123456'};
		}
    if (String(inputValue).toUpperCase() === 'IKNSTAFF') { 
			user = {email:'STAFF@IKN.COM',password:'123456'};
		}
    if (String(inputValue).toUpperCase() === 'DEMO') { 
			user = {email:'STAFF@tdk.COM',password:'123456'};
		}
    user && login(user) 
    //  -----------
    // eslint-disable-next-line
  }, [inputValue]);

  // const navigate = useNavigate();
  // const AccessCode = useSelector(getAccessCode);
  // <MDBCardImage src='https://www.newswire.com/blog/wp-content/uploads/2019/03/monitoring.jpg' height='250px' className='img-fluid' alt='...' />
  // ----------------------------
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
