import React from "react";
import { HeatMapGrid } from "react-grid-heatmap";

const HeatmapLegend = ({index,max,min}) => {
  let nCOUNT = 6;
  const diff = Number(max - min)/nCOUNT;
  const yLabels = ["LEG"];
  const xLabels = [];
  // const xLabels = new Array(nCOUNT+1).fill(0).map((_,i)=> Number(min) + Number(i*diff) )
  // console.log(min,max,diff,xLabels)
  // ------------------
  const data = new Array(1).fill(0).map(()=>new Array(nCOUNT+1).fill(0).map((_,i)=> Number(min) + Number(i*diff)))
  // console.log(index,data)
  // ----------------------
  const getBackGroundColor = (ratio) => {
    // --------------
    let palette1 = [];
    let palette2 = [];
    // --------------
    let nID = parseInt(ratio*nCOUNT);
    palette1[0] = `rgb(255, 0, 0,0.50)`;
    palette1[1] = `rgb(255, 102, 0)`;
    palette1[2] = `rgb(0, 255, 0)`;
    palette1[3] = `rgb(255, 215, 0)`;
    palette1[4] = `rgb(255, 255, 0)`;
    palette1[5] = `rgb(153, 255, 153)`;
    palette1[6] = `rgb(0, 128, 0)`;
    palette1[7] = `rgb(0, 255, 255,0.50)`;
    palette1[8] = `rgb(0, 153, 255,0.50)`;
    palette1[9] = `rgb(0, 0, 255, 0.50)`;
    palette1[10] = `rgb(0, 0, 255, 0.50)`;
    // ------------------
    palette2[0] = `rgb(0, 0, 255, 0.5)`;
    palette2[1] = `rgb(0, 153, 255)`;
    palette2[2] = `rgb(0, 255, 255)`;
    palette2[3] = `rgb(0, 128, 0)`;
    palette2[4] = `rgb(153, 255, 153)`;
    palette2[5] = `rgb(255, 255, 0)`;
    palette2[6] = `rgb(255, 215, 0)`;
    palette2[7] = `rgb(0, 255, 0)`;
    palette2[8] = `rgb(255, 102, 0, 0.50)`;
    palette2[9] = `rgb(255, 0, 0, 0.20)`;
    palette2[10] = `rgb(255, 0, 0, 1.00)`;
    // -----------
    // console.log(ratio);
    // `rgb(0, 255, 0, ${1 - (max - value) / (max - min)})`
    return index == '0' ? `rgb(55, 125, 255, ${ratio})` : `rgb(255, 0, 0, ${ratio})`;
    // console.log(index,nID,palette1[nID],palette2[nID])
    // return index == '0' ? palette1[nID] : palette2[nID];
  }  // --------------
  return (
    <div style={{fontSize:"10px"}}>
      <HeatMapGrid
      // ----------
        data={data}
        xLabels={xLabels}
        yLabels={yLabels}
        // -----------------------
        // Reder cell with tooltip
        // -----------------------
        xLabelsStyle={index => ({
          color: index % 1 ? "transparent" : "transparent",
          fontSize: "0.7rem"
        })}
        yLabelsStyle={() => ({
          textTransform: "uppercase",
          color: "#777",
          fontSize: ".85rem"
        })}
        // -------
        square
        cellHeight="1.5rem"
        cellWidth="1.5rem"
        // ---------------
        xLabelsPos="bottom"
        // -------------
        cellStyle={(_x, _y, ratio) => ({
          background: getBackGroundColor(ratio),
          fontSize: "0.8rem",
          width:"1rem",
          color: "#000" //  `rgb(0, 0, 0, ${ratio / 2 + 0.4})`
        })}
        // ------------------------------
        onClick={(x, y) => alert(`Clicked (${x},${y})`)}
        cellRender={(x, y, value) => ( <div title={`Pos(${x}, ${y}) = ${Number(value).toFixed(1)}`}>
          { value === null ? null : Number(value).toFixed(1)}
          </div> )}
        // yLabelsPos="right"
        // square
      />
    </div>
  )
}

export default HeatmapLegend;