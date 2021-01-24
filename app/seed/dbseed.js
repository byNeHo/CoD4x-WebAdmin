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

const User = require("../models/user");
const ExtraRcon = require("../models/extra_rcon_commands");
const Rconposition = require("../models/rconcommand_position");
const AdminGroup = require("../models/admingroups");
const Color = require("../models/colors");
const UserMap = require("../models/maps");
const Rconcommand = require("../models/rconcommands");
const TempbanDurations = require("../models/tempban_duration");
const Plugins = require("../models/plugins");
const Appversion = require("../models/app_version");
const Cod4xversion = require("../models/cod4x_version");
const ServerCommands = require("../models/server_commands");
const Chathistory =  require("../models/chathistory");

// ######################## Create Default Admin User ########################################### //

//Default user login informations on seed //first install
// username: admin
// email: admin@gmail.com
//password: password


var users = [
	new User({
		'local': {
			'email': 'admin@gmail.com',
			'user_name': 'admin',
			'password': '$2a$10$b4NPW79jULyCOqLMd3jS5.fEHYxqUqGpi2hwYjoXXPvds.TC91tVi',
			'user_role': 100
		}
	})
];

var done = 0;

for (var i = 0; i < users.length; i++){
	users[i].save(function (err, result){
		done++;
		if(done === users.length){
			exit();
		}
	});
}



// ######################## App version ########################################### //

var appversions = [
	new Appversion({
			'name': 'CoD4x-WebAdmin'
	})
];

var done = 0;

for (var i = 0; i < appversions.length; i++){
	appversions[i].save(function (err, result){
		done++;
		if(done === appversions.length){
			exit();
		}
	});
}


// ######################## CoD4x version ########################################### //

var cod4xservers = [
	new Cod4xversion({
			'name': 'CoD4x-Server'
	})
];

var done = 0;

for (var i = 0; i < cod4xservers.length; i++){
	cod4xservers[i].save(function (err, result){
		done++;
		if(done === cod4xservers.length){
			exit();
		}
	});
}



// ######################## Plugins ########################################### //

