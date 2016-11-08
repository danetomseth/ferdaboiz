'use strict';
var mongoose = require('mongoose');
var _ = require('lodash');

var schema = new mongoose.Schema({
    content: {
        type: String
    },
    username: {
    	type: String
    },
    date: {
    	type: Date, 
    	default: Date.now
    }
});



mongoose.model('Chat', schema);