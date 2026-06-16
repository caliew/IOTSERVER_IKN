/*
 * routes/companies.js — File-based Company configuration
 *
 * Stores company configurations in: .data/companies/[COMPANY_NAME].json
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cors = require('cors');
const _data = require('../lib/data');

router.use(cors({ origin: '*' }));

// ------------------------------------------------------------------
// @route     PUT /api/companies/:id
// @desc      Update company settings
// @access    Private
// ------------------------------------------------------------------
router.put('/:id', auth, (req, res) => {
  const companyKey = req.params.id; // Company ID / Company Name
  console.log(`[COMPANIES] PUT ${companyKey}`);

  const { companyname, notification_emails, status, date } = req.body;

  _data.read('companies', companyKey, (err, companyData) => {
    // If not found, initialize new company object
    const updatedCompany = companyData || {
      id: companyKey,
      companyname: companyname || companyKey,
    };

    if (companyname) updatedCompany.companyname = companyname;
    if (status !== undefined) updatedCompany.status = (status === 'true' || status === true);
    if (date) updatedCompany.date = date;
    if (notification_emails) updatedCompany.notification_emails = notification_emails;

    _data.update('companies', companyKey, updatedCompany, (err) => {
      if (err) {
        // Try creating if update failed because file doesn't exist
        _data.create('companies', companyKey, updatedCompany, (err2) => {
          if (err2) {
            console.error('[COMPANIES] Error saving company:', err2);
            return res.status(500).json({ msg: 'Server Error' });
          }
          return res.json(updatedCompany);
        });
      } else {
        return res.json(updatedCompany);
      }
    });
  });
});

// ------------------------------------------------------------------
// @route     GET /api/companies
// @desc      Get all companies
// @access    Private
// ------------------------------------------------------------------
router.get('/', auth, (req, res) => {
  console.log('[COMPANIES] GET /');
  _data.list('companies', (err, companyList) => {
    if (err || !companyList || companyList.length === 0) {
      return res.status(200).json([]);
    }

    const companies = [];
    let count = 0;

    companyList.forEach((companyKey) => {
      _data.read('companies', companyKey, (err, companyData) => {
        count++;
        if (!err && companyData) {
          companies.push(companyData);
        }

        if (count === companyList.length) {
          res.json(companies);
        }
      });
    });
  });
});

module.exports = router;