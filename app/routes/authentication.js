const Token     = require('../models/token');
const passport  = require('passport');
require('../config/passport')(passport);

module.exports = {
    verifyAuthenticated: function(req, res, next) {
        // Prevent unauthorised access.
        if (req.isAuthenticated()) {
            return next();
        }
        
        res.redirect('/user/login');
    },
    issueCookie: function(req, res, next) {
        // Issue a 'remember_me' cookie if the user selected the 'Remember me' checkbox.
        if (!req.body.rememberMe) {
            return next();
        }
        
        var token = Token.generateToken(64);
        Token.save(token, req.user.id, function(err) {
            if (err) {
                return next(err);
            }
            
            res.cookie('remember_me', token, { path: '/', httpOnly: true, maxAge: (24 * 3600 * 1000 * 14) }); // 14 days.}
            return next();
        })
    },

};
