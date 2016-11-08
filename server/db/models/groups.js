'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');

var schema = new mongoose.Schema({
	title: {
		type: String,
		required: true
	},
	album: [{
		type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
	}],
	users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
	private: {
		type: Boolean,
		default: false
	}
});


mongoose.model('Group', schema);