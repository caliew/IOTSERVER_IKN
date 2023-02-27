import React from 'react'

import { 
  AHU_A_TEMP1,AHU_A_TEMP2,
  AHU_B_TEMP1,AHU_B_TEMP2
} from '../../types';

// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function AHU({ color, sensorsData, handleComponetSelection }) {
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // --------------------------------------------
    return (
        <div style={{display:'flex',alignItems:'center'}}>
            <div style={{fontSize:'1.0rem',lineHeight:'1.2rem',color:'white',backgroundColor:'black'}}>
                <hr/>
                <p>AIR HANDLING UNITS (AHU)</p>
                <hr/>
                <p>AHU A EFFICIENCY --- %</p>
                <p>AHU B EFFICIENCY --- %</p>
                <hr/>
            </div>          
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300" height="162" viewBox="0 0 300 162" preserveAspectRatio="xMidYMid meet" >

                <g transform="translate(0.0,162.0) scale(.10,-0.10)" fill={color} >
                <path d="M88 1593 c-33 -3 -48 -9 -48 -18 0 -12 10 -70 26 -142 3 -18 0 -23 -15 -23 -12 0 -18 -5 -16 -12 11 -29 21 -138 13 -138 -4 0 -8 -9 -8 -20 0 -12 9 -22 24 -26 32 -8 49 3 43 27 -4 15 0 19 19 19 22 0 31 18 25 53 0 4 0 7 2 7 1 1 64 7 141 14 l138 12 147 -33 c80 -19 159 -37 175 -41 22 -6 -8 -12 -115 -26 -79 -10 -146 -22 -148 -28 -2 -5 -10 0 -18 11 -11 16 -21 20 -41 15 -21 -4 -24 -3 -12 5 13 9 13 11 -2 11 -28 0 -31 -19 -3 -26 20 -5 25 -13 26 -38 0 -17 4 -49 9 -71 7 -32 8 -27 4 28 -3 39 -2 67 4 67 14 0 24 -94 12 -124 -5 -15 -10 -37 -9 -49 1 -20 2 -20 8 3 5 17 9 21 15 12 4 -6 4 -16 1 -22 -3 -5 0 -10 7 -11 13 -1 -12 -10 -65 -23 -25 -6 -27 -5 -15 13 9 14 9 23 1 33 -6 7 -14 36 -18 63 -4 28 -9 58 -12 68 -2 9 0 17 5 17 6 0 13 -33 18 -72 4 -40 9 -65 12 -55 4 20 -14 146 -23 155 -3 3 -11 0 -17 -6 -7 -7 -24 -12 -38 -12 -35 0 -40 -6 -30 -41 12 -40 2 -37 -16 6 -20 48 -18 56 11 49 35 -9 76 3 69 20 -3 9 6 17 25 24 17 6 31 15 31 20 0 18 -26 31 -49 25 -18 -4 -21 -11 -17 -29 5 -18 2 -24 -9 -24 -9 0 -13 5 -10 10 3 6 2 10 -4 10 -5 0 -13 -5 -16 -10 -4 -6 -11 -8 -16 -5 -5 3 -6 -1 -3 -9 4 -10 -4 -16 -26 -21 -17 -4 -34 -5 -37 -2 -9 10 8 27 28 27 35 0 19 16 -33 33 -29 9 -53 15 -54 14 -1 -1 5 -43 13 -94 l16 -91 56 4 c41 3 49 1 31 -5 -23 -8 -23 -9 -4 -10 28 -1 41 -31 14 -31 -11 0 -20 -4 -20 -10 0 -5 -5 -10 -11 -10 -5 0 -8 4 -5 9 8 12 -20 22 -39 15 -8 -4 -15 -3 -15 0 0 4 10 11 23 16 20 8 19 9 -11 9 -37 1 -37 0 -53 100 -9 57 -14 70 -21 57 -6 -10 -7 -39 -2 -69 5 -40 9 -47 15 -32 6 16 8 17 8 3 1 -9 -3 -19 -8 -22 -15 -10 -79 22 -84 41 -4 15 -5 14 -6 -3 -1 -17 10 -26 54 -44 31 -12 55 -29 55 -37 0 -7 29 -27 66 -43 72 -33 84 -36 66 -18 -17 17 -15 28 6 28 14 0 15 -2 2 -10 -13 -9 -8 -14 11 -12 4 1 5 -8 2 -18 -4 -14 0 -20 10 -20 8 0 45 -13 82 -30 37 -16 78 -30 91 -30 14 0 43 -10 66 -21 42 -21 75 -22 160 -3 24 6 27 3 30 -27 3 -32 6 -34 138 -89 106 -45 136 -62 138 -78 2 -11 9 -25 15 -30 7 -5 131 -62 277 -127 146 -64 272 -125 280 -136 9 -11 26 -18 40 -17 14 1 98 -31 188 -71 120 -54 167 -70 176 -62 9 8 82 -19 277 -104 l264 -114 134 133 133 133 44 218 c24 120 42 220 40 222 -2 3 -123 32 -267 65 -152 35 -268 66 -274 74 -15 21 -981 232 -1021 224 -18 -4 -61 -1 -101 9 l-71 15 -6 66 c-3 36 -6 106 -6 155 0 134 1 131 -83 138 -40 4 -128 3 -196 0 l-123 -6 6 -86 c4 -47 9 -106 13 -130 l6 -43 -24 15 c-30 19 -339 85 -397 85 -23 -1 -45 2 -49 5 -3 4 -13 56 -21 116 -14 95 -19 111 -37 115 -21 6 -104 5 -187 -1z m211 -106 c6 -51 14 -103 17 -114 5 -20 0 -21 -79 -28 -103 -9 -143 -1 -151 28 -3 12 0 25 7 29 9 6 9 8 0 8 -6 0 -17 26 -23 58 -6 31 -13 69 -16 85 l-6 27 119 0 120 0 12 -93z m625 -30 c8 -65 27 -340 23 -343 -2 -2 -25 3 -52 12 -27 8 -55 12 -61 10 -8 -3 -13 11 -16 40 -3 43 -2 44 27 46 l30 1 -31 4 -31 4 -12 127 c-6 70 -11 132 -11 137 0 6 26 9 64 7 l65 -4 5 -41z m240 -9 c6 -66 16 -298 13 -298 -1 0 -49 -9 -106 -20 -58 -11 -106 -19 -107 -17 -2 1 -7 70 -13 152 -6 83 -13 169 -16 192 l-5 42 88 4 c48 1 99 4 114 5 25 2 27 0 32 -60z m-1090 -64 c9 -22 8 -24 -9 -24 -8 0 -15 9 -15 20 0 24 15 27 24 4z m59 -61 c4 -2 7 -15 7 -27 0 -18 -7 -25 -32 -30 -17 -3 -32 -5 -33 -4 -1 2 -5 20 -9 41 l-7 39 33 -7 c18 -4 36 -9 41 -12z m282 -33 c4 -6 -5 -10 -19 -10 -14 0 -26 5 -26 10 0 6 9 10 19 10 11 0 23 -4 26 -10z m-71 -36 c22 -8 20 -19 -2 -21 -10 -1 -19 5 -19 13 0 16 0 16 21 8z m-246 -16 c-6 -18 -28 -21 -28 -4 0 9 7 16 16 16 9 0 14 -5 12 -12z m665 -32 c28 1 38 -3 43 -18 3 -11 3 -22 0 -25 -3 -4 -6 1 -6 10 0 11 -8 17 -22 17 -29 0 -139 -18 -145 -23 -2 -3 3 -58 11 -123 8 -66 14 -120 13 -121 -1 0 -35 13 -74 29 -52 22 -73 36 -73 49 0 9 -3 24 -6 32 -4 12 3 14 40 10 44 -5 46 -4 46 19 0 32 -18 47 -63 55 -31 5 -36 9 -40 42 -2 20 -3 38 -1 40 2 2 32 -5 67 -16 48 -15 66 -17 74 -8 8 9 -1 15 -39 24 -27 6 -55 8 -61 5 -8 -5 -7 -2 1 7 6 7 51 18 100 24 83 10 87 9 93 -10 4 -16 13 -20 42 -19z m37 30 c0 -15 -21 -26 -51 -26 -11 0 -19 7 -19 18 0 12 9 18 35 19 24 2 35 -1 35 -11z m-633 -18 c-3 -8 -6 -5 -6 6 -1 11 2 17 5 13 3 -3 4 -12 1 -19z m99 -30 c4 -12 1 -24 -7 -29 -19 -12 -29 -1 -29 31 0 22 4 28 15 24 8 -3 17 -15 21 -26z m108 -15 c3 -16 8 -49 12 -75 6 -43 4 -48 -12 -48 -22 0 -39 35 -49 97 -6 41 -4 45 37 52 3 0 9 -11 12 -26z m384 -29 c-11 -11 -13 -28 -8 -64 7 -54 9 -52 -56 -65 l-31 -6 -2 62 c-1 35 -3 67 -4 73 -3 12 107 35 112 23 2 -5 -3 -15 -11 -23z m46 -16 c-2 -13 -4 -55 -5 -95 -1 -62 -3 -71 -18 -65 -14 5 -14 4 -2 -11 9 -12 10 -17 2 -17 -18 0 -25 31 -12 52 8 13 10 39 5 80 -5 46 -4 62 7 69 22 14 28 11 23 -13z m451 11 l40 -12 -115 -24 c-133 -28 -144 -29 -187 -19 l-32 7 9 -33 c4 -18 11 -86 15 -150 l6 -118 -80 35 c-116 49 -121 53 -121 81 0 14 4 22 10 19 6 -4 10 6 10 23 0 21 6 31 20 35 16 4 20 0 20 -18 0 -14 -7 -25 -17 -28 -13 -3 -12 -5 5 -6 20 -1 23 3 20 32 -2 26 -7 32 -25 31 -20 0 -21 4 -20 57 1 32 5 60 9 64 4 4 31 0 61 -9 51 -15 60 -14 176 8 68 14 125 27 129 30 8 9 22 7 67 -5z m622 -111 c255 -56 463 -105 463 -108 0 -4 -64 -34 -142 -68 l-143 -61 -240 70 c-440 127 -624 177 -560 149 41 -17 -17 -11 -84 10 -36 11 -67 18 -69 15 -7 -7 10 -285 18 -285 4 0 25 6 46 13 63 22 94 28 94 18 0 -5 -30 -19 -67 -32 -38 -12 -73 -24 -80 -26 -8 -3 -13 12 -16 44 l-3 48 -2 -51 -2 -51 170 -72 c94 -40 170 -77 170 -82 0 -4 -51 15 -112 42 -62 28 -140 62 -173 76 -33 14 -63 30 -66 35 -4 6 -10 80 -13 166 -4 87 -10 166 -13 176 -4 15 -2 18 13 12 9 -4 20 -3 23 2 7 10 248 60 295 61 17 1 238 -45 493 -101z m-1328 71 c32 -11 45 -49 16 -49 -8 0 -15 6 -15 13 0 8 -4 7 -10 -3 -6 -9 -10 -10 -10 -3 0 7 8 17 18 22 15 9 15 10 0 11 -9 0 -22 2 -30 3 -7 2 -10 2 -5 0 10 -6 9 -33 -2 -33 -14 0 -33 28 -26 40 8 13 24 13 64 -1z m489 -46 c5 -10 12 -80 16 -156 l7 -137 -24 11 c-23 10 -24 16 -33 155 -8 133 -8 144 8 144 10 0 21 -8 26 -17z m-648 -23 c-19 -13 -30 -13 -30 0 0 6 10 10 23 10 18 0 19 -2 7 -10z m372 -22 c-7 -7 -12 -20 -12 -29 0 -35 -66 -40 -79 -6 -8 20 -4 23 33 34 58 16 73 16 58 1z m-260 -23 c6 -30 3 -30 -42 -4 -21 12 -26 17 -12 14 13 -4 22 -2 22 4 0 22 28 10 32 -14z m673 5 c23 -9 26 -14 22 -51 -2 -22 -1 -59 4 -82 9 -46 -8 -70 -45 -65 -17 3 -20 14 -23 106 -5 108 -4 109 42 92z m498 -100 l385 -110 159 69 c87 38 160 66 163 64 3 -3 -1 -8 -8 -10 -6 -3 -10 -9 -7 -14 4 -5 -2 -6 -11 -2 -13 5 -15 3 -9 -7 5 -9 4 -11 -4 -6 -16 10 -53 -3 -45 -16 4 -6 2 -8 -3 -5 -14 9 -76 -17 -66 -27 4 -4 -1 -4 -11 0 -15 6 -17 4 -11 -6 5 -8 4 -11 -2 -7 -6 4 -26 1 -43 -7 -22 -9 -28 -15 -19 -20 8 -3 3 -3 -10 0 -16 4 -21 2 -17 -5 5 -7 1 -8 -10 -4 -11 4 -15 2 -11 -4 12 -18 -54 -6 -216 42 -88 25 -161 44 -164 42 -2 -3 10 -8 27 -12 l31 -7 -7 -206 -7 -207 123 -53 c73 -31 127 -49 132 -44 10 10 37 288 38 375 0 32 4 47 13 47 7 0 143 -38 301 -85 158 -46 295 -81 304 -78 14 5 15 3 5 -8 -7 -7 -13 -21 -13 -32 0 -11 -4 -15 -11 -11 -8 4 -9 -1 -4 -15 4 -12 2 -27 -3 -34 -13 -15 -4 -67 12 -67 6 0 3 -5 -6 -11 -11 -6 -18 -22 -18 -42 0 -26 -2 -29 -11 -17 -9 12 -10 11 -4 -5 7 -23 -4 -127 -14 -120 -4 2 -6 -8 -3 -24 4 -27 -26 -111 -40 -111 -5 0 -7 5 -5 11 1 5 -113 59 -253 119 -148 63 -255 114 -255 122 0 32 28 374 31 379 2 3 128 -31 281 -77 153 -46 279 -81 282 -79 5 6 23 0 -294 94 -148 44 -271 78 -274 75 -11 -11 -38 -399 -29 -411 6 -8 3 -15 -9 -21 -14 -7 -56 7 -177 61 -158 70 -158 70 -132 86 14 9 26 23 26 32 0 23 -26 43 -46 35 -15 -6 -16 4 -12 109 3 63 1 112 -3 109 -5 -3 -9 -31 -9 -63 l0 -58 -60 -26 -60 -26 0 165 c0 188 -1 187 84 133 53 -33 53 -33 5 -57 -39 -20 -44 -31 -26 -56 12 -17 16 -17 72 6 50 20 60 28 60 49 0 20 -5 24 -27 24 -22 -1 -28 4 -28 21 0 18 -12 24 -76 43 -42 12 -79 20 -82 17 -3 -3 0 -6 6 -6 8 0 9 -7 1 -27 -8 -22 -3 -323 6 -323 1 0 28 11 60 25 32 14 60 24 62 21 3 -3 -25 -19 -63 -36 -69 -31 -83 -29 -84 11 0 31 -20 39 -61 22 -39 -15 -39 -15 -171 42 -201 87 -192 77 -104 105 l74 23 34 -34 c22 -24 56 -43 105 -59 54 -18 73 -29 76 -45 2 -11 5 35 6 101 1 113 2 122 21 127 12 3 20 14 20 27 0 13 -8 24 -20 27 -11 3 -20 9 -20 14 0 13 -165 60 -185 52 -13 -4 -16 -3 -11 5 4 8 1 12 -10 12 -10 0 -15 -3 -11 -6 3 -4 -2 -14 -13 -23 -11 -9 -21 -29 -24 -46 l-6 -30 12 27 c19 45 76 51 100 11 29 -51 27 -120 -4 -132 -33 -12 -65 6 -82 48 -8 20 -15 30 -15 23 -1 -22 28 -71 48 -82 38 -20 61 -12 77 25 17 42 7 96 -27 139 -11 14 -16 26 -12 26 19 0 43 -27 58 -65 9 -22 13 -28 10 -13 -3 14 -8 34 -11 43 -6 13 -2 15 22 9 80 -19 91 -36 34 -49 -21 -5 -30 -13 -30 -26 0 -10 -4 -19 -9 -19 -5 0 -12 -16 -15 -35 -5 -26 -16 -42 -39 -55 -18 -11 -27 -20 -21 -20 22 0 63 41 69 70 8 34 6 34 40 18 24 -11 25 -15 25 -89 l0 -79 -52 21 c-60 23 -104 52 -101 67 2 6 -5 13 -15 16 -45 15 -84 125 -68 191 6 22 32 42 58 44 4 1 180 -48 391 -109z m-936 44 c-3 -3 -12 -4 -19 -1 -8 3 -5 6 6 6 11 1 17 -2 13 -5z m-40 -10 c-3 -3 -12 -4 -19 -1 -8 3 -5 6 6 6 11 1 17 -2 13 -5z m813 -42 c0 -11 -51 -35 -58 -28 -2 3 -2 12 1 21 7 15 57 22 57 7z m1054 -31 c115 -26 118 -28 89 -40 -24 -10 -32 -20 -37 -49 -7 -44 -4 -47 57 -64 64 -17 98 0 112 58 l10 40 50 -13 c28 -8 56 -15 63 -15 6 -1 12 -3 12 -6 0 -8 -34 -31 -45 -31 -5 0 -1 6 9 14 11 8 17 15 13 15 -4 0 -57 -36 -117 -80 -60 -44 -115 -80 -122 -80 -7 0 -134 36 -282 79 -257 75 -267 78 -237 91 17 7 28 16 25 21 -3 5 3 6 12 2 13 -5 15 -3 9 7 -5 9 -4 11 4 6 15 -10 73 13 65 25 -3 5 3 6 12 2 12 -4 15 -3 10 5 -4 7 -2 10 6 7 7 -3 36 6 63 19 55 26 48 26 219 -13z m-1124 3 c0 -8 -4 -14 -10 -14 -5 0 -10 9 -10 21 0 11 5 17 10 14 6 -3 10 -13 10 -21z m245 -2 c-3 -3 -11 0 -18 7 -9 10 -8 11 6 5 10 -3 15 -9 12 -12z m-208 -99 l-1 -88 -3 75 c-2 41 -9 80 -15 87 -8 10 -7 13 4 13 13 0 15 -16 15 -87z m334 -101 c-2 -94 0 -172 3 -172 11 0 206 100 206 105 0 3 -46 -18 -102 -46 l-101 -51 6 114 c4 62 7 136 7 164 l0 52 106 -31 106 -31 -6 -85 c-4 -47 -9 -108 -11 -136 -12 -160 -18 -206 -24 -203 -139 59 -211 92 -211 97 0 3 52 33 114 66 63 33 113 61 111 63 -2 2 -54 -23 -116 -55 -62 -32 -117 -60 -121 -61 -10 -4 -10 71 -1 252 5 118 8 136 22 134 14 -3 16 -24 12 -176z m-71 147 c0 -8 -58 -39 -75 -39 -16 0 -2 32 18 40 31 12 57 12 57 -1z m983 5 c60 -10 44 -27 -20 -21 l-58 6 45 -12 c41 -12 45 -16 43 -43 l-2 -29 9 31 c6 17 17 38 27 45 15 13 16 11 10 -11 -4 -14 -7 -30 -7 -37 0 -26 -39 -35 -95 -22 -53 12 -54 12 -48 43 5 31 27 56 47 56 6 0 28 -3 49 -6z m-1073 -40 c0 -8 -4 -12 -10 -9 -5 3 -10 13 -10 21 0 8 5 12 10 9 6 -3 10 -13 10 -21z m1195 -59 c-16 -14 -33 -25 -37 -25 -4 0 -5 -6 -2 -14 5 -13 -10 -116 -23 -160 -3 -11 -1 -16 5 -13 5 4 12 26 15 49 15 110 27 143 57 160 28 16 30 16 30 0 0 -10 -7 -42 -15 -72 -32 -113 -46 -186 -41 -215 4 -19 3 -25 -3 -17 -6 10 -10 7 -13 -12 -3 -15 -1 -26 6 -26 6 0 2 -6 -8 -12 -20 -11 -126 -108 -159 -145 -40 -44 -42 -35 -19 87 4 25 7 55 6 68 -2 27 -2 27 74 1 48 -16 65 -18 79 -9 15 9 13 10 -12 6 l-30 -5 28 13 c27 12 27 13 -48 36 -42 13 -78 26 -79 29 -2 4 1 34 7 69 10 61 11 64 68 105 32 23 60 48 64 56 6 15 8 17 -63 -38 -24 -19 -45 -31 -48 -28 -3 2 37 34 87 71 92 66 131 88 74 41z m-1341 -142 c-12 -9 -21 -10 -28 -3 -14 14 11 31 32 22 12 -4 12 -7 -4 -19z m176 -23 c0 -34 -4 -41 -25 -46 -14 -3 -25 -10 -25 -15 0 -14 -13 -11 -86 22 -64 29 -67 32 -45 41 19 7 27 5 33 -7 9 -15 77 -49 85 -41 2 2 -11 9 -28 16 l-31 13 58 28 c33 15 60 28 62 28 1 1 2 -17 2 -39z m-210 9 c0 -5 -4 -9 -10 -9 -5 0 -10 7 -10 16 0 8 5 12 10 9 6 -3 10 -10 10 -16z m1402 -1 c-7 -7 -12 -8 -12 -2 0 14 12 26 19 19 2 -3 -1 -11 -7 -17z m-1142 -62 c0 -7 -11 -21 -24 -29 -22 -15 -25 -15 -31 1 -4 10 1 21 11 29 23 17 44 16 44 -1z m-62 -35 c3 -8 -1 -12 -9 -9 -7 2 -15 10 -17 17 -3 8 1 12 9 9 7 -2 15 -10 17 -17z m1184 -3 c-7 -7 -12 -8 -12 -2 0 14 12 26 19 19 2 -3 -1 -11 -7 -17z m-117 -57 c42 -15 46 -18 27 -23 -27 -8 -114 20 -106 33 7 12 20 11 79 -10z m-20 -171 c-66 -66 -122 -120 -126 -120 -7 0 234 240 241 240 3 0 -49 -54 -115 -120z m-625 80 c8 -5 11 -10 5 -10 -5 0 -17 5 -25 10 -8 5 -10 10 -5 10 6 0 17 -5 25 -10z m80 -35 c14 -8 21 -14 15 -14 -5 0 -21 6 -35 14 -14 8 -20 14 -15 14 6 0 21 -6 35 -14z m70 -30 c14 -8 21 -14 15 -14 -5 0 -21 6 -35 14 -14 8 -20 14 -15 14 6 0 21 -6 35 -14z m70 -30 c14 -8 21 -14 15 -14 -5 0 -21 6 -35 14 -14 8 -20 14 -15 14 6 0 21 -6 35 -14z m70 -30 c14 -8 21 -14 15 -14 -5 0 -21 6 -35 14 -14 8 -20 14 -15 14 6 0 21 -6 35 -14z m70 -30 c14 -8 21 -14 15 -14 -5 0 -21 6 -35 14 -14 8 -20 14 -15 14 6 0 21 -6 35 -14z m70 -30 c14 -8 21 -14 15 -14 -5 0 -21 6 -35 14 -14 8 -20 14 -15 14 6 0 21 -6 35 -14z"/>         
                </g>

                <g transform="translate(20.0,40.0)" >
                    <rect x="0" y="0" width="40" height="15" fill='blue' stroke='black' stroke-width='1'/>
                    <text x="5" y="10" fill="white" font-size="0.8em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[AHU_A_TEMP1]}C</text>
                </g>
                <g transform="translate(20.0,55.0)" >
                    <rect x="0" y="0" width="40" height="15" fill='red' stroke='black' stroke-width='1'/>
                    <text x="5" y="10" fill="white" font-size="0.8em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[AHU_A_TEMP2]}C</text>
                </g>

                <g transform="translate(200.0,100.0)" >
                    <rect x="0" y="0" width="40" height="15" fill='blue' stroke='black' stroke-width='1'/>
                    <text x="5" y="10" fill="white" font-size="0.8em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[AHU_B_TEMP1]}C</text>
                </g>
                <g transform="translate(200.0,115.0)" >
                    <rect x="0" y="0" width="40" height="15" fill='red' stroke='black' stroke-width='1'/>
                    <text x="5" y="10" fill="white" font-size="0.8em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[AHU_B_TEMP2]}C</text>
                </g>
            </svg>
        </div>
    )
}

// Set default props
AHU.defaultProps = {
  color: "black",
  handleComponetSelection: null
};
export default AHU