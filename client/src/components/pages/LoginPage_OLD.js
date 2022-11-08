import React, { useState, useContext, useEffect } from 'react';
import { MDBContainer, MDBRow, MDBCol, MDBCard, MDBCardBody, MDBInput, MDBBtn } from 'mdbreact';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

const Login = (props) => {
	//	-----------------
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const authContext = useContext(AuthContext);
  const { login, error, clearErrors, isAuthenticated } = authContext;
  // -------------------------------
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
	
  const [user, setUser] = useState({
    email: '',
    password: ''
  });
	// -----------------------------
  const { email, password } = user;
  const onChange = e => {
		setUser({ ...user, [e.target.id]: e.target.value });
	}
  const onSubmit = e => {
    if (email === '' || password === '') {
      setAlert('Please fill in all fields', 'danger');
    } else {
      login({email,password});
    }
  };
	//	---
	return (
		<main style={{ marginTop: '2rem' }}>
			<MDBContainer >
				<MDBRow className="d-flex justify-content-center p-5">
					<MDBCol md="6" >
						<MDBCard>
							<div className="header pt-3 grey lighten-2">
								<MDBRow className="d-flex justify-content-start">
									<h4 className="deep-grey-text mt-3 mb-4 pb-1 mx-5">Account Log in</h4>
								</MDBRow>
							</div>
							<MDBCardBody className="mx-4 mt-4">
								<MDBInput label="Your email" group type="text" validate 
													id="email" onChange={(e)=>onChange(e)}/>
								<MDBInput label="Your password" group type="password" validate containerClass="mb-0"
													id="password" onChange={(e)=>onChange(e)}/>
								<p className="font-small grey-text d-flex justify-content-end"> Forgot
									<a href="#!" className="dark-grey-text font-weight-bold ml-1">Password?</a>
								</p>
								<div className="text-center mb-4 mt-5">
									<MDBBtn color='primary' className="p-3 btn-block z-depth-2" onClick={()=>onSubmit()}>
										<h6>Log in</h6>
									</MDBBtn>
								</div>
								<p className="font-small grey-text d-flex justify-content-center">Don't have an account?
									<a href="#!" className="dark-grey-text font-weight-bold ml-1">Sign Up</a>
								</p>
							</MDBCardBody>
						</MDBCard>
					</MDBCol>
				</MDBRow>
			</MDBContainer>
		</main>
	)
}

export default Login
