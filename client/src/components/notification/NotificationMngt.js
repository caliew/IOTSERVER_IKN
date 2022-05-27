import React, { useContext,useEffect,useState } from 'react';
import { MDBContainer,MDBRow,MDBCardGroup,MDBCardBody,MDBCard,MDBCardText,MDBJumbotron,MDBIcon } from 'mdbreact';
import AuthContext from '../../context/auth/authContext';
import AlertContext from '../../context/alert/alertContext';

const NotificationMngt = () => {
	//	-----------------
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;
  const authContext = useContext(AuthContext);
  const { getAllUsers, user, users, companies, updateUser, updateCompany, clearErrors, isAuthenticated } = authContext;
	//	-----------------
  useEffect(() => {
  },[])
  // --------------------
  const onChangeUserState = (e) => {
    e.status = !e.status;
    updateUser(e);
  }
  const onChangeCompanyState = (e) => {
    e.status = !e.status;
    updateCompany(e);
  }
  // -------------------------
  // UPDATE USER ACTIVE STATUS
  // -------------------------
  return (
		<MDBContainer >
			<MDBJumbotron className="p-4">

      <h3>USERS ACCOUNT MANAGEMENT</h3>

      <MDBRow className="masonry-with-columns px-4">
        <MDBCardGroup deck className="justify-content-center">
          { user && user.name ==="superuser" && users && users.map(user => (
              <MDBRow className="masonry-with-flex m-1" onClick={()=>onChangeUserState(user)}>
                <MDBCard className="m-1" >
                  <MDBCardBody>
                    <MDBCardText>{user.name}<br/>{user.companyname}<br/>{user.phone}<br/>{user.email}<br/>----{user.status}----</MDBCardText>
                    <MDBCardText>{user.status === true ? 
                      <MDBIcon far icon="check-circle" size='2x'/> : <MDBIcon icon="ban" size='2x' />}
                    </MDBCardText>
                  </MDBCardBody>
                </MDBCard>
              </MDBRow>
            ))
          }
        </MDBCardGroup>
      </MDBRow>

      <h3>COMPANIES/DEPARTMENT ACCOUNT MANAGEMENT</h3>

      <MDBRow className="masonry-with-columns px-4">
        <MDBCardGroup deck className="justify-content-center">
          { user.name ==="superuser"  && companies && companies.map(company => (
              <MDBRow className="masonry-with-flex m-1">
                <MDBCard className="m-1" >
                  <MDBCardBody onClick={()=>onChangeCompanyState(company)}>
                    <MDBCardText>{company.companyname}</MDBCardText>
                    <MDBCardText>{company.status === true ? 
                      <MDBIcon far icon="check-circle" size='2x'/> : <MDBIcon icon="ban" size='2x' />}
                    </MDBCardText>
                  </MDBCardBody>
                </MDBCard>
              </MDBRow>
            ))
          }
        </MDBCardGroup>
      </MDBRow>

      </MDBJumbotron>
    </MDBContainer>
  )
}

export default NotificationMngt
