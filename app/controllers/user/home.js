// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const crypto = require('crypto');
const fs = require('fs');
const multiparty = require('multiparty');
const Jimp = require("jimp");
const uniqueString = require('unique-string');
const multer  = require('multer');
const path = require('path');
const formatNum = require('format-num');
const NodeGeocoder = require('node-geocoder');
const BluebirdPromise = require('bluebird');
const Recaptcha = require('express-recaptcha').RecaptchaV2;
const sgMail = require('@sendgrid/mail');
const { check, oneOf, validationResult } = require('express-validator');
const config = require('../../config/config');
const User = require("../../models/user");
const Plugins = require("../../models/plugins");
const PlayersData =  require("../../models/players_db");

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
		BluebirdPromise.props({
			plugins:Plugins.find({'category' : 'sso', 'status':true}).execAsync(),
			resetpassword:Plugins.findOne({'category' : 'emailer', 'status':true}).execAsync()
		}).then (function(results){
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


	getResetPassword: function(req, res, next) {
		Plugins.findOneAsync({'category': 'emailer', 'name_alias': 'emailer-sendgrid', 'status':true})
		.then (function(results){
			if (!results){
				res.redirect('/user/login');
			} else {
				var newdate = Date.now() + 3600000;
				var translation = req.t("pagetitles:pageTitle.reset");
				res.render('auth/reset-password.pug', { title: translation, results: results, csrfToken: req.csrfToken(), message: req.flash('resetMessage') });
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	ResetPasswordUpdate: function(req, res, next) {
		BluebirdPromise.props({
			user:User.findOne({'local.email': req.body.email}).execAsync(),
			resetpassword:Plugins.findOne({'category': 'emailer', 'name_alias': 'emailer-sendgrid','status':true}, 'extra_field').execAsync()
		}).then (function(results){
			if (!results.user){
				req.flash('error_messages', req.t("auth:reset.reset_no_user_found"));
				res.redirect('back');
			} else if (!results.resetpassword){
				res.redirect('/user/login');
			} else {
				crypto.randomBytes(32, (err, buffer)=>{
					if (err){
						console.log(err);
						res.redirect('back');
					}
					var newdate = Date.now() + 3600000;
					const reset_token = buffer.toString('hex');
					results.user.reset.resetToken = reset_token,
					results.user.reset.resetTokenExpiration = newdate;
					results.user.save();
					req.flash('success_messages', req.t("auth:reset.reset_email_sent"));
					
					sgMail.setApiKey(results.resetpassword.extra_field);

					const msg = {
						to: req.body.email,
						from: 'cod4xwebadmin@noreplay.com',
						subject: req.t("auth:reset.reset_h2"),
						html: `
						<p>${req.t('auth:reset.reset_email_h1', { name: results.user.local.user_name })},</p>
						<p>${req.t('auth:reset.reset_email_content_1', { community: config.website_name })}. <strong>${req.t("auth:reset.reset_email_content_2")}.</strong></p>
						<p><a href="${config.website_url}/user/update-password/${reset_token}">${req.t("auth:reset.reset_email_content_3")}</a></p>
						<p>${req.t("auth:reset.reset_email_content_4")}<br />${config.website_url}/user/update-password/${reset_token}</p>
						<p>${req.t("auth:reset.reset_email_content_5")}.</p>
						<p>${req.t("auth:reset.reset_email_content_6")},<br />${req.t('auth:reset.reset_email_content_7', { community: config.website_name })}</p>
						`
					  };
					  sgMail.send(msg);
					res.redirect('back');
				});
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	getNewPassword: function(req, res, next) {
		const token = req.params.token;
		BluebirdPromise.props({
			resetpassword:Plugins.findOne({'category': 'emailer', 'name_alias': 'emailer-sendgrid','status':true}, 'extra_field').execAsync(),
			user: User.findOne({'reset.resetToken': token , 'reset.resetTokenExpiration': { $gt: Date.now() }}, 'id reset.resetToken').execAsync()
		}).then (function(results){
			if (!results.user){
				req.flash('error_messages', req.t("auth:reset.reset_no_user_found"));
				res.redirect('/user/reset-password');
			} else if (!results.resetpassword){
				res.redirect('/user/login');
			} else {
				var translation = req.t("pagetitles:pageTitle.update_password");
				res.render('auth/update-password.pug', { title: translation, results: results, csrfToken: req.csrfToken(), message: req.flash('newpasswordMessage') });
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	NewPasswordUpdate: function(req, res, next) {
		
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			req.flash('newpasswordMessage', req.t("auth:reset.reset_wrong_new_password"));
			return res.redirect('back');
		}
	
		const newPassword = req.body.password;
		const userId = req.body.userId;
		const passwordToken = req.body.passwordToken;
		let resetUser;

		BluebirdPromise.props({
			resetpassword:Plugins.findOne({'category': 'emailer', 'name_alias': 'emailer-sendgrid','status':true}, 'extra_field').execAsync(),
			user: User.findOne({'reset.resetToken': passwordToken , '_id': userId, 'reset.resetTokenExpiration': { $gt: Date.now() }}).execAsync()
		}).then (function(results){
			if (!results.resetpassword){
				res.redirect('/user/login');
			} else {
				resetUser = results.user;
				results.user.local.password = resetUser.generateHash(newPassword);
				results.user.reset.resetToken = undefined,
				results.user.reset.resetTokenExpiration = undefined
				results.user.saveAsync()

				req.flash('loginMessage', req.t("auth:reset.new_password_updated_msg"));
				res.redirect('/user/login');
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},



	getProfile: function(req, res, next) {
		BluebirdPromise.props({
			ssoauth: Plugins.find({'category' : 'sso', 'status':true}).execAsync(),
			playerinfo: PlayersData.findOne({'player_steam_id' : req.user.steam.id}).execAsync()
		}).then (function(results){
			var translation = req.t("pagetitles:pageTitle.my_profile");
			res.render('auth/profile.pug', {title: translation, results: results, csrfToken: req.csrfToken()});
		}).catch (function(err){
			console.log(err);
			res.redirect('/user/profile');
		});
	},

	updateVisuals: function(req, res, next) {
		BluebirdPromise.props({
			playerinfo: PlayersData.findOne({'player_steam_id' : req.user.steam.id}).execAsync(),
			user: User.findOne({'steam.id' : req.user.steam.id}).execAsync()
		}).then (function(results){
			if (results.user){
				if (results.playerinfo){

					results.playerinfo.player_fov = req.body.fov,
					results.playerinfo.player_fps = req.body.fps,
					results.playerinfo.player_promod = req.body.promod,
					results.playerinfo.player_icon = req.body.icon
					results.playerinfo.saveAsync()

					req.flash('success_messages', 'Visual Settings succesfully edited');
					res.redirect('back');
				} else {
					req.flash('error_messages', 'No player with this Steam ID found, make sure that you visit our game server(s) with runing Steam Client');
					res.redirect('back');
				}
				
			} else {
				req.flash('error_messages', 'No player with this Steam ID found, make sure that you visit our game server(s) with runing Steam Client');
				res.redirect('back');
			}
			
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
