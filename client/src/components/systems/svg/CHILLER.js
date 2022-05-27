import React, { useState, useEffect, useContext } from 'react'
import {
  CHILLER_A_CH_TEMP1, CHILLER_A_CH_TEMP2, CHILLER_A_CH_FLOWRATE,
  CHILLER_A_CW_TEMP1, CHILLER_A_CW_TEMP2, CHILLER_A_CW_FLOWRATE,
  CHILLER_B_CH_TEMP1, CHILLER_B_CH_TEMP2, CHILLER_B_CH_FLOWRATE,
  CHILLER_B_CW_TEMP1, CHILLER_B_CW_TEMP2, CHILLER_B_CW_FLOWRATE,
  CHILLER_A_ELECTPWR, CHILLER_B_ELECTPWR
} from '../../types'
// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function CHILLER({ color, sensorsData, handleComponetSelection }) {
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // --------------------------------------------
    return (
        <div style={{display:'flex',alignItems:'center'}}>
            <div style={{fontSize:'0.9rem',lineHeight:'1.2rem',color:'white',backgroundColor:'black'}}>
                <hr/>
                <p>CHILLERS (CH)</p>
                <hr/>
                <p style={{fontSize:'0.9rem',lineHeight:'1.0rem'}}>CHILLER A EFFICIENCY --- %</p>
                <p style={{fontSize:'0.9rem',lineHeight:'1.0rem'}}>CHILLER B EFFICIENCY --- %</p>
                <hr/>
            </div>
            <svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="300.0pt" height="162.0pt" viewBox="0 0 300.0 162.0" preserveAspectRatio="xMidYMid meet">
                <g transform="translate(0.0,162.0) scale(0.10,-0.10)" fill={color} >
                    <path d="M2186 1558 c-2 -7 -14 -89 -27 -181 -28 -214 -21 -207 -172 -161 -62 19 -122 34 -134 34 -13 0 -32 -13 -47 -33 -37 -49 -32 -57 7 -12 28 33 37 37 60 31 32 -8 26 -28 -6 -21 -17 3 -29 -6 -54 -41 -44 -60 -44 -98 -1 -113 23 -8 29 -14 21 -22 -8 -8 -17 -8 -31 0 -25 14 -43 14 -22 1 13 -8 13 -10 -2 -10 -22 0 -35 78 -19 109 14 26 24 201 12 201 -5 0 -7 48 -6 108 l4 107 -10 -105 c-5 -57 -14 -107 -18 -110 -5 -3 -12 -73 -16 -157 -6 -129 -9 -151 -22 -146 -13 5 -15 26 -8 150 5 104 4 143 -5 143 -8 0 -10 26 -6 88 3 55 2 76 -3 57 -5 -16 -9 -55 -10 -87 0 -31 -5 -58 -10 -60 -5 -1 -13 -71 -17 -155 -7 -147 -6 -151 15 -164 13 -9 21 -24 21 -41 0 -16 5 -28 10 -28 6 0 3 -14 -6 -32 -13 -24 -14 -36 -5 -50 6 -10 11 -34 11 -53 0 -39 9 -43 50 -18 28 16 31 15 311 -100 156 -64 301 -123 321 -131 34 -15 36 -18 28 -45 -6 -22 -4 -33 6 -42 8 -6 16 -10 17 -8 2 2 26 31 53 64 62 73 74 95 74 135 0 17 10 44 21 60 18 23 21 38 17 82 -5 48 -3 56 23 86 45 52 36 76 -46 118 -61 31 -54 29 164 -35 96 -29 180 -50 188 -47 7 3 13 14 13 25 0 21 8 19 -255 92 -82 22 -154 44 -160 48 -5 4 -56 20 -113 36 -79 21 -106 25 -115 16 -9 -9 -15 -6 -28 10 -12 16 -28 23 -53 23 -28 1 -35 4 -30 16 10 23 62 364 57 373 -7 12 -43 8 -47 -5z m21 -73 c-6 -30 -12 -53 -14 -51 -8 7 9 116 17 111 3 -2 2 -29 -3 -60z m-22 -135 c-4 -34 -9 -59 -12 -57 -2 3 -1 33 3 66 4 34 9 60 11 57 3 -3 2 -32 -2 -66z m-495 -62 c0 -50 -13 -128 -21 -128 -5 0 -9 34 -9 75 0 60 3 75 15 75 9 0 15 -9 15 -22z m480 -43 c0 -19 -4 -35 -8 -35 -4 0 -6 16 -4 35 2 19 6 35 8 35 2 0 4 -16 4 -35z m-111 -60 c69 -20 150 -43 180 -52 36 -11 56 -13 58 -6 2 6 36 1 91 -15 48 -14 88 -26 89 -27 1 0 -11 -27 -27 -59 -17 -32 -30 -67 -30 -77 0 -23 -8 -24 -32 -3 -15 14 -20 15 -34 3 -16 -13 -17 -10 -10 31 13 81 13 85 -11 88 -17 3 -23 10 -24 30 -1 49 -15 -4 -38 -143 -30 -183 -30 -184 -52 -196 -15 -7 -23 -6 -35 6 -10 10 -24 13 -36 9 -15 -4 -18 -3 -13 7 6 9 4 11 -8 6 -28 -10 -29 26 -7 179 18 121 19 148 8 155 -10 7 -9 9 5 9 9 0 17 -4 17 -10 0 -8 69 -32 97 -33 7 0 10 -4 7 -9 -9 -14 -55 -300 -49 -306 10 -10 13 3 40 158 15 85 32 161 38 169 9 12 9 13 -1 7 -11 -7 -181 40 -192 53 -3 3 -14 7 -25 7 -37 2 -165 40 -159 47 11 11 20 9 153 -28z m-65 -19 c11 4 13 0 9 -16 -4 -13 -8 -17 -13 -10 -11 17 -34 -245 -23 -265 7 -11 13 23 23 117 14 144 23 176 45 158 7 -6 29 -12 48 -13 18 -1 34 -6 34 -12 0 -5 3 -21 7 -35 6 -20 5 -22 -4 -10 -9 12 -10 4 -7 -34 3 -33 2 -44 -5 -35 -6 10 -8 -1 -5 -33 3 -30 1 -45 -5 -42 -7 4 -9 -9 -6 -34 2 -22 0 -38 -4 -36 -13 8 -9 -51 4 -64 9 -9 9 -12 0 -12 -7 0 -12 5 -12 10 0 6 -3 9 -7 8 -5 -1 -18 3 -30 10 -13 7 -23 9 -23 5 0 -4 -5 -2 -12 5 -7 7 -22 12 -35 12 -17 0 -21 4 -17 18 5 14 4 14 -4 3 -8 -11 -14 -12 -24 -4 -7 6 -25 13 -40 17 -25 6 -28 11 -28 49 0 32 -3 39 -11 27 -8 -11 -9 1 -6 46 5 60 4 62 -27 78 l-31 17 30 -7 c37 -7 45 -19 45 -69 0 -22 5 -47 10 -55 7 -11 9 -2 9 30 -2 57 -12 106 -22 102 -13 -6 -67 9 -67 19 0 24 34 59 56 59 21 0 24 -5 24 -37 0 -21 5 -45 10 -53 7 -11 10 -4 10 25 0 62 -9 83 -31 78 -18 -5 -26 7 -13 20 3 3 34 -5 70 -19 35 -13 70 -21 78 -18z m166 24 c0 -5 -7 -10 -16 -10 -8 0 -12 5 -9 10 3 6 10 10 16 10 5 0 9 -4 9 -10z m77 -36 c-3 -3 -12 -4 -19 -1 -8 3 -5 6 6 6 11 1 17 -2 13 -5z m-557 -59 c0 -42 -3 -55 -15 -55 -12 0 -15 13 -15 55 0 42 3 55 15 55 12 0 15 -13 15 -55z m830 -39 c0 -20 -4 -23 -22 -19 -13 3 -4 -5 19 -17 23 -12 44 -28 47 -36 3 -8 1 -12 -4 -9 -5 3 -12 -5 -15 -18 -6 -21 -13 -24 -46 -24 l-39 0 3 42 c1 24 6 40 11 37 5 -3 7 2 3 10 -6 17 18 58 34 58 5 0 9 -11 9 -24z m-177 1 c16 -6 16 -10 4 -34 -14 -28 -15 -84 -3 -114 5 -11 1 -19 -10 -23 -14 -6 -16 0 -12 43 4 36 2 46 -6 38 -7 -5 -10 -26 -8 -45 3 -22 0 -37 -9 -43 -11 -6 -8 -9 8 -9 12 0 30 -3 40 -6 13 -4 15 -3 4 4 -11 8 -11 11 0 18 7 4 14 3 16 -3 2 -6 36 -21 74 -34 53 -17 66 -25 52 -30 -10 -4 -12 -8 -5 -8 14 -1 16 -29 4 -49 -7 -9 -33 -4 -115 25 -59 21 -107 41 -107 45 0 4 45 -9 101 -28 55 -20 102 -34 105 -31 4 3 -123 51 -196 74 -8 2 -10 7 -5 11 6 4 11 25 12 47 3 58 24 165 32 161 3 -1 14 -6 24 -9z m578 -110 c-11 -11 -381 95 -381 109 0 6 83 -13 195 -45 108 -31 190 -60 186 -64z m-1192 77 c17 -4 31 -10 31 -15 0 -11 -61 -5 -85 9 -20 11 -20 11 1 12 12 0 36 -3 53 -6z m91 -13 c0 -14 -8 -21 -27 -23 -18 -2 -35 -15 -50 -37 l-23 -34 0 27 c0 21 10 33 47 56 26 17 48 30 50 30 2 0 3 -9 3 -19z m-108 -43 c-7 -7 -12 -8 -12 -2 0 14 12 26 19 19 2 -3 -1 -11 -7 -17z m912 -11 l20 -27 -30 -37 c-43 -53 -69 -57 -167 -24 -72 25 -82 31 -82 52 0 15 6 24 15 24 8 0 14 -5 13 -11 -1 -6 24 -19 57 -29 32 -10 57 -23 56 -29 -2 -6 -1 -8 1 -3 3 4 15 7 27 7 12 0 37 16 56 35 34 35 34 36 12 42 -12 3 -22 12 -22 20 0 21 20 11 44 -20z m-806 17 c13 -4 22 -14 22 -25 0 -11 5 -19 10 -19 6 0 10 -13 10 -29 0 -27 5 -30 150 -85 82 -32 155 -54 161 -50 8 4 9 3 5 -4 -4 -7 3 -14 19 -18 27 -7 65 17 65 42 0 25 19 23 117 -12 l100 -36 -19 -36 c-10 -20 -18 -43 -18 -52 0 -8 -5 -31 -10 -52 l-10 -36 -158 65 c-86 35 -231 94 -322 129 -91 36 -177 72 -192 79 -33 16 -38 1 -6 -16 19 -10 19 -12 5 -21 -28 -15 -30 -14 -33 12 -4 38 24 128 46 150 22 22 25 23 58 14z m644 -54 c6 0 9 -2 6 -5 -3 -3 -12 -3 -20 0 -10 4 -13 14 -9 33 l6 27 3 -27 c2 -16 8 -28 14 -28z m105 -7 c-20 -20 -30 -24 -56 -18 -41 9 -40 25 3 25 18 0 39 7 46 15 7 8 17 12 22 9 6 -4 -1 -17 -15 -31z m-860 -35 c-3 -8 -6 -5 -6 6 -1 11 2 17 5 13 3 -3 4 -12 1 -19z m846 -62 c-4 -6 0 -5 9 1 19 16 28 7 28 -29 0 -32 -28 -94 -38 -84 -3 4 -5 26 -3 50 1 32 -2 43 -13 43 -11 0 -13 -5 -5 -18 14 -28 11 -43 -13 -54 -15 -7 -22 -17 -20 -30 2 -19 2 -19 -9 -2 -9 16 -6 24 17 49 18 19 22 29 13 25 -13 -4 -16 -1 -11 16 2 12 9 27 13 33 11 14 40 14 32 0z m-7 -123 c11 -42 -6 -91 -44 -130 -33 -34 -37 -36 -40 -17 -1 11 7 47 20 80 12 32 23 64 24 69 1 6 2 13 3 16 3 16 32 3 37 -18z m-63 -6 c3 -7 -6 -44 -19 -83 -20 -60 -21 -70 -9 -80 13 -10 12 -13 -3 -28 -28 -24 -31 -11 -15 52 9 31 16 71 17 87 2 17 8 29 14 28 7 -2 12 2 12 7 0 6 -4 10 -10 10 -5 0 -10 5 -10 10 0 15 17 12 23 -3z"/>
                    <path d="M802 1411 c-11 -7 -9 -40 12 -187 15 -99 27 -187 29 -198 2 -14 -17 -27 -84 -56 -71 -31 -95 -36 -145 -35 -71 3 -94 11 -94 35 0 26 -36 67 -71 79 -28 10 -33 7 -72 -28 -34 -32 -45 -37 -59 -27 -13 8 -29 6 -64 -7 -26 -9 -48 -16 -49 -15 0 2 -14 48 -31 103 -25 87 -32 100 -53 103 -15 2 -21 0 -17 -7 5 -7 1 -8 -10 -4 -13 5 -16 2 -12 -8 3 -8 24 -75 47 -149 69 -221 72 -230 82 -225 5 4 6 -1 3 -9 -4 -9 0 -18 10 -22 10 -4 14 -15 11 -32 -3 -15 10 -70 28 -122 34 -100 32 -98 90 -88 11 2 103 -61 237 -162 l218 -165 6 -45 c4 -30 13 -49 26 -58 19 -11 27 -8 79 32 l58 44 44 -39 c24 -21 54 -38 66 -39 37 0 43 27 29 131 -10 69 -10 96 -2 101 6 3 29 20 51 36 46 33 46 35 38 170 -6 105 -14 117 -62 83 -30 -21 -30 -21 -61 -2 -19 11 -27 22 -21 25 17 11 13 58 -9 91 -11 17 -20 45 -20 62 0 30 5 35 70 68 41 21 75 45 80 58 7 14 4 96 -8 242 -16 206 -18 220 -37 223 -42 5 -43 -3 -24 -218 10 -113 18 -210 19 -216 0 -18 -118 -69 -154 -66 -20 2 -41 -4 -56 -16 -22 -18 -25 -18 -51 -3 -49 28 -48 85 2 113 36 21 36 15 3 253 -27 197 -36 220 -72 196z m28 -25 c0 -2 11 -86 25 -186 29 -211 27 -190 16 -190 -5 0 -11 24 -14 53 -4 46 -29 225 -42 300 -2 15 0 27 5 27 6 0 10 -2 10 -4z m310 -48 c0 -2 6 -91 14 -198 18 -263 18 -247 1 -224 -8 11 -15 42 -15 69 0 28 -4 86 -9 130 -21 182 -22 225 -6 225 8 0 15 -1 15 -2z m-990 -240 c7 -29 27 -93 45 -143 18 -49 36 -105 40 -122 6 -29 4 -33 -13 -33 -13 0 -22 9 -26 28 -4 15 -25 86 -47 157 -22 72 -43 138 -45 148 -4 12 0 17 14 17 16 0 23 -11 32 -52z m318 -78 c17 -11 32 -25 32 -32 0 -7 3 -23 6 -35 5 -16 2 -23 -9 -23 -8 0 -17 13 -20 30 -4 19 -17 35 -37 45 -16 8 -30 12 -30 8 0 -5 -8 -18 -18 -30 -12 -16 -21 -20 -32 -13 -12 8 -10 14 15 40 34 35 49 37 93 10z m392 -35 c0 -14 -46 -33 -56 -22 -4 4 26 24 54 36 1 1 2 -6 2 -14z m-493 -30 c58 -33 81 -51 51 -40 -7 3 -24 -1 -38 -8 -22 -12 -31 -10 -79 20 -30 17 -58 30 -63 27 -13 -8 3 -26 18 -20 8 3 13 0 11 -7 -1 -7 6 -11 16 -10 13 1 17 -4 12 -14 -5 -15 67 -289 87 -325 12 -24 -2 -22 -34 5 -21 17 -37 58 -81 199 l-54 177 36 15 c49 20 46 21 118 -19z m102 -6 c10 -30 38 -38 58 -18 7 7 13 7 17 1 3 -5 -6 -17 -19 -26 -25 -16 -28 -16 -81 14 -57 33 -61 54 -10 56 19 1 27 -5 35 -27z m348 -20 c-1 -14 -4 -15 -15 -7 -10 9 -16 8 -22 -2 -4 -7 -17 -11 -29 -7 -12 3 -19 1 -15 -4 7 -11 -7 -11 -25 0 -11 7 -9 11 8 20 11 7 21 8 21 4 0 -4 5 -2 11 4 7 7 24 11 40 11 20 -1 27 -6 26 -19z m-131 -25 c26 -9 55 -13 65 -11 11 3 17 1 13 -4 -3 -5 3 -9 12 -9 10 0 25 -6 33 -14 9 -8 28 -21 43 -29 l28 -14 -37 -24 c-44 -28 -83 -91 -83 -136 l0 -31 -31 15 c-28 14 -30 19 -27 57 3 22 8 48 11 56 5 11 -5 22 -35 39 l-42 24 39 34 c21 18 34 33 29 33 -13 0 -74 -59 -74 -71 0 -5 15 -16 33 -25 17 -9 34 -18 36 -20 2 -1 -6 -16 -18 -33 -40 -56 -51 -93 -36 -121 14 -24 14 -24 8 11 -3 24 1 47 13 70 l18 34 7 -49 c6 -36 4 -52 -6 -62 -7 -8 -15 -19 -18 -26 -7 -19 -35 10 -41 42 -34 179 -43 202 -102 236 -17 10 -17 12 11 27 38 21 92 21 151 1z m-243 -7 c-3 -5 1 -7 8 -6 18 4 91 -34 110 -57 8 -9 32 -98 55 -198 l41 -181 -36 -22 c-45 -28 -46 -28 -49 1 -1 12 -20 97 -42 186 -22 90 -40 166 -40 170 0 3 16 12 36 19 19 7 33 15 31 17 -2 3 -16 -1 -31 -7 -23 -11 -32 -9 -68 11 -22 13 -37 17 -33 10 6 -9 4 -11 -5 -5 -11 7 -10 11 4 19 10 6 25 17 34 24 14 10 12 10 -10 1 -22 -10 -34 -9 -55 1 -26 12 -27 13 -8 20 26 9 65 7 58 -3z m368 3 c28 -16 23 -30 -6 -17 -14 7 -25 15 -25 20 0 10 8 9 31 -3z m339 0 c0 -9 -56 -41 -106 -60 -42 -16 -14 18 37 45 49 25 69 30 69 15z m-805 -20 c0 -5 8 -15 18 -22 11 -9 32 -70 61 -180 24 -91 47 -171 50 -177 4 -6 2 -11 -4 -11 -18 0 -4 -15 54 -54 l54 -38 40 21 c22 11 43 24 46 29 2 4 -2 34 -9 67 -8 32 -12 61 -10 63 2 3 22 -11 44 -30 22 -18 61 -45 88 -59 26 -14 65 -36 86 -49 l38 -23 -55 -36 c-61 -40 -71 -60 -57 -123 6 -23 9 -43 8 -44 -1 -1 -100 72 -220 162 -211 159 -218 163 -241 149 -39 -26 -51 0 -57 120 -1 38 -2 39 -8 10 l-7 -30 -11 42 c-8 32 -8 46 2 59 11 15 15 7 35 -58 21 -73 24 -76 91 -127 73 -54 106 -69 53 -23 -28 24 -38 47 -78 193 -25 91 -46 168 -46 172 0 3 7 3 17 0 12 -5 14 -3 8 8 -5 8 -5 11 1 6 5 -5 9 -13 9 -17z m642 -35 c0 -11 -7 -14 -21 -9 -15 4 -17 3 -7 -4 11 -8 11 -11 0 -18 -7 -4 -14 -3 -17 4 -2 6 -11 8 -20 5 -10 -4 -14 -2 -9 3 5 5 23 14 40 21 18 6 32 12 33 12 0 1 1 -6 1 -14z m26 -14 c3 -14 1 -18 -9 -14 -10 4 -12 0 -8 -11 4 -10 1 -16 -7 -16 -11 0 -11 -2 1 -10 11 -7 17 -4 23 8 5 12 6 10 3 -7 -3 -14 6 -43 20 -71 37 -70 24 -94 -83 -159 -107 -63 -133 -65 -214 -15 -63 39 -72 59 -39 89 22 19 50 14 50 -10 0 -13 -4 -14 -20 -5 -11 6 -20 7 -20 3 0 -14 80 -54 93 -47 6 4 4 -2 -5 -13 -10 -11 -18 -24 -18 -29 0 -5 5 -2 10 8 6 9 18 14 29 11 23 -6 190 82 198 104 6 16 -14 69 -23 60 -3 -3 0 -14 7 -25 11 -18 10 -24 -5 -41 -20 -22 -42 -29 -30 -9 17 27 22 94 9 130 -8 25 -9 38 -2 38 6 0 8 3 5 6 -5 4 16 35 28 43 1 1 4 -8 7 -18z m-566 -28 c28 -25 35 -45 72 -195 23 -92 41 -173 41 -179 0 -6 -14 3 -31 20 -17 17 -35 31 -40 31 -6 0 -8 4 -5 8 4 6 -53 235 -80 325 -8 25 7 21 43 -10z m507 -15 c9 -12 16 -38 16 -57 l0 -35 -33 32 c-41 40 -68 40 -101 1 -47 -55 -30 -104 40 -115 44 -6 45 -7 22 -22 -21 -15 -122 -26 -113 -13 2 4 0 13 -6 21 -6 10 -9 11 -9 3 0 -7 -4 -13 -9 -13 -6 0 -6 11 0 28 5 15 11 45 15 67 8 57 78 125 127 125 26 0 40 -6 51 -22z m-691 -19 c4 -15 1 -19 -11 -17 -21 4 -29 38 -9 38 8 0 17 -9 20 -21z m665 -44 c21 -24 21 -25 1 -35 -11 -6 -22 -24 -26 -40 -5 -26 -9 -29 -32 -24 -56 14 -65 60 -21 104 27 27 52 25 78 -5z m34 -61 c-2 -10 -4 -26 -5 -35 -1 -10 -9 -14 -24 -11 -27 5 -29 19 -7 50 18 27 41 24 36 -4z m228 -89 c0 -22 -3 -24 -31 -18 -22 4 -38 0 -60 -16 -16 -12 -34 -19 -40 -15 -8 4 -6 10 5 16 16 9 16 11 -1 24 -10 7 -22 14 -27 14 -6 0 -2 -6 8 -13 18 -13 17 -15 -13 -36 -20 -15 -31 -31 -31 -47 0 -28 -21 -32 -41 -8 -12 15 -11 16 9 10 31 -10 27 -2 -10 24 -30 20 -25 20 22 2 11 -4 10 1 -4 16 -11 12 -14 22 -8 22 6 0 14 -4 17 -10 3 -5 11 -10 17 -10 6 0 5 6 -3 16 -11 13 -9 14 17 8 27 -6 28 -5 10 8 -18 14 -18 15 -1 22 10 4 28 0 42 -9 22 -15 27 -14 66 8 48 27 57 26 57 -8z m-2 -80 c2 -24 -3 -52 -13 -71 -17 -31 -70 -70 -78 -57 -12 19 -19 144 -9 156 6 7 30 13 54 12 43 0 43 0 46 -40z m-238 -1 c0 -3 -10 -2 -22 1 -19 5 -17 3 7 -15 17 -12 39 -25 51 -30 17 -7 22 -20 27 -72 4 -46 2 -69 -9 -85 -18 -29 -18 -43 0 -18 13 18 15 17 25 -23 7 -23 16 -42 21 -42 12 0 13 7 1 28 -7 14 -4 17 14 17 21 0 24 -6 30 -58 3 -32 9 -65 12 -74 4 -11 0 -14 -18 -11 -19 2 -25 10 -27 35 -2 17 -10 37 -18 43 -8 7 -14 19 -14 27 0 8 -5 11 -11 7 -9 -5 -10 1 -5 22 5 23 4 25 -4 12 -8 -13 -19 -16 -40 -11 -35 6 -51 -18 -32 -48 10 -16 8 -21 -18 -34 -16 -8 -34 -15 -40 -15 -18 0 -72 61 -66 76 3 8 2 14 -3 14 -5 0 -11 17 -14 37 -8 46 3 59 101 120 50 31 69 48 61 54 -16 9 -32 1 -24 -12 12 -19 -21 -8 -65 21 -25 16 -38 30 -30 30 8 0 29 -9 45 -20 36 -24 46 -25 39 -5 -4 8 -11 12 -17 8 -6 -3 -7 -1 -3 5 4 7 2 12 -4 12 -7 0 -6 5 2 14 9 10 18 11 31 5 9 -6 17 -12 17 -15z m104 11 c4 -11 -1 -15 -19 -15 -24 0 -32 10 -18 23 11 12 31 8 37 -8z m16 -97 c20 -125 21 -138 4 -145 -25 -9 -34 9 -45 100 -7 48 -15 87 -20 87 -5 0 -6 7 -3 15 4 8 16 15 29 15 20 0 24 -7 35 -72z m126 0 c-1 -13 -5 -23 -9 -23 -3 0 -13 -9 -21 -20 -9 -11 -16 -16 -16 -10 0 5 -7 -1 -16 -13 -17 -25 -34 -29 -34 -9 0 8 11 19 23 24 13 6 35 25 48 42 29 36 28 36 25 9z m-178 -216 c23 -18 32 -32 32 -54 l0 -30 -26 31 c-14 17 -31 31 -36 31 -6 0 -35 -18 -65 -41 -55 -41 -93 -46 -93 -11 0 9 -3 28 -7 41 l-6 24 22 -22 c26 -26 79 -26 99 2 7 9 18 15 23 12 5 -4 9 -1 9 4 0 6 -4 11 -9 11 -8 0 -8 12 -2 38 1 4 21 -7 59 -36z"/>
                </g>                

                <g transform="translate(60.0,40.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='red' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_A_CH_TEMP2]}C</text>
                </g>
                <g transform="translate(90.0,50.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='blue' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_A_CH_TEMP1]}C</text>
                </g>

                <g transform="translate(10.0,55.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='green' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="WHITE" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_A_CW_TEMP1]}C</text>
                </g>
                <g transform="translate(110.0,120.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='yellow' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="black" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_A_CW_TEMP2]}C</text>
                </g>

                <g transform="translate(200.0,30.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='red' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_B_CH_TEMP2]}C</text>
                </g>
                <g transform="translate(250.0,40.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='blue' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="white" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_B_CH_TEMP1]}C</text>
                </g>

                <g transform="translate(150.0,20.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='green' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="WHITE" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_B_CW_TEMP1]}C</text>
                </g>
                <g transform="translate(150.0,30.0)" >
                    <rect x="0" y="0" width="40" height="12" fill='yellow' stroke='black' stroke-width='1'/>
                    <text x="5" y="9" fill="black" font-size="0.6em" name='PMP_AHU' id='PMP_AHU' >{sensorsData[CHILLER_B_CW_TEMP2]}C</text>
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