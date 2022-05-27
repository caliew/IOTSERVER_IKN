import React, { useState, useEffect } from "react";
import { HeatMapGrid } from "react-grid-heatmap";
import HeatmapLegend from "./HeatmapLegend";

function randomExtend(minNum, maxNum) {
  if (arguments.length === 1) {
    return parseInt(Math.random() * minNum + 1, 10)
  } else {
    return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10)
  }
}
// const xLabels = new Array(10).fill(0).map((_, i) => `${i}`);
const xLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
let yLabels = new Array(5).fill(0).map((_, i) => `${getWeek(new Date()) + i}`);;
let data = new Array(yLabels.length).fill(0).map(() => new Array(xLabels.length).fill(0).map(() => randomExtend(-10,11)) );
// ------------------
function getWeek (_date) {
  var date = new Date();
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  // January 4 is always in week 1.
  var week1 = new Date(_date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return 1 + Math.round(((_date.getTime() - week1.getTime()) / 86400000
                        - 3 + (week1.getDay() + 6) % 7) / 7);
}
// ---------------------------------------
const HeatMap = ({title,sensorData,index}) => {
  // -------------------------------------
  const [max,setMax] = useState(null);
  const [min,setMin] = useState(null);
  sensorData && getData(sensorData,index);
  // -------------------------------------
  function getData(sensorData,index) {
    // --------------------------
    let keyArray = Object.keys(sensorData);
    let WeeksArray = []
    let mapWeeks = {};
    let mapData = [];
    // -------------------
    keyArray.map( key => {
      // --------------------
      const _keyDate = key.split('-');
      const values = sensorData[key];
      if (min === null) {
        setMin(values[index]);
        setMax(values[index]);
      }
      if (min > values[index]) setMin(values[index])
      if (max < values[index]) setMax(values[index])
      // --------------------
      let _Day = Number(_keyDate[0]);
      let _Month = Number(_keyDate[1]) - 1;
      let _Year = Number(_keyDate[2]);
      // -----------------------------
      let _date = new Date(_Year,_Month,_Day)
      _date.setHours(0,0,0,0);
      let _Week = getWeek(_date);
      let _DayOfWeek = _date.getDay();
      if (_DayOfWeek == 0) _Week +=1;
      // console.log(`..${key} =>${_Day}/${_Month+1}/${_Year}...`)
      // -----------------------
      if (mapWeeks[_Week] == null) {
        WeeksArray.push(_Week);
        mapWeeks[_Week] = new Array(7).fill(null);
        mapWeeks[_Week][_DayOfWeek] = Number(values[index]);
      } else {
        mapWeeks[_Week][_DayOfWeek] = Number(values[index]);
      }
    })
    // -------------------
    Object.entries(mapWeeks).map(item => {
      mapData.push(item[1]);
    })
    // --------------
    data = mapData;
    yLabels = WeeksArray.reverse();
    // ------------------
  }
  let nCOUNT = 6;
  // ------------------
  // console.log(title,index,min,max,data);
  // -------------------
  function getBackGroundColor(index,ratio,title) {
    // --------------
    let palette1 = [];
    let palette2 = [];
    // --------------
    let nID = parseInt(ratio*nCOUNT);
    // console.log(ratio,nID)
    palette1[0] = `rgb(255, 0, 0,0.50)`;
    palette1[1] = `rgb(255, 102, 0)`;
    palette1[2] = `rgb(0, 255, 0)`;
    palette1[3] = `rgb(255, 215, 0)`;
    palette1[4] = `rgb(255, 255, 0)`;
    palette1[5] = `rgb(153, 255, 153)`;
    palette1[6] = `rgb(0, 128, 0)`;
    palette1[7] = `rgb(0, 255, 255,0.50)`;
    palette1[8] = `rgb(0, 153, 255,0.50)`;
    palette1[9] = `rgb(0, 0, 255, 0.20)`;
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
    // ------------------
    // console.log(ratio);
    // `rgb(0, 255, 0, ${1 - (max - value) / (max - min)})`
    return index == '0' ? `rgb(55, 125, 255, ${ratio})` : `rgb(255, 0, 0, ${ratio})`;
    // if ( nID == 0 ) return `rgb(255,255,255,0.0)`;
    // return index == '0' ? palette1[nID] : palette2[nID];
    // console.log(title,ratio,nID,palette1[nID]);
    // console.log(index,ratio,nID,index == '0' ? palette1[nID] : palette2[nID])
    // return index == '0' ? palette1[nID] : palette2[nID];
  }
  //  -------------------
  return (
    <div className="d-flex flex-column align-items-center justify-content-center flex-wrap m-1">
    <div style={{ fontSize: "10px" }}>
    <h6>{title}</h6>
      <HeatMapGrid
      // ----------
        data={data}
        xLabels={xLabels}
        yLabels={yLabels}
        // -----------------------
        // Reder cell with tooltip
        // -----------------------
        xLabelsStyle={index => ({
          color: index % 1 ? "transparent" : "#777",
          fontSize: "0.7rem"
        })}
        yLabelsStyle={() => ({
          textTransform: "uppercase",
          color: "#777",
          fontSize: ".85rem"
        })}
        // ----------------
        square
        cellHeight="1.5rem"
        cellWidth="1.5rem"
        // ---------------
        xLabelsPos="bottom"
        // -------------
        cellStyle={(_x, _y, ratio) => ({
          background: getBackGroundColor(index,ratio,title),
          fontSize: "0.8rem",
          color: "#000" //  `rgb(0, 0, 0, ${ratio / 2 + 0.4})`
        })}
        // ------------------------------
        onClick={(x, y) => alert(`Clicked (${x},${y})`)}
        cellRender={(x, y, value) => ( 
          <div title={`Pos(${x}, ${y}) = ${Number(value).toFixed(1)}`}>
          { value === null ? null : Number(value).toFixed(0)}
          </div> )}
        // yLabelsPos="right"
        // square
      />
      { max !== null && <HeatmapLegend index={index} max={max} min={min}/> }
      </div>
    </div>
  );
};

export default HeatMap;
