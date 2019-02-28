const i18next = require('i18next');
const mongoose = require('mongoose');
const BluebirdPromise = require('bluebird');
const jsonfile = require('jsonfile');
const githubLatestRelease = require('github-latest-release');
const Appversion = require("../models/app_version");
const Cod4xversion = require("../models/cod4x_version");
const CronJob = require('cron').CronJob;
const schedule = require('node-schedule');
const async = require('async');
const geoip = require('geoip-lite-country-only');
const countries = require('country-list');
const fs = require('fs');
const S = require('underscore.string');
const replaceString = require('replace-string');
const moment = require('moment');
const DiscordWebhook = require("discord-webhooks");
const SSH = require('simple-ssh');
const Rcon = require('srcds-rcon');
const config = require('../config/config');
const Plugins = require("../models/plugins");
const Bans = require("../models/bans");
const TempBans = require("../models/tempbans");
const Servers = require("../models/servers");
const Usermaps = require("../models/maps");
const OnlinePlayers = require("../models/online_players");
const Systemlogs = require("../models/system_logs");
const PlayersData =  require("../models/players_db");
const main_lng = i18next.getFixedT(config.website_language);

	var now = new Date();
	var current_time = new moment().format("H");
	

	// ################################ Check CoD4xWebadmin version on Github page ################################ //
	var job = schedule.scheduleJob('5 2 * * *', function(){
		check_cod4_xwebadmin_version();
	});

	// ################################ Check CoD4x Server version on Github page ################################ //
	var job1 = schedule.scheduleJob('6 2 * * *', function(){
		get_cod4x_latest_version();
	});

	// ################################ Plugin remove Old Cronjobs from the website ################################ //
	var rmadminactions = schedule.scheduleJob('46 1 * * *', function(){
		var daysToDeletion = parseInt(3);
		var deletionDate = new Date(now.setDate(now.getDate() - daysToDeletion));
		Systemlogs.find({createdAt : {$lt : deletionDate}},function(error, counted){	
			if (!error){
				if (counted.length > 0){
					Systemlogs.deleteMany({ createdAt : {$lt : deletionDate} }, function(err) {
						if (err){
							console.log('Remove old system cronjob logs error: '+err)
						} else {
							var newSystemlogs = new Systemlogs ({
								logline: 'Old system logs removed',
								successed: true
							});
							newSystemlogs.saveAsync()
						}
					});
				}
			}
		});	
	});

	// ################################ Plugin remove Old Tempbans from the website ################################ //
	var rmadminactions = schedule.scheduleJob('1 3 * * *', function(){
		var start = new Date();
		var daysToDeletion = parseInt(14);
		var deletionDate = new Date(now.setDate(now.getDate() - daysToDeletion));
		Plugins.findOne({'name_alias':'remove-old-tempbans'},function(error, plugintempbandelete){	
			if (!error){
				if (plugintempbandelete.status==true){
					TempBans.deleteMany({'createdAt':{$lt : deletionDate}, 'expire':{$lt : start}}, function(err) {
						if (err){
							console.log('Remove old tempbbans cronjob error: '+err)
						} else {
							var newSystemlogs = new Systemlogs ({
								logline: 'Old Tempbans removed',
								successed: true
							});
							newSystemlogs.saveAsync()
						}
					});
				}
			}
		});	
	});

	// ################################ Remove players data from DB where name is empty ################################ //
	var rmadminactions = schedule.scheduleJob('27 15 * * *', function(){
		BluebirdPromise.props({
			playersdata: PlayersData.find({}, 'player_name id').execAsync()
		}).then (function(results){
			if (results.playersdata.length > 0){
				async.eachSeries(results.playersdata, function (player, next){
					setTimeout(function() {
						if (player){
							PlayersData.updateMany({"_id": player._id}, {"$set":{ "player_name":player.player_name.trim()}}
							).exec(function(err, done){
								if(err) {
									console.log(err);
								}
							});
						}
						next(); // don't forget to execute the callback!
					}, 100);
				}, function () {
					console.log('Done going through Servers!');
				});
			}
		}).then(function(){
			PlayersData.deleteMany({ 'player_name': {$exists:false}}, function(err) {
				if (err){
					console.log('There was an error (Delete playersdata -cronjob) '+err)
				}
			})
		}).catch(function(err) {
			console.log("There was an error in plugin auto restart servers: " +err);
		});
	});

	// ################################ Restart server every day at X hours ################################ //

	var runstophourly = schedule.scheduleJob('0 0 */1 * * *', function(){
		var current_time_start = new moment().format("H");
		BluebirdPromise.props({
			servers: Servers.find({'auto_restart_server' : true, 'time_to_restart_server': current_time_start, 'external_ip':false, 'is_stoped': false}, 'port name').execAsync()
		}).then (function(results){
			if (results.servers.length > 0){
				var ssh = new SSH({
					host: config.ssh_access.host,
					user: config.ssh_access.user,
					pass: config.ssh_access.password,
					baseDir: config.cod4_server_plugin.servers_root
				});
				async.eachSeries(results.servers, function (server, next){
					setTimeout(function() {
						if (server){
							console.log('Stoping server: '+server.name)
							ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+server.port+' && screen -X -S cod4-'+server.port+' quit && kill $(lsof -t -i:'+server.port+')', {
								out: console.log.bind(console)
							}).start();
							Servers.findOneAndUpdate({ "_id": server._id }, { "$set": {
								'count_connection_fail': 0,
								'is_stoped': true,
								'is_online': false
							}}).exec(function(err, done){
								if(err) {
									console.log(err);
								}
							});
						}
						next(); // don't forget to execute the callback!
					}, 4000);
				}, function () {
					console.log('Done going through Servers!');
				});
			}
		}).catch(function(err) {
			console.log("There was an error in plugin auto restart servers: " +err);
		});
	})
	var runstarthourly = schedule.scheduleJob('0 2 */1 * * *', function(){
		// Start server every day at X hours + 2min (Part of stop server every day at X hours)
		var current_time_start_2 = new moment().format("H");
		BluebirdPromise.props({
			servers: Servers.find({'auto_restart_server' : true, 'time_to_restart_server': current_time_start_2, 'external_ip':false, 'is_stoped': true}, 'name port script_starter').execAsync(),
			plugin: Plugins.findOne({'name_alias': 'cod4x-authtoken', 'status':true}, 'extra_field').execAsync()
		}).then (function(results){
			if (results.servers.length > 0){
				var ssh = new SSH({
					host: config.ssh_access.host,
					user: config.ssh_access.user,
					pass: config.ssh_access.password,
					baseDir: config.cod4_server_plugin.servers_root
				});

				async.eachSeries(results.servers, function (server, next){
					setTimeout(function() {
						if (server){
							console.log('Starting server: '+server.name)
							//Check if we use cod4x authtoken
							if (results.plugin){
								var startline = includecod4authtoken(server.script_starter, 'set sv_authtoken "'+results.plugin.extra_field+'" +exec server.cfg');
							}else {
								var startline = server.script_starter;
							}
							ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+server.port+' && /usr/bin/screen -dmS cod4-' +server.port+ ' ' +startline, {
								out: function(stdout) {
					        		console.log(stdout);
					    		}
							}).start();
							Servers.findOneAndUpdate({ "_id": server._id }, { "$set": {
								'count_connection_fail': 0,
								'is_stoped': false,
								'is_online': true
							}}).exec(function(err, done){
								if(err) {
									console.log(err);
								}
							});
							var newSystemlogs = new Systemlogs ({
								logline: server.name+' Restarted (Auto Restart Server)',
								successed: true
							});
							newSystemlogs.saveAsync()
						}
						next(); // don't forget to execute the callback!
					}, 4000);
				}, function () {
					console.log('Done going through Servers!');
				});
			}
		}).catch(function(err) {
			console.log("There was an error in plugin auto restart servers: " +err);
		});
	});

	// ################################ Functions ################################ //
	function check_cod4_xwebadmin_version(req, res, next) {
		var my_packagejsonfile = './package.json';
		githubLatestRelease('byNeHo', 'CoD4x-WebAdmin', function (err, github_results){
			jsonfile.readFile(my_packagejsonfile, function(err, obj) {
				if (err){
					console.log(err)
				} else{
					//If there is a result
					if ( typeof github_results !== 'undefined' && github_results){
						//console.log(github_results);
						var myversion = 'v'+obj.version;
						Appversion.findOneAndUpdate({name:'CoD4x-WebAdmin' }, { "$set": {
							'local_version': myversion,
							'github_version': github_results.tag_name
						}}).exec(function(err, done){
							if(err) {
								console.log(err);
							}
						});
						var newSystemlogs = new Systemlogs ({
							logline:'CoD4x-WebAdmin latest application version checked on Github',
							successed: true
						});
						newSystemlogs.saveAsync()
					}else{
						console.log('Could not get the latest version from github');
					}
				}
			})
		})
	}
	function get_cod4x_latest_version(req, res, next) {
		githubLatestRelease('callofduty4x', 'CoD4x_Server', function (err, github_results){
				if (err){
					console.log(err)
				} else{
					//If there is a result
					//console.log(github_results);
					if ( typeof github_results !== 'undefined' && github_results){
						Cod4xversion.findOneAndUpdate({name:'CoD4x-Server'}, { "$set": {
							'prerelease': github_results.prerelease,
							'github_version': github_results.tag_name
						}}).exec(function(err, done){
							if(err) {
								console.log(err);
							}
						});
						var newSystemlogs = new Systemlogs ({
							logline:'CoD4x-Server latest server version checked on Github',
							successed: true
						});
						newSystemlogs.saveAsync()
					}else{
						console.log('Could not get the latest version from github');
					}
				}
		})
	}

	function discordmessages (title, color, description){
		/*
		Colors:
		red 16007990
		green 9159498
		deeporange 16733986
		lightblue 240116
		*/
		var msgdiscord = new DiscordWebhook(config.discord_webhook.webhook_url)
		msgdiscord.on("ready", () => {
			msgdiscord.execute({
				username:config.discord_webhook.webhook_displayname,
				avatar_url:config.discord_webhook.webhook_avatar,
				"embeds": [{
					"title": title,
					"color": color,
					"url": config.website_url,
					"description": description,				
					"timestamp": new Date(),
					"footer": {
					"icon_url": config.discord_webhook.webhook_avatar,
					"text": main_lng('general:footer.footer_rights')
					}
				}] 
			});
		});
		msgdiscord.on("error", (error) => {
		  console.warn(error);
		});
	}

	function includecod4authtoken(string, plus_string) {
		string = replaceString(string, 'server.cfg', plus_string);
		return string;
	}

	function deleteFiles(files, callback) {
		var i = files.length;
		files.forEach(function(filepath){
			fs.unlink(filepath, function(err) {
				i--;
				if (err) {
					callback(err);
					return;
				} else if (i <= 0) {
					callback(null);
				}
			});
		});
	}

	function isEmpty(value) {
		return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
	}

module.exports = CronJob;