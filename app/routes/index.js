const home = require('../controllers/index/home');
const csrf = require('csurf');
const moment = require('moment');

module.exports = function(app, passport, io){
	const csrfProtection = csrf();
	app.get('/sitemap.xml', home.SiteMapCreate);
	app.use(csrfProtection);
	app.use(getLanguageForMoment);
	app.get('/', home.getHome);
	app.get('/notifications', isLoggedIn, home.getGlobalNotifications);
	app.get('/clean-notifications', isLoggedIn, home.GlobalNotificationsRemove);
	app.get('/cheater-reports', isLoggedIn, home.getCheaterReports);
	app.get('/cheater-report/delete/:id', isLoggedIn, home.CheaterReportRemove);
	app.get('/unban-request/delete/:id', isLoggedIn, home.UnbanRequestRemove);
	app.post('/unban-request/new/save', isLoggedIn, home.InsertNewunbanRequest);
	app.get('/report-cheater/:screenshot_img', isLoggedIn, home.InsertNewCheaterReport);
	app.get('/remove-screenshots/:id', isLoggedIn, home.ScreenshotsRemove);
	app.get('/admin-notifications', isLoggedIn, home.getMyNotifications);
	app.get('/banlist/:id',isLoggedIn, home.getBanById);
	app.get('/members/:id',isLoggedIn, home.getMemberById);
	app.get('/members',home.getMembers);
	app.get('/banlist',home.getBanned);
	app.get('/players-data',isLoggedIn, home.getPlayers);
	app.get('/players-data/search/player?:sq',isLoggedIn, home.getSearchPlayers);
	app.get('/players-data/:id',isLoggedIn, home.getplayerById);
	app.get('/admin-applications', isLoggedIn, home.getAdminApp);
	app.post('/admin-applications', isLoggedIn, home.InsertNewAdminApp);
	app.post('/admin-application/new/conversation', isLoggedIn, home.AdminAppConversationStart);
	app.post('/admin-application/delete/admin-app', isLoggedIn, home.AdminAppRemove);
	app.post('/admin-application/accept/admin-app', isLoggedIn, home.AdminAppAccept);
	app.get('/admin-conversations', isLoggedIn ,home.getConversations);
	app.get('/:name_alias',home.getServer);
	app.get('/kgb-plugin/:id/:task', isLoggedIn, home.getKGBplugin);
	app.get('/server-plugin/start-local-server/:id', isLoggedIn, home.PluginLocalServerStart);
	app.get('/server-plugin/stop-local-server/:id', isLoggedIn, home.PluginLocalServerStop);
};

function isLoggedIn(req, res, next) {
	if(req.isAuthenticated()) {
		return next();
	}
	res.redirect('/user/login');
}

// set the moment Language
function getLanguageForMoment(req, res, next) {
	moment.locale(req.language);
	return next();
}
