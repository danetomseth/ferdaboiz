'use strict';
var router = require('express').Router();
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var deepPopulate = require('mongoose-deep-populate')(mongoose);
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));

var User = mongoose.model('User');


router.post('/', (req, res, next) => {
	User.create(req.body)
	.then((user, err) => {
		if(err) {
			console.log("Error creating user");
			next(err);
		}
		else {
			console.log("user", user);
			res.send(user);
		}
	})
});

router.post('/album', (req, res, next) => {
	console.log("body", req.body);
	User.findById(req.body.userId)
    .then(user => {
    	user.albums.push(req.body.albumId);
        console.log('User albums', user.albums);
        return user.save();
    })
    .then(user => {
    	console.log('saved user', user.albums);
    	res.sendStatus(200);
    })
});

router.post('/update', (req, res, next) => {
    var query = {
        "_id": req.body._id
    };
    var update = req.body;
    var options = {
        new: true
    };
    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            console.log('got an error');
            next(err);
        }
        res.sendStatus(200);
    });
});



router.get('/:username', (req, res, next) => {
	User.findOne({
		username: req.params.username
	})
	.deepPopulate('photos albums albums.cover favorites groups')
	.then((user, err) => {
		if(err) {
			console.log('err', err);
			next(err);
		}
		else {
			console.log('success', user);
			res.send(user);
		}
	})
});










module.exports = router;