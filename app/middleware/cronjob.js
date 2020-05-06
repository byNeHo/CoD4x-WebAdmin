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
const geoip = require('geoip-lite');
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
const Chathistory =  require("../models/chathistory");
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
var rmadminactions = schedule.scheduleJob('37 15 * * *', function(){
	var start = new Date();
	Plugins.findOne({'name_alias':'remove-old-tempbans'},function(error, plugintempbandelete){	
		if (!error){
			if (plugintempbandelete.status==true){
				
				var daysToDeletion = parseInt(14);
				var deletionDate = new Date(now.setDate(now.getDate() - daysToDeletion));

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
	PlayersData.deleteMany({ 'player_name': {$exists:false}}, function(err) {
		if (err){
			console.log('There was an error (Delete playersdata -cronjob) '+err)
		}
	})
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
						ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+server.port+' && screen -X -S cod4-'+server.port+' quit && kill $(lsof -t -i:'+server.port+') && exit', {
							out: console.log.bind(console)
						}).start();
						Servers.findOneAndUpdate({ "_id": server._id }, { "$set": {
							'is_stoped': true,
							'is_online': false
						}}).exec(function(err, done){
							if(err) {
								console.log(err);
							}
						});
					}
					next();
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
						if (results.plugin){
							var startline = includecod4authtoken(server.script_starter, 'set sv_authtoken "'+results.plugin.extra_field+'" +exec server.cfg');
						}else {
							var startline = server.script_starter;
						}
						ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+server.port+' && /usr/bin/screen -dmS cod4-' +server.port+ ' '+startline+' && exit', {
							out: function(stdout) {
				        		console.log(stdout);
				    		}
						}).start();
						Servers.findOneAndUpdate({ "_id": server._id }, { "$set": {
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
					next();
				}, 4000);
			}, function () {
				console.log('Done going through Servers!');
			});
		}
	}).catch(function(err) {
		console.log("There was an error in plugin auto restart servers: " +err);
	});
});

// ################################ Stop server/remove screen session on server crash ################################ //
var runstoponservercrashed = schedule.scheduleJob('30 */5 * * *', function(){
	var time_now = new Date()
	var crashedtime = time_now.setMinutes(time_now.getMinutes()-5)
	BluebirdPromise.props({
		servers: Servers.find({'auto_restart_server_on_crash' : true, 'is_stoped': false, 'is_online': true, 'external_ip':false, 'updatedAt':{$lt : crashedtime}}, 'name name_alias ip port script_starter').execAsync()
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
						ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+server.port+' && screen -X -S cod4-'+server.port+' quit && kill $(lsof -t -i:'+server.port+') && exit', {
							out: console.log.bind(console)
						}).start();
						Servers.findOneAndUpdate({ "_id": server._id }, { "$set": {
							'is_stoped': true,
							'is_online': false
						}}).exec(function(err, done){
							if(err) {
								console.log(err);
							}
						});
					}
					next();
				}, 4000);
			}, function () {
				console.log('Done going through Servers!');
			});
		}
	}).catch(function(err) {
		console.log("There was an error in plugin auto restart servers: " +err);
	});
});

var runstartonservercrashed = schedule.scheduleJob('30 */7 * * *', function(){
	BluebirdPromise.props({
		servers: Servers.find({'auto_restart_server_on_crash' : true, 'external_ip':false, 'is_online': false, 'is_stoped':true}, 'name name_alias ip port script_starter').execAsync(),
		plugin: Plugins.findOne({'name_alias': 'cod4x-authtoken', 'status':true}).execAsync(),
		checkdiscord: Plugins.findOne({'category': 'discord'}, 'status').execAsync()
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
						if (results.plugin){
							var startline = includecod4authtoken(server.script_starter, 'set sv_authtoken "'+results.plugin.extra_field+'" +exec server.cfg');
						} else {
							var startline = server.script_starter;
						}
						if (results.checkdiscord.status === true){
							discordmessages(server.name+" Crashed","16007990",' After several attempts we could not connect to the server  '+server.name+'! The server is auto-restarted! For more details visit '+config.website_name+'!');
						}
						ssh.exec('cd '+config.cod4_server_plugin.servers_root+'/cod4-'+server.port+' && /usr/bin/screen -dmS cod4-' +server.port+ ' '+startline+' && exit', {
							out: function(stdout) {
				        		console.log(stdout);
				    		}
						}).start();
						Servers.findOneAndUpdate({ "_id": server._id }, { "$set": {
							'is_stoped': false,
							'is_online': true
						}}).exec(function(err, done){
							if(err) {
								console.log(err);
							}
						});
						var newSystemlogs = new Systemlogs ({
							logline: server.name+' crashed, auto-restarted',
							successed: true
						});
						newSystemlogs.saveAsync()
					}
					next();
				}, 4000);
			}, function () {
				console.log('Done going through Servers!');
				});
		}
	}).catch(function(err) {
		console.log("There was an error in plugin auto restart servers: " +err);
	});
});