var plugins = [
	new Plugins({
		name:'SSO Google',
		category:'sso',
		description:'Plugin that allows users to login/register via their Google account',
		instructions:'Activate or Deactivate Google Plus authentication on your application (Status checkbox)<br><br>\r\n<span style=\"font-weight: bold;\">Configuration:\r\n</span><ol>\r\n<li>Create a Google Application via the <a href=\"https://code.google.com/apis/console\" target=\"_blank\">API Console</a><br></li>\r\n<li>Locate your Client ID and Secret</li>\r\n<li>Navigate to your app (app/config/config.json and locate section \"googleAuth\")<br></li>\r\n<li>Change clientID and clientSecret to yours</li>\r\n<li>Set your \"callbackURL\" as the domain you access your app with /user/auth/google/callback, appended to it (e.g. https://www.mygreatwebsite.com/user/auth/google/callback)</li>\r\n</ol>\r\n<p>If you have set everything as you should, then you should see the Google+ login button on your login/register and profile pages, test if they work, link your account with google on profile page</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'SSO Twitter',
		category:'sso',
		description:'Plugin that allows users to login/register via their Twitter account',
		instructions:'Activate or Deactivate Twitter authentication on your application (Status checkbox)<br><br>\r\n<span style=\"font-weight: bold;\">Configuration:\r\n</span><ol>\r\n\r\n<li>Create a Twitter Application via the <a href=\"https://apps.twitter.com/\" target=\"_blank\">API Console</a><br></li>\r\n\r\n<li>Locate your consumerKey and consumerSecret</li>\r\n\r\n<li>Navigate to your app (app/config/config.json and locate section \"twitterAuth\")<br></li>\r\n\r\n<li>Change consumerKey and consumerSecret to yours</li>\r\n\r\n<li>Set your \"callbackURL\" as the domain you access your app with /user/auth/twitter/callback, appended to it (e.g. https://www.mygreatwebsite.com/user/auth/twitter/callback)</li>\r\n\r\n</ol>\r\n\r\n<p>If you have set everything as you should, then you should see the Twitter login button on your login/register and profile pages, test if they work, link your account with twitter on profile page</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'SSO Facebook',
		category:'sso',
		description:'Plugin that allows users to login/register via their Facebook account',
		instructions:'Activate or Deactivate Facebook authentication on your application (Status checkbox)<br><br>\r\n<span style=\"font-weight: bold;\">Configuration:\r\n</span><ol>\r\n\r\n<li>Create a Facebook Application via the <a href=\"https://developers.facebook.com/apps/\" target=\"_blank\">API Console</a><br></li>\r\n\r\n<li>Locate your Client ID and Secret</li>\r\n\r\n<li>Navigate to your app (app/config/config.json and locate section \"facebookAuth\")<br></li>\r\n\r\n<li>Change clientID and clientSecret to yours</li>\r\n\r\n<li>Set your \"callbackURL\" as the domain you access your app with /user/auth/facebook/callback, appended to it (e.g. https://www.mygreatwebsite.com/user/auth/facebook/callback)</li>\r\n\r\n</ol>\r\n\r\n<p>If you have set everything as you should, then you should see the Facebook login button on your login/register and profile pages, test if they work, link your account with facebook on profile page</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'SSO Steam',
		category:'sso',
		description:'Plugin that allows users to login/register via their Steam account',
		instructions:'<p>Activate or Deactivate Steam authentication on your application (Status checkbox).</p><p><span style=\"font-weight: bold;\">If you have a Limited User Account on Steam you will be not able to get a Steam Web Api key<span style=\"color: rgb(51, 51, 51);\">. </span>In order to use Steam Authentication and bee able to get a Web Api key You will need to spend at least $5.00 USD within the Steam store.</span><br><br><span style=\"font-weight: bold;\">Configuration:</span><br></p><ol><li>Register Steam Web API key via the <a href=\"http://steamcommunity.com/dev/apikey\" target=\"_blank\">API Console</a><br></li><li>Locate your apiKey</li><li>Navigate to your app (app/config/config.json and locate section \"steamAuth\")<br></li><li>Change apiKey to yours</li><li>Set your \"returnURL\" as the domain you access your app with /user/auth/steam/return, appended to it (e.g. https://www.mygreatwebsite.com/user/auth/steam/return)</li><li>Set realm to your domain (e.g. https://www.mygreatwebsite.com/)<br></li></ol><br><p>If you have set everything as you should, then you should see the Steam login button on your login/register and profile pages, test if they work, link your account with steam on profile page</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'Discord Webhook',
		category:'discord',
		description:'Plugin that allows you to send messages to your Discord server, Sends notifications when there is a new cheater report, unban request, new admin application',
		instructions:'<p>Plugin Discord Webhook will send messages to your discord server. Messages will be sent if there is a new Cheater Report, Unban Request or an Admin Application. Instructions for Discord Server Setup can be found <a href=\"https://support.discordapp.com/hc/en-us/articles/228383668-Intro-to-Webhooks\" target=\"_blank\">here</a><br></p><p>Activate or Deactivate Discord Webhook on your application (Status checkbox)<br><br>\r\n<span style=\"font-weight: bold;\">Configuration:\r\n</span><br></p><ol><li>Create a Discord Webhook via the Discord App</li><li>Get the webhook URL for the server/channel you want to receive messages</li><li>Navigate to your app (app/config/config.json and locate section \"discord_webhook\")<br></li><li>Change webhook_url, webhook_displayname and&nbsp;webhook_avatar (I used here the logo image)<br></li></ol><p>If you have set everything as you should, then you should receive notifications to your Discord Server/Channel on every new Cheater Report, Unban Request or an Admin Application.</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'Remove old Tempbans',
		category:'cronjobs',
		description:'Remove older tempbans from the website',
		instructions:'<p>Activate or Deactivate Plugin Remove old Tempbans on your application (Status checkbox)<br></p><p>This plugin will remove all older not active Tempbans (then x days) from the website, enter a valid number for days, do not use commas, points. The plugin will run once a day at 3:01</p>',
		min_power:1,
		require_cronjob:true,
		cron_job_time_intervals:30,
		status:false
	}),
	new Plugins({
		name:'Remove old Player Data',
		category:'cronjobs',
		description:'Remove older player data from the website',
		instructions:'<p>Activate or Deactivate Plugin Remove old Player Data on your application (Status checkbox)<br></p><p>This plugin will remove all older not active Player Data (then x days) from the website, enter a valid number for days, do not use commas, points. The plugin will run once a day at 3:05</p>',
		min_power:1,
		require_cronjob:true,
		cron_job_time_intervals:180,
		status:false
	}),
	new Plugins({
		name:'CoD4x Authtoken',
		category:'cod4x',
		description:'Get your server listed on CoD4x Masterserver (Only for Local Servers)',
		instructions:'<p>Activate or Deactivate Plugin CoD4x Authtoken on your application (Status checkbox)<br></p><p>This plugin will list your server(s) on COD4x Masterserver (requires 17.6 or newer version).<br /><br /><strong>Do I need a token?</strong><br /> If your server is still listed on <a href="http://cod4master.cod4x.me" target="_blank">http://cod4master.cod4x.me</a> you do not need a token and do not need new serverversion yet unless you change your IP address.<br /><br /><strong>Where do I get this token?</strong><br />You get it on: <a href="http://cod4master.cod4x.me" target="_blank">http://cod4master.cod4x.me</a> and click the link "Get a Token". Here you need an unlimited and clean Steam Account. <strong>After you get your token insert it here in the Token field, save changes and activate the plugin</strong><br /><br />Do not forget to restart your Game Servers after you have activated the plugin. If everything is working as it should you will see a new value in your server script start line +set sv_authtoken "mytokenhere"</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'Julia SS Check',
		category:'julia',
		description:'Kick Screenshot Blockers and Black SS',
		instructions:'<p>Activate or Deactivate Plugin Julia SS Check on your application (Status checkbox)<br></p><p>This plugin will kick players with Black SS and will create a screenshot for every player on first server visit. Once we recive a screenshot this player will not be checked further. If they leave before we have the screenshot they will be again SS-ed, also they will be kicked if they have a black SS and checked again when they rejoin.</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'Start Stop Server',
		category:'servers',
		description:'Start| Stop | Restart - Server (Only for Local Servers)',
		instructions:'<p>Activate or Deactivate Plugin Start Stop Server on your application (Status checkbox)<br></p><p>Start | Stop Local CoD4x Servers. You can already do this in Admin backend, this plugin is for frontend page for Admins with X power. The start stop server functions can be found on local server details page.</p>',
		min_power:100,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'KGB Host API',
		category:'kgb',
		description:'Start| Stop | Restart - Server',
		instructions:'<p>Start| Stop | Restart servers hosted on KGB Hosting</p>',
		min_power:100,
		require_cronjob:false,
		cron_job_time_intervals:30,
		status:false
	}),
	new Plugins({
		name:'Download cod4x files from GitHub',
		category:'cronjobs',
		description:'Download cod4x files from GitHub Daily',
		instructions:'<p>This plugin will Download cod4x source files from GitHub Daily.</p><p class=\"c-red\">If you have just enabled this plugin please wait 24 hours before you Compile server Binary or Plugin files.</p><p>The plugin downloads the source files every day at 5:30 in morning</p><br><br>\r\n<span style=\"font-weight: bold;\">Configuration:\r\n</span><ol>\r\n\r\n<li>Navigate to your app (app/config/config.json and locate section \"ssh_access\")<br></li>\r\n\r\n<li>Change host, user and password to yours (this user must be in sudo group)</li>\r\n\r\n<li>Locate next section in config.json \"cod4_server_plugin\", replace linux_user in servers_root with your user what you have defined in ssh access in previous step.</li>\r\n\r\n<li>Locate next section in config.json \"cod4x_compile\", replace linux_user in dir_root with your user what you have defined in ssh access in previous step, also replace save_directory_path, the full path to your websites public folder</li>\r\n\r\n</ol>\r\n\r\n<p>If you have set everything as you should, then the cod4x source files from Cod4x_Server Github page will be auto-downloaded every day.</p>',
		min_power:1,
		require_cronjob:true,
		cron_job_time_intervals:30,
		status:false
	}),
	new Plugins({
		name:'Emailer Sendgrid',
		category:'emailer',
		description:'An emailer plugin for Cod4xWebAdmin using SendGrid as a third party service',
		instructions:'<p>Activate or Deactivate Plugin Sendgrid Emailer on your application (Status checkbox)<br></p><p>This Emailer plugin allows Cod4xWebAdmin to send emails to users through the third-party transactional email service Sendgrid.<br /><br /><strong>Do I need Sendgrid?</strong><br /> If you would like to send emails to users and for example be able to reset your password then yes. Password reset works only if you have configured and activated this plugin.<br /><br /><strong>Where do I get this API key?</strong><br />You get it on: <a href="https://sendgrid.com/" target="_blank">https://sendgrid.com/</a>. Sign up, make sure you activate your account after registration via your email, choose the free option it is more than enough for our purpose. After Logging in go to Settings -> API keys and create a new API key. <strong>After you get your API key insert it here in the API key field, save changes and activate the plugin</strong><br /><br />If everything is working as it should you will see on your Log In page a Forgot Password? link. You can test it out with your own account if it works.</p>',
		min_power:1,
		require_cronjob:false,
		cron_job_time_intervals:2,
		status:false
	}),
	new Plugins({
		name:'Remove old Game Chat',
		category:'cronjobs',
		description:'Remove older chat messages from the website',
		instructions:'<p>Activate or Deactivate Plugin Remove old Game Chat on your application (Status checkbox)<br></p><p>This plugin will remove all older InGame chat Messages (then x days) from the website, enter a valid number for days, do not use commas, points. The plugin will run once a day at 03:07</p>',
		min_power:1,
		require_cronjob:true,
		cron_job_time_intervals:7,
		status:false
	}),
	new Plugins({
		name:'Shoutbox',
		category:'shoutbox',
		description:'Shoutbox is a chat-like feature that allows people to quickly leave messages on the website, visible on the Home page',
		instructions:'Shoutbox is a chat-like feature that allows people to quickly leave messages on the website, visible on the Home page. If the minimum power is set higher than 1 then only users with enough power will be able to read/use the shoutbox.',
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

// ######################## Extra Rcon Settings ########################################### //

var extrarcons = [
	new ExtraRcon({
		name:'extra_rcon',
		screenshots_enabled:false,
		minimum_admin_power_for_screenshots:100,
		screenshots_for_users_enabled:false,
		maximum_screenshots_for_users:100,
		enable_screenshot_all:false,
		enable_map_change:false,
		minimum_power_for_map_change:false,
		enable_maprotate:false,
		minimum_power_for_maprotate:100,
		enable_player_unban:false,
		minimum_power_for_player_unban:100,
		enable_tempban_duration:false,
		default_tempban_time:'20',
		minimum_cheater_reports: 5,
		minimum_power_for_cheater_reports: 80
	})
];

var done = 0;

for (var i = 0; i < extrarcons.length; i++){
	extrarcons[i].save(function (err, result){
		done++;
		if(done === extrarcons.length){
			exit();
		}
	});
}


// ######################## Tempban Durations ########################################### //

var tembandurations = [
	new TempbanDurations({
		category : "Minute",
		category_alias : "minute",
		time_number : 5,
		short_label : "5m",
		long_label : "min"
	}),
	new TempbanDurations({
		category : "Minute",
		category_alias : "minute",
		time_number : 10,
		short_label : "10m",
		long_label : "min"
	}),
	new TempbanDurations({
		category : "Minute",
		category_alias : "minute",
		time_number : 20,
		short_label : "20m",
		long_label : "min"
	}),
	new TempbanDurations({
		category : "Minute",
		category_alias : "minute",
		time_number : 30,
		short_label : "30m",
		long_label : "min"
	}),
	new TempbanDurations({
		category : "Minute",
		category_alias : "minute",
		time_number : 45,
		short_label : "45m",
		long_label : "min"
	}),
	new TempbanDurations({
		category : "Hour",
		category_alias : "hour",
		time_number : 1,
		short_label : "1h",
		long_label : "hour"
	}),
	new TempbanDurations({
		category : "Hour",
		category_alias : "hour",
		time_number : 2,
		short_label : "2h",
		long_label : "hour"
	}),
	new TempbanDurations({
		category : "Hour",
		category_alias : "hour",
		time_number : 5,
		short_label : "5h",
		long_label : "hour"
	}),
	new TempbanDurations({
		category : "Hour",
		category_alias : "hour",
		time_number : 8,
		short_label : "8h",
		long_label : "hour"
	}),
	new TempbanDurations({
		category : "Hour",
		category_alias : "hour",
		time_number : 12,
		short_label : "12h",
		long_label : "hour"
	}),
	new TempbanDurations({
		category : "Day",
		category_alias : "day",
		time_number : 1,
		short_label : "1d",
		long_label : "day"
	}),
	new TempbanDurations({
		category : "Day",
		category_alias : "day",
		time_number : 2,
		short_label : "2d",
		long_label : "day"
	}),
	new TempbanDurations({
		category : "Day",
		category_alias : "day",
		time_number : 3,
		short_label : "3d",
		long_label : "day"
	}),
	new TempbanDurations({
		category : "Day",
		category_alias : "day",
		time_number : 5,
		short_label : "5d",
		long_label : "day"
	}),
	new TempbanDurations({
		category : "Day",
		category_alias : "day",
		time_number : 7,
		short_label : "7d",
		long_label : "day"
	}),
	new TempbanDurations({
		category : "Day",
		category_alias : "day",
		time_number : 14,
		short_label : "14d",
		long_label : "day"
	})

];

var done = 0;

for (var i = 0; i < tembandurations.length; i++){
	tembandurations[i].save(function (err, result){
		done++;
		if(done === tembandurations.length){
			exit();
		}
	});
}

// ######################## Colors ########################################### //

var colors = [
	new Color({
		name : 'red'
	}),
	new Color({
		name : 'pink'
	}),
	new Color({
		name : 'purple'
	}),
	new Color({
		name : 'deeppurple'
	}),
	new Color({
		name : 'indigo'
	}),
	new Color({
		name : 'blue'
	}),
	new Color({
		name : 'lightblue'
	}),
	new Color({
		name : 'cyan'
	}),
	new Color({
		name : 'teal'
	}),
	new Color({
		name : 'green'
	}),
	new Color({
		name : 'lightgreen'
	}),
	new Color({
		name : 'lime'
	}),
	new Color({
		name : 'yellow'
	}),
	new Color({
		name : 'amber'
	}),
	new Color({
		name : 'orange'
	}),
	new Color({
		name : 'deeporange'
	}),
	new Color({
		name : 'brown'
	}),
	new Color({
		name : 'gray'
	}),
	new Color({
		name : 'bluegray'
	}),
	new Color({
		name : 'black'
	})
];

var done = 0;

for (var i = 0; i < colors.length; i++){
	colors[i].save(function (err, result){
		done++;
		if(done === colors.length){
			exit();
		}
	});
}

// ######################## Maps ########################################### //

var usermaps = [
	new UserMap({
		map_name : 'mp_backlot',
		display_map_name: 'Backlot'
	}),
	new UserMap({
		map_name : 'mp_bloc',
		display_map_name: 'Bloc'
	}),
	new UserMap({
		map_name : 'mp_bog',
		display_map_name: 'Bog'
	}),
	new UserMap({
		map_name : 'mp_broadcast',
		display_map_name: 'Broadcast'
	}),
	new UserMap({
		map_name : 'mp_carentan',
		display_map_name: 'Carentan'
	}),
	new UserMap({
		map_name : 'mp_cargoship',
		display_map_name: 'Cargoship'
	}),
	new UserMap({
		map_name : 'mp_citystreets',
		display_map_name: 'Citystreets'
	}),
	new UserMap({
		map_name : 'mp_convoy',
		display_map_name: 'Convoy'
	}),
	new UserMap({
		map_name : 'mp_countdown',
		display_map_name: 'Countdown'
	}),
	new UserMap({
		map_name : 'mp_crash',
		display_map_name: 'Crash'
	}),
	new UserMap({
		map_name : 'mp_crash_snow',
		display_map_name: 'Crash Snow'
	}),
	new UserMap({
		map_name : 'mp_creek',
		display_map_name: 'Creek'
	}),
	new UserMap({
		map_name : 'mp_crossfire',
		display_map_name: 'Crossfire'
	}),
	new UserMap({
		map_name : 'mp_farm',
		display_map_name: 'Farm'
	}),
	new UserMap({
		map_name : 'mp_killhouse',
		display_map_name: 'Killhouse'
	}),
	new UserMap({
		map_name : 'mp_overgrown',
		display_map_name: 'Overgrown'
	}),
	new UserMap({
		map_name : 'mp_pipeline',
		display_map_name: 'Pipeline'
	}),
	new UserMap({
		map_name : 'mp_shipment',
		display_map_name: 'Shipment'
	}),
	new UserMap({
		map_name : 'mp_showdown',
		display_map_name: 'Showdown'
	}),
	new UserMap({
		map_name : 'mp_strike',
		display_map_name: 'Strike'
	}),
	new UserMap({
		map_name : 'mp_vacant',
		display_map_name: 'Vacant'
	})
];

var done = 0;

for (var i = 0; i < usermaps.length; i++){
	usermaps[i].save(function (err, result){
		done++;
		if(done === usermaps.length){
			exit();
		}
	});
}

// ######################## Admin Groups ########################################### //

var admingroups = [
	new AdminGroup({
		name : 'User',
		power : 1
	}),
	new AdminGroup({
		name : 'Moderator',
		power : 20
	}),
	new AdminGroup({
		name : 'Admin',
		power : 40
	}),
	new AdminGroup({
		name : 'Full Admin',
		power : 60
	}),
	new AdminGroup({
		name : 'Senior Admin',
		power : 80
	}),
	new AdminGroup({
		name : 'Super Admin',
		power : 100
	})
];

var done = 0;

for (var i = 0; i < admingroups.length; i++){
	admingroups[i].save(function (err, result){
		done++;
		if(done === admingroups.length){
			exit();
		}
	});
}

// ######################## Julia Server Commands ########################################### //

var server_commands = [
	new ServerCommands({
		command_name:'cmdlist',
		req_power:1,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'ministatus',
		req_power:1,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'getss',
		req_power:20,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'record',
		req_power:20,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'undercover',
		req_power:80,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'stoprecord',
		req_power:20,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'status',
		req_power:100,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'sm_chat',
		req_power:60,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'kick',
		req_power:40,
		send_back_message_to_server:true
	}),
	new ServerCommands({
		command_name:'tempban',
		req_power:60,
		send_back_message_to_server:true
	}),
	new ServerCommands({
		command_name:'permban',
		req_power:80,
		send_back_message_to_server:true
	}),
	new ServerCommands({
		command_name:'unban',
		req_power:80,
		send_back_message_to_server:true
	}),
	new ServerCommands({
		command_name:'map',
		req_power:100,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'map_rotate',
		req_power:100,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'map_restart',
		req_power:100,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'say',
		req_power:20,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'screensay',
		req_power:80,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'tell',
		req_power:20,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'screentell',
		req_power:80,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'set',
		req_power:100,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'exec',
		req_power:100,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'adminlistcommands',
		req_power:20,
		send_back_message_to_server:false
	}),
	new ServerCommands({
		command_name:'dumpbanlist',
		req_power:100,
		send_back_message_to_server:false
	})
];

var done = 0;

for (var i = 0; i < server_commands.length; i++){
	server_commands[i].save(function (err, result){
		done++;
		if(done === server_commands.length){
			exit();
		}
	});
}

function exit(){
	mongoose.connection.close();
	console.log('Database succesfully populated with Default data')
}