const i18next = require('i18next');
const mongoose = require('mongoose');
const BluebirdPromise = require('bluebird');
const moment = require('moment');
const path = require('path');
const formatNum = require('format-num');
const NodeGeocoder = require('node-geocoder');
const Rcon = require('srcds-rcon');
const splitArray = require('split-array');
const arrify = require('arrify');
const fs = require('fs');
const S = require('underscore.string');
const replaceString = require('replace-string');
const requestify = require('requestify'); 
const User = require("../../models/user");
const Rconcommand = require("../../models/server_commands");
const ExtraRcon = require("../../models/extra_rcon_commands");
const Servers = require("../../models/servers");
const Maps = require("../../models/maps");
const TempbanDurations = require("../../models/tempban_duration");
const Tempbans = require("../../models/tempbans");
const UserScreenshots = require("../../models/user_screenshots");
const ServerScreenshots= require("../../models/server_new_screenshots");
const Bans = require("../../models/bans");
const Unbans = require("../../models/unbans");
const Cheaterreports = require("../../models/cheater_reports");
const Notifications = require("../../models/notifications");
const Globalnotifications = require("../../models/global_notifications");
const PlayersData = require("../../models/players_db");
const config = require('../../config/config');
const main_lng = i18next.getFixedT(config.website_language);
var start = new Date();
start.setHours(0,0,0,0);
var end = new Date();
end.setHours(23,59,59,999);

var deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			console.log(curPath);
			if(fs.lstatSync(curPath).isDirectory()) {
				deleteFolderRecursive(curPath);
			} else {
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

module.exports = {
	RconConsoleCommand: function(req, res, next) {
		BluebirdPromise.props({
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getserver: Servers.findOne({'_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
		}).then(function(results) {
			if (results.getserver){
				if (req.user.local.user_role >= 99){
					var cmd = req.body.rcon_cmd;
					var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
						rcon.connect()
						.then(function(connected){
							return rcon.command(cmd);
						}).then(function(getresult){
							req.flash('rconconsole_messages', getresult);
						}).then(function(disconnect){
							rcon.disconnect();
							res.redirect('back');
						}).catch(function(err) {
							console.log("There was an error: " +err);
							console.log(err.stack);
							res.redirect('back');
						});
				}else{
					req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
					res.redirect('back');
				}
			}else{
				req.flash('error_messages', req.t('rcon_commands:RconConsoleCommand.server_not_found'));
				res.redirect('back');
			}
		}).catch(function(err) {
			req.flash('error_messages', req.t('rcon_commands:general.general_there_was_an_error', { get_error: err }));
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconMaprotate: function(req, res, next) {
		BluebirdPromise.props({
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
		}).then(function(results) {			
			if (results.getserver){
				if ( results.requiredpower.enable_maprotate !== 'undefined' && results.requiredpower.enable_maprotate){
					if (req.user.local.user_role >= results.requiredpower.minimum_power_for_maprotate){
						var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
							rcon.connect()
							.then(function(connected){
								return rcon.command(req.body.rcon_cmd);
							}).then(function(getresult){
								req.flash('rconconsole_messages', req.t('rcon_commands:RconMaprotate.map_rotated'));
							}).then(function(disconnect){
								rcon.disconnect();
								res.redirect('back');
							}).catch(function(err) {
								req.flash('rconconsole_messages', err.stack);
								res.redirect('back');
							});
					}else{
						req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
						res.redirect('back');
					}
				}else{
						req.flash('error_messages', req.t('rcon_commands:general.general_command_disabled_by_admin'));
						res.redirect('back');
				}
			}else{
				req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
				res.redirect('back');
			}
		}).catch(function(err) {
			req.flash('error_messages', req.t('rcon_commands:general.general_there_was_an_error', { get_error: err }));
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconGetssAll: function(req, res, next) {
		BluebirdPromise.props({
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
		}).then(function(results) {			
			if (results.getserver){
				if ( results.requiredpower.enable_screenshot_all !== 'undefined' && results.requiredpower.enable_screenshot_all){
					if (req.user.local.user_role >= results.requiredpower.minimum_admin_power_for_screenshots){
						var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
							rcon.connect()
							.then(function(connected){
								return rcon.command(req.body.rcon_cmd);
							}).then(function(getresult){
								req.flash('rconconsole_messages', req.t('rcon_commands:RconGetssAll.ss_all_executed'));
							}).then(function(disconnect){
								rcon.disconnect();
								res.redirect('back');
							}).catch(function(err) {
								console.log('We have an error: '+err.stack);
								req.flash('rconconsole_messages', err.stack);
								res.redirect('back');
							});	
					}else{
						req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
						res.redirect('back');
					}
				}else{
					req.flash('error_messages', req.t('rcon_commands:general.general_command_disabled_by_admin'));
					res.redirect('back');
				}
			}else{
				req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
				res.redirect('back');
			}
		}).catch(function(err) {
			req.flash('error_messages', req.t('rcon_commands:general.general_there_was_an_error', { get_error: err }));
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconChangeMap: function(req, res, next) {
		BluebirdPromise.props({
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			maps: Maps.findOne({'map_name': req.body.map_name}).execAsync(),
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
		}).then(function(results) {	
			if (results.getserver){
				if ( results.requiredpower.enable_map_change !== 'undefined' && results.requiredpower.enable_map_change){
					if (req.user.local.user_role >= results.requiredpower.minimum_power_for_map_change){
						var cmd = req.body.rcon_cmd+' '+req.body.map_name;
						var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
							rcon.connect()
							.then(function(connected){
								return rcon.command(cmd);
							}).then(function(getresult){
								req.flash('rconconsole_messages', req.t('rcon_commands:RconChangeMap.map_changed_to_mapname', { get_MapName: results.maps.display_map_name }));
							}).then(function(disconnect){
								rcon.disconnect();
								res.redirect('back');
							}).catch(function(err) {
								req.flash('rconconsole_messages', err.stack);
								res.redirect('back');
							});
					}else{
						req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
						res.redirect('back');
					}
				}else{
						req.flash('error_messages', req.t('rcon_commands:general.general_command_disabled_by_admin'));
						res.redirect('back');
				}
			}else{
				req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
				res.redirect('back');
			}
		}).catch(function(err) {
			req.flash('error_messages', req.t('rcon_commands:general.general_there_was_an_error', { get_error: err }));
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconTempban: function(req, res, next) {
		BluebirdPromise.props({
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
			checkifbanned: Bans.findOne({'player_guid':req.body.player_slot}).execAsync(),
			tempbanselect_enabled: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getcommand: Rconcommand.findOne({'command_name': 'tempban'}).execAsync(),
			getselectedtime: TempbanDurations.findOne({'short_label': req.body.tempbanduration}).execAsync()
		}).then(function(results) {
			if (results.getserver){
				if (!results.checkifbanned){
					if (results.getcommand){
						if (req.user.local.user_role >= results.getcommand.req_power){
							var getNum = gettempbannumber(req.body.tempbanduration)
							if (results.getselectedtime.category_alias == 'minute'){
								if (getNum == 1){
									var time_label=main_lng('rcon_commands:input_select_time.m');
									var time_label_web=req.t('rcon_commands:input_select_time.m');
								} else {
									var time_label=main_lng('rcon_commands:input_select_time.mm');
									var time_label_web=req.t('rcon_commands:input_select_time.mm');
								}
							} else if (results.getselectedtime.category_alias == 'hour'){
								if (getNum == 1){
									var time_label=main_lng('rcon_commands:input_select_time.h');
									var time_label_web=req.t('rcon_commands:input_select_time.h');
								} else {
									var time_label=main_lng('rcon_commands:input_select_time.hh');
									var time_label_web=req.t('rcon_commands:input_select_time.hh');
								}
							} else if(results.getselectedtime.category_alias == 'day'){
								if (getNum == 1){
									var time_label=main_lng('rcon_commands:input_select_time.d');
									var time_label_web=req.t('rcon_commands:input_select_time.d');
								} else {
									var time_label=main_lng('rcon_commands:input_select_time.dd');
									var time_label_web=req.t('rcon_commands:input_select_time.dd');
								}
							} else {
								req.flash('error_messages', req.t('rcon_commands:RconTempban.wrong_time_format'));
								res.redirect('back');
							}

							if ( typeof results.tempbanselect_enabled.enable_tempban_duration !== 'undefined' && results.tempbanselect_enabled.enable_tempban_duration){
								if (results.getselectedtime.category_alias == 'minute'){
									var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'm').toDate();
								} else if (results.getselectedtime.category_alias == 'hour'){
									var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'h').toDate();
								} else if(results.getselectedtime.category_alias == 'day'){
									var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'd').toDate();
								} else {
									req.flash('error_messages', req.t('rcon_commands:RconTempban.wrong_time_format'));
									res.redirect('back');
								}
							} else {
								var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'm').toDate();
							}
							if ( typeof req.body.message !== 'undefined' && req.body.message){
								setdefault_reason = req.body.message;
							}else{
								setdefault_reason = main_lng('rcon_commands:general.default_reason');
							}

							PlayersData.findOne({'player_guid':req.body.player_slot}, function( err, checkplayerdata ) {
								if (err){
									console.log(err)
								} else{
									if (checkplayerdata){
										User.findOne({'steam.id':checkplayerdata.player_steam_id, 'local.user_role': {$gt: 1}, 'steam.id': { $ne: '0' }}, function( err, checkifimune ) {
											if (checkifimune){
												req.flash('error_messages', req.t('rcon_commands:general.is_imune', { get_AdminName: checkifimune.local.user_name }));
												res.redirect('back');
											} else {
												var cmd = 'kick '+req.body.player_slot+' '+setdefault_reason;
												var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
												rcon.connect()
												.then(function(connected){
													return rcon.command(cmd);
												}).then(function(getresult){
													if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
														req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
													}
													var newTempban = new Tempbans ({
														player_name: req.body.rcon_player,
														player_guid: req.body.player_slot,
														admin_name: req.user.local.user_name,
														admin_message: setdefault_reason,
														admin_command: req.body.rcon_cmd,
														game_server: results.getserver.slug_name,
														admin_id: req.user._id,
														admin_steam_id: req.user.steam.id,
														expire: tempbanexpire
									  			});
													newTempban.saveAsync();
													req.flash('rconconsole_messages', req.t('rcon_commands:RconTempban.tempban_msg_web', { get_PlayerName:req.body.rcon_player, get_TimeNumber:getNum, get_TimeCategory:time_label_web, get_Reason:setdefault_reason }));
												}).then(function(returninfo){
													if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
														var cmdinform = 'say '+main_lng('rcon_commands:RconTempban.tempban_msg_game_server', { get_PlayerName: req.body.rcon_player, get_AdminName: req.user.local.user_name, get_TimeNumber: getNum, get_TimeCategory: time_label, get_Reason: setdefault_reason });
														return rcon.command(cmdinform);
													}
												}).then(function(disconnect){
													rcon.disconnect();
													res.redirect('back');
												}).catch(function(err) {
													req.flash('rconconsole_messages', err.stack);
													res.redirect('back');
												});	
											}
										})
									} else {
										var cmd = 'kick '+req.body.player_slot+' '+setdefault_reason;
										var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
										rcon.connect()
										.then(function(connected){
											return rcon.command(cmd);
										}).then(function(getresult){
											if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
												req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
											}
											var newTempban = new Tempbans ({
						  					player_name: req.body.rcon_player,
												player_guid: req.body.player_slot,
												admin_name: req.user.local.user_name,
												admin_message: setdefault_reason,
												admin_command: req.body.rcon_cmd,
												game_server: results.getserver.slug_name,
												admin_id: req.user._id,
												admin_steam_id: req.user.steam.id,
												expire: tempbanexpire
							  			});
							  			newTempban.saveAsync();
											req.flash('rconconsole_messages', req.t('rcon_commands:RconTempban.tempban_msg_web', { get_PlayerName: req.body.rcon_player, get_TimeNumber:getNum, get_TimeCategory:time_label_web, get_Reason: setdefault_reason }));
										}).then(function(returninfo){
											if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
												var cmdinform = 'say '+main_lng('rcon_commands:RconTempban.tempban_msg_game_server', { get_PlayerName: req.body.rcon_player, get_AdminName: req.user.local.user_name, get_TimeNumber: getNum, get_TimeCategory: time_label, get_Reason: setdefault_reason });
												return rcon.command(cmdinform);
											}
										}).then(function(disconnect){
											rcon.disconnect();
											res.redirect('back');
										}).catch(function(err) {
											req.flash('rconconsole_messages', err.stack);
											res.redirect('back');
										});	
									}
								}
							})			
						} else {
							req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
							res.redirect('back');
						}
					} else {
						req.flash('error_messages', req.t('rcon_commands:general.cmd_doesnt_exist'));
						res.redirect('back');
					}
				} else {
					req.flash('error_messages', req.t('rcon_commands:RconTempban.is_already_banned', {get_PlayerName:req.body.rcon_player}));
					res.redirect('back');
				}
			}else{
				req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
				res.redirect('back');
			}
		}).catch(function(err) {
			req.flash('error_messages', req.t('rcon_commands:general.general_there_was_an_error', { get_error: err }));
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconAdminAction: function(req, res, next) {
		BluebirdPromise.props({
			getcommand: Rconcommand.findOne({'command_name': req.body.rcon_cmd}).execAsync(),
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
		}).then(function(results) {
			if (results.getserver){
				if (results.getcommand){
					if (req.user.local.user_role >= results.getcommand.req_power){
						if ( typeof req.body.message !== 'undefined' && req.body.message){
							setdefault_reason = req.body.message;
						}else{
							setdefault_reason = main_lng('rcon_commands:general.default_reason');
						}

						if (req.body.rcon_cmd == 'tell'){
							sendcommand = ' ^5(^6'+req.user.local.user_name+'^5)^7'+setdefault_reason;
						}else{
							sendcommand = setdefault_reason;
						}
						var cmd = req.body.rcon_cmd+' '+req.body.player_slot+' '+sendcommand;						
						var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
							rcon.connect()
							.then(function(connected){
								return rcon.command(cmd);
							}).then(function(getresult){
								if (req.body.rcon_cmd=='kick'){
									req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
									req.flash('rconconsole_messages', req.t('rcon_commands:RconAdminAction.kick_msg_web', {get_PlayerName:req.body.rcon_player, get_Reason: setdefault_reason}));
								}
								else if (req.body.rcon_cmd=='tell'){
									req.flash('rconconsole_messages', req.t('rcon_commands:RconAdminAction.tell_msg_web', {get_PlayerName: req.body.rcon_player}));
								}
								else if (req.body.rcon_cmd=='screentell'){
									req.flash('rconconsole_messages', req.t('rcon_commands:RconAdminAction.screentell_msg_web', {get_PlayerName: req.body.rcon_player}));
								} else {
									req.flash('error_messages', req.t('rcon_commands:general.cmd_doesnt_exist'));
									res.redirect('back');
								}							
							}).then(function(returninfo){										
								if (req.body.rcon_cmd=='kick'){
									if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
										var cmdinform = 'say '+main_lng('rcon_commands:RconAdminAction.kick_msg_game_server', {get_PlayerName: req.body.rcon_player, get_AdminName: req.user.local.user_name, get_Reason: setdefault_reason});
										return rcon.command(cmdinform);
									}
								}
							}).then(function(disconnect){
								rcon.disconnect();
								res.redirect('back');
							}).catch(function(err) {
								req.flash('rconconsole_messages', err.stack);
								res.redirect('back');
							});
					}else{
						req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
						res.redirect('back');
					}
				}else{
					req.flash('error_messages', req.t('rcon_commands:general.cmd_doesnt_exist'));
					res.redirect('back');
				}
			}else{
				req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},


	RconChatAction: function(req, res, next) {
		BluebirdPromise.props({
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
			checkifbanned: Bans.findOne({'player_guid':req.body.player_slot}).execAsync(),
			tempbanselect_enabled: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getcommand: Rconcommand.findOne({'command_name': 'tempban'}).execAsync(),
			getselectedtime: TempbanDurations.findOne({'short_label': req.body.tempbanduration}).execAsync()
		}).then(function(results) {
			if (results.getserver){
				if (!results.checkifbanned){
					if (results.getcommand){
						if (req.user.local.user_role >= results.getcommand.req_power){
							var getNum = gettempbannumber(req.body.tempbanduration)
							if (results.getselectedtime.category_alias == 'minute'){
								if (getNum == 1){
									var time_label=main_lng('rcon_commands:input_select_time.m');
									var time_label_web=req.t('rcon_commands:input_select_time.m');
								} else {
									var time_label=main_lng('rcon_commands:input_select_time.mm');
									var time_label_web=req.t('rcon_commands:input_select_time.mm');
								}
							} else if (results.getselectedtime.category_alias == 'hour'){
								if (getNum == 1){
									var time_label=main_lng('rcon_commands:input_select_time.h');
									var time_label_web=req.t('rcon_commands:input_select_time.h');
								} else {
									var time_label=main_lng('rcon_commands:input_select_time.hh');
									var time_label_web=req.t('rcon_commands:input_select_time.hh');
								}
							} else if(results.getselectedtime.category_alias == 'day'){
								if (getNum == 1){
									var time_label=main_lng('rcon_commands:input_select_time.d');
									var time_label_web=req.t('rcon_commands:input_select_time.d');
								} else {
									var time_label=main_lng('rcon_commands:input_select_time.dd');
									var time_label_web=req.t('rcon_commands:input_select_time.dd');
								}
							} else {
								req.flash('error_messages', req.t('rcon_commands:RconTempban.wrong_time_format'));
								res.redirect('back');
							}

							if ( typeof results.tempbanselect_enabled.enable_tempban_duration !== 'undefined' && results.tempbanselect_enabled.enable_tempban_duration){
								if (results.getselectedtime.category_alias == 'minute'){
									var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'm').toDate();
								} else if (results.getselectedtime.category_alias == 'hour'){
									var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'h').toDate();
								} else if(results.getselectedtime.category_alias == 'day'){
									var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'd').toDate();
								} else {
									req.flash('error_messages', req.t('rcon_commands:RconTempban.wrong_time_format'));
									res.redirect('back');
								}
							} else {
								var tempbanexpire = moment().add(gettempbannumber(req.body.tempbanduration), 'm').toDate();
							}
							if ( typeof req.body.message !== 'undefined' && req.body.message){
								setdefault_reason = req.body.message;
							}else{
								setdefault_reason = main_lng('rcon_commands:general.default_reason');
							}

							PlayersData.findOne({'player_guid':req.body.player_slot}, function( err, checkplayerdata ) {
								if (err){
									console.log(err)
								} else{
									if (checkplayerdata){
										User.findOne({'steam.id':checkplayerdata.player_steam_id, 'local.user_role': {$gt: 1}, 'steam.id': { $ne: '0' }}, function( err, checkifimune ) {
											if (checkifimune){
												req.flash('error_messages', req.t('rcon_commands:general.is_imune', { get_AdminName: checkifimune.local.user_name }));
												res.redirect('back');
											} else {
												if (req.body.rcon_cmd=='chat'){
													var rconcommand_action='kick '+main_lng('rcon_commands:RconChatAction.chat_and_voice_mute_rcon_command_reason', { get_PlayerGuid: checkplayerdata.player_guid, get_TimeNumber: getNum, get_Category: time_label, get_Reason: setdefault_reason });
													var rconcommand_message='say '+main_lng('rcon_commands:RconChatAction.chat_and_voice_mute_server_message', { get_PlayerName: checkplayerdata.player_guid, get_TimeNumber: getNum, get_Category: time_label,get_Admin:req.user.local.user_name, get_Reason: setdefault_reason });
												} else if (req.body.rcon_cmd=='mute'){
													var rconcommand_action='kick '+main_lng('rcon_commands:RconChatAction.voice_mute_rcon_command_reason', { get_PlayerGuid: checkplayerdata.player_guid, get_TimeNumber: getNum, get_Category: time_label, get_Reason: setdefault_reason });
													var rconcommand_message='say '+main_lng('rcon_commands:RconChatAction.voice_mute_server_message', { get_PlayerName: checkplayerdata.player_name, get_TimeNumber: getNum, get_Category: time_label,get_Admin:req.user.local.user_name, get_Reason: setdefault_reason });
												} else {
													req.flash('error_messages', req.t('rcon_commands:general.cmd_doesnt_exist'));
													res.redirect('back');
												}
												var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
												rcon.connect()
												.then(function(connected){
													return rcon.command(rconcommand_action);
												}).then(function(sendmsg){
													if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
														return rcon.command(rconcommand_message);
													}
												}).then(function(getresult){
													var newTempban = new Tempbans ({
								  					player_name: req.body.rcon_player,
														player_guid: req.body.player_slot,
														admin_name: req.user.local.user_name,
														admin_message: setdefault_reason,
														admin_command: req.body.rcon_cmd,
														game_server: results.getserver.slug_name,
														admin_id: req.user._id,
														admin_steam_id: req.user.steam.id,
														expire: tempbanexpire
									  			});
													newTempban.saveAsync();
													if (req.body.rcon_cmd=='chat'){
														req.flash('rconconsole_messages', req.t('rcon_commands:RconChatAction.return_message_muted_chat',{ get_PlayerName:req.body.rcon_player}));
													} else {
														req.flash('rconconsole_messages', req.t('rcon_commands:RconChatAction.return_message_muted_voice',{ get_PlayerName:req.body.rcon_player}));
													}													
													req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
												}).then(function(disconnect){
													rcon.disconnect();
													res.redirect('back');
												}).catch(function(err) {
													req.flash('rconconsole_messages', err.stack);
													res.redirect('back');
												});	
											}
										})
									} else {
										if (req.body.rcon_cmd=='chat'){
											var rconcommand_action='kick '+main_lng('rcon_commands:RconChatAction.chat_and_voice_mute_rcon_command_reason', { get_PlayerGuid: req.body.player_slot, get_TimeNumber: getNum, get_Category: time_label, get_Reason: setdefault_reason });
											var rconcommand_message='say '+main_lng('rcon_commands:RconChatAction.chat_and_voice_mute_server_message', { get_PlayerName: req.body.player_slot, get_TimeNumber: getNum, get_Category: time_label,get_Admin:req.user.local.user_name, get_Reason: setdefault_reason });
										} else if (req.body.rcon_cmd=='mute'){
											var rconcommand_action='kick '+main_lng('rcon_commands:RconChatAction.voice_mute_rcon_command_reason', { get_PlayerGuid: req.body.player_slot, get_TimeNumber: getNum, get_Category: time_label, get_Reason: setdefault_reason });
											var rconcommand_message='say '+main_lng('rcon_commands:RconChatAction.voice_mute_server_message', { get_PlayerName: req.body.rcon_player, get_TimeNumber: getNum, get_Category: time_label,get_Admin:req.user.local.user_name, get_Reason: setdefault_reason });
										} else {
											req.flash('error_messages', req.t('rcon_commands:general.cmd_doesnt_exist'));
											res.redirect('back');
										}
										var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
										rcon.connect()
										.then(function(connected2){
											return rcon.command(rconcommand_action);
										}).then(function(sendmsg2){
											if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
												return rcon.command(rconcommand_message);
											}
										}).then(function(getresult){
											var newTempban = new Tempbans ({
						  					player_name: req.body.rcon_player,
												player_guid: req.body.player_slot,
												admin_name: req.user.local.user_name,
												admin_message: setdefault_reason,
												admin_command: req.body.rcon_cmd,
												game_server: results.getserver.slug_name,
												admin_id: req.user._id,
												admin_steam_id: req.user.steam.id,
												expire: tempbanexpire
							  			});
											newTempban.saveAsync();
											if (req.body.rcon_cmd=='chat'){
												req.flash('rconconsole_messages', req.t('rcon_commands:RconChatAction.return_message_muted_chat',{ get_PlayerName:req.body.rcon_player}));
											} else {
												req.flash('rconconsole_messages', req.t('rcon_commands:RconChatAction.return_message_muted_voice',{ get_PlayerName:req.body.rcon_player}));
											}													
											req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
										}).then(function(disconnect){
											rcon.disconnect();
											res.redirect('back');
										}).catch(function(err) {
											req.flash('rconconsole_messages', err.stack);
											res.redirect('back');
										});	
									}
								}
							})			
						} else {
							req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
							res.redirect('back');
						}
					} else {
						req.flash('error_messages', req.t('rcon_commands:general.cmd_doesnt_exist'));
						res.redirect('back');
					}
				} else {
					req.flash('error_messages', req.t('rcon_commands:RconTempban.is_already_banned', {get_PlayerName:req.body.rcon_player}));
					res.redirect('back');
				}
			}else{
				req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
				res.redirect('back');
			}
		}).catch(function(err) {
			req.flash('error_messages', req.t('rcon_commands:general.general_there_was_an_error', { get_error: err }));
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	Rcongetss: function(req, res, next) {
		var start = moment().toDate();
		BluebirdPromise.props({
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getserver: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
			screenshotserver: Servers.findOne({'_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
			countscreenshots: UserScreenshots.countDocuments({'get_user':req.user._id, updatedAt: {$gt: (start -59*60000)}}).execAsync()
		}).then(function(results) {
			if(results.requiredpower.screenshots_for_users_enabled !== 'undefined' && results.requiredpower.screenshots_for_users_enabled){
				if (results.screenshotserver){
					if (results.requiredpower.maximum_screenshots_for_users > results.countscreenshots){
						var cmd = req.body.rcon_cmd+' '+req.body.player_slot;
						var	rcon = require('srcds-rcon')({address:results.screenshotserver.ip+':'+results.screenshotserver.port,password: results.screenshotserver.rcon_password});
							rcon.connect()
							.then(function(connected){
								return rcon.command(cmd);
							}).then(function(getresult){
								PlayersData.findOneAndUpdate({'player_guid': req.body.player_slot}, {$set:{sshack:true}}, function(err){
								    if(err){
								        console.log("Something is wrong when updating playersdata on screenshot arrived!");
								    }
								});
								if (req.user.local.user_role <= results.requiredpower.maximum_screenshots_for_users){
									var newUserScreenshot = new UserScreenshots ({
			  						get_user: req.user._id,
										get_server: results.screenshotserver._id
					  			});
					  			newUserScreenshot.saveAsync()
								}								
				  				req.flash('rconconsole_messages', getresult);
							}).then(function(disconnect){
								rcon.disconnect();
								res.redirect('back');
							}).catch(function(err) {
								req.flash('rconconsole_messages', err.stack);
								res.redirect('back');
							});
					}else{
						req.flash('error_messages', req.t('rcon_commands:Rcongetss.max_ss_hourly', { get_MaxNumber: results.requiredpower.maximum_screenshots_for_users }));
						res.redirect('back');
					}
				}else{
						req.flash('error_messages', req.t('rcon_commands:general.no_server_found'));
						res.redirect('back');
				}
			} else {
				if (results.getserver){
					if ( results.requiredpower.screenshots_enabled !== 'undefined' && results.requiredpower.screenshots_enabled){
						if (req.user.local.user_role >= results.requiredpower.minimum_admin_power_for_screenshots){
							var cmd = req.body.rcon_cmd+' '+req.body.player_slot;
							var	rcon = require('srcds-rcon')({address:results.getserver.ip+':'+results.getserver.port,password: results.getserver.rcon_password});
								rcon.connect()
								.then(function(connected){
									return rcon.command(cmd);
								}).then(function(getresult){
				  					req.flash('rconconsole_messages', getresult);
								}).then(function(disconnect){
									rcon.disconnect();
									res.redirect('back');
								}).catch(function(err) {
									req.flash('rconconsole_messages', err.stack);
									res.redirect('back');
								});	
						}else{
							req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
							res.redirect('back');
						}
					}else{
						req.flash('error_messages', req.t('rcon_commands:general.general_command_disabled_by_admin'));
						res.redirect('back');
					}
				}else{
					req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
					res.redirect('back');
				}
			}	
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconPermban: function(req, res, next) {
		var create_img_variable = "/img/screenshots/"+req.params.screenshot_img+".jpg";
		BluebirdPromise.props({
			getscreenshot: ServerScreenshots.findOne({'screenshot_img': create_img_variable}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync(),
			getcommand: Rconcommand.findOne({'command_name': 'permban'}).execAsync()
		}).then(function(results) {
			if (results.getscreenshot){
				Servers.findOne({'_id':results.getscreenshot.get_server, 'admins_on_server':req.user._id, 'rcon_password': { $exists: true }})
					.then(function(server_admins) {
						if (server_admins){
							if (req.user.local.user_role >= results.requiredpower.minimum_power_for_player_unban){
								Bans.findOne({'player_guid':results.getscreenshot.player_guid}, function( err, checkbanned ) {
									if (err){
										console.log(err)
									} else{
										if (checkbanned){
											req.flash('error_messages', req.t('rcon_commands:general.already_banned_guid'));
											res.redirect('back');
										} else {
											PlayersData.findOne({'player_guid':results.getscreenshot.player_guid}, function( err, checkplayerdata ) {
												if (err){
													console.log(err)
												} else{
													if (checkplayerdata){
														User.findOne({'steam.id':checkplayerdata.player_steam_id, 'local.user_role': {$gt: 1}, 'steam.id': { $ne: '0' }}, function( err, checkifimune ) {
															if (checkifimune){
																//user is admin can not ban
																req.flash('error_messages', req.t('rcon_commands:general.is_imune', {get_AdminName:checkifimune.local.user_name}));
																res.redirect('back');
															} else {
																setdefault_reason = main_lng('rcon_commands:RconPermban.default_reason_for_report');
																var cmd = 'kick'+' '+results.getscreenshot.player_guid+' '+setdefault_reason;
																var	rcon = require('srcds-rcon')({address:server_admins.ip+':'+server_admins.port,password: server_admins.rcon_password});
																rcon.connect()
																.then(function(connected){
																	return rcon.command(cmd);
																}).then(function(getresult){
										  							var newBan = new Bans ({
									  									player_name: results.getscreenshot.player_name,
									  									player_guid: results.getscreenshot.player_guid,
									  									player_screenshot:'/img/banned/'+req.params.screenshot_img+'.jpg',
									  									admin_name: req.user.local.user_name,
									  									admin_id: req.user._id,
									  									admin_steam_id: req.user.steam.id,
																		admin_message: setdefault_reason,
																		rcon_command: 'permban',
																		server_name: server_admins.slug_name,
																		rcon_admin: req.user._id
										  							});
																	if (!fs.existsSync('./public/img/banned')){
																		fs.mkdirSync('./public/img/banned');
																	}
										  							fs.rename('./public'+create_img_variable, './public/img/banned/'+req.params.screenshot_img+'.jpg', function(err){
																		if (err) console.log(err);
																	});
																	req.flash('rconconsole_messages', req.t('rcon_commands:RconPermban.rconconsole_messages_on_ban', {get_PlayerName:results.getscreenshot.player_name, get_Reason:setdefault_reason}));
																	req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
																	newBan.saveAsync();
																	
																	ServerScreenshots.deleteOne({'screenshot_img': create_img_variable}, function(error) {
																		if (error) {
																			console.log(error);
																		}
																	});
																}).then(function(returninfo){
																	if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
																		var cmdinform = 'say '+main_lng('rcon_commands:RconPermban.rconconsole_cmdinform_on_ban', {get_PlayerName:results.getscreenshot.player_name, get_Admin:req.user.local.user_name, get_Reason:setdefault_reason});
																		return rcon.command(cmdinform);
																	}
																}).then(function(disconnect){
																	rcon.disconnect();
																	res.redirect('back');
																}).catch(function(err) {
																	req.flash('rconconsole_messages', err.stack);
																	res.redirect('/'+server_admins.name_alias);
																});
															}
														})
													} else {
														setdefault_reason = main_lng('rcon_commands:RconPermban.default_reason_for_report');
														var cmd = 'kick'+' '+results.getscreenshot.player_guid+' '+setdefault_reason;
														var	rcon = require('srcds-rcon')({address:server_admins.ip+':'+server_admins.port,password: server_admins.rcon_password});
														rcon.connect()
														.then(function(connected){
															return rcon.command(cmd);
														}).then(function(getresult){
								  							var newBan = new Bans ({
							  									player_name: results.getscreenshot.player_name,
							  									player_guid: results.getscreenshot.player_guid,
							  									player_screenshot:'/img/banned/'+req.params.screenshot_img+'.jpg',
							  									admin_name: req.user.local.user_name,
							  									admin_id: req.user._id,
							  									admin_steam_id: req.user.steam.id,
																admin_message: setdefault_reason,
																rcon_command: 'permban',
																server_name: server_admins.slug_name,
																rcon_admin: req.user._id
								  							});
															if (!fs.existsSync('./public/img/banned')){
																fs.mkdirSync('./public/img/banned');
															}
								  							fs.rename('./public'+create_img_variable, './public/img/banned/'+req.params.screenshot_img+'.jpg', function(err){
																if (err) console.log(err);
															});
															req.flash('rconconsole_messages', req.t('rcon_commands:RconPermban.rconconsole_messages_on_ban', {get_PlayerName:results.getscreenshot.player_name, get_Reason:setdefault_reason}));
															req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
															newBan.saveAsync();
															
															ServerScreenshots.deleteOne({'screenshot_img': create_img_variable}, function(error) {
																if (error) {
																	console.log(error);
																}
															});
														}).then(function(returninfo){
															if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
																	var cmdinform = 'say '+main_lng('rcon_commands:RconPermban.rconconsole_cmdinform_on_ban', {get_PlayerName:results.getscreenshot.player_name, get_Admin:req.user.local.user_name, get_Reason:setdefault_reason});
																	return rcon.command(cmdinform);
															}
														}).then(function(disconnect){
															rcon.disconnect();
															res.redirect('back');
														}).catch(function(err) {
															req.flash('rconconsole_messages', err.stack);
															res.redirect('/'+server_admins.name_alias);
														});
													}
												}
											})
											
										}
									}
								});
							}else{
								req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
								res.redirect('back');
							}
						}else{
							req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
							res.redirect('back');
						}
					}).catch(function(err) {
						console.log("There was an error: " +err);
						res.redirect('back');
					});					
			}else{
				req.flash('error_messages', req.t('rcon_commands:RconPermban.no_ss_found'));
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},




	RconPermbanNoImage: function(req, res, next) {
		BluebirdPromise.props({
			servers: Servers.findOne({'admins_on_server':req.user._id, '_id':req.params.id, 'rcon_password': { $exists: true }}).execAsync(),
			getcommand: Rconcommand.findOne({'command_name': 'permban'}).execAsync(),
			checkbanned: Bans.findOne({'player_guid': req.body.player_slot}).execAsync()
		}).then(function(results) {
			if (results.servers){
				if (req.user.local.user_role >= results.getcommand.req_power){
					Bans.findOne({'player_guid':req.body.player_slot}, function( err, checkbanned ) {
						if (err){
							console.log(err)
						} else{
							if (checkbanned){
								req.flash('error_messages', req.t('rcon_commands:general.already_banned_guid'));
								res.redirect('back');
							} else {
								PlayersData.findOne({'player_guid':req.body.player_slot}, function( err, checkplayerdata ) {
									if (err){
										console.log(err)
									} else{
										if (checkplayerdata){
											User.findOne({'steam.id':checkplayerdata.player_steam_id, 'local.user_role': {$gt: 1}, 'steam.id': { $ne: '0' }}, function( err, checkifimune ) {
												if (checkifimune){
													//user is admin can not ban
													req.flash('error_messages', req.t('rcon_commands:general.is_imune', {get_AdminName:checkifimune.local.user_name}));
													res.redirect('back');
												} else {
													if (req.body.message){
														setdefault_reason = req.body.message;
														var cmd = 'kick'+' '+req.body.rcon_player+' '+setdefault_reason;
														var	rcon = require('srcds-rcon')({address:results.servers.ip+':'+results.servers.port,password: results.servers.rcon_password});
														rcon.connect()
														.then(function(connected){
															return rcon.command(cmd);
														}).then(function(getresult){
								  							var newBan = new Bans ({
									  							player_name: req.body.rcon_player,
									  							player_guid: req.body.player_slot,
									  							player_steam_id: req.body.player_steam_id,
									  							admin_name: req.user.local.user_name,
									  							admin_id: req.user._id,
									  							admin_steam_id: req.user.steam.id,
																admin_message: req.body.message,
																rcon_command: 'permban',
																server_name: results.servers.slug_name,
																rcon_admin: req.user._id
															  });
															req.flash('rconconsole_messages', req.t('rcon_commands:RconPermban.rconconsole_messages_on_ban', {get_PlayerName:req.body.rcon_player, get_Reason:req.body.message}));
															req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
															newBan.saveAsync();
														}).then(function(returninfo){
															if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
																var cmdinform = 'say '+main_lng('rcon_commands:RconPermban.rconconsole_cmdinform_on_ban', {get_PlayerName:req.body.rcon_player, get_Admin:req.user.local.user_name, get_Reason:req.body.message});
																return rcon.command(cmdinform);
															}
														}).then(function(disconnect){
															rcon.disconnect();
															res.redirect('back');
														}).catch(function(err) {
															req.flash('rconconsole_messages', err.stack);
															res.redirect('/'+servers.name_alias);
														});
													} else {
														req.flash('error_messages', req.t('rcon_commands:RconPermbanNoImage.no_reason_given_error'));
														res.redirect('back');
													}
												}
											})
										} else {
											if (req.body.message){
												setdefault_reason = req.body.message;
												var cmd = 'kick'+' '+req.body.rcon_player+' '+setdefault_reason;
												var	rcon = require('srcds-rcon')({address:results.servers.ip+':'+results.servers.port,password: results.servers.rcon_password});
												rcon.connect()
												.then(function(connected){
													return rcon.command(cmd);
												}).then(function(getresult){
								  					var newBan = new Bans ({
									  					player_name: req.body.rcon_player,
									  					player_guid: req.body.player_slot,
									  					player_steam_id: req.body.player_steam_id,
									  					admin_name: req.user.local.user_name,
									  					admin_id: req.user._id,
									  					admin_steam_id: req.user.steam.id,
														admin_message: req.body.message,
														rcon_command: 'permban',
														server_name: results.servers.slug_name,
														rcon_admin: req.user._id
													});
													req.flash('rconconsole_messages', req.t('rcon_commands:RconPermban.rconconsole_messages_on_ban', {get_PlayerName:req.body.rcon_player, get_Reason:req.body.message}));
													req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
													newBan.saveAsync();
												}).then(function(returninfo){
													if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
														var cmdinform = 'say '+main_lng('rcon_commands:RconPermban.rconconsole_cmdinform_on_ban', {get_PlayerName:req.body.rcon_player, get_Admin:req.user.local.user_name, get_Reason:req.body.message});
														return rcon.command(cmdinform);
													}
												}).then(function(disconnect){
													rcon.disconnect();
													res.redirect('back');
												}).catch(function(err) {
													req.flash('rconconsole_messages', err.stack);
													res.redirect('/'+servers.name_alias);
												});
											} else {
												req.flash('error_messages', req.t('rcon_commands:RconPermbanNoImage.no_reason_given_error'));
												res.redirect('back');
											}
										}
									}
								})
							}
						}
					});
				}else{
					req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
					res.redirect('back');
				}			
			} else {
				req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconPermbanOnReport: function(req, res, next) {
		BluebirdPromise.props({
			getreport: Cheaterreports.findOne({'_id': req.params.id}).populate('sender_id').execAsync(),
			getcommand: Rconcommand.findOne({'command_name': 'permban'}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then(function(results) {
			if (results.getreport){
				Servers.findOne({'_id':results.getreport.rcon_server, 'admins_on_server':req.user._id, 'rcon_password': { $exists: true }})
					.then(function(server_admins) {
						if (server_admins){
							Bans.findOne({'player_guid':results.getreport.player_guid}, function( err, checkbanned ) {
								if (err){
										console.log(err)
								} else {
									if (checkbanned){
										var newGlobalnotifications = new Globalnotifications ({
											sender_id: req.user._id,
											recipient_id: results.getreport.sender_id,
											link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_cheater_report_already_banned', {reported_PlayerName: results.getreport.player_name}),
											link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_cheater_report_already_banned'),
											link_url: '/notifications',
											plus_message: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_plus_message_cheater_report_already_banned', {reported_PlayerName:results.getreport.player_name}),
											message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_cheater_report_already_banned'),
											reported_player:results.getreport.player_name,
											admin_decision: 2,
											notification_type:'cheater_report'
										});
										newGlobalnotifications.saveAsync()
										req.flash('rconconsole_messages', req.t('rcon_commands:RconPermbanOnReport.send_info_msg_to_reporter'));
										Cheaterreports.deleteMany({'_id': req.params.id}).exec();
										Notifications.deleteMany({'cheater_report_id':results.getreport._id}).exec();
										fs.unlink('./public'+results.getreport.player_screenshot, function(err) {
											if (err) {
												console.error("Error occurred while trying to remove file");
											}
										});
										req.flash('error_messages', req.t('rcon_commands:general.already_banned_guid'));
										res.redirect('back');
									} else {
										if (req.user.local.user_role >= results.requiredpower.minimum_power_for_player_unban){
											PlayersData.findOne({'player_guid':results.getreport.player_guid}, function( err, checkplayerdata ) {
												if (err){
													console.log(err)
												} else{
													if (checkplayerdata){
														User.findOne({'steam.id':checkplayerdata.player_steam_id, 'local.user_role': {$gt: 1}, 'steam.id': { $ne: '0' }}, function( err, checkifimune ) {
															if (checkifimune){
																req.flash('error_messages', req.t('rcon_commands:general.is_imune', {get_AdminName:checkifimune.local.user_name}));
																res.redirect('back');
															} else {
																setdefault_reason = main_lng('rcon_commands:RconPermban.default_reason_for_report');
																var cmd = 'kick'+' '+results.getreport.player_guid+' '+setdefault_reason;
																var	rcon = require('srcds-rcon')({address:server_admins.ip+':'+server_admins.port,password: server_admins.rcon_password});
																rcon.connect()
																.then(function(connected){
																	return rcon.command(cmd);
																}).then(function(getresult){	
																	var newpath = replaceString(results.getreport.player_screenshot, "/img/cheater-reports/", "/img/banned/");
																	req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
													  				var newBan = new Bans ({
												  						player_name: results.getreport.player_name,
												  						player_guid: results.getreport.player_guid,
												  						player_screenshot:newpath,
												  						admin_name: req.user.local.user_name,
												  						admin_id: req.user._id,
												  						admin_steam_id: req.user.steam.id,
																		admin_message: main_lng('rcon_commands:RconPermban.default_reason_for_report'),
																		rcon_command: 'permban',
																		server_name: server_admins.slug_name,
																		rcon_admin: req.user._id,
																		cheater_reporter_id: results.getreport.sender_id._id,
																		cheater_reporter: main_lng('rcon_commands:RconPermbanOnReport.ty_to_reporter', {get_BannedName:results.getreport.player_name, get_ReporterName:results.getreport.sender_id.local.user_name })
													  				});
																	var newGlobalnotifications = new Globalnotifications ({
																		sender_id: req.user._id,
																		recipient_id: results.getreport.sender_id,
																		link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_cheater_report_accepted'),
																		link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_cheater_report_accepted'),
																		link_url: '/notifications',
																		plus_message: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_plus_message_cheater_report_accepted', {get_BannedPlayerName:results.getreport.player_name}),
																		message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_cheater_report_accepted', {get_BannedPlayerName:results.getreport.player_name}),
																		reported_player:results.getreport.player_name,
																		admin_decision: 1,
																		notification_type:'cheater_report'
																	});
																	newGlobalnotifications.saveAsync()
													  				newBan.saveAsync();
																	if (!fs.existsSync('./public/img/banned')){
																		fs.mkdirSync('./public/img/banned');
																	}
													  				fs.rename('./public'+results.getreport.player_screenshot, './public'+newpath, function(err){
																		if (err) console.log(err);
																	});

																	req.flash('rconconsole_messages', req.t('rcon_commands:RconPermban.rconconsole_messages_on_ban', {get_PlayerName:results.getreport.player_name, get_Reason:setdefault_reason}));
																	Cheaterreports.deleteMany({'_id': req.params.id}).exec();
																	Notifications.deleteMany({'cheater_report_id':results.getreport._id}).exec();
																}).then(function(returninfo){
																	if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
																		var cmdinform = 'say '+main_lng('rcon_commands:RconPermban.rconconsole_cmdinform_on_ban', {get_PlayerName:results.getreport.player_name, get_Admin:req.user.local.user_name, get_Reason:setdefault_reason});
																		return rcon.command(cmdinform);
																	}
																}).then(function(disconnect){
																	rcon.disconnect();
																	res.redirect('back');
																}).catch(function(err) {
																	req.flash('rconconsole_messages', err.stack);
																	res.redirect('back');
																});
															}
														})
													} else {
														setdefault_reason = main_lng('rcon_commands:RconPermban.default_reason_for_report');
														var cmd = 'kick'+' '+results.getreport.player_guid+' '+setdefault_reason;
														var	rcon = require('srcds-rcon')({address:server_admins.ip+':'+server_admins.port,password: server_admins.rcon_password});
															rcon.connect()
															.then(function(connected){
																return rcon.command(cmd);
															}).then(function(getresult){
																var newpath = replaceString(results.getreport.player_screenshot, "/img/cheater-reports/", "/img/banned/");
																	req.flash('notify_messages', req.t('rcon_commands:general.info_msg_sent_to_server'));
											  					var newBan = new Bans ({
										  							player_name: results.getreport.player_name,
										  							player_guid: results.getreport.player_guid,
										  							player_screenshot:newpath,
										  							admin_name: req.user.local.user_name,
										  							admin_id: req.user._id,
										  							admin_steam_id: req.user.steam.id,
																	admin_message: main_lng('rcon_commands:RconPermban.default_reason_for_report'),
																	rcon_command: 'permban',
																	server_name: server_admins.slug_name,
																	rcon_admin: req.user._id,
																	cheater_reporter_id: results.getreport.sender_id._id,
																	cheater_reporter:main_lng('rcon_commands:RconPermbanOnReport.ty_to_reporter', {get_BannedName:results.getreport.player_name, get_ReporterName:results.getreport.sender_id.local.user_name })
											  					});
																var newGlobalnotifications = new Globalnotifications ({
																	sender_id: req.user._id,
																	recipient_id: results.getreport.sender_id,
																	link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_cheater_report_accepted'),
																	link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_cheater_report_accepted'),
																	link_url: '/notifications',
																	plus_message: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_plus_message_cheater_report_accepted', {get_BannedPlayerName:results.getreport.player_name}),
																	message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_cheater_report_accepted', {get_BannedPlayerName:results.getreport.player_name}),
																	reported_player:results.getreport.player_name,
																	admin_decision: 1,
																	notification_type:'cheater_report'
																});
																newGlobalnotifications.saveAsync()
											  					newBan.saveAsync();
																if (!fs.existsSync('./public/img/banned')){
																	fs.mkdirSync('./public/img/banned');
																}
											  					fs.rename('./public'+results.getreport.player_screenshot, './public'+newpath, function(err){
																	if (err) console.log(err);
																});
																req.flash('rconconsole_messages', req.t('rcon_commands:RconPermban.rconconsole_messages_on_ban', {get_PlayerName:results.getreport.player_name, get_Reason:setdefault_reason}));
																Cheaterreports.deleteMany({'_id': req.params.id}).exec();
																Notifications.deleteMany({'cheater_report_id':results.getreport._id}).exec();
															}).then(function(returninfo){
																if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){								
																	var cmdinform = 'say '+main_lng('rcon_commands:RconPermban.rconconsole_cmdinform_on_ban', {get_PlayerName:results.getreport.player_name, get_Admin:req.user.local.user_name, get_Reason:setdefault_reason});
																	return rcon.command(cmdinform);
																}
															}).then(function(disconnect){
																rcon.disconnect();
																res.redirect('back');
															}).catch(function(err) {
																req.flash('rconconsole_messages', err.stack);
																res.redirect('back');
															});
													}
												}
											})
										} else {
											req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
											res.redirect('back');
										}
									}
								}
							})
						}else{
							req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
							res.redirect('back');
						}
					}).catch(function(err) {
						console.log("There was an error: " +err);
						res.redirect('back');
					});					
			}else{
				req.flash('error_messages', req.t('rcon_commands:RconPermban.no_ss_found'));
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconPermbanOffline: function(req, res, next) {
		BluebirdPromise.props({
			getcommand: Rconcommand.findOne({'command_name': 'permban'}).execAsync(),
			checkbanned: Bans.findOne({'player_guid': req.body.player_slot}).execAsync()
		}).then(function(results) {
				if (req.user.local.user_role >= results.getcommand.req_power){
					Bans.findOne({'player_guid':req.body.player_slot}, function( err, checkbanned ) {
						if (err){
							console.log(err)
						} else{
							if (checkbanned){
								req.flash('error_messages', req.t('rcon_commands:general.already_banned_guid'));
								res.redirect('back');
							} else {
								PlayersData.findOne({'player_guid':req.body.player_slot}, function( err, checkplayerdata ) {
									if (err){
										console.log(err)
									} else{
										if (checkplayerdata){
											User.findOne({'steam.id':checkplayerdata.player_steam_id, 'local.user_role': {$gt: 1}, 'steam.id': { $ne: '0' }}, function( err, checkifimune ) {
												if (checkifimune){
													req.flash('error_messages', req.t('rcon_commands:general.is_imune', {get_AdminName:checkifimune.local.user_name}));
													res.redirect('back');
												} else {
													if (req.body.message){
								  						var newBan = new Bans ({
									  						player_name: checkplayerdata.player_name,
									  						player_guid: checkplayerdata.player_guid,
									  						player_steam_id: checkplayerdata.player_steam_id,
									  						admin_name: req.user.local.user_name,
									  						admin_id: req.user._id,
									  						admin_steam_id: req.user.steam.id,
															admin_message: req.body.message,
															rcon_command: 'permban',
															server_name: 'Offline Ban',
															rcon_admin: req.user._id
														});
														newBan.saveAsync();
														req.flash('success_messages', checkplayerdata.player_name+' successfully Banned');
														res.redirect('back');
													} else {
														req.flash('error_messages', req.t('rcon_commands:RconPermbanNoImage.no_reason_given_error'));
														res.redirect('back');
													}
												}
											})
										} else {
											req.flash('error_messages', 'No player found');
											res.redirect('back');
										}
									}
								})
							}
						}
					});
				}else{
					req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
					res.redirect('back');
				}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconUnban: function(req, res, next) {
		BluebirdPromise.props({
			getban: Bans.findOne({'_id': req.params.id}).execAsync(),
			checkunbanrequest: Notifications.findOne({'bann_id': req.params.id}).execAsync(),
			getcommand: Rconcommand.findOne({'command_name': 'unban'}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then(function(results) {
			if (results.getban){
				Servers.findOne({'slug_name':results.getban.server_name, 'admins_on_server':req.user._id, 'rcon_password': { $exists: true }})
					.then(function(server_admins) {
						if (results.getban.server_name=='Offline Ban'){
							var allowed = true;
						} else if (server_admins) {
							var allowed = true;
						} else {
							var allowed = false;
						}
						if (allowed=true){
							if (req.user.local.user_role >= results.requiredpower.minimum_power_for_player_unban){
								var newUnban = new Unbans ({
									player_name: results.getban.player_name,
									player_guid: results.getban.player_guid,
									rcon_command: 'unban',
									admin_name: results.getban.admin_name,
									admin_id: results.getban.admin_id
								});
								newUnban.saveAsync();

								if (results.checkunbanrequest){
									  var newGlobalnotifications = new Globalnotifications ({
										  sender_id: req.user._id,
										  recipient_id: results.checkunbanrequest.sender_id,
										  link_title:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_title_unban_request_accepted'),
										  link_text: main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_link_text_unban_request_accepted'),
										  link_url: '/notifications',
										  message:main_lng('rcon_commands:globalnotifications.globalnotifications_display_responses_message_unban_request_accepted'),
										  reported_player: results.getban.player_name,
										  admin_decision: 1,
										  notification_type:'unban_request'
									  });
									  newGlobalnotifications.saveAsync()
								}
								if (results.getban.player_screenshot){
									var filePath = './public/'+results.getban.player_screenshot;
									fs.unlink(filePath, function(err) {
										  if (err) {
											  console.log("failed to delete local image:"+err);
										  } else {
											  Notifications.deleteOne({'bann_id' : req.params.id}).exec();
											  Bans.deleteOne({'_id': req.params.id}).exec();
										  }
									  });	
								} else {
									Bans.deleteOne({'_id': req.params.id}).exec();
							  	}		
								req.flash('success_messages', req.t('rcon_commands:RconUnban.success_unban'));
								res.redirect('/banlist');				  			
						} else {
							req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
							res.redirect('back');
						}
					} else {
						req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
						res.redirect('back');
					}
				}).catch(function(err) {
					console.log("There was an error: " +err);
					res.redirect('back');
				});					
			} else {
				req.flash('error_messages', req.t('rcon_commands:RconUnban.permban_not_found'));
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	},

	RconUnbanTempban: function(req, res, next) {
		var current_time = new Date();
		BluebirdPromise.props({
			getban: Tempbans.findOne({'_id': req.params.id, 'expire' : {$gte: current_time}}).execAsync(),
			getcommand: Rconcommand.findOne({'command_name': 'unban'}).execAsync(),
			requiredpower: ExtraRcon.findOne({'name': 'extra_rcon'}).execAsync()
		}).then(function(results) {
			if (results.getban){
				Servers.findOne({'slug_name':results.getban.game_server, 'admins_on_server':req.user.id, 'rcon_password': { $exists: true }})
					.then(function(server_admins) {
						if (server_admins){
							if (req.user.local.user_role >= results.requiredpower.minimum_power_for_player_unban){
								var	rcon = require('srcds-rcon')({address:server_admins.ip+':'+server_admins.port,password: server_admins.rcon_password});
								rcon.connect()
								.then(function(connected){
									if ( typeof results.getcommand.send_back_message_to_server !== 'undefined' && results.getcommand.send_back_message_to_server==true){
										var cmdinform = 'say '+main_lng('rcon_commands:RconUnban.success_unban_server_msg', {unbaned_PlayerName:results.getban.player_name, unban_AdminName:req.user.local.user_name});
										return rcon.command(cmdinform);
									}
								}).then(function(disconnect){
									rcon.disconnect();
									var newUnban = new Unbans ({
										player_name: results.getban.player_name,
										player_guid: results.getban.player_guid,
										rcon_command: 'unban',
										admin_name: results.getban.admin_name,
										admin_id: results.getban.admin_id
									});
									newUnban.saveAsync();					  			
									Tempbans.deleteOne({'_id': req.params.id}).exec();
									req.flash('success_messages', req.t('rcon_commands:RconUnban.success_unban'));
									res.redirect('/banlist');
								}).catch(function(err) {
									console.log("There was an error: " +err);
									console.log(err.stack);
									res.redirect('back');
								});
							} else {
								req.flash('error_messages', req.t('rcon_commands:general.general_no_permission'));
								res.redirect('back');
							}
						}else{
							req.flash('error_messages', req.t('rcon_commands:general.general_no_admin_rights_on_server'));
							res.redirect('back');
						}
					}).catch(function(err) {
						console.log("There was an error: " +err);
						res.redirect('back');
					});					
			} else {
				req.flash('error_messages', req.t('rcon_commands:RconUnban.permban_not_found'));
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log("There was an error: " +err);
			res.redirect('back');
		});
	}
};

function gettempbannumber(string) {
	string = replaceString(string, "m", "");
	string = replaceString(string, "h", "");
	string = replaceString(string, "d", "");
	return string;
};
