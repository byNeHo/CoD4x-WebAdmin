
const express = require('express');
const mongoose = require('mongoose');
const csrf = require('csurf');
const { check } = require("express-validator");
const Token = require('../models/token');
const auth = require('./authentication');
const async = require('async');
const crypto = require('crypto');
const User = require('../models/user');
const user = require( '../controllers/user/home' );
const formatNum = require('format-num');
const BluebirdPromise = require('bluebird');
const fs = require('fs');
const multiparty = require('multiparty');
const Recaptcha = require('express-recaptcha').RecaptchaV2;
const config = require('../config/config');
const validate = require("../middleware/validator");
const moment = require('moment');

module.exports = function(router, passport){
	const csrfProtection = csrf();
	router.use(csrfProtection);
	router.use(getLanguageForMoment);
	router.post('/edit/update/screenshotnotification', isLoggedIn, user.ScreenshotNotificationUpdate);
	router.post('/edit/ingame-visuals', isLoggedIn, user.updateVisuals);
	router.post('/upload', isLoggedIn, user.uploadAvatar);
	router.get('/delete-avatar', isLoggedIn, user.RemoveAvatar);
	router.get('/login', notLoggedIn, user.getLogin);
	router.get('/signup', notLoggedIn, validate.NewSignUp, user.getSignup);
	router.get('/profile', isLoggedIn, user.getProfile);
	router.get('/logout', isLoggedIn, user.getLogout);
	router.get('/reset-password', notLoggedIn, user.getResetPassword);
	router.post('/reset-password', notLoggedIn, user.ResetPasswordUpdate);
	router.get('/update-password/:token', notLoggedIn, user.getNewPassword);
	router.post('/update-password', notLoggedIn, validate.NewPasswordUpdate, user.NewPasswordUpdate);
	// facebook -------------------------------
	// send to facebook to do the authentication
	router.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));
	// handle the callback after facebook has authenticated the user
	router.get('/auth/facebook/callback',
		passport.authenticate('facebook', {
			successRedirect : '/user/profile',
				failureRedirect : '/'
			})
		);
	// twitter --------------------------------
	// send to twitter to do the authentication
	router.get('/auth/twitter', passport.authenticate('twitter', { scope : 'email' }));
	// handle the callback after twitter has authenticated the user
	router.get('/auth/twitter/callback',
		passport.authenticate('twitter', {
			successRedirect : '/user/profile',
			failureRedirect : '/'
		})
	);
	// google ---------------------------------
	// send to google to do the authentication
	router.get('/auth/google', passport.authenticate('google', { scope : ['profile', 'email'] }));
	// the callback after google has authenticated the user
	router.get('/auth/google/callback',
		passport.authenticate('google', {
			successRedirect : '/user/profile',
			failureRedirect : '/'
		})
	);
	// steam ---------------------------------
	// send to steam to do the authentication
	router.get('/auth/steam', passport.authenticate('steam',
		function(req, res) {
			// The request will be redirected to Steam for authentication, so 
			// this function will not be called. 
		})
	);
	// the callback after steam has authenticated the user
	router.get('/auth/steam/return',
		passport.authenticate('steam', { failureRedirect: '/' }),
		function(req, res) {
			// Successful authentication, redirect to profile page. 
			res.redirect('/user/profile');
		}
	);
	// =============================================================================
	// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
	// =============================================================================
	// locally --------------------------------
	router.get('/connect/local', isLoggedIn, function(req, res) {
		res.render('auth/connect-local.pug', { title:'Connect Local', message: req.flash('loginMessage'), csrfToken: req.csrfToken() });
	});
	router.post('/connect/local', passport.authenticate('local-signup', {
		successRedirect : '/user/profile', // redirect to the secure profile section
		failureRedirect : '/connect/local', // redirect back to the signup page if there is an error
		failureFlash : true // allow flash messages
	}));
	// facebook -------------------------------
	// send to facebook to do the authentication
	router.get('/connect/facebook', passport.authorize('facebook', { scope : 'email' }));
	// handle the callback after facebook has authorized the user
	router.get('/connect/facebook/callback',
		passport.authorize('facebook', {
			successRedirect : '/user/profile',
			failureRedirect : '/'
		}));
	// twitter --------------------------------
	// send to twitter to do the authentication
	router.get('/connect/twitter', passport.authorize('twitter', { scope : 'email' }));
	// handle the callback after twitter has authorized the user
	router.get('/connect/twitter/callback',
		passport.authorize('twitter', {
			successRedirect : '/user/profile',
			failureRedirect : '/'
		}));
	// google ---------------------------------
	// send to google to do the authentication
	router.get('/connect/google', passport.authorize('google', { scope : ['profile', 'email'] }));
	// the callback after google has authorized the user
	router.get('/user/connect/google/callback',
		passport.authorize('google', {
			successRedirect : '/user/profile',
			failureRedirect : '/'
		}));
	// steam ---------------------------------
	// send to google to do the authentication
	router.get('/connect/steam', passport.authorize('steam', { scope : ['profile'] }));
	// the callback after google has authorized the user
	router.get('/user/connect/steam/return',
		passport.authorize('steam', {
			successRedirect : '/user/profile',
			failureRedirect : '/'
		}
	));
	// =============================================================================
	// UNLINK ACCOUNTS =============================================================
	// =============================================================================
	// used to unlink accounts. for social accounts, just remove the token
	// for local account, remove email and password
	// user account will stay active in case they want to reconnect in the future
	// local -----------------------------------
	router.get('/unlink/local', isLoggedIn, function(req, res) {
		var user = req.user;
		user.local.email    = undefined;
		user.local.username = undefined;
		user.local.password = undefined;
		user.save(function(err) {
			res.redirect('/user/profile');
		});
	});
	// facebook -------------------------------
	router.get('/unlink/facebook', isLoggedIn, function(req, res) {
		var user            = req.user;
		user.facebook.token = undefined;
		user.save(function(err) {
			res.redirect('/user/profile');
		});
	});
	// twitter --------------------------------
	router.get('/unlink/twitter', isLoggedIn, function(req, res) {
		var user = req.user;
		user.twitter.token = undefined;
		user.save(function(err) {
			res.redirect('/user/profile');
		});
	});
	// google ---------------------------------
	router.get('/unlink/google', isLoggedIn, function(req, res) {
		var user = req.user;
		user.google.token = undefined;
		user.save(function(err) {
			res.redirect('/user/profile');
		});
	});
	// steam ---------------------------------
	router.get('/unlink/steam', isLoggedIn, function(req, res) {
		var user = req.user;
		//Server Admins can not Unlink Steam
		if (user.local.user_role > 1){
			req.flash('error_messages', "Server Admins Can Not Unlink Steam, ask any Admin with Power 100 to remove you as Admin before you Unlink your Steam Account");
			res.redirect('back');
		} else {
			user.steam.id = undefined;
			user.save(function(err) {
				res.redirect('/user/profile');
			});
		}
	});
	// process the login form
	router.post('/login', passport.authenticate('local-login', {
		successReturnToOrRedirect : '/user/profile', // redirect to the secure profile section
		failureRedirect : '/user/login', // redirect back to the signup page if there is an error
		failureMessage : true // allow flash messages
		}),auth.issueCookie,
			function(req, res) {
			res.redirect('/');
	});
	// process the signup form
	router.post('/signup', captchaVerification, passport.authenticate('local-signup', {
			successRedirect : '/user/profile',
			failureRedirect : '/user/signup',
			failureFlash : true
		}
	));
};

function captchaVerification(req, res, next) {
	var options = {'hl':req.language};
	var recaptcha = new Recaptcha(config.g_recaptcha.SITE_KEY, config.g_recaptcha.SECRET_KEY, options);
	recaptcha.verify(req, function(error, data){
        if(!error){
            return next();
        }else{
            res.redirect('back');
        }
    });
}

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	else
		res.redirect('/');
	
}

/*RESTRICT ACCESS BY USER POWER*/
function requireRole(role) {
	return function(req, res, next) {
		if(req.user && req.user.local.user_role === role)
			next();
		else
			res.redirect('/user/profile');
	}
}

// route middleware to ensure user is logged in
function notLoggedIn(req, res, next) {
	if (!req.isAuthenticated())
		return next();
	res.redirect('/user/logout');
}

// set the moment Language
function getLanguageForMoment(req, res, next) {
	moment.locale(req.language);
	return next();
}
