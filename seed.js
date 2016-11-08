/*

This seed file is only a placeholder. It should be expanded and altered
to fit the development of your application.

It uses the same file the server uses to establish
the database connection:
--- server/db/index.js

The name of the database used is set in your environment files:
--- server/env/*

This seed file has a safety check to see if you already have users
in the database. If you are developing multiple applications with the
fsg scaffolding, keep in mind that fsg always uses the same database
name in the environment files.

*/

var mongoose = require('mongoose');
var Promise = require('bluebird');
var chalk = require('chalk');
var connectToDb = require('./server/db');
var User = Promise.promisifyAll(mongoose.model('User'));
var Chat = Promise.promisifyAll(mongoose.model('Chat'));

var seedUsers = function () {

    var users = [
        {
            email: 'riley@utah.com',
            password: 'nighthawk',
            username: 'NightHawk',
        },
        {
            email: 'lucas@utah.com',
            password: 'assassinactual',
            username: 'Assassin Actual'
        },
        {
            email: 'dane@utah.com',
            password: 'password',
            username: 'Dane'
        },
        {
            email: 'allie@nyc.com',
            password: 'yoga',
            username: 'allie'
        },
        {
            email: 'test@gmail.com',
            password: 'password',
            username: 'Guest User'
        },
        

    ];

    return User.createAsync(users);

};

var seedChats = function() {
    console.log('chats');
    var chats = [
        
    ];
    return Chat.createAsync(chats);
}

connectToDb.then(function() {

    return seedChats();
})

connectToDb.then(function () {
    User.findAsync({}).then(function (users) {
        if (users.length === 0) {
            return seedUsers();
        } else {
            return seedChats();
            console.log(chalk.magenta('Seems to already be user data, exiting!'));
            process.kill(0);
        }
    }).then(function () {
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    }).catch(function (err) {
        console.error(err);
        process.kill(1);
    });
});
