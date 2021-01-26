// Require needed modules
const mongoose = require('mongoose');
const moment = require('moment');
const Color = require("../../models/colors");
const Theme = require("../../config/config.json");
const BluebirdPromise = require('bluebird');
const fs = require('fs');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getSkin: function(req, res, next) {
        Color.find({}).sort({name: 'asc'}).execAsync()
		.then (function(results){
    		res.render('admin/skin/index.pug', {title: 'Website Skin', results: results, csrfToken: req.csrfToken()});
  		}).catch(function(err) {
  			console.log(err);
  			res.redirect('back');
  		});
	},

	UpdateSkin: function(req, res, next) {
		Color.find({}).sort({name: 'asc'}).execAsync()
		.then (function(result){
            let content = JSON.parse(fs.readFileSync('./app/config/config.json', 'utf8'));
            content.skin.theme = req.body.theme;
            content.skin.header = req.body.header;
            fs.writeFile("./app/config/config.json", JSON.stringify(content, null, 2), function writeJSON(err) {
                if (err) return console.log(err);
            });
		}).then(function(success) {
			req.flash('success_messages', 'Skin successfully edited, restart your application to take effect');
			res.redirect('back');
		}).catch(function(err) {
			console.log("There was an error: " +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('back');
		});
	}
};


function jsonReader(filePath, cb) {
    fs.readFile(filePath, (err, fileData) => {
        if (err) {
            return cb && cb(err)
        }
        try {
            const object = JSON.parse(fileData)
            return cb && cb(null, object)
        } catch(err) {
            return cb && cb(err)
        }
    })
}