import React, { useState, useEffect } from 'react'

// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function randomExtend(minNum, maxNum) {
  if (arguments.length === 1) {
    return parseInt(Math.random() * minNum + 1, 10)
  } else {
    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
  }
}

function CHILLER({ color, handleComponetSelection }) {
    // --------------
    // USE STATE HOOK
    // --------------
    const [mPConsumption, setPConsumption] = useState(0);
    const [mTotalEnergy, setTotalEnergy] = useState(0);
    // --------------------
    function createData() {
        let mPComsp = randomExtend(12.5,17.5);
        setPConsumption(mPComsp);
        setTotalEnergy(prev => prev + mPComsp);
    }
    useEffect(() => {
        // ----------
        createData();
        // ----------
        const timer = setInterval(createData, 1000)
        return () => clearInterval(timer)
    }, [])
    // --------------
    const mEfficiency = '123,293'
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // --------------------------------------------
    return (
        <div style={{display:'flex',alignItems:'center'}}>
            <div style={{fontSize:'1.0rem',lineHeight:'1.2rem',color:'white',backgroundColor:'black'}}>
                <hr/>
                <p>CHILLER PUMPS</p>
                <hr/>
                <p style={{fontSize:'1.0rem',lineHeight:'1.0rem'}}>ELECTRIC POWER CONSUMPTION</p>
                <p style={{fontSize:'1.0rem',lineHeight:'1.0rem'}}>{mEfficiency}kWhr</p>
                <hr/>
            </div>
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300.0pt" height="162.0pt" viewBox="0 0 300.0 162.0" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(0.0,162.0) scale(0.10,-0.10)" fill={color} >            
                <path d="M2095 1591 l-30 -6 23 -17 c13 -9 19 -19 13 -22 -5 -4 -12 -2 -16 4 -3 5 -11 10 -18 10 -6 0 -2 -6 8 -14 13 -9 25 -11 36 -5 12 6 22 3 33 -10 16 -18 15 -18 -16 -15 -18 1 -27 0 -20 -3 6 -2 12 -11 12 -19 0 -10 -12 -14 -39 -14 l-39 0 5 40 c4 27 2 40 -6 40 -24 0 -48 -20 -61 -49 -10 -24 -9 -35 2 -58 8 -15 20 -27 27 -25 10 2 11 -18 6 -95 -4 -54 -11 -102 -15 -106 -4 -5 -6 -35 -3 -68 5 -50 3 -59 -11 -59 -18 0 -22 -15 -6 -25 6 -3 10 -3 10 2 0 4 29 8 65 8 36 0 65 -3 65 -7 0 -5 -6 -8 -14 -8 -8 0 -16 -6 -19 -14 -4 -11 4 -16 31 -19 l37 -4 -35 -1 c-29 -2 -38 -7 -46 -31 -6 -16 -9 -52 -6 -80 4 -47 7 -51 30 -51 25 0 25 0 6 -17 -24 -22 -20 -63 7 -70 10 -3 19 -9 19 -14 0 -5 8 -9 18 -9 16 1 16 1 0 11 -18 10 -24 46 -10 64 4 6 16 12 27 14 19 3 19 2 2 -16 -41 -46 -10 -78 78 -78 54 0 67 4 90 25 32 30 55 71 55 100 0 11 7 32 16 46 23 34 8 47 -49 43 -25 -2 -43 -1 -40 4 2 4 -1 7 -6 7 -6 0 -2 9 9 20 11 11 24 20 30 20 6 0 5 10 -2 25 -8 17 -19 25 -37 25 -15 0 -21 3 -15 8 7 4 13 16 15 27 5 25 51 32 68 11 13 -16 6 -56 -10 -56 -5 0 -9 -4 -9 -10 0 -20 29 3 35 28 5 21 1 31 -19 49 -14 12 -26 27 -26 33 0 5 -4 10 -10 10 -5 0 -10 -5 -10 -11 0 -6 -9 -18 -19 -27 -30 -27 -34 -65 -10 -96 17 -21 18 -27 6 -32 -16 -6 -21 -60 -6 -69 5 -4 9 -1 9 4 0 6 22 11 51 11 45 0 50 -2 39 -15 -9 -11 -27 -15 -54 -13 -39 3 -41 1 -44 -27 -5 -45 -30 -68 -66 -61 -17 4 -33 11 -37 18 -4 6 -21 11 -37 10 -26 0 -31 4 -34 25 -2 15 -10 29 -18 31 -13 5 -13 3 -1 -12 17 -21 7 -33 -14 -16 -20 17 -4 36 36 45 23 5 29 11 24 23 -15 36 -17 53 -7 65 16 20 3 77 -19 77 -12 0 -19 7 -19 20 0 17 7 20 44 20 36 0 48 5 65 26 27 35 26 50 -5 95 -28 41 -50 42 -65 3 -11 -31 -29 -31 -29 0 0 18 6 25 22 28 13 2 24 10 25 18 9 74 15 88 36 94 32 8 8 26 -26 19 -21 -4 -25 -8 -15 -14 10 -7 10 -9 -3 -9 -14 0 -16 -8 -11 -45 3 -31 1 -45 -7 -45 -15 0 -13 138 2 147 6 3 7 1 3 -5 -4 -7 -3 -12 3 -12 13 0 24 40 19 71 -2 13 -18 34 -37 46 l-34 23 49 0 c40 0 50 -3 51 -17 1 -10 5 -31 8 -48 5 -22 1 -36 -14 -51 -11 -12 -17 -24 -14 -28 3 -3 14 5 24 18 20 26 26 81 9 91 -15 9 -12 25 5 25 31 0 14 18 -22 24 -43 7 -56 6 -98 -3z m-64 -73 c-10 -28 -27 -34 -35 -13 -4 11 -2 14 6 9 7 -5 9 -2 5 9 -4 12 -2 14 10 10 12 -5 14 -3 8 7 -5 8 -4 11 3 6 7 -4 8 -15 3 -28z m-44 -40 c-3 -8 -6 -5 -6 6 -1 11 2 17 5 13 3 -3 4 -12 1 -19z m167 7 c-4 -8 -10 -15 -15 -15 -5 0 -9 7 -9 15 0 8 7 15 15 15 9 0 12 -6 9 -15z m-134 -24 c0 -22 -16 -36 -24 -22 -8 12 3 41 15 41 5 0 9 -9 9 -19z m94 -72 c0 -35 -3 -85 -5 -111 -4 -48 -4 -48 -39 -45 l-34 2 3 95 c3 111 10 128 48 125 28 -1 28 -2 27 -66z m76 -139 c0 -11 -6 -20 -12 -20 -10 0 -10 -2 -1 -8 7 -4 9 -13 4 -21 -6 -9 -10 -6 -14 11 -4 12 -2 25 3 26 6 2 10 8 10 13 0 6 -5 7 -12 3 -7 -4 -8 -3 -4 4 11 19 26 14 26 -8z m10 -84 l-21 -21 16 50 c8 28 16 52 16 55 1 3 4 -10 6 -29 3 -25 -1 -40 -17 -55z m-47 44 c3 -11 1 -18 -4 -14 -5 3 -9 0 -9 -5 0 -6 10 -11 22 -11 28 0 15 -13 -17 -17 -23 -3 -25 0 -25 32 0 39 24 50 33 15z m-113 0 c0 -5 -7 -10 -15 -10 -8 0 -15 5 -15 10 0 6 7 10 15 10 8 0 15 -4 15 -10z m70 -14 c0 -40 -37 -95 -60 -89 -13 4 -20 14 -20 30 0 19 4 23 19 18 10 -3 25 -3 34 0 22 9 14 39 -11 43 -33 5 -26 22 8 22 25 0 30 -4 30 -24z m-27 -23 c-6 -15 -33 -18 -33 -4 0 5 -10 7 -22 4 -18 -4 -20 -2 -8 6 20 14 69 9 63 -6z m247 -134 c0 -5 -4 -9 -10 -9 -5 0 -10 7 -10 16 0 8 5 12 10 9 6 -3 10 -10 10 -16z m-206 -55 c9 -23 8 -24 -12 -24 -26 0 -34 11 -21 27 15 17 26 17 33 -3z m-11 -41 c-7 -2 -19 -2 -25 0 -7 3 -2 5 12 5 14 0 19 -2 13 -5z m250 -73 c-9 -39 -22 -59 -48 -76 -40 -26 -135 -18 -135 11 0 11 11 13 48 8 45 -5 50 -3 75 27 15 17 27 38 27 45 0 8 9 13 20 12 15 -1 18 -6 13 -27z"/>
                <path d="M1758 1573 c-69 -7 -39 -18 45 -17 l82 2 -70 -8 c-171 -19 -186 -22 -201 -46 -9 -12 -15 -31 -14 -41 4 -39 0 -42 -61 -45 l-60 -3 -2 -162 c-2 -151 -1 -162 16 -157 11 4 17 0 17 -11 0 -12 -5 -15 -17 -10 -10 4 -22 8 -28 9 -16 3 -69 39 -78 53 -4 7 -15 13 -22 13 -12 0 -15 14 -15 59 0 54 2 59 25 65 28 7 33 31 9 44 -15 8 -15 12 1 42 19 36 14 90 -10 110 -19 16 -19 40 0 40 8 0 15 6 15 14 0 17 -63 25 -143 18 -38 -3 -57 -9 -57 -18 0 -9 10 -11 33 -9 86 11 161 14 147 6 -8 -5 -57 -11 -109 -14 -66 -4 -98 -11 -111 -22 -15 -13 -22 -14 -40 -5 -92 49 -127 -132 -38 -194 30 -21 44 -20 68 4 19 19 20 19 60 -2 39 -21 40 -23 40 -78 0 -43 -4 -59 -20 -73 -24 -20 -26 -43 -5 -54 13 -8 13 -14 -1 -51 -15 -36 -21 -42 -46 -42 -69 0 -118 -54 -118 -129 0 -36 4 -42 31 -54 l31 -12 -52 -16 c-50 -16 -52 -16 -86 7 -19 13 -73 40 -119 59 -94 39 -166 46 -214 20 -39 -20 -81 -72 -81 -100 0 -12 -7 -25 -15 -29 -9 -3 -15 -18 -15 -36 0 -23 6 -33 25 -42 30 -13 33 -28 5 -28 -10 0 -23 -6 -27 -14 -4 -7 -28 -20 -53 -28 -31 -10 -45 -20 -45 -33 0 -12 111 -96 350 -266 193 -137 353 -249 358 -249 4 0 109 55 232 122 192 105 225 126 225 146 0 17 -10 27 -41 40 -37 16 -40 19 -24 32 14 12 25 10 81 -18 l65 -32 160 86 c119 65 159 91 159 105 0 15 5 18 24 13 18 -4 53 10 138 57 149 82 156 92 75 116 -26 7 -47 17 -47 22 0 5 -12 11 -27 15 -16 3 -38 8 -50 12 -17 4 -23 2 -23 -8 0 -10 11 -15 31 -16 17 0 33 -3 36 -6 4 -4 -73 -46 -84 -46 -7 0 11 86 20 91 15 10 -4 14 -63 14 l-55 0 -3 -37 c-5 -62 -46 -74 -101 -28 -17 15 -22 26 -17 44 6 23 9 24 41 15 19 -6 41 -6 48 -2 6 4 16 8 21 8 5 0 10 15 10 33 1 17 -2 32 -6 32 -5 0 -8 7 -8 16 0 11 6 14 20 9 15 -5 18 -3 14 8 -3 9 1 17 11 19 16 3 16 5 -1 24 -11 12 -31 25 -47 28 -25 6 -27 5 -15 -13 9 -14 16 -17 24 -10 14 11 29 -5 19 -21 -6 -10 -61 -7 -110 8 -23 6 -32 16 -39 45 -8 33 -13 37 -40 37 -17 0 -42 3 -56 6 -18 4 -21 3 -11 -4 18 -13 7 -44 -13 -36 -22 9 -39 -31 -31 -77 5 -31 4 -39 -8 -39 -30 0 -37 66 -11 108 31 52 54 62 124 52 35 -5 67 -7 72 -4 11 7 10 34 -2 34 -18 0 -10 27 13 44 12 9 16 14 10 11 -9 -4 -13 3 -13 20 0 15 -5 35 -10 45 -7 13 -7 21 0 25 38 23 52 -94 16 -121 -11 -8 -14 -14 -7 -14 23 0 61 48 61 78 0 33 -55 111 -79 111 -11 1 -13 13 -8 56 l6 55 -40 0 c-65 0 -93 23 -70 59 5 8 16 11 30 6 17 -5 20 -10 11 -20 -6 -8 -18 -11 -26 -8 -8 3 -14 0 -14 -6 0 -19 30 -12 55 14 17 16 25 35 25 57 0 35 -23 78 -43 78 -8 0 -8 -3 0 -11 6 -6 9 -18 6 -25 -7 -19 -49 -18 -57 2 -10 25 -7 34 10 34 8 0 13 -4 9 -9 -3 -5 -1 -12 4 -15 5 -3 11 3 14 14 4 16 14 20 44 20 35 0 42 -4 58 -34 16 -29 17 -39 7 -61 -7 -14 -22 -30 -34 -35 -13 -5 -17 -9 -8 -9 8 -1 20 -9 26 -18 10 -16 7 -18 -35 -16 l-46 2 50 -9 c54 -10 85 3 52 21 -16 9 -16 12 -2 32 18 25 20 70 4 99 -9 17 -8 24 5 34 10 7 14 14 9 17 -14 8 -96 14 -135 10z m-43 -76 c26 -37 14 -127 -17 -127 -6 0 -4 8 5 18 20 22 24 87 5 76 -7 -5 -9 -2 -5 8 5 15 -9 38 -25 38 -4 0 -8 -8 -8 -18 0 -21 -18 -42 -36 -42 -17 0 -26 29 -14 48 9 14 10 12 4 -8 -6 -24 -6 -24 9 -5 8 11 14 22 12 25 -2 3 10 6 26 7 19 2 33 -5 44 -20z m-370 -7 c-3 -5 -2 -10 3 -10 12 0 32 -46 32 -75 0 -34 -34 -65 -70 -65 -27 0 -30 2 -24 25 8 32 -25 125 -45 125 -12 0 -11 -3 2 -18 10 -10 14 -22 10 -25 -3 -4 -1 -7 4 -7 12 0 11 -13 -2 -43 -4 -10 -2 -23 4 -31 8 -10 5 -20 -13 -41 -17 -20 -25 -24 -30 -14 -5 11 -7 11 -12 2 -8 -17 -24 -16 -24 1 0 8 -4 16 -10 18 -5 2 -6 9 -1 17 7 11 15 11 42 2 18 -6 34 -9 36 -8 2 2 -3 17 -12 33 -13 26 -13 29 0 32 27 6 16 22 -15 22 -16 0 -30 -4 -30 -10 0 -5 -9 -10 -20 -10 -13 0 -20 -6 -19 -17 0 -11 3 -13 6 -5 2 6 13 12 24 12 10 0 19 6 19 13 0 19 20 -15 20 -35 0 -10 -5 -18 -11 -18 -5 0 -8 4 -5 9 3 4 -5 6 -19 3 -16 -3 -26 -13 -30 -32 -8 -38 -38 -64 -65 -55 -53 17 -79 129 -42 175 24 29 67 21 84 -15 7 -16 19 -25 32 -24 16 1 17 2 4 6 -22 6 -32 34 -17 47 9 8 10 8 5 -1 -4 -7 -2 -13 3 -13 6 0 11 7 11 15 0 8 7 15 15 15 9 0 12 -6 8 -17 -5 -12 -2 -15 10 -10 10 4 20 0 26 -11 6 -9 11 -12 11 -6 0 6 -7 17 -15 24 -13 11 -13 15 -3 21 19 13 131 11 123 -1z m465 -42 c0 -32 2 -31 -39 -17 -17 6 -31 17 -31 25 0 20 20 17 21 -3 0 -16 1 -15 8 2 8 19 8 19 19 0 10 -17 11 -15 7 15 -4 25 -3 31 5 20 5 -8 10 -27 10 -42z m-125 22 c-4 -13 -2 -20 5 -18 7 2 15 -3 18 -11 3 -10 0 -12 -12 -8 -9 4 -16 5 -16 3 0 -3 -3 -13 -7 -23 -6 -16 -5 -16 10 -4 10 8 20 11 24 7 8 -7 -26 -35 -44 -36 -6 0 -19 10 -27 21 l-15 22 2 -23 c2 -32 41 -56 70 -43 17 8 28 7 41 -2 15 -11 17 -25 14 -75 l-3 -61 52 2 c29 2 56 0 60 -4 3 -4 -2 -7 -13 -7 -16 0 -17 -2 -4 -10 11 -7 0 -10 -38 -10 -33 0 -51 4 -47 10 3 6 -1 10 -10 10 -11 0 -15 5 -11 15 3 8 1 15 -5 15 -18 0 -23 -32 -7 -44 13 -10 14 -15 3 -29 -12 -16 -13 -16 -27 5 -13 20 -17 21 -32 9 -9 -7 -16 -21 -16 -31 0 -10 -9 -20 -20 -23 -20 -5 -21 -1 -19 149 1 133 3 156 17 161 9 4 18 1 20 -5 6 -19 22 -14 22 7 0 22 10 51 17 51 2 0 1 -9 -2 -20z m-408 -102 c-3 -7 -5 -2 -5 12 0 14 2 19 5 13 2 -7 2 -19 0 -25z m304 9 c5 -7 4 -204 -1 -277 0 -2 -5 1 -12 8 -14 14 -48 16 -48 3 0 -5 15 -12 34 -15 30 -6 34 -10 32 -36 0 -17 -4 -30 -9 -30 -4 0 -7 6 -6 13 3 27 -2 34 -24 30 -35 -7 -47 42 -47 188 l0 125 38 -1 c20 0 40 -4 43 -8z m106 -13 c-3 -3 -12 -4 -19 -1 -8 3 -5 6 6 6 11 1 17 -2 13 -5z m-327 -49 c0 -11 -13 -15 -52 -17 l-53 -1 65 -6 65 -6 -50 -8 c-27 -4 -66 -3 -85 2 -19 5 -28 9 -20 10 9 1 22 10 30 21 18 25 100 29 100 5z m460 -31 c0 -41 -2 -45 -22 -42 -20 3 -23 9 -24 46 -1 38 1 42 22 42 22 0 24 -4 24 -46z m-490 -89 c0 -54 0 -55 -29 -55 -28 0 -29 2 -33 55 l-3 55 33 0 32 0 0 -55z m493 -22 c-13 -2 -35 -2 -50 0 -16 2 -5 4 22 4 28 0 40 -2 28 -4z m-123 -53 c0 -13 -1 -13 -10 0 -5 8 -10 22 -10 30 0 13 1 13 10 0 5 -8 10 -22 10 -30z m129 33 c17 17 36 -36 22 -62 -9 -17 -21 -21 -59 -21 -27 0 -54 6 -61 13 -11 10 -13 8 -8 -10 3 -12 0 -27 -7 -32 -16 -13 -66 -2 -66 15 0 8 -7 14 -15 14 -17 0 -20 -16 -5 -25 17 -10 11 -25 -10 -25 -15 0 -20 7 -20 28 1 30 21 62 39 62 6 0 11 -8 11 -19 0 -10 7 -25 16 -32 14 -11 19 -10 35 10 11 13 19 33 19 45 0 34 17 44 60 36 23 -4 43 -3 49 3z m-534 -43 c11 0 33 7 49 15 35 18 33 18 33 0 0 -9 -10 -17 -21 -20 -38 -8 -146 -11 -135 -5 6 4 10 10 10 14 -3 23 1 25 21 12 12 -9 32 -16 43 -16z m377 -2 c-9 -9 -12 -7 -12 12 0 19 3 21 12 12 9 -9 9 -15 0 -24z m-224 -31 c18 -19 29 -107 13 -107 -6 0 -11 14 -11 30 0 17 -7 44 -15 60 -17 33 -28 40 -18 13 6 -17 5 -17 -14 0 -24 21 -43 22 -43 2 0 -18 -60 -30 -97 -19 -24 7 -20 9 32 14 l60 7 -60 3 -60 3 65 7 c86 8 130 4 148 -13z m246 8 c-4 -8 -10 -15 -15 -15 -4 0 -6 7 -3 15 4 8 10 15 15 15 4 0 6 -7 3 -15z m-294 -20 c7 -8 16 -13 20 -10 5 3 6 -5 3 -17 -3 -17 -2 -19 5 -9 7 9 10 -1 10 -33 1 -25 -3 -48 -9 -51 -5 -4 -7 -11 -4 -16 7 -10 -2 -11 -29 0 -17 7 -16 9 8 24 14 10 26 23 26 29 0 7 -7 3 -15 -8 -14 -18 -14 -18 -16 11 -1 17 -1 35 0 41 1 6 -6 17 -14 24 -17 14 -20 30 -6 30 5 0 14 -7 21 -15z m164 -20 c-7 -17 -44 -21 -44 -5 0 6 -5 10 -11 10 -5 0 -7 -5 -3 -12 5 -8 2 -9 -10 -5 -10 4 -21 7 -24 8 -19 2 37 18 65 18 25 1 31 -3 27 -14z m-187 -52 c6 -49 -1 -55 -77 -60 -71 -5 -88 10 -74 65 9 36 10 37 51 34 24 -2 50 1 60 7 24 13 33 2 40 -46z m460 44 c-4 -14 -50 -21 -84 -12 -39 9 -17 23 38 23 35 1 49 -3 46 -11z m-212 -27 c6 0 26 3 45 6 l34 7 -27 -32 c-15 -18 -27 -37 -27 -43 0 -6 -7 -5 -17 3 -9 8 -14 9 -10 3 10 -17 25 -94 18 -94 -3 0 -13 5 -21 10 -12 7 -12 12 -2 22 18 18 15 27 -8 21 -13 -4 -23 -19 -30 -47 -6 -22 -15 -49 -20 -58 -5 -9 -6 -19 -1 -22 5 -3 12 -23 16 -43 4 -21 15 -43 25 -50 14 -10 17 -22 12 -60 -3 -27 -10 -51 -16 -55 -19 -13 -101 -9 -122 7 -21 16 -20 16 56 19 73 1 71 21 -3 21 -31 0 -57 4 -57 9 0 6 -7 1 -16 -10 -8 -10 -13 -14 -10 -7 3 6 -6 15 -22 21 -25 9 -30 6 -49 -22 -29 -44 -17 -67 50 -94 39 -17 54 -28 50 -38 -6 -17 -27 -18 -45 -1 -54 51 -132 -29 -81 -85 22 -24 2 -23 -30 2 -14 11 -32 20 -39 20 -8 0 -18 3 -22 7 -4 5 -13 8 -19 8 -7 0 -11 12 -9 30 7 69 74 110 105 64 9 -11 20 -18 26 -15 6 4 20 2 31 -4 11 -6 20 -7 20 -2 0 8 -25 21 -52 26 -4 0 -13 7 -19 14 -23 22 -76 14 -108 -15 -28 -27 -55 -83 -33 -69 5 3 9 -1 8 -10 -1 -16 13 -27 49 -39 32 -10 -2 -25 -60 -25 l-50 0 -3 45 c-5 85 56 162 142 176 l41 6 -36 2 c-44 1 -106 -40 -139 -94 -18 -29 -21 -46 -17 -83 l5 -47 -25 29 c-20 23 -24 37 -20 64 12 71 91 142 160 142 20 0 37 5 37 10 0 6 14 10 30 10 17 0 30 5 30 11 0 5 5 7 11 3 8 -5 8 -9 -1 -14 -8 -5 -9 -10 -2 -14 6 -4 15 1 20 10 10 18 4 64 -9 64 -5 0 -9 12 -9 28 0 26 -1 27 -48 24 -43 -3 -51 -1 -65 22 -13 19 -14 30 -7 48 10 23 10 22 7 -3 -5 -32 19 -49 67 -49 23 0 39 6 45 18 9 15 10 15 11 -5 0 -24 30 -45 65 -47 11 -1 20 -7 20 -14 0 -7 7 -17 15 -22 13 -8 13 -10 1 -10 -11 0 -12 -3 -4 -11 6 -6 9 -18 6 -25 -3 -9 2 -14 13 -13 11 0 14 3 7 5 -8 4 -9 13 -4 27 12 31 -28 76 -74 84 -28 4 -35 10 -35 28 0 14 9 26 25 33 14 6 25 16 25 22 0 17 43 28 66 18 11 -5 28 -22 38 -36 13 -21 16 -23 14 -7 -2 10 -17 29 -34 40 -17 11 -29 26 -27 32 4 12 -25 26 -38 17 -6 -3 -5 -11 2 -20 6 -8 8 -14 3 -14 -5 0 -19 -3 -32 -6 -13 -4 -22 -3 -21 2 4 22 -2 35 -13 28 -7 -5 -8 -3 -4 5 5 7 14 10 22 7 22 -8 44 4 44 25 0 10 7 19 15 19 8 0 15 -6 15 -14 0 -28 121 -24 126 4 1 8 5 23 9 33 5 12 3 17 -6 15 -8 -2 -16 -12 -19 -23 -6 -22 -38 -30 -76 -21 -19 5 -24 13 -24 37 l0 31 63 -6 c34 -3 67 -6 72 -6z m179 -39 c3 -4 3 -10 0 -13 -7 -8 -54 3 -54 13 0 12 47 12 54 0z m-586 -26 c15 -32 15 -48 2 -40 -11 7 -14 -28 -3 -39 4 -4 7 -27 8 -52 0 -40 -2 -44 -20 -40 -11 3 -24 6 -29 6 -5 0 -3 7 4 15 6 8 10 20 7 27 -4 8 -6 7 -6 -4 -2 -29 -66 -24 -98 8 -14 14 -23 27 -21 30 10 10 68 -19 69 -34 1 -15 2 -15 6 1 3 10 14 17 29 17 13 0 24 4 24 9 0 11 -86 42 -94 33 -16 -15 -3 29 15 54 l21 29 -26 -28 c-14 -15 -26 -35 -26 -43 0 -8 -4 -14 -9 -14 -14 0 -1 37 23 62 15 16 35 24 67 26 41 2 47 0 57 -23z m502 -1 c0 -8 -4 -12 -10 -9 -5 3 -10 -2 -11 -12 0 -11 -3 -13 -6 -5 -3 7 1 19 7 27 16 19 20 19 20 -1z m75 -11 c24 4 34 0 44 -14 8 -14 18 -18 33 -13 14 4 18 2 14 -5 -4 -6 -2 -11 3 -11 6 0 11 -9 11 -19 0 -33 17 -33 39 2 23 36 28 26 6 -13 -8 -14 -14 -37 -15 -52 0 -25 -1 -26 -36 -15 -38 12 -69 61 -65 105 2 19 -2 22 -32 22 -20 0 -42 2 -49 5 -10 4 -13 -3 -12 -22 0 -15 -5 -34 -13 -41 -21 -22 -6 -32 46 -31 27 1 54 -2 60 -5 6 -4 11 -26 11 -49 -1 -39 -2 -41 -15 -23 -8 11 -15 30 -15 43 0 19 -5 23 -31 23 -17 0 -28 -4 -24 -10 3 -5 2 -10 -4 -10 -5 0 -12 4 -16 10 -3 5 -12 7 -20 3 -22 -8 -20 67 2 110 15 29 20 32 32 19 9 -9 26 -12 46 -9z m-425 -30 c0 -6 6 -14 13 -16 9 -4 8 -8 -3 -16 -15 -11 -10 -14 25 -12 14 0 16 -1 5 -6 -8 -3 -24 -13 -34 -22 -18 -15 -19 -15 -14 5 5 20 2 21 -58 21 -61 -1 -98 13 -79 30 4 5 10 2 12 -4 5 -15 133 -19 133 -5 0 5 -26 6 -59 4 -55 -4 -80 5 -68 26 8 12 127 8 127 -5z m440 -35 c0 -12 4 -17 12 -12 7 4 8 3 4 -5 -4 -6 -11 -9 -16 -6 -5 3 -25 6 -45 7 -27 1 -32 4 -21 10 9 5 16 15 16 23 0 7 6 15 13 18 17 6 37 -12 37 -35z m114 7 c-4 -8 -8 -15 -10 -15 -2 0 -4 7 -4 15 0 8 4 15 10 15 5 0 7 -7 4 -15z m-779 -15 c4 -6 -2 -9 -14 -7 -29 4 -39 17 -13 17 11 0 24 -5 27 -10z m-332 -22 c21 -6 36 -16 34 -22 -3 -6 -10 -10 -16 -8 -7 1 -10 -2 -6 -8 4 -7 11 -7 18 -2 7 5 23 6 37 3 23 -6 22 -8 -22 -34 -57 -33 -91 -84 -85 -129 l4 -33 1 35 c2 44 51 107 98 126 52 22 88 17 123 -15 52 -49 34 -92 -20 -47 -39 33 -78 33 -113 1 -25 -23 -33 -57 -27 -117 3 -22 -22 -23 -39 -3 -7 8 -18 15 -25 15 -7 0 -18 6 -25 14 -6 8 -18 12 -26 9 -19 -7 -44 15 -45 41 -1 16 -2 17 -6 4 -3 -11 -19 -20 -40 -24 -32 -6 -40 -3 -60 20 -13 15 -23 31 -23 37 0 25 46 -6 53 -36 4 -19 5 -19 6 1 1 17 10 23 36 28 42 8 40 16 -14 42 -23 10 -41 23 -41 27 0 5 10 23 22 40 18 26 19 29 4 17 -11 -8 -25 -28 -32 -45 -8 -19 -13 -23 -14 -12 0 9 16 34 36 55 20 20 33 31 29 25 -8 -17 6 -16 30 3 21 16 73 13 148 -8z m829 12 c20 -6 38 -17 41 -24 8 -21 -21 -40 -56 -38 -32 3 -64 22 -36 22 12 0 12 2 -1 10 -13 8 -13 10 2 10 9 0 18 -5 20 -11 3 -9 11 -9 34 0 l29 11 -28 -5 c-19 -4 -26 -2 -22 5 3 5 -1 10 -9 10 -8 0 -18 5 -21 10 -8 13 1 12 47 0z m-301 -43 c-12 -12 -64 -4 -68 10 -3 7 9 13 29 15 34 3 54 -10 39 -25z m619 3 c0 -5 -4 -10 -10 -10 -5 0 -10 5 -10 10 0 6 5 10 10 10 6 0 10 -4 10 -10z m-160 -10 c0 -5 -7 -7 -15 -4 -8 4 -15 8 -15 10 0 2 7 4 15 4 8 0 15 -4 15 -10z m-4 -21 c22 -18 22 -45 0 -47 -11 0 -26 -9 -33 -18 -16 -22 -17 -64 -2 -64 6 0 9 -6 6 -12 -2 -7 -1 -22 4 -34 6 -18 2 -24 -27 -38 -44 -20 -44 -20 -44 7 0 12 -9 30 -20 40 -38 32 -19 113 36 156 15 12 22 21 17 21 -15 0 -51 -38 -69 -72 -11 -21 -14 -45 -11 -71 5 -36 4 -38 -10 -24 -9 8 -18 36 -20 62 -3 42 -1 49 32 82 33 33 38 35 83 28 26 -4 52 -11 58 -16z m-666 -4 c-11 -13 -11 -18 0 -28 10 -10 11 -9 5 2 -6 11 -4 13 9 8 14 -6 17 -3 12 9 -5 12 -1 14 16 8 45 -14 90 -35 85 -40 -3 -3 -22 2 -42 10 -43 19 -45 19 -45 8 0 -5 17 -14 38 -21 35 -12 76 -51 53 -51 -5 0 -11 7 -15 15 -3 8 -11 15 -18 15 -9 0 -9 -3 2 -10 8 -5 12 -11 9 -15 -3 -3 -45 11 -93 31 l-86 37 27 18 c37 23 61 25 43 4z m493 -30 c-18 -38 -28 -38 -35 0 -6 30 -6 30 26 33 l26 2 -17 -35z m447 -5 c0 -51 -56 -123 -100 -127 -14 -2 -46 2 -72 8 -40 9 -48 15 -48 34 0 27 31 38 69 24 22 -9 29 -7 48 16 13 14 23 34 23 44 0 25 5 28 45 23 26 -3 35 -9 35 -22z m-846 -70 c22 -11 42 -17 45 -14 3 3 4 23 4 45 l-2 40 37 -3 c35 -3 37 -5 34 -33 -4 -26 -2 -28 12 -16 9 7 16 9 16 3 0 -13 -30 -26 -53 -23 -9 1 -24 -5 -33 -14 -16 -16 -107 -18 -97 -2 4 7 -1 9 -29 11 -7 1 -19 7 -27 14 -7 7 -20 11 -28 8 -9 -4 -11 -2 -7 6 5 8 2 9 -9 5 -10 -3 -17 -2 -17 3 0 5 -9 11 -19 15 -10 3 -21 14 -24 24 -4 17 5 15 77 -15 44 -19 99 -44 120 -54z m-599 58 c31 -14 33 -28 3 -24 -34 4 -59 17 -52 27 7 12 18 11 49 -3z m340 -22 c17 -12 14 -13 -24 -11 -28 2 -38 -1 -30 -6 10 -7 5 -8 -13 -5 -21 4 -26 1 -21 -11 4 -10 2 -14 -4 -10 -6 4 -14 1 -16 -5 -4 -9 -6 -8 -6 2 -1 23 13 40 39 45 12 2 25 7 28 10 9 9 27 6 47 -9z m910 3 c4 -6 0 -9 -11 -7 -21 4 -50 -41 -41 -64 9 -26 101 -51 155 -43 57 8 225 91 216 106 -4 8 -1 8 12 1 11 -5 26 -11 33 -14 8 -2 -33 -30 -91 -61 -94 -50 -110 -56 -134 -47 -15 6 -29 9 -31 6 -2 -2 10 -8 26 -14 36 -13 43 -37 9 -27 -13 4 -46 15 -75 26 l-52 18 -105 -50 c-104 -49 -106 -49 -141 -35 -20 9 -33 12 -31 7 3 -5 19 -14 36 -21 32 -13 41 -44 14 -54 -8 -3 -13 -2 -10 3 3 5 -8 14 -24 21 -27 11 -30 17 -30 57 0 27 6 51 16 60 8 9 13 22 10 30 -4 8 -1 11 5 7 6 -3 9 -19 5 -35 -3 -16 -2 -28 2 -28 20 3 33 -2 27 -11 -10 -17 28 -10 75 14 35 17 44 27 43 44 -3 23 6 28 23 13 5 -4 23 -11 39 -15 24 -4 20 -1 -16 17 -42 20 -45 24 -38 50 4 16 13 35 20 43 13 16 55 19 64 3z m305 -8 c0 -5 -37 -28 -81 -51 -76 -40 -80 -41 -63 -17 10 15 23 27 27 27 5 0 5 5 1 12 -4 6 -3 8 4 4 12 -7 92 15 92 26 0 5 5 8 10 8 6 0 10 -4 10 -9z m-1055 -45 c66 -32 69 -34 42 -41 -16 -4 -33 -3 -40 3 -18 15 -111 -29 -127 -59 -9 -15 -10 -45 -6 -90 6 -69 -4 -94 -27 -69 -9 10 -8 12 6 7 31 -11 18 0 -44 37 -62 37 -88 47 -53 21 10 -8 14 -15 7 -15 -20 0 -26 20 -30 99 -4 71 -3 78 21 100 39 36 99 39 164 6 30 -15 56 -25 58 -22 3 2 -11 12 -31 21 -34 17 -47 37 -22 35 6 0 44 -15 82 -33z m1145 15 c0 -13 -210 -124 -218 -116 -4 4 -2 9 3 12 6 2 55 28 110 58 114 62 105 58 105 46z m-1620 -46 c-16 -20 -10 -27 62 -70 56 -33 66 -36 96 -27 l33 11 -3 -37 c-3 -32 1 -39 36 -63 118 -79 139 -77 135 14 -2 36 0 62 6 62 6 0 9 -4 7 -8 -1 -5 2 -6 8 -2 23 14 48 -6 54 -45 4 -27 15 -46 39 -64 29 -23 31 -28 19 -47 -7 -11 -11 -24 -8 -27 3 -3 6 0 6 7 0 7 5 9 10 6 6 -4 8 -10 5 -15 -3 -5 0 -12 6 -16 7 -4 9 -3 5 4 -3 5 0 13 6 16 10 5 10 7 1 12 -15 7 -18 44 -3 44 18 0 32 -40 19 -56 -25 -30 4 -26 90 15 80 37 92 40 118 29 15 -7 35 -12 43 -12 8 -1 16 -9 18 -19 4 -21 -11 -22 -28 -2 -19 23 -32 19 -150 -40 -60 -30 -114 -55 -119 -55 -5 0 -79 43 -163 96 -84 53 -215 135 -290 182 -144 89 -156 106 -85 115 18 2 34 5 36 5 2 1 -2 -5 -9 -13z m50 -16 c0 -5 -4 -9 -10 -9 -5 0 -10 7 -10 16 0 8 5 12 10 9 6 -3 10 -10 10 -16z m45 -9 c-3 -4 17 -16 45 -26 53 -19 56 -29 11 -39 -21 -4 -42 3 -90 31 -34 20 -59 39 -57 42 3 3 12 -1 21 -8 12 -10 18 -10 30 0 10 9 15 9 16 1 1 -6 2 -16 3 -23 0 -6 8 -13 16 -15 9 -3 11 -1 5 4 -12 10 -16 55 -4 47 5 -3 7 -9 4 -14z m124 -195 c209 -131 281 -182 281 -196 0 -10 -3 -19 -7 -18 -5 0 -141 87 -303 192 -190 124 -296 199 -299 212 -3 18 -2 18 22 2 14 -9 151 -95 306 -192z m257 195 c9 0 7 -10 -11 -35 -13 -20 -25 -41 -27 -47 -5 -15 -68 18 -68 36 0 7 7 19 15 26 12 10 16 8 24 -13 15 -38 26 -39 26 -2 0 26 -3 31 -12 23 -9 -7 -13 -7 -13 0 0 13 21 22 38 16 8 -2 20 -4 28 -4z m314 -1 c12 -8 9 -9 -10 -4 -18 4 -14 0 12 -15 30 -16 37 -26 36 -45 -1 -14 -6 -24 -11 -22 -5 1 -7 6 -5 10 5 12 -31 29 -44 21 -7 -5 -8 -3 -3 6 6 10 3 12 -13 8 -12 -4 -20 -2 -16 3 3 5 0 9 -5 9 -21 0 -11 29 12 33 12 2 24 5 27 5 3 1 12 -3 20 -9z m252 -31 c5 -33 4 -34 -22 -8 -25 25 -26 39 -1 37 13 -1 21 -10 23 -29z m-1172 12 c-10 -6 -11 -12 -5 -18 6 -5 146 -100 313 -211 298 -198 303 -201 330 -187 l27 15 -35 -2 c-30 -1 -77 26 -327 193 -161 107 -291 196 -289 198 2 1 139 -85 304 -193 297 -193 342 -216 328 -163 -2 11 -2 18 1 14 3 -3 58 22 123 54 97 49 120 57 134 47 14 -10 -2 -21 -110 -75 -69 -35 -124 -65 -121 -68 2 -3 70 30 151 72 142 74 146 77 130 95 -9 11 -26 19 -36 19 -46 0 -87 39 -80 76 5 27 39 32 72 12 29 -18 54 1 60 46 5 37 6 38 53 41 48 3 49 3 42 -24 -3 -14 -6 -35 -6 -46 0 -22 -77 -107 -90 -99 -4 2 -10 0 -14 -6 -3 -6 4 -10 17 -10 23 0 77 -35 68 -43 -3 -2 -98 -54 -212 -114 l-207 -110 -341 235 c-337 233 -341 236 -313 248 34 15 54 17 33 4z m1421 -22 c32 -11 48 -24 49 -40 0 -7 -49 -36 -192 -113 -68 -35 -108 -52 -108 -43 0 7 65 47 145 88 79 41 142 76 140 78 -2 2 -69 -30 -149 -72 l-146 -77 -39 21 c-22 11 -44 20 -48 20 -4 -1 13 -12 40 -26 26 -13 47 -29 47 -34 0 -14 -2 -13 -64 14 l-54 24 15 35 c11 23 21 33 30 30 12 -5 12 -7 2 -14 -10 -6 -5 -11 14 -18 16 -6 33 -11 39 -11 22 0 247 123 242 132 -4 6 -9 6 -14 -1 -3 -7 -14 -9 -24 -5 -14 5 -15 9 -4 15 18 12 39 11 79 -3z m-1138 -245 l337 -233 163 86 c89 47 191 102 225 121 48 26 63 31 60 19 -4 -19 -438 -259 -438 -242 0 8 -3 8 -8 0 -7 -10 -648 436 -689 480 -28 30 -10 18 350 -231z m1067 221 c0 -2 -40 -24 -90 -49 -76 -38 -90 -42 -90 -27 0 21 135 92 162 84 10 -2 18 -6 18 -8z m-935 -104 c17 -11 26 -20 20 -20 -5 0 -23 9 -40 20 -16 11 -25 20 -20 20 6 0 24 -9 40 -20z m377 -43 c15 -12 9 -17 -48 -45 -71 -35 -82 -38 -66 -19 6 7 9 23 5 35 -4 18 -1 22 18 22 13 0 31 5 39 10 20 13 32 12 52 -3z"/>
                </g>
                <g transform="translate(0.0,5.0)" >
                    <rect x="0" y="0" width="150" height="20" />
                    <text x="5" y="12" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >ENERGY USAGE ={mPConsumption}kWhr</text>
                </g>
                <g transform="translate(0.0,25.0)" >
                    <rect x="0" y="0" width="150" height="20" />
                    <text x="5" y="12" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >TOTAL ENERGY = {mTotalEnergy}kW</text>
                </g>
            </svg>
        </div>
    )
}

// Set default props
CHILLER.defaultProps = {
  color: "black",
  handleComponetSelection: null
};
export default CHILLER