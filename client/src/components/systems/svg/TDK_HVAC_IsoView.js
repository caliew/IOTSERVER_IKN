import * as React from "react"
import { 
  CTW_A_TEMP1,CTW_A_TEMP2,CTW_A_FLOWRATE,CTW_A_ELECTPWR, 
  CTW_B_TEMP1,CTW_B_TEMP2,CTW_B_FLOWRATE,CTW_B_ELECTPWR,
  WCPU_A_TEMP1, WCPU_A_TEMP2, WCPU_A_FLOWRATE, WCPU_A_ELECTPWR,
  WCPU_B_TEMP1, WCPU_B_TEMP2, WCPU_B_FLOWRATE, WCPU_B_ELECTPWR,
  AHU_A_TEMP1,AHU_A_TEMP2,AHU_A_FLOWRATE,AHU_A_ELECTPWR,
  AHU_B_TEMP1,AHU_B_TEMP2,AHU_B_FLOWRATE,AHU_B_ELECTPWR, 
  CHILLER_A_CH_TEMP1, CHILLER_A_CH_TEMP2, CHILLER_A_CH_FLOWRATE,
  CHILLER_A_CW_TEMP1, CHILLER_A_CW_TEMP2, CHILLER_A_CW_FLOWRATE,
  CHILLER_B_CH_TEMP1, CHILLER_B_CH_TEMP2, CHILLER_B_CH_FLOWRATE,
  CHILLER_B_CW_TEMP1, CHILLER_B_CW_TEMP2, CHILLER_B_CW_FLOWRATE,
  CHILLER_A_ELECTPWR, CHILLER_B_ELECTPWR
} from '../../types';

import { MDBTable,MDBTableBody,MDBRow,MDBCol,MDBCard, MDBCardTitle } from 'mdbreact';
import { ReactComponent as SVGPLOT1} from '../svg/files/TDK_ISOVIEW_COLOR_1.svg';
import { ReactComponent as SVGPLOT2} from '../svg/files/FP_SAMPLE2.svg';
// 
// REFERENCE SVG DATA FROM 
// '../components/svg/TDK_ISOVIEW.svg'

