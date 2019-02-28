const i18next = require('i18next');
const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const geoip = require('geoip-lite-country-only');
const countries = require('country-list');
const replace = require("replace");
const Rcon = require('srcds-rcon');
const csrf = require('csurf');
const S = require('underscore.string');
const replaceString = require('replace-string');
const array = require('array');
const fs = require('fs');
const multiparty = require('multiparty');
const uniqueString = require('unique-string');
const multer  = require('multer');
const formatNum = require('format-num');
const path = require('path');
const http = require('http');
const sm = require('sitemap');
const BluebirdPromise = require('bluebird');
const DiscordWebhook = require("discord-webhooks");
const requestify = require('requestify');
const SSH = require('simple-ssh');
const Servers = require("../../models/servers");
const OnlinePlayers = require("../../models/online_players");
const User = require("../../models/user");
const Plugins = require("../../models/plugins");
const Maps = require("../../models/maps");
const Rconcommand = require("../../models/server_commands");
const ExtraRcon = require("../../models/extra_rcon_commands");
const Tempbandurations = require("../../models/tempban_duration");
const Tempbans = require("../../models/tempbans");
const ServerScreenshots = require("../../models/server_new_screenshots");
const Bans = require("../../models/bans");
const Unbans = require("../../models/unbans");
const TempBans = require("../../models/tempbans");
const Cheaterreports = require("../../models/cheater_reports");
const Notifications = require("../../models/notifications");
const Globalnotifications = require("../../models/global_notifications");
const Adminapplications = require("../../models/admin_applications");
const AdminConversation = require("../../models/admin_conversation");
const AdminConversationComment= require("../../models/admin_conversation_comments");
const Usermaps = require("../../models/maps");
const PlayersData = require("../../models/players_db");
const Systemlogs = require("../../models/system_logs");
const config = require('../../config/config');

var start = new Date();
start.setHours(0,0,0,0);
var end = new Date();
end.setHours(23,59,59,999);
const main_lng = i18next.getFixedT(config.website_language);

