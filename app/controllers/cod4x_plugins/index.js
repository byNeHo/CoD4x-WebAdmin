const fs = require('fs');
const mongoose = require('mongoose');
const uniqueString = require('unique-string');
const S = require('underscore.string');
const replaceString = require('replace-string');
const BluebirdPromise = require('bluebird');
const sanitize = require('mongo-sanitize');
const anglicize = require('anglicize');
const getColors = require('get-image-colors');
const cd = require('color-difference');
const Rcon = require('srcds-rcon');
const moment = require('moment');
const geoip = require('geoip-lite-country-only');
const countries = require('country-list');
const ipInfo = require("ipinfo");
const { getCode, getName } = require('country-list');
const Servers = require("../../models/servers");
const ServerScreenshots = require("../../models/server_new_screenshots");
const Plugins = require("../../models/plugins");
const User = require("../../models/user");
const ServerCommands = require("../../models/server_commands");
const Bans = require("../../models/bans");
const Unbans = require("../../models/unbans");
const TempBans = require("../../models/tempbans");
const OnlinePlayers = require("../../models/online_players");
const ExtraRcon = require("../../models/extra_rcon_commands");
const TempbanDurations = require("../../models/tempban_duration");
const PlayersData =  require("../../models/players_db");
const config = require("../../config/config");

