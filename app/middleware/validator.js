const { check, oneOf, validationResult } = require('express-validator');

exports.NewPasswordUpdate = [
    check('password', "Wrong new password, minimum 6 characters").isLength({min:6})
];
