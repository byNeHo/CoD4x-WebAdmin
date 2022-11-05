const io = require('socket.io')();
const mongoose = require('mongoose');
const BluebirdPromise  = require('bluebird');
mongoose.BluebirdPromise = require('bluebird');
const passport = require('passport');
const passportSocketIo = require("passport.socketio");
const flash    = require('connect-flash');
const { check, oneOf, validationResult } = require('express-validator');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser   = require('body-parser');
const session      = require('express-session');
const moment = require('moment');

//Cronjob this
const NotificationsSender = require("../models/notificationssender");


const Shoutbox = require("../models/shoutbox");
const MongoStore = require('connect-mongo');
const config = require('../config/config');
//Models
const Users = require("../models/user");
const Notifications = require('../models/notifications');
const ExtraRcon = require("../models/extra_rcon_commands");
const Globalnotifications = require("../models/global_notifications");
const Servers = require("../models/servers");

//Code
const md = require('markdown-it')({
	html: true,
	linkify: true,
	typographer: true
});

var dbURI = "mongodb://" + 
			encodeURIComponent(config.db.username) + ":" + 
			encodeURIComponent(config.db.password) + "@" + 
			config.db.host + ":" + 
			config.db.port + "/" + 
			config.db.name;
			const options = {
				useNewUrlParser:true,
				useUnifiedTopology: true
			  };
			  mongoose.connect(dbURI, options); 
io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key:'connect.sid',
  secret:config.sessionSecret,
  store: MongoStore.create({ mongoUrl: dbURI, ttl: 2 * 24 * 60 * 60 }),
}));

//Connect
io.sockets.on('connection' , function(socket){

	//connections.push(socket);
	if (socket.request.user && socket.request.user.logged_in) {
		var user = socket.request.user.local.user_name;
		var userID = socket.request.user._id;
		var avatar = socket.request.user.local.avatar_60;
		var msgtime = moment();
		var profile_link = '/members/'+socket.request.user._id;
		var notifytype = 'inverse';

		var now = new Date();
		var startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		Users.findOneAndUpdate({'_id': userID}, {$set:{'socketio.is_online':true, 'socketio.socket_id':socket.id}})
		.then (function(results){
			Servers.find({'is_stoped': false}).select('_id name ip port map_playing map_img online_players')
		.then (function(serverjoins){
			io.sockets.emit('online servers', serverjoins)
		})
		}).catch (function(err){
			console.log(err);
		});


		//Todays Visitors
		Users.find({updatedAt: {$gte: startOfToday}})
		.then (function(todayusers){
			io.sockets.emit('today users', todayusers)
		}).catch (function(err){
			console.log(err);
		});

		//Send message
		socket.on('send message', function(data){
			
			//Save data to mongodb   
			var msg = data.trim();
			var result = md.render(msg);
			var newShoutbox = new Shoutbox ({
				shout_user_id: socket.request.user._id,
				shout_user_avatar: avatar,
				shout_user_name: user,
				shout_user_msg: result
			});

			newShoutbox.saveAsync(function(err){
				if (err) throw err;
				io.sockets.emit('new message', {msg: data, user: user, avatar: avatar, msgtime: msgtime, profile_link: profile_link});
			});
		});

		//Send Notification Message
		socket.on('send notification', function(data){
			var mynotification = data.trim();
			socket.broadcast.emit('new notify message', {mynotification: data, user: user, avatar: avatar, notificationtype: notifytype});
		});

		// is Typing
		socket.on('typing', function(isTyping) {
			socket.broadcast.emit('updateTyping', socket.request.user.local.user_name, isTyping);
		});

		//Disconnect
		socket.on('disconnect' , function(data){
			Users.findOneAndUpdate({'_id': userID}, {$set:{'socketio.is_online':false}})
			.then (function(results){
				Users.find().select('_id local.user_name local.avatar_60 socketio.is_online').sort({'socketio.is_online': 'desc', 'local.user_name': 'asc'})
			.then (function(nicknames){
				io.sockets.emit('online users', nicknames)
			})
			}).catch (function(err){
				console.log(err);
			});			
		});
	}
});

io.on('error', function () {
	console.log("errr");
});


module.exports = io;