module.exports = {
	
	getJulia:  function(req, res, next) {
		BluebirdPromise.props({
			selectedserver: Servers.findOne({'julia_identkey': req.params.julia_identkey}, 'julia_identkey ip port rcon_password name_alias slug_name').execAsync(),
			default_servercommands: ServerCommands.find({'req_power': {$lte : 1}}, 'command_name req_power').execAsync(),
			permanent_bans: Bans.findOne({'rcon_command':'permban', 'player_guid':req.body.playerid}).execAsync(),
			permban_cmd: ServerCommands.findOne({'command_name': 'permban'}, 'command_name req_power').execAsync(),
			tempban_cmd: ServerCommands.findOne({'command_name': 'tempban'}, 'command_name req_power').execAsync(),
			unban_cmd: ServerCommands.findOne({'command_name': 'unban'}, 'command_name req_power').execAsync()
		}).then (function(results){
			if (results.selectedserver){
				if (!fs.existsSync('./public/img/screenshots')){
					fs.mkdirSync('./public/img/screenshots');
				}
				if (!req.body.identkey){	
					return res.status(400).send('status=invalid_inputparamters');
				}
				if (req.body.identkey !== results.selectedserver.julia_identkey){
					return res.status(400).send('status=invalid_identkey');
				}
				if (req.body.identkey == "ChangeMe"){
					return res.status(400).send('status=change_default_identkey');
				}
				if (!req.body.command){
					return res.status(400).send('status=invalid_inputparamters');
				} else {
					if (req.body.command == "HELO"){
						if (!req.body.gamename && !req.body.gamedir){
							return res.status(400).send('Error: Empty gamename or gamedir value');
						} else if (!req.body.serverport){
							return res.status(400).send('Error: Empty serverip or serverport value');
						} else if (!req.body.rcon){
							return res.status(400).send('Error: Empty rcon value');
						} else {
							var geo = geoip.lookup(results.selectedserver.ip);
							var short_county = geo.country.toLowerCase();
							var country_name = countries.getName(geo.country);
							results.selectedserver.shortversion = req.body.version,
							results.selectedserver.country = country_name,
							results.selectedserver.country_shortcode = short_county,
							results.selectedserver.game_name = 'Call of Duty 4',
							results.selectedserver.count_connection_fail = 0,
							results.selectedserver.is_online = true,
							results.selectedserver.saveAsync()

							return res.status(200).send('status=okay');
						}	
					} else if (req.body.command == "queryplayer") {
						if (results.permanent_bans){
							var status_permanent_ban = 'status=active&playerid='+results.permanent_bans.player_guid+'&message='+results.permanent_bans.admin_message+'. More Info: '+config.website_url+'&expire=-1&created='+moment(results.permanent_bans.createdAt).unix()+'&adminsteamid='+results.permanent_bans.admin_steam_id+'';
							return res.status(200).send(status_permanent_ban);
						} else {
							var start = new Date();
							start.setHours(0,0,0,0);
							var end = new Date();
							end.setHours(23,59,59,999);
							var current_time = new Date();
							TempBans.findOne({'player_guid': req.body.playerid, 'expire' : {$gte: current_time}},'admin_command player_guid admin_message expire createdAt admin_steam_id', function( err, tempbans ) {
								if( !err ) {
									if (tempbans){
										if (tempbans.admin_command == 'tempban'){
											var tempbanresponse = 'status=active&playerid='+tempbans.player_guid+'&message='+tempbans.admin_message+'. More Info: '+config.website_url+'&expire='+moment(tempbans.expire).unix()+'&created='+moment(tempbans.createdAt).unix()+'&adminsteamid='+tempbans.admin_steam_id+'';
											return res.status(200).send(tempbanresponse);
										} else if (tempbans.admin_command == 'chat'){
											var chattempbanresponse = 'status=chat&playerid='+tempbans.player_guid;
											return res.status(200).send(chattempbanresponse);
										} else if (tempbans.admin_command == 'mute'){
											var mutetempbanresponse = 'status=mute&playerid='+tempbans.player_guid;
											return res.status(200).send(mutetempbanresponse);
										} else {
											return res.status(200).send('status=Ban Not Found');
										}
									} else {
										PlayersData.findOne({'player_guid': req.body.playerid}, 'sshack', function( err, playerinfo ) {
											if (playerinfo){
												ipInfo(req.body.address, (err, cLoc) => {
													if (err){
														console.log(err);
													} else {
														var new_player_name = req.body.playername.trim();
														if (isEmpty(new_player_name) == false){
															PlayersData.updateOne({'player_guid':req.body.playerid},{$addToSet:{'player_name_aliases':req.body.playername}},function(err){
																if (err){
																	console.log(err);
																} else {
																	playerinfo.player_name = uncolorize(req.body.playername),
																	playerinfo.player_guid = req.body.playerid,
																	playerinfo.player_steam_id = req.body.steamid,
																	playerinfo.player_ip = req.body.address,
																	playerinfo.player_country = getName(cLoc.country),
																	playerinfo.player_country_short = cLoc.country.toLowerCase(),
																	playerinfo.player_city = cLoc.city,
																	playerinfo.server_id = results.selectedserver._id,
																	playerinfo.sshack = playerinfo.sshack
																	playerinfo.saveAsync()
																}
															});
														}
													}
												});

											} else {
												ipInfo(req.body.address, (err, cLoc) => {
													if (err){
														console.log(err);
													} else {
														var new_player_name = req.body.playername.trim();
														if (isEmpty(new_player_name) == false){
															var newPlayersData = new PlayersData ({
																player_name: uncolorize(new_player_name),
																player_guid: req.body.playerid,
																player_steam_id: req.body.steamid,
																player_ip: req.body.address,
																player_country: getName(cLoc.country),
																player_country_short: cLoc.country.toLowerCase(),
																player_city: cLoc.city,
																player_name_aliases: uncolorize(req.body.playername),
																server_id : results.selectedserver._id,
																sshack:true
															});
															newPlayersData.saveAsync()
														}
													}
												});											
											}
										})
										return res.status(200).send('status=Ban Not Found');
									}
								} else {
									return res.status(200).send('status=Ban Not Found');
									console.log('Error on commands list for Admin user:' +err );
								}
							});
						}					
					} else if (req.body.command == "modifyban") {
						if (typeof req.body.adminsteamid === 'undefined' && req.body.adminsteamid) {
							return res.status(200).send('status=permission&message="You have no permission to modify ban records"');
						} else if (typeof req.body.timeleft === 'undefined' && req.body.timeleft) {
							return res.status(200).send('status=error&message="timeleft undefined"');
						} else {
							if (typeof req.body.playername !== 'undefined' && req.body.playername) {
								var playername = uncolorize(req.body.playername);
							}
							if (typeof req.body.address !== 'undefined' && req.body.address) {
								var address = req.body.address;
							}
							if (typeof req.body.reason !== 'undefined' && req.body.reason) {
								var reason = req.body.reason;
							}
							if (typeof req.body.playerid !== 'undefined' && req.body.playerid) {
								var playerid = req.body.playerid;
							}
							if (typeof req.body.steamid !== 'undefined' && req.body.steamid) {
								var steamid = req.body.steamid;
							}
	
							if(req.body.timeleft === -1){	
								if (results.permanent_bans){
									if (typeof results.permanent_bans.player_steam_id !== 'undefined' && results.permanent_bans.player_steam_id) {
										var already_banned_response = 'status=success_ban&steamid='+results.permanent_bans.player_steam_id+'&nick='+results.permanent_bans.player_name+'&playerid='+results.permanent_bans.player_guid+'';
									} else {
										var already_banned_response = 'status=success_ban&steamid=""&nick='+results.permanent_bans.player_name+'&playerid='+results.permanent_bans.player_guid+'';
									}
									return res.status(200).send(already_banned_response);
								} else {
									if (typeof req.body.steamid !== 'undefined' && req.body.steamid) {
										var new_bann_response = 'status=success_ban&steamid='+req.body.steamid+'&nick='+req.body.playername+'&playerid='+req.body.playerid+'';
									} else {
										var new_bann_response = 'status=success_ban&steamid=""&nick='+req.body.playername+'&playerid='+req.body.playerid+'';
									}
									User.findOne({'steam.id' : req.body.adminsteamid, 'local.admin_on_servers' : results.selectedserver._id , 'local.user_role' : {$gt : results.permban_cmd.req_power}},function(error, getadmin){	
										if (error){
											console.log(error);
										} else {
											if (getadmin){
												PlayersData.findOne({'player_guid': req.body.playerid}, function( err, playerinfo ) {
													if (err){
														console.log(err);
													} else {
														if (playerinfo){
															User.findOne({'steam.id' : req.body.steamid, 'local.user_role' : {$gt : 1}},function(error, checkifimune){	
																if (error){
																	console.log(error);
																} else {
																	if (checkifimune){
																		return res.status(200).send('status=permission');
																	} else {
																		var cmd = 'say ^6'+playerinfo.player_name+' ^7permanently banned by ^5'+getadmin.local.user_name+' ^7'+req.body.reason;
																		var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
																		rcon.connect()
																		.then(function(connected){
																			return rcon.command(cmd);
																		}).then(function(messagesent){
																			var newBan = new Bans ({
														  						player_name: playerinfo.player_name,
														  						player_guid: playerinfo.player_guid,
														  						player_steam_id: playerinfo.player_steam_id,
														  						player_ip: playerinfo.player_ip,
														  						player_country_short: playerinfo.player_country_short,
														  						admin_name: getadmin.local.user_name,
														  						admin_id: getadmin._id,
														  						admin_steam_id: getadmin.steam.id,
																					admin_message: req.body.reason,
																					rcon_command: 'permban',
																					server_name: results.selectedserver.slug_name,
																					rcon_admin: getadmin._id
														  					});
																			newBan.saveAsync()
																		}).then(function(disconnect){
																			rcon.disconnect();
																			return res.status(200).send(new_bann_response);
																		}).catch(function(err) {
																			console.log("There was an error: " +err);
																			console.log(err.stack);
																			return res.status(200).send(new_bann_response);
																		});
																	}
																}
															})
														} else {
															var cmd = 'say ^6'+req.body.playername+' ^7permanently banned by ^5'+getadmin.local.user_name+' ^7'+req.body.reason;
															var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
															rcon.connect()
															.then(function(connected){
																return rcon.command(cmd);
															}).then(function(messagesent){
																var newBan = new Bans ({
														  			player_name: uncolorize(req.body.playername),
														  			player_guid: req.body.playerid,
														  			player_steam_id: req.body.steamid,
														  			admin_name: getadmin.local.user_name,
														  			admin_id: getadmin._id,
														  			admin_steam_id: getadmin.steam.id,
																		admin_message: req.body.reason,
																		rcon_command: 'permban',
																		server_name: results.selectedserver.slug_name,
																		rcon_admin: getadmin._id
														  		});
																newBan.saveAsync()
															}).then(function(disconnect){
																rcon.disconnect();
																return res.status(200).send(new_bann_response);
															}).catch(function(err) {
																console.log("There was an error: " +err);
																console.log(err.stack);
																return res.status(200).send(new_bann_response);
															});
														}
													}
												})
											} else {
												return res.status(200).send('status=permission&message="You have no permission to modify ban records"');
											}
										}
									});	
								}
							}
							if(req.body.timeleft > 0){
								if (results.permanent_bans){
									if (typeof results.permanent_bans.player_steam_id !== 'undefined' && results.permanent_bans.player_steam_id) {
										var already_banned_response = 'status=success_ban&steamid='+results.permanent_bans.player_steam_id+'&nick='+results.permanent_bans.player_name+'&playerid='+results.permanent_bans.player_guid+'';
									} else {
										var already_banned_response = 'status=success_ban&steamid=""&nick='+results.permanent_bans.player_name+'&playerid='+results.permanent_bans.player_guid+'';
									}
									return res.status(200).send(already_banned_response);
								} else {
									//Ban Not Found
									if (typeof req.body.steamid !== 'undefined' && req.body.steamid) {
										var new_bann_response = 'status=success_ban&steamid='+req.body.steamid+'&nick='+req.body.playername+'&playerid='+req.body.playerid+'';
									} else {
										var new_bann_response = 'status=success_ban&steamid=""&nick='+req.body.playername+'&playerid='+req.body.playerid+'';
									}
									User.findOne({'steam.id' : req.body.adminsteamid, 'local.admin_on_servers' : results.selectedserver._id , 'local.user_role' : {$gte : results.tempban_cmd.req_power}}, 'local.user_name steam.id',function(error, getadmin){	
										if (error){
											console.log(error);
										} else {
											if (getadmin){
												PlayersData.findOne({'player_guid': req.body.playerid}, 'player_name player_guid player_steam_id player_ip player_country_short', function( err, playerinfo ) {
													if (err){
														console.log(err);
													} else {
														if (playerinfo){
															User.findOne({'steam.id' : req.body.steamid, 'local.user_role' : {$gt : 1}},function(error, checkifimune){
																if (error){
																	console.log(error);
																} else {
																	if (checkifimune){
																		return res.status(200).send('status=permission');
																	} else {
																		var cmd = 'say ^6'+playerinfo.player_name+' ^7temporarily banned by ^5'+getadmin.local.user_name+' ^7('+req.body.timeleft+' minutes) '+req.body.reason;
																		var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
																		rcon.connect()
																		.then(function(connected){
																			return rcon.command(cmd);
																		}).then(function(messagesent){
																			var tempbanexpire = moment().add(req.body.timeleft, 'm').toDate();
																			var newTempban = new TempBans ({
														  						player_name: playerinfo.player_name,
														  						player_guid: playerinfo.player_guid,
														  						player_steam_id: playerinfo.player_steam_id,
														  						player_ip: playerinfo.player_ip,
														  						player_country_short: playerinfo.player_country_short,
														  						admin_name: getadmin.local.user_name,
														  						admin_id: getadmin._id,
														  						admin_steam_id: getadmin.steam.id,
																				admin_message: req.body.reason,
																				admin_command: 'tempban',
																				game_server: results.selectedserver.slug_name,
																				expire: tempbanexpire
														  					});
																			newTempban.saveAsync()
																		}).then(function(disconnect){
																			rcon.disconnect();
																			return res.status(200).send(new_bann_response);
																		}).catch(function(err) {
																			console.log("There was an error: " +err);
																			console.log(err.stack);
																			return res.status(200).send(new_bann_response);
																		});
																	}
																}
															})
														} else {
															var cmd = 'say ^6'+req.body.playername+' ^7temporarily banned by ^5'+getadmin.local.user_name+' ^7('+req.body.timeleft+' minutes) '+req.body.reason;
															var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
															rcon.connect()
															.then(function(connected){
																return rcon.command(cmd);
															}).then(function(messagesent){
																var tempbanexpire = moment().add(req.body.timeleft, 'm').toDate();
																var newTempban = new TempBans ({
												  					player_name: uncolorize(req.body.playername),
												  					player_guid: req.body.playerid,
												  					player_steam_id: req.body.steamid,
												  					admin_name: getadmin.local.user_name,
												  					admin_id: getadmin._id,
												  					admin_steam_id: getadmin.steam.id,
																	admin_message: req.body.reason,
																	admin_command: 'tempban',
																	game_server: results.selectedserver.slug_name,
																	expire: tempbanexpire
												  				});
																newTempban.saveAsync()
															}).then(function(disconnect){
																rcon.disconnect();
																return res.status(200).send(new_bann_response);
															}).catch(function(err) {
																console.log("There was an error: " +err);
																console.log(err.stack);
																return res.status(200).send(new_bann_response);
															});
														}
													}
												})		
											} else {
												return res.status(200).send('status=permission&message="You have no permission to modify ban records"');
											}
										}
									});	
								}
							}
							if(req.body.timeleft == 0){
								User.findOne({'steam.id' : req.body.adminsteamid, 'local.user_role' : {$gte : results.unban_cmd.req_power}},function(error, checkifadmin){
									if (error){
										console.log(error);
									} else {
										if (!checkifadmin){
											return res.status(200).send('status=permission');
										} else {
											if (results.permanent_bans){
												var unban_cmd = 'tell '+req.body.adminsteamid+' ^5'+results.permanent_bans.player_name+' ^7sucessfully Unbaned!';
												var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
												rcon.connect()
												.then(function(connected){
													return rcon.command(unban_cmd);
												}).then(function(deletescreenshot){
													Bans.findOne({'player_guid': req.body.playerid}, 'player_name player_guid player_screenshot', function( err, delscreenshot ) {
														if (err){
															console.log(err);
														} else {
															var newUnban = new Unbans ({
												  			player_name: delscreenshot.player_name,
												  			player_guid: delscreenshot.player_guid,
												  			rcon_command: 'unban',
												  			admin_name: checkifadmin.local.user_name,
												  			admin_id: checkifadmin._id
													  		});
															newUnban.saveAsync()
															if (delscreenshot.player_screenshot) {
																var filePath = './public/'+delscreenshot.player_screenshot;
												 				fs.unlink(filePath, function(err) {if (err) {console.log("failed to delete local image:"+err);}});
															}
														}
													});
												}).then(function(disconnect){
													rcon.disconnect();
													Bans.deleteOne({'player_guid' : req.body.playerid}).exec();													
													return res.status(200).send('status=success_unban');
												}).catch(function(err) {
													console.log("There was an error: " +err);
													console.log(err.stack);
												});
											} else {
												var current_time = new Date();
												TempBans.findOne({'player_guid': req.body.playerid, 'expire' : {$gte: current_time}, 'admin_command' : 'tempban'}, 'player_name ', function( err, tempbans ) {
													if (tempbans){
														var unban_cmd = 'tell '+req.body.adminsteamid+' ^5'+tempbans.player_name+' ^7sucessfully Unbaned!';
														var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
														rcon.connect()
														.then(function(connected){
															return rcon.command(unban_cmd);
														}).then(function(disconnect){
															TempBans.deleteOne({'player_guid' : req.body.playerid}).exec();
															rcon.disconnect();
															return res.status(200).send('status=success_unban');
														}).catch(function(err) {
															console.log("There was an error: " +err);
															console.log(err.stack);
														});
													} else {
														var notfound_cmd = 'tell '+req.body.adminsteamid+' ^7The requested player was not found with the information provided!';
														var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
														rcon.connect()
														.then(function(connected){
															return rcon.command(notfound_cmd);
														}).then(function(disconnect){
															rcon.disconnect();
															return res.status(200).send('status=notfound');
														}).catch(function(err) {
															console.log("There was an error: " +err);
															console.log(err.stack);
														});														
													}
												})												
											}
										}
									}
								})
							}
						}
					} else if (req.body.command == "querypermissions") {
						var return_default_server_commands = results.default_servercommands.map(function(item){ return item.command_name; });
						var change_default_commands_list = S.replaceAll(return_default_server_commands, ",", ";");
						var default_permissions = 'status=notfound&steamid=""&cmdlist=""&message="Default cmdlist sent"';
						if (!req.body.steamid){
							return res.status(200).send(default_permissions);
						} else if (req.body.steamid){
							User.findOne({'steam.id':req.body.steamid.toString()}, 'local.user_role steam.id', function (err, finduser) {
								if (err){
									console.log('There was an error in user findOne query: '+err);
								} else {
									if (finduser){
										Servers.findOne({'admins_on_server':finduser._id, 'julia_identkey': req.params.julia_identkey}, 'name_alias', function( err, check_admin ) {
											if( !err ) {
												if (check_admin){
													ServerCommands.find({'req_power': {$lte : finduser.local.user_role}}, 'command_name', function( err, servercommands ) {
														if( !err ) {
															if (servercommands){
																var myservercommands = servercommands.map(function(item){ return item.command_name; });
																var returnservercommands = S.replaceAll(myservercommands, ",", ";");
																var steamID = finduser.steam.id;
																var myresponse = 'status=success&steamid='+steamID+'&cmdlist='+returnservercommands+'&message="Admin cmdlist sent"';
																return res.status(200).send(myresponse);
															} else {
																var steamID = finduser.steam.id;
																var myresponse = 'status=success&steamid='+steamID+'&cmdlist="cmdlist;ministatus;rules"&message="No Admin cmdlist defined, default cmdlist sent"';
																return res.status(200).send(myresponse);
															}
														} else {
															console.log('Error on commands list for Admin user:' +err );
														}
													});
												} else {
													var steamID = finduser.steam.id;
													var myresponse2 = 'status=notfound&steamid=""&cmdlist=""&message="Default cmdlist sent"';
													return res.status(200).send(myresponse2);
												}
											} else {
												console.log('There was an error in query Servers FindOne: '+err);
											}
										});
									} else {
										return res.status(200).send(default_permissions);
									}
								}
							})
						}								
					} else if (req.body.command == "serverstatus"){

						/*
							CREATE SOME PLAYERSTATS IF THE req.body.mapname do not match with results.selectedserver.map_img	
						*/


						if (req.body.players.length > 1){
							var d = new Date();
							d.setMinutes(d.getMinutes()-1);
							var last_time_connected = moment().add(1, 'm').toDate();
							PlayersData.find({'server_id':results.selectedserver._id, 'sshack': true, 'updatedAt' : {$gte : d}}, 'player_guid', function( err, execgetss ) {
								if (execgetss.length > 0){
									var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
									rcon.connect()
									.then(function(connected){
										execgetss.forEach(function (player){
											return rcon.command('getss '+player.player_guid);
										});
									}).then(function(disconnect){
										rcon.disconnect();
									}).catch(function(err) {
										console.log("There was an error: " +err);
										console.log(err.stack);
									});
								}
							})
						}

						if (S.include(req.body.hostname,' - Round') == true){
							var new_name = req.body.hostname.split(" - Round")[0];
						}else{
							var new_name= req.body.hostname
						}
						results.selectedserver.name = uncolorize(req.body.hostname),
						results.selectedserver.slug_name = uncolorize(new_name),
						results.selectedserver.online_players = req.body.playercount+'/'+req.body.maxclients,
						results.selectedserver.max_players = req.body.maxclients,
						results.selectedserver.private_clients = req.body.privateclients,
						results.selectedserver.map_playing = finalMapName(req.body.mapname),
						results.selectedserver.map_started = req.body.mapstartime,
						results.selectedserver.shortversion = req.body.version,
						results.selectedserver.map_img = req.body.mapname,
						results.selectedserver.server_slots = req.body.maxclients,
						results.selectedserver.saveAsync()
						OnlinePlayers.deleteMany({'server_alias': results.selectedserver.name_alias}).execAsync();
						if (req.body.players.length > 0){						
							req.body.players.forEach(function (player){
								if (player.pid!='0'){
									if (player.sid){
									var player_steamid = player.sid;
									} else {
										var player_steamid = '0';
									}
									var newOnlinePlayers = new OnlinePlayers ({
										server_alias: results.selectedserver.name_alias,
										player_slot: player.num,
										player_name: player.name,
										player_score: player.score,
										player_guid: player.pid,
										player_steam_id: player_steamid,
										player_kills: player.kills,
										player_deaths: player.deaths,
										player_assists: player.assists,
									});
									newOnlinePlayers.saveAsync()
								}
							})
						}
						return res.status(200).send('status=okay');
					} else if (req.body.command == "submitshot") {
						if (!req.body.serverport && !req.body.data){
							return res.status(400).send('Error: Empty serverport or data value');
						} else {
							if (req.body.data){
								imgdata = req.body.data.toString();;
								var img_name = uniqueString();
								var buf = Buffer.from(imgdata, 'base64');
								var getstartpoint = buf.lastIndexOf("CoD4X")+6;//find
								var startfromhere = buf.toString().substring(getstartpoint); //start from here
								var data = S.words(startfromhere, "\0");
								var map = data[1];
								var playername2 = sanitize(data[2]);
								var playername3 = anglicize(playername2);
								var playername = playername3.replace(/\uFFFD/g, '');
								var guid = data[3];
								var shotnum = data[4];
								var time = data[5];
								var newServerScreenshot = new ServerScreenshots ({
									player_name:playername,
									player_guid:guid,
									map_name:map,
									screenshot_img: '/img/screenshots/'+img_name+'.jpg',
									get_server: results.selectedserver._id,
									server_name_alias: results.selectedserver.name_alias
								});
								newServerScreenshot.saveAsync()
								fs.writeFile('./public/img/screenshots/'+img_name+'.jpg', buf, function (err) {
									if (err){
										console.log(err);
									} else {
										Plugins.findOne({'category':'julia', 'name_alias':'julia-ss-check'}, function (err, plugins) {
											if (err){
												console.log('There was an error in plugin Julia Kick Black SS: '+err);
											} else {
												if (plugins.status==true){
													getColors('./public/img/screenshots/'+img_name+'.jpg', function (err, colors) {
														if (err) {
															console.log(err);
														} else {
															var color1 = cd.compare(colors[0].hex(), '#000000');
															var color2 = cd.compare(colors[1].hex(), '#000000');
															var color3 = cd.compare(colors[2].hex(), '#000000');
															var color4 = cd.compare(colors[3].hex(), '#000000');
															var comparesum = color1+color2+color3+color4;
															if (comparesum < 90){
																var	rcon = require('srcds-rcon')({address:results.selectedserver.ip+':'+results.selectedserver.port,password: results.selectedserver.rcon_password});
																rcon.connect()
																.then(function(connected){
																	var cmd = 'kick '+playername+' Black SS detected on Screenshot';
																	return rcon.command(cmd);
																}).then(function(sendmessagetoserver){
																	var cmdinform = 'say ^5'+playername+'^7 ^1Auto-Kicked ^7Black Screenshot detected!';
																	return rcon.command(cmdinform);
																}).then(function(disconnect){
																	rcon.disconnect();
																})
															} else {
																PlayersData.findOneAndUpdate({'player_guid': guid}, {$set:{sshack:false}}, function(err){
																    if(err){
																        console.log("Something wrong when updating playersdata on screenshot arrived!");
																    }
																});
															}
														}
													})
												}
											}
										});
									}
								});
								return res.status(200).send('status=success');
							}else{
								return res.status(400).send('status=failure');
							}
						}	
					} else {
						return res.status(400).send('status=invalid_command');
					}
				}
			} else {
				console.log('Server not found, no server with that screenshot identkey, check the link in your server.cfg file, julia_url should be in a form: https://mywebsite.com/julia_identkey/julia');
			}
		}).catch (function(err){
			console.log(err);
			return res.status(400).send('There was an error on CoD4xWebAdmin application: '+err);
		});	
	},

	getServerScreenshots:  function(req, res, next) {
		Servers.findOne({'screenshot_identkey': req.params.screenshot_identkey},function(error, serverfoundresult){	
			if (!error){
				if (serverfoundresult){
				if (!fs.existsSync('./public/img/screenshots')){
					fs.mkdirSync('./public/img/screenshots');
				}
					if (!req.body.identkey){	
						return res.status(400).send('status=invalid_inputparamters');
					}
					if (req.body.identkey !== serverfoundresult.screenshot_identkey){
						return res.status(400).send('status=invalid_identkey');
					}
					if (req.body.identkey == "ChangeMe"){
						return res.status(400).send('status=change_default_identkey');
					}
					if (!req.body.command){
						return res.status(400).send('status=invalid_inputparamters');
					}
					else{
						if (req.body.command.toString() == "HELO"){
							if (!req.body.gamename && !req.body.gamedir){
								return res.status(400).send('Error: Empty gamename or gamedir value');
							} else if (!req.body.serverport){
								return res.status(400).send('Error: Empty serverip or serverport value');
							} else if (!req.body.rcon){
								return res.status(400).send('Error: Empty rcon value');
							} else {
								return res.status(200).send('status=okay');
							}	
						} else if (req.body.command.toString() == "submitshot") {
							if (!req.body.serverport && !results.data){
								return res.status(400).send('Error: Empty serverport or data value');
							} else {
								if (req.body.data){
									imgdata = req.body.data.toString();
									var img_name = uniqueString();
									var buf = Buffer.from(imgdata, 'base64');
									var getstartpoint = buf.lastIndexOf("CoD4X")+6;//find
									var startfromhere = buf.toString().substring(getstartpoint); //start from here
									var data = S.words(startfromhere, "\0");
									var map = data[1];
									var playername2 = sanitize(data[2]);
									var playername3 = anglicize(playername2);
									var playername = playername3.replace(/\uFFFD/g, '');
									var guid = data[3];
									var shotnum = data[4];
									var time = data[5];
									var newServerScreenshot = new ServerScreenshots ({
										player_name:playername,
										player_guid:guid,
										map_name:map,
										screenshot_img: '/img/screenshots/'+img_name+'.jpg',
										get_server: serverfoundresult._id
									});
									newServerScreenshot.saveAsync()
									fs.writeFile('./public/img/screenshots/'+img_name+'.jpg', buf, function (err) {
										if (err){
											console.log(err);
										}
									});
									return res.status(200).send('status=success');
								} else {
									return res.status(400).send('status=failure');
								}
							}	
						} else {
							return res.status(400).send('status=invalid_command');
						}
					}
				} else {
					console.log('Server not found, no server with that screenshot identkey, check the link in your server.cfg file, nehoscreenshot_url should be in a form: https://mywebsite.com/screenshot_identkey/screenshots');
				}
			} else {
				console.log('Error is here: '+error);
			}
		});	
	}
};

function finalMapName(string) {
	var starter = string.slice(3);
	var lowercase = replaceString(starter, "_", " ");
	var newstring = S.titleize(lowercase);
	return newstring;
};

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

function removeEmpty(obj) {
  Object.keys(obj).forEach(function(key) {
    (obj[key] && typeof obj[key] === 'object') && removeEmpty(obj[key]) ||
    (obj[key] === '' || obj[key] === null) && delete obj[key]
  });
  return obj;
};

function isEmpty(value) {
	return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}
