// Require needed modules
const mongoose = require('mongoose');
const fs  = require('fs');
const multiparty = require('multiparty');
const path = require('path');
const Jimp = require("jimp");
const S = require('underscore.string');
const replaceString = require('replace-string');
const Maps = require("../../models/maps");
const BluebirdPromise = require('bluebird');


//Set dates for testing
var start = new Date();
start.setHours(0,0,0,0);

var end = new Date();
end.setHours(23,59,59,999);

module.exports = {

	getMaps: function(req, res, next) {
		Maps.find({}).sort({name: 'asc'}).execAsync()
		.then (function(results){
			res.render('admin/maps/index.pug', {title: 'CoD4 Maps', results: results, csrfToken: req.csrfToken()});
		}).catch(function(err) {
			console.log(err);
			res.redirect('/user/profile');
		});
	},
	InsertNewMaps: function(req, res, next) {
		var newMaps = new Maps ({
			map_name: req.body.name,
			display_map_name: finalMapName(req.body.name)
		});
		newMaps.saveAsync()
		.then(function(saved) {
			req.flash('success_messages', 'Map successfully uploaded');
			res.redirect('/admin/maps');		
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/user/profile');
		});
	},

	MapsRemove: function(req, res, next) {
		Maps.findOne({'_id': req.params.id}).execAsync()
		.then (function(result){
			var filePath = './public/img/maps/'+result.map_name+'.jpg';
			fs.unlink(filePath, function(err) {
				if (err) {
					console.log("failed to delete local image:"+err);
				} else {
					Maps.deleteOne({'_id': req.params.id}).exec();
					req.flash('success_messages', 'Map successfully deleted');
					res.redirect('/admin/maps');
				}
			});
		}).catch(function(err) {
			console.log("There was an error" +err);
			req.flash('error_messages', 'There was an error, please try again or Contact the script Owner');
			res.redirect('/admin/maps');
		});
	},
	uploadMapImages: function(req, res, next) {
		var form = new multiparty.Form();
		form.parse(req, function(err,fields, files){
		var i = 0;
		var img = files.file[0];
		var uploadDir = __dirname + '/../../../public/img/maps';
		var uploadUrl = './public/img/maps/';
		var dbuploadUrl = '/img/maps/';

		if (!fs.existsSync(uploadDir)){
			fs.mkdirSync(uploadDir);
		}

		fs.readFile(img.path, function(err, data){
			var originalfile = img.originalFilename.split('.');
			var file_extension = originalfile[1];
			var file_name = originalfile[i++];
			var path = uploadDir+img.originalFilename;

			fs.writeFile(path, data, function(error){
				if(error) console.log(error);
			});
			var img_name = originalfile;
			fs.rename(path, path, function(error) {
				if(error) console.log("We have an error "+error);
					if ((file_extension == 'jpg')) {
						Jimp.read(path).then(function (image) {
							// do stuff with the image
							image.resize(320, Jimp.AUTO)
							.write('./public/img/maps/'+ img.originalFilename, function (error) {
								if(error){
									console.log(error);
								}else{
									var newMaps = new Maps ({
									map_name: file_name,
									display_map_name: finalMapName(file_name)
									});
									newMaps.saveAsync()
									res.redirect('back');
								}
							});
						}).catch(function (err) {
							console.log(err);
						});
					}
				});
			});
		});
	},
};

function finalMapName(string) {
	var starter = string.slice(3);
	var lowercase = replaceString(starter, "_", " ");
	var newstring = S.titleize(lowercase);
	return newstring;
};



function uncolorize(string){
	string = replaceString(string, '^0', '');
	string = replaceString(string, '^1', '');
	string = replaceString(string, '^2', '');
	string = replaceString(string, '^3', '');
	string = replaceString(string, '^4', '');
	string = replaceString(string, '^5', '');
	string = replaceString(string, '^6', '');
	string = replaceString(string, '^7', '');
	string = replaceString(string, '^8', '');
	string = replaceString(string, '^9', '');
	return string
}
