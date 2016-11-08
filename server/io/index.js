'use strict';

var socketio = require('socket.io');
var io = null;

module.exports = function(server) {

    if (io) return io;

    io = socketio(server);

    io.on('connection', function(client) {

        client.on('join', function () {
            console.log('client joining room', client);
        })
        
        client.on('emitChat', function(content) {
            console.log('emit recieved', content);
            client.broadcast.emit('serverChat', content);
        })
      
        client.on('disconnect', function() {
            client.broadcast.emit('clientEnd');
            console.log(client.id + ' disconnected')
            console.log(':(');
        });
    });


    return io;

};