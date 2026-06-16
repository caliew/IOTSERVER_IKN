/*
 * routes/contacts.js — File-based Contact management
 *
 * Stores contacts in: .data/contacts/[CONTACT_ID].json
 */

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const cors = require('cors');
const _data = require('../lib/data');
const helpers = require('../lib/helpers');

router.use(cors({ origin: '*' }));

// ------------------------------------------------------------------
// @route     GET /api/contacts
// @desc      Get all user's contacts
// @access    Private
// ------------------------------------------------------------------
router.get('/', auth, (req, res) => {
  const currentUserId = req.user.id; // Uppercase email
  console.log(`[CONTACTS] GET / for user: ${currentUserId}`);

  _data.list('contacts', (err, contactList) => {
    if (err || !contactList || contactList.length === 0) {
      return res.status(200).json([]);
    }

    const contacts = [];
    let count = 0;

    contactList.forEach((contactId) => {
      _data.read('contacts', contactId, (err, contactData) => {
        count++;
        if (!err && contactData && contactData.user === currentUserId) {
          contacts.push(contactData);
        }

        if (count === contactList.length) {
          // Sort by date newest first
          contacts.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
          res.json(contacts);
        }
      });
    });
  });
});

// ------------------------------------------------------------------
// @route     POST /api/contacts
// @desc      Add new contact
// @access    Private
// ------------------------------------------------------------------
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
    ],
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, phone, type } = req.body;
    const currentUserId = req.user.id;
    const contactId = helpers.createRandomString(20);

    const newContact = {
      _id: contactId,
      id: contactId,
      name,
      email,
      phone,
      type,
      user: currentUserId,
      date: new Date().toISOString(),
    };

    _data.create('contacts', contactId, newContact, (err) => {
      if (err) {
        console.error('[CONTACTS] Error saving contact file:', err);
        return res.status(500).json({ msg: 'Server Error' });
      }
      res.json(newContact);
    });
  }
);

// ------------------------------------------------------------------
// @route     PUT /api/contacts/:id
// @desc      Update contact
// @access    Private
// ------------------------------------------------------------------
router.put('/:id', auth, (req, res) => {
  const contactId = req.params.id;
  const currentUserId = req.user.id;
  console.log(`[CONTACTS] PUT ${contactId} by user: ${currentUserId}`);

  const { name, email, phone, type } = req.body;

  _data.read('contacts', contactId, (err, contactData) => {
    if (err || !contactData) {
      return res.status(404).json({ msg: 'Contact not found' });
    }

    // Verify ownership
    if (contactData.user !== currentUserId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    if (name) contactData.name = name;
    if (email) contactData.email = email;
    if (phone) contactData.phone = phone;
    if (type) contactData.type = type;

    _data.update('contacts', contactId, contactData, (err) => {
      if (err) {
        console.error('[CONTACTS] Error updating contact file:', err);
        return res.status(500).json({ msg: 'Server Error' });
      }
      res.json(contactData);
    });
  });
});

// ------------------------------------------------------------------
// @route     DELETE /api/contacts/:id
// @desc      Delete contact
// @access    Private
// ------------------------------------------------------------------
router.delete('/:id', auth, (req, res) => {
  const contactId = req.params.id;
  const currentUserId = req.user.id;
  console.log(`[CONTACTS] DELETE ${contactId} by user: ${currentUserId}`);

  _data.read('contacts', contactId, (err, contactData) => {
    if (err || !contactData) {
      return res.status(404).json({ msg: 'Contact not found' });
    }

    // Verify ownership
    if (contactData.user !== currentUserId) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    _data.delete('contacts', contactId, (err) => {
      if (err) {
        console.error('[CONTACTS] Error deleting contact file:', err);
        return res.status(500).json({ msg: 'Server Error' });
      }
      res.json({ msg: 'Contact removed' });
    });
  });
});

module.exports = router;
