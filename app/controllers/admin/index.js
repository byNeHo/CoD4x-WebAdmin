// Require needed modules
const mongoose = require('mongoose');
const BluebirdPromise = require('bluebird');
const jsonfile = require('jsonfile');
const githubLatestRelease = require('github-latest-release');
const SSH = require('simple-ssh');
const os = require('os');
const osName = require('os-name');
const S = require('underscore.string');
const config = require('../../config/config');
const Appversion = require("../../models/app_version");
const AdminGroups = require("../../models/admingroups");
const Rconcommand = require("../../models/server_commands");
const ExtraRcon = require("../../models/extra_rcon_commands");
const Color = require("../../models/colors");
const Servers = require("../../models/servers");
const Cod4xversion = require("../../models/cod4x_version");
const Systemlogs = require("../../models/system_logs");
const PlayersData = require("../../models/players_db");
const Notifications = require("../../models/notifications");


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getAdminHome: function(req, res, next) {
		BluebirdPromise.props({
			appversion: Appversion.findOne({name:'CoD4x-WebAdmin'}).execAsync(),
			cod4xversion: Cod4xversion.findOne({name:'CoD4x-Server'}).execAsync(),
			local_servers: Servers.find({external_ip:false}).execAsync(),
			external_servers: Servers.find({external_ip: true}).execAsync(),
			sysinfo: Systemlogs.find({}).sort({createdAt: -1}).limit(30).execAsync(),
			colors: Color.find({}).execAsync()
		}).then (function(results){
			const opsys = osName(os.platform());
			if (S.startsWith(opsys, "Windows")==true){
				addlocalServer = false;
			} else {
				addlocalServer = true;
			}

			res.render('admin/home/index.pug', {title: 'Admin Dashboard', results: results, addlocalServer: addlocalServer, csrfToken: req.csrfToken()});
		}).catch(function(err) {
			console.log(err);
			res.redirect('/user/profile');
		});
	},

	getRconSettings: function(req, res, next) {
		BluebirdPromise.props({
			admingroups: AdminGroups.find({}).execAsync(),
			extrarcon: ExtraRcon.findOne({name:'extra_rcon'}).execAsync(),
			rconcommands: Rconcommand.find({}).sort({name_alias: 'asc'}).execAsync()
		}).then (function(results){
    		res.render('admin/rcon-settings/index.pug', {title: 'Rcon Commands Settings', results: results, csrfToken: req.csrfToken()});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('/user/profile');
  		});
	},

	PlayersDataRemove: function(req, res) {
		PlayersData.deleteOne({'_id': req.params.id})
		.then (function(result){
			req.flash('success_messages', 'Players Data successfully deleted');
			res.redirect('back');
		});
	},

	getGithubRelase: function(req, res, next) {
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
								req.flash('error_messages', 'Github latest version check failed with next error: '+err);
								res.redirect('back');
							} else{
								req.flash('success_messages', 'Github latest version successfully checked/updated');
								res.redirect('back');
							}
						});
					}else{
						console.log('Could not get the latest version from github');
					}
				}
			})
		})
	},

	RemoveAllAdminNotifications: function(req, res) {
		Notifications.deleteMany({'notification_type': 'unban-request'}).execAsync()
		.then (function(result){
			Notifications.deleteMany({'notification_type': 'admin-app'}).execAsync();
			req.flash('success_messages', 'All Admin Notifications Deleted');
			res.redirect('back');
		});
	}
};
