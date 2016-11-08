'use strict';
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    username: {
        type: String
    },
    email: {
        type: String
    },
    chatArr: {
        type: Array
    }
});

// method to remove sensitive information from user objects before sending them out





mongoose.model('OnlineUsers', schema);