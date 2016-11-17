app.factory('AwsFactory', function($http) {
    let service = {};


    //    function getHtml(template) {
    // 	return template.join('\n');
    // }

    service.albums = [];
    var albumBucketName = 'ztf';
    var bucketRegion = 'us-west-2';
    var IdentityPoolId = 'us-west-2:5619d880-d874-410b-9c0c-e3a2260f32aa';
    let s3;
    AWS.config.update({
        region: bucketRegion,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: IdentityPoolId
        })
    });

    s3 = new AWS.S3({
        apiVersion: '2006-03-01',
        params: {
            Bucket: albumBucketName
        }
    });

    service.updateCredentials = () => {
        AWS.config.update({
            region: bucketRegion,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: IdentityPoolId
            })
        });

        s3 = new AWS.S3({
            apiVersion: '2006-03-01',
            params: {
                Bucket: albumBucketName
            }
        });

        console.log(AWS.config);
    }

    function getHtml(template) {
        return template.join('\n');
    }

    service.listAlbumsPromise = () => {
        console.log("listing albums");
        let params = {
            Delimiter: '/'
        }

        let listPromise = s3.listObjects(params).promise()

        return listPromise;
    }

    service.listAlbums = () => {
        console.log("listing albums");
        let params = {
            Delimiter: '/'
        }

        s3.listObjects({
            Delimiter: '/'
        }, function(err, data) {
            if (err) {
                return alert('There was an error listing your albums: ' + err.message);
            } else {
                var albums = data.CommonPrefixes.map(function(commonPrefix) {
                    var prefix = commonPrefix.Prefix;
                    var albumName = decodeURIComponent(prefix.replace('/', ''));
                    return albumName;
                });
                var message = albums.length ?
                    getHtml([
                        '<p>Click on an album name to view it.</p>',
                        '<p>Click on the X to delete the album.</p>'
                    ]) :
                    '<p>You do not have any albums. Please Create album.';
                var htmlTemplate = [
                    '<h2>Albums</h2>',
                    message,
                    '<ul>',
                    getHtml(albums),
                    '</ul>',
                    '<button ng-click="createAlbum(prompt(\'Enter Album Name:\'))">',
                    'Create New Album',
                    '</button>'
                ]
                console.log('albums', albums);
                if (!albums.length) {
                    return false;
                } else {
                    service.albums = albums;
                    return albums;
                }
            }
        });
    }

    service.createAlbum = (albumName) => {
        albumName = albumName.trim();
        if (!albumName) {
            return alert('Album names must contain at least one non-space character.');
        }
        if (albumName.indexOf('/') !== -1) {
            return alert('Album names cannot contain slashes.');
        }
        var albumKey = encodeURIComponent(albumName) + '/';
        s3.headObject({
            Key: albumKey
        }, function(err, data) {
            if (!err) {
                return alert('Album already exists.');
            }
            if (err.code !== 'NotFound') {
                return alert('There was an error creating your album: ' + err.message);
            }
            s3.putObject({
                Key: albumKey
            }, function(err, data) {
                if (err) {
                    return alert('There was an error creating your album: ' + err.message);
                }
                alert('Successfully created album.');
                service.viewAlbum(albumName);
            });
        });
    }

    service.viewAlbum = (albumName) => {
        var albumPhotosKey = encodeURIComponent(albumName) + '//';
        s3.listObjects({
            Prefix: albumPhotosKey
        }, function(err, data) {
            if (err) {
                return alert('There was an error viewing your album: ' + err.message);
            }
            // `this` references the AWS.Response instance that represents the response
            var href = this.request.httpRequest.endpoint.href;
            var bucketUrl = href + albumBucketName + '/';

            var photos = data.Contents.map(function(photo) {
                var photoKey = photo.Key;
                var photoUrl = bucketUrl + encodeURIComponent(photoKey);
                return getHtml([
                    '<span>',
                    '<div>',
                    '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>',
                    '</div>',
                    '<div>',
                    '<span ng-click="deletePhoto(\'' + albumName + "','" + photoKey + '\')">',
                    'X',
                    '</span>',
                    '<span>',
                    photoKey.replace(albumPhotosKey, ''),
                    '</span>',
                    '</div>',
                    '<span>',
                ]);
            });
            var message = photos.length ?
                '<p>Click on the X to delete the photo</p>' :
                '<p>You do not have any photos in this album. Please add photos.</p>';
            var htmlTemplate = [
                '<h2>',
                'Album: ' + albumName,
                '</h2>',
                message,
                '<div>',
                getHtml(photos),
                '</div>',
                '<input id="photoupload" type="file" accept="image/*">',
                '<button id="addphoto" ng-click="addPhoto(\'' + albumName + '\')">',
                'Add Photo',
                '</button>',
                '<button ng-click="listAlbums()">',
                'Back To Albums',
                '</button>',
            ]
            document.getElementById('app').innerHTML = getHtml(htmlTemplate);
        });
    }

    service.addPhoto = (albumName) => {
    	console.log("adding to album", albumName);
        var files = document.getElementById('photoupload').files;
        if (!files.length) {
            return alert('Please choose a file to upload first.');
        }
        var file = files[0];
        var fileName = file.name;
        var albumPhotosKey = encodeURIComponent(albumName) + '//';

        var photoKey = albumPhotosKey + fileName;
        s3.upload({
            Key: photoKey,
            Body: file,
            ACL: 'public-read'
        }, function(err, data) {
            if (err) {
                return alert('There was an error uploading your photo: ', err.message);
            }
            alert('Successfully uploaded photo.');
            service.viewAlbum(albumName);
        });
    }

    service.deletePhoto = (albumName, photoKey) => {
        s3.deleteObject({
            Key: photoKey
        }, function(err, data) {
            if (err) {
                return alert('There was an error deleting your photo: ', err.message);
            }
            alert('Successfully deleted photo.');
            service.viewAlbum(albumName);
        });
    }

    service.deleteAlbum = (albumName) => {
        var albumKey = encodeURIComponent(albumName) + '/';
        s3.listObjects({
            Prefix: albumKey
        }, function(err, data) {
            if (err) {
                return alert('There was an error deleting your album: ', err.message);
            }
            var objects = data.Contents.map(function(object) {
                return {
                    Key: object.Key
                };
            });
            s3.deleteObjects({
                Delete: {
                    Objects: objects,
                    Quiet: true
                }
            }, function(err, data) {
                if (err) {
                    return alert('There was an error deleting your album: ', err.message);
                }
                alert('Successfully deleted album.');
                service.listAlbums();
            });
        });
    }





    return service;
});