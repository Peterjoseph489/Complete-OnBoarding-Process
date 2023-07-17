const {
    registration,
    verifyEmail,
    resendEmailVerification,
    logIn,
    signOut,
    allLoginUsers,
    changePassword,
    forgotPassword
} = require('../controllers/userController')
const {
    userAuth
} = require('../middlewares/authMiddleware')


const express = require('express');
const router = express.Router();


router.post('/signup', registration)
router.put('/verify/:id/:token', verifyEmail)
router.put('/re-verify', resendEmailVerification)
router.post('/login', logIn)
router.put('/logout/:id', signOut)
router.get('/loginusers', allLoginUsers)
router.put('/changepassword/:id', changePassword)
router.put('/changepassword/:id', forgotPassword)

module.exports = router;

