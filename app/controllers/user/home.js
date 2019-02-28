// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const fs = require('fs');
const multiparty = require('multiparty');
const Jimp = require("jimp");
const uniqueString = require('unique-string');
const multer  = require('multer');
const path = require('path');
const formatNum = require('format-num');
const NodeGeocoder = require('node-geocoder');
const BluebirdPromise = require('bluebird');
const Recaptcha = require('express-recaptcha').Recaptcha;
const config = require('../../config/config');
const User = require("../../models/user");
const Plugins = require("../../models/plugins");

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

	getLogin: function(req, res, next) {
		Plugins.findAsync({'category' : 'sso', 'status':true})
		.then (function(results){
			var translation = req.t("pagetitles:pageTitle.login");
			res.render('auth/login.pug', { title: translation, results: results, csrfToken: req.csrfToken(), message: req.flash('loginMessage') });
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getSignup: function(req, res, next) {
		Plugins.findAsync({'category' : 'sso', 'status':true})
		.then (function(results){
			var options = {'hl':req.language};
			var recaptcha = new Recaptcha(config.g_recaptcha.SITE_KEY, config.g_recaptcha.SECRET_KEY, options);
			var translation = req.t("pagetitles:pageTitle.register");
			res.render('auth/signup.pug', { title: translation, results: results, csrfToken: req.csrfToken(), captcha:recaptcha.render(), message: req.flash('signupMessage') });
	}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},


	getProfile: function(req, res, next) {
		BluebirdPromise.props({
			ssoauth: Plugins.find({'category' : 'sso', 'status':true}).execAsync()
		}).then (function(results){
			var translation = req.t("pagetitles:pageTitle.my_profile");
			res.render('auth/profile.pug', {title: translation, results: results, csrfToken: req.csrfToken()});
		}).catch (function(err){
			console.log(err);
			res.redirect('/user/profile');
		});
	},

	getLogout: function(req, res, next) {
		res.clearCookie('rememberMe');
        req.logout();
        res.redirect('/user/login');
	},

	ScreenshotNotificationUpdate: function(req, res, next) {
		User.findOneAndUpdate({'_id':req.user._id,  "local.user_role": {$gt:1}}, {$set:{'account_settings.enable_screenshot_notification':req.body.enable_screenshot_notification, 'account_settings.enable_screenshot_notification_sound':req.body.enable_screenshot_notification_sound}}, {new: true}, function(err, doc){
		    if(err){
		        req.flash('error_messages', req.t("auth:profile.profilescreenshot_feature_error"));
		    }
		    req.flash('success_messages', req.t("auth:profile.profilescreenshot_feature_success"));
		    res.redirect('/user/profile');
		});
	},


	uploadAvatar:  function(req, res, next) {
		User.findOneAsync({'_id' : req.user._id})
	    .then (function(logo){
			if (!fs.existsSync('./public/img/avatars/'+req.user._id)){
				fs.mkdirSync('./public/img/avatars/'+req.user._id);
			}

			var storage =   multer.diskStorage({
		  		destination: function (req, file, callback) {
				    callback(null, './public/img/avatars/'+req.user._id);
				},
				filename: function (req, file, callback) {
					callback(null, 'avatar'+path.extname(file.originalname));
				}
			});
			var upload = multer({
				storage : storage,
				fileFilter: function (req, file, callback) {
			        var ext = path.extname(file.originalname);
			        if(ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
			        	req.fileValidationError = req.t("auth:profile.profile_avatar_img_type");
			            //return callback(new Error('Only images in JPG and PNG formats are allowed'));
			            req.flash('error_messages', req.t("auth:profile.profile_avatar_img_type"));
			            res.redirect('back');
			        }
			        callback(null, true);
			    },
			}).single('userPhoto');
			upload(req,res,function(err) {
				if(req.fileValidationError) {
					return res.end(req.fileValidationError);
				}else{
					logo.local.avatar_60 = '/img/avatars/'+req.user._id+'/thumb_'+req.file.filename,
                        logo.local.avatar_512 = '/img/avatars/'+req.user._id+'/'+req.file.filename;
                        logo.saveAsync();

			Jimp.read('./public/img/avatars/'+req.user._id+'/'+req.file.filename).then(function (image) {
				image.resize(60,60)
				.write('./public/img/avatars/'+req.user._id+'/thumb_'+req.file.filename, function (error) {
				if(error)
				    console.log(error);
				});
			}).catch(function (err) {
				console.log(err);
			});
			Jimp.read('./public/img/avatars/'+req.user._id+'/'+req.file.filename)
			.then(function (image) {
				image.resize(512,Jimp.AUTO)
				.write('./public/img/avatars/'+req.user._id+'/'+req.file.filename, function (error) {
				if(error)
				    console.log(error);
				});
			}).catch(function (err) {
				console.log(err);
			});
			req.flash('success_messages', req.t("auth:profile.profile_avatar_changed"));
		        res.redirect('back');
				}

			
		    });
	    });
	},

	RemoveAvatar: function(req, res, next) {
		User.findOneAsync({'_id' : req.user._id})
		.then (function(logo){
			var path = './public/img/avatars/'+logo._id;
			deleteFolderRecursive(path);

			logo.local.avatar_60 = '/img/avatars/default-60.jpg',
			logo.local.avatar_512 = '/img/avatars/default-512.jpg',
			logo.saveAsync();

			req.flash('error_messages', req.t("auth:profile.profile_avatar_deleted"));
		        res.redirect('back');
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},
	
};