function TDK_IsoVIEW({ color, sensorsData, systemComponent, handleComponetSelection }) {
    // --------------
    function handleClick (event) {
        let sysName = event.target.id;
        if (handleComponetSelection !== null) handleComponetSelection(sysName);
    }
    function bgColor (strKEY) {
        return (strKEY === systemComponent ? 'red' : 'black')
    }
    // --------------
    const sysCHILLER = 'CHILLER';
    const sysAHU = 'AHU';
    const sysWCPU = 'WCPU'
    const sysCTW = "CTW"
    const pumpCHILLER = "CHILLER PUMP";
    const pumpCTW = "CTW PUMP";
    const pumpAHU = "AHU PUMP"
    // --------------------------------------------
    // fill='green' stroke='black' stroke-width='1'
    // --------------------------------------------
    return (
			// -----------
			// width="702" height="408" viewBox="0 0 702 408" 
			// ----------
			// <MDBRow center>
				<MDBCol md="4">
				<MDBCard className="p-1" style={{width:"auto"}} >
					<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="700" height="400" viewBox="0 0 700 400"  preserveAspectRatio="xMidYMid meet" >
						<g transform="translate(0.0,0.0) scale(1.0,1.0)" fill={color} >
								<SVGPLOT1 />
								{/* {getSVGModell()} */}
						</g>
						{/* AIR HANDLING UNITS */}
						<g transform="translate(480.0,100.0)" >
								<rect x="0" y="10" width="40" height="20" fill='blue' />
								<text x="5" y="25" fill="white" font-size="0.8em" name='AHUA_T1' id='AHUA_T1' onClick={handleClick} >{sensorsData && sensorsData[AHU_A_TEMP1]}</text>
								<rect x="40" y="10" width="40" height="20" fill='red' />
								<text x="45" y="25" fill="white" font-size="0.8em" name='AHUA_T2' id='AHUA_T2' onClick={handleClick} >{sensorsData && sensorsData[AHU_A_TEMP2]}</text>

								<rect x="0" y="30" width="80" height="20" fill={bgColor('AHU')} />
								<text x="5" y="45" fill="WHITE" font-size="0.8em" name='AHU' id='AHU' onClick={handleClick} >{sysAHU}</text>

								<rect x="0" y="50" width="40" height="20" fill='blue' />
								<text x="5" y="65" fill="WHITE" font-size="0.8em" name='AHUB_T1' id='AHUB_T1' onClick={handleClick} >{sensorsData && sensorsData[AHU_B_TEMP1]}</text>
								<rect x="40" y="50" width="40" height="20" fill='red' />
								<text x="45" y="65" fill="white" font-size="0.8em" name='AHUB_T1' id='AHUB_T1' onClick={handleClick} >{sensorsData && sensorsData[AHU_B_TEMP2]}</text>     
						</g>
						{/* AIR HANDLING UNITS PUMPS*/}
						<g transform="translate(580.0,200.0)" >
								<rect x="0" y="10" width="80" height="20" fill={bgColor('PMP_AHU')} />
								<text x="5" y="25" fill="WHITE" font-size="0.8em" name='PMP_AHU' id='PMP_AHU' onClick={handleClick} >{pumpAHU}</text>
						</g>
						{/* CHILLERS */}            
						<g transform="translate(420.0,270.0)" >
								<rect x="0" y="10" width="40" height="20" fill='green' />
								<text x="5" y="25" fill="white" font-size="0.8em" name='CHA_T1' id='CHA_T1' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_A_CW_TEMP1]}</text>
								<rect x="40" y="10" width="40" height="20" fill='yellow' />
								<text x="45" y="25" fill="black" font-size="0.8em" name='CHA_T2' id='CHA_T2' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_A_CW_TEMP2]}</text>
																
								<rect x="0" y="30" width="40" height="20" fill='blue' />
								<text x="5" y="45" fill="white" font-size="0.8em" name='CHA_T1' id='CHA_T1' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_A_CH_TEMP1]}</text>
								<rect x="40" y="30" width="40" height="20" fill='red' />
								<text x="45" y="45" fill="white" font-size="0.8em" name='CHA_T2' id='CHA_T2' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_A_CH_TEMP2]}</text>

								<rect x="0" y="50" width="80" height="20" fill={bgColor('CHILLER')} />
								<text x="5" y="65" fill="WHITE" font-size="0.8em" name='CHILLER' id='CHILLER' onClick={handleClick} >{sysCHILLER}</text>

								<rect x="0" y="70" width="40" height="20" fill='blue' />
								<text x="5" y="85" fill="white" font-size="0.8em" name='CHB_T1' id='CHB_T1' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_B_CH_TEMP1]}</text>
								<rect x="40" y="70" width="40" height="20" fill='red' />
								<text x="45" y="85" fill="white" font-size="0.8em" name='CHB_T1' id='CHB_T1' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_B_CH_TEMP2]}</text>
								<rect x="0" y="90" width="40" height="20" fill='green' />
								<text x="5" y="105" fill="WHITE" font-size="0.8em" name='CHB_T1' id='CHB_T1' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_B_CW_TEMP1]}</text>
								<rect x="40" y="90" width="40" height="20" fill='yellow' />
								<text x="45" y="105" fill="black" font-size="0.8em" name='CHB_T1' id='CHB_T1' onClick={handleClick} >{sensorsData && sensorsData[CHILLER_B_CW_TEMP2]}</text>
						</g>
						{/* CHILLERS PUMPS */}            
						<g transform="translate(180.0,270.0)" >
								<rect x="0" y="10" width="100" height="20" fill={bgColor('PMP_CHILLER')} />
								<text x="5" y="25" fill="WHITE" font-size="0.8em" name='PMP_CHILLER' id='PMP_CHILLER' onClick={handleClick} >{pumpCHILLER}</text>
						</g>
						{/* COOLING TOWERS */}            
						<g transform="translate(60.0,260.0)" >
								<rect x="0" y="10" width="40" height="20" fill='green' />
								<text x="5" y="25" fill="white" font-size="0.8em" name='CTWA_T1' id='CTWA_T1' onClick={handleClick} >{sensorsData && sensorsData[CTW_A_TEMP1]}</text>
								<rect x="40" y="10" width="40" height="20" fill='yellow' />
								<text x="45" y="25" fill="black" font-size="0.8em" name='CTWA_T2' id='CTWA_T2' onClick={handleClick} >{sensorsData && sensorsData[CTW_A_TEMP2]}</text>

								<rect x="0" y="30" width="80" height="20" fill={bgColor('CTW')} />
								<text x="5" y="45" fill="WHITE" font-size="0.8em" name='CTW' id='CTW' onClick={handleClick} >{sysCTW}</text>

								<rect x="0" y="50" width="40" height="20" fill='green' />
								<text x="5" y="65" fill="WHITE" font-size="0.8em" name='CTWB_T1' id='CTWB_T1' onClick={handleClick} >{sensorsData && sensorsData[CTW_B_TEMP1]}</text>
								<rect x="40" y="50" width="40" height="20" fill='yellow' />
								<text x="45" y="65" fill="black" font-size="0.8em" name='CTWB_T1' id='CTWB_T1' onClick={handleClick} >{sensorsData && sensorsData[CTW_B_TEMP2]}</text>
						</g>
						{/* COOLING TOWERS PUMPS */}            
						<g transform="translate(180.0,340.0)" >
								<rect x="0" y="10" width="100" height="20" fill={bgColor('PMP_CTW')} />
								<text x="5" y="25" fill="WHITE" font-size="0.8em" name='PMP_CTW' id='PMP_CTW' onClick={handleClick} >{pumpCTW}</text>
						</g>
						{/* WATER COOLING PACK UNITS */}            
						<g transform="translate(150.0,100.0)" >
									<rect x="0" y="10" width="40" height="20" fill='green' />
									<text x="5" y="25" fill="white" font-size="0.8em" name='WCPUA_T1' id='WCPUA_T1' onClick={handleClick} >{sensorsData && sensorsData[WCPU_A_TEMP1]}</text>
									<rect x="40" y="10" width="40" height="20" fill='yellow' />
									<text x="45" y="25" fill="black" font-size="0.8em" name='WCPUA_T2' id='WCPUA_T2' onClick={handleClick} >{sensorsData && sensorsData[WCPU_A_TEMP2]}</text>

									<rect x="0" y="30" width="80" height="20" fill={bgColor('WCPU')} />
									<text x="5" y="45" fill="WHITE" font-size="0.8em" name='WCPU' id='WCPU' onClick={handleClick} >{sysWCPU}</text>

									<rect x="0" y="50" width="40" height="20" fill='green' />
									<text x="5" y="65" fill="WHITE" font-size="0.8em" name='WCPUB_T1' id='WCPUB_T1' onClick={handleClick} >{sensorsData && sensorsData[WCPU_B_TEMP1]}</text>
									<rect x="40" y="50" width="40" height="20" fill='yellow' />
									<text x="45" y="65" fill="black" font-size="0.8em" name='WCPUB_T1' id='WCPUB_T1' onClick={handleClick} >{sensorsData && sensorsData[WCPU_B_TEMP2]}</text>
							</g>
					</svg>
					</MDBCard>
				</MDBCol>
			// </MDBRow>
    )
}

// Set default props
TDK_IsoVIEW.defaultProps = {
  color: "black",
  handleComponetSelection: null
};
export default TDK_IsoVIEW