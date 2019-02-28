const mongoose = require('mongoose');
const BluebirdPromise = require('bluebird');
const Adminapplications = require("../../models/admin_applications");
const AdminConversation = require("../../models/admin_conversation");
const AdminConversationComment= require("../../models/admin_conversation_comments");
const Bans = require("../../models/bans");

module.exports = {

	getConversationsDetails: function(req, res, next) {
		var populateConversations = [{path:'sender_id', select:'local.user_name local.avatar_60 id'}, {path:'app_id', select:'age adminappmessage createdAt'}];
		var populateConversationsComments = [{path:'sender_id', select:'local.user_name local.avatar_60 id'}];
		BluebirdPromise.props({
			adminconversations: AdminConversation.findOne({'_id':req.params.id}).sort({ 'createdAt': -1}).populate(populateConversations).execAsync(),
			adminconversationscomments: AdminConversationComment.find({'conversation_id':req.params.id}).sort({ 'createdAt': 1}).populate(populateConversationsComments).execAsync(),
		}).then (function(results){
			if (req.user.local.user_role < 2){
				req.flash('error_messages', 'Only Admins can Visit this page!');
				res.redirect('back');
			}else {
				Bans.countDocuments({'cheater_reporter_id':results.adminconversations.sender_id._id}, function( err, reports ) {
					if (err){
						console.log(error);
					}else{
						res.render('frontpage/admin_conversations/details.pug', {title: 'Admin Conversation num: #'+results.adminconversations.id, results:results, reports: reports, csrfToken: req.csrfToken()});
					}
				});
			}
		}).catch (function(err){
			console.log(err);
			res.redirect('back');
		});
	},

	InsertNewConversationsComment: function(req, res, next) {
		var newAdminConversationComment = new AdminConversationComment ({
			sender_id: req.user._id,
			conversation_id: req.body.conversation_id,
			app_id: req.body.app_id,
			app_sender_id: req.body.app_sender_id,
			message: req.body.message
		});
		newAdminConversationComment.saveAsync()
		.then(function(saved) {
			req.flash('success_messages', 'Comment Successfully Sent! Thank you for your Help!');
			res.redirect('back');
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('back');
		});
	},

};
