// Require needed modules
const mongoose = require('mongoose');
const Jimp = require("jimp");
const fs = require('fs');
const multiparty = require('multiparty');
const uniqueString = require('unique-string');
const multer  = require('multer');
const path = require('path');
const formatNum = require('format-num');
const S = require('underscore.string');
const replaceString = require('replace-string');
const geoip = require('geoip-lite');
const BluebirdPromise = require('bluebird');
const SSH = require('simple-ssh');
const wget = require('wget-improved');
const exec = require('child_process').exec;
const moment = require('moment');
const SourceQuery = require('sourcequery');
const Servers = require("../../models/servers");
const ExtraRcon = require("../../models/extra_rcon_commands");
const Rconconsole = require("../../models/rcon_console");
const User = require("../../models/user");
const ServerScreenshots= require("../../models/server_new_screenshots");
const Color = require("../../models/colors");
const Cheaterreports = require("../../models/cheater_reports");
const Bans = require("../../models/bans");
const OnlinePlayers = require("../../models/online_players");
const Plugins = require("../../models/plugins");
const Playerstat = require("../../models/player_stats");
const config = require('../../config/config');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	InsertNewServer: function(req, res, next) {
		Servers.findOne({'ip':req.body.ip, 'port': req.body.port}).execAsync()
		.then (function(results){
			if (results){
				req.flash('error_messages', 'There was an error, this server already exist');
				res.redirect('back');
			}else {
				var sq = new SourceQuery(2000);
				sq.open(req.body.ip, req.body.port);
				sq.getRules(function(error, rules){
					if(!error){
						var private_clients = search("sv_privateClients", rules);
						var max_clients = search("sv_maxclients", rules);
						var location = search("_Location", rules);
						var game_name = search("gamename", rules);
						var gametype = search("g_gametype", rules);
						var mapStartTime = search("g_mapStartTime", rules);
						var shortversion = search("shortversion", rules);
						geo = geoip.lookup(req.body.ip);
						short_country = geo.country.toLowerCase();
						
						sq.getInfo(function(error, info){
							if (!error){
								//Remove Host(Rounds: 0/0) from alias
								var my_string = uncolorize(info.name);
								if (S(my_string).contains('Round') == true){
									var new_name = my_string.split("Round")[0];
								} else {
									var new_name= my_string
								}
								//check if this server name already exist
								Servers.findOne({'slug_name':new_name}, function( err, check_server_name ) {
									if(check_server_name) {
										req.flash('error_messages', 'Server name already exist, server names have to be unique. You already have a server called "SERVERNAME"');
										res.redirect('back');
									} else {
										var newServer = new Servers ({
											ip: req.body.ip,
											port: req.body.port,
											name: info.name,
											slug_name: new_name,
											country: location.value,
											country_shortcode: short_country,
											gametype: gametype.value,
											shortversion: shortversion.value,
											private_clients: private_clients.value,
											online_players: info.players,
											max_players: info.maxplayers,
											map_playing: info.map,
											game_name: info.game,
											rcon_password: req.body.rcon_password,
											external_ip : true,
											screenshot_identkey: req.body.screenshot_identkey,
											julia_identkey: req.body.julia_identkey,
											color: req.body.color,
											is_online: true,
											is_stoped: false
										});
										newServer.saveAsync()
										.then(function(saved) {
											req.flash('success_messages', 'Server successfully added');
											res.redirect('back');
										}).catch(function(err) {
											console.log("There was an error" +err);
										});
									}
								});
							}else {
								req.flash('error_messages', 'There was an error, please try again later - '+error);
								res.redirect('back');
							}
						});
					}else{
						req.flash('error_messages', 'There was an error, please try again later - '+error);
						console.log("There was an error: " +error);
						res.redirect('back');
					}
				});
			}
			
		}).catch(function(err) {
			req.flash('error_messages', 'Server name must be unique, detailed error: '+err);
			console.log(err);
			res.redirect('back');
		});
	},

	CreateNewLocalServer: function(req, res, next) {
		BluebirdPromise.props({
			check_server_port: Servers.findOne({'port':req.body.port, 'ip':config.ssh_access.host}).execAsync(),
			check_server_name: Servers.findOne({'slug_name': 'SERVERNAME'}).execAsync()
		}).then (function(results){
			if (results.check_server_port){
				req.flash('error_messages', 'Server port already exist, you can not run 2 servers on same port');
				res.redirect('back');
			} else {
				if (results.check_server_name){
					req.flash('error_messages', 'Server name already exist, server names have to be unique. You already have a server called "SERVERNAME"');
					res.redirect('back');
				} else {
					var serverport=req.body.port;
					var homedir=config.cod4_server_plugin.servers_root+"/cod4-"+req.body.port;
					var configfile="server.cfg";
					var geo = geoip.lookup(config.ssh_access.host);
					var short_country = geo.country.toLowerCase();
					var serverslots = req.body.server_slots;

					var newServer = new Servers ({
						ip: config.ssh_access.host,
						port: req.body.port,
						name: 'SERVERNAME',
						slug_name: 'SERVERNAME',
						country: 'Germany',
						country_shortcode: 'de',
						gametype: 'war',
						shortversion: '1.8',
						online_players: '0/'+serverslots,
						max_players: serverslots,
						map_playing: 'Crash',
						map_img: 'mp_crash',
						game_name: 'Call of Duty 4',
						rcon_password: req.body.rcon_password,
						external_ip : false,
						screenshot_identkey: req.body.screenshot_identkey,
						julia_identkey: req.body.julia_identkey,
						color: req.body.color,
						server_slots: req.body.server_slots,
						script_starter: './cod4x18_dedrun +set net_ip '+config.ssh_access.host+' +set net_port '+serverport+' +set sv_maxclients '+serverslots+' +set fs_homepath '+homedir+' +set fs_basepath '+homedir+' +set sv_punkbuster 0 +set rcon_password '+req.body.rcon_password+' +exec '+configfile+' +map_rotate',
						is_online: false,
						is_stoped: true
					});
					newServer.saveAsync()
					.then(function(saved) {
						var ssh = new SSH({
							host: config.ssh_access.host,
							user: config.ssh_access.user,
							pass: config.ssh_access.password,
							baseDir: config.cod4_server_plugin.servers_root
						});
						ssh.exec('cd '+config.cod4_server_plugin.servers_root, {
							out: console.log.bind('Entering the servers root directory')
						}).exec('mkdir '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port, {
							out: console.log.bind(console)
						}).exec('mkdir '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main', {
							out: console.log.bind(console)
						}).exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port, {
							out: console.log.bind('Entering the servers directory')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/cod4x18_dedrun '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/cod4x18_dedrun', {
							out: console.log.bind('Symlink cod4x18_dedrun')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/libstdc++.so.6 '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/libstdc++.so.6', {
							out: console.log.bind('Symlink libstdc++.so.6')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/steam_api.so '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/steam_api.so', {
							out: console.log.bind('Symlink steam_api.so')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/steamclient.so '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/steamclient.so', {
							out: console.log.bind('Symlink steamclient.so')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_00.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_00.iwd', {
							out: console.log.bind('Symlink main/iw_00.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_01.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_01.iwd', {
							out: console.log.bind('Symlink main/iw_01.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_02.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_02.iwd', {
							out: console.log.bind('Symlink main/iw_02.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_03.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_03.iwd', {
							out: console.log.bind('Symlink main/iw_03.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_04.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_04.iwd', {
							out: console.log.bind('Symlink main/iw_04.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_05.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_05.iwd', {
							out: console.log.bind('Symlink main/iw_05.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_06.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_06.iwd', {
							out: console.log.bind('Symlink main/iw_06.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_07.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_07.iwd', {
							out: console.log.bind('Symlink main/iw_07.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_08.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_08.iwd', {
							out: console.log.bind('Symlink main/iw_08.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_09.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_09.iwd', {
							out: console.log.bind('Symlink main/iw_09.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_10.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_10.iwd', {
							out: console.log.bind('Symlink main/iw_10.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_11.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_11.iwd', {
							out: console.log.bind('Symlink main/iw_11.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_12.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_12.iwd', {
							out: console.log.bind('Symlink main/iw_12.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/iw_13.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/iw_13.iwd', {
							out: console.log.bind('Symlink main/iw_13.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/localized_english_iw00.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/localized_english_iw00.iwd', {
							out: console.log.bind('Symlink main/localized_english_iw00.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/localized_english_iw01.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/localized_english_iw01.iwd', {
							out: console.log.bind('Symlink main/localized_english_iw01.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/localized_english_iw02.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/localized_english_iw02.iwd', {
							out: console.log.bind('Symlink main/localized_english_iw02.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/localized_english_iw03.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/localized_english_iw03.iwd', {
							out: console.log.bind('Symlink main/localized_english_iw03.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/localized_english_iw04.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/localized_english_iw04.iwd', {
							out: console.log.bind('Symlink main/localized_english_iw04.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/localized_english_iw05.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/localized_english_iw05.iwd', {
							out: console.log.bind('Symlink main/localized_english_iw05.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/localized_english_iw06.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/localized_english_iw06.iwd', {
							out: console.log.bind('Symlink main/localized_english_iw06.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/main/xbase_00.iwd '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/xbase_00.iwd', {
							out: console.log.bind('Symlink main/xbase_00.iwd')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/miles '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/miles', {
							out: console.log.bind('Symlink miles directory')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/zone '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/zone', {
							out: console.log.bind('Symlink zone dir')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/mods '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/mods', {
							out: console.log.bind('Symlink mods directory')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/plugins '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/plugins', {
							out: console.log.bind('Symlink plugins directory')
						}).exec('ln -s '+config.cod4_server_plugin.servers_root+'/main-server-files/usermaps '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/usermaps', {
							out: console.log.bind('Symlink usermaps directory')
						}).exec('cp '+config.cod4_server_plugin.servers_root+'/main-server-files/main/server.cfg '+config.cod4_server_plugin.servers_root+'/cod4-'+req.body.port+'/main/', {
							out: console.log.bind('Symlink plugins directory')
						}).exec('chmod 775 '+config.cod4_server_plugin.servers_root+'/main-server-files/main/server.cfg',{
							out: console.log.bind('CHMOD 775 server.cfg')
						}).start();
						req.flash('success_messages', 'Server successfully Created, dont forget to open the PORTS in Firewall and to start the Server and ofcorse to change manually the server.cfg');
						res.redirect('back');
					}).catch(function(err) {
						console.log("There was an error" +err);
						req.flash('error_messages', 'Server name must be unique, detailed error: '+err);
						res.redirect('back');
					});
				}
			}
		}).catch(function(err) {
			console.log(err);
			res.redirect('/user/profile');
		});
	},

	ServerByID: function(req, res, next) {	
		BluebirdPromise.props({
			servers: Servers.findOne({'_id': req.params.id}).execAsync(),
			colors: Color.find({}).sort({name_alias: 'asc'}).execAsync()
		}).then (function(results){
			res.render('admin/servers/edit.pug', {title: 'Edit Server', csrfToken: req.csrfToken(), results:results});
		}).catch(function(err) {
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			console.log(err);
			res.redirect('back');
		});
	},
	ServerUpdate: function(req, res, next) {
		Servers.findOneAsync({'_id' : req.params.id})
			.then (function(server){
				server.ip = req.body.ip,
				server.port = req.body.port,
				server.rcon_password = req.body.rcon_password,
				server.screenshot_identkey = req.body.screenshot_identkey,
				server.julia_identkey = req.body.julia_identkey,
				server.external_ip = req.body.external_ip ? true : false,
			    server.script_starter = req.body.script_starter
				server.saveAsync()
			}).then(function(update) {
				req.flash('success_messages', 'Server successfully edited');
				res.redirect('back');
			}).catch(function(err) {
				req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
				console.log("There was an error: " +err);
				res.redirect('back');
			});
	},

	ServerSettingsUpdate: function(req, res, next) {
		Servers.findOneAsync({'_id' : req.params.id})
			.then (function(server){
				server.auto_restart_server_on_crash = req.body.auto_restart_server_on_crash ? true : false,
				server.auto_restart_server = req.body.auto_restart_server ? true : false,
				server.time_to_restart_server = req.body.time_to_restart_server,
				server.color = req.body.color
				server.saveAsync()
			}).then(function(update) {
				req.flash('success_messages', 'Server successfully edited');
				res.redirect('back');
			}).catch(function(err) {
				req.flash('error_messages', 'There was an error: '+err);
				console.log("There was an error: " +err);
				res.redirect('back');
			});
	},

	ServerRulesUpdate: function(req, res, next) {
		Servers.findOneAsync({'_id' : req.params.id})
			.then (function(server){
				server.server_rules = req.body.server_rules,
				server.saveAsync()
			}).then(function(update) {
				req.flash('success_messages', 'Server Rules successfully updated');
				res.redirect('back');
			}).catch(function(err) {
				req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
				console.log("There was an error: " +err);
				res.redirect('back');
			});
	},

	ServerRemove: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.findOne({'_id': req.params.id}).execAsync()
		}).then (function(results){
			//Remove from DB everything related to this server
			Bans.find({ 'rcon_server': req.params.id }).deleteMany().exec();
			Cheaterreports.find({ 'rcon_server': req.params.id }).deleteMany().exec();
			ServerScreenshots.find({ 'get_server': req.params.id }).deleteMany().exec();
			OnlinePlayers.find({ 'server_alias': results.servers.name_alias }).deleteMany().exec();
			Playerstat.find({ 'server_alias': results.servers.name_alias }).deleteMany().exec();
			//Remove admins from this server
			User.updateOne({'local.admin_on_servers':req.params.id},{$pull:{'local.admin_on_servers':req.params.id}},function(err){
				console.log(err);
			});
		}).then(function(laststep){
	  		Servers.findOne({ '_id': req.params.id }).deleteOne().exec();
	  		req.flash('success_messages', 'Server successfully deleted');
			res.redirect('back');
	  	}).catch(function(err) {
	  		console.log(err);
	  		req.flash('error_messages', 'Server not deleted, maybe it is not stopped, detailed error: '+err);
	  		res.redirect('back');
	  	});
	},

	ServerRconByID: function(req, res, next) {
		BluebirdPromise.props({
			server: Servers.findOne({'_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
			rconcmds: Rconconsole.find({'rcon_server':req.params.id}).populate('rcon_server').populate('rcon_user').sort({createdAt: 'desc'}).execAsync()
		}).then (function(results){
			if (results){
				res.render('admin/servers/rcon.pug', {title: 'Rcon Console', csrfToken: req.csrfToken(), results:results});
			}else{
				req.flash('error_messages', 'Rcon Password is not provided for this server');
				res.redirect('back');
			}
		}).catch(function(err) {
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			console.log(err);
			res.redirect('back');
		});
	},

	RconConsoleAction: function(req, res, next) {
		BluebirdPromise.props({
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
		}).then(function(results) {
			if (results.getserver){
				if (req.user.local.user_role >=99){
					var cmd = req.body.rcon_cmd;
					var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
						rcon.connect()
						.then(function(connected){
								return rcon.command(cmd);											
						}).then(function(getresult){
							if(getresult){
								var newRconconsole = new Rconconsole ({
									rcon_command: req.body.rcon_cmd,
									rcon_server: req.params.id,
									rcon_response: getresult,
									rcon_user: req.user._id
								});
								newRconconsole.saveAsync()
							}
						}).then(function(disconnect){
							rcon.disconnect();
							res.redirect('/admin/servers/rconconsole/'+req.params.id);
						}).catch(function(err) {
							console.log("There was an error: " +err);
							console.log(err.stack);
							res.redirect('back');
						});
				}else{
					req.flash('error_messages', 'You have not enough power to use the Rcon Console on this server. Minimum power is: 99');
					res.redirect('back');
					console.log('You have not enough power to use the Rcon Console on the servers');
				}

			}else{
				req.flash('error_messages', 'You have no Admin rigths on this Server');
				res.redirect('back');
				console.log('This server has no rcon, or you are not an admin on this server or even worse this server id dont exist');
			}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconConsoleRemove: function(req, res) {
		Rconconsole.deleteMany({'rcon_server': req.params.id})
		.then (function(result){
			req.flash('success_messages', 'Rcon Commands for this Server successfully deleted');
			res.redirect('back');
		});
	},

	RconConsoleRemoveAll: function(req, res) {
		Rconconsole.deleteMany({})
		.then (function(result){
			req.flash('success_messages', 'Rcon Commands for all Servers successfully deleted');
			res.redirect('back');
		});
	},


	GetServerFiles: function(req, res, next) {
		var ssh = new SSH({
			host: config.ssh_access.host,
			user: config.ssh_access.user,
			pass: config.ssh_access.password,
			baseDir: config.cod4_server_plugin.servers_root
		});
		ssh.exec('cd '+config.cod4_server_plugin.servers_root, {
			out: console.log.bind('Entering the servers root directory')
		}).exec('mkdir main-server-files', {
			out: console.log.bind(console)
		}).exec('wget -b http://files.linuxgsm.com/CallOfDuty4/cod4x18_dedrun.tar.bz2', {
			out: console.log.bind('Start CoD4 files download')
		}).start();
		req.flash('success_messages', 'Server files will be downloaded (4gb file download wait about 5 minutes before you take the next step). U need to do this only once, do not download for every server the files');
		res.redirect('back');
	},

	ExtractServerFiles: function(req, res, next) {
		var ssh = new SSH({
			host: config.ssh_access.host,
			user: config.ssh_access.user,
			pass: config.ssh_access.password,
			baseDir: config.cod4_server_plugin.servers_root
		});
		ssh.exec('cd '+config.cod4_server_plugin.servers_root, {
			out: console.log.bind('Entering the servers root directory')
		}).exec('tar xvjf cod4x18_dedrun.tar.bz2 -C '+config.cod4_server_plugin.servers_root+'/main-server-files', {
			out: console.log.bind('Start CoD4 files download')
		}).exec('cd '+config.cod4_server_plugin.servers_root+'/main-server-files', {
			out: console.log.bind('Entering the main servers directory')
		}).exec('mkdir '+config.cod4_server_plugin.servers_root+'/main-server-files/usermaps', {
			out: console.log.bind(console)
		}).exec('wget -O '+config.cod4_server_plugin.servers_root+'/main-server-files/main/server.cfg https://raw.githubusercontent.com/GameServerManagers/Game-Server-Configs/master/CallOfDuty4/server.cfg', {
			out: console.log.bind('Default cfg file downloaded')
		}).exec('cd '+config.cod4_server_plugin.servers_root, {
			out: console.log.bind('Entering the root to delete the zip file we dont need it anymore')
		}).exec('rm cod4x18_dedrun.tar.bz2', {
			out: console.log.bind('File removed, we are ready to create new game servers')
		}).exec('chmod 777 '+config.cod4_server_plugin.servers_root+'/main-server-files/cod4x18_dedrun',{
				out: console.log.bind('CHMOD 777 cod4x18_dedrun')
		}).start();
		req.flash('success_messages', 'Server files will be extracted, it depends on your system how fast it will happen, it is usually about 5-10 mins');
		res.redirect('back');
	},

	
	ServerRemoveLocal: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.findOne({'_id': req.params.id, 'is_stoped': true}).execAsync()
		}).then (function(results){
			//Remove from DB everything related to this server
			Cheaterreports.find({ 'rcon_server': req.params.id }).deleteMany().exec();
			ServerScreenshots.find({ 'get_server': req.params.id }).deleteMany().exec();
			OnlinePlayers.find({ 'server_alias': results.servers.name_alias }).deleteMany().exec();
			//Remove admins from this server
			User.updateMany({'local.admin_on_servers':req.params.id},{$pull:{'local.admin_on_servers':req.params.id}},function(err){
				if (err)
					console.log(err);
			});
			var ssh = new SSH({
				host: config.ssh_access.host,
				user: config.ssh_access.user,
				pass: config.ssh_access.password,
				baseDir: config.cod4_server_plugin.servers_root
			});
			ssh.exec('rm -rf '+config.cod4_server_plugin.servers_root+'/cod4-'+results.servers.port, {
				out: console.log.bind(console)
			}).start();
		}).then(function(laststep){
	  		Servers.findOne({ '_id': req.params.id }).deleteOne().exec();
	  		req.flash('success_messages', 'Server successfully deleted');
			res.redirect('back');
	  	}).catch(function(err) {
	  		req.flash('error_messages', 'Server not removed, make sure the server is stopped before you remove it. Error details: '+err);
	  		console.log(err);
	  		res.redirect('back');
	  	});
	},


	LocalServerStart: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.findOne({'_id': req.params.id}).execAsync(),
			plugin: Plugins.findOne({'name_alias': 'cod4x-authtoken', 'status':true}).execAsync()
		}).then (function(results){

			var ssh = new SSH({
				host: config.ssh_access.host,
				user: config.ssh_access.user,
				pass: config.ssh_access.password,
				baseDir: config.cod4_server_plugin.servers_root
			});

			Servers.findOneAndUpdate({ "_id": req.params.id }, { "$set": {
				'count_connection_fail': 0,
				'is_stoped': false,
				'is_online': true
			}}).exec(function(err, done){
				if(err) {
					console.log(err);
				}
			});

			//Check if we use cod4x authtoken
			if (results.plugin){
				var startline = includecod4authtoken(results.servers.script_starter, 'set sv_authtoken "'+results.plugin.extra_field+'" +exec server.cfg');
			}else {
				var startline = results.servers.script_starter;
			}
			ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+results.servers.port+' && /usr/bin/screen -dmS cod4-' +results.servers.port+ ' ' +startline, {
				out: function(stdout) {
        			console.log(stdout);
    			}
			}).start();
			req.flash('success_messages', 'Server successfully started');
			res.redirect('back');
		}).catch(function(err) {
	  		console.log(err);
	  		res.redirect('back');
	  	});
	},

	LocalServerStop: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.findOne({'_id': req.params.id}).execAsync()
		}).then (function(results){
			var ssh = new SSH({
				host: config.ssh_access.host,
				user: config.ssh_access.user,
				pass: config.ssh_access.password,
				baseDir: config.cod4_server_plugin.servers_root
			});
			
			ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+results.servers.port+' && screen -X -S cod4-'+results.servers.port+' quit && kill $(lsof -t -i:'+results.servers.port+')', {
				out: console.log.bind(console)
			}).start();

			Servers.findOneAndUpdate({ "_id": req.params.id }, { "$set": {
				'count_connection_fail': 0,
				'is_stoped': true,
				'is_online': false
			}}).exec(function(err, done){
				if(err) {
					console.log(err);
				}
			});
			
			req.flash('error_messages', 'Server successfully stopped');
			res.redirect('back');
		}).catch(function(err) {
	  		console.log(err);
	  		res.redirect('back');
	  	});
	}
};

function search(nameKey, myArray){
	for (var i=0; i < myArray.length; i++) {
		if (myArray[i].name === nameKey) {
			return myArray[i];
		}
	}
}

function includecod4authtoken(string, plus_string) {
	string = replaceString(string, 'server.cfg', plus_string);
	return string;
}

function uncolorize(string){
	string = replaceString(string, '^0', '');
	string = replaceString(string, '^1', '');
	string = replaceString(string, '^2', '');
	string = replaceString(string, '^3', '');
	string = replaceString(string, '^4', '');
	string = replaceString(string, '^5', '');
	string = replaceString(string, '^6', '');
	string = replaceString(string, '^7', '');
	string = replaceString(string, '^8', '');
	string = replaceString(string, '^9', '');
	return string
}
