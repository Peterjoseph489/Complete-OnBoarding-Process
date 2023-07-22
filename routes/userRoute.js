const {
    registration,
    verifyEmail,
    resendEmailVerification,
    logIn,
    signOut,
    allLoginUsers,
    changePassword,
    forgotPassword,
    resetPassword,
    allUsers,
    updateUsers,
    deleteUser,
    createAdmin,
    allAdminUsers,
    makeAdmin,
    verifyMakeAdmin,
    makeSuperAdmin,
    verifyMakeSuperAdmin
} = require('../controllers/userController')
const {
    userAuth,
    isAdminAuthorized,
    isSuperAdminAuthorized,
    loginAuth
} = require('../middlewares/authMiddleware')


const express = require('express');
const router = express.Router();



// Major Routes for Normal USERS
router.post('/signup', registration)
router.put('/verify/:id/:token', verifyEmail)
router.put('/re-verify', resendEmailVerification)
router.post('/login', logIn)
router.put('/logout/:id',  loginAuth, signOut)
router.put('/changepassword/:id', changePassword)
router.post('/changepassword/:id/:token', resetPassword)
router.post('/resetemail', forgotPassword)


// Major Routes for ADMIN USERS routes
router.post('/:adminId/updateusers/:id', userAuth, loginAuth, isAdminAuthorized, updateUsers)
router.delete('/:adminId/deleteUsers/:id', userAuth, loginAuth, isAdminAuthorized, deleteUser)


// Major Routes for SUPER ADMIN routes
router.get('/allusers', userAuth, loginAuth, isSuperAdminAuthorized, allUsers)
router.get('/loginusers', userAuth, loginAuth, isSuperAdminAuthorized, allLoginUsers)
router.post('/createAdmin', userAuth, loginAuth, isSuperAdminAuthorized, createAdmin);
router.get('/allAdminUsers', userAuth, loginAuth, isSuperAdminAuthorized, allAdminUsers);
router.post('/makeAdmin/:userId', userAuth, loginAuth, isSuperAdminAuthorized, makeAdmin);
router.put('/verifyMakeAdmin/:id/:token', userAuth, loginAuth, isSuperAdminAuthorized, verifyMakeAdmin);
router.post('/makeSuperAdmin/:userId', userAuth, loginAuth, isSuperAdminAuthorized, makeSuperAdmin);
router.put('/verifyMakeSuperAdmin/:id/:token', userAuth, loginAuth, isSuperAdminAuthorized, verifyMakeSuperAdmin);



module.exports = router;

