/*
 * EXPRESS SERVER RELATED TASKS
 *
 */
const express = require('express');
const config = require("./config");
var _data = require('./data');
const colors = require('colors');
const Sensor = require('../models/Sensor');
const _logs = require('../lib/logs');

// Instantiate the server module object
var server = {};

server.init = function() {
    const bodyParser = require('body-parser');
    const pdf = require('html-pdf');
    const cors = require('cors');
    const pdfTemplate = require('./reports/ikn');
    const path = require('path');
    // -------------------
    const app = express();
    // -------------------------
    // SERVE THE REACT APP FILES
    // -------------------------
    app.use(express.static(`${__dirname}/client/build`));
    // ---------------
    // INIT MIDDLEWARE
    // ---------------
    app.use(express.json({ extended: false }));
    // -------------
    // DEFINE ROUTES
    // -------------
    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/users', require('../routes/users'));
    app.use('/api/alerts', require('../routes/alerts'));
    app.use('/api/maintEvents',require('../routes/maintEvents'))
    app.use('/api/sensors', require('../routes/sensors'));
    app.use('/api/companies', require('../routes/companies'));
    app.use('/api/contacts', require('../routes/contacts'));

    // ---------------------------------
    // Serve static assets in production
    // ---------------------------------
    if (process.env.NODE_ENV === 'production') {
        // -----------------
        // Set static folder
        app.use(express.static('client/build'));
        app.get('*', (req, res) =>
            res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'))
        );
    }
    // -----
    const PORT = process.env.PORT || config.RESTAPIPort;
    // -----
    app.use(
        cors({
            origin:'*',
        })
    );
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    app.get('/data', (req,res) => {
        // -------
        // console.log(`.. <${'SENSORS.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
        // --------------
        _logs.read('_NIPPONDEMO',10,null,null,false,function(err,sensorData) {
          // -----------------------------
          let ObjData = {};
          ObjData['sensorData'] = sensorData;
          // -------------------------
          _logs.read('50-101',10,null,null,false,function(err1,pwrmtrData) {
            // ---------------------------
            ObjData['PWRMTR'] = pwrmtrData;
            // ---------------------------
            _logs.read('50-101_STATE',10,null,null,false,function(err2,pwrmtrDataState) {
              // ------
              ObjData['PWRMTR1'] = pwrmtrDataState;
              // res.status(200).json({ sensorData });
              res.status(200).json( ObjData);
            })
          })
          // ------------------------------
        });
        // res.status(200).send(data);
      })
      

    app.get('/data1',(req,res) => {
        res.json({statusCode:200,payload:{"sensor":'PRESS-01'}});
    })
    
    app.post('/create-pdf', (req, res) => {
        // -------
        console.log(`.. <${'EXPRESSSERVER.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
        let sensorsArr = [];
        let sensorIDs = req.body.reportSensors;
        let _Count = 0;
        sensorIDs.forEach( sensorID => {
            Sensor.findById(sensorID).sort({date: -1}).exec( (error,sensor) => {
                sensorsArr.push(sensor.sensorId);
                _Count += 1;
                if (_Count > sensorIDs.length-1) {
                    let sensorsData = {
                        sensorIDs : sensorIDs,
                        sensorsArr : sensorsArr
                    }
                    pdf.create(pdfTemplate(sensorsData), {}).toFile('./lib/reports/report.pdf', (err) => {
                        if(err) { res.send(Promise.reject()) }
                        res.send(Promise.resolve());
                    });
                }
            });
        })
        // ------
    });

    app.get('/fetch-pdf-NOV2021', (req, res) => {
        // --------
        console.log(`.. <${'EXPRESSSERVER.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
        res.sendFile(`${__dirname}/reports/NOV 2021 Monthly Report.pdf`)
    })
    app.get('/fetch-pdf-DEC2021', (req, res) => {
        // --------
        console.log(`.. <${'EXPRESSSERVER.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
        res.sendFile(`${__dirname}/reports/DEC 2021 Monthly Report.pdf`)
    })
    app.get('/fetch-pdf-JAN2022', (req, res) => {
        // --------
        console.log(`.. <${'EXPRESSSERVER.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
        res.sendFile(`${__dirname}/reports/JAN 2022 Monthly Report.pdf`)
    })
    app.get('/fetch-pdf-FEB2022', (req, res) => {
        // --------
        console.log(`.. <${'EXPRESSSERVER.JS'.magenta}> ..${req.originalUrl.toUpperCase().yellow} [${req.method.green}]`)
        res.sendFile(`${__dirname}/reports/FEB 2022 Monthly Report.pdf`)
    })
    // -----------------------
    app.listen(PORT, () => console.log(`REST API Server started on port ${config.RESTAPIPort}`));    
    console.log(
        "\x1b[36m%s\x1b[0m",
        "The REST API Server is running on port " + PORT
    );
    // --------
}

// Export the module
module.exports = server;