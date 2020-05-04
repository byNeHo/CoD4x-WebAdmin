const shell = require('shelljs');
const mongoose = require('mongoose');
const BluebirdPromise  = require('bluebird');
mongoose.Promise = require('bluebird');
var fs = BluebirdPromise.promisifyAll(require("fs"));
const chalk = require('chalk');
const config = require('../app/config/config');

const log = console.log;

var dbURI = "mongodb://" + 
			encodeURIComponent(config.db.username) + ":" + 
			encodeURIComponent(config.db.password) + "@" + 
			config.db.host + ":" + 
			config.db.port + "/" + 
			config.db.name;
mongoose.connect(dbURI, {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

if (!shell.which('git')) {
    shell.echo('Sorry, this script requires git');
    shell.exit(1);
}

// Throw an error if the connection fails
mongoose.connection.on('error', function(err) {
	if(err){
		log(chalk.red('Your mongoDB Username, Password is wrong in file app/config/config.json. Could not connect to database! '+err));
	};
});

/*

const Plugins = require("../app/models/plugins");


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
];



*/

//######################################## STARTING UPDATE ########################################//

log(chalk.green('Update Cod4xWebadmin Application Started'));


var obj = require('../app/config/config.json');

obj.localmachine = { 
    yes: '0',
    country: 'Germany',
    country_short: 'de' 
};

fs.writeFileAsync('../app/config/config.json', JSON.stringify(obj, null, 2), function (err){
    if (err) console.log(err);
    log(chalk.cyan('Adding new lines to') + chalk.white(' app/config/config.json'));
}).then(function(filewritten) {
    log(chalk.green('Finished'));
}).then(function(checknode) {
    log(chalk.cyan('Checking NodeJS Version'));
    nodeVersion();
}).then(function(gtp) {
    log(chalk.cyan('Getting Latest Files from GitHub and Installing npm Files'));
    gitpull();
}).then(function(gitfinished) {
    log(chalk.green('Finished'));
}).then(function(updatedb) {
    log(chalk.yellow('No DB updates needed'));
    /*
    var done = 0;
    for (var i = 0; i < plugins.length; i++){
        plugins[i].save(function (err, result){
            done++;
            if(done === plugins.length){
                log(chalk.green(' Finished'));
                exit();
            }
        });
    }
    */
   exit();
}).catch(function(e) {
    console.error(e.stack);
});


//######################################## FUNCTIONS ########################################//

function exit(){
	mongoose.connection.close();
	log(chalk.green('Update Finished, you can now start your application!'));
}

function gitpull() {
    //if (shell.exec('git pull origin master').code !== 0) {
    // new errors.GitError()
    //}
    install();
}

function install() {
    shell.cd('../');
    shell.echo('Installing package')
    if (shell.exec('npm install').code !== 0) {
        new erros.NpmOrNodeError();
        endProcess();
    }
}

function nodeVersion() {
    shell.echo('Verifying NodeJS version')
    const stdout = shell.exec('node --version').stdout
    const version = stdout && parseFloat(stdout.substring(1));
    if (version < 8) {
     logger.error('Unsupported node.js version, make sure you have the latest version installed.');
     endProcess();
    }
}
