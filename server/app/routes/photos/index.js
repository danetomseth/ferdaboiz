'use strict';
var router = require('express').Router();
let path = require('path');
let busboy = require('connect-busboy'); //middleware for form/file upload
let mongoose = require('mongoose');
let AWS = require('aws-sdk');



let bodyParser = require('body-parser');

let staticS3Path = require(path.join(__dirname, '../../../env')).S3PATH

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));


let s3 = new AWS.S3({
    params: {
        Bucket: 'ztf'
    }
});



let Photo = mongoose.model('Photo');
let Album = mongoose.model('Album');


router.param('photoId', function (req, res, next, id) {
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


router.get('/randomize', (req, res, next) => {
    console.log("finding random");
    Photo.findRandom().exec(function(err, photos) {
        if(err) {
            console.log('err fetching random photos', err);
            next(err)
        }
        else {
            console.log("photos: ", photos);
            res.send(photos)
        }
    })
});


router.get('/allPhotos', (req, res, next) => {
    Photo.find({})
        .then((photos) => {
            res.send(photos);
        })
});


router.get('/:photoId', (req, res, next) => {
    res.json(req.photo);
});


router.get('/random/:limit', (req, res, next) => {
    let limit = Number(req.params.limit);
    Photo.findRandom().limit(limit).exec(function(err, photos) {
        if(err) {
            console.log('err fetching random photos', err);
            next(err)
        }
        else {
            res.send(photos)
        }
    })
});




router.get('/limit10', (req, res, next) => {
    Photo.find({})
        .limit(10)
        .then((photos) => {
            res.send(photos);
        })
});

router.get('/:album', (req, res, next) => {
    Photo.find({album: req.params.album})
        .then((photos) => {
            console.log(photos);
            res.send(photos);
        })
});


router.put('/updateAll', (req, res, next) => {
    Photo.find({})
    .then(photos => {
        photos.forEach(function(photo) {
            photo.updatePhoto().then(photo => {
                console.log("Updated!!!");
            })
        })
    })
})


router.post('/update', (req, res, next) => {
    let query = {
        "_id": req.body._id
    };
    let update = req.body;
    let options = {
        new: true
    };
    Photo.findOneAndUpdate(query, update, options, function(err, photo) {
        if (err) {
            console.log('got an error');
            next(err);
        }
        res.sendStatus(200);
    });
});



router.delete('/singlePhoto/:photoId', function (req, res, next) {
  let photoKey = req.photo.src.replace("https://s3-us-west-2.amazonaws.com/ztf/", '');
  req.photo.remove()
  .then(function () {
    s3.deleteObject({
            Key: photoKey
        }, function(err, data) {
            if (err) {
                console.log("error deleting photo");
                return next(err);
            }
            console.log("success deleting");
            res.status(204).end();
        });
  })
  .then(null, next);
});





module.exports = router;