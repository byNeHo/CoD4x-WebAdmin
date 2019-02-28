const shouts = [],
server = require('../server').server,
io = require('socket.io')(server);

exports.getAll = function (req, res) {
    res.send(shouts);
};

io.on('connection', function(socket) {
    socket.on('shout', function(data, res) {
        if (data.name && data.text) {
            shouts.push(data);
            res('ok');
            socket.broadcast.emit('update', data);
        } else {
            res('error');
        }
    });
});
