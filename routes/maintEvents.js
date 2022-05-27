const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');

const MaintEvents = require('../models/MaintEvent');
var util = require('util');
var debug = util.debuglog('workers');

var helpers = require('../lib/helpers');
const _data = require('../lib/data');
const _logs = require('../lib/logs');

// @route     GET api/MaintEvents
// @desc      Get all MaintEvents
// @access    Private
router.get('/', auth, async (req, res) => {
  // -------------------------------------
  let totalLines = Number(req.query.totalLines);
  let companyname = req.query.companyname;
  let email = req.query.email;
  // --------------------  
  totalLines = isNaN(parseFloat(totalLines)) ? 10 : totalLines;
  let date0 = req.query.date0 ? req.query.date0 : null;
  let date1 = req.query.date1 ? req.query.date1 : null;
  // ----------------------------------
  _logs.read('_MAINTEVENTS',totalLines,date0,date1,true,function(err,maintEventLogs) {
    // -----------
    console.log(`[${"MAINTEVENTS.JS".blue}]...${err}`);
    console.log(`[${"MAINTEVENTS.JS".blue}]... API/MAINTEVENTS/ [${"GET".green}] ..<${companyname.blue}> <${email.yellow}> <.${maintEventLogs.length}.>`);
    res.status(200).json(maintEventLogs);
    // -----------
  })
});

// @route     POST api/MaintEvents
// @desc      Add new MaintEvent
// @access    Private
router.post('/',auth, async (req, res) => {
    // ----------------------------------
    console.log(`[${"MAINTEVENTS.JS".blue}]... API/MAINTEVENTS/ADD [${"POST".green}]`);
    // -------------------
   // Convert the data to a string
   var logString = JSON.stringify(req.body);   
   _logs.append('_MAINTEVENTS',logString,function(err){
    if(!err){
      debug("Logging to file succeeded");
      res.status(200).json(logString);
    } else {
      debug("Logging to file failed");
    }
  });
  },
);

// @route     PUT api/MaintEvents
// @desc      Add new MaintEvent
// @access    Private
router.put('/:id',auth, async (req, res) => {
    // ----------------------------------
    console.log(`[${"MAINTEVENTS.JS".blue}]... API/MAINTEVENTS/UPDATE [${"PUT".green}] ..<${req.params.id}|${req.body.id}>`);
    // -------------------
    _logs.read('_MAINTEVENTS',9999,null,null,true,function(err,maintEventLogs) {
      // ---------------------------------------
      let _filtered = maintEventLogs.filter(item => item.id !== req.body.id);
      let _founds =  maintEventLogs.filter(item => item.id === req.body.id);
      let _found = _founds[0];
      console.log(`...TOTAL=${maintEventLogs.length}... FILTER=${_filtered.length}.. FOUND=${_founds.length}....`)
      _found = {..._found,
        date:req.body.date,
        time:req.body.time,
        from:req.body.from,
        to:req.body.to,
        title:req.body.title,
        location:req.body.location,
        description:req.body.description}
      // --------------------
      _filtered.push(_found);
      _logs.delete('_MAINTEVENTS',function(err) {
        console.log(`...LOGS DELETE... <${err}>`)
        _filtered.forEach(element => {
          var logString = JSON.stringify(element);
          // ---------
          _logs.append('_MAINTEVENTS',logString,function(err){
           if(!err){
             debug("Logging to file succeeded");
            } else {
              debug("Logging to file failed");
            }
          });        
        });
        res.status(200).json(_found);
      });
    });
  },
);


// @route     DELETE api/MaintEvents
// @desc      DELETE  MaintEvent
// @access    Private
router.delete('/:id',auth, async (req, res) => {
  // -------------------------------------
  // AUTH MIDDLEWARE WILL VERIFY THE TOKEN
  //  ------------------------------------
  console.log(`.. <${'MAINTEVENTS.JS'.magenta}> ..${req.baseUrl.toUpperCase().yellow} [${req.method.green}]  <${req.params.id}|${req.body.id}>`)  
  _logs.read('_MAINTEVENTS',9999,null,null,true,function(err,maintEventLogs) {
    // ---------------------------------------
    let _filtered = maintEventLogs.filter(item => item.id !== req.params.id);
    let _founds =  maintEventLogs.filter(item => item.id === req.params.id);
    console.log(`..TOTAL=${maintEventLogs.length}. FILTERED=${_filtered.length} ..FOUND=${_founds.length}`)
    // -----------
    _logs.delete('_MAINTEVENTS',function(err) {
      // -------
      console.log(`... FILE DELETED...${err}..`);
      _filtered.forEach(element => {
        var logString = JSON.stringify(element);
        // ---------
        _logs.append('_MAINTEVENTS',logString,function(err){
         if(!err){
           debug("Logging to file succeeded");
          } else {
            debug("Logging to file failed");
          }
        });        
      });
      res.status(200).json({});
    });
  });
});

module.exports = router;
