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
    deleteUser
} = require('../controllers/userController')
const {
    userAuth,
    isAdminAuthorized,
    isSuperAdminAuthorized,
    loginAuth
} = require('../middlewares/authMiddleware')


const express = require('express');
const router = express.Router();



// Normal Users
router.post('/signup', registration)
router.put('/verify/:id/:token', verifyEmail)
router.put('/re-verify', resendEmailVerification)
router.post('/login', logIn)
router.put('/logout/:id', signOut)
router.get('/loginusers', allLoginUsers)
router.put('/changepassword/:id', changePassword)
router.post('/changepassword/:id/:token', resetPassword)
router.post('/resetemail', forgotPassword)


// Amin Users routes
router.get('/allusers', userAuth, isAdminAuthorized, loginAuth, allUsers)
router.post('/:adminId/updateusers/:id', userAuth, isAdminAuthorized, loginAuth, updateUsers)
router.delete('/:adminId/deleteUsers/:id', userAuth, isAdminAuthorized, loginAuth, deleteUser)


// Super Admin routes


















module.exports = router;

