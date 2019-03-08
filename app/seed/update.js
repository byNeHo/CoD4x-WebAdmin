const mongoose = require('mongoose');
mongoose.BluebirdPromise = require('bluebird');
const config = require('../config/config');
var dbURI = "mongodb://" + 
			encodeURIComponent(config.db.username) + ":" + 
			encodeURIComponent(config.db.password) + "@" + 
			config.db.host + ":" + 
			config.db.port + "/" + 
			config.db.name;
mongoose.connect(dbURI, {useNewUrlParser:true});
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
		name:'Download cod4x files from Github',
		category:'cronjobs',
		description:'Download cod4x files from Github Dailly',
		instructions:'<p>This plugin will Download cod4x source files from Github Dailly.</p><p class=\"c-red\">If you have just enabled this plugin please wait 24 hours before you Compile server Binary or Plugin files.</p><p>The plugin downloads the source files every day at 5:30 in morning</p><br><br>\r\n<span style=\"font-weight: bold;\">Configuration:\r\n</span><ol>\r\n\r\n<li>Navigate to your app (app/config/config.json and locate section \"ssh_access\")<br></li>\r\n\r\n<li>Change host, user and password to yours (this user must be in sudo group)</li>\r\n\r\n<li>Locate next section in config.json \"cod4_server_plugin\", replace linux_user in servers_root with your user what you have defined in ssh access in previous step.</li>\r\n\r\n<li>Locate next section in config.json \"cod4x_compile\", replace linux_user in dir_root with your user what you have defined in ssh access in previous step, also replace save_directory_path, the full path to your websites public folder</li>\r\n\r\n</ol>\r\n\r\n<p>If you have set everything as you should, then the cod4x source files from Cod4x_Server Github page will be auto-downloaded every day.</p>',
		min_power:1,
		require_cronjob:true,
		cron_job_time_intervals:30,
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