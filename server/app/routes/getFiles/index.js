'use strict';
var router = require('express').Router();
var path = require('path');
var busboy = require('connect-busboy'); //middleware for form/file upload
var mongoose = require('mongoose');
var filesystem = require("fs");
var rootPath = path.join(__dirname, '../../../../');


var im = require('imagemagick');




var bodyParser = require('body-parser');
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({
    extended: true
}));




var getFiles = function(dir) {

    
    var results = [];

    filesystem.readdirSync(dir).forEach(function(file) {

        file = dir+'/'+file;
        var stat = filesystem.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(getFiles(file))
        } else results.push(file);

    });

    return results;

};




router.get('/albumA', (req, res, next) => {
    let filenames = getFiles(rootPath + '/photos/albumA');
    res.send(filenames);
});



module.exports = router;