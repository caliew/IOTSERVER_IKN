import React, { useRef, useEffect, useState } from 'react';
import mapboxgl from '!mapbox-gl'; // eslint-disable-line import/no-webpack-loader-syntax
import { MDBContainer,MDBIcon,MDBCardGroup,MDBCard,MDBCardBody,MDBCardFooter } from 'mdbreact';

mapboxgl.accessToken = 'pk.eyJ1IjoiY2FsaWV3IiwiYSI6ImNsYnQ1ZjcwazAzMzczcHQwa2N2OTU5bTUifQ.MXbnNqpc6B3T44G97EmI6Q';

const GISMapPage = () => {

  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(101.63772870935958);
  const [lat, setLat] = useState(3.4695673660739996);
  const [zoom, setZoom] = useState(9);
  // 3.4695673660739996, 101.63772870935958
  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: zoom
    });
  });

  return (
    <MDBContainer className='clearfix"' style={{ marginTop: '2rem', marginBottom:'2rem' }}>
      <h2>GIS</h2>
      <div className="map-sidebar">Longitude: {lng} | Latitude: {lat} | Zoom: {zoom}</div>
      <div ref={mapContainer} className="map-container" />
    </MDBContainer>
  )
}

export default GISMapPage