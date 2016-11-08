'use strict';
var mongoose = require('mongoose');
var random = require('mongoose-random');
mongoose.Promise = require('bluebird');


let Album = mongoose.model('Album');

var _ = require('lodash');

var schema = new mongoose.Schema({
    title: {
        type: String
    },
    src: {
        type: String
    },
    thumbSrc: {
        type: String
    },
    author: {
        type: String
    },
    album: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Album'
    },
    tags: {
        type: Array,
        default: ['none']
    },
    height: {
        type: Number,
        default: 200
    },
    date: {
    	type: Date, 
    	default: Date.now
    },
    updated: {
        type: Boolean,
        default: false
    }
});

schema.plugin(random, { path: 'r' }); // by default `path` is `random`. It's used internally to store a random value on each doc. 





// schema.pre('save', function (next) {
//     if(this.album) {
//         Album.findById(this.album).then(album => {
//             return album.addPhoto(this._id)
//         }).then(album => {
//             console.log("added photo to album: ", album);
//             next()
//         })
//     }
//     else {
//         console.log("no album");
//         next();
//     }
// })


schema.method('updatePhoto', function () {
    console.log("in method");
    this.updated = true;
    return this.save();
});


// schema.method('createThumbnail', function (photoId) {
//     console.log("in method", photoId);
//     this.photos.push(photoId)
//     return this.save();
// });


// personSchema.virtual('name.full').get(function () {
//   return this.name.first + ' ' + this.name.last;
// });


// schema.statics.upload = function search (photo) {
//   return this.where('name', new RegExp(name, 'i')).exec(cb);
// }


mongoose.model('Photo', schema);