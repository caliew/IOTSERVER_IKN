import React from 'react';
import { range } from 'd3-array';

import { color } from '@data-ui/theme';

import {
  Sparkline,
  LineSeries,
  PointSeries,
  BandLine,
  HorizontalReferenceLine,
  VerticalReferenceLine,
  WithTooltip,
  PatternLines,
} from '@data-ui/sparkline';


import Example from './Example';

PatternLines.displayName = 'PatternLines';

const sparklineProps = {
  ariaLabel: 'This is a Sparkline of...',
  width: 250,
  height: 130,
  margin: { top: 20, right: 10, bottom: 20, left: 10 },
  valueAccessor: d => d.y,
};

const randomData = n =>
  range(n).map((_, i) => ({
    y: Math.random() * (Math.random() > 0.2 ? 1 : 2),
    x: `${i + 1}`,
  }));

const renderLabel = d => d.toFixed(2);

/* eslint-disable react/prop-types */
const renderTooltip = (
  { datum }, // eslint-disable-line react/prop-types
) => (
  <div>
    {datum.x && <div>{datum.x}</div>}
    <div>{datum.y ? datum.y.toFixed(2) : '--'}</div>
  </div>
);
/* eslint-enable react/prop-types */

const SparklinePlots = ({systemComponent,sensorData,dataName,limits}) => {
  // -----------
  if (sensorData === undefined) sensorData = randomData(35);
  return (
    <div className="d-flex row p-2 justify-content-center">
      {plot6(sensorData,dataName,limits)}
    </div>
  )
}

