const shell = require('shelljs');
const mongoose = require('mongoose');
const BluebirdPromise  = require('bluebird');
mongoose.Promise = require('bluebird');
var fs = BluebirdPromise.promisifyAll(require("fs"));
const chalk = require('chalk');
const config = require('./app/config/config');

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


    log(chalk.cyan('Checking NodeJS Version'));
    nodeVersion();
    log(chalk.cyan('Getting Latest Files from GitHub and Installing npm Files'));
    install();
    log(chalk.green('Finished'));
    log(chalk.green('Update Finished, you can now start your application!'));
    process.exit(1);


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
