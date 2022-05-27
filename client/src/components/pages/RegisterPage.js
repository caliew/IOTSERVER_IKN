import React, { useState, useContext, useEffect } from 'react';
import { MDBContainer, MDBRow, MDBCol, MDBCard, MDBCardBody, MDBInput, MDBBtn, MDBIcon } from 'mdbreact';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

const Register = props => {
	// -------------
  const alertContext = useContext(AlertContext);
  const authContext = useContext(AuthContext);
	// ---------------
  const { setAlert } = alertContext;
  const { register, error, clearErrors, isAuthenticated } = authContext;
	// --------------
  useEffect(() => {
    if (isAuthenticated) {
      props.history.push('/');
    }
    if (error === 'User already exists') {
      setAlert(error, 'danger');
      clearErrors();
    }
    // eslint-disable-next-line
  }, [error, isAuthenticated, props.history]);
	// --------------
  const [user, setUser] = useState({
    name: '',
    email: '',
		companyname: '',
		usertype: 'user',
		status: true,
    phone: '',
    password: '',
    password2: ''
  });
  const { name, email, phone, companyname, usertype, status, password, password2 } = user;
	// -------------------
  const onChange = e => { 
		console.log('..ON CHANGE...','..NAME..',e.target.id,'..VALUE...',e.target.value)
		setUser({ ...user, [e.target.id]: e.target.value });
	}
  const onSubmit = e => {
		// -----------------
		console.log('...ONSUBMIT....')
		console.log(user)
		// -----------------
    e.preventDefault();
		// ------------------
    if (name === '' || email === '' || password === '' || phone === '') {
      setAlert('Please enter all fields', 'danger');
    } else if (password !== password2) {
      setAlert('Passwords do not match', 'danger');
    } else {
      register({
        name,
        email,
				companyname,
				usertype,
				status,
        phone,
        password
      });
    }
  };
	// -----
	return (
		<main style={{ marginTop: '2rem' }}>
			<MDBContainer >
				<MDBRow className="d-flex justify-content-center p-5">
					<MDBCol md="6" >
						<MDBCard>
							<div className="header pt-3 grey lighten-2">
								<MDBRow className="d-flex justify-content-start">
									<h4 className="deep-grey-text mt-3 mb-4 pb-1 mx-5">Account Registration</h4>
								</MDBRow>
							</div>
							<MDBCardBody className="mx-4 mt-4">
								<MDBInput label="Your name" group type="text" validate 
													id="name" onChange={(e)=>onChange(e)}/>
								<MDBInput label="Your email" group type="text" validate 
													id="email" onChange={(e)=>onChange(e)}/>
								<MDBInput label="Your Company Name" group type="text" validate 
													id="companyname" onChange={(e)=>onChange(e)}/>
								<MDBInput label="Your Phone Number" group type="text" validate 
													id="phone" onChange={(e)=>onChange(e)}/>
								<MDBInput label="Your password" group type="password" validate containerClass="mb-0"
													id="password" onChange={(e)=>onChange(e)}/>
								<MDBInput label="Reconfirm password" group type="password" validate containerClass="mb-0"
													id="password2" onChange={(e)=>onChange(e)}/>
								<div className="text-center mb-4 mt-5">
									<MDBBtn color='primary' className="p-3 btn-block z-depth-2" onClick={(e)=>onSubmit(e)}>
										<h6>Submit</h6>
									</MDBBtn>
								</div>
							</MDBCardBody>
						</MDBCard>
					</MDBCol>
				</MDBRow>
			</MDBContainer>
	</main>
	)
}

export default Register