/*
const plot1 = () => {
  return(
    (data => (
      <Example>
        <WithTooltip renderTooltip={renderTooltip}>
          {({ onMouseMove, onMouseLeave, tooltipData }) => (
            <Sparkline {...sparklineProps} onMouseLeave={onMouseLeave} onMouseMove={onMouseMove} data={data} >
              <BarSeries
                fill={(d, i) => {
                  const indexToHighlight = tooltipData ? tooltipData.index : 5;
                  return allColors.grape[i === indexToHighlight ? 8 : 2];
                }}
                fillOpacity={0.8}
                renderLabel={(d, i) => {
                  const indexToHighlight = tooltipData ? tooltipData.index : 5;
                  return i === indexToHighlight ? '🤔' : null;
                }}
              />
            </Sparkline>
          )}
        </WithTooltip>
      </Example>
    ))(randomData(35))
  )
}
const plot2 = () => {
  return (
    data => (
    <Example>
      <WithTooltip renderTooltip={renderTooltip}>
        {({ onMouseMove, onMouseLeave, tooltipData }) => (
          <Sparkline {...sparklineProps} onMouseLeave={onMouseLeave} onMouseMove={onMouseMove} data={data} >
            <PatternLines id="area_pattern" height={4} width={4} stroke={allColors.indigo[4]} strokeWidth={1} orientation={['diagonal']} />
            <LineSeries showArea stroke={allColors.indigo[5]} fill="url(#area_pattern)" />
            <PointSeries points={['all']} stroke={allColors.indigo[4]} fill="#fff" size={3} />
            <PointSeries
              points={['last']}
              fill={allColors.indigo[5]}
              renderLabel={renderLabel}
              labelPosition="right"
            />
            {tooltipData && [
              <VerticalReferenceLine
                key="ref-line"
                strokeWidth={1}
                reference={tooltipData.index}
                strokeDasharray="4 4"
              />,
              <PointSeries
                key="ref-point"
                points={[tooltipData.index]}
                fill={allColors.indigo[5]}
              />,
            ]}
          </Sparkline>
        )}
      </WithTooltip>
    </Example>
  ))(randomData(25))
}
const plot3 = () => {
  return (
    data => (
    <Example>
      <WithTooltip renderTooltip={renderTooltip}>
        {({ onMouseMove, onMouseLeave, tooltipData }) => (
          <Sparkline
            {...sparklineProps}
            onMouseLeave={onMouseLeave}
            onMouseMove={onMouseMove}
            data={data}
          >
            <LineSeries
              stroke={color.categories[2]}
              strokeDasharray="2,2"
              strokeLinecap="butt"
            />
            <PointSeries
              points={['all']}
              size={3}
              fill={color.categories[2]}
              strokeWidth={0}
            />
            <PointSeries
              points={['min', 'max']}
              fill={color.categories[1]}
              size={5}
              stroke="#fff"
              renderLabel={renderLabel}
            />
            {tooltipData && [
              <VerticalReferenceLine
                key="ref-line"
                strokeWidth={1}
                reference={tooltipData.index}
                strokeDasharray="4 4"
              />,
              <PointSeries
                key="ref-point"
                points={[tooltipData.index]}
                fill="#fff"
                stroke={color.categories[2]}
              />,
            ]}
          </Sparkline>
        )}
      </WithTooltip>
    </Example>
  ))(randomData(25))
}
const plot4 = () => {
  return (
    data => (
    <Example>
      <WithTooltip renderTooltip={renderTooltip}>
        {({ onMouseMove, onMouseLeave, tooltipData }) => (
          <Sparkline {...sparklineProps} onMouseLeave={onMouseLeave} onMouseMove={onMouseMove} data={data} >
            <HorizontalReferenceLine stroke={allColors.cyan[8]} strokeWidth={1} strokeDasharray="4 4" />
            <LineSeries stroke={allColors.cyan[4]} />
            <PointSeries points={['first', 'last']} fill={allColors.cyan[7]} size={5} stroke="#fff" renderLabel={renderLabel} labelPosition={(d, i) => (i === 0 ? 'left' : 'right')} />
            {tooltipData && [
              <VerticalReferenceLine key="ref-line" strokeWidth={1} reference={tooltipData.index} strokeDasharray="4 4" />,
              <PointSeries key="ref-point" points={[tooltipData.index]} fill={color.categories[1]} />,
            ]}
          </Sparkline>
        )}
      </WithTooltip>
    </Example>
  ))(randomData(25))
}
const plot5 = () => {
  return (
    data => (
    <Example>
      <WithTooltip renderTooltip={renderTooltip}>
        {({ onMouseMove, onMouseLeave, tooltipData }) => (
          <Sparkline {...sparklineProps} onMouseLeave={onMouseLeave} onMouseMove={onMouseMove} data={data} >
            <PatternLines id="band_pattern" height={6} width={6} stroke={allColors.grape[6]} strokeWidth={1} orientation={['diagonal']} />
            <BandLine fill="url(#band_pattern)" />
            <HorizontalReferenceLine stroke={allColors.grape[8]} strokeWidth={1} strokeDasharray="4 4" reference="median" />
            <VerticalReferenceLine reference="min" stroke={allColors.grape[3]} strokeWidth={1} strokeDasharray="4 4" />
            <VerticalReferenceLine reference="max" stroke={allColors.grape[3]} strokeWidth={1} strokeDasharray="4 4" />
            <LineSeries stroke={allColors.grape[7]} />
            <PointSeries points={['min', 'max']} fill={allColors.grape[3]} size={5} stroke="#fff" renderLabel={renderLabel} />
            {tooltipData && [
              <VerticalReferenceLine key="ref-line" strokeWidth={1} reference={tooltipData.index} strokeDasharray="4 4" />,
              <PointSeries key="ref-point" points={[tooltipData.index]} fill={allColors.grape[3]} />,
            ]}
          </Sparkline>
        )}
      </WithTooltip>
    </Example>))(randomData(45)
    )
}*/
const plot6 = (data,title,limits) => {
  let _MIN;
  let _MAX;
  if (limits) {
    const values = Object.values(limits);
    _MIN = values[0];
    _MAX = values[1];
  }
  // let _MAX = limits[TEMPERATURE_MAX];
  // let _MIN = limits[TEMPERATURE_MIN];
  return (
    <Example title={title}>
      <WithTooltip renderTooltip={renderTooltip}>
        {({ onMouseMove, onMouseLeave, tooltipData }) => (
          <Sparkline {...sparklineProps} onMouseLeave={onMouseLeave} onMouseMove={onMouseMove} data={data} >
            <PatternLines id="band_pattern_hash" height={7} width={7} stroke={color.grays[5]} strokeWidth={1} orientation={['vertical', 'horizontal']} />
            <BandLine fill="url(#band_pattern_hash)" stroke={color.grays[5]} band={{ from: {}, to: {} }} />
            <HorizontalReferenceLine stroke={color.grays[8]} strokeWidth={1} strokeDasharray="4 4" reference="median" />

            <HorizontalReferenceLine stroke="#FF0000" strokeWidth={2} strokeDasharray="1 1" reference={_MAX} />
            
            <BandLine fill="#f2f549" band={{ from: { y: _MIN }, to: { y: _MAX } }} />

            <LineSeries stroke={color.grays[7]} />
            <PointSeries points={['min', 'max']} fill={color.grays[5]} size={5} stroke="#fff" renderLabel={renderLabel} />
            {tooltipData && [ 
              <VerticalReferenceLine key="ref-line" strokeWidth={1} reference={tooltipData.index} strokeDasharray="4 4" />,
              <PointSeries key="ref-point" points={[tooltipData.index]} fill={color.grays[8]} />,
            ]}
          </Sparkline>
        )}
      </WithTooltip>
    </Example>)
}


export default SparklinePlots;