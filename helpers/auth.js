const jwt = require('jsonwebtoken');
const lodash = require('lodash');

process.env.JWT_SECRET = "8idyoIEFxsf\/DOpNVbhbbxoqdDnda5HH4vDuhZ9Q+1JGYKu0fZaCZZbou1TOPxaKh6ayVx8wAJEs9HynchmVSg==";

function verifyJWT(token) {
    //console.log('a');
    return new Promise((resolve, reject) => {
        jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
            if(err || !decodedToken) {
                return reject(err);
            }
            resolve(decodedToken);
        });
    });
}

function CreateJWToken(details) {
    if (typeof details !== 'object') {
        details = {};
    }

    if(!details.maxAge || typeof details.maxAge !== 'number') {
        details.maxAge = 3600;
    }

    details.sessionData = lodash.reduce(details.sessionData || {}, (memo, val, key) => {
        if(typeof val !== "function" && key !== "password") {
            memo[key] = val;
        }
        return memo;
    }, {});

    let token = jwt.sign({
        data: details.sessionData
    },
        process.env.JWT_SECRET, {
        expiresIn: details.maxAge,
        algorithm: 'HS256'
    });
    return token;
}

module.exports = { verifyJWT, CreateJWToken };