// Require needed modules
const mongoose = require('mongoose');
const BluebirdPromise = require('bluebird');
const jsonfile = require('jsonfile');
const githubLatestRelease = require('github-latest-release');
const SSH = require('simple-ssh');
const os = require('os');
const S = require('underscore.string');
const fs  = require('fs');
const multiparty = require('multiparty');
const path = require('path');
const config = require('../../config/config');
const Appversion = require("../../models/app_version");
const AdminGroups = require("../../models/admingroups");
const Rconcommand = require("../../models/server_commands");
const ExtraRcon = require("../../models/extra_rcon_commands");
const Color = require("../../models/colors");
const Servers = require("../../models/servers");
const Cod4xversion = require("../../models/cod4x_version");
const Systemlogs = require("../../models/system_logs");
const PlayersData = require("../../models/players_db");
const Cod4xbinary = require("../../models/cod4x_binary_files");


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

var deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			//console.log(curPath);
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
};

module.exports = {

	getHome: function(req, res, next) {
		BluebirdPromise.props({
			cod4xfiles: Cod4xbinary.find({'file_ready':true}).sort({'createdAt': 'desc'}).execAsync(),
			server: Servers.find({'external_ip':false}).execAsync()
		}).then (function(results){
			res.render('admin/cod4x-github/index.pug', {title: 'Admin CoD4x Binary Files', results: results, csrfToken: req.csrfToken()});
		}).catch(function(err) {
			console.log(err);
			res.redirect('/user/profile');
		});
	},

	getLatestFiles: function(req, res, next) {
		var ssh = new SSH({
			host: config.ssh_access.host,
			user: config.ssh_access.user,
			pass: config.ssh_access.password,
			baseDir: config.cod4x_compile.dir_root
		});
		ssh.exec('cd '+config.cod4x_compile.dir_root, {
			out: console.log.bind('Entering the servers root directory')
		}).exec('git pull origin master && exit', {
			out: console.log.bind('Start CoD4x file Compiling')
		}).start();
		req.flash('success_messages', 'New CoD4x Files will be downloaded soon, wait about 10-15 seconds and Compile your new binary files!');
		res.redirect('back');
	},

	InsertCoD4xGithubFiles: function(req, res, next) {
		var ssh = new SSH({
			host: config.ssh_access.host,
			user: config.ssh_access.user,
			pass: config.ssh_access.password,
			baseDir: config.cod4x_compile.dir_root
		});
		ssh.exec('cd '+config.cod4x_compile.dir_root, {
			out: console.log.bind('Entering the servers root directory')
		}).exec('make && exit', {
			pty: true,	
			out: console.log.bind('Start CoD4x file Compiling')
		}).start();

		setTimeout(function() {  
			var newCod4xbinary = new Cod4xbinary ({
				category: req.body.category,
				name: req.body.name,
				file_ready: true,
				status: true
			});
			if(newCod4xbinary){
				var binary_files_directory = __dirname + '/../../../public/cod4x-binary';
				var binary_file_directory = __dirname + '/../../../public/cod4x-binary/'+newCod4xbinary.id;	
				if (!fs.existsSync(binary_files_directory)){
					fs.mkdirSync(binary_files_directory);
				}
				if (!fs.existsSync(binary_file_directory)){
					fs.mkdirSync(binary_file_directory);
				}
				var ssh2 = new SSH({
					host: config.ssh_access.host,
					user: config.ssh_access.user,
					pass: config.ssh_access.password,
					baseDir: config.cod4x_compile.dir_root+'/bin'
				});
				ssh2.exec('sudo cp -f '+config.cod4x_compile.dir_root+'/bin/'+req.body.name+' '+config.cod4x_compile.save_directory_path+'/cod4x-binary/'+newCod4xbinary.id+'/ && sudo chown -R '+config.ssh_access.user+':'+config.ssh_access.user+' '+config.cod4x_compile.save_directory_path+'/cod4x-binary/'+newCod4xbinary.id+'/'+req.body.name, {
					pty: true,
					out: console.log.bind('File copied to public folder')
				}).start();
			}
			newCod4xbinary.saveAsync()
		}, 180000);
		req.flash('success_messages', 'New CoD4x Binary Server file Compile started, refresh this page after 3 minutes, we need time to compile the file!');
		res.redirect('back');
	},

	InsertCoD4xGithubPlugins: function(req, res, next) {
		var ssh = new SSH({
			host: config.ssh_access.host,
			user: config.ssh_access.user,
			pass: config.ssh_access.password,
			baseDir: config.cod4x_compile.dir_root+'/plugins/'+req.body.name
		});
		if (req.body.name == "julia"){
			var exec_cmd = "./makefile.sh && exit"
		} else {
			var exec_cmd = "make && exit"
		}
		ssh.exec('cd '+config.cod4x_compile.dir_root+'/plugins/'+req.body.name, {
			out: console.log.bind('Entering the plugins directory')
		}).exec(exec_cmd, {
			pty: true,	
			out: console.log.bind('Start CoD4x Plugin Compiling')
		}).start();
		setTimeout(function() {  
			var newCod4xbinary = new Cod4xbinary ({
				category: req.body.category,
				name: req.body.name,
				file_ready: true,
				status: true
			});
			if(newCod4xbinary){
				var binary_files_directory = __dirname + '/../../../public/cod4x-binary';
				var binary_file_directory = __dirname + '/../../../public/cod4x-binary/'+newCod4xbinary.id;
				if (!fs.existsSync(binary_files_directory)){
					fs.mkdirSync(binary_files_directory);
				}
				if (!fs.existsSync(binary_file_directory)){
					fs.mkdirSync(binary_file_directory);
				}
				var ssh2 = new SSH({
					host: config.ssh_access.host,
					user: config.ssh_access.user,
					pass: config.ssh_access.password,
					baseDir: config.cod4x_compile.dir_root+'/plugins/'+req.body.name
				});
				ssh2.exec('sudo cp -f '+config.cod4x_compile.dir_root+'/plugins/'+req.body.name+'/'+req.body.name+'.so '+config.cod4x_compile.save_directory_path+'/cod4x-binary/'+newCod4xbinary.id+'/ && sudo chown -R '+config.ssh_access.user+':'+config.ssh_access.user+' '+config.cod4x_compile.save_directory_path+'/cod4x-binary/'+newCod4xbinary.id+'/'+req.body.name+'.so', {
					pty: true,
					out: console.log.bind('File copied to public folder')
				}).start();
			}
			newCod4xbinary.saveAsync()
		}, 180000);
		req.flash('success_messages', 'New CoD4x Binary Plugin file Compile started, refresh this page after 3 minutes, we need time to compile the plugin!');
		res.redirect('back');
	},

	RemoveBinaryFile: function(req, res, next) {
		Cod4xbinary.findOne({'_id': req.params.id}).execAsync()
		.then (function(result){
			var filePath = './public/cod4x-binary/'+req.params.id;
			Cod4xbinary.deleteOne({'_id': req.params.id}).exec();
			deleteFolderRecursive(filePath);
			req.flash('success_messages', 'Binary File successfully deleted!');
			res.redirect('back');
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error: '+err);
			res.redirect('back');
		});
	},

	UseCoD4xGithubPlugin: function(req, res, next) {
		BluebirdPromise.props({
			cod4xfiles: Cod4xbinary.findOne({'_id':req.params.id}).execAsync(),
			server: Servers.find({'external_ip':false, 'is_online':true}).execAsync()
		}).then (function(results){
			if (results.server.length > 0){
				req.flash('error_messages', 'Error! You have no Local Servers, or the Local Servers are not stopped!');
				res.redirect('back');
			} else {
				var ssh = new SSH({
					host: config.ssh_access.host,
					user: config.ssh_access.user,
					pass: config.ssh_access.password,
					baseDir: config.cod4x_compile.dir_root+'/plugins/'+results.cod4xfiles.name
				});
				ssh.exec('sudo cp -f '+config.cod4x_compile.save_directory_path+'/cod4x-binary/'+results.cod4xfiles.id+'/'+results.cod4xfiles.name+'.so '+config.cod4_server_plugin.servers_root+'/main-server-files/plugins/ && sudo chown -R '+config.ssh_access.user+':'+config.ssh_access.user+' '+config.cod4_server_plugin.servers_root+'/main-server-files/plugins/'+results.cod4xfiles.name, {
					pty: true,
					out: console.log.bind('File copied to main-server-files folder')
				}).start();
				req.flash('success_messages', 'New Binary Plugin file successfully copied to main-server-files, you can start now your Local Servers!');
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log(err);
			res.redirect('back');
		});
	},

	UseCoD4xGithubBinary: function(req, res, next) {
		BluebirdPromise.props({
			cod4xfiles: Cod4xbinary.findOne({'_id':req.params.id}).execAsync(),
			server: Servers.find({'external_ip':false, 'is_online':true}).execAsync()
		}).then (function(results){
			if (results.server.length > 0){
				req.flash('error_messages', 'Error! You have no Local Servers, or the Local Servers are not stopped!');
				res.redirect('back');
			} else {
				var ssh = new SSH({
					host: config.ssh_access.host,
					user: config.ssh_access.user,
					pass: config.ssh_access.password,
					baseDir: config.cod4x_compile.dir_root+'/bin'
				});
				ssh.exec('sudo cp -f '+config.cod4x_compile.save_directory_path+'/cod4x-binary/'+results.cod4xfiles.id+'/'+results.cod4xfiles.name+' '+config.cod4_server_plugin.servers_root+'/main-server-files/ && sudo chown -R '+config.ssh_access.user+':'+config.ssh_access.user+' '+config.cod4_server_plugin.servers_root+'/main-server-files/'+results.cod4xfiles.name, {
					pty: true,
					out: console.log.bind('File copied to main-server-files folder')
				}).start();
				req.flash('success_messages', 'New Binary file successfully copied to main-server-files, you can start now your Local Servers!');
				res.redirect('back');
			}
		}).catch(function(err) {
			console.log(err);
			res.redirect('back');
		});
	}
};
