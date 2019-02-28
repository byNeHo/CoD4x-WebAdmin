const moment = require('moment');
const admin_conversations = require('../controllers/admin-conversations/index');

module.exports = function(app, passport){

	/*CSRF Protection - No session stealing*/
	const csrf = require('csurf');
	const csrfProtection = csrf();

	app.use(csrfProtection);
	app.use(getLanguageForMoment);
	//Reciving screenshots from the screenshotsender plugin
	app.get('/conversation/:id', isLoggedIn, admin_conversations.getConversationsDetails);
	app.post('/conversation/new/save', isLoggedIn, admin_conversations.InsertNewConversationsComment);
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