const mongoose = require('mongoose');
mongoose.BluebirdPromise = require('bluebird');
const config = require('../config/config');
var dbURI = "mongodb://" + 
			encodeURIComponent(config.db.username) + ":" + 
			encodeURIComponent(config.db.password) + "@" + 
			config.db.host + ":" + 
			config.db.port + "/" + 
			config.db.name;
mongoose.connect(dbURI, {useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

// Throw an error if the connection fails
mongoose.connection.on('error', function(err) {
	if(err){
		console.log('Your mongoDB Username, Password is wrong in file app/config/config.json . Could not connect to database! '+err);
	};
});

const Appversion = require("../models/app_version");

// ######################## App version ########################################### //

var appversions = [
	new Appversion({
		name:'CoD4x-WebaAdmin',
		local_version:'v1.0.0',
		github_version:'v1.0.0',
		local_cod4x_version:'v1.0.0',
		github_cod4x_version:'v1.0.0'
	})
];

var done = 0;

for (var i = 0; i < appversions.length; i++){
	appversions[i].save(function (err, result){
		done++;
		if(done === appversions.length){
			exit();
		}
	});
}


function exit(){
	mongoose.connection.close();
	console.log('Database succesfully populated with Default data')
}