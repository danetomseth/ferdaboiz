"use strict";
var path = require('path');
var express = require('express');
var favicon = require('serve-favicon');

module.exports = function (app) {

    var root = app.getValue('projectRoot');

    var npmPath = path.join(root, './node_modules');
    var bowerPath = path.join(root, './bower_components');
    var publicPath = path.join(root, './public');
    var browserPath = path.join(root, './browser');
    var filesPath = path.join(root, './files');
    var templatePath = path.join(root, './browser/templates');

    app.use(favicon(app.getValue('faviconPath')));
    app.use(express.static(npmPath));
    app.use(express.static(bowerPath));
    app.use(express.static(publicPath));
    app.use(express.static(filesPath));
    app.use(express.static(browserPath));
    app.use(express.static(templatePath));

};
