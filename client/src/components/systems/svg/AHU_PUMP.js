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

function AHU_PUMP ({ color, handleComponetSelection }) {
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
    const mEfficiency = '89,654'
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // --------------------------------------------
    return (
        <div style={{display:'flex',alignItems:'center'}}>
            <div style={{fontSize:'1.0rem',lineHeight:'1.2rem',color:'white',backgroundColor:'black'}}>
                <hr/>
                <p>AHU PUMPS</p>
                <hr/>
                <p style={{fontSize:'1.0rem',lineHeight:'1.0rem'}}>ELECTRIC POWER CONSUMPTION</p>
                <p style={{fontSize:'1.0rem',lineHeight:'1.0rem'}}>{mEfficiency}kWhr</p>
                <hr/>
            </div>
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300.0pt" height="162.0pt" viewBox="0 0 300 162" preserveAspectRatio="xMidYMid meet" >
                <g transform="translate(0.0,162.0) scale(0.10,-0.10)" fill={color} >    
                    <path d="M1650 1410 c0 -177 4 -167 -67 -161 -31 2 -58 -40 -43 -68 6 -12 17 -21 25 -21 7 0 21 -3 30 -6 15 -6 15 -4 4 14 -10 16 -17 18 -26 10 -16 -13 -30 18 -17 39 9 15 26 19 22 6 -2 -5 -6 -7 -10 -6 -5 2 -8 -7 -8 -20 1 -20 2 -21 14 -5 7 10 16 14 20 10 4 -4 6 -1 4 7 -2 7 2 15 7 17 9 3 14 -132 5 -146 -8 -14 -6 -130 3 -130 6 0 3 -6 -8 -13 -10 -8 -16 -18 -13 -23 4 -5 -8 -9 -26 -10 -41 -1 -84 -32 -88 -63 -2 -19 -14 -28 -56 -42 -48 -16 -56 -17 -69 -4 -8 8 -20 15 -26 15 -7 0 -19 5 -27 10 -13 9 -13 11 0 20 8 5 15 15 16 22 0 7 2 21 2 30 1 10 15 24 31 32 29 16 48 50 53 100 3 26 0 29 -25 30 -25 2 -27 -1 -21 -30 4 -21 1 -36 -11 -47 -28 -28 -38 -21 -31 23 4 25 2 40 -4 40 -5 0 -10 7 -10 15 0 8 -4 15 -8 15 -4 0 -8 9 -9 20 -1 11 2 18 7 15 4 -3 10 0 12 6 2 5 11 7 21 4 9 -4 14 -11 11 -16 -3 -5 -10 -7 -15 -4 -5 4 -9 1 -9 -5 0 -7 7 -9 17 -6 15 6 15 4 -2 -14 -10 -11 -13 -20 -6 -20 6 0 17 12 23 26 11 23 10 29 -11 45 -13 11 -20 19 -16 19 4 0 2 6 -4 14 -8 9 -10 31 -6 58 3 24 6 50 5 58 0 8 0 23 -1 34 0 15 -6 17 -37 12 -20 -3 -47 -6 -60 -6 -27 0 -44 -36 -30 -63 7 -13 17 -18 34 -14 18 3 24 1 20 -9 -3 -8 -1 -14 4 -14 11 0 14 -43 3 -54 -13 -13 -9 -106 5 -106 7 0 10 5 6 11 -4 7 1 10 11 7 10 -1 20 -9 23 -17 3 -10 0 -12 -12 -8 -10 4 -24 -1 -35 -12 -11 -11 -28 -22 -40 -26 -26 -8 -63 -54 -54 -69 3 -6 3 -8 -1 -5 -4 4 -33 -1 -65 -11 -50 -15 -60 -15 -77 -3 -12 9 -31 12 -51 8 -29 -5 -33 -3 -33 16 0 15 -4 19 -16 15 -9 -3 -24 -6 -35 -6 -11 0 -25 -13 -34 -30 -9 -17 -20 -28 -24 -25 -17 10 -69 -16 -75 -38 -6 -24 12 -104 25 -113 16 -10 9 -24 -11 -24 -13 0 -20 -7 -20 -19 0 -13 -10 -20 -31 -25 -50 -10 -32 -34 70 -93 l95 -54 101 35 c56 20 104 36 108 36 16 0 5 -28 -13 -33 -11 -3 -20 -12 -20 -20 0 -9 -15 -21 -35 -27 -72 -24 -48 -47 161 -161 l61 -34 130 61 129 61 16 -37 15 -38 -33 -16 c-19 -8 -34 -20 -34 -26 0 -5 -18 -19 -40 -30 -69 -35 -59 -47 138 -159 98 -56 182 -101 186 -101 4 0 129 82 277 182 178 120 269 188 269 199 0 11 -13 22 -35 29 -22 7 -35 18 -35 29 0 12 -13 22 -40 30 -41 12 -56 41 -22 41 25 0 34 10 22 25 -6 7 -4 21 6 39 10 21 11 32 3 42 -8 10 -5 26 15 66 14 28 26 59 26 68 0 16 18 60 41 104 7 12 7 16 0 12 -5 -4 -13 -1 -17 5 -4 7 -24 9 -59 4 -39 -4 -54 -3 -57 7 -4 10 5 12 38 9 44 -3 54 5 32 27 -9 9 -6 12 14 12 24 0 27 5 32 43 13 104 13 157 0 157 -10 0 -12 11 -9 43 14 110 34 342 30 345 -6 6 -14 -51 -25 -183 -17 -193 -20 -205 -42 -205 -16 0 -18 5 -14 33 10 63 28 315 24 328 -3 8 -10 -49 -17 -126 -17 -210 -21 -235 -36 -235 -32 0 -65 -20 -59 -35 6 -14 8 -14 19 1 10 15 12 9 11 -34 -1 -29 -3 -52 -6 -52 -16 0 -41 45 -36 64 3 13 -1 31 -9 42 -15 19 -16 18 -35 -5 -11 -13 -20 -33 -20 -46 0 -28 26 -53 41 -38 7 7 20 2 40 -18 31 -30 39 -73 14 -83 -8 -3 -15 -16 -15 -28 -1 -59 -8 -125 -15 -141 -4 -10 -2 -24 6 -34 13 -15 12 -15 -8 -5 -34 19 -97 15 -126 -8 -14 -11 -30 -20 -35 -20 -6 0 -8 -16 -5 -37 5 -37 3 -38 -41 -56 -35 -15 -49 -16 -66 -7 -12 6 -31 11 -43 10 -37 -3 -44 -1 -50 19 -3 11 -17 22 -36 26 -33 7 -42 31 -15 37 11 2 17 16 19 44 2 30 11 49 34 72 18 17 31 41 31 55 0 13 2 40 5 58 3 19 3 28 -1 22 -3 -7 -12 -13 -19 -13 -10 0 -12 9 -8 36 5 30 3 36 -15 40 -29 8 -41 53 -25 94 3 8 7 39 8 68 2 46 0 52 -17 52 -19 0 -20 7 -16 160 1 88 0 160 -4 160 -5 0 -8 -72 -8 -160z m-415 -128 c-3 -7 -5 -21 -5 -30 0 -14 -2 -14 -9 -3 -5 8 -7 21 -3 29 4 11 1 13 -7 8 -7 -5 -11 -17 -8 -27 3 -11 1 -17 -4 -13 -10 6 -12 37 -3 47 12 12 45 3 39 -11z m60 -17 c0 -14 -8 -21 -27 -23 -22 -3 -28 1 -28 16 0 25 10 33 35 30 12 -2 20 -10 20 -23z m-8 -46 c-14 -8 -22 -8 -30 0 -8 8 -3 11 19 11 25 -1 27 -2 11 -11z m397 -5 c10 -26 7 -34 -16 -44 -18 -7 -19 -9 -5 -9 27 -1 20 -21 -8 -21 -20 0 -25 6 -31 34 -3 19 -3 39 1 45 10 17 52 13 59 -5z m-407 -56 c-3 -7 -5 -2 -5 12 0 14 2 19 5 13 2 -7 2 -19 0 -25z m793 -24 c0 -8 -4 -12 -10 -9 -5 3 -10 0 -10 -9 0 -8 5 -16 12 -18 9 -3 9 -6 0 -12 -7 -4 -12 -2 -12 4 0 6 -4 8 -10 5 -13 -8 -13 -2 2 30 13 28 28 33 28 9z m170 4 c0 -5 -10 -6 -22 -2 -20 6 -21 5 -9 -9 9 -12 11 -26 5 -44 -4 -16 -8 -35 -8 -43 -1 -10 -13 -16 -36 -17 l-35 -1 35 8 35 7 -35 3 c-30 2 -31 3 -10 8 l25 5 -25 6 c-26 7 -36 31 -24 59 4 9 6 21 5 25 -1 4 21 7 49 6 27 -2 50 -7 50 -11z m-945 -8 c-3 -5 -15 -10 -26 -10 -11 0 -17 5 -14 10 3 6 15 10 26 10 11 0 17 -4 14 -10z m365 -40 c0 -16 -4 -30 -10 -30 -5 0 -10 14 -10 30 0 17 5 30 10 30 6 0 10 -13 10 -30z m-390 4 c0 -8 -4 -12 -10 -9 -5 3 -10 10 -10 16 0 5 5 9 10 9 6 0 10 -7 10 -16z m405 -53 c-3 -5 5 -11 17 -13 12 -2 23 -9 26 -16 3 -11 -3 -10 -26 2 -17 9 -38 16 -46 16 -8 0 -18 5 -21 10 -4 6 7 10 25 10 17 0 29 -4 25 -9z m555 -16 c0 -8 -4 -15 -10 -15 -5 0 -7 7 -4 15 4 8 8 15 10 15 2 0 4 -7 4 -15z m-944 -8 c4 -4 0 -7 -9 -7 -9 0 -18 4 -21 9 -7 10 20 9 30 -2z m364 -17 c0 -13 -5 -18 -15 -14 -8 4 -15 12 -15 20 0 8 7 14 15 14 8 0 15 -9 15 -20z m40 -7 c0 -9 6 -13 14 -10 10 4 13 1 9 -9 -3 -8 -12 -13 -20 -10 -8 3 -17 6 -19 6 -3 0 -3 4 1 9 3 5 1 12 -5 16 -16 10 -12 25 5 19 8 -4 15 -13 15 -21z m-329 -36 l-20 -21 17 36 c10 21 18 29 20 20 2 -8 -5 -24 -17 -35z m817 23 c-2 -22 -7 -30 -21 -30 -13 0 -17 5 -13 16 3 9 6 22 6 30 0 8 7 14 15 14 11 0 15 -9 13 -30z m-928 0 c0 -15 7 -20 26 -20 21 0 25 -4 21 -20 -3 -11 0 -20 6 -21 8 0 8 -2 -1 -6 -6 -2 -9 -9 -6 -15 3 -5 -2 -25 -12 -44 -17 -30 -17 -36 -4 -44 9 -6 10 -10 3 -10 -19 0 -35 38 -25 56 14 25 -4 86 -32 111 -22 19 -23 22 -8 26 30 8 32 7 32 -13z m47 5 c0 -8 -9 -15 -19 -15 -10 0 -18 7 -18 15 0 8 8 15 18 15 10 0 19 -7 19 -15z m923 5 c0 -5 -4 -10 -10 -10 -5 0 -10 5 -10 10 0 6 5 10 10 10 6 0 10 -4 10 -10z m-1030 -20 c0 -5 -5 -10 -11 -10 -5 0 -7 5 -4 10 3 6 8 10 11 10 2 0 4 -4 4 -10z m33 -7 c4 -3 -5 -12 -19 -20 -31 -16 -44 -17 -44 -3 0 6 9 10 20 10 11 0 20 5 20 10 0 11 13 13 23 3z m437 -3 c0 -6 7 -10 16 -8 27 5 39 -25 25 -61 -8 -17 -17 -28 -22 -25 -5 3 -4 14 2 25 15 28 4 49 -25 49 -13 0 -26 7 -30 15 -4 10 1 15 14 15 11 0 20 -5 20 -10z m-750 -30 c0 -10 -41 -30 -61 -30 -16 0 1 21 25 30 29 12 36 12 36 0z m340 -12 c0 -5 -6 -16 -14 -23 -12 -12 -16 -11 -30 8 -13 18 -14 19 -9 3 5 -15 3 -18 -10 -13 -10 4 -17 1 -17 -6 0 -8 -4 -6 -10 3 -14 21 -12 30 3 24 8 -3 19 1 25 9 13 15 62 11 62 -5z m394 4 c5 10 7 10 12 0 3 -6 11 -9 17 -6 9 5 9 4 1 -5 -15 -16 -56 -10 -62 9 -4 13 -3 13 10 2 13 -10 17 -10 22 0z m96 -2 c0 -22 -29 -80 -40 -80 -7 0 -5 9 4 22 9 12 16 33 16 45 0 13 5 23 10 23 6 0 10 -5 10 -10z m-602 -12 c15 -19 21 -116 8 -131 -19 -24 -90 -39 -123 -26 -26 10 -26 12 -8 19 12 4 23 3 28 -4 4 -6 6 -3 5 9 -5 65 0 74 47 86 25 6 44 14 41 16 -2 2 -23 -1 -46 -7 -26 -7 -45 -8 -49 -2 -3 5 -15 6 -26 1 -20 -8 -20 -8 0 -9 30 -1 2 -15 -63 -30 -29 -7 -51 -14 -49 -17 3 -2 33 3 67 12 34 9 65 14 68 11 3 -3 -3 -6 -14 -7 -18 0 -18 -1 1 -9 20 -9 20 -9 0 -9 -17 -1 -18 -3 -5 -12 13 -9 13 -10 0 -6 -8 2 -14 10 -12 16 3 14 1 14 -53 0 -31 -8 -42 -15 -40 -27 3 -23 -13 -42 -31 -35 -8 3 -14 0 -14 -6 0 -6 -4 -11 -10 -11 -5 0 -10 12 -10 28 0 28 -37 118 -45 110 -3 -2 4 -22 15 -43 22 -44 21 -51 -9 -35 -15 8 -21 20 -21 46 0 73 59 48 80 -34 8 -33 14 -42 20 -32 6 9 5 17 -3 22 -7 4 -8 8 -4 8 5 0 -2 20 -16 44 l-25 44 26 7 c14 3 30 1 35 -4 6 -6 20 -11 32 -10 20 0 20 0 0 9 -14 7 -9 8 20 5 30 -4 35 -3 20 4 -14 7 -15 10 -5 10 8 0 21 -3 29 -8 20 -13 -56 -33 -100 -26 -29 4 -30 3 -9 -4 20 -7 21 -9 6 -10 -11 -1 -17 -3 -14 -6 6 -7 140 25 148 35 4 5 59 22 91 29 4 0 11 -5 17 -11z m1086 -4 c9 -3 16 -10 16 -15 0 -14 -28 -11 -34 4 -3 6 -3 1 0 -13 4 -14 11 -26 15 -28 14 -6 11 -19 -6 -26 -8 -3 -21 1 -29 10 -12 11 -13 21 -4 44 10 31 16 34 42 24z m-52 -26 c-6 -26 -52 -24 -52 2 0 16 6 20 29 18 22 -2 27 -6 23 -20z m-562 -7 c0 -20 22 -33 43 -25 10 3 13 -10 13 -55 0 -33 -2 -58 -5 -56 -2 3 -9 -2 -16 -11 -6 -9 -28 -17 -53 -18 -23 -1 -48 -8 -55 -16 -10 -11 -8 -12 8 -5 36 13 88 11 93 -4 3 -8 0 -11 -7 -7 -6 4 -11 2 -11 -5 0 -8 -4 -8 -15 1 -13 11 -36 7 -24 -4 16 -14 49 -15 63 0 10 9 20 14 23 11 6 -7 -23 -39 -32 -35 -6 4 -65 -51 -65 -61 0 -15 -97 -69 -217 -121 l-121 -52 -91 48 c-62 33 -91 54 -91 66 0 10 2 18 5 18 3 0 41 -18 85 -40 52 -26 80 -46 81 -58 1 -15 2 -15 6 0 2 9 21 23 41 32 20 8 32 15 25 15 -7 1 -24 -4 -38 -11 -22 -10 -34 -7 -100 28 -41 21 -75 45 -75 52 0 17 6 15 40 -9 l28 -22 64 32 63 31 3 -40 c4 -47 25 -57 77 -39 37 14 48 45 20 55 -25 10 -17 25 10 18 15 -4 43 3 78 19 50 23 55 28 59 63 3 22 4 41 2 43 -9 10 -18 -12 -18 -43 0 -31 -4 -34 -57 -55 -46 -17 -62 -20 -78 -11 -18 9 -21 8 -21 -7 0 -11 -12 -23 -29 -30 -27 -10 -29 -9 -34 15 -6 29 8 72 22 72 5 0 16 3 25 6 12 4 16 0 16 -16 0 -16 4 -20 19 -15 13 4 21 0 25 -12 4 -15 4 -15 3 2 0 11 2 32 6 46 6 23 0 57 -17 100 -5 12 5 18 45 28 82 21 100 -23 19 -48 -23 -7 -40 -14 -38 -17 3 -2 24 3 48 11 23 8 46 12 51 9 5 -2 18 0 29 6 11 6 25 8 32 4 14 -9 -31 -33 -51 -27 -11 3 -10 1 2 -7 14 -9 22 -9 33 1 11 9 18 9 26 1 17 -17 48 14 48 47 0 38 -36 90 -73 106 l-32 14 43 1 c35 0 42 -3 42 -19z m57 4 c0 -9 -10 -15 -24 -15 -14 0 -23 6 -23 15 0 9 9 15 23 15 14 0 24 -6 24 -15z m-447 -3 c0 -4 -13 -13 -30 -19 -22 -8 -29 -8 -27 0 3 19 57 37 57 19z m32 -8 c-10 -19 -72 -48 -72 -34 0 4 13 11 30 15 16 4 29 10 29 13 -2 15 1 22 11 22 7 0 8 -6 2 -16z m-472 -24 c0 -31 -16 -41 -26 -15 -8 19 2 45 16 45 5 0 10 -13 10 -30z m760 20 c0 -5 -7 -10 -15 -10 -8 0 -15 5 -15 10 0 6 7 10 15 10 8 0 15 -4 15 -10z m50 -19 c0 -4 -3 -10 -6 -14 -8 -7 -33 16 -28 25 6 9 34 -1 34 -11z m-33 -16 c12 -8 28 -12 37 -9 19 7 22 -26 4 -44 -9 -9 -8 -12 5 -12 10 0 14 -5 11 -15 -8 -19 -24 -20 -24 0 0 7 -6 18 -12 22 -7 4 -18 17 -24 28 -9 15 -20 19 -45 17 -32 -2 -33 -2 -15 13 25 19 36 19 63 0z m622 1 c9 -11 8 -15 -5 -20 -25 -10 -41 -6 -19 5 16 7 13 8 -12 4 -25 -3 -33 -1 -33 10 0 19 53 20 69 1z m-931 -19 c9 -11 1 -17 -38 -29 -49 -16 -49 -16 -39 4 9 16 39 35 60 37 4 1 11 -5 17 -12z m-405 -63 c2 -13 1 -21 -4 -19 -4 3 -10 1 -14 -5 -11 -18 -25 0 -26 33 l-1 32 -7 -29 -6 -29 -17 37 c-10 20 -18 39 -18 41 0 3 20 -5 44 -17 29 -14 46 -29 49 -44z m157 -4 c3 1 16 -1 30 -5 23 -5 25 -10 22 -44 l-4 -38 -87 -28 -86 -27 -68 37 c-37 20 -67 43 -67 51 0 19 2 18 70 -16 38 -19 60 -37 61 -48 0 -13 2 -12 9 6 5 12 18 22 29 22 11 0 23 5 26 10 8 13 5 12 -33 -1 -26 -9 -38 -6 -81 16 -50 25 -75 55 -27 34 18 -9 33 -6 71 11 50 23 64 18 65 -21 0 -9 7 -20 17 -23 22 -9 83 12 83 29 0 12 -5 12 -33 0 -43 -18 -57 -7 -60 45 -2 39 1 44 23 50 22 5 26 3 30 -27 3 -19 7 -33 10 -33z m543 53 c3 7 6 4 6 -7 1 -12 -4 -16 -13 -13 -8 3 -16 1 -19 -6 -2 -6 -6 -2 -9 11 -5 18 -3 20 12 12 13 -7 20 -6 23 3z m647 -10 c0 -27 -36 -73 -57 -73 -36 0 -31 40 5 41 17 1 20 3 9 6 -9 2 -15 8 -12 13 3 4 -3 6 -13 3 -11 -3 -19 1 -19 9 0 9 14 13 44 13 26 0 43 -5 43 -12z m-851 -7 c19 -7 31 -15 25 -18 -23 -13 -146 -49 -151 -44 -3 3 0 8 8 11 8 3 39 14 69 25 30 11 43 18 28 15 -35 -7 -65 4 -46 16 17 11 25 10 67 -5z m-74 -16 c13 -6 15 -9 5 -9 -8 -1 -27 -8 -42 -15 -15 -8 -30 -11 -33 -6 -3 4 -2 10 2 13 5 2 2 2 -4 1 -7 -2 -13 1 -13 7 0 7 13 9 38 5 27 -5 33 -4 22 3 -18 13 -3 13 25 1z m827 -16 c4 -3 8 -14 8 -24 0 -19 32 -36 49 -25 6 3 9 -17 7 -50 -5 -79 -60 -136 -84 -87 -12 21 -5 42 14 42 15 0 19 -20 7 -36 -5 -5 0 -1 10 9 9 11 17 28 17 39 0 48 -58 115 -108 124 -25 5 -30 9 -20 16 12 8 82 3 100 -8z m-920 -5 c44 -24 75 -143 43 -169 -13 -11 -15 -7 -15 29 0 45 -19 92 -53 129 -22 24 -10 30 25 11z m212 -5 c3 -9 6 -17 6 -18 0 -2 -34 -16 -76 -31 -63 -23 -78 -25 -85 -14 -15 24 -11 27 64 52 88 31 84 30 91 11z m-265 -66 c1 -14 -3 -15 -29 -5 -36 14 -39 40 -7 62 21 15 22 14 28 -12 4 -16 7 -35 8 -45z m56 -5 c20 -41 16 -48 -19 -32 -19 9 -26 20 -26 40 0 15 -3 36 -7 46 -6 17 -6 17 15 0 11 -11 28 -35 37 -54z m840 57 c4 -6 10 -8 15 -5 4 3 19 -4 31 -15 34 -27 1 -27 -35 1 -14 11 -26 15 -26 9 0 -6 -8 -10 -17 -8 -10 2 -26 -6 -35 -17 -14 -17 -17 -17 -18 -4 0 31 70 63 85 39z m-628 -41 c2 -17 -2 -20 -21 -15 -30 8 -86 -12 -86 -30 0 -8 -5 -14 -11 -14 -5 0 -8 -4 -5 -9 3 -5 -1 -11 -9 -15 -11 -4 -15 2 -15 23 0 26 6 31 68 54 82 32 77 31 79 6z m641 0 c18 -6 29 -15 26 -21 -4 -6 2 -6 14 1 17 9 22 8 27 -10 4 -11 5 -22 3 -23 -53 -37 -56 -43 -44 -67 6 -13 20 -25 31 -27 30 -6 41 -20 26 -34 -10 -11 -11 -9 -6 7 6 18 5 18 -5 3 -12 -20 -40 -24 -40 -7 0 5 5 7 11 3 8 -4 8 0 0 15 -7 11 -21 21 -31 21 -11 0 -20 5 -20 11 0 5 -4 7 -10 4 -20 -12 -9 -25 20 -25 17 0 30 -4 30 -10 0 -5 -4 -10 -10 -10 -22 0 -8 -19 20 -29 26 -8 34 -7 49 8 15 15 21 16 36 5 16 -12 15 -15 -16 -33 -19 -11 -81 -49 -139 -85 -92 -57 -106 -62 -112 -47 -3 10 -13 21 -22 24 -21 8 -20 27 2 27 9 0 41 14 70 30 48 28 52 34 53 68 3 96 3 96 34 111 16 8 24 16 17 19 -6 2 -12 10 -12 17 0 8 -4 17 -10 20 -7 4 -7 -3 0 -19 5 -14 7 -26 4 -26 -11 0 -21 46 -13 56 6 8 4 14 -6 18 -9 3 -14 2 -11 -3 6 -9 -43 -26 -51 -18 -6 7 27 37 41 37 7 0 27 -5 44 -11z m-1228 -51 l78 -43 68 22 c37 13 70 21 72 19 2 -2 -32 -16 -76 -30 l-79 -27 -72 41 c-40 23 -75 39 -78 36 -3 -2 21 -18 53 -35 61 -30 105 -60 91 -61 -12 0 -150 79 -167 96 -13 13 -13 14 3 8 10 -3 17 -1 17 5 0 16 5 15 90 -31z m294 22 c22 -8 26 -15 26 -52 l0 -43 -20 25 c-18 24 -43 80 -35 80 2 0 15 -4 29 -10z m615 -14 c18 -22 -23 -43 -47 -25 -14 11 -15 11 -5 -1 11 -11 6 -16 -24 -26 -21 -7 -39 -11 -42 -9 -6 7 48 55 73 65 29 12 32 12 45 -4z m249 -2 c32 -22 27 -39 -21 -66 l-42 -24 -22 33 -21 32 36 19 c47 25 44 25 70 6z m-900 -10 c-2 -11 -36 -28 -96 -49 -51 -18 -91 -27 -89 -22 2 6 43 24 91 40 61 20 84 32 75 38 -11 7 -10 9 4 9 12 0 17 -6 15 -16z m937 -5 c10 -30 2 -32 -12 -3 -6 13 -7 24 -3 24 5 0 12 -9 15 -21z m-830 -1 c36 -16 30 -62 -8 -66 -25 -3 -27 -1 -27 37 0 46 -1 45 35 29z m619 -16 c-20 -15 -15 -15 31 4 8 3 15 2 15 -4 0 -5 -32 -24 -71 -41 -61 -27 -72 -30 -89 -18 -11 8 -17 17 -13 21 4 4 0 4 -9 1 -14 -6 -11 -12 19 -38 58 -51 80 -130 48 -173 -14 -18 -14 -18 -16 6 -1 14 -1 29 0 34 9 44 -84 167 -112 149 -8 -5 -5 -9 8 -11 23 -3 67 -61 83 -109 6 -18 9 -33 7 -33 -3 0 -25 10 -51 22 l-46 23 7 42 c4 26 2 43 -4 43 -5 0 -11 -18 -13 -39 l-3 -39 -37 15 c-21 8 -38 22 -38 30 0 23 50 62 89 69 20 4 53 15 73 25 20 10 45 16 54 12 12 -4 15 -3 10 5 -5 8 -1 10 10 5 10 -3 15 -2 12 3 -3 5 8 10 25 10 29 1 30 1 11 -14z m80 -28 c10 -27 8 -29 -64 -64 -38 -18 -68 -35 -66 -37 2 -3 36 12 74 31 40 20 74 32 77 26 3 -5 -29 -27 -72 -49 -43 -22 -75 -40 -70 -41 4 0 39 16 77 35 39 19 70 31 70 27 0 -5 -11 -15 -25 -22 -22 -12 -25 -20 -25 -66 0 -45 -4 -55 -27 -74 l-28 -21 32 15 c29 15 63 13 63 -3 0 -4 -14 -15 -31 -25 -26 -15 -35 -16 -54 -6 -21 11 -23 18 -18 62 5 42 4 48 -11 42 -9 -3 -13 -10 -10 -15 3 -5 0 -9 -5 -9 -26 0 -7 29 29 45 23 10 43 23 47 27 3 5 -14 0 -37 -12 -23 -12 -43 -20 -44 -18 -16 21 -47 103 -40 105 5 2 36 16 69 32 70 35 81 36 89 15z m112 -109 c-3 -13 -26 -33 -55 -48 -58 -32 -71 -33 -71 -7 0 20 14 27 23 13 2 -5 2 -3 1 4 -2 6 4 17 12 23 8 7 14 30 14 51 0 34 4 41 38 58 l37 19 3 -46 c2 -25 1 -55 -2 -67z m-603 84 c-5 -5 -23 -12 -41 -15 -40 -8 -43 10 -4 24 30 10 58 4 45 -9z m-328 -48 c6 -11 173 -101 187 -101 5 0 46 16 91 36 159 70 169 74 165 63 -2 -7 -62 -38 -133 -70 l-129 -58 -45 24 c-25 13 -75 39 -110 59 -35 20 -66 35 -68 32 -2 -2 38 -27 89 -54 102 -56 136 -78 128 -85 -3 -3 -54 24 -115 59 -60 35 -114 65 -120 68 -12 4 24 35 42 36 6 0 14 -4 18 -9z m845 -26 c0 -2 -10 -10 -22 -16 -21 -11 -22 -11 -9 4 13 16 31 23 31 12z m310 -14 c0 -14 -62 -59 -230 -165 -126 -80 -232 -146 -235 -146 -3 0 -5 11 -5 24 0 17 11 31 35 46 46 29 45 38 -1 11 l-36 -21 -119 62 c-100 53 -117 65 -105 76 11 12 20 9 56 -17 24 -17 54 -31 67 -31 30 0 72 21 97 49 30 33 42 26 38 -21 -3 -38 0 -45 25 -59 29 -16 29 -15 213 97 102 62 188 113 193 113 4 1 7 -8 7 -18z m-710 4 c0 -3 -29 -19 -65 -35 -36 -17 -95 -43 -131 -60 -36 -16 -64 -24 -62 -18 3 7 56 36 119 65 108 49 139 60 139 48z m55 -22 c33 -16 35 -19 35 -66 0 -44 -2 -48 -16 -36 -14 11 -64 100 -64 114 0 8 7 6 45 -12z m712 -39 c-18 -17 -504 -344 -511 -344 -26 0 27 40 249 186 140 92 253 169 251 171 -2 2 -118 -71 -257 -163 l-254 -167 -40 23 c-22 12 -98 54 -169 93 l-129 70 24 18 c23 17 24 17 31 -1 4 -10 66 -49 141 -89 l135 -71 239 151 c131 83 240 155 241 160 2 5 17 1 33 -8 23 -14 26 -20 16 -29z m-612 -7 c41 -22 49 -43 28 -68 -10 -12 -29 -15 -75 -10 -5 1 -8 24 -8 51 0 28 3 50 8 50 4 -1 25 -11 47 -23z m-51 -129 c118 -58 124 -64 128 -95 l4 -32 -61 33 c-33 18 -93 50 -132 72 -58 30 -73 43 -73 61 0 13 2 23 5 23 3 0 61 -28 129 -62z m14 -123 c67 -37 122 -73 122 -81 0 -8 -45 13 -117 53 -65 37 -142 81 -172 97 -30 17 -56 37 -59 45 -3 9 15 4 49 -16 30 -16 109 -60 177 -98z"/>
                </g>
                <g transform="translate(0.0,5.0)" >
                    <rect x="0" y="0" width="150" height="20" />
                    <text x="5" y="12" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >ENERGY USAGE ={mPConsumption}kWhr</text>
                </g>
                <g transform="translate(0.0,25.0)" >
                    <rect x="0" y="0" width="150" height="20" />
                    <text x="5" y="12" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >TOTAL ENERGY = {mTotalEnergy}kW</text>
                </g>            </svg>
        </div>

    )
}

// Set default props
AHU_PUMP.defaultProps = {
  color: "black",
  handleComponetSelection: null
};
export default AHU_PUMP