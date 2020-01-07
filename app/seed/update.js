const mongoose = require('mongoose');
mongoose.BluebirdPromise = require('bluebird');
const config = require('../config/config');
var dbURI = "mongodb://" + 
			encodeURIComponent(config.db.username) + ":" + 
			encodeURIComponent(config.db.password) + "@" + 
			config.db.host + ":" + 
			config.db.port + "/" + 
			config.db.name;
mongoose.connect(dbURI, {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// Throw an error if the connection fails
mongoose.connection.on('error', function(err) {
	if(err){
		console.log('Your mongoDB Username, Password is wrong in file app/config/config.json . Could not connect to database! '+err);
	};
});

const Plugins = require("../models/plugins");


// ######################## Plugins ########################################### //

var plugins = [
	new Plugins({
		name:'Emailer Sendgrid',
		category:'emailer',
		description:'An emailer plugin for Cod4xWebAdmin using SendGrid as a third party service',
		instructions:'<p>Activate or Deactivate Plugin Sendgrid Emailer on your application (Status checkbox)<br></p><p>This Emailer plugin allows Cod4xWebAdmin to send emails to users through the third-party transactional email service Sendgrid.<br /><br /><strong>Do I need Sendgrid?</strong><br /> If you would like to send emails to users and for example be able to reset your password then yes. Password reset works only if you have configured and activated this plugin.<br /><br /><strong>Where do I get this API key?</strong><br />You get it on: <a href="https://sendgrid.com/" target="_blank">https://sendgrid.com/</a>. Sign up, make sure you activate your account after registration via your email, choose the free option it is more than enough for our purpose. After Logging in go to Settings -> API keys and create a new API key. <strong>After you get your API key insert it here in the API key field, save changes and activate the plugin</strong><br /><br />If everything is working as it should you will see on your Log In page a Forgot Password? link. You can test it out with your own account if it works.</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	})
];

var done = 0;

for (var i = 0; i < plugins.length; i++){
	plugins[i].save(function (err, result){
		done++;
		if(done === plugins.length){
			exit();
		}
	});
}


function exit(){
	mongoose.connection.close();
	console.log('Database succesfully populated with Default data')
}