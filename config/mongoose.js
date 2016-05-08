
// Invoke 'strict' JavaScript mode
'use strict';

// Load the module dependencies
var	config = require('./config'),
	mongoose = require('mongoose');

// Define the Mongoose configuration method
module.exports = function() {
	// Use Mongoose to connect to MongoDB
	var db = mongoose.connect(config.db);
	var conn = mongoose.connection;

	conn.on('error', function(error) {
		console.log(error);
	});

	// Load the application models
	require('../models/summoner.model');
	
	// Return the Mongoose connection instance
	return db;
}