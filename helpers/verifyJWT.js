var { verifyJWT } = require('./auth');

function verifyJWT_MW(req, res, next) {
    let token = req.get('Authorization');
    
    verifyJWT(token).then(decodedToken => {
        req.user = decodedToken.data;
        next();
    })
    .catch(err => {
        res.status(400).json({
            error: {
                message: "Invalid auth token provided"
            }
        });
    });
}

module.exports = verifyJWT_MW;