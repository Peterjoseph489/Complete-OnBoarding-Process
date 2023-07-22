require('dotenv').config();
const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailSender = require('..//middlewares/email')





// FUNCTIONALITIES FOR USER ALONE
// REGISTER USER 
const registration = async (req, res)=>{
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
                token: token
            };
            const user = new userModel(data);
            const savedUser = await user.save();
            const subject = 'Kindly Verify'
            const link = `${req.protocol}://${req.get('host')}/api/verify/${savedUser._id}/${token}`
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


const verifyEmail = async (req, res)=>{
    try {
        const user = await userModel.findById(req.params.id);
        const {token} = req.params;
        const registeredToken = token;
        const verified = await userModel.findByIdAndUpdate(req.params.id, {isVerified: true})
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




const resendEmailVerification = async(req, res)=>{
    try {
        const { email } = req.body;
        const user = await userModel.findOne({email});
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            })
        }else {
            const verified = await userModel.findByIdAndUpdate(user._id, {isVerified: true}); //This should not be here.
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
}


const logIn = async(req, res)=>{
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({email});
        if (!user) {
            res.status(404).json({
                message: 'User not found'
            });
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
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};



const signOut = async(req, res)=>{
    try {
        const { id } = req.params;
        token = ' ';
        const userLogout = await userModel.findByIdAndUpdate(id, {token: token});
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
}

// Gen-Token Function
const genToken = async(user)=>{
    const token = await jwt.sign({
        userId: user._id,
        username: user.username,
        email: user.email
    }, process.env.JWT_SECRET, {expiresIn: '5m'})
    return token
};


const changePassword = async(req, res)=>{
    try {
        const { password } = req.body;
        const { id } = req.params;
        const userpassword = await userModel.findById(id);
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        const final = await userModel.findByIdAndUpdate(userpassword, {password: hash}, {new: true});
        if (!final) {
            res.status(400).json({
                message: 'Failed to Change Password'
            })
        } else {
            res.status(200).json({
                message: 'Password Changed Successfully',
                data: userpassword
            })
        }

    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}


const forgotPassword = async (req, res)=>{
    try {
        const { email } = req.body;
        const isEmail = await userModel.findOne({ email });
        if (!isEmail) {
            res.status(404).json({
                message: 'Email not found'
            })
        } else {
            const token = jwt.sign({
                id:isEmail.id
            }, process.env.JWT_SECRET, {expiresIn: '5m'})
            const subject = 'Link for Reset password'
            const link = `${req.protocol}://${req.get('host')}/api/changepassword/${isEmail._id}/${token}`
            const message = `Forgot your Password? it's okay, kindly use this link ${link} to re-set your account password. Kindly note that this link will expire after 5(five) Minutes.`
            emailSender({
                email,
                subject,
                message
            });
            res.status(200).json({
                message: 'Email sent successfully, please check your Email for the link to reset your Password'
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};


const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const registeredToken = token;
        const { password } = req.body;
        const { id } = req.params;
        const userpassword = await userModel.findById(id);
        if (!userpassword) {
            res.status(404).json({
                message: 'User not found'
            })
        } else {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            const final = await userModel.findByIdAndUpdate(userpassword, {password: hash}, {new: true});
            await jwt.verify(registeredToken, process.env.JWT_SECRET, (err)=>{
                if(err) {
                    res.json('This Link is Expired. Send another Password Verification')
                } else {
                    if(!final){
                        res.status(404).json({
                            message: 'Failed to change Password'
                        })
                    } else {
                        res.status(200).json({
                            message: `Password changed successfully`
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
}







// Using MailTrap for Email Handling

// REGISTER USER
// const transport = require('../middlewares/mailTrap');
// const registration = async (req, res)=>{
//     try {
//         const { username, email, password } = req.body;
//         const isEmail = await userModel.findOne({email});
//         if (isEmail) {
//             res.status(400).json({
//                 message: `User with this Email: ${email} already exist.`
//             })
//         } else {
//             const salt = await bcrypt.genSalt(10);
//             const hashPassword = await bcrypt.hash( password, salt )
//             const token = await jwt.sign({email}, process.env.JWT_SECRET, {expiresIn: '5m'});
//             const data = {
//                 username,
//                 email: email.toLowerCase(),
//                 password: hashPassword,
//                 token: token
//             };
//             const user = new userModel(data);
//             const savedUser = await user.save();
//             const baseUrl = process.env.BASE_URL
//             const mailOptions = {
//                 from: process.env.user,
//                 to: email,
//                 subject:'Verify your Account',
//                 // const link = `${req.protocol}://${req.get('host')}/api/verify/${savedUser._id}/${token}`
//                 html: `Please click on the link to verify your email: <a href="${baseUrl}/api/verify/${savedUser._id}/${ token }">Verify Email</a>`
//             }
//             await transport.sendMail( mailOptions );
//             if (!savedUser) {
//                 res.status(400).json({
//                     message: 'Failed to Create Account'
//                 })
//             } else {
//                 res.status(201).json({
//                     message: 'Successfully created account',
//                     data: savedUser
//                 });
//             }
//         }
//     } catch (error) {
        // res.status(500).json({
        //     message: error.message
        // })
//     }
// };


// For Super Admin
const allUsers = async (req, res) => {
    try {
        const users = await userModel.find({isAdmin: false});
        if (users.length == 0) {
            res.status(404).json({
                message: ' No User not found'
            })
        } else {
            res.status(200).json({
                message: 'All Users found',
                data: users
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};














// FUNCTIONALITIES FOR isAdmin ALONE
// Update and Delete a User 
// Updating a User.
const updateUsers = async (req, res)=>{
    try {
        const { username, email, password } = req.body;
        const { id } = req.params;
        const user = await userModel.findById(id);
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash( password, salt );
        const { adminId } = req.params;
        const adminUser = await userModel.findById(adminId);
        if (adminUser.isAdmin == false) {
            res.status(400).json({
                message: 'You are not an Admin, Therefore you are not allowed to access this'
            })
        } else {
            const data = {
                username: username || user.username,
                email: email || user.email,
                password: hashPassword || user.password
            };
            const updateUser = await userModel.findByIdAndUpdate(id, data, {new: true});
            if (!updateUser) {
                res.status(400).json({
                    message: 'Failed to Update User'
                })
            } else {
                res.status(200).json({
                    message: 'User updated successfully',
                    data: updateUser
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}


// Deleting a User.
const deleteUser = async (req, res)=>{
    try {
        const { id } = req.params;
        const { adminId } = req.params;
        const adminUser = await userModel.findById(adminId);
        if (adminUser.isAdmin == false) {
            res.status(400).json({
                message: 'You are not an Admin and cannot delete'
            })
        } else {
            const deleteUser = await userModel.findByIdAndDelete(id);
            if(!deleteUser) {
                res.status(404).json({
                    message: 'User not found'
                });
            } else {
                res.status(200).json({
                    message: 'User deleted successfully'
                })
            }
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}




// FUNCTIONALITIES FOR isSuperAdmin ALONE
//Only Super Admin can do these functions.
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
            const link = `${req.protocol}://${req.get('host')}/api/verify/${savedUser._id}/${token}`
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



// For Super Admin
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




// Upgrade a User to an Admin.
const makeAdmin = async (req, res)=>{
    try {
        const { userId } = req.params;
        const userInfo = await userModel.findById(userId);
        const token = await jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '5m'});
        // const user = await userModel.findByIdAndUpdate(userId, {isAdmin: true});
        const subject = 'Kindly Verify'
        const link = `${req.protocol}://${req.get('host')}/api/verifyMakeAdmin/${userInfo._id}/${token}`
        const message = `Welcome onBoard, kindly use this link ${link} to verify your Admin account. Kindly note that this link will expire after 5(five) Minutes.`
        emailSender({
            email: userInfo.email,
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








// Upgrade an Admin to a Super Admin.
const makeSuperAdmin = async (req, res)=>{
    try {
        const { userId } = req.params;
        const userInfo = await userModel.findById(userId);
        const token = await jwt.sign({userId}, process.env.JWT_SECRET, {expiresIn: '5m'});
        // const user = await userModel.findByIdAndUpdate(userId, {isAdmin: true});
        const subject = 'Kindly Verify'
        const link = `${req.protocol}://${req.get('host')}/api/verifyMakeSuperAdmin/${userInfo._id}/${token}`
        const message = `Welcome onBoard, kindly use this link ${link} to verify your Account Upgrade to Super Admin. Kindly note that this link will expire after 5(five) Minutes.`
        emailSender({
            email: userInfo.email,
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
                message: 'Please check your Email for the Super Admin Verification Link'
            })
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
};



const verifyMakeSuperAdmin = async (req, res)=>{
    try {
        const {token} = req.params;
        const registeredToken = token;
        const { id } = req.params;
        const admin = await userModel.findByIdAndUpdate(id, {isSuperAdmin: true});
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
                        message: `Successfully Updated to Super Admin`
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


const allLoginUsers = async (req, res)=>{
    try {
        const loginUsers = await userModel.findAll({islogin: true})
        if (loginUsers.length == 0) {
            res.status(404).json({
                message: 'No Login Users at the Moment'
            })
        } else {
            res.status(200).json({
                message: 'All Login Users',
                data: loginUsers
            });
        }
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
}






module.exports = {
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
};