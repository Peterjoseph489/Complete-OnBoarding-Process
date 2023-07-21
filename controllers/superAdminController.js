const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const emailSender = require('..//middlewares/email')


const createAdmin = async (req, res)=>{
    try {
        const { username, email, password } = req.body;
        const isEmail = await userModel.findOne({email});
        if (isEmail) {
            res.status(400).json({
                message: `User with this Email: ${email} already exist.`
            })
        } else {
            const salt = await bcrypt.genSalt(10);
            const hashPassword = await bcrypt.hash( password, salt )
            const token = await jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: '1d'});
            const data = {
                username,
                email: email.toLowerCase(),
                password: hashPassword,
                token: token,
                isAdmin: true
            };
            const user = new userModel(data);
            const savedUser = await user.save();
            const subject = 'Kindly Verify'
            const link = `${req.protocol}://${req.get('host')}/api/verifyAdminEmail/${savedUser._id}/${token}`
            const message = `Welcome onBoard, kindly use this link ${link} to verify your account. Kindly note that this link will expire after 5(five) Minutes.`
            emailSender({
                email: savedUser.email,
                subject,
                message
            });
            if (!savedUser) {
                res.status(400).json({
                    message: 'Failed to Create Account'
                })
            } else {
                res.status(201).json({
                    message: 'Successfully created account',
                    data: savedUser
                });
            }
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};




const verifyAdminEmail = async (req, res)=>{
    try {
        const { id } = req.params;
        const user = await userModel.findById(id);
        const {token} = req.params;
        const registeredToken = token;
        const verified = await userModel.findByIdAndUpdate(id, {isVerified: true})
        await jwt.verify(registeredToken, process.env.JWT_SECRET, (err)=>{
            if(err) {
                res.json('This Link is Expired. Send another Email Verification')
            } else {   
                if (!verified) {
                    res.status(404).json({
                        message: 'User is not verified yet'
                    })
                } else {
                    res.status(200).json({
                        message: `User with Email: ${verified.email} verified successfully`
                    })
                }
            }
        })  
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};




const resendAdminEmailVerification = async(req, res)=>{
    try {
        const { email } = req.body;
        const user = await userModel.findOne({email});
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            })
        }else {
            const verified = await userModel.findByIdAndUpdate(user._id, {isVerified: true})
            const token = await jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: '1d'});
            await jwt.verify(token, process.env.JWT_SECRET, (err)=>{
                if(err) {
                    res.json('This Link is Expired. Please try again')
                } else {   
                    if (!verified) {
                        res.status(404).json({
                            message: 'User is not verified yet'
                        })
                    } else {
                        const subject = 'Kindly RE-VERIFY'
                        const link = `${req.protocol}://${req.get('host')}/api/verify/${user._id}/${token}`
                        const message = `Welcome onBoard, kindly use this link ${link} to re-verify your account. Kindly note that this link will expire after 5(five) Minutes.`
                        emailSender({
                            email: user.email,
                            subject,
                            message
                        });
                        res.status(200).json({
                            message: `Verification email sent successfully to your email: ${user.email}`
                        })
                    }
                }
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};



const logIn = async(req, res)=>{
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({email});
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            });
        } else {
            if (!user.isAdmin){
                res.status(400).json({
                    message: 'You are not an Admin'
                })
            } else {
                if(!user.isVerified) {
                    res.status(400).json({
                        message: 'User not verified'
                    })
                } else {
                    const isPassword = await bcrypt.compare(password, user.password);
                    if(!isPassword) {
                        res.status(400).json({
                            message: 'Incorrect Password'
                        });
                    } else {
                        const userLogout = await userModel.findByIdAndUpdate(user._id, {islogin: true});
                        const token = await genToken(user);
                        res.status(200).json({
                            message: 'Log in Successful',
                            token: token
                        });
                    }
                }
            }
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};



const signOutAdmin = async(req, res)=>{
    try {
        const { id } = req.params;
        token = ' ';
        const userLogout = await userModel.findByIdAndUpdate(id, {token: token}, {islogin: false});
        const logout = await userModel.findByIdAndUpdate(id, {islogin: false});
        // userLogout.token = ' ';
        // user.islogin = false;
        if(!userLogout) {
            res.status(400).json({
                message: 'User not logged out'
            })
        } else {
            res.status(200).json({
                message: 'User Successfully logged out',
                data: userLogout
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};


const allAdminUsers = async (req, res)=>{
    try {
        const adminUsers = await userModel.findAll({isAdmin: true})
        if (adminUsers.length == 0) {
            res.status(404).json({
                message: 'No Login Users at the Moment'
            })
        } else {
            res.status(200).json({
                message: 'All Login Users',
                data: adminUsers
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};



const updateAdmin = async (req, res)=>{
    try {
        const { adminId } = req.params;
        const admin = await userModel.findById(adminId);
        if (!admin.isAdmin) {
            res.status(400).json({
                message: 'This user is not a admin Yet'
            })
        } else {
            const { username, email, password  } = req.body;
            const updateFields = {
                username: username || admin.username,
                email: email || admin.email,
                password: password || admin.password
            };
            const updatedAdmin = await userModel.findByIdAndUpdate(adminId, updateFields, {new:true});
            if(!updatedAdmin){
                res.status(400).json({
                    message: 'Cannot Update this Admin'
                })
            } else {
                res.status(200).json({
                    message: 'Admin Updated Successfully'
                });
            }
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};


const makeAdmin = async (req, res)=>{
    try {
        const { userId } = req.params;
        const token = await jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '5m'});
        // const user = await userModel.findByIdAndUpdate(userId, {isAdmin: true});
        const subject = 'Kindly Verify'
        const link = `${req.protocol}://${req.get('host')}/api/verify/${savedUser._id}/${token}`
        const message = `Welcome onBoard, kindly use this link ${link} to verify your Admin account. Kindly note that this link will expire after 5(five) Minutes.`
        emailSender({
            email: userId.email,
            subject,
            message
        });
        const user = await userModel.findById(userId);
        if (!user) {
            res.status(404).json({
                message: 'User does not Exist'
            })
        } else {
            res.status(200).json({
                message: 'Please check your Email for the Admin Verification Link'
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};



const verifyMakeAdmin = async (req, res)=>{
    try {
        const {token} = req.params;
        const registeredToken = token;
        const { id } = req.params;
        const admin = await userModel.findByIdAndUpdate(id, {isAdmin: true});
        await jwt.verify(registeredToken, process.env.JWT_SECRET, (err)=>{
            if(err) {
                res.json('This Link is Expired. Send another Admin Verification')
            } else {
                if(!admin){
                    res.status(404).json({
                        message: 'Failed to change Password'
                    })
                } else {
                    res.status(200).json({
                        message: `Successfully Updated to Admin`
                    })
                }
            }
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};



const deleteUser = async(req, res)=>{
    try {
        const { adminId } = req.params;
        const deleteAdmin = await userModel.findByIdAndDelete(adminId);
        if(!deleteAdmin) {
            res.status(404).json({
                message: 'Admin not found'
            });
        } else {
            res.status(200).json({
                message: 'Admin deleted successfully'
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};






const genToken = async(user)=>{
    const token = await jwt.sign({
        userId: user._id,
        username: user.username,
        email: user.email
    }, process.env.JWT_SECRET, {expiresIn: '5m'})
    return token
};




module.exports = {
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
}
