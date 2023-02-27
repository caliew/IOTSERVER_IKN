import React from 'react';
import ReactECharts from 'echarts-for-react';
const colors = ['#5470C6', '#91CC75', '#EE6666'];

const Page = ({title,data,type}) => {
  const getLegends = () => {
    let _legend0 = ['TEMP','RH'];
    let _legend1 = ['SPEED'];
    let _legend2 = ['PRESSURE'];
    let _legend3 = ['TEMPERATURE'];
    if (!data || data.length === 0) return;
    switch (type) {
      case "WISENSOR":
        return _legend0;
      case "AIRRH(485)":
        return _legend3;
      case "AIRFLW(485)":
        return _legend1;
      case "WTRPRS(485)":
        return _legend2;
      case "WTRTEMP(485)":
        return _legend3;
      default:
        return null;
    }
  }
  const getDataSet = () => {
    let _dataSet = [];
    data.map((item,index)=>{
      // {name: 'L1- FREEZER MS', temperature: -21, humidity: -959.04}
      let _NAME = item['name'] ? item['name'] : 'NA'
      let _TEMP = item['temperature'] ? item['temperature'].toFixed(2) : null;
      let _HUMD = item['humidity'] ? (item['humidity'] > -900 ? item['humidity'].toFixed(2) : null) : null;
      let _SPEED = item['velocity'] ? item['velocity'] : null;
      let _PRESSURE = item['pressure'] ? item['pressure'] : null;
      let _data;
      switch (type) {
        case "AIRRH(485)":
          _data = [_NAME,_TEMP];
          break;
        case "WISENSOR":
          _data = [_NAME,_TEMP,_HUMD];
          break;
        case "AIRFLW(485)":
          _data = [_NAME,_SPEED];
          break;
        case "WTRPRS(485)":
          _data = [_NAME,_PRESSURE];
          break;        
        case "WTRTEMP(485)":
          _data = [_NAME,_TEMP];
          break;        
        default:
          _data = [];
          break;
      }
      _dataSet.push(_data);
      return null;
    })
    // console.log(_keys)
    return _dataSet;
  }

  let option1 = {
    title: { text: `${title}`, subtext: `${new Date().toLocaleString()}`, left: 'center', },
    tooltip: { trigger: 'axis' },
    legend: { data: getLegends(), left:'25px' },
    dataset : { source: getDataSet() },
    toolbox: {
      show: true,
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar'] },
        restore: { show: true },
        saveAsImage: { show: true }
      }
    },
    calculable: true,
    xAxis: { type: 'category', axisLabel:{ rotate: 25 } },
    yAxis: [ 
      {
        type: 'value',scale: true, name: 'RH',position: 'right', alignTicks: true,
        axisLine: { show: true, lineStyle: { color: colors[0] } },
        axisLabel: { formatter: '{value} %' }
      },
      {
        type: 'value', scale: true, name: 'TEMP', position: 'left', alignTicks: true,
        axisLine: { show: true, lineStyle: { color: colors[1] } },
        axisLabel: { formatter: '{value} °C' }
      },
    ],
    series: [ 
      { name: 'TEMP',  yAxisIndex: 1, type: 'bar', 
        markPoint: { data: [ { type: 'max', name: 'Max' }, { type: 'min', name: 'Min' } ] },   
        markLine: { data: [{ type: 'average', name: 'Avg' }], label: { distance: [-100, 100] } }  },
      { name: 'RH',  yAxisIndex: 0, type: 'bar', 
        markPoint: { data: [ { type: 'max', name: 'Max' }, { type: 'min', name: 'Min' } ] },   
        markLine: { data: [{ type: 'average', name: 'Avg' }], label: { distance: [-50, 100] } }  } 
    ]
  };
  let option2 = {
    title: { text: `${title}`, subtext: `${new Date().toLocaleString()}`, left: 'center', },
    tooltip: { trigger: 'axis' },
    legend: { data: getLegends(), left:'25px' },
    dataset : { source: getDataSet() },
    toolbox: {
      show: true,
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar'] },
        restore: { show: true },
        saveAsImage: { show: true }
      }
    },
    calculable: true,
    xAxis: { type: 'category', axisLabel:{ rotate: 25 } },
    yAxis: [ 
      {
        type: 'value',scale: true, name: 'SPEED',position: 'left', alignTicks: true,
        axisLine: { show: true, lineStyle: { color: colors[0] } },
        axisLabel: { formatter: '{value} m/s' }
      }
    ],
    series: [ 
      { name: 'SPEED',  yAxisIndex: 0, type: 'bar', 
        markPoint: { data: [ { type: 'max', name: 'Max' }, { type: 'min', name: 'Min' } ] },   
        markLine: { data: [{ type: 'average', name: 'Avg' }], label: { distance: [-100, 100] } }  }
    ]

  }
  let option3 = {
    title: { text: `${title}`, subtext: `${new Date().toLocaleString()}`, left: 'center', },
    tooltip: { trigger: 'axis' },
    legend: { data: getLegends(), left:'25px' },
    dataset : { source: getDataSet() },
    toolbox: {
      show: true,
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar'] },
        restore: { show: true },
        saveAsImage: { show: true }
      }
    },
    calculable: true,
    xAxis: { type: 'category', axisLabel:{ rotate: 25 } },
    yAxis: [ 
      {
        type: 'value',scale: true, name: 'SPEED',position: 'left', alignTicks: true,
        axisLine: { show: true, lineStyle: { color: colors[0] } },
        axisLabel: { formatter: '{value} °C' }
      }
    ],
    series: [ 
      { name: 'TEMPERATURE',  yAxisIndex: 0, type: 'bar', 
        markPoint: { data: [ { type: 'max', name: 'Max' }, { type: 'min', name: 'Min' } ] },   
        markLine: { data: [{ type: 'average', name: 'Avg' }], label: { distance: [-100, 100] } }  }
    ]

  }
  let option4 = {
    title: { text: `${title}`, subtext: `${new Date().toLocaleString()}`, left: 'center', },
    tooltip: { trigger: 'axis' },
    legend: { data: getLegends(), left:'25px' },
    dataset : { source: getDataSet() },
    toolbox: {
      show: true,
      feature: {
        dataView: { show: true, readOnly: false },
        magicType: { show: true, type: ['line', 'bar'] },
        restore: { show: true },
        saveAsImage: { show: true }
      }
    },
    calculable: true,
    xAxis: { type: 'category', axisLabel:{ rotate: 25 } },
    yAxis: [ 
      {
        type: 'value',scale: true, name: 'SPEED',position: 'left', alignTicks: true,
        axisLine: { show: true, lineStyle: { color: colors[0] } },
        axisLabel: { formatter: '{value} bar' }
      }
    ],
    series: [ 
      { name: 'PRESSURE',  yAxisIndex: 0, type: 'bar', 
        markPoint: { data: [ { type: 'max', name: 'Max' }, { type: 'min', name: 'Min' } ] },   
        markLine: { data: [{ type: 'average', name: 'Avg' }], label: { distance: [-100, 100] } }  }
    ]

  }
  const getOption = () => {
    switch (type) {
      case "AIRRH(485)":
        return option3;
      case "WISENSOR":
        return option1;
      case "AIRFLW(485)":
        return option2;
      case "WTRPRS(485)":
        return option4;
      case "WTRTEMP(485)":
        return option3;
      default:
        return null;
    }
  }

  return <ReactECharts option={getOption()} style={{margin:"10px",width:'95%',height:'300px'}} />;
};

export default Page;