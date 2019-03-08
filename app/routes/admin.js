const moment = require('moment');

module.exports = function(router, passport){

	/*CSRF Protection - No session stealing*/
	const csrf = require('csurf');
	const csrfProtection = csrf();
	const index = require( '../controllers/admin/index' );
	const servers = require( '../controllers/admin/servers' );
	const admingroups = require( '../controllers/admin/admingroups' );
	const manageusers = require( '../controllers/admin/manageusers' );
	const plugins = require( '../controllers/admin/plugins' );
	const maps = require( '../controllers/admin/maps' );
	const tempbandurations = require('../controllers/admin/tempbandurations');
	const servercommands = require('../controllers/admin/servercommands');
	const cod4x = require('../controllers/admin/cod4x');
	
	

	router.use(csrfProtection);
	router.use(getLanguageForMoment);

	/*###################### SERVERS ##################################################*/

	router.get('/home', requireRole(100), isLoggedIn, index.getAdminHome);
	router.get('/rcon-settings', requireRole(100), isLoggedIn, index.getRconSettings);
	router.get('/check-github-relase', requireRole(100), isLoggedIn, index.getGithubRelase);
	router.get('/backup-mongodb', requireRole(100), isLoggedIn, index.getMongoDBbackup);
	router.get('/restore-mongodb', requireRole(100), isLoggedIn, index.getMongoDBrestore);
	router.get('/players-data/delete/:id', requireRole(100), isLoggedIn, index.PlayersDataRemove);

	/*###################### SERVERS ##################################################*/

	router.get('/servers/rconconsole/delete/:id', requireRole(100), isLoggedIn, servers.RconConsoleRemove);
	router.get('/servers/rconconsole/delete-all', requireRole(100), isLoggedIn, servers.RconConsoleRemoveAll);
	router.get('/servers/delete/:id', requireRole(100), isLoggedIn, servers.ServerRemove);
	router.get('/servers/delete-local/:id', requireRole(100), isLoggedIn, servers.ServerRemoveLocal);
	router.post('/servers/edit/rules/update/:id', requireRole(100), isLoggedIn, servers.ServerRulesUpdate);
	router.post('/servers/edit/update/:id', requireRole(100), isLoggedIn, servers.ServerUpdate);
	router.post('/servers/edit/settings/update/:id', requireRole(100), isLoggedIn, servers.ServerSettingsUpdate);
	router.post('/servers/rconconsole/send/:id', requireRole(100), isLoggedIn, servers.RconConsoleAction);
	router.get('/servers/rconconsole/:id', requireRole(100), isLoggedIn, servers.ServerRconByID);
	router.get('/servers/edit/:id', requireRole(100), isLoggedIn, servers.ServerByID);
	router.post('/servers/new/save', requireRole(100), isLoggedIn, servers.InsertNewServer);
	router.post('/servers/newlocal/save', requireRole(100), isLoggedIn, servers.CreateNewLocalServer);
	router.get('/start-local-server/:id', requireRole(100), isLoggedIn, servers.LocalServerStart);
	router.get('/stop-local-server/:id', requireRole(100), isLoggedIn, servers.LocalServerStop);

	/*###################### GAME SERVERS ##################################################*/

	//router.get('/game-servers-instructions', requireRole(100), isLoggedIn, servers.getGameServersInstructions);
	router.get('/download-game-server-files', requireRole(100), isLoggedIn, servers.GetServerFiles);
	router.get('/extract-game-server-files', requireRole(100), isLoggedIn, servers.ExtractServerFiles);


	/*###################### ADMIN GROUPS ##################################################*/

	router.get('/admin-groups/delete/:id', requireRole(100), isLoggedIn, admingroups.AdminGroupsRemove);
	router.post('/admin-groups/edit/update/:id', requireRole(100), isLoggedIn, admingroups.AdminGroupsUpdate);
	router.get('/admin-groups/edit/:id', requireRole(100), isLoggedIn, admingroups.AdminGroupsByID);
	router.post('/admin-groups/new/save', requireRole(100), isLoggedIn, admingroups.InsertNewAdminGroups);
	router.get('/admin-groups', requireRole(100), isLoggedIn, admingroups.getAdminGroups);

	/*###################### TEMBAN DURATIONS ##################################################*/

	router.get('/tempban-durations/delete/:id', requireRole(100), isLoggedIn, tempbandurations.TempbanDurationsRemove);
	router.post('/tempban-durations/edit/update/:id', requireRole(100), isLoggedIn, tempbandurations.TempbanDurationsUpdate);
	router.get('/tempban-durations/edit/:id', requireRole(100), isLoggedIn, tempbandurations.TempbanDurationsByID);
	router.post('/tempban-durations/new/save', requireRole(100), isLoggedIn, tempbandurations.InsertNewTempbanDurations);
	router.get('/tempban-durations', requireRole(100), isLoggedIn, tempbandurations.getTempbanDurations);

	/*###################### MANAGE USERS ##################################################*/

	router.post('/manage-users/edit/update/servers/:id', requireRole(100), isLoggedIn, manageusers.ManageUsersUpdateServers);
	router.post('/manage-users/edit/update/:id', requireRole(100), isLoggedIn, manageusers.ManageUsersUpdate);
	router.get('/manage-users/edit/:id', requireRole(100), isLoggedIn, manageusers.ManageUsersByID);
	router.get('/manage-users/delete/:id', requireRole(100), isLoggedIn, manageusers.UserRemove);
	router.get('/manage-users', requireRole(100), isLoggedIn, manageusers.getManageUsers);

	/*###################### MANAGE PLUGINS ##################################################*/

	router.get('/plugins/edit/activate/:id', requireRole(100), isLoggedIn, plugins.PluginsUpdateStatusActivate);
	router.get('/plugins/edit/deactivate/:id', requireRole(100), isLoggedIn, plugins.PluginsUpdateStatusDeActivate);
	router.post('/plugins/edit/update/plugin/:id', requireRole(100), isLoggedIn, plugins.PluginsUpdate);
	router.get('/plugins/edit/:id', requireRole(100), isLoggedIn, plugins.PluginsByID);
	router.post('/plugins/new/save', requireRole(100), isLoggedIn, plugins.InsertNewPlugins);
	router.get('/plugins', requireRole(100), isLoggedIn, plugins.getPlugins);


	/*###################### MAPS ##################################################*/
	router.get('/maps/delete/:id', requireRole(100), isLoggedIn, maps.MapsRemove);
	router.post('/maps/upload', requireRole(100), isLoggedIn, maps.uploadMapImages);
	router.post('/maps/new/save', requireRole(100), isLoggedIn, maps.InsertNewMaps);
	router.get('/maps', requireRole(100), isLoggedIn, maps.getMaps);

	/*###################### SERVER COMMANDS JULIA ##################################################*/
	router.post('/server-commands/edit/update/:id', requireRole(100), isLoggedIn, servercommands.ServercommandUpdate);
	router.get('/server-commands/edit/:id', requireRole(100), isLoggedIn, servercommands.ServercommandByID);
	router.get('/server-commands/delete/:id', requireRole(100), isLoggedIn, servercommands.ServercommandRemove);
	router.post('/server-commands/new/save', requireRole(100), isLoggedIn, servercommands.InsertNewServercommand);
	router.post('/server-commands/edit/update/extra/:id', requireRole(100), isLoggedIn, servercommands.ExtraRconUpdate);
	router.get('/server-commands', requireRole(100), isLoggedIn, servercommands.getServercommands);

	/*###################### COD4X BINARY FILES AND GITHUB ##################################################*/
	router.get('/cod4x-github', requireRole(100), isLoggedIn, cod4x.getHome);
	router.post('/cod4x-github/new/server-file/save', requireRole(100), isLoggedIn, cod4x.InsertCoD4xGithubFiles);
	router.post('/cod4x-github/new/plugin-file/save', requireRole(100), isLoggedIn, cod4x.InsertCoD4xGithubPlugins);
	router.get('/cod4x-github/delete/:id', requireRole(100), isLoggedIn, cod4x.RemoveBinaryFile);
	router.get('/cod4x-github/use-server-version/save/:id', requireRole(100), isLoggedIn, cod4x.UseCoD4xGithubBinary);
	router.get('/cod4x-github/use-plugin-version/save/:id', requireRole(100), isLoggedIn, cod4x.UseCoD4xGithubPlugin);
};

/*RESTRICT ACCESS BY USER POWER*/
function requireRole(role) {
	return function(req, res, next) {
		if(req.user && req.user.local.user_role === role)
			next();
		else
			res.redirect('/');
	};
}

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();

	res.redirect('/user/login');
}

// route middleware to ensure user is logged in
function notLoggedIn(req, res, next) {
	if (!req.isAuthenticated())
		return next();

	res.redirect('/user/logout');
}

// set the moment Language
function getLanguageForMoment(req, res, next) {
	moment.locale(req.language);
	return next();
}
