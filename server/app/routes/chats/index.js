'use strict';
var router = require('express').Router();
var bodyParser = require('body-parser');
//var Chat = Promise.promisifyAll(mongoose.model('Chat'));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

var mongoose = require('mongoose');

var Chat = mongoose.model('Chat');
var Promise = require('bluebird');





router.get('/', function(req, res) {
	Chat.find({}).then(function(text) {
		res.send(text);
	})
})

router.get('/recent', function(req, res) {
	Chat.find({})
	.sort({date: -1})
	.limit(5)
	.then(function(text) {
		console.log('sorted texts', text)
		res.send(text);
	})
})

router.delete('/clear', function(req, res) {
	Chat.remove({}).then(function() {
		console.log('Database Cleared')
		res.send('Cleared');
	})
})

router.post("/", function(req, res) {
	console.log("Request body:",req.body)
	var addText = new Chat({
		content: req.body.content,
		username: req.body.username,
		date: Date.now()
	})

	addText.save(function(err, createdText) {
		if(err) {
			console.log('error saving');
			res.send(500)
			return
		}
		else {
			console.log('Text saved:', createdText);
			res.send(createdText)
		}
	})
	// console.log('post body', req.body);
	// Chat.create(req.body)
	// .then(newChat => res.json(newChat))
	// .catch(next);
});



module.exports = router;