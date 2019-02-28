const cod4x_plugins = require('../controllers/cod4x_plugins/index');

module.exports = function(app, passport){
	//Reciving screenshots from the screenshotsender plugin
	app.post('/screenshots/:screenshot_identkey', cod4x_plugins.getServerScreenshots);
	app.post('/julia/:julia_identkey', cod4x_plugins.getJulia);
};
