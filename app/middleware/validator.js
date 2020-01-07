const { check } = require('express-validator/check');

exports.NewPasswordUpdate = [
    check('password', "Wrong new password, minimum 6 characters").isLength({min:6})
];
