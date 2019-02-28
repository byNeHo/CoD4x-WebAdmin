const User = require('./user');

var tokens = [];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.consume = function(token, callback) {
    var userId = tokens[token];
    delete tokens[token];
    
    return User.findOne({ 'id' : userId }, callback);
}

exports.save = function(token, userId, callback) {
    tokens[token] = userId;
    return callback();
}

exports.generateToken = function(length) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    , charlen = chars.length;

  for (var i = 0; i < length; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};