// ################################ Remove Github Files CoD4x Server every day at X hours ################################ //
var downloadcod4xgithub = schedule.scheduleJob('27 5 * * *', function(){
	Plugins.findOne({'name_alias':'download-cod4x-files-from-github'},function(error, plugincod4x){	
		if (!error){
			if (plugincod4x.status==true){
				remove_cod4_github();
			}
		}
	});	
});


// ################################ Plugin remove Old Player Data from the website ################################ //
var rmadminactions = schedule.scheduleJob('5 3 * * *', function(){
	var start = new Date();
	Plugins.findOne({'name_alias':'remove-old-player-data'},function(error, pluginplayerdatadelete){	
		if (!error){
			if (pluginplayerdatadelete.status==true){
				
				var daysToDeletion = parseInt(pluginplayerdatadelete.cron_job_time_intervals);
				var deletionDate = new Date(now.setDate(now.getDate() - daysToDeletion));

				PlayersData.deleteMany({'updatedAt':{$lt : deletionDate}}, function(err) {
					if (err){
						console.log('Remove old player data cronjob error: '+err)
					} else {
						var newSystemlogs = new Systemlogs ({
							logline: 'Old Player Data removed',
							successed: true
						});
						newSystemlogs.saveAsync()
					}
				});
			}
		}
	});	
});

// ################################ Plugin remove Old Game Chat ################################ //
var rmadminactions = schedule.scheduleJob('5 4 * * *', function(){
	var start = new Date();
	Plugins.findOne({'name_alias':'remove-old-game-chat'},function(error, pluginchatdelete){	
		if (!error){
			if (pluginchatdelete.status==true){
				
				var daysToDeletion = parseInt(pluginchatdelete.cron_job_time_intervals);
				var deletionDate = new Date(now.setDate(now.getDate() - daysToDeletion));

				Chathistory.updateMany({ messages: { $exists: true } },
					{$pull: { 'messages': { sent: { $lt: deletionDate } } }
				}).then (function(deleted){
					var newSystemlogs = new Systemlogs ({
						logline: 'Old Game Chat Messages removed',
						successed: true
					});
					newSystemlogs.saveAsync()
				}).catch (function(err){
					console.log(err);
				});
			}
		}
	});	
});

// ################################ Download files from Github CoD4x Server every day at X hours ################################ //
var downloadcod4xgithub = schedule.scheduleJob('30 5 * * *', function(){
	Plugins.findOne({'name_alias':'download-cod4x-files-from-github'},function(error, plugincod4x){	
		if (!error){
			if (plugincod4x.status==true){
				download_cod4_github();
			}
		}
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
				if ( typeof github_results !== 'undefined' && github_results){
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
};

function download_cod4_github(req, res, next) {
	var ssh = new SSH({
		host: config.ssh_access.host,
		user: config.ssh_access.user,
		pass: config.ssh_access.password,
		baseDir: config.cod4_server_plugin.servers_root
	});
	ssh.exec('cd '+config.cod4_server_plugin.servers_root, {
		out: console.log.bind('Entering the servers root directory')
	}).exec('git clone -b master --single-branch https://github.com/callofduty4x/CoD4x_Server.git CoD4x_Server-master && exit', {
		pty: true,	
		out: console.log.bind('Start CoD4x Master files download')
	}).start();
	var newSystemlogs = new Systemlogs ({
		logline:'Latest Files from CoD4x Github branch master downloaded',
		successed: true
	});
	newSystemlogs.saveAsync()
};

function remove_cod4_github(req, res, next) {
	var ssh = new SSH({
		host: config.ssh_access.host,
		user: config.ssh_access.user,
		pass: config.ssh_access.password,
		baseDir: config.cod4_server_plugin.servers_root
	});
	ssh.exec('cd '+config.cod4_server_plugin.servers_root, {
		out: console.log.bind('Entering the servers root directory')
	}).exec('sudo rm -rf '+config.cod4_server_plugin.servers_root+'/CoD4x_Server-master && exit', {
		pty: true,	
		out: console.log.bind('Start CoD4x Master files download')
	}).start();
};


function get_cod4x_latest_version(req, res, next) {
	githubLatestRelease('callofduty4x', 'CoD4x_Server', function (err, github_results){
		if (err){
			console.log(err)
		} else{
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
};

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
};

	function includecod4authtoken(string, plus_string) {
	mystring = replaceString(string, 'server.cfg', plus_string);
	return mystring;
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
};

function isEmpty(value) {
	return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
};

module.exports = CronJob;