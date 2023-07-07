import React, { useContext,useState,useEffect } from 'react'
import { Link } from 'react-router-dom'
import Routes from '../../Routes';
import { MDBNavbar,MDBNavbarBrand,MDBNavbarNav,MDBNavbarToggler,MDBCollapse,MDBNavItem,MDBFooter,MDBIcon } from 'mdbreact';
import '../../App.css';

import AuthContext from '../../context/auth/authContext';

const Navbar = (props) => {
  // ---------------------------------------------
  const [collapseID,setCollapseID] = useState('');
  const authContext = useContext(AuthContext);
  const { isAuthenticated, logout, user, loadUser } = authContext;
  // ---------------------------------------------
  useEffect(() => {
    isAuthenticated && loadUser();
    // eslint-disable-next-line
  }, [isAuthenticated]);
  
  const onLogout = () => {
    logout();
    // clearContacts();
  };
  //  ---------------
  const toggleCollapse = (_collapseID) => setCollapseID(collapseID !== _collapseID ? _collapseID : '');
  const closeCollapse = (collID) => { 
    window.scrollTo(0, 0);
    collapseID === collID && setCollapseID('');
  };
  // ---------------
  const authLinks = (
    <MDBNavbarNav right>
      { user && (user.companyname !== "AWC" && user.companyname !== "IKN"  && user.companyname !== "Nippon Glass") && 
        <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/BigDATAView' className='white-text'>VISZ</Link></MDBNavItem>
      }

      { user && (user.companyname !== "AWC" && user.companyname !== "IKN" && user.companyname !== "SuaraKOM" && user.companyname !== "TDK") && 
        <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/NipponGlass' className='white-text'>NIPPON</Link></MDBNavItem>
      }

      { user && (user.companyname !== "AWC" && user.companyname !== "IKN" && user.companyname !== "Nippon Glass") && 
        <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/test' className='white-text'>TEST</Link></MDBNavItem>
      }

      <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/' className='white-text'>HOME</Link></MDBNavItem>

      { user && (user.companyname !== "AWC" && user.companyname !== "IKN" && user.companyname !== "Nippon Glass") && 
          <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/cmms' className='white-text'>CMMS</Link></MDBNavItem>
      }

      { user && (user.companyname !== "AWC" && user.companyname !== "IKN" && user.companyname !== "Nippon Glass") && 
          <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/led' className='white-text'>LED</Link></MDBNavItem>
      }

      { user && (user.companyname !== "AWC" && user.companyname !== "IKN" && user.companyname !== "Nippon Glass") && 
          <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/gismap' className='white-text'>GIS</Link></MDBNavItem>
      }


      { user && (user.companyname !== "AWC" && user.companyname !== "Nippon Glass") && 
          <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/charting' className='white-text'>CHARTS</Link></MDBNavItem>
      }

      { user && (user.usertype === "administrator" || user.usertype === "superuser" ) &&
          <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/admin' className='white-text'>ADMIN</Link></MDBNavItem> }

      {/* { user && (user.usertype === "administrator" || user.usertype === "superuser" || user.usertype === "user") &&
          <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/report' className='white-text'>REPORT</Link></MDBNavItem> } */}

      <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/about' className='white-text'>ABOUT</Link></MDBNavItem>
      <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>onLogout()} to='/login' className='white-text'>LOGOUT</Link></MDBNavItem>
    </MDBNavbarNav>
  );
  //  -----------
  const guestLinks = (
    <MDBNavbarNav right>
      {/* <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/register' className='white-text'>REGISTER</Link></MDBNavItem> */}
      {/* <MDBNavItem className="px-md-2 font-weight-light"> <Link onClick={()=>closeCollapse('mainNavbarCollapse')} to='/login' className='white-text'>LOGIN</Link></MDBNavItem> */}
    </MDBNavbarNav>
  );
  // ---------------
  const overlay = (
    <div
      id='sidenav-overlay'
      style={{ backgroundColor: 'transparent' }}
      onClick={()=>toggleCollapse('mainNavbarCollapse')}
    />
  );
  // ----- viewBox="0 0 850.4 178.6"
  return (
    <div className='flyout'>
        <MDBNavbar color='indigo' dark expand='md' fixed='top' scrolling>
          <MDBNavbarBrand href='/' className='py-0 font-weight-light'>
            {
              user &&  (user.companyname === "AeroSOFT Technologies Pte Ltd" || user.companyname === "TDK" || 
                        user.companyname === "SuaraKOM" ) ? (
                <a class="navbar-brand" href="/en">
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 850.4 178.6" height="25px" preserveAspectRatio="none" fill={'white'}>
                <polygon points="103.1,37.8 65.3,75.6 140.8,75.6 "></polygon>
                <polygon points="103.1,140.8 154.6,127 140.8,75.5 "></polygon>
                <polygon points="154.6,127 168.4,178.6 206.2,113.2 "></polygon>
                <polygon points="0,113.2 37.7,178.6 51.5,127 "></polygon>
                <polygon points="51.5,127 103.1,140.8 65.3,75.5 "></polygon>
                <polygon points="65,0 -0.3,113.2 65,75.5 "></polygon>
                <polygon points="206.4,113.2 141,0 141,75.5 "></polygon>
                <polygon points="37.7,178.6 168.4,178.6 103.1,140.8 "></polygon>
                <polygon points="140.8,-0.4 65.3,-0.4 103.1,37.3 "></polygon>
                <polygon points="281.7,38 281.7,178.5 330.3,178.5 330.3,38 411,38 411,0 201,0 201,38 "></polygon>
                <path d="M530.2,0H420.5v178.5h109.7c70.3,0,100.4-49.1,100.4-89.2C630.6,49.1,600.5,0,530.2,0z M539.3,139.8h-72.2V37.9
                h72.2c19.3,0,46.1,20.5,46.1,51.4C585.4,119.4,558.4,139.8,539.3,139.8z"></path>
                <rect x="638.9" width="48.7" height="178.5"></rect>
                <polygon points="689,85.3 780.7,0 845.2,0 749.1,85.3 850.4,178.5 783,178.5 "></polygon>
                </svg>
                {/* <span>TDK Electronics · TDK Europe</span> */}
                <span> TDK ELECTRONICS MALAYSIA </span>
                </a>                          
              ) : (
                <>
                <MDBIcon icon="yin-yang" size="1x"/>
                <strong className='px-md-3 align-middle'>{ user ? user.companyname : 'IOT PORTAL'}</strong>
                </>
              )
            }
          </MDBNavbarBrand>
          <MDBNavbarToggler onClick={()=>toggleCollapse('mainNavbarCollapse')} />

          <MDBCollapse id='mainNavbarCollapse' isOpen={collapseID} navbar>
            {isAuthenticated ? authLinks : guestLinks}
          </MDBCollapse>

        </MDBNavbar>

        {collapseID && overlay}
        <main style={{ marginTop: '6rem' }}>
          <Routes />
        </main>
        
        <MDBFooter color='indigo'>
          <p className='footer-copyright mb-0 py-3 text-center'>
            &copy; {new Date().getFullYear()} Copyright:
            <a href='https://www.MDBootstrap.com'> AeroSOFT Technologies Pte Ltd </a>
          </p>
        </MDBFooter>  
    </div>
  )
}

export default Navbar
