const {
    createRecord,
    getRecords,
    getRecord,
    updateRecord,
    deleteRecord
} = require('../controllers/recordController')
const {
    userAuth,
    isAdminAuthorized,
    isSuperAdminAuthorized,
    loginAuth
} = require('../middlewares/authMiddleware')

const express = require('express');
const routere = express.Router();

routere.post('/records/:id', userAuth, loginAuth, createRecord);
routere.get('/record/:id', userAuth, loginAuth, getRecords);
routere.get('/:recordId/records/:id', userAuth, loginAuth, getRecord);
routere.put('/:recordId/records/:id', isAdminAuthorized, loginAuth, updateRecord);
routere.delete('/:recordId/records/:id', isAdminAuthorized, loginAuth, deleteRecord);


module.exports = routere;