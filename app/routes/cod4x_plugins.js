var express = require('express');
const cod4x_plugins = require('../controllers/cod4x_plugins/index');

module.exports = function(app, passport){
	//Reciving screenshots from the screenshotsender plugin
	app.post('/screenshots/:screenshot_identkey', cod4x_plugins.getServerScreenshots);
	app.post('/julia/:julia_identkey', cod4x_plugins.getJulia);
	//Server
	app.get('/json/:julia_identkey/server/info', cod4x_plugins.getServerInfo);
	app.get('/json/:julia_identkey/server/admins', cod4x_plugins.getServerAdmins);
	//Players
	app.get('/json/:julia_identkey/player/check-admin/:player_guid', cod4x_plugins.getPlayerIsAdmin);
	app.get('/json/:julia_identkey/player/info/:player_guid', cod4x_plugins.getPlayerInfo);
	app.get('/json/:julia_identkey/player/name-aliases/:player_guid', cod4x_plugins.getPlayerNameAliases);
	
	//BanList
	app.get('/json/:julia_identkey/banlist/permbans', cod4x_plugins.getPermBanList);
	app.get('/json/:julia_identkey/banlist/tempbans', cod4x_plugins.getTempBanList);

	app.post('/json/:julia_identkey/player/info/update/:player_guid', cod4x_plugins.updatePlayerInfo);

	//Julia Stats
	app.get('/json/:julia_identkey/stats/top_players', cod4x_plugins.getTopPlayers);
	app.get('/json/:julia_identkey/stats/rank/:player_guid', cod4x_plugins.getPlayerRank);
};
