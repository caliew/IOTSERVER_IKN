import React from 'react';

class ReactLEDDisplay extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            value:props.displayValue,
            lookUpValues:[123, 10, 55, 31, 78, 93, 125, 11, 127, 95],
            foregroundCol:props.foregroundCol,
            backgroundCol:props.backgroundCol,
            borderCol:props.borderCol,
            skew:props.skew,
            ledSize:+props.ledSize,
            width:+props.width
        };
    }

    componentWillReceiveProps(nextProps) {
        this.setState(nextProps);
    }
    GetForeGroundCOl(value) {
        return (Number(this.state.value) > 23) ? '#ff0000' : '#000000'
    }
    GetNEGSign(width,height,skew,ledSize,barSize,foregroundCol,backgroundCol,borderCol) {
        console.log('..NEGATIVE SIGN...')
        return(
        <svg width={+width + 4} height={+height} transform={skew}>
            <rect x={ledSize} y={barSize + (ledSize)} rx="2" ry="2" width={barSize} height={ledSize} style={{fill: foregroundCol, stroke:borderCol, opacity:'0.8'}}  />
        </svg>
        )
    }
    GetDot(width,height,skew,ledSize,barSize,foregroundCol,backgroundCol,borderCol) {
        return (
            <svg width={+ledSize + 4} height={+height} transform={skew}>
                <rect x="0" y={(barSize * 2) + (ledSize * 2)} rx="2" ry="2" width={ledSize} height={ledSize} style={{fill: foregroundCol, stroke:borderCol, opacity:'0.8'}}  />
            </svg>
        )
    }
    GetLEDOnNumber(value,width,height,skew,ledSize,barSize,foregroundCol,backgroundCol,borderCol) {
        return (
            <svg width={+width + 4} height={+height} transform={skew}>
                <rect x={ledSize} y="0" rx="2" ry="2" width={barSize} height={ledSize} style={{fill: `${ (value & 1) === 1 ? foregroundCol : backgroundCol}`, stroke:borderCol, opacity:'0.8'}}  />
                <rect x={barSize + ledSize} y={ledSize} rx="2" ry="2" width={ledSize} height={barSize} style={{fill: `${ (value & 2) === 2 ? foregroundCol : backgroundCol}`, stroke:borderCol, opacity:'0.8'}}  />
                <rect x={ledSize} y={barSize + (ledSize)} rx="2" ry="2" width={barSize} height={ledSize} style={{fill: `${ (value & 4) === 4 ? foregroundCol : backgroundCol}`, stroke:borderCol, opacity:'0.8'}}  />
                <rect x={barSize + ledSize} y={barSize + (ledSize * 2)} rx="2" ry="2" width={ledSize} height={barSize} style={{fill: `${ (value & 8) === 8 ? foregroundCol : backgroundCol}`, stroke:borderCol, opacity:'0.8'}}  />
                <rect x={ledSize} y={(barSize * 2) + (ledSize * 2)} rx="2" ry="2" width={barSize} height={ledSize} style={{fill:`${ (value & 16) === 16 ? foregroundCol : backgroundCol}`, stroke:borderCol, opacity:'0.8'}}  />
                <rect x="0" y={barSize + (ledSize * 2)} rx="2" ry="2" width={ledSize} height={barSize} style={{fill:`${ (value & 32) === 32 ? foregroundCol : backgroundCol}`, stroke:borderCol, opacity:'0.8'}}  />
                <rect x="0" y={ledSize} rx="2" ry="2" width={ledSize} height={barSize} style={{fill:`${ (value & 64) === 64 ? foregroundCol : backgroundCol}`, stroke:borderCol, opacity:'0.8'}}  />
            </svg>
        )
    }
    GetDigits(inputValue) {
        const value = +this.state.lookUpValues[inputValue];
        const foregroundCol = this.GetForeGroundCOl(inputValue);
        const backgroundCol = this.state.backgroundCol;
        const borderCol = this.state.borderCol;
        const skew = "skewX(" + this.state.skew + ")";
        const width = +this.state.width;
        const ledSize = +this.state.ledSize;
        const height = (width * 2) + (ledSize * 3);
        const barSize = width - (ledSize * 2);
        // -------
        if (inputValue === '-') return this.GetNEGSign(width,height,skew,ledSize,barSize,foregroundCol,backgroundCol,borderCol);
        // --------
        return inputValue !== '.' ? this.GetLEDOnNumber(value,width,height,skew,ledSize,barSize,foregroundCol,backgroundCol,borderCol) : 
            this.GetDot(width,height,skew,ledSize,barSize,foregroundCol,backgroundCol,borderCol)
    }

    render() {
        // ----
        let inputValue = String(this.state.value);
        const strArray = inputValue.split('');
        return (
            <div style={{display: 'inline-block', position: 'relative'}}>
                {strArray.map((x)=>this.GetDigits(x))}
            </div>
        );
    }
}

ReactLEDDisplay.defaultProps = {
    displayValue: 0,
    foregroundCol: '#ff0000',
    backgroundCol: '#ffffff',
    borderCol: '#808080',
    skew:-7,
    ledSize:6,
    width:28
};

export default ReactLEDDisplay;