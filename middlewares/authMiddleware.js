const jwt = require('jsonwebtoken');

// auth Middleware
const userAuth = (req, res, next)=>{
    const hasAuthorization = req.headers.authorization;
    if(!hasAuthorization) {
        res.status(403).json({
            message: 'No Authorization Found'
        });
    } else {
        const token = hasAuthorization.split(' ')[1];
        try {
            console.log(req.headers)
            const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
            req.user = JSON.stringify(decodedToken);
            req.userId = decodedToken.userId;
            req.userEmail = decodedToken.email;
            req.username = decodedToken.username;
            next()
        } catch (error) {
            res.status(500).json({
                message: error.message
            })
        }
    }
};



module.exports = {
    userAuth
}