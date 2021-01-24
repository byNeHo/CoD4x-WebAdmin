const shell = require('shelljs');
const mongoose = require('mongoose');
const BluebirdPromise  = require('bluebird');
mongoose.Promise = require('bluebird');
var fs = BluebirdPromise.promisifyAll(require("fs"));
const chalk = require('chalk');
const config = require('./app/config/config');
const Chathistory =  require("./app/models/chathistory");
const Plugins = require("./app/models/plugins");
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

mongoose.connection.on('error', function(err) {
	if(err){
		log(chalk.red('Your mongoDB Username, Password is wrong in file app/config/config.json. Could not connect to database! '+err));
	};
});


// ######################## Plugins ########################################### //

var plugins = [
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

//######################################## STARTING UPDATE ########################################//

log(chalk.green('Update Cod4xWebadmin Application Started'));


var obj = require('./app/config/config.json');

obj.skin = { 
    theme: 'light',
    header: 'lightblue'
};

fs.writeFileAsync('app/config/config.json', JSON.stringify(obj, null, 2), function (err){
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
}).then(function(deletefromDB) {
    Chathistory.find().deleteMany().exec();
    log(chalk.yellow('Delete old chat messages if they exist- Finished'));
}).then(function(updatedb) {
    //log(chalk.yellow('No DB updates needed'));
    
    var done = 0;
    for (var i = 0; i < plugins.length; i++){
        plugins[i].save(function (err, result){
            done++;
            if(done === plugins.length){
                log(chalk.yellow('Adding New Plugin - Remove Old Chat Messages'));
                log(chalk.green('DB Update Finished'));
                exit();
            }
        });
    }   
})
.catch(function(e) {
    console.error(e.stack);
});


//######################################## FUNCTIONS ########################################//

function exit(){
    log(chalk.green('Update Finished, you can now start your application!'));
    mongoose.connection.close();
}

function gitpull() {
    if (shell.exec('git pull origin master').code !== 0) {
        console.log('There was an error');
    }
    install();
}

function install() {
    //shell.cd('');
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
