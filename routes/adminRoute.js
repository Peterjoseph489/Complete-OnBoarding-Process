const {
    createAdmin,
    verifyAdminEmail,
    resendAdminEmailVerification,
    logIn,
    signOutAdmin,
    allAdminUsers,
    updateAdmin,
    makeAdmin,
    verifyMakeAdmin,
    deleteUser
} = require('../controllers/superAdminController');

const express = require('express');
const routerr = express.Router();

routerr.post('/createAdmin', createAdmin);
routerr.put('/verifyAdminEmail/:id/:token', verifyAdminEmail);
routerr.put('/resendAdminEmailVerification', resendAdminEmailVerification);
routerr.post('/adminLogin', logIn);
routerr.put('logout/:id', signOutAdmin);
routerr.get('/allAdminUsers', allAdminUsers);
routerr.put('/updateAdmin/:adminId', updateAdmin);
routerr.post('/makeAdmin/:userId', makeAdmin);
routerr.put('/verifyMakeAdmin/:id/:token', verifyMakeAdmin);
routerr.delete('/deleteUser/:adminId', deleteUser);


module.exports = routerr;