module.exports = {

	getHome: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.find({}, 'name name_alias ip port country_shortcode color online_players map_playing is_stoped updatedAt').execAsync(),
			tempbans: Tempbans.find({$or:[ {'admin_command':'tempban'}, {'admin_command':'chat'}, {'admin_command':'mute'} ]}, 'admin_id player_name admin_name createdAt admin_command').sort({ 'createdAt': -1}).limit(3).execAsync(),
			serverbans: Bans.find({}, 'player_name admin_name createdAt').sort({ 'createdAt': -1}).limit(3).execAsync(),
			adminconversations: AdminConversation.countDocuments().execAsync()
		}).then (function(results){
			var translation = req.t("pagetitles:pageTitle.home");
			res.render('frontpage/home/index.pug', {title: translation, results:results});
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getServer: function(req, res, next) {
		var populateadmins = [{path:'admins_on_server', select:'local.avatar_60 local.user_name id'}];
		BluebirdPromise.props({
			server: Servers.findOne({'name_alias':req.params.name_alias}, 'name map_img map_playing ip port online_players map_started country_shortcode country max_players private_clients game_name shortversion admins_on_server is_stoped server_rules').populate(populateadmins).execAsync(),
			online_players: OnlinePlayers.find({'server_alias':req.params.name_alias}, 'player_guid player_name player_score player_kills player_deaths player_assists player_steam_id').execAsync(),
			server_screenshots: ServerScreenshots.find({'server_name_alias':req.params.name_alias}, 'screenshot_img player_name map_name').execAsync(),
			tempbans: Tempbandurations.find({}, 'short_label time_number long_label category_alias').sort({category_alias: 'desc', time_number: 'asc'}).execAsync(),
			usermaps: Maps.find({}, 'map_name display_map_name').sort({map_name: 'asc'}).execAsync(),
			rcon_extra: ExtraRcon.findOne({'name': 'extra_rcon'}, 'enable_map_change minimum_power_for_map_change enable_maprotate minimum_power_for_maprotate enable_screenshot_all minimum_admin_power_for_screenshots screenshots_for_users_enabled screenshots_enabled minimum_admin_power_for_screenshots enable_tempban_duration default_tempban_time').execAsync(),
			plugins: Plugins.findOne({'category' : 'kgb', 'status':true}).execAsync(),
			startstop: Plugins.findOne({'category': 'servers', 'status':true, 'name_alias':'start-stop-server'}, 'min_power').execAsync()
		}).then (function(results){
			if (results.server.map_img!= null && results.server.map_img != '' && results.server.map_img){
				if (fileExists('./public/img/maps/'+results.server.map_img+'.jpg')===true){
					var current_map_image = results.server.map_img+'.jpg';
				} else {
					var current_map_image = 'no-photo.jpg';
				}
			} else {
				var current_map_image = 'no-photo.jpg';
			}
			
			if (req.user){
				Servers.countDocuments({'admins_on_server':req.user._id, 'name_alias':req.params.name_alias, rcon_password: { $gt: []  }}, function( err, check_admin ) {
					if( !err ) {
						res.render('frontpage/server/index.pug', {title: results.server.name, results:results, check_admin:check_admin, current_map_image:current_map_image, csrfToken: req.csrfToken()});
					} else {
						console.log( err );
						res.redirect('/');
					}
				});
			}else{
				res.render('frontpage/server/index.pug', {title: results.server.name, current_map_image:current_map_image, results:results});
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getMembers: function(req, res, next) {
		BluebirdPromise.props({
			users: User.find({'local.user_role':{$lte: 1}}, 'local.user_name local.avatar_60').sort({ 'updatedAt': -1}).execAsync(),
			admins: User.find({'local.user_role':{$gte: 2}}, 'local.user_name local.avatar_60').sort({ 'updatedAt': -1}).execAsync()
		}).then (function(results){
			var translation = req.t("pagetitles:pageTitle.members");
			res.render('frontpage/members/index.pug', {title: translation, results:results});
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getBanned: function(req, res, next) {
		BluebirdPromise.props({
			serverbans: Bans.find({}, 'player_name createdAt admin_name').sort({ 'updatedAt': -1}).execAsync(),
			servertempbans: TempBans.find({}, 'admin_command player_name createdAt admin_name expire').sort({ 'updatedAt': -1}).execAsync()
		}).then (function(results){
			var translation = req.t("pagetitles:pageTitle.banlist");
			res.render('frontpage/banned/index.pug', {title: translation, results:results});
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getBanById: function(req, res, next) {
		BluebirdPromise.props({
			getbanned: Bans.findOne({'_id':req.params.id}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			removenotification: Globalnotifications.countDocuments({'identify_id': req.params.id, 'recipient_id': req.user._id}).execAsync()
		}).then (function(results){
			if (results.getbanned){
				var translation = req.t("pagetitles:pageTitle.banbyID");
				res.render('frontpage/banned/banned-details.pug', {title: translation+' '+results.getbanned.player_name, results:results, csrfToken: req.csrfToken()});
			} else {
				req.flash('error_messages', req.t("notifications:global.error_page_removed"));
				res.redirect('back');
			}				
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getPlayers: function(req, res, next) {
		BluebirdPromise.props({
			players: PlayersData.find({}, 'player_name updatedAt player_country_short player_guid').sort({ 'updatedAt':'desc'}).execAsync()
		}).then (function(results){
			var translation = req.t("pagetitles:pageTitle.get_players");
			res.render('frontpage/playersdata/index.pug', {title: translation, results:results});
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getplayerById: function(req, res, next) {
		BluebirdPromise.props({
			player: PlayersData.findOne({'_id':req.params.id}).execAsync()
		}).then (function(results){
			var translation = req.t("pagetitles:pageTitle.get_players");
			res.render('frontpage/playersdata/details.pug', {title: translation+' '+results.player.player_name, results:results});				
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getMemberById: function(req, res, next) {
		BluebirdPromise.props({
			user: User.findOne({'_id': req.params.id}).populate('local.admin_on_servers', 'name _id name_alias').execAsync(),
			permbans: Bans.find({'admin_id': req.params.id}).sort({ 'createdAt': -1}).limit(10).execAsync(),
			tempbans: TempBans.find({'admin_id': req.params.id}).sort({ 'createdAt': -1}).limit(10).execAsync(),
			unbans: Unbans.find({'admin_id': req.params.id}).sort({ 'createdAt': -1}).limit(10).execAsync()
		}).then (function(results){
			if (results.user.steam.id){
				PlayersData.findOne({'player_steam_id':results.user.steam.id},function(err, plusinfo){
					if (err){
						console.log(err);
					} else {
						var translation = req.t("pagetitles:pageTitle.members");
						res.render('frontpage/members/member-details.pug', {title: translation+' '+results.user.local.user_name, results:results, plusinfo:plusinfo});
					}
				});
			} else {
				var translation = req.t("pagetitles:pageTitle.members");
				res.render('frontpage/members/member-details.pug', {title: translation+' '+results.user.local.user_name, results:results});
			}	
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	ScreenshotsRemove: function(req, res, next) {
		BluebirdPromise.props({
			server: Servers.findOne({'_id' : req.params.id}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			slike: ServerScreenshots.find({'get_server' : req.params.id}).execAsync()
		}).then (function(results){
			if (req.user.local.user_role >= results.requiredpower.minimum_admin_power_for_screenshots){
				for (var i = 0;i<results.slike.length;i++){
					var filePath = './public'+results.slike[i].screenshot_img;
					fs.unlink(filePath, (err) => {
						if (err) {
							req.flash('error_messages', req.t('notifications:index.ScreenshotsRemove_error', { display_error: err }));
							res.redirect('back');
						}
					});
				}
			ServerScreenshots.deleteMany({'get_server' : results.server._id}).exec();
			req.flash('success_messages', req.t('notifications:index.ScreenshotsRemove_success'));
			res.redirect('back');
			} else {
				req.flash('error_messages', req.t('notifications:index.ScreenshotsRemove_error_permission', { display_error: results.requiredpower.minimum_admin_power_for_screenshots }));
				res.redirect('back');
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	InsertNewCheaterReport: function(req, res, next) {
		var create_img_variable = "/img/screenshots/"+req.params.screenshot_img+".jpg";
		BluebirdPromise.props({
			getscreenshot: ServerScreenshots.findOne({'screenshot_img': create_img_variable}).execAsync(),
			checkdiscord: Plugins.findOne({'category': 'discord'}, 'status').execAsync()
		}).then (function(results){
			if (results){
				Bans.findOne({'player_guid' : results.getscreenshot.player_guid},function(error, checkifalreadybanned){
					if(checkifalreadybanned){
						req.flash('error_messages', results.getscreenshot.player_name+' '+req.t('notifications:index.InsertNewCheaterReport_error_already_banned'));
						res.redirect('back');
					} else {
						Cheaterreports.findOne({'player_guid' : results.getscreenshot.player_guid},function(error, checkifalreadyreported){
							if(checkifalreadyreported){
								req.flash('error_messages', results.getscreenshot.player_name+' '+req.t('notifications:index.InsertNewCheaterReport_error_already_reported'));
								res.redirect('back');
							} else {
								var newimgpath = "/img/cheater-reports/"+req.params.screenshot_img+".jpg";
								if (!fs.existsSync('./public/img/cheater-reports')){
									fs.mkdirSync('./public/img/cheater-reports');
								}

								var newCheaterreports = new Cheaterreports ({
									player_name: results.getscreenshot.player_name,
									player_guid: results.getscreenshot.player_guid,
									player_screenshot: newimgpath,
									default_message: main_lng('frontpages:chetaer_reports.chetaer_reports_default_btn_title'),
									sender_id: req.user._id,
									rcon_server: results.getscreenshot.get_server
								});
								if(newCheaterreports){
									var newNotifications = new Notifications ({
										notification_type: 'cheater-reports',
										sender_id: req.user._id,
										cheater_report_id: newCheaterreports._id,
										notification_msg: main_lng('frontpages:chetaer_reports.chetaer_reports_default_btn_title')
									});
									newNotifications.saveAsync()
								}else{
									req.flash('error_messages', req.t("notifications:global.error_script"));
									res.redirect('back');
								}				
								newCheaterreports.saveAsync()
								req.flash('success_messages', req.t('notifications:index.InsertNewCheaterReport_success_report_sent', { getPlayer: results.getscreenshot.player_name }));
								fs.rename('./public'+create_img_variable, './public/img/cheater-reports/'+req.params.screenshot_img+'.jpg', function(err){
									if (err){
										console.log(err);
									}else{
										ServerScreenshots.deleteOne({'screenshot_img' : create_img_variable}).exec();
										if (results.checkdiscord.status === true){
											discordmessages(main_lng('plugin_discord:cheater_reports_msg.msg_title'),"16733986",main_lng('plugin_discord:cheater_reports_msg.message', { getUserName: req.user.local.user_name, getReportedPlayer: results.getscreenshot.player_name, get_website: config.website_name }));
										}
									} 
								});
								res.redirect('back');
							}
						})
					}
				})	
			}else{
				req.flash('error_messages', req.t("notifications:global.error_page_removed"));
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	InsertNewunbanRequest: function(req, res, next) {
		BluebirdPromise.props({
			getban: Bans.findOne({'_id': req.body.banid}).execAsync(),
			checkunbansent: Notifications.countDocuments({'bann_id': req.body.banid}).execAsync(),
			checkdiscord: Plugins.findOne({'category': 'discord'}, 'status').execAsync()
		}).then (function(results){
			if (results.checkunbansent == 0){
				if (results){
						var newNotifications = new Notifications ({
							notification_type: 'unban-request',
							sender_id: req.user._id,
							bann_id: req.body.banid,
							notification_msg: main_lng('frontpages:unban_requests.unban_new_unban_request_model'),
							unban_msg:req.body.message
						});
						newNotifications.saveAsync()
						req.flash('success_messages', req.t('notifications:index.InsertNewunbanRequest_success_sent', { getPlayer: results.getban.player_name }));
					if (results.checkdiscord.status === true){
						discordmessages(main_lng('plugin_discord:unban_request_msg.msg_title'),"16733986",main_lng('plugin_discord:unban_request_msg.message', { getUserName: req.user.local.user_name, getReportedPlayer: results.getscreenshot.player_name, get_website: config.website_name }));
					}
					res.redirect('back');
				}else{
					req.flash('error_messages', req.t("notifications:global.error_page_removed"));
					res.redirect('back');
				}
			}else{
					req.flash('error_messages', req.t('notifications:index.InsertNewunbanRequest_error_already_sent'));
					res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	getMyNotifications: function(req, res, next) {
		var populateunban = [{path:'sender_id', select:'local.avatar_60 local.user_name id'}, {path:'bann_id', select:'createdAt player_name player_name_alias player_guid player_screenshot'}];
		var populatesender = [{path:'sender_id', select:'local.avatar_60 local.user_name id socketio.socket_id'}, {path:'admin_app_id', select:'adminappmessage id age status'}];
		BluebirdPromise.props({
			adminunbanrequests: Notifications.find({'seen':0, 'notification_type':'unban-request'}).sort({ 'createdAt': -1}).populate(populateunban).execAsync(),
			adminadminapps: Notifications.find({'seen':0, 'notification_type':'admin-app'}).sort({ 'createdAt': -1}).populate(populatesender).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then (function(results){
			if (results.requiredpower.minimum_power_for_player_unban > req.user.local.user_role){
				req.flash('error_messages', req.t('notifications:global.error_no_permission')+' '+results.requiredpower.minimum_power_for_player_unban);
				res.redirect('back');
			}else{
				var translation = req.t("pagetitles:pageTitle.getMyNotifications");
				res.render('frontpage/notifications/index.pug', {title: translation, results:results, csrfToken: req.csrfToken()});	
			}			
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getCheaterReports: function(req, res, next) {
		var populatereport = [{path:'rcon_server', select:'name'}, {path:'sender_id', select:'local.avatar_60 local.user_name id'}, {path:'cheater_report_id', select:'createdAt player_name player_guid player_screenshot'}];
		BluebirdPromise.props({
			admincheaterreports: Notifications.find({'seen':0, 'notification_type':'cheater-reports'}).sort({ 'createdAt': -1}).populate(populatereport).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then (function(results){
			if (results.requiredpower.minimum_power_for_cheater_reports > req.user.local.user_role){
				req.flash('error_messages', req.t('notifications:global.error_no_permission')+' '+results.requiredpower.minimum_power_for_cheater_reports);
				res.redirect('back');
			}else{
				var translation = req.t("pagetitles:pageTitle.getCheaterReports");
				res.render('frontpage/cheater-reports/index.pug', {title: translation, results:results, csrfToken: req.csrfToken()});	
			}			
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},



	getGlobalNotifications: function(req, res, next) {
		var populateinfos = [{path:'sender_id', select:'local.avatar_60 local.user_name id socketio.socket_id'}, {path:'recipient_id', select:'local.avatar_60 local.user_name id'}];

		BluebirdPromise.props({
			globalnotifications: Globalnotifications.find({recipient_id:req.user._id}).sort({ seen: 'asc', 'createdAt': -1}).populate(populateinfos).execAsync(),
		}).then (function(results){
			Globalnotifications.updateMany({'recipient_id':req.user._id},{'seen':1},{multi: true}, function(err){
				if(err){
					console.log(err);
				}else{
					var translation = req.t("pagetitles:pageTitle.getGlobalNotifications");
					res.render('frontpage/globalnotifications/index.pug', {title: translation, results:results, csrfToken: req.csrfToken()});
				}
			});		
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	CheaterReportRemove: function(req, res, next) {
		BluebirdPromise.props({
			getreport: Cheaterreports.findOne({'_id': req.params.id}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then (function(results){
			if (results.requiredpower.minimum_power_for_cheater_reports <= req.user.local.user_role){
				if (results.getreport){
						var newGlobalnotifications = new Globalnotifications ({
							sender_id: req.user._id,
							recipient_id: results.getreport.sender_id,
							link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_cheater_report_declined'),
							link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_cheater_report_declined'),
							link_url: '/notifications',
							message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_cheater_report_declined', {reported_PlayerName:results.getreport.player_name}),
							reported_player:results.getreport.player_name,
							admin_decision: 0,
							notification_type:'cheater_report'
						});
						newGlobalnotifications.saveAsync()

						fs.unlink('./public'+results.getreport.player_screenshot, function(err) {
							if (err) {
								console.error("Error occurred while trying to remove file");
							}
						});

						Cheaterreports.deleteOne({'_id' : req.params.id}).exec();
						Notifications.deleteOne({'cheater_report_id' : req.params.id}).exec();

					req.flash('success_messages', req.t('notifications:index.CheaterReportRemove_declined_msg'));
					res.redirect('back');
				}else{
					req.flash('error_messages', req.t("notifications:global.error_page_removed"));
					res.redirect('back');
				}
			}else{
					req.flash('error_messages', req.t('notifications:global.error_no_permission')+' '+results.requiredpower.minimum_power_for_cheater_reports);
					res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	UnbanRequestRemove: function(req, res, next) {
		BluebirdPromise.props({
			getunbanrequest: Notifications.findOne({'bann_id': req.params.id}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then (function(results){
			if (results.requiredpower.minimum_power_for_player_unban <= req.user.local.user_role){
				if (results.getunbanrequest){
						var newGlobalnotifications = new Globalnotifications ({
							sender_id: req.user._id,
							recipient_id: results.getunbanrequest.sender_id,
							link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_unban_request_declined'),
							link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_unban_request_declined'),
							link_url: '/notifications',
							message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_unban_request_declined'),
							admin_decision: 0,
							notification_type:'unban_request'
						});
						newGlobalnotifications.saveAsync()

						Bans.updateMany({'_id':req.params.id},{'unban_request_denied':true},{multi: true}, function(err){
							if(err){
								console.log(err);
							}
						});

						Notifications.deleteOne({'bann_id' : req.params.id}).exec();

					req.flash('success_messages', req.t('notifications:index.UnbanRequestRemove_declined_msg'));
					res.redirect('back');
				}else{
					req.flash('error_messages', req.t("notifications:global.error_page_removed"));
					res.redirect('back');
				}
			}else{
					req.flash('error_messages', req.t('notifications:global.error_no_permission')+' '+results.requiredpower.minimum_power_for_player_unban);
					res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	GlobalNotificationsRemove: function(req, res) {
		Globalnotifications.deleteMany({'recipient_id': req.user._id})
		.then (function(){
			req.flash('success_messages', req.t('notifications:index.GlobalNotificationsRemove_cleaned'));
			res.redirect('back');
		});
	},

	getAdminApp: function(req, res, next) {
		BluebirdPromise.props({
			total_cheater_reports: Bans.countDocuments({'cheater_reporter_id': req.user._id}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then (function(results){
			if (req.user.local.user_role > 1){
				req.flash('error_messages', req.t('notifications:index.getAdminApp_already_admin'));
				res.redirect('back');
			}else {
				var translation = req.t("pagetitles:pageTitle.getAdminApp");
				res.render('frontpage/adminapp/index.pug', {title: translation, results:results, csrfToken: req.csrfToken()});
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	InsertNewAdminApp: function(req, res, next) {
		BluebirdPromise.props({
			checkdiscord: Plugins.findOne({'category': 'discord'}, 'status').execAsync(),
			total_cheater_reports: Bans.countDocuments({'cheater_reporter_id': req.user._id}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then (function(results){
			if (req.user.local.user_role > 1){
				req.flash('error_messages', req.t('notifications:index.InsertNewAdminApp_already_admin'));
				res.redirect('back');
			}else {
				if (results.total_cheater_reports >= results.requiredpower.minimum_cheater_reports){
					var newAdminapplications = new Adminapplications ({
					age: req.body.age,
					app_sender: req.user.id,
					adminappmessage: req.body.adminappmessage
					});
					if(newAdminapplications){
						var newNotifications = new Notifications ({
							notification_type: 'admin-app',
							sender_id: req.user._id,
							admin_app_id: newAdminapplications.id,
							notification_msg: main_lng('notifications:index.InsertNewAdminApp'),
							admin_app_msg: req.body.adminappmessage
						});
						newNotifications.saveAsync()
					}else{
						req.flash('error_messages', req.t("notifications:global.error_script"));
						res.redirect('back');
					}
					newAdminapplications.saveAsync()

					//Send message to discord if the plugin is enabled
					if (results.checkdiscord.status === true){
						discordmessages(main_lng('plugin_discord:new_admin_application_msg.msg_title'),"9159498",main_lng('plugin_discord:new_admin_application_msg.message', { getUserName: req.user.local.user_name, get_website: config.website_name }));
					}
				}else {
					req.flash('error_messages', req.t('notifications:index.InsertNewAdminApp_cheater_reports_count_error', { count_CheaterReports: results.requiredpower.minimum_cheater_reports }));
					res.redirect('back');
				}	
			}
		}).then(function(saved) {
			req.flash('success_messages', req.t('notifications:index.InsertNewAdminApp_success_sent'));
			res.redirect('back');
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	AdminAppRemove: function(req, res, next) {
		BluebirdPromise.props({
			getadminapp: Notifications.findOne({'admin_app_id': req.body.appid}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then (function(results){
			if (req.user.local.user_role===100){
				if (results.getadminapp){
					var newGlobalnotifications = new Globalnotifications ({
						sender_id: req.user._id,
						recipient_id: results.getadminapp.sender_id,
						link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_admin_application_declined'),
						link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_admin_application_declined'),
						link_url: '/notifications',
						message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_admin_application_declined'),
						admin_decision: 0,
						notification_type:'admin_application'
					});

					newGlobalnotifications.saveAsync()

					Notifications.deleteMany({'admin_app_id' : req.body.appid}).exec();
					AdminConversationComment.deleteMany({'app_id' : req.body.appid}).exec();
					AdminConversation.deleteMany({'app_id' : req.body.appid}).exec();
					Adminapplications.deleteMany({'_id' : req.body.appid}).exec();

					req.flash('success_messages', req.t('notifications:index.AdminAppRemove_declined'));
					res.redirect('back');
				}else{
					req.flash('error_messages', req.t("notifications:global.error_page_removed"));
					res.redirect('back');
				}
			}else{
					req.flash('error_messages', req.t('notifications:global.error_no_permission')+' 100');
					res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	AdminAppAccept: function(req, res, next) {
		BluebirdPromise.props({
			getadminapp: Notifications.findOne({'admin_app_id': req.body.appid}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			checkdiscord: Plugins.findOne({'category': 'discord'}, 'status').execAsync()
		}).then (function(results){
			if (req.user.local.user_role===100){
				if (results.getadminapp){
					var newGlobalnotifications = new Globalnotifications ({
						sender_id: req.user._id,
						recipient_id: results.getadminapp.sender_id,
						link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_admin_application_accepted'),
						link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_admin_application_accepted'),
						link_url: '/notifications',
						message: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_admin_application_accepted', {get_WebSite: config.website_name}),
						admin_decision: 1,
						notification_type:'admin_application'
					});
					newGlobalnotifications.saveAsync()

					//Send message to discord if the plugin is enabled
					if (results.checkdiscord.status === true){
						discordmessages(main_lng('plugin_discord:new_admin_added_msg.msg_title'),"240116",main_lng('plugin_discord:new_admin_added_msg.message', { getUserName: req.body.new_admin_name, get_website: config.website_name }));
					}

					Notifications.deleteMany({'admin_app_id' : req.body.appid}).exec();
					AdminConversationComment.deleteMany({'app_id' : req.body.appid}).exec();
					AdminConversation.deleteMany({'app_id' : req.body.appid}).exec();
					Adminapplications.deleteMany({'_id' : req.body.appid}).exec();

					req.flash('success_messages', req.t('notifications:index.AdminAppAccept_accepted'));
				}else{
					req.flash('error_messages', req.t("notifications:global.error_page_removed"));
					res.redirect('back');
				}
			}else{
					req.flash('error_messages', req.t('notifications:global.error_no_permission')+' 100');
					res.redirect('back');
			}
			res.redirect('/admin/manage-users/edit/'+req.body.user_id);
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	AdminAppConversationStart: function(req, res, next) {
		BluebirdPromise.props({
			getadminapp: Adminapplications.findOne({'_id': req.body.app_id}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			checkdiscord: Plugins.findOne({'category': 'discord'}, 'status').execAsync()
		}).then (function(results){
			if (req.user.local.user_role===100){
				if (results.getadminapp){
					var newGlobalnotifications = new Globalnotifications ({
						sender_id: req.user._id,
						recipient_id: results.getadminapp.sender_id,
						link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_admin_application_discussion'),
						link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_admin_application_discussion'),
						link_url: '/notifications',
						message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_admin_application_discussion'),
						admin_decision: 2,
						notification_type:'admin_application'
					});
					Adminapplications.findOneAndUpdate({'_id': req.body.app_id}, {$set:{'status': true}}, function(err, doc){
					    if(err){
					        console.log(err);
					    }else{
					    	var newAdminConversation = new AdminConversation ({
								sender_id: req.body.sender_id,
								app_id: req.body.app_id
							});
					    	//Send message to discord if the plugin is enabled
							if (results.checkdiscord.status === true){
								discordmessages(main_lng('plugin_discord:new_admin_conversation.msg_title'),"240116",main_lng('plugin_discord:new_admin_conversation.message', { getUserName: req.user.local.user_name, get_website: config.website_name }));
							}
							newAdminConversation.saveAsync()	
					    }
					});
					newGlobalnotifications.saveAsync()
					req.flash('success_messages', req.t('notifications:index.AdminAppConversationStart_started'));
					res.redirect('back');
				}else{
					req.flash('error_messages', req.t("notifications:global.error_page_removed"));
					res.redirect('back');
				}
			}else{
					req.flash('error_messages', req.t('notifications:global.error_no_permission')+' 100');
					res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', req.t("notifications:global.error_script"));
			res.redirect('back');
		});
	},

	getConversations: function(req, res, next) {
		var populateConversations = [{path:'sender_id', select:'local.user_name local.avatar_60 id'}, {path:'app_id', select:'age adminappmessage'}];
		BluebirdPromise.props({
			adminconversations: AdminConversation.find().sort({ 'createdAt': -1}).populate(populateConversations).execAsync(),
		}).then (function(results){
			if (req.user.local.user_role < 2){
				req.flash('error_messages', req.t('notifications:index.getConversations_restricted_access'));
				res.redirect('back');
			}else {
				var translation = req.t("pagetitles:pageTitle.getConversations");
				res.render('frontpage/admin_conversations/index.pug', {title: translation, results:results});
			}
			
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getKGBplugin: function(req, res, next) {
		BluebirdPromise.props({
			plugins: Plugins.findOne({'category' : 'kgb', 'status':true}).execAsync(),
			checkifadmin: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id}).execAsync()
		}).then (function(results){
			//check if the plugin is activated
			if (results.plugins){
				//check required power to use this plugin
				if (req.user.local.user_role >= results.plugins.min_power){
					//check if user is admin on this server and if the server exist on the app page
					if(results.checkifadmin){
						//server exist, user is admin on this server now we can execute commands
						var kgb_link = config.kgb_api.kgb_link+'?id='+config.kgb_api.kgb_id+'&task='+req.params.task+'&auth='+config.kgb_api.kgb_auth;
						requestify.get(kgb_link).then(function(response) {
							response.getBody()
							// Get the response body
							req.flash('rconconsole_messages', response.getBody());
							res.redirect('back');
						});

						Servers.findOneAndUpdate({ "_id": results.checkifadmin._id }, { "$set": {
								'count_connection_fail': 0,
								'is_online': true
						}}).exec(function(err, done){
							if(err) {
								console.log(err);
							} else {
								var newSystemlogs = new Systemlogs ({
									logline: req.user.local.user_name+' executed '+req.params.task+' on '+results.checkifadmin.name,
									successed: true
								});
								newSystemlogs.saveAsync()
							}
						});

					}else{
						//server and admin check failed
						req.flash('error_messages', req.t('notifications:index.getKGBplugin_restricted_access'));
						res.redirect('back');
					}
				}else{
					req.flash('error_messages', req.t('notifications:index.getKGBplugin_restricted_access_low_power'));
					res.redirect('back');
				}
			} else {
				console.log('KGB plugin disabled');
				req.flash('error_messages', req.t('notifications:index.getKGBplugin_restricted_access_plugin_disabled'));
				res.redirect('back');
			}			
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	PluginLocalServerStart: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.findOne({'_id': req.params.id}).execAsync(),
			plugin: Plugins.findOne({'name_alias': 'cod4x-authtoken', 'status':true}).execAsync(),
			checkifadmin: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id}).execAsync(),
			startstop: Plugins.findOne({'category': 'servers', 'status':true, 'name_alias':'start-stop-server'}).execAsync()
		}).then (function(results){
			//check if the plugin is activated
			if (results.startstop){
				//check if this is a Local Server
				if (results.servers.external_ip === false){
					//check required power to use this plugin
					if (req.user.local.user_role >= results.startstop.min_power){
						//check if user is admin on this server and if the server exist on the app page
						if(results.checkifadmin){
							//Start the server
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
								} else {
									var newSystemlogs = new Systemlogs ({
										logline: main_lng('notifications:index.PluginLocalServerStart_admin_logs', { get_ServerName: results.servers.name, get_UserName: req.user.local.user_name }),
										successed: true
									});
									newSystemlogs.saveAsync()
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

							req.flash('success_messages', req.t('notifications:index.PluginLocalServerStart_success_server_started'));
							res.redirect('back');

						} else {
							req.flash('error_messages', req.t('notifications:index.PluginLocalServerStart_restricted_access'));
							res.redirect('back');
						}

					} else {
						req.flash('error_messages', req.t('notifications:index.PluginLocalServerStart_restricted_access_low_power'));
						res.redirect('back');
					}

				} else {
					req.flash('error_messages', req.t('notifications:index.PluginLocalServerStart_restricted_access_only_local_server'));
					res.redirect('back');
				}

			} else {
				console.log('Server start stop plugin disabled');
				req.flash('error_messages', req.t('notifications:index.PluginLocalServerStart_restricted_access_plugin_disabled'));
				res.redirect('back');
			}
			
		}).catch(function(err) {
	  		console.log(err);
	  		res.redirect('back');
	  	});
	},

	PluginLocalServerStop: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.findOne({'_id': req.params.id}).execAsync(),
			checkifadmin: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id}).execAsync(),
			startstop: Plugins.findOne({'category': 'servers', 'status':true, 'name_alias':'start-stop-server'}).execAsync()
		}).then (function(results){

			//check if the plugin is activated
			if (results.startstop){
				//check if this is a Local Server
				if (results.servers.external_ip === false){
					//check required power to use this plugin
					if (req.user.local.user_role >= results.startstop.min_power){
						//check if user is admin on this server and if the server exist on the app page
						if(results.checkifadmin){
							//Stop the server
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
								} else {
									var newSystemlogs = new Systemlogs ({
										logline: main_lng('notifications:index.PluginLocalServerStop_admin_logs', { get_ServerName: results.servers.name, get_UserName: req.user.local.user_name }),
										successed: true
									});
									newSystemlogs.saveAsync()
								}
							});
							
							req.flash('error_messages', req.t('notifications:index.PluginLocalServerStop_success_server_started'));
							res.redirect('back');

						} else {
							req.flash('error_messages', req.t('notifications:index.PluginLocalServerStop_restricted_access'));
							res.redirect('back');
						}

					} else {
						req.flash('error_messages', req.t('notifications:index.PluginLocalServerStop_restricted_access_low_power'));
						res.redirect('back');
					}

				} else {
					req.flash('error_messages', req.t('notifications:index.PluginLocalServerStop_restricted_access_only_local_server'));
					res.redirect('back');
				}

			} else {
				console.log('Server start stop plugin disabled');
				req.flash('error_messages', req.t('notifications:index.PluginLocalServerStop_restricted_access_plugin_disabled'));
				res.redirect('back');
			}	
		}).catch(function(err) {
	  		console.log(err);
	  		res.redirect('back');
	  	});
	},

	SiteMapCreate: function(req, res) {
		BluebirdPromise.props({
			sitemap_servers: Servers.find({}).execAsync(),
			sitemap_users: User.find({}).execAsync()
		}).then (function(results){

		sitemap = sm.createSitemap ({
				hostname: config.website_url,
				cacheTime: 600000,        // 600 sec - cache purge period
				urls: [config.website_url,
					{ url: '/members', changefreq: 'daily', priority: 0.3 },
					{ url: '/banlist', changefreq: 'daily',  priority: 0.7 },
				],
			});
			results.sitemap_servers.forEach(function(server) {
				sitemap.add({url: server.name_alias, changefreq: 'weekly', priority: 0.7});
			});
			results.sitemap_users.forEach(function(member) {
				sitemap.add({url: '/members/'+member._id, changefreq: 'weekly', priority: 0.7});
			});
			res.header('Content-Type', 'application/xml');
			res.send( sitemap.toString() );
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	}
};

function deleteallimages (directory) {
	fs.readdir(directory, function(err, files) {
		if (err) throw err;
		for (var file of files) {
		  fs.unlinkSync(path.join(directory, file), function(err) {
			if(err)
				console.log(err);
		  });
		}
	});
}

function deleteFolderRecursive (path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			console.log(curPath);
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}

function includecod4authtoken(string, plus_string) {
	string = replaceString(string, 'server.cfg', plus_string);
	return string;
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

function fileExists(filename){
  try{
    require('fs').accessSync(filename)
    return true;
  }catch(e){
    return false;
  }
}

function isEmpty(value) {
	return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}
