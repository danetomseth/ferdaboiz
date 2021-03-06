'use strict';
let router = require('express').Router();
let path = require('path');
let busboy = require('connect-busboy'); //middleware for form/file upload
let mongoose = require('mongoose');
let Photo = mongoose.model('Photo');
let Album = mongoose.model('Album');
let Promise = require("bluebird");


// Upload Dependencies
let uniqueFilename = require('unique-filename');
let AWS = require('aws-sdk');
let sKey = require(path.join(__dirname, '../../../env')).AKID;
let staticS3Path = require(path.join(__dirname, '../../../env')).S3PATH
let im = require('imagemagick');
let s3Path = 'https://s3-us-west-2.amazonaws.com/ztf/';

router.use(busboy());


AWS.config.setPromisesDependency(require('bluebird'));


let s3 = new AWS.S3({
    params: {
        Bucket: 'ztf'
    }
});







let bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));


router.post('/createAlbum', function(req, res, next) {

});


router.get('/listAlbums', function(req, res, next) {

});


router.param('photoId', function (req, res, next, id) {
    console.log("finding photo");
  Photo.findById(id)
  .then(function (photo) {
    if (!photo) {
      var err = new Error('No such photo');
      err.status = 404;
      throw err;
    }
    req.photo = photo;
  })
  .then(next, next);
});


router.get('/viewAlbum/:albumName', function(req, res, next) {
    var albumPhotosKey = encodeURIComponent(req.params.albumName) + '//';
    s3.listObjects({
        Prefix: albumPhotosKey
    }, function(err, data) {
        if (err) {
            console.log("error retriving album");
            return next(err);
        }
        // `this` references the AWS.Response instance that represents the response
        var href = this.request.httpRequest.endpoint.href;
        var bucketUrl = href + albumBucketName + '/';

        var photos = data.Contents.map(function(photo) {
            var photoKey = photo.Key;
            var photoUrl = bucketUrl + encodeURIComponent(photoKey);
            let photoItem = {
                key: photoKey,
                url: photoUrl
            }
            return photoItem;
            // '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
            // '<span ng-click="deletePhoto(\'' + albumName + "','" + photoKey + '\')">',
            // photoKey.replace(albumPhotosKey, ''),
        });
        res.send(photos);
    });
});



router.post('/photo/:albumId', function(req, res, next) {
    req.pipe(req.busboy);
    let title = '';
    let albumId;
    let newPhoto = {}
    if (req.params.albumId !== 'none') {
        albumId = req.params.albumId;
        newPhoto.album = albumId
    } else {
        albumId = false;
    }
    let length;
    req.busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        if (fieldname === 'qqfilename') {
            title = val;
        }
    });
    req.busboy.on('file', function(fieldname, file, fileName, encoding, mimetype) {
        let filename = uniqueFilename('upload-img') + '.jpg';
        filename = filename.replace(/\//g, '-');
        if (albumId) {
            console.log("detected album", albumId);
            filename = albumId + '/' + filename;
        }

        let params = {
            Key: filename,
            Bucket: 'ztf',
            ContentType: 'image/jpeg',
            Body: file
        };
        s3.upload(params, function(err, data) {
            if (err) {
                console.log("Error uploading data: ", err);
                next(err);
            } else {
                newPhoto.src = s3Path + filename;
                newPhoto.title = title;
                console.log("uploaded to aws");
                Photo.create(newPhoto)
                    .then(photo => {
                        console.log("success saving to DB", photo.src);
                        res.json({
                            "success": true
                        });
                        res.end();
                    }).catch(err => {
                        console.log("caught error", err);
                        next(err)
                    });
            }
        });

    });
})




module.exports = router;