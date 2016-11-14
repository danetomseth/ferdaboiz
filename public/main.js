'use strict';
window.app = angular.module('ZTF', ['fsaPreBuilt', 'bootstrapLightbox', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'angularFileUpload', 'ngMaterial', 'akoenig.deckgrid']);

app.config(function ($urlRouterProvider, $locationProvider, $mdThemingProvider) {
    // This turns off hashbang urls (/#about) and changes it to something normal (/about)
    $locationProvider.html5Mode(true);
    // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
    $urlRouterProvider.otherwise('/');
    var customPrimary = {
        '50': '#d8bf8c',
        '100': '#d1b579',
        '200': '#cbaa66',
        '300': '#c4a053',
        '400': '#bd9540',
        '500': '#aa863a',
        '600': '#977734',
        '700': '#84682d',
        '800': '#715927',
        '900': '#5e4a20',
        'A100': '#deca9f',
        'A200': '#e5d4b2',
        'A400': '#ebdfc5',
        'A700': '#4b3b1a'
    };

    $mdThemingProvider.theme('default').primaryPalette('blue').accentPalette('purple').warnPalette('yellow');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

    // The given state requires an authenticated user.
    var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
        return state.data && state.data.authenticate;
    };

    // $stateChangeStart is an event fired
    // whenever the process of changing a state begins.
    $rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

        if (!destinationStateRequiresAuth(toState)) {
            // The destination state does not require authentication
            // Short circuit with return.
            return;
        }

        if (AuthService.isAuthenticated()) {
            // The user is authenticated.
            // Short circuit with return.
            return;
        }

        // Cancel navigating to new state.
        event.preventDefault();

        AuthService.getLoggedInUser().then(function (user) {
            // If a user is retrieved, then renavigate to the destination
            // (the second time, AuthService.isAuthenticated() will work)
            // otherwise, if no user is logged in, go to "login" state.
            //$rootScope.loggedInUser = user;
            // if (user) {
            //     $state.go(toState.name, toParams);
            // } else {
            //     $state.go('login');
            // }
        });
    });
});

app.controller("AdminCtrl", function ($scope, $state, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.addingPictures = false;

    AlbumFactory.fetchAll().then(function (albums) {
        console.log('fetched', albums);
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    PhotosFactory.fetchTen().then(function (photos) {
        $scope.photos = photos;
    });

    $scope.deleteAlbum = function (album) {
        AlbumFactory.deleteAlbum(album._id);
        var albumIndex = $scope.albums.indexOf(album);
        $scope.albums.splice(albumIndex, 1);
    };

    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            $scope.albums.push(album);
            $scope.newAlbum = "";
        });
    };

    $scope.addPhotos = function (album) {
        $scope.selectingPictures = true;
        $scope.currentAlbum = album;
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(function (res) {
            $state.reload();
        });
    };

    $scope.uploadPhotos = function () {
        $state.go('uploadPhotos');
    };

    $scope.addToAlbum = function (photo) {
        $scope.currentAlbum.photos.push(photo._id);
    };
});
app.factory("AdminFactory", function ($http) {
    return {};
});
app.config(function ($stateProvider) {
    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/admin/admin.html',
        controller: 'AlbumCtrl',
        data: {
            authenticate: true
        }
    });
});
app.controller('AlbumCtrl', function ($scope, $timeout, $state, AdminFactory, AlbumFactory, PhotosFactory, DialogFactory) {
    $scope.addingPictures = false;

    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    PhotosFactory.fetchTen().then(function (photos) {
        $scope.photos = photos;
    });

    $scope.deleteAlbum = function (album) {
        AlbumFactory.deleteAlbum(album._id);
        var albumIndex = $scope.albums.indexOf(album);
        $scope.albums.splice(albumIndex, 1);
    };

    $scope.createAlbum = function () {
        var album = {
            title: $scope.newAlbum
        };
        AlbumFactory.createAlbum(album).then(function (album) {
            DialogFactory.display("Created");
        });
    };

    $scope.addPhotos = function (album) {
        $scope.selectingPictures = true;
        $scope.currentAlbum = album;
        PhotosFactory.fetchAll().then(function (photos) {
            $scope.photos = photos;
        });
    };

    $scope.viewAlbum = function (album) {};

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(function (res) {
            DialogFactory.display("Updated", 1500);
            $timeout(function () {
                $state.reload();
            }, 1000);
        });
    };

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.addToAlbum = function (photo) {
        $scope.currentAlbum.photos.push(photo._id);
        DialogFactory.display("Added", 1000);
    };
});

app.config(function ($stateProvider) {
    $stateProvider.state('singleAlbum', {
        url: '/Album/:albumId',
        templateUrl: 'js/album/single-album.html',
        controller: 'SingleAlbumCtrl',
        resolve: {
            album: function album(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchOne($stateParams.albumId);
            }
        }

    });
});

app.controller('AlbumsCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, DialogFactory) {
    AlbumFactory.fetchAll().then(function (albums) {
        $scope.albums = albums;
        $scope.albumOne = $scope.albums[0];
    });

    $scope.viewAlbum = function (album) {
        $state.go('singleAlbum', { albumId: album._id });
    };

    $scope.followAlbum = function (album) {
        UserFactory.followAlbum(album);
    };

    $scope.createAlbum = function () {
        $state.go('newAlbum');
        // let album = {
        //     title: $scope.newAlbum
        // }
        // AlbumFactory.createAlbum(album).then(album => {
        //     DialogFactory.display("Created");
        // })
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('albums', {
        url: '/albums',
        templateUrl: 'js/album/albums.html',
        controller: 'AlbumsCtrl'
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('editAlbum', {
        url: '/editAlbum/:albumId',
        templateUrl: 'js/album/edit-album.html',
        controller: 'EditAlbumCtrl',
        resolve: {
            album: function album(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchOne($stateParams.albumId);
            }
        }
    });
});

app.controller('EditAlbumCtrl', function ($scope, AlbumFactory, PhotosFactory, DialogFactory, album) {
    $scope.addingPictures = false;

    var setDate = function setDate() {
        album.date = new Date(album.date);
        $scope.album = album;
    };
    setDate();

    $scope.saveAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (res) {
            $scope.album = res;
            $scope.selectingPictures = false;
            DialogFactory.display('Saved', 1000);
        });
    };

    $scope.addPhotos = function () {
        console.log('adding');
        PhotosFactory.fetchAll().then(function (photos) {
            console.log('photos', photos);
            $scope.selectingPictures = true;
            $scope.photos = photos;
        });
    };

    $scope.addToAlbum = function (photo) {
        console.log("added", photo);
        $scope.album.photos.push(photo._id);
        AlbumFactory.addPhoto(album._id, photo._id);
    };
});
app.controller('NewAlbumCtrl', function ($scope, $state, AlbumFactory, PhotosFactory, Session, DialogFactory, AuthService) {
    console.log('Session', Session);
    $scope.showPhotos = false;

    $scope.createAlbum = function () {
        if (Session.user) {
            $scope.album.owner = Session.user._id;
        }
        console.log($scope.album);

        AlbumFactory.createAlbum($scope.album);
    };

    $scope.addToAlbum = function (photo) {
        DialogFactory.display('Added', 750);
        $scope.album.photos.push(photo);
        $scope.album.cover = photo;
    };

    $scope.saveAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (album) {
            $state.go('albums');
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('newAlbum', {
        url: '/newAlbum',
        templateUrl: 'js/album/new-album.html',
        controller: 'NewAlbumCtrl'
    });
});

app.controller('SingleAlbumCtrl', function ($scope, $timeout, $state, album, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.album = album;
    $scope.selectingCover = false;
    $scope.changesMade = false;
    $scope.removePhotos = false;

    console.log("photos: ", album.photos);
    $scope.photos = album.photos;
    $scope.removeFromAlbum = function (photo) {
        var photoIndex = $scope.album.photos.indexOf(photo);
        $scope.album.photos.splice(photoIndex, 1);
    };

    $scope.deletePhotos = function () {
        $scope.removePhotos = true;
    };

    $scope.selectCover = function () {
        $timeout(function () {
            $scope.selectingCover = true;
            $scope.changesMade = true;
        }, 500);
    };

    $scope.addCover = function (photo) {
        $scope.album.cover = photo._id;
        $scope.selectingCover = false;
    };

    $scope.updateAlbum = function () {
        AlbumFactory.updateAlbum($scope.album).then(function (res) {
            $state.go('admin');
        });
    };

    $scope.fetchPhotos = function () {
        console.log("album: ", album);
        AlbumFactory.fetchPhotosInAlbum(album._id).then(function (album) {
            console.log("returned: ", album);
        });
    };
});
app.controller('AwsCtrl', function ($scope, AwsFactory) {

    $scope.albums = AwsFactory.albums;

    $scope.listAlbums = function () {
        AwsFactory.listAlbumsPromise().then(function (data) {
            var albums = data.CommonPrefixes.map(function (commonPrefix) {
                var prefix = commonPrefix.Prefix;
                var albumName = decodeURIComponent(prefix.replace('/', ''));
                return albumName;
            });
            $scope.albums = albums;
            $scope.$digest();
        })['catch'](function (err) {
            console.log(err);
        });
        $scope.albumsFetched = true;
    };

    $scope.update = AwsFactory.updateCredentials;

    $scope.createAlbum = function (albumName) {
        console.log("creating album", albumName);
        AwsFactory.createAlbum(albumName);
    };

    $scope.addPhoto = function (albumName) {};

    $scope.viewAlbum = AwsFactory.viewAlbum;

    $scope.addPhoto = AwsFactory.addPhoto;

    $scope.deletePhoto = AwsFactory.deletePhoto;

    $scope.deleteAlbum = AwsFactory.deleteAlbum;

    // var uploader = new qq.s3.FineUploader({
    //         debug: true,
    //         element: document.getElementById('fine-uploader'),
    //         request: {
    //             endpoint: '{ YOUR_BUCKET_NAME }.s3.amazonaws.com'
    //             accessKey: '{ YOUR_ACCESS_KEY }'
    //         },
    //         signature: {
    //             endpoint: '/s3/signature'
    //         },
    //         uploadSuccess: {
    //             endpoint: '/s3/success'
    //         },
    //         iframeSupport: {
    //             localBlankPagePath: '/success.html'
    //         },
    //         retry: {
    //            enableAuto: true // defaults to false
    //         },
    //         deleteFile: {
    //             enabled: true,
    //             endpoint: '/s3handler'
    //         }
    //     });
});
app.config(function ($stateProvider) {
    $stateProvider.state('aws', {
        url: '/aws',
        templateUrl: 'js/aws/aws.html',
        controller: 'AwsCtrl'
    });
});
(function () {

    'use strict';

    // Hope you didn't forget Angular! Duh-doy.
    if (!window.angular) throw new Error('I can\'t find Angular!');

    var app = angular.module('fsaPreBuilt', []);

    app.factory('Socket', function () {
        if (!window.io) throw new Error('socket.io not found!');
        return window.io(window.location.origin);
    });

    // AUTH_EVENTS is used throughout our app to
    // broadcast and listen from and to the $rootScope
    // for important events about authentication flow.
    app.constant('AUTH_EVENTS', {
        loginSuccess: 'auth-login-success',
        loginFailed: 'auth-login-failed',
        logoutSuccess: 'auth-logout-success',
        sessionTimeout: 'auth-session-timeout',
        notAuthenticated: 'auth-not-authenticated',
        notAuthorized: 'auth-not-authorized'
    });

    app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
        var statusDict = {
            401: AUTH_EVENTS.notAuthenticated,
            403: AUTH_EVENTS.notAuthorized,
            419: AUTH_EVENTS.sessionTimeout,
            440: AUTH_EVENTS.sessionTimeout
        };
        return {
            responseError: function responseError(response) {
                $rootScope.$broadcast(statusDict[response.status], response);
                return $q.reject(response);
            }
        };
    });

    app.config(function ($httpProvider) {
        $httpProvider.interceptors.push(['$injector', function ($injector) {
            return $injector.get('AuthInterceptor');
        }]);
    });

    app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q, $state) {
        function onSuccessfulLogin(response) {
            var data = response.data;
            Session.create(data.id, data.user);
            $rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
            return data.user;
        }

        // Uses the session factory to see if an
        // authenticated user is currently registered.
        this.isAuthenticated = function () {
            return !!Session.user;
        };

        this.getLoggedInUser = function (fromServer) {

            // If an authenticated session exists, we
            // return the user attached to that session
            // with a promise. This ensures that we can
            // always interface with this method asynchronously.

            // Optionally, if true is given as the fromServer parameter,
            // then this cached value will not be used.

            if (this.isAuthenticated() && fromServer !== true) {
                return $q.when(Session.user);
            }

            // Make request GET /session.
            // If it returns a user, call onSuccessfulLogin with the response.
            // If it returns a 401 response, we catch it and instead resolve to null.
            return $http.get('/session').then(onSuccessfulLogin)['catch'](function () {
                return null;
            });
        };

        this.login = function (credentials) {
            return $http.post('/login', credentials).then(onSuccessfulLogin)['catch'](function () {
                return $q.reject({ message: 'Invalid login credentials.' });
            });
        };

        this.logout = function () {
            return $http.get('/logout').then(function () {
                Session.destroy();
                $rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
            });
        };
    });

    app.service('Session', function ($rootScope, AUTH_EVENTS) {

        var self = this;

        $rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
            self.destroy();
        });

        $rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
            self.destroy();
        });

        this.id = null;
        this.user = null;

        this.create = function (sessionId, user) {
            this.id = sessionId;
            this.user = user;
        };

        this.destroy = function () {
            this.id = null;
            this.user = null;
        };
    });
})();

app.config(function ($stateProvider) {
    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'js/auth/login.html',
        controller: 'LoginCtrl'
    });
});

app.controller('LoginCtrl', function ($scope, $state, AuthService, DialogFactory) {
    $scope.login = function () {
        var credentials = {
            email: $scope.email,
            password: $scope.password
        };
        AuthService.login(credentials).then(function (res) {
            $state.go('home');
        });
    };

    $scope.getUser = function () {
        AuthService.getLoggedInUser().then(function (user) {
            console.log('Login.js: logged in user', user);
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('layout', {
        url: '/layout',
        templateUrl: 'js/layout/layout.html',
        controller: 'LayoutCtrl',
        resolve: {
            albums: function albums(AlbumFactory, $stateParams) {
                return AlbumFactory.fetchAll();
            }
        }
    });
});

app.controller('LayoutCtrl', function ($scope, PhotosFactory, albums) {
    console.log("all albums", albums);
    $scope.albums = albums;
    $scope.getFiles = function () {
        console.log("getting Files");
        PhotosFactory.getFiles();
    };
});
app.controller('HomeCtrl', function ($scope, homePhotos, PhotosFactory) {
    $scope.updateAll = function () {
        PhotosFactory.updateAll();
    };

    $scope.getRandom = function () {};

    $scope.slidePhotos = homePhotos;

    $(document).ready(function () {

        $("#owl-demo").owlCarousel({

            autoPlay: 3000, //Set AutoPlay to 3 seconds

            // items: 1,
            navigation: true,
            pagination: false,
            singleItem: true

        });
    });
});
app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: '/js/home/home.html',
        controller: 'HomeCtrl',
        resolve: {
            homePhotos: function homePhotos(PhotosFactory) {
                return PhotosFactory.getRandom(10);
            }
        }

    });
});
app.controller('PhotoCtrl', function ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, $window, photos) {
    var albumArray = [];
    $scope.title = "Welcome";
    $scope.photosGot = false;
    $scope.selectedPage = 0;
    $scope.active = 5;

    // $scope.photos = shuffle(photos);
    $scope.photoPages = splitArray(shuffle(photos));

    var photoArray = [];

    function splitArray(array) {
        var returnArray = [];
        var chopArray = array;
        while (chopArray.length) {
            var newChunk = chopArray.splice(0, 20);
            if (newChunk) {
                returnArray.push(newChunk);
            }
        }
        return returnArray;
    }

    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue,
            randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    $scope.setPage = function (index) {
        $scope.selectedPage = index;
    };

    $scope.forward = function () {
        if ($scope.selectedPage < $scope.photoPages.length) {
            $scope.selectedPage++;
        }
    };

    $scope.backward = function () {
        if ($scope.selectedPage > 0) {
            $scope.selectedPage--;
        }
    };

    $scope.openGallery = function (index) {

        var slideIndex = index;
        $scope.slideIndex = index;
        console.log(index);
        // $scope.active = index;
        $scope.active = index;

        var imgArray = $scope.photoPages[$scope.selectedPage];
        imgArray.forEach(function (elem, index) {
            elem.id = index;
            if (index === slideIndex) {
                elem.active = true;
                console.log("active:", elem);
            } else {
                elem.active = false;
            }
        });
        console.log(imgArray);
        $scope.galleryPhotos = imgArray;
        $scope.showGallery = true;

        // $window.scrollTo(0, 0);
    };

    $scope.show = function (photo) {
        // galleryPhotos();

    };

    $scope.closeGallery = function () {
        $scope.showGallery = false;
    };

    $scope.editMode = false;
});
app.config(function ($stateProvider) {
    $stateProvider.state('photos', {
        url: '/photos',
        templateUrl: 'js/photos/photos.html',
        controller: 'PhotoCtrl',
        resolve: {
            photos: function photos(PhotosFactory, $stateParams) {
                // return PhotosFactory.fetchAll()
                return PhotosFactory.fetchAllRandom();
            }
        }
    });
});

app.controller('UploadCtrl', function ($scope, $state, albums, PhotosFactory, AlbumFactory, FileUploader) {

    var albumCreated = false;
    var addToAlbum = undefined;

    $scope.selectedAlbum = null;

    $scope.uploadAlbum = "none";

    // $scope.uploadUrl = "/api/upload/photo/"
    $scope.uploadUrl = "/api/aws/photo/";

    $scope.creatingAlbum = false;

    $scope.setAlbum = function (album) {
        $scope.selectedAlbum = album;
        $scope.uploadAlbum = album._id;
        console.log($scope.selectedAlbum);
    };
    $scope.newAlbum = false;
    $scope.photoAlbum = null;
    $scope.albums = albums;
    $scope.createAlbum = function () {
        var album = {
            title: $scope.albumTitle
        };
        if ($scope['private']) {
            album['private'] = true;
        }
        AlbumFactory.createAlbum(album).then(function (album) {
            $scope.albums.push(album);
            $scope.selectedAlbum = album;
            $scope.uploadAlbum = album._id;
            $scope.creatingAlbum = false;
        });
    };
    $scope.checkAlbum = function () {
        if (albumCreated) {
            addToAlbum = albumCreated;
        } else {
            addToAlbum = $scope.photoAlbum;
        }
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('upload', {
        url: '/upload',
        templateUrl: 'js/upload/upload.html',
        controller: 'UploadCtrl',
        resolve: {
            albums: function albums(AlbumFactory) {
                return AlbumFactory.fetchAll().then(function (albums) {
                    return albums;
                });
            }
        }
    });
});
app.controller('SignupCtrl', function ($scope, $rootScope, UserFactory) {
    $scope.user = {};
    $scope.submit = function () {
        UserFactory.createUser($scope.user).then(function (user) {
            $rootScope.user = user;
        });
    };
});
app.config(function ($stateProvider) {
    $stateProvider.state('signup', {
        url: '/signup',
        templateUrl: 'js/signup/signup.html',
        controller: 'SignupCtrl'
    });
});

app.factory('DialogFactory', function ($http, $mdDialog, $timeout) {

    var showDialog = function showDialog(message) {
        var parentEl = angular.element(document.body);
        $mdDialog.show({
            parent: parentEl,
            template: '<md-dialog aria-label="List dialog" id="dialog">' + '  <md-dialog-content>' + message + '  </md-dialog-content>' + '</md-dialog>'
        });
    };

    return {
        display: function display(message, timeout) {
            showDialog(message);
            $timeout(function () {
                $mdDialog.hide();
            }, timeout);
        }
    };
});
app.directive('ztSize', function () {
    return {
        restrict: 'A',
        link: function link(scope, element, attr) {
            var size = attr.ztSize.split('x');

            if (attr.abs) {
                if (size[0].length) {
                    element.css({
                        width: size[0] + 'px'
                    });
                }

                if (size[1].length) {
                    element.css({
                        height: size[1] + 'px'
                    });
                }
            } else {
                if (size[0].length) {
                    element.css({
                        'min-width': size[0] + 'px'
                    });
                }

                if (size[1].length) {
                    element.css({
                        'min-height': size[1] + 'px'
                    });
                }
            }
        }
    };
});
app.factory('AlbumFactory', function ($http, $state, $timeout, DialogFactory) {
    var success = function success(text) {
        DialogFactory.display(text, 750);
    };
    return {
        createAlbum: function createAlbum(album) {
            return $http.post('/api/albums/', album).then(function (res) {
                success("created");
                console.log("res", res);
                return res.data;
            })['catch'](function (e) {
                console.error("error saving album", e);
            });
        },
        fetchAll: function fetchAll() {
            return $http.get('/api/albums/').then(function (res) {
                return res.data;
            });
        },
        updateAlbum: function updateAlbum(album) {
            return $http.post('/api/albums/update', album).then(function (res) {
                return res.data;
            });
        },
        fetchOne: function fetchOne(albumId) {
            return $http.get('/api/albums/' + albumId).then(function (res) {
                return res.data;
            });
        },
        findUserAlbums: function findUserAlbums(userId) {
            return $http.get('/api/albums/user/' + userId).then(function (res) {
                return res.data;
            });
        },
        addPhoto: function addPhoto(albumId, photoId) {
            var obj = {};
            obj.albumId = albumId;
            obj.photoId = photoId;
            return $http.post('/api/albums/addPhoto', obj).then(function (res) {
                return res.data;
            });
        },
        deleteAlbum: function deleteAlbum(albumId) {
            return $http['delete']('/api/albums/' + albumId);
        },
        fetchPhotosInAlbum: function fetchPhotosInAlbum(albumId) {
            return $http.get('/api/albums/photos/' + albumId).then(function (res) {
                console.log("res");
                return res.data;
            });
        }
    };
});
app.factory('AwsFactory', function ($http) {
    var service = {};

    //    function getHtml(template) {
    // 	return template.join('\n');
    // }

    service.albums = [];
    var albumBucketName = 'ztf';
    var bucketRegion = 'us-west-2';
    var IdentityPoolId = 'us-west-2:5619d880-d874-410b-9c0c-e3a2260f32aa';
    var s3 = undefined;
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

    service.updateCredentials = function () {
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
    };

    function getHtml(template) {
        return template.join('\n');
    }

    service.listAlbumsPromise = function () {
        console.log("listing albums");
        var params = {
            Delimiter: '/'
        };

        var listPromise = s3.listObjects(params).promise();

        return listPromise;
    };

    service.listAlbums = function () {
        console.log("listing albums");
        var params = {
            Delimiter: '/'
        };

        s3.listObjects({
            Delimiter: '/'
        }, function (err, data) {
            if (err) {
                return alert('There was an error listing your albums: ' + err.message);
            } else {
                var albums = data.CommonPrefixes.map(function (commonPrefix) {
                    var prefix = commonPrefix.Prefix;
                    var albumName = decodeURIComponent(prefix.replace('/', ''));
                    return albumName;
                });
                var message = albums.length ? getHtml(['<p>Click on an album name to view it.</p>', '<p>Click on the X to delete the album.</p>']) : '<p>You do not have any albums. Please Create album.';
                var htmlTemplate = ['<h2>Albums</h2>', message, '<ul>', getHtml(albums), '</ul>', '<button ng-click="createAlbum(prompt(\'Enter Album Name:\'))">', 'Create New Album', '</button>'];
                console.log('albums', albums);
                if (!albums.length) {
                    return false;
                } else {
                    service.albums = albums;
                    return albums;
                }
            }
        });
    };

    service.createAlbum = function (albumName) {
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
        }, function (err, data) {
            if (!err) {
                return alert('Album already exists.');
            }
            if (err.code !== 'NotFound') {
                return alert('There was an error creating your album: ' + err.message);
            }
            s3.putObject({
                Key: albumKey
            }, function (err, data) {
                if (err) {
                    return alert('There was an error creating your album: ' + err.message);
                }
                alert('Successfully created album.');
                service.viewAlbum(albumName);
            });
        });
    };

    service.viewAlbum = function (albumName) {
        var albumPhotosKey = encodeURIComponent(albumName) + '//';
        s3.listObjects({
            Prefix: albumPhotosKey
        }, function (err, data) {
            if (err) {
                return alert('There was an error viewing your album: ' + err.message);
            }
            // `this` references the AWS.Response instance that represents the response
            var href = this.request.httpRequest.endpoint.href;
            var bucketUrl = href + albumBucketName + '/';

            var photos = data.Contents.map(function (photo) {
                var photoKey = photo.Key;
                var photoUrl = bucketUrl + encodeURIComponent(photoKey);
                return getHtml(['<span>', '<div>', '<img style="width:128px;height:128px;" src="' + photoUrl + '"/>', '</div>', '<div>', '<span ng-click="deletePhoto(\'' + albumName + "','" + photoKey + '\')">', 'X', '</span>', '<span>', photoKey.replace(albumPhotosKey, ''), '</span>', '</div>', '<span>']);
            });
            var message = photos.length ? '<p>Click on the X to delete the photo</p>' : '<p>You do not have any photos in this album. Please add photos.</p>';
            var htmlTemplate = ['<h2>', 'Album: ' + albumName, '</h2>', message, '<div>', getHtml(photos), '</div>', '<input id="photoupload" type="file" accept="image/*">', '<button id="addphoto" ng-click="addPhoto(\'' + albumName + '\')">', 'Add Photo', '</button>', '<button ng-click="listAlbums()">', 'Back To Albums', '</button>'];
            document.getElementById('app').innerHTML = getHtml(htmlTemplate);
        });
    };

    service.addPhoto = function (albumName) {
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
        }, function (err, data) {
            if (err) {
                return alert('There was an error uploading your photo: ', err.message);
            }
            alert('Successfully uploaded photo.');
            service.viewAlbum(albumName);
        });
    };

    service.deletePhoto = function (albumName, photoKey) {
        s3.deleteObject({
            Key: photoKey
        }, function (err, data) {
            if (err) {
                return alert('There was an error deleting your photo: ', err.message);
            }
            alert('Successfully deleted photo.');
            service.viewAlbum(albumName);
        });
    };

    service.deleteAlbum = function (albumName) {
        var albumKey = encodeURIComponent(albumName) + '/';
        s3.listObjects({
            Prefix: albumKey
        }, function (err, data) {
            if (err) {
                return alert('There was an error deleting your album: ', err.message);
            }
            var objects = data.Contents.map(function (object) {
                return {
                    Key: object.Key
                };
            });
            s3.deleteObjects({
                Delete: {
                    Objects: objects,
                    Quiet: true
                }
            }, function (err, data) {
                if (err) {
                    return alert('There was an error deleting your album: ', err.message);
                }
                alert('Successfully deleted album.');
                service.listAlbums();
            });
        });
    };

    return service;
});
app.factory('PhotosFactory', function ($http) {
    return {
        addPhoto: function addPhoto(src) {
            var photo = {
                src: src,
                name: 'test'
            };
            $http.post('/api/photos/add', photo).then(function (res) {});
        },
        savePhoto: function savePhoto(photo) {
            $http.post('/api/photos/update', photo).then(function (res) {
                console.log(res.data);
            });
        },
        fetchAll: function fetchAll() {
            return $http.get('/api/photos').then(function (res) {
                return res.data;
            });
        },
        fetchTen: function fetchTen() {
            return $http.get('/api/photos/limit10').then(function (res) {
                return res.data;
            });
        },
        getFiles: function getFiles() {
            $http.get('/api/getFiles/albumA').then(function (res) {
                console.log("Returned: ", res.data);
            });
        },
        updateAll: function updateAll() {
            $http.put('/api/photos/updateAll').then(function (res) {
                console.log("res: ", res.data);
            });
        },
        getRandom: function getRandom(amount) {
            return $http.get('/api/photos/random/' + amount).then(function (res) {
                console.log("res: ", res.data);
                return res.data;
            });
        },
        fetchAllRandom: function fetchAllRandom() {
            return $http.get('/api/photos/randomall').then(function (res) {
                console.log("res: ", res.data);
                return res.data;
            });
        }
    };
});
app.factory('UserFactory', function ($http, $rootScope, DialogFactory) {
    return {
        currentUser: function currentUser() {
            var user = {
                name: 'Dane',
                picture: 'Something',
                albums: ['One', 'Two', 'Three']
            };
            return user;
            //send request for current logged-in user
        },
        createUser: function createUser(user) {
            return $http.post('/api/users/', user).then(function (res) {
                return res.data;
            });
        },
        getUser: function getUser() {
            var username = 'danetomseth';
            return $http.get('/api/users/' + username).then(function (res) {
                $rootScope.user = res.data;
                return res.data;
            });
        },

        followAlbum: function followAlbum(album) {
            var user = $rootScope.user;
            if (user.albums.indexOf() !== -1) {
                console.log('album already exists');
            }
            user.albums.push(album);

            $http.post('/api/users/update', user).then(function (res) {
                if (res.status === 200) {
                    DialogFactory.display('Added To Albums', 1000);
                } else {
                    DialogFactory.display('Status not 200', 1000);
                }
            });
        },
        followPhoto: function followPhoto(photo) {
            var user = $rootScope.user;
            if (user.photos.indexOf() !== -1) {
                console.log('Photo already exists');
            }
            user.photos.push(photo);

            $http.post('/api/users/update', user).then(function (res) {
                if (res.status === 200) {
                    DialogFactory.display('Added To Photos', 1000);
                } else {
                    DialogFactory.display('Status not 200', 1000);
                }
            });
        }
    };
});
app.directive('albumCard', function ($rootScope, $state) {
    return {
        restrict: 'E',
        controller: 'AlbumsCtrl',
        templateUrl: 'js/common/directives/albums/album-card.html',
        link: function link(scope) {
            scope.editAlbum = function () {
                $state.go('editAlbum', { albumId: scope.album._id });
            };

            scope.viewAlbum = function () {
                $state.go('singleAlbum', { albumId: scope.album._id });
            };

            scope.addToFavorites = function () {
                console.log("call user here");
            };
        }
    };
});
app.directive('selectAlbum', function ($rootScope, AwsFactory) {
    return {
        restrict: 'E',
        controller: 'AlbumsCtrl',
        templateUrl: 'js/common/directives/albums/album.html',
        link: function link(scope) {

            scope.addPhoto = function (album) {
                console.log('album in directive', album);
                AwsFactory.addPhoto(album);
            };
        }
    };
});
app.directive('userAlbums', function ($rootScope, $state) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/albums/user-albums.html',
        link: function link(scope) {
            scope.editAlbum = function () {
                $state.go('editAlbum', { albumId: scope.album._id });
            };

            scope.addToFavorites = function () {
                console.log("call user here");
            };
        }
    };
});
app.directive('awsAlbum', function ($rootScope, AwsFactory) {
    return {
        restrict: 'E',
        controller: 'AlbumsCtrl',
        templateUrl: 'js/common/directives/aws/aws-album.html',
        link: function link(scope, element, attr) {}
    };
});
app.directive('banner', function ($rootScope, $state, Session, UserFactory, AlbumFactory, AuthService) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/banner/banner.html',
        link: function link(scope) {
            // UserFactory.getUser().then(user => {
            //     scope.user = user;
            //     return AlbumFactory.findUserAlbums(user._id)
            // }).then(albums => {
            //     scope.user.albums.push(albums);
            //     console.log(scope.user.albums);
            // })

            UserFactory.getUser().then(function (user) {
                scope.user = user;
                console.log(scope.user);

                return AlbumFactory.findUserAlbums(user._id);
            }).then(function (albums) {
                scope.userAlbums = albums;
                if (scope.user.albums.length) {
                    scope.userAlbums.push(scope.user.albums);
                }
                console.log(scope.userAlbums);
            });

            // AlbumFactory.findUserAlbums(Session.user._id)
            // .then(albums => {
            //     scope.userAlbums = albums;
            //     console.log(scope.userAlbums);
            // })

            AuthService.getLoggedInUser().then(function (user) {
                if (user) {
                    scope.user = user;
                } else {
                    scope.user = {
                        first: 'Guest',
                        last: ''
                    };
                }
            });
            scope.showAlbums = false;
            scope.showPictures = false;

            scope.addAlbums = function () {
                scope.showAlbums = true;
            };

            scope.addPictures = function () {
                scope.showPictures = true;
            };

            scope.viewAlbum = function (album) {
                $state.go('singleAlbum', {
                    albumId: album._id
                });
            };
        }
    };
});
app.directive('photoGallery', function ($window) {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/gallery/gallery.html',
        link: function link(scope, element, attrs) {
            // scope.active = 10;
            scope.startGallery = function (item) {
                console.log(item);
            };

            console.log(element);
            console.log(document.getElementById("slideshow"));
            $window.scrollTo(0, angular.element(element).offsetTop);
        }
    };
});
app.directive('footerElem', function () {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/footer/footer.html',
        link: function link(scope, element, attrs) {}
    };
});
app.directive('imgLoading', function () {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/loader/imgloading.html',
        link: function link(scope, element, attrs) {}
    };
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'js/common/directives/navbar/navbar.html',
        link: function link(scope) {

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                scope.currentPage = toState.name;
            });

            scope.items = [{
                label: 'Home',
                state: 'home'
            }, {
                label: 'Photos',
                state: 'photos'
            }, {
                label: 'Albums',
                state: 'albums'
            }, {
                label: 'Upload',
                state: 'upload'
            }
            // , {
            //     label: 'New Album',
            //     state: 'newAlbum'
            // },

            // {
            //     label: 'Admin',
            //     state: 'admin'
            // }
            ];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                    $state.go('home');
                });
            };

            var setUser = function setUser() {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function removeUser() {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
        }

    };
});
app.directive('imageonload', function () {
    return {
        restrict: 'A',
        link: function link(scope, element, attrs) {

            element.css({
                display: 'none'
            });

            element.bind('error', function () {
                // alert('image could not be loaded');
                console.log("cannot load thumb");
                scope.photo.thumbSrc = scope.photo.src;
            });

            element.on('load', function () {
                scope.$apply(function () {
                    scope.photo.visible = true;
                });
                element.css({
                    display: 'block'
                });
            });

            // scope.photo.visible = true;

            scope.imageLoaded = true;
        }
    };
});
app.directive('photoEdit', function (PhotosFactory) {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/photo/photo-edit.html',
        link: function link(scope, elem, attr) {
            scope.savePhoto = function () {
                PhotosFactory.savePhoto(scope.photo);
            };
        }
    };
});
app.directive('singlePhoto', function ($rootScope, $state) {
    return {
        restrict: 'E',
        // scope: {
        // 	photo: '='
        // },
        templateUrl: 'js/common/directives/photo/single-photo.html',
        link: function link(scope) {}
    };
});
app.directive('uploader', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/upload/upload.html',
        link: function link(scope, elem, attr) {

            var galleryUploader = new qq.FineUploader({
                element: document.getElementById("fine-uploader-gallery"),
                template: 'qq-template-gallery',
                request: {
                    endpoint: '/api/upload/photo/' + scope.uploadAlbum
                },
                thumbnails: {
                    placeholders: {
                        waitingPath: '/assets/placeholders/waiting-generic.png',
                        notAvailablePath: '/assets/placeholders/not_available-generic.png'
                    }
                },
                validation: {
                    allowedExtensions: ['jpeg', 'jpg', 'gif', 'png']
                }
            });

            var updateEndpoint = function updateEndpoint() {
                var endpoint = '/api/upload/photo/' + scope.uploadAlbum;
                galleryUploader.setEndpoint(endpoint);
                console.log("endpoint updated");
            };
            scope.$watch('uploadAlbum', function (newVal, oldVal) {
                updateEndpoint();
            });
        }

    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFkbWluL2FkbWluLWNvbnRyb2xsZXIuanMiLCJhZG1pbi9hZG1pbi1mYWN0b3J5LmpzIiwiYWRtaW4vYWRtaW4uanMiLCJhbGJ1bS9hbGJ1bS1jb250cm9sbGVyLmpzIiwiYWxidW0vYWxidW0uanMiLCJhbGJ1bS9hbGJ1bXMtY29udHJvbGxlci5qcyIsImFsYnVtL2FsYnVtcy5qcyIsImFsYnVtL2VkaXQtYWxidW0uanMiLCJhbGJ1bS9uZXctYWxidW0tY29udHJvbGxlci5qcyIsImFsYnVtL25ldy1hbGJ1bS5qcyIsImFsYnVtL3NpbmdsZS1hbGJ1bS1jb250cm9sbGVyLmpzIiwiYXdzL2F3cy5jb250cm9sbGVyLmpzIiwiYXdzL2F3cy5qcyIsImF1dGgvYXV0aC5qcyIsImF1dGgvbG9naW4uanMiLCJsYXlvdXQvbGF5b3V0LmpzIiwiaG9tZS9ob21lLmNvbnRyb2xsZXIuanMiLCJob21lL2hvbWUuanMiLCJwaG90b3MvcGhvdG9zLWNvbnRyb2xsZXIuanMiLCJwaG90b3MvcGhvdG9zLmpzIiwidXBsb2FkL3VwbG9hZC5jb250cm9sbGVyLmpzIiwidXBsb2FkL3VwbG9hZC5qcyIsInNpZ251cC9zaWdudXAtY29udHJvbGxlci5qcyIsInNpZ251cC9zaWdudXAuanMiLCJjb21tb24vZGlhbG9nL2RpYWxvZy1mYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2V0U2l6ZS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYWxidW0tZmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXdzLmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL3Bob3Rvcy1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy91c2VyLWZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9hbGJ1bXMvYWxidW0tY2FyZC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy9hbGJ1bS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy91c2VyLWFsYnVtcy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2F3cy9hbGJ1bS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Jhbm5lci9iYW5uZXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9nYWxsZXJ5L2dhbGxlcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9mb290ZXIvZm9vdGVyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbG9hZGVyL2ltZ2xvYWRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vaW1hZ2VvbmxvYWQuanMiLCJjb21tb24vZGlyZWN0aXZlcy9waG90by9waG90by1lZGl0LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vc2luZ2xlLXBob3RvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvdXBsb2FkL3VwbG9hZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFBLENBQUE7QUFDQSxNQUFBLENBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLG1CQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLEVBQUEsa0JBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQSxrQkFBQSxFQUFBOztBQUVBLHFCQUFBLENBQUEsU0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBOztBQUVBLHNCQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxhQUFBLEdBQUE7QUFDQSxZQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGNBQUEsRUFBQSxTQUFBO0FBQ0EsY0FBQSxFQUFBLFNBQUE7QUFDQSxjQUFBLEVBQUEsU0FBQTtBQUNBLGNBQUEsRUFBQSxTQUFBO0tBQ0EsQ0FBQTs7QUFHQSxzQkFBQSxDQUFBLEtBQUEsQ0FBQSxTQUFBLENBQUEsQ0FDQSxjQUFBLENBQUEsTUFBQSxDQUFBLENBQ0EsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUNBLFdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7O0FBR0EsR0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7QUFHQSxRQUFBLDRCQUFBLEdBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxjQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7QUFFQSxZQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7O0FBR0EsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7Ozs7Ozs7O1NBVUEsQ0FBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ3pFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxnQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsS0FBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsaUJBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUMxREEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLEVBRUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ0pBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEscUJBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7QUFDQSxZQUFBLEVBQUE7QUFDQSx3QkFBQSxFQUFBLElBQUE7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1RBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsZ0JBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxRQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxLQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBO1NBQ0EsQ0FBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLHlCQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLGlCQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQSxFQUVBLENBQUE7O0FBR0EsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHlCQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsWUFBQTtBQUNBLHNCQUFBLENBQUEsTUFBQSxFQUFBLENBQUE7YUFDQSxFQUFBLElBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUlBLENBQUEsQ0FBQTs7QUM5REEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxpQkFBQTtBQUNBLG1CQUFBLEVBQUEsNEJBQUE7QUFDQSxrQkFBQSxFQUFBLGlCQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0EsaUJBQUEsRUFBQSxlQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUE7QUFDQSx1QkFBQSxZQUFBLENBQUEsUUFBQSxDQUFBLFlBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0E7O0tBRUEsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2JBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxnQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBOzs7Ozs7O0tBT0EsQ0FBQTtDQUVBLENBQUEsQ0FBQTtBQ3pCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHNCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDTkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFdBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxxQkFBQTtBQUNBLG1CQUFBLEVBQUEsMEJBQUE7QUFDQSxrQkFBQSxFQUFBLGVBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLGVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUEsWUFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsVUFBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBLGFBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxRQUFBLE9BQUEsR0FBQSxTQUFBLE9BQUEsR0FBQTtBQUNBLGFBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxJQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsV0FBQSxFQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsaUJBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSx5QkFBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsaUJBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFFBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUM5Q0EsR0FBQSxDQUFBLFVBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsT0FBQSxFQUFBLGFBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxXQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsRUFBQSxPQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsT0FBQSxDQUFBLElBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsR0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQTtTQUNBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7O0FBRUEsb0JBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFJQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxPQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDMUJBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxVQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsV0FBQTtBQUNBLG1CQUFBLEVBQUEseUJBQUE7QUFDQSxrQkFBQSxFQUFBLGNBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDTkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUEsS0FBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7O0FBR0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLEVBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxLQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLGVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLEdBQUEsSUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLGNBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFdBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxFQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDNUNBLEdBQUEsQ0FBQSxVQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsQ0FBQSxNQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0Esa0JBQUEsQ0FBQSxpQkFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsTUFBQSxHQUFBLElBQUEsQ0FBQSxjQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsWUFBQSxFQUFBO0FBQ0Esb0JBQUEsTUFBQSxHQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUE7QUFDQSxvQkFBQSxTQUFBLEdBQUEsa0JBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsU0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsU0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsYUFBQSxHQUFBLElBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE1BQUEsR0FBQSxVQUFBLENBQUEsaUJBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxFQUFBLFNBQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxXQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsRUFFQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxDQUFBLFNBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFVBQUEsQ0FBQSxRQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0ErQkEsQ0FBQSxDQUFBO0FDcEVBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsTUFBQTtBQUNBLG1CQUFBLEVBQUEsaUJBQUE7QUFDQSxrQkFBQSxFQUFBLFNBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNOQSxDQUFBLFlBQUE7O0FBRUEsZ0JBQUEsQ0FBQTs7O0FBR0EsUUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSx3QkFBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxHQUFBLEdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFlBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUFBO0FBQ0EsZUFBQSxNQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7Ozs7O0FBS0EsT0FBQSxDQUFBLFFBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxvQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsRUFBQSxtQkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7QUFDQSxzQkFBQSxFQUFBLHNCQUFBO0FBQ0Esd0JBQUEsRUFBQSx3QkFBQTtBQUNBLHFCQUFBLEVBQUEscUJBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLEVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxZQUFBLFVBQUEsR0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsZ0JBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGFBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7QUFDQSxlQUFBLEVBQUEsV0FBQSxDQUFBLGNBQUE7U0FDQSxDQUFBO0FBQ0EsZUFBQTtBQUNBLHlCQUFBLEVBQUEsdUJBQUEsUUFBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsWUFBQSxDQUFBLElBQUEsQ0FBQSxDQUNBLFdBQUEsRUFDQSxVQUFBLFNBQUEsRUFBQTtBQUNBLG1CQUFBLFNBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsRUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLGlCQUFBLGlCQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxtQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsRUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHNCQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQSxJQUFBLENBQUE7U0FDQTs7OztBQUlBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsZ0JBQUEsSUFBQSxDQUFBLGVBQUEsRUFBQSxJQUFBLFVBQUEsS0FBQSxJQUFBLEVBQUE7QUFDQSx1QkFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBOzs7OztBQUtBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLGlCQUFBLENBQUEsU0FBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FFQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxLQUFBLEdBQUEsVUFBQSxXQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsRUFBQSxXQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUNBLENBQUEsWUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsRUFBQSxPQUFBLEVBQUEsNEJBQUEsRUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSx1QkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7O0FBRUEsWUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxnQkFBQSxFQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGtCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxjQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUVBLENBQUEsRUFBQSxDQUFBOztBQ25JQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFFBQUE7QUFDQSxtQkFBQSxFQUFBLG9CQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUVBLEdBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxXQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxXQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxLQUFBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxtQkFBQSxDQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxlQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSwwQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO1NBRUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ3pCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsdUJBQUEsWUFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsZUFBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ3JCQSxHQUFBLENBQUEsVUFBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EscUJBQUEsQ0FBQSxTQUFBLEVBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBLEVBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsQ0FBQTs7QUFHQSxLQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsS0FBQSxDQUFBLFlBQUE7O0FBRUEsU0FBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBLFdBQUEsQ0FBQTs7QUFFQSxvQkFBQSxFQUFBLElBQUE7OztBQUdBLHNCQUFBLEVBQUEsSUFBQTtBQUNBLHNCQUFBLEVBQUEsS0FBQTtBQUNBLHNCQUFBLEVBQUEsSUFBQTs7U0FFQSxDQUFBLENBQUE7S0FFQSxDQUFBLENBQUE7Q0FHQSxDQUFBLENBQUE7QUMzQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxHQUFBO0FBQ0EsbUJBQUEsRUFBQSxvQkFBQTtBQUNBLGtCQUFBLEVBQUEsVUFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLHNCQUFBLEVBQUEsb0JBQUEsYUFBQSxFQUFBO0FBQ0EsdUJBQUEsYUFBQSxDQUFBLFNBQUEsQ0FBQSxFQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0E7O0tBRUEsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDWkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLE9BQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxRQUFBLFVBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLFNBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFlBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxHQUFBLENBQUEsQ0FBQTs7O0FBSUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLENBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsUUFBQSxVQUFBLEdBQUEsRUFBQSxDQUFBOztBQUVBLGFBQUEsVUFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFlBQUEsV0FBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFlBQUEsU0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGVBQUEsU0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLGdCQUFBLFFBQUEsR0FBQSxTQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLFFBQUEsRUFBQTtBQUNBLDJCQUFBLENBQUEsSUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQTtBQUNBLGVBQUEsV0FBQSxDQUFBO0tBQ0E7O0FBRUEsYUFBQSxPQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsWUFBQSxZQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUE7WUFDQSxjQUFBO1lBQUEsV0FBQSxDQUFBOztBQUVBLGVBQUEsQ0FBQSxLQUFBLFlBQUEsRUFBQTs7QUFFQSx1QkFBQSxHQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsRUFBQSxHQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0Esd0JBQUEsSUFBQSxDQUFBLENBQUE7O0FBRUEsMEJBQUEsR0FBQSxLQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLFlBQUEsQ0FBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsV0FBQSxDQUFBLEdBQUEsY0FBQSxDQUFBO1NBQ0E7QUFDQSxlQUFBLEtBQUEsQ0FBQTtLQUNBOztBQU1BLFVBQUEsQ0FBQSxPQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLE9BQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxNQUFBLENBQUEsWUFBQSxHQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLE1BQUEsQ0FBQSxZQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxZQUFBLEVBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTs7QUFJQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLFlBQUEsVUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxVQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTs7QUFFQSxjQUFBLENBQUEsTUFBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxZQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsSUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsRUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGdCQUFBLEtBQUEsS0FBQSxVQUFBLEVBQUE7QUFDQSxvQkFBQSxDQUFBLE1BQUEsR0FBQSxJQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxNQUNBO0FBQ0Esb0JBQUEsQ0FBQSxNQUFBLEdBQUEsS0FBQSxDQUFBO2FBQ0E7U0FDQSxDQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLGFBQUEsR0FBQSxRQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsV0FBQSxHQUFBLElBQUEsQ0FBQTs7O0tBSUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsSUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBOzs7S0FJQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxXQUFBLEdBQUEsS0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsUUFBQSxHQUFBLEtBQUEsQ0FBQTtDQUlBLENBQUEsQ0FBQTtBQ3hHQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxXQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBOztBQUVBLHVCQUFBLGFBQUEsQ0FBQSxjQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDWkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQTs7QUFFQSxRQUFBLFlBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxRQUFBLFVBQUEsWUFBQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsTUFBQSxDQUFBOzs7QUFHQSxVQUFBLENBQUEsU0FBQSxHQUFBLGlCQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLGFBQUEsR0FBQSxLQUFBLENBQUE7O0FBR0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxhQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFdBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsVUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxLQUFBLEdBQUE7QUFDQSxpQkFBQSxFQUFBLE1BQUEsQ0FBQSxVQUFBO1NBQ0EsQ0FBQTtBQUNBLFlBQUEsTUFBQSxXQUFBLEVBQUE7QUFDQSxpQkFBQSxXQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0E7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGFBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFdBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxhQUFBLEdBQUEsS0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsWUFBQSxFQUFBO0FBQ0Esc0JBQUEsR0FBQSxZQUFBLENBQUE7U0FDQSxNQUFBO0FBQ0Esc0JBQUEsR0FBQSxNQUFBLENBQUEsVUFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBSUEsQ0FBQSxDQUFBO0FDaERBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxNQUFBLEVBQUE7QUFDQSwyQkFBQSxNQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ2JBLEdBQUEsQ0FBQSxVQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsSUFBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLG1CQUFBLENBQUEsVUFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDUkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNOQSxHQUFBLENBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBOztBQUdBLFFBQUEsVUFBQSxHQUFBLFNBQUEsVUFBQSxDQUFBLE9BQUEsRUFBQTtBQUNBLFlBQUEsUUFBQSxHQUFBLE9BQUEsQ0FBQSxPQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSxrQkFBQSxFQUFBLFFBQUE7QUFDQSxvQkFBQSxFQUNBLGtEQUFBLEdBQ0EsdUJBQUEsR0FDQSxPQUFBLEdBQ0Esd0JBQUEsR0FDQSxjQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFHQSxXQUFBO0FBQ0EsZUFBQSxFQUFBLGlCQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUE7QUFDQSxzQkFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxZQUFBO0FBQ0EseUJBQUEsQ0FBQSxJQUFBLEVBQUEsQ0FBQTthQUNBLEVBQUEsT0FBQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FJQSxDQUFBLENBQUE7QUM1QkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxJQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTs7QUFFQSxnQkFBQSxJQUFBLENBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLDJCQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsNkJBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQTtxQkFDQSxDQUFBLENBQUE7aUJBQ0E7O0FBRUEsb0JBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLDJCQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsOEJBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQTtxQkFDQSxDQUFBLENBQUE7aUJBQ0E7YUFDQSxNQUFBO0FBQ0Esb0JBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLDJCQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsbUNBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQTtxQkFDQSxDQUFBLENBQUE7aUJBQ0E7O0FBRUEsb0JBQUEsSUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLDJCQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0Esb0NBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLEdBQUEsSUFBQTtxQkFDQSxDQUFBLENBQUE7aUJBQ0E7YUFDQTtTQUdBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ25DQSxHQUFBLENBQUEsT0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFFBQUEsT0FBQSxHQUFBLFNBQUEsT0FBQSxDQUFBLElBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsRUFBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLGNBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsU0FDQSxDQUFBLFVBQUEsQ0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxLQUFBLENBQUEsb0JBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUVBO0FBQ0EsZ0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsY0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsZ0JBQUEsRUFBQSxrQkFBQSxPQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLGNBQUEsR0FBQSxPQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxzQkFBQSxFQUFBLHdCQUFBLE1BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsbUJBQUEsR0FBQSxNQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLGtCQUFBLE9BQUEsRUFBQSxPQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsZUFBQSxDQUFBLE9BQUEsR0FBQSxPQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsT0FBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsc0JBQUEsRUFBQSxHQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHFCQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsVUFBQSxDQUFBLGNBQUEsR0FBQSxPQUFBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsMEJBQUEsRUFBQSw0QkFBQSxPQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLEdBQUEsT0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDM0RBLEdBQUEsQ0FBQSxPQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsUUFBQSxPQUFBLEdBQUEsRUFBQSxDQUFBOzs7Ozs7QUFPQSxXQUFBLENBQUEsTUFBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFFBQUEsZUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFFBQUEsWUFBQSxHQUFBLFdBQUEsQ0FBQTtBQUNBLFFBQUEsY0FBQSxHQUFBLGdEQUFBLENBQUE7QUFDQSxRQUFBLEVBQUEsWUFBQSxDQUFBO0FBQ0EsT0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUE7QUFDQSxjQUFBLEVBQUEsWUFBQTtBQUNBLG1CQUFBLEVBQUEsSUFBQSxHQUFBLENBQUEsMEJBQUEsQ0FBQTtBQUNBLDBCQUFBLEVBQUEsY0FBQTtTQUNBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsTUFBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtBQUNBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLEVBQUEsZUFBQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLFdBQUEsQ0FBQSxpQkFBQSxHQUFBLFlBQUE7QUFDQSxXQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtBQUNBLHVCQUFBLEVBQUEsSUFBQSxHQUFBLENBQUEsMEJBQUEsQ0FBQTtBQUNBLDhCQUFBLEVBQUEsY0FBQTthQUNBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxHQUFBLElBQUEsR0FBQSxDQUFBLEVBQUEsQ0FBQTtBQUNBLHNCQUFBLEVBQUEsWUFBQTtBQUNBLGtCQUFBLEVBQUE7QUFDQSxzQkFBQSxFQUFBLGVBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxlQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsYUFBQSxPQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsZUFBQSxRQUFBLENBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0tBQ0E7O0FBRUEsV0FBQSxDQUFBLGlCQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxNQUFBLEdBQUE7QUFDQSxxQkFBQSxFQUFBLEdBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsV0FBQSxHQUFBLEVBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7O0FBRUEsZUFBQSxXQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUEsQ0FBQSxVQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxNQUFBLEdBQUE7QUFDQSxxQkFBQSxFQUFBLEdBQUE7U0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLENBQUE7QUFDQSxxQkFBQSxFQUFBLEdBQUE7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QUE7QUFDQSxnQkFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxLQUFBLENBQUEseUNBQUEsR0FBQSxHQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTs7QUFFQSxnQkFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBLE9BQUEsQ0FBQSxXQUFBLENBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLGdCQUFBLFNBQUEsR0FBQSxJQUFBLEdBQUEsZUFBQSxHQUFBLEdBQUEsQ0FBQTs7QUFFQSxnQkFBQSxNQUFBLEdBQUEsSUFBQSxDQUFBLFFBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxvQkFBQSxRQUFBLEdBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQTtBQUNBLG9CQUFBLFFBQUEsR0FBQSxTQUFBLEdBQUEsa0JBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLE9BQUEsQ0FBQSxDQUNBLFFBQUEsRUFDQSxPQUFBLEVBQ0EsOENBQUEsR0FBQSxRQUFBLEdBQUEsS0FBQSxFQUNBLFFBQUEsRUFDQSxPQUFBLEVBQ0EsZ0NBQUEsR0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLFFBQUEsR0FBQSxPQUFBLEVBQ0EsR0FBQSxFQUNBLFNBQUEsRUFDQSxRQUFBLEVBQ0EsUUFBQSxDQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsRUFBQSxDQUFBLEVBQ0EsU0FBQSxFQUNBLFFBQUEsRUFDQSxRQUFBLENBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO0FBQ0EsZ0JBQUEsT0FBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLEdBQ0EsMkNBQUEsR0FDQSxxRUFBQSxDQUFBO0FBQ0EsZ0JBQUEsWUFBQSxHQUFBLENBQ0EsTUFBQSxFQUNBLFNBQUEsR0FBQSxTQUFBLEVBQ0EsT0FBQSxFQUNBLE9BQUEsRUFDQSxPQUFBLEVBQ0EsT0FBQSxDQUFBLE1BQUEsQ0FBQSxFQUNBLFFBQUEsRUFDQSx1REFBQSxFQUNBLDZDQUFBLEdBQUEsU0FBQSxHQUFBLE9BQUEsRUFDQSxXQUFBLEVBQ0EsV0FBQSxFQUNBLGtDQUFBLEVBQ0EsZ0JBQUEsRUFDQSxXQUFBLENBQ0EsQ0FBQTtBQUNBLG9CQUFBLENBQUEsY0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLFNBQUEsR0FBQSxPQUFBLENBQUEsWUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLGlCQUFBLEVBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLEtBQUEsR0FBQSxRQUFBLENBQUEsY0FBQSxDQUFBLGFBQUEsQ0FBQSxDQUFBLEtBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLHVDQUFBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsWUFBQSxJQUFBLEdBQUEsS0FBQSxDQUFBLENBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxRQUFBLEdBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLFlBQUEsY0FBQSxHQUFBLGtCQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsUUFBQSxHQUFBLGNBQUEsR0FBQSxRQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0EsZUFBQSxFQUFBLFFBQUE7QUFDQSxnQkFBQSxFQUFBLElBQUE7QUFDQSxlQUFBLEVBQUEsYUFBQTtTQUNBLEVBQUEsVUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsS0FBQSxDQUFBLDJDQUFBLEVBQUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0E7QUFDQSxpQkFBQSxDQUFBLDhCQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsU0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBLFFBQUEs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QUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGlCQUFBLEVBQUEscUJBQUE7QUFDQSxpQkFBQSxDQUFBLEdBQUEsQ0FBQSx1QkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsaUJBQUEsRUFBQSxtQkFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLEdBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLHNCQUFBLEVBQUEsMEJBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ3BEQSxHQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxVQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUE7QUFDQSxvQkFBQSxFQUFBLE1BQUE7QUFDQSx1QkFBQSxFQUFBLFdBQUE7QUFDQSxzQkFBQSxFQUFBLENBQUEsS0FBQSxFQUFBLEtBQUEsRUFBQSxPQUFBLENBQUE7YUFDQSxDQUFBO0FBQ0EsbUJBQUEsSUFBQSxDQUFBOztTQUVBO0FBQ0Esa0JBQUEsRUFBQSxvQkFBQSxJQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLGFBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxlQUFBLEVBQUEsbUJBQUE7QUFDQSxnQkFBQSxRQUFBLEdBQUEsYUFBQSxDQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxhQUFBLEdBQUEsUUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsMEJBQUEsQ0FBQSxJQUFBLEdBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTs7QUFFQSxtQkFBQSxFQUFBLHFCQUFBLEtBQUEsRUFBQTtBQUNBLGdCQUFBLElBQUEsR0FBQSxVQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLENBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLHNCQUFBLENBQUEsQ0FBQTthQUNBO0FBQ0EsZ0JBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsSUFBQSxDQUFBLG1CQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxDQUFBLE1BQUEsS0FBQSxHQUFBLEVBQUE7QUFDQSxpQ0FBQSxDQUFBLE9BQUEsQ0FBQSxpQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO2lCQUNBLE1BQ0E7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QSxHQUFBLENBQUEsZ0JBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ2RBLEdBQUEsQ0FBQSxTQUFBLENBQUEsVUFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxJQUFBLEVBQUEsRUFFQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNUQSxHQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEseUNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7Ozs7Ozs7OztBQVNBLHVCQUFBLENBQUEsT0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBOztBQUVBLHVCQUFBLFlBQUEsQ0FBQSxjQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLG9CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLHlCQUFBLENBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO2lCQUNBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBOzs7Ozs7OztBQVFBLHVCQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0Esb0JBQUEsSUFBQSxFQUFBO0FBQ0EseUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO2lCQUNBLE1BQ0E7QUFDQSx5QkFBQSxDQUFBLElBQUEsR0FBQTtBQUNBLDZCQUFBLEVBQUEsT0FBQTtBQUNBLDRCQUFBLEVBQUEsRUFBQTtxQkFDQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxVQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxxQkFBQSxDQUFBLFVBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxxQkFBQSxDQUFBLFlBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0EsMkJBQUEsRUFBQSxLQUFBLENBQUEsR0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQSxDQUFBO1NBRUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDL0RBLEdBQUEsQ0FBQSxTQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsSUFBQTtBQUNBLG1CQUFBLEVBQUEsMkNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxpQkFBQSxDQUFBLFlBQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxjQUFBLENBQUEsV0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsRUFBQSxPQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDZkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLElBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsRUFDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNQQSxHQUFBLENBQUEsU0FBQSxDQUFBLFlBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsSUFBQTtBQUNBLG1CQUFBLEVBQUEsNkNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQSxFQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1BBLEdBQUEsQ0FBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOztBQUVBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxhQUFBLEVBQUEsRUFBQTtBQUNBLG1CQUFBLEVBQUEseUNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7O0FBRUEsc0JBQUEsQ0FBQSxHQUFBLENBQUEscUJBQUEsRUFDQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxVQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLFdBQUEsR0FBQSxPQUFBLENBQUEsSUFB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QkFBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGtCQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7QUFDQSxpQkFBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsOEJBQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0tBRUEsQ0FBQTtDQUNBLENBQUEsQ0FBQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xud2luZG93LmFwcCA9IGFuZ3VsYXIubW9kdWxlKCdaVEYnLCBbJ2ZzYVByZUJ1aWx0JywnYm9vdHN0cmFwTGlnaHRib3gnLCAndWkucm91dGVyJywgJ3VpLmJvb3RzdHJhcCcsICduZ0FuaW1hdGUnLCAnYW5ndWxhckZpbGVVcGxvYWQnLCAnbmdNYXRlcmlhbCcsICdha29lbmlnLmRlY2tncmlkJ10pO1xuXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIpIHtcbiAgICAvLyBUaGlzIHR1cm5zIG9mZiBoYXNoYmFuZyB1cmxzICgvI2Fib3V0KSBhbmQgY2hhbmdlcyBpdCB0byBzb21ldGhpbmcgbm9ybWFsICgvYWJvdXQpXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxuICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy8nKTtcbiAgICAgdmFyIGN1c3RvbVByaW1hcnkgPSB7XG4gICAgICAgICc1MCc6ICcjZDhiZjhjJyxcbiAgICAgICAgJzEwMCc6ICcjZDFiNTc5JyxcbiAgICAgICAgJzIwMCc6ICcjY2JhYTY2JyxcbiAgICAgICAgJzMwMCc6ICcjYzRhMDUzJyxcbiAgICAgICAgJzQwMCc6ICcjYmQ5NTQwJyxcbiAgICAgICAgJzUwMCc6ICcjYWE4NjNhJyxcbiAgICAgICAgJzYwMCc6ICcjOTc3NzM0JyxcbiAgICAgICAgJzcwMCc6ICcjODQ2ODJkJyxcbiAgICAgICAgJzgwMCc6ICcjNzE1OTI3JyxcbiAgICAgICAgJzkwMCc6ICcjNWU0YTIwJyxcbiAgICAgICAgJ0ExMDAnOiAnI2RlY2E5ZicsXG4gICAgICAgICdBMjAwJzogJyNlNWQ0YjInLFxuICAgICAgICAnQTQwMCc6ICcjZWJkZmM1JyxcbiAgICAgICAgJ0E3MDAnOiAnIzRiM2IxYSdcbiAgICB9O1xuICBcblxuICAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcbiAgICAgICAucHJpbWFyeVBhbGV0dGUoJ2JsdWUnKVxuICAgICAgIC5hY2NlbnRQYWxldHRlKCdwdXJwbGUnKVxuICAgICAgIC53YXJuUGFsZXR0ZSgneWVsbG93Jylcbn0pO1xuXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXG5hcHAucnVuKGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgJHN0YXRlKSB7XG5cbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxuICAgIHZhciBkZXN0aW5hdGlvblN0YXRlUmVxdWlyZXNBdXRoID0gZnVuY3Rpb24gKHN0YXRlKSB7XG4gICAgICAgIHJldHVybiBzdGF0ZS5kYXRhICYmIHN0YXRlLmRhdGEuYXV0aGVudGljYXRlO1xuICAgIH07XG5cbiAgICAvLyAkc3RhdGVDaGFuZ2VTdGFydCBpcyBhbiBldmVudCBmaXJlZFxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxuICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uIChldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMpIHtcblxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXN0aW5hdGlvbiBzdGF0ZSBkb2VzIG5vdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBUaGUgdXNlciBpcyBhdXRoZW50aWNhdGVkLlxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgICAgICAvLyBJZiBhIHVzZXIgaXMgcmV0cmlldmVkLCB0aGVuIHJlbmF2aWdhdGUgdG8gdGhlIGRlc3RpbmF0aW9uXG4gICAgICAgICAgICAvLyAodGhlIHNlY29uZCB0aW1lLCBBdXRoU2VydmljZS5pc0F1dGhlbnRpY2F0ZWQoKSB3aWxsIHdvcmspXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuXG4gICAgICAgICAgICAvLyRyb290U2NvcGUubG9nZ2VkSW5Vc2VyID0gdXNlcjtcbiAgICAgICAgICAgIC8vIGlmICh1c2VyKSB7XG4gICAgICAgICAgICAvLyAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xuICAgICAgICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgICAgIC8vICAgICAkc3RhdGUuZ28oJ2xvZ2luJyk7XG4gICAgICAgICAgICAvLyB9XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbn0pO1xuIiwiYXBwLmNvbnRyb2xsZXIoXCJBZG1pbkN0cmxcIiwgKCRzY29wZSwgJHN0YXRlLCBBZG1pbkZhY3RvcnksIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSkgPT4ge1xuICAgICRzY29wZS5hZGRpbmdQaWN0dXJlcyA9IGZhbHNlO1xuXG4gICAgQWxidW1GYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdmZXRjaGVkJywgYWxidW1zKTtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1PbmUgPSAkc2NvcGUuYWxidW1zWzBdO1xuICAgICAgICB9KTtcblxuICAgIFBob3Rvc0ZhY3RvcnkuZmV0Y2hUZW4oKVxuICAgICAgICAudGhlbihwaG90b3MgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgfSk7XG5cbiAgICAkc2NvcGUuZGVsZXRlQWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LmRlbGV0ZUFsYnVtKGFsYnVtLl9pZCk7XG4gICAgICAgIGxldCBhbGJ1bUluZGV4ID0gJHNjb3BlLmFsYnVtcy5pbmRleE9mKGFsYnVtKTtcbiAgICAgICAgJHNjb3BlLmFsYnVtcy5zcGxpY2UoYWxidW1JbmRleCwgMSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNyZWF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBsZXQgYWxidW0gPSB7XG4gICAgICAgICAgICB0aXRsZTogJHNjb3BlLm5ld0FsYnVtXG4gICAgICAgIH1cbiAgICAgICAgQWxidW1GYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMucHVzaChhbGJ1bSk7XG4gICAgICAgICAgICAkc2NvcGUubmV3QWxidW0gPSBcIlwiO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRQaG90b3MgPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bSA9IGFsYnVtO1xuICAgICAgICBQaG90b3NGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICBcdCRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cblxuICAgICRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5jdXJyZW50QWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgXHQkc3RhdGUucmVsb2FkKCk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLnVwbG9hZFBob3RvcyA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCd1cGxvYWRQaG90b3MnKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuY3VycmVudEFsYnVtLnBob3Rvcy5wdXNoKHBob3RvLl9pZCk7XG4gICAgfVxufSkiLCJhcHAuZmFjdG9yeShcIkFkbWluRmFjdG9yeVwiLCAoJGh0dHApID0+IHtcblx0cmV0dXJuIHtcblx0XHRcblx0fVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vYWRtaW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBbGJ1bUN0cmwnLFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ0FsYnVtQ3RybCcsICgkc2NvcGUsICR0aW1lb3V0LCAkc3RhdGUsIEFkbWluRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBEaWFsb2dGYWN0b3J5KSA9PiB7XG4gICAgJHNjb3BlLmFkZGluZ1BpY3R1cmVzID0gZmFsc2U7XG5cbiAgICBBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bU9uZSA9ICRzY29wZS5hbGJ1bXNbMF07XG4gICAgICAgIH0pO1xuXG4gICAgUGhvdG9zRmFjdG9yeS5mZXRjaFRlbigpXG4gICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAkc2NvcGUucGhvdG9zID0gcGhvdG9zO1xuICAgICAgICB9KTtcblxuICAgICRzY29wZS5kZWxldGVBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICBBbGJ1bUZhY3RvcnkuZGVsZXRlQWxidW0oYWxidW0uX2lkKTtcbiAgICAgICAgbGV0IGFsYnVtSW5kZXggPSAkc2NvcGUuYWxidW1zLmluZGV4T2YoYWxidW0pO1xuICAgICAgICAkc2NvcGUuYWxidW1zLnNwbGljZShhbGJ1bUluZGV4LCAxKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIGxldCBhbGJ1bSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiAkc2NvcGUubmV3QWxidW1cbiAgICAgICAgfVxuICAgICAgICBBbGJ1bUZhY3RvcnkuY3JlYXRlQWxidW0oYWxidW0pLnRoZW4oYWxidW0gPT4ge1xuICAgICAgICAgICAgRGlhbG9nRmFjdG9yeS5kaXNwbGF5KFwiQ3JlYXRlZFwiKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkUGhvdG9zID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzY29wZS5zZWxlY3RpbmdQaWN0dXJlcyA9IHRydWU7XG4gICAgICAgICRzY29wZS5jdXJyZW50QWxidW0gPSBhbGJ1bTtcbiAgICAgICAgUGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgICAgICAudGhlbihwaG90b3MgPT4ge1xuICAgICAgICAgICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG5cbiAgICB9XG5cblxuICAgICRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5jdXJyZW50QWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIlVwZGF0ZWRcIiwgMTUwMCk7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkc3RhdGUucmVsb2FkKCk7XG4gICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuY3VycmVudEFsYnVtLnBob3Rvcy5wdXNoKHBob3RvLl9pZCk7XG4gICAgICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIkFkZGVkXCIsIDEwMDApO1xuICAgIH1cblxuXG5cbn0pIiwiXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaW5nbGVBbGJ1bScsIHtcbiAgICAgICAgdXJsOiAnL0FsYnVtLzphbGJ1bUlkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9zaW5nbGUtYWxidW0uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdTaW5nbGVBbGJ1bUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0YWxidW06IChBbGJ1bUZhY3RvcnksICRzdGF0ZVBhcmFtcykgPT4ge1xuICAgICAgICBcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaE9uZSgkc3RhdGVQYXJhbXMuYWxidW1JZClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICAgIFxuICAgIH0pO1xufSk7XG4iLCJhcHAuY29udHJvbGxlcignQWxidW1zQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgUGhvdG9zRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBVc2VyRmFjdG9yeSwgRGlhbG9nRmFjdG9yeSkgPT4ge1xuXHRBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bU9uZSA9ICRzY29wZS5hbGJ1bXNbMF07XG4gICAgICAgIH0pO1xuXG4gICAgJHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IGFsYnVtLl9pZH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLmZvbGxvd0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgXHRVc2VyRmFjdG9yeS5mb2xsb3dBbGJ1bShhbGJ1bSlcbiAgICB9XG5cbiAgICAkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgICRzdGF0ZS5nbygnbmV3QWxidW0nKTtcbiAgICAgICAgLy8gbGV0IGFsYnVtID0ge1xuICAgICAgICAvLyAgICAgdGl0bGU6ICRzY29wZS5uZXdBbGJ1bVxuICAgICAgICAvLyB9XG4gICAgICAgIC8vIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bShhbGJ1bSkudGhlbihhbGJ1bSA9PiB7XG4gICAgICAgIC8vICAgICBEaWFsb2dGYWN0b3J5LmRpc3BsYXkoXCJDcmVhdGVkXCIpO1xuICAgICAgICAvLyB9KVxuICAgIH1cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWxidW1zJywge1xuICAgICAgICB1cmw6ICcvYWxidW1zJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9hbGJ1bXMuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBbGJ1bXNDdHJsJ1xuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2VkaXRBbGJ1bScsIHtcblx0XHR1cmw6ICcvZWRpdEFsYnVtLzphbGJ1bUlkJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL2VkaXQtYWxidW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0VkaXRBbGJ1bUN0cmwnLFxuXHRcdHJlc29sdmU6IHtcblx0XHRcdGFsYnVtOiAoQWxidW1GYWN0b3J5LCAkc3RhdGVQYXJhbXMpID0+IHtcblx0XHRcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaE9uZSgkc3RhdGVQYXJhbXMuYWxidW1JZClcblx0XHRcdH1cblx0XHR9XG5cdH0pXG59KTtcblxuXG5hcHAuY29udHJvbGxlcignRWRpdEFsYnVtQ3RybCcsICgkc2NvcGUsIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSwgRGlhbG9nRmFjdG9yeSwgYWxidW0pID0+IHtcblx0JHNjb3BlLmFkZGluZ1BpY3R1cmVzID0gZmFsc2U7XG5cblx0bGV0IHNldERhdGUgPSAoKSA9PiB7XG5cdFx0YWxidW0uZGF0ZSA9IG5ldyBEYXRlKGFsYnVtLmRhdGUpO1xuXHRcdCRzY29wZS5hbGJ1bSA9IGFsYnVtO1xuXHR9XG5cdHNldERhdGUoKTtcblxuXHQkc2NvcGUuc2F2ZUFsYnVtID0oKSA9PiB7XG5cdFx0QWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5hbGJ1bSlcblx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0JHNjb3BlLmFsYnVtID0gcmVzO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gZmFsc2U7XG5cdFx0XHREaWFsb2dGYWN0b3J5LmRpc3BsYXkoJ1NhdmVkJywgMTAwMCk7XG5cdFx0fSlcblx0fVxuXG5cdCRzY29wZS5hZGRQaG90b3MgPSAoKSA9PiB7XG5cdFx0Y29uc29sZS5sb2coJ2FkZGluZycpO1xuXHRcdFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKS50aGVuKHBob3RvcyA9PiB7XG5cdFx0XHRjb25zb2xlLmxvZygncGhvdG9zJywgcGhvdG9zKTtcblx0XHRcdCRzY29wZS5zZWxlY3RpbmdQaWN0dXJlcyA9IHRydWU7XG5cdFx0XHQkc2NvcGUucGhvdG9zID0gcGhvdG9zO1xuXHRcdH0pXG5cdH1cblxuXHQkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuXHRcdGNvbnNvbGUubG9nKFwiYWRkZWRcIiwgcGhvdG8pO1xuICAgICAgICAkc2NvcGUuYWxidW0ucGhvdG9zLnB1c2gocGhvdG8uX2lkKTtcbiAgICAgICAgQWxidW1GYWN0b3J5LmFkZFBob3RvKGFsYnVtLl9pZCwgcGhvdG8uX2lkKVxuICAgIH1cbn0pIiwiYXBwLmNvbnRyb2xsZXIoJ05ld0FsYnVtQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBTZXNzaW9uLCBEaWFsb2dGYWN0b3J5LCBBdXRoU2VydmljZSkgPT4ge1xuXHRjb25zb2xlLmxvZygnU2Vzc2lvbicsIFNlc3Npb24pO1xuXHQkc2NvcGUuc2hvd1Bob3RvcyA9IGZhbHNlO1xuXG5cdCRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgaWYoU2Vzc2lvbi51c2VyKSB7XG5cdFx0ICAkc2NvcGUuYWxidW0ub3duZXIgPSBTZXNzaW9uLnVzZXIuX2lkO1xuICAgICAgICB9XG5cdFx0Y29uc29sZS5sb2coJHNjb3BlLmFsYnVtKTtcblxuICAgICAgICBBbGJ1bUZhY3RvcnkuY3JlYXRlQWxidW0oJHNjb3BlLmFsYnVtKVxuICAgIH1cblxuXG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgIFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCcsIDc1MCk7XG4gICAgICAgICRzY29wZS5hbGJ1bS5waG90b3MucHVzaChwaG90byk7XG4gICAgICAgICRzY29wZS5hbGJ1bS5jb3ZlciA9IHBob3RvO1xuICAgIH1cblxuICAgICRzY29wZS5zYXZlQWxidW0gPSAoKSA9PiB7XG4gICAgXHRBbGJ1bUZhY3RvcnkudXBkYXRlQWxidW0oJHNjb3BlLmFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICBcdFx0JHN0YXRlLmdvKCdhbGJ1bXMnKTtcbiAgICBcdH0pXG4gICAgfVxufSk7IiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ25ld0FsYnVtJywge1xuXHRcdHVybDogJy9uZXdBbGJ1bScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9hbGJ1bS9uZXctYWxidW0uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ05ld0FsYnVtQ3RybCdcblx0fSlcbn0pO1xuXG4iLCJhcHAuY29udHJvbGxlcignU2luZ2xlQWxidW1DdHJsJywgKCRzY29wZSwgJHRpbWVvdXQsICRzdGF0ZSwgYWxidW0sIEFkbWluRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5KSA9PiB7XG5cdCRzY29wZS5hbGJ1bSA9IGFsYnVtO1xuXHQkc2NvcGUuc2VsZWN0aW5nQ292ZXIgPSBmYWxzZTtcblx0JHNjb3BlLmNoYW5nZXNNYWRlID0gZmFsc2U7XG5cdCRzY29wZS5yZW1vdmVQaG90b3MgPSBmYWxzZTtcblxuXG5cdGNvbnNvbGUubG9nKFwicGhvdG9zOiBcIiwgYWxidW0ucGhvdG9zKTtcblx0JHNjb3BlLnBob3RvcyA9IGFsYnVtLnBob3Rvcztcblx0JHNjb3BlLnJlbW92ZUZyb21BbGJ1bSA9IChwaG90bykgPT4ge1xuXHRcdGxldCBwaG90b0luZGV4ID0gJHNjb3BlLmFsYnVtLnBob3Rvcy5pbmRleE9mKHBob3RvKTtcblx0XHQkc2NvcGUuYWxidW0ucGhvdG9zLnNwbGljZShwaG90b0luZGV4LCAxKTtcblx0fVxuXG5cdCRzY29wZS5kZWxldGVQaG90b3MgPSAoKSA9PiB7XG5cdFx0JHNjb3BlLnJlbW92ZVBob3RvcyA9IHRydWU7XG5cdH1cblxuXHQkc2NvcGUuc2VsZWN0Q292ZXIgPSAoKSA9PiB7XG5cdFx0JHRpbWVvdXQoKCkgPT4ge1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ0NvdmVyID0gdHJ1ZTtcblx0XHRcdCRzY29wZS5jaGFuZ2VzTWFkZSA9IHRydWU7XG5cdFx0fSwgNTAwKTtcblx0fVxuXG5cdCRzY29wZS5hZGRDb3ZlciA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuYWxidW0uY292ZXIgPSBwaG90by5faWQ7XG4gICAgICAgICRzY29wZS5zZWxlY3RpbmdDb3ZlciA9IGZhbHNlO1xuICAgIH1cblxuXHQkc2NvcGUudXBkYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS51cGRhdGVBbGJ1bSgkc2NvcGUuYWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnYWRtaW4nKTtcbiAgICAgICAgfSlcbiAgICB9XG5cblxuICAgICRzY29wZS5mZXRjaFBob3RvcyA9ICgpID0+IHtcbiAgICBcdGNvbnNvbGUubG9nKFwiYWxidW06IFwiLCBhbGJ1bSk7XG4gICAgXHRBbGJ1bUZhY3RvcnkuZmV0Y2hQaG90b3NJbkFsYnVtKGFsYnVtLl9pZClcbiAgICBcdC50aGVuKGFsYnVtID0+IHtcbiAgICBcdFx0Y29uc29sZS5sb2coXCJyZXR1cm5lZDogXCIsIGFsYnVtKTtcbiAgICBcdH0pXG4gICAgfVxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ0F3c0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIEF3c0ZhY3RvcnkpIHtcblxuXHQkc2NvcGUuYWxidW1zID0gQXdzRmFjdG9yeS5hbGJ1bXM7XG5cbiAgICAkc2NvcGUubGlzdEFsYnVtcyA9ICgpID0+IHtcbiAgICAgICBcdEF3c0ZhY3RvcnkubGlzdEFsYnVtc1Byb21pc2UoKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBhbGJ1bXMgPSBkYXRhLkNvbW1vblByZWZpeGVzLm1hcChmdW5jdGlvbihjb21tb25QcmVmaXgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHByZWZpeCA9IGNvbW1vblByZWZpeC5QcmVmaXg7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhbGJ1bU5hbWUgPSBkZWNvZGVVUklDb21wb25lbnQocHJlZml4LnJlcGxhY2UoJy8nLCAnJykpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxidW1OYW1lO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICRzY29wZS4kZGlnZXN0KCk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgfSk7XG4gICAgICAgICRzY29wZS5hbGJ1bXNGZXRjaGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAkc2NvcGUudXBkYXRlID0gQXdzRmFjdG9yeS51cGRhdGVDcmVkZW50aWFscztcblxuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9IChhbGJ1bU5hbWUpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJjcmVhdGluZyBhbGJ1bVwiLCBhbGJ1bU5hbWUpO1xuICAgICAgICBBd3NGYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtTmFtZSk7XG4gICAgfVxuXG5cbiAgICAkc2NvcGUuYWRkUGhvdG8gPSAoYWxidW1OYW1lKSA9PiB7XG5cbiAgICB9XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gQXdzRmFjdG9yeS52aWV3QWxidW07XG5cbiAgICAkc2NvcGUuYWRkUGhvdG8gPSBBd3NGYWN0b3J5LmFkZFBob3RvO1xuXG4gICAgJHNjb3BlLmRlbGV0ZVBob3RvID0gQXdzRmFjdG9yeS5kZWxldGVQaG90bztcblxuICAgICRzY29wZS5kZWxldGVBbGJ1bSA9IEF3c0ZhY3RvcnkuZGVsZXRlQWxidW07XG5cblxuXG4gICAgLy8gdmFyIHVwbG9hZGVyID0gbmV3IHFxLnMzLkZpbmVVcGxvYWRlcih7XG4gICAgLy8gICAgICAgICBkZWJ1ZzogdHJ1ZSxcbiAgICAvLyAgICAgICAgIGVsZW1lbnQ6IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdmaW5lLXVwbG9hZGVyJyksXG4gICAgLy8gICAgICAgICByZXF1ZXN0OiB7XG4gICAgLy8gICAgICAgICAgICAgZW5kcG9pbnQ6ICd7IFlPVVJfQlVDS0VUX05BTUUgfS5zMy5hbWF6b25hd3MuY29tJ1xuICAgIC8vICAgICAgICAgICAgIGFjY2Vzc0tleTogJ3sgWU9VUl9BQ0NFU1NfS0VZIH0nXG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgc2lnbmF0dXJlOiB7XG4gICAgLy8gICAgICAgICAgICAgZW5kcG9pbnQ6ICcvczMvc2lnbmF0dXJlJ1xuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIHVwbG9hZFN1Y2Nlc3M6IHtcbiAgICAvLyAgICAgICAgICAgICBlbmRwb2ludDogJy9zMy9zdWNjZXNzJ1xuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIGlmcmFtZVN1cHBvcnQ6IHtcbiAgICAvLyAgICAgICAgICAgICBsb2NhbEJsYW5rUGFnZVBhdGg6ICcvc3VjY2Vzcy5odG1sJ1xuICAgIC8vICAgICAgICAgfSxcbiAgICAvLyAgICAgICAgIHJldHJ5OiB7XG4gICAgLy8gICAgICAgICAgICBlbmFibGVBdXRvOiB0cnVlIC8vIGRlZmF1bHRzIHRvIGZhbHNlXG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgZGVsZXRlRmlsZToge1xuICAgIC8vICAgICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgLy8gICAgICAgICAgICAgZW5kcG9pbnQ6ICcvczNoYW5kbGVyJ1xuICAgIC8vICAgICAgICAgfVxuICAgIC8vICAgICB9KTtcblxuXG4gICBcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIpIHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F3cycsIHtcblx0XHR1cmw6ICcvYXdzJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2F3cy9hd3MuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0F3c0N0cmwnXG5cdH0pXG59KTsiLCIoZnVuY3Rpb24gKCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgLy8gSG9wZSB5b3UgZGlkbid0IGZvcmdldCBBbmd1bGFyISBEdWgtZG95LlxuICAgIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignSSBjYW5cXCd0IGZpbmQgQW5ndWxhciEnKTtcblxuICAgIHZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnZnNhUHJlQnVpbHQnLCBbXSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIXdpbmRvdy5pbykgdGhyb3cgbmV3IEVycm9yKCdzb2NrZXQuaW8gbm90IGZvdW5kIScpO1xuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xuICAgIH0pO1xuXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cbiAgICAvLyBicm9hZGNhc3QgYW5kIGxpc3RlbiBmcm9tIGFuZCB0byB0aGUgJHJvb3RTY29wZVxuICAgIC8vIGZvciBpbXBvcnRhbnQgZXZlbnRzIGFib3V0IGF1dGhlbnRpY2F0aW9uIGZsb3cuXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcbiAgICAgICAgbG9naW5TdWNjZXNzOiAnYXV0aC1sb2dpbi1zdWNjZXNzJyxcbiAgICAgICAgbG9naW5GYWlsZWQ6ICdhdXRoLWxvZ2luLWZhaWxlZCcsXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcbiAgICAgICAgc2Vzc2lvblRpbWVvdXQ6ICdhdXRoLXNlc3Npb24tdGltZW91dCcsXG4gICAgICAgIG5vdEF1dGhlbnRpY2F0ZWQ6ICdhdXRoLW5vdC1hdXRoZW50aWNhdGVkJyxcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXG4gICAgfSk7XG5cbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xuICAgICAgICB2YXIgc3RhdHVzRGljdCA9IHtcbiAgICAgICAgICAgIDQwMTogQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCxcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcbiAgICAgICAgICAgIDQxOTogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsXG4gICAgICAgICAgICA0NDA6IEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0XG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAgICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChbXG4gICAgICAgICAgICAnJGluamVjdG9yJyxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGluamVjdG9yLmdldCgnQXV0aEludGVyY2VwdG9yJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEsICRzdGF0ZSkge1xuICAgICAgICBmdW5jdGlvbiBvblN1Y2Nlc3NmdWxMb2dpbihyZXNwb25zZSkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xuICAgICAgICAgICAgU2Vzc2lvbi5jcmVhdGUoZGF0YS5pZCwgZGF0YS51c2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cbiAgICAgICAgLy8gYXV0aGVudGljYXRlZCB1c2VyIGlzIGN1cnJlbnRseSByZWdpc3RlcmVkLlxuICAgICAgICB0aGlzLmlzQXV0aGVudGljYXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XG5cbiAgICAgICAgICAgIC8vIElmIGFuIGF1dGhlbnRpY2F0ZWQgc2Vzc2lvbiBleGlzdHMsIHdlXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXG4gICAgICAgICAgICAvLyB3aXRoIGEgcHJvbWlzZS4gVGhpcyBlbnN1cmVzIHRoYXQgd2UgY2FuXG4gICAgICAgICAgICAvLyBhbHdheXMgaW50ZXJmYWNlIHdpdGggdGhpcyBtZXRob2QgYXN5bmNocm9ub3VzbHkuXG5cbiAgICAgICAgICAgIC8vIE9wdGlvbmFsbHksIGlmIHRydWUgaXMgZ2l2ZW4gYXMgdGhlIGZyb21TZXJ2ZXIgcGFyYW1ldGVyLFxuICAgICAgICAgICAgLy8gdGhlbiB0aGlzIGNhY2hlZCB2YWx1ZSB3aWxsIG5vdCBiZSB1c2VkLlxuXG4gICAgICAgICAgICBpZiAodGhpcy5pc0F1dGhlbnRpY2F0ZWQoKSAmJiBmcm9tU2VydmVyICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLndoZW4oU2Vzc2lvbi51c2VyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTWFrZSByZXF1ZXN0IEdFVCAvc2Vzc2lvbi5cbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIDQwMSByZXNwb25zZSwgd2UgY2F0Y2ggaXQgYW5kIGluc3RlYWQgcmVzb2x2ZSB0byBudWxsLlxuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL3Nlc3Npb24nKS50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9naW4gPSBmdW5jdGlvbiAoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAudGhlbihvblN1Y2Nlc3NmdWxMb2dpbilcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ291dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9sb2dvdXQnKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9nb3V0U3VjY2Vzcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG4gICAgYXBwLnNlcnZpY2UoJ1Nlc3Npb24nLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQVVUSF9FVkVOVFMpIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubm90QXV0aGVudGljYXRlZCwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5pZCA9IG51bGw7XG4gICAgICAgIHRoaXMudXNlciA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5jcmVhdGUgPSBmdW5jdGlvbiAoc2Vzc2lvbklkLCB1c2VyKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gc2Vzc2lvbklkO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgICAgIHRoaXMudXNlciA9IG51bGw7XG4gICAgICAgIH07XG5cbiAgICB9KTtcblxufSkoKTtcbiIsImFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyKSA9PiB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicse1xuXHRcdHVybDogJy9sb2dpbicsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9hdXRoL2xvZ2luLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXG5cdH0pXG59KTtcblxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsICgkc2NvcGUsICRzdGF0ZSwgQXV0aFNlcnZpY2UsIERpYWxvZ0ZhY3RvcnkpID0+IHtcblx0JHNjb3BlLmxvZ2luID0gKCkgPT4ge1xuXHRcdGxldCBjcmVkZW50aWFscyA9IHtcblx0XHRcdGVtYWlsOiAkc2NvcGUuZW1haWwsXG5cdFx0XHRwYXNzd29yZDogJHNjb3BlLnBhc3N3b3JkXG5cdFx0fVxuXHRcdEF1dGhTZXJ2aWNlLmxvZ2luKGNyZWRlbnRpYWxzKS50aGVuKChyZXMpID0+IHtcblx0XHRcdCRzdGF0ZS5nbygnaG9tZScpO1xuXHRcdH0pO1xuXHR9XG5cblx0JHNjb3BlLmdldFVzZXIgPSAoKSA9PiB7XG5cdFx0QXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbih1c2VyID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdMb2dpbi5qczogbG9nZ2VkIGluIHVzZXInLCB1c2VyKTtcblx0XHRcdFxuXHRcdH0pXG5cdH1cbn0pIiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xheW91dCcsIHtcblx0XHR1cmw6ICcvbGF5b3V0Jyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2xheW91dC9sYXlvdXQuaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0xheW91dEN0cmwnLFxuXHRcdHJlc29sdmU6IHtcbiAgICAgICAgXHRhbGJ1bXM6IChBbGJ1bUZhY3RvcnksICRzdGF0ZVBhcmFtcykgPT4ge1xuICAgICAgICBcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIFx0fVxuICAgICAgICB9XG5cdH0pXG59KTtcblxuXG5hcHAuY29udHJvbGxlcignTGF5b3V0Q3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgUGhvdG9zRmFjdG9yeSwgYWxidW1zKSB7XG5cdGNvbnNvbGUubG9nKFwiYWxsIGFsYnVtc1wiLCBhbGJ1bXMpO1xuXHQkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuXHQkc2NvcGUuZ2V0RmlsZXMgPSAoKSA9PiB7XG5cdFx0Y29uc29sZS5sb2coXCJnZXR0aW5nIEZpbGVzXCIpO1xuXHRcdFBob3Rvc0ZhY3RvcnkuZ2V0RmlsZXMoKTtcblx0fVxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ0hvbWVDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBob21lUGhvdG9zLCBQaG90b3NGYWN0b3J5KSB7XG4gICAgJHNjb3BlLnVwZGF0ZUFsbCA9ICgpID0+IHtcbiAgICAgICAgUGhvdG9zRmFjdG9yeS51cGRhdGVBbGwoKVxuICAgIH1cblxuICAgICRzY29wZS5nZXRSYW5kb20gPSAoKSA9PiB7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNsaWRlUGhvdG9zID0gaG9tZVBob3RvcztcblxuXG4gICAgJChkb2N1bWVudCkucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAgICAkKFwiI293bC1kZW1vXCIpLm93bENhcm91c2VsKHtcblxuICAgICAgICAgICAgYXV0b1BsYXk6IDMwMDAsIC8vU2V0IEF1dG9QbGF5IHRvIDMgc2Vjb25kc1xuXG4gICAgICAgICAgICAvLyBpdGVtczogMSxcbiAgICAgICAgICAgIG5hdmlnYXRpb246IHRydWUsXG4gICAgICAgICAgICBwYWdpbmF0aW9uOiBmYWxzZSxcbiAgICAgICAgICAgIHNpbmdsZUl0ZW06dHJ1ZVxuXG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cblxufSkiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdob21lJywge1xuICAgICAgICB1cmw6ICcvJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICcvanMvaG9tZS9ob21lLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnSG9tZUN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgIFx0aG9tZVBob3RvczogKFBob3Rvc0ZhY3RvcnkpID0+IHtcbiAgICAgICAgXHRcdHJldHVybiBQaG90b3NGYWN0b3J5LmdldFJhbmRvbSgxMClcbiAgICAgICAgXHR9XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgfSk7XG59KTsiLCJhcHAuY29udHJvbGxlcignUGhvdG9DdHJsJywgKCRzY29wZSwgJHN0YXRlLCBQaG90b3NGYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFVzZXJGYWN0b3J5LCAkd2luZG93LCBwaG90b3MpID0+IHtcbiAgICBsZXQgYWxidW1BcnJheSA9IFtdO1xuICAgICRzY29wZS50aXRsZSA9IFwiV2VsY29tZVwiO1xuICAgICRzY29wZS5waG90b3NHb3QgPSBmYWxzZTtcbiAgICAkc2NvcGUuc2VsZWN0ZWRQYWdlID0gMDtcbiAgICAkc2NvcGUuYWN0aXZlID0gNTtcblxuXG4gICAgLy8gJHNjb3BlLnBob3RvcyA9IHNodWZmbGUocGhvdG9zKTtcbiAgICAkc2NvcGUucGhvdG9QYWdlcyA9IHNwbGl0QXJyYXkoc2h1ZmZsZShwaG90b3MpKTtcblxuICAgIGxldCBwaG90b0FycmF5ID0gW107XG5cbiAgICBmdW5jdGlvbiBzcGxpdEFycmF5KGFycmF5KSB7XG4gICAgXHRsZXQgcmV0dXJuQXJyYXkgPSBbXVxuICAgIFx0bGV0IGNob3BBcnJheSA9IGFycmF5O1xuICAgIFx0d2hpbGUoY2hvcEFycmF5Lmxlbmd0aCkge1xuICAgIFx0XHRsZXQgbmV3Q2h1bmsgPSBjaG9wQXJyYXkuc3BsaWNlKDAsIDIwKVxuICAgIFx0XHRpZihuZXdDaHVuaykge1xuICAgIFx0XHRcdHJldHVybkFycmF5LnB1c2gobmV3Q2h1bmspXG4gICAgXHRcdH1cbiAgICBcdH1cbiAgICBcdHJldHVybiByZXR1cm5BcnJheTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaHVmZmxlKGFycmF5KSB7XG4gICAgICAgIHZhciBjdXJyZW50SW5kZXggPSBhcnJheS5sZW5ndGgsXG4gICAgICAgICAgICB0ZW1wb3JhcnlWYWx1ZSwgcmFuZG9tSW5kZXg7XG5cbiAgICAgICAgd2hpbGUgKDAgIT09IGN1cnJlbnRJbmRleCkge1xuXG4gICAgICAgICAgICByYW5kb21JbmRleCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGN1cnJlbnRJbmRleCk7XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggLT0gMTtcblxuICAgICAgICAgICAgdGVtcG9yYXJ5VmFsdWUgPSBhcnJheVtjdXJyZW50SW5kZXhdO1xuICAgICAgICAgICAgYXJyYXlbY3VycmVudEluZGV4XSA9IGFycmF5W3JhbmRvbUluZGV4XTtcbiAgICAgICAgICAgIGFycmF5W3JhbmRvbUluZGV4XSA9IHRlbXBvcmFyeVZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG5cblxuICAgXG5cblxuICAgICRzY29wZS5zZXRQYWdlID0gKGluZGV4KSA9PiB7XG4gICAgXHQkc2NvcGUuc2VsZWN0ZWRQYWdlID0gaW5kZXg7XG4gICAgfVxuXG4gICAgICRzY29wZS5mb3J3YXJkID0gKCkgPT4ge1xuICAgICBcdGlmKCRzY29wZS5zZWxlY3RlZFBhZ2UgPCAkc2NvcGUucGhvdG9QYWdlcy5sZW5ndGgpIHtcbiAgICBcdFx0JHNjb3BlLnNlbGVjdGVkUGFnZSsrO1xuICAgICBcdH1cbiAgICB9XG5cbiAgICAkc2NvcGUuYmFja3dhcmQgPSAoKSA9PiB7XG4gICAgXHRpZigkc2NvcGUuc2VsZWN0ZWRQYWdlID4gMCkge1xuICAgIFx0XHQkc2NvcGUuc2VsZWN0ZWRQYWdlLS07XG4gICAgIFx0fVxuICAgIH1cblxuXG5cbiAgICAkc2NvcGUub3BlbkdhbGxlcnkgPSAoaW5kZXgpID0+IHtcbiAgIFx0XHRcbiAgIFx0XHRsZXQgc2xpZGVJbmRleCA9IGluZGV4XG4gICAgXHQkc2NvcGUuc2xpZGVJbmRleCA9IGluZGV4O1xuICAgIFx0Y29uc29sZS5sb2coaW5kZXgpO1xuICAgIFx0Ly8gJHNjb3BlLmFjdGl2ZSA9IGluZGV4O1xuICAgICAgICAkc2NvcGUuYWN0aXZlID0gaW5kZXg7XG5cbiAgICBcdGxldCBpbWdBcnJheSA9ICRzY29wZS5waG90b1BhZ2VzWyRzY29wZS5zZWxlY3RlZFBhZ2VdXG4gICBcdCBcdGltZ0FycmF5LmZvckVhY2goZnVuY3Rpb24oZWxlbSwgaW5kZXgpIHtcbiAgIFx0IFx0XHRlbGVtLmlkID0gaW5kZXg7XG4gICBcdCBcdFx0aWYoaW5kZXggPT09IHNsaWRlSW5kZXgpIHtcbiAgIFx0IFx0XHRcdGVsZW0uYWN0aXZlID0gdHJ1ZTtcbiAgIFx0IFx0XHRcdGNvbnNvbGUubG9nKFwiYWN0aXZlOlwiLCBlbGVtKTtcbiAgIFx0IFx0XHR9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBlbGVtLmFjdGl2ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgXHQgXHR9KVxuICAgICAgICBjb25zb2xlLmxvZyhpbWdBcnJheSk7XG4gICAgICAgJHNjb3BlLmdhbGxlcnlQaG90b3MgPSBpbWdBcnJheTtcbiAgICAgICAkc2NvcGUuc2hvd0dhbGxlcnkgPSB0cnVlO1xuICAgICAgIFxuICAgICAgIFxuICAgICAgIC8vICR3aW5kb3cuc2Nyb2xsVG8oMCwgMCk7XG4gICAgfVxuXG4gICAgJHNjb3BlLnNob3cgPSAocGhvdG8pID0+IHtcbiAgIFx0IFx0Ly8gZ2FsbGVyeVBob3RvcygpO1xuICAgXHQgXHRcblxuICAgIH1cblxuICAgICRzY29wZS5jbG9zZUdhbGxlcnkgPSAoKSA9PiB7XG4gICAgICAgICRzY29wZS5zaG93R2FsbGVyeSA9IGZhbHNlO1xuICAgIH1cblxuICAgICRzY29wZS5lZGl0TW9kZSA9IGZhbHNlO1xuXG5cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncGhvdG9zJywge1xuICAgICAgICB1cmw6ICcvcGhvdG9zJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9waG90b3MvcGhvdG9zLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnUGhvdG9DdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgcGhvdG9zOiAoUGhvdG9zRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSA9PiB7XG4gICAgICAgICAgICAgICAgLy8gcmV0dXJuIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICAgICAgICAgIHJldHVybiBQaG90b3NGYWN0b3J5LmZldGNoQWxsUmFuZG9tKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pO1xuXG5cblxuXG5cbiIsImFwcC5jb250cm9sbGVyKCdVcGxvYWRDdHJsJywgKCRzY29wZSwgJHN0YXRlLCBhbGJ1bXMsIFBob3Rvc0ZhY3RvcnksIEFsYnVtRmFjdG9yeSwgRmlsZVVwbG9hZGVyKSA9PiB7XG5cbiAgICBsZXQgYWxidW1DcmVhdGVkID0gZmFsc2U7XG4gICAgbGV0IGFkZFRvQWxidW07XG5cblxuICAgICRzY29wZS5zZWxlY3RlZEFsYnVtID0gbnVsbDtcblxuICAgICRzY29wZS51cGxvYWRBbGJ1bSA9IFwibm9uZVwiO1xuXG4gICAgLy8gJHNjb3BlLnVwbG9hZFVybCA9IFwiL2FwaS91cGxvYWQvcGhvdG8vXCJcbiAgICAkc2NvcGUudXBsb2FkVXJsID0gXCIvYXBpL2F3cy9waG90by9cIlxuXG4gICAgJHNjb3BlLmNyZWF0aW5nQWxidW0gPSBmYWxzZTtcblxuXG4gICAgJHNjb3BlLnNldEFsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzY29wZS5zZWxlY3RlZEFsYnVtID0gYWxidW07XG4gICAgICAgICRzY29wZS51cGxvYWRBbGJ1bSA9IGFsYnVtLl9pZDtcbiAgICAgICAgY29uc29sZS5sb2coJHNjb3BlLnNlbGVjdGVkQWxidW0pO1xuICAgIH1cbiAgICAkc2NvcGUubmV3QWxidW0gPSBmYWxzZTtcbiAgICAkc2NvcGUucGhvdG9BbGJ1bSA9IG51bGw7XG4gICAgJHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAkc2NvcGUuY3JlYXRlQWxidW0gPSAoKSA9PiB7XG4gICAgICAgIGxldCBhbGJ1bSA9IHtcbiAgICAgICAgICAgIHRpdGxlOiAkc2NvcGUuYWxidW1UaXRsZVxuICAgICAgICB9XG4gICAgICAgIGlmKCRzY29wZS5wcml2YXRlKSB7XG4gICAgICAgICAgICBhbGJ1bS5wcml2YXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBBbGJ1bUZhY3RvcnkuY3JlYXRlQWxidW0oYWxidW0pLnRoZW4oYWxidW0gPT4ge1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtcy5wdXNoKGFsYnVtKTtcbiAgICAgICAgICAgICRzY29wZS5zZWxlY3RlZEFsYnVtID0gYWxidW07XG4gICAgICAgICAgICAkc2NvcGUudXBsb2FkQWxidW0gPSBhbGJ1bS5faWQ7XG4gICAgICAgICAgICAkc2NvcGUuY3JlYXRpbmdBbGJ1bSA9IGZhbHNlO1xuICAgICAgICB9KVxuICAgIH1cbiAgICAkc2NvcGUuY2hlY2tBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgaWYgKGFsYnVtQ3JlYXRlZCkge1xuICAgICAgICAgICAgYWRkVG9BbGJ1bSA9IGFsYnVtQ3JlYXRlZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFkZFRvQWxidW0gPSAkc2NvcGUucGhvdG9BbGJ1bVxuICAgICAgICB9XG4gICAgfVxuXG5cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgndXBsb2FkJywge1xuICAgICAgICB1cmw6ICcvdXBsb2FkJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy91cGxvYWQvdXBsb2FkLmh0bWwnLFxuICAgICAgICBjb250cm9sbGVyOiAnVXBsb2FkQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhbGJ1bXM6IChBbGJ1bUZhY3RvcnkpID0+IHtcbiAgICAgICAgXHRcdHJldHVybiBBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKS50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgIFx0XHRcdHJldHVybiBhbGJ1bXM7XG4gICAgICAgIFx0XHR9KVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCAoJHNjb3BlLCAkcm9vdFNjb3BlLCBVc2VyRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUudXNlciA9IHt9O1xuXHQkc2NvcGUuc3VibWl0ID0gKCkgPT4ge1xuXHRcdFVzZXJGYWN0b3J5LmNyZWF0ZVVzZXIoJHNjb3BlLnVzZXIpXG5cdFx0LnRoZW4odXNlciA9PiB7XG5cdFx0XHQkcm9vdFNjb3BlLnVzZXIgPSB1c2VyO1xuXHRcdH0pXG5cdH1cbn0pOyIsImFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyKSA9PiB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJ1xuXHR9KVxufSk7IiwiYXBwLmZhY3RvcnkoJ0RpYWxvZ0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgJG1kRGlhbG9nLCAkdGltZW91dCkgeyBcblx0XG5cblx0bGV0IHNob3dEaWFsb2cgPSAobWVzc2FnZSkgPT4ge1xuXHRcdHZhciBwYXJlbnRFbCA9IGFuZ3VsYXIuZWxlbWVudChkb2N1bWVudC5ib2R5KTtcbiAgICAgICAkbWREaWFsb2cuc2hvdyh7XG4gICAgICAgICBwYXJlbnQ6IHBhcmVudEVsLFxuICAgICAgICAgdGVtcGxhdGU6XG4gICAgICAgICAgICc8bWQtZGlhbG9nIGFyaWEtbGFiZWw9XCJMaXN0IGRpYWxvZ1wiIGlkPVwiZGlhbG9nXCI+JyArXG4gICAgICAgICAgICcgIDxtZC1kaWFsb2ctY29udGVudD4nK1xuICAgICAgICAgICBcdG1lc3NhZ2UgK1xuICAgICAgICAgICAnICA8L21kLWRpYWxvZy1jb250ZW50PicgK1xuICAgICAgICAgICAnPC9tZC1kaWFsb2c+J1xuICAgICAgfSk7XG5cdH1cblxuXG5cdHJldHVybiB7XG5cdFx0ZGlzcGxheTogKG1lc3NhZ2UsIHRpbWVvdXQpID0+IHtcblx0XHRcdHNob3dEaWFsb2cobWVzc2FnZSk7XG5cdFx0XHQkdGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0JG1kRGlhbG9nLmhpZGUoKTtcblx0XHRcdH0sIHRpbWVvdXQpXG5cdFx0fVxuXHR9XG5cblxuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCd6dFNpemUnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cikge1xuICAgICAgICAgICAgbGV0IHNpemUgPSBhdHRyLnp0U2l6ZS5zcGxpdCgneCcpO1xuXG4gICAgICAgICAgICBpZiAoYXR0ci5hYnMpIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZVswXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IHNpemVbMF0gKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzaXplWzFdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IHNpemVbMV0gKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHNpemVbMF0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdtaW4td2lkdGgnOiBzaXplWzBdICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc2l6ZVsxXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21pbi1oZWlnaHQnOiBzaXplWzFdICsgJ3B4J1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgfVxufSk7IiwiYXBwLmZhY3RvcnkoJ0FsYnVtRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkc3RhdGUsICR0aW1lb3V0LCBEaWFsb2dGYWN0b3J5KSB7XG4gICAgbGV0IHN1Y2Nlc3MgPSAodGV4dCkgPT4ge1xuICAgICAgICBEaWFsb2dGYWN0b3J5LmRpc3BsYXkodGV4dCwgNzUwKTtcbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgY3JlYXRlQWxidW06IChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvYWxidW1zLycsIGFsYnVtKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgc3VjY2VzcyhcImNyZWF0ZWRcIik7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJyZXNcIiwgcmVzKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmNhdGNoKGUgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJlcnJvciBzYXZpbmcgYWxidW1cIiwgZSk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgIH0sXG4gICAgICAgIGZldGNoQWxsOiAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2FsYnVtcy8nKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGE7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9LFxuICAgICAgICB1cGRhdGVBbGJ1bTogKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvdXBkYXRlJywgYWxidW0pXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIGZldGNoT25lOiAoYWxidW1JZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9hbGJ1bXMvJysgYWxidW1JZClcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZmluZFVzZXJBbGJ1bXM6ICh1c2VySWQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvYWxidW1zL3VzZXIvJyArIHVzZXJJZCkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIGFkZFBob3RvOiAoYWxidW1JZCwgcGhvdG9JZCkgPT4ge1xuICAgICAgICAgICAgbGV0IG9iaiA9IHt9O1xuICAgICAgICAgICAgb2JqLmFsYnVtSWQgPSBhbGJ1bUlkO1xuICAgICAgICAgICAgb2JqLnBob3RvSWQgPSBwaG90b0lkO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9hcGkvYWxidW1zL2FkZFBob3RvJywgb2JqKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGVBbGJ1bTogKGFsYnVtSWQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvYWxidW1zLycrIGFsYnVtSWQpXG4gICAgICAgIH0sIFxuICAgICAgICBmZXRjaFBob3Rvc0luQWxidW06IChhbGJ1bUlkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2FsYnVtcy9waG90b3MvJyArIGFsYnVtSWQpLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlc1wiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuXG59KSIsImFwcC5mYWN0b3J5KCdBd3NGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcbiAgICBsZXQgc2VydmljZSA9IHt9O1xuXG5cbiAgICAvLyAgICBmdW5jdGlvbiBnZXRIdG1sKHRlbXBsYXRlKSB7XG4gICAgLy8gXHRyZXR1cm4gdGVtcGxhdGUuam9pbignXFxuJyk7XG4gICAgLy8gfVxuXG4gICAgc2VydmljZS5hbGJ1bXMgPSBbXTtcbiAgICB2YXIgYWxidW1CdWNrZXROYW1lID0gJ3p0Zic7XG4gICAgdmFyIGJ1Y2tldFJlZ2lvbiA9ICd1cy13ZXN0LTInO1xuICAgIHZhciBJZGVudGl0eVBvb2xJZCA9ICd1cy13ZXN0LTI6NTYxOWQ4ODAtZDg3NC00MTBiLTljMGMtZTNhMjI2MGYzMmFhJztcbiAgICBsZXQgczM7XG4gICAgQVdTLmNvbmZpZy51cGRhdGUoe1xuICAgICAgICByZWdpb246IGJ1Y2tldFJlZ2lvbixcbiAgICAgICAgY3JlZGVudGlhbHM6IG5ldyBBV1MuQ29nbml0b0lkZW50aXR5Q3JlZGVudGlhbHMoe1xuICAgICAgICAgICAgSWRlbnRpdHlQb29sSWQ6IElkZW50aXR5UG9vbElkXG4gICAgICAgIH0pXG4gICAgfSk7XG5cbiAgICBzMyA9IG5ldyBBV1MuUzMoe1xuICAgICAgICBhcGlWZXJzaW9uOiAnMjAwNi0wMy0wMScsXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgQnVja2V0OiBhbGJ1bUJ1Y2tldE5hbWVcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgc2VydmljZS51cGRhdGVDcmVkZW50aWFscyA9ICgpID0+IHtcbiAgICAgICAgQVdTLmNvbmZpZy51cGRhdGUoe1xuICAgICAgICAgICAgcmVnaW9uOiBidWNrZXRSZWdpb24sXG4gICAgICAgICAgICBjcmVkZW50aWFsczogbmV3IEFXUy5Db2duaXRvSWRlbnRpdHlDcmVkZW50aWFscyh7XG4gICAgICAgICAgICAgICAgSWRlbnRpdHlQb29sSWQ6IElkZW50aXR5UG9vbElkXG4gICAgICAgICAgICB9KVxuICAgICAgICB9KTtcblxuICAgICAgICBzMyA9IG5ldyBBV1MuUzMoe1xuICAgICAgICAgICAgYXBpVmVyc2lvbjogJzIwMDYtMDMtMDEnLFxuICAgICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICAgICAgQnVja2V0OiBhbGJ1bUJ1Y2tldE5hbWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY29uc29sZS5sb2coQVdTLmNvbmZpZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0SHRtbCh0ZW1wbGF0ZSkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUuam9pbignXFxuJyk7XG4gICAgfVxuXG4gICAgc2VydmljZS5saXN0QWxidW1zUHJvbWlzZSA9ICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJsaXN0aW5nIGFsYnVtc1wiKTtcbiAgICAgICAgbGV0IHBhcmFtcyA9IHtcbiAgICAgICAgICAgIERlbGltaXRlcjogJy8nXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgbGlzdFByb21pc2UgPSBzMy5saXN0T2JqZWN0cyhwYXJhbXMpLnByb21pc2UoKVxuXG4gICAgICAgIHJldHVybiBsaXN0UHJvbWlzZTtcbiAgICB9XG5cbiAgICBzZXJ2aWNlLmxpc3RBbGJ1bXMgPSAoKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwibGlzdGluZyBhbGJ1bXNcIik7XG4gICAgICAgIGxldCBwYXJhbXMgPSB7XG4gICAgICAgICAgICBEZWxpbWl0ZXI6ICcvJ1xuICAgICAgICB9XG5cbiAgICAgICAgczMubGlzdE9iamVjdHMoe1xuICAgICAgICAgICAgRGVsaW1pdGVyOiAnLydcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgbGlzdGluZyB5b3VyIGFsYnVtczogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGFsYnVtcyA9IGRhdGEuQ29tbW9uUHJlZml4ZXMubWFwKGZ1bmN0aW9uKGNvbW1vblByZWZpeCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJlZml4ID0gY29tbW9uUHJlZml4LlByZWZpeDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFsYnVtTmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChwcmVmaXgucmVwbGFjZSgnLycsICcnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGJ1bU5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIG1lc3NhZ2UgPSBhbGJ1bXMubGVuZ3RoID9cbiAgICAgICAgICAgICAgICAgICAgZ2V0SHRtbChbXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHA+Q2xpY2sgb24gYW4gYWxidW0gbmFtZSB0byB2aWV3IGl0LjwvcD4nLFxuICAgICAgICAgICAgICAgICAgICAgICAgJzxwPkNsaWNrIG9uIHRoZSBYIHRvIGRlbGV0ZSB0aGUgYWxidW0uPC9wPidcbiAgICAgICAgICAgICAgICAgICAgXSkgOlxuICAgICAgICAgICAgICAgICAgICAnPHA+WW91IGRvIG5vdCBoYXZlIGFueSBhbGJ1bXMuIFBsZWFzZSBDcmVhdGUgYWxidW0uJztcbiAgICAgICAgICAgICAgICB2YXIgaHRtbFRlbXBsYXRlID0gW1xuICAgICAgICAgICAgICAgICAgICAnPGgyPkFsYnVtczwvaDI+JyxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAgICAgJzx1bD4nLFxuICAgICAgICAgICAgICAgICAgICBnZXRIdG1sKGFsYnVtcyksXG4gICAgICAgICAgICAgICAgICAgICc8L3VsPicsXG4gICAgICAgICAgICAgICAgICAgICc8YnV0dG9uIG5nLWNsaWNrPVwiY3JlYXRlQWxidW0ocHJvbXB0KFxcJ0VudGVyIEFsYnVtIE5hbWU6XFwnKSlcIj4nLFxuICAgICAgICAgICAgICAgICAgICAnQ3JlYXRlIE5ldyBBbGJ1bScsXG4gICAgICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nXG4gICAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdhbGJ1bXMnLCBhbGJ1bXMpO1xuICAgICAgICAgICAgICAgIGlmICghYWxidW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VydmljZS5hbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGJ1bXM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXJ2aWNlLmNyZWF0ZUFsYnVtID0gKGFsYnVtTmFtZSkgPT4ge1xuICAgICAgICBhbGJ1bU5hbWUgPSBhbGJ1bU5hbWUudHJpbSgpO1xuICAgICAgICBpZiAoIWFsYnVtTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdBbGJ1bSBuYW1lcyBtdXN0IGNvbnRhaW4gYXQgbGVhc3Qgb25lIG5vbi1zcGFjZSBjaGFyYWN0ZXIuJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGFsYnVtTmFtZS5pbmRleE9mKCcvJykgIT09IC0xKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoJ0FsYnVtIG5hbWVzIGNhbm5vdCBjb250YWluIHNsYXNoZXMuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGFsYnVtS2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KGFsYnVtTmFtZSkgKyAnLyc7XG4gICAgICAgIHMzLmhlYWRPYmplY3Qoe1xuICAgICAgICAgICAgS2V5OiBhbGJ1bUtleVxuICAgICAgICB9LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdBbGJ1bSBhbHJlYWR5IGV4aXN0cy4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChlcnIuY29kZSAhPT0gJ05vdEZvdW5kJykge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIGNyZWF0aW5nIHlvdXIgYWxidW06ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzMy5wdXRPYmplY3Qoe1xuICAgICAgICAgICAgICAgIEtleTogYWxidW1LZXlcbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgY3JlYXRpbmcgeW91ciBhbGJ1bTogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWxlcnQoJ1N1Y2Nlc3NmdWxseSBjcmVhdGVkIGFsYnVtLicpO1xuICAgICAgICAgICAgICAgIHNlcnZpY2Uudmlld0FsYnVtKGFsYnVtTmFtZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VydmljZS52aWV3QWxidW0gPSAoYWxidW1OYW1lKSA9PiB7XG4gICAgICAgIHZhciBhbGJ1bVBob3Rvc0tleSA9IGVuY29kZVVSSUNvbXBvbmVudChhbGJ1bU5hbWUpICsgJy8vJztcbiAgICAgICAgczMubGlzdE9iamVjdHMoe1xuICAgICAgICAgICAgUHJlZml4OiBhbGJ1bVBob3Rvc0tleVxuICAgICAgICB9LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciB2aWV3aW5nIHlvdXIgYWxidW06ICcgKyBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBgdGhpc2AgcmVmZXJlbmNlcyB0aGUgQVdTLlJlc3BvbnNlIGluc3RhbmNlIHRoYXQgcmVwcmVzZW50cyB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgIHZhciBocmVmID0gdGhpcy5yZXF1ZXN0Lmh0dHBSZXF1ZXN0LmVuZHBvaW50LmhyZWY7XG4gICAgICAgICAgICB2YXIgYnVja2V0VXJsID0gaHJlZiArIGFsYnVtQnVja2V0TmFtZSArICcvJztcblxuICAgICAgICAgICAgdmFyIHBob3RvcyA9IGRhdGEuQ29udGVudHMubWFwKGZ1bmN0aW9uKHBob3RvKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBob3RvS2V5ID0gcGhvdG8uS2V5O1xuICAgICAgICAgICAgICAgIHZhciBwaG90b1VybCA9IGJ1Y2tldFVybCArIGVuY29kZVVSSUNvbXBvbmVudChwaG90b0tleSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGdldEh0bWwoW1xuICAgICAgICAgICAgICAgICAgICAnPHNwYW4+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxkaXY+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxpbWcgc3R5bGU9XCJ3aWR0aDoxMjhweDtoZWlnaHQ6MTI4cHg7XCIgc3JjPVwiJyArIHBob3RvVXJsICsgJ1wiLz4nLFxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxkaXY+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxzcGFuIG5nLWNsaWNrPVwiZGVsZXRlUGhvdG8oXFwnJyArIGFsYnVtTmFtZSArIFwiJywnXCIgKyBwaG90b0tleSArICdcXCcpXCI+JyxcbiAgICAgICAgICAgICAgICAgICAgJ1gnLFxuICAgICAgICAgICAgICAgICAgICAnPC9zcGFuPicsXG4gICAgICAgICAgICAgICAgICAgICc8c3Bhbj4nLFxuICAgICAgICAgICAgICAgICAgICBwaG90b0tleS5yZXBsYWNlKGFsYnVtUGhvdG9zS2V5LCAnJyksXG4gICAgICAgICAgICAgICAgICAgICc8L3NwYW4+JyxcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicsXG4gICAgICAgICAgICAgICAgICAgICc8c3Bhbj4nLFxuICAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB2YXIgbWVzc2FnZSA9IHBob3Rvcy5sZW5ndGggP1xuICAgICAgICAgICAgICAgICc8cD5DbGljayBvbiB0aGUgWCB0byBkZWxldGUgdGhlIHBob3RvPC9wPicgOlxuICAgICAgICAgICAgICAgICc8cD5Zb3UgZG8gbm90IGhhdmUgYW55IHBob3RvcyBpbiB0aGlzIGFsYnVtLiBQbGVhc2UgYWRkIHBob3Rvcy48L3A+JztcbiAgICAgICAgICAgIHZhciBodG1sVGVtcGxhdGUgPSBbXG4gICAgICAgICAgICAgICAgJzxoMj4nLFxuICAgICAgICAgICAgICAgICdBbGJ1bTogJyArIGFsYnVtTmFtZSxcbiAgICAgICAgICAgICAgICAnPC9oMj4nLFxuICAgICAgICAgICAgICAgIG1lc3NhZ2UsXG4gICAgICAgICAgICAgICAgJzxkaXY+JyxcbiAgICAgICAgICAgICAgICBnZXRIdG1sKHBob3RvcyksXG4gICAgICAgICAgICAgICAgJzwvZGl2PicsXG4gICAgICAgICAgICAgICAgJzxpbnB1dCBpZD1cInBob3RvdXBsb2FkXCIgdHlwZT1cImZpbGVcIiBhY2NlcHQ9XCJpbWFnZS8qXCI+JyxcbiAgICAgICAgICAgICAgICAnPGJ1dHRvbiBpZD1cImFkZHBob3RvXCIgbmctY2xpY2s9XCJhZGRQaG90byhcXCcnICsgYWxidW1OYW1lICsgJ1xcJylcIj4nLFxuICAgICAgICAgICAgICAgICdBZGQgUGhvdG8nLFxuICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nLFxuICAgICAgICAgICAgICAgICc8YnV0dG9uIG5nLWNsaWNrPVwibGlzdEFsYnVtcygpXCI+JyxcbiAgICAgICAgICAgICAgICAnQmFjayBUbyBBbGJ1bXMnLFxuICAgICAgICAgICAgICAgICc8L2J1dHRvbj4nLFxuICAgICAgICAgICAgXVxuICAgICAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FwcCcpLmlubmVySFRNTCA9IGdldEh0bWwoaHRtbFRlbXBsYXRlKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VydmljZS5hZGRQaG90byA9IChhbGJ1bU5hbWUpID0+IHtcbiAgICBcdGNvbnNvbGUubG9nKFwiYWRkaW5nIHRvIGFsYnVtXCIsIGFsYnVtTmFtZSk7XG4gICAgICAgIHZhciBmaWxlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwaG90b3VwbG9hZCcpLmZpbGVzO1xuICAgICAgICBpZiAoIWZpbGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdQbGVhc2UgY2hvb3NlIGEgZmlsZSB0byB1cGxvYWQgZmlyc3QuJyk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGZpbGUgPSBmaWxlc1swXTtcbiAgICAgICAgdmFyIGZpbGVOYW1lID0gZmlsZS5uYW1lO1xuICAgICAgICB2YXIgYWxidW1QaG90b3NLZXkgPSBlbmNvZGVVUklDb21wb25lbnQoYWxidW1OYW1lKSArICcvLyc7XG5cbiAgICAgICAgdmFyIHBob3RvS2V5ID0gYWxidW1QaG90b3NLZXkgKyBmaWxlTmFtZTtcbiAgICAgICAgczMudXBsb2FkKHtcbiAgICAgICAgICAgIEtleTogcGhvdG9LZXksXG4gICAgICAgICAgICBCb2R5OiBmaWxlLFxuICAgICAgICAgICAgQUNMOiAncHVibGljLXJlYWQnXG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIHVwbG9hZGluZyB5b3VyIHBob3RvOiAnLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhbGVydCgnU3VjY2Vzc2Z1bGx5IHVwbG9hZGVkIHBob3RvLicpO1xuICAgICAgICAgICAgc2VydmljZS52aWV3QWxidW0oYWxidW1OYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VydmljZS5kZWxldGVQaG90byA9IChhbGJ1bU5hbWUsIHBob3RvS2V5KSA9PiB7XG4gICAgICAgIHMzLmRlbGV0ZU9iamVjdCh7XG4gICAgICAgICAgICBLZXk6IHBob3RvS2V5XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIGRlbGV0aW5nIHlvdXIgcGhvdG86ICcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFsZXJ0KCdTdWNjZXNzZnVsbHkgZGVsZXRlZCBwaG90by4nKTtcbiAgICAgICAgICAgIHNlcnZpY2Uudmlld0FsYnVtKGFsYnVtTmFtZSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlcnZpY2UuZGVsZXRlQWxidW0gPSAoYWxidW1OYW1lKSA9PiB7XG4gICAgICAgIHZhciBhbGJ1bUtleSA9IGVuY29kZVVSSUNvbXBvbmVudChhbGJ1bU5hbWUpICsgJy8nO1xuICAgICAgICBzMy5saXN0T2JqZWN0cyh7XG4gICAgICAgICAgICBQcmVmaXg6IGFsYnVtS2V5XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIGRlbGV0aW5nIHlvdXIgYWxidW06ICcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBvYmplY3RzID0gZGF0YS5Db250ZW50cy5tYXAoZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgS2V5OiBvYmplY3QuS2V5XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgczMuZGVsZXRlT2JqZWN0cyh7XG4gICAgICAgICAgICAgICAgRGVsZXRlOiB7XG4gICAgICAgICAgICAgICAgICAgIE9iamVjdHM6IG9iamVjdHMsXG4gICAgICAgICAgICAgICAgICAgIFF1aWV0OiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciBkZWxldGluZyB5b3VyIGFsYnVtOiAnLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGFsZXJ0KCdTdWNjZXNzZnVsbHkgZGVsZXRlZCBhbGJ1bS4nKTtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlLmxpc3RBbGJ1bXMoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cblxuXG5cblxuICAgIHJldHVybiBzZXJ2aWNlO1xufSk7IiwiYXBwLmZhY3RvcnkoJ1Bob3Rvc0ZhY3RvcnknLCAoJGh0dHApID0+IHtcblx0cmV0dXJuIHtcblx0XHRhZGRQaG90bzogKHNyYykgPT4ge1xuXHRcdFx0bGV0IHBob3RvID0ge1xuXHRcdFx0XHRzcmM6IHNyYyxcblx0XHRcdFx0bmFtZTogJ3Rlc3QnXG5cdFx0XHR9XG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3Bob3Rvcy9hZGQnLCBwaG90bylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0c2F2ZVBob3RvOiAocGhvdG8pID0+IHtcblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvcGhvdG9zL3VwZGF0ZScsIHBob3RvKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKHJlcy5kYXRhKTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRmZXRjaEFsbDogKCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MnKVxuXHRcdFx0LnRoZW4ocmVzID0+IHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGZldGNoVGVuOiAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Bob3Rvcy9saW1pdDEwJylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRnZXRGaWxlczogKCkgPT4ge1xuXHRcdFx0JGh0dHAuZ2V0KCcvYXBpL2dldEZpbGVzL2FsYnVtQScpXG5cdFx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlJldHVybmVkOiBcIiwgcmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdHVwZGF0ZUFsbDogKCkgPT4ge1xuXHRcdFx0JGh0dHAucHV0KCcvYXBpL3Bob3Rvcy91cGRhdGVBbGwnKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicmVzOiBcIiwgcmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGdldFJhbmRvbTogKGFtb3VudCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MvcmFuZG9tLycgKyBhbW91bnQpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJyZXM6IFwiLCByZXMuZGF0YSk7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRmZXRjaEFsbFJhbmRvbTogKCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MvcmFuZG9tYWxsJykudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcInJlczogXCIsIHJlcy5kYXRhKTtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pOyIsImFwcC5mYWN0b3J5KCdVc2VyRmFjdG9yeScsICgkaHR0cCwgJHJvb3RTY29wZSwgRGlhbG9nRmFjdG9yeSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdGN1cnJlbnRVc2VyOiAoKSA9PiB7XG5cdFx0XHRsZXQgdXNlciA9IHtcblx0XHRcdFx0bmFtZTogJ0RhbmUnLFxuXHRcdFx0XHRwaWN0dXJlOiAnU29tZXRoaW5nJyxcblx0XHRcdFx0YWxidW1zOiBbJ09uZScsICdUd28nLCAnVGhyZWUnXVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHVzZXJcblx0XHRcdC8vc2VuZCByZXF1ZXN0IGZvciBjdXJyZW50IGxvZ2dlZC1pbiB1c2VyXG5cdFx0fSxcblx0XHRjcmVhdGVVc2VyOiAodXNlcikgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvdXNlcnMvJywgdXNlcikudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRyZXR1cm4gcmVzLmRhdGE7XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0Z2V0VXNlcjogKCkgPT4ge1xuXHRcdFx0bGV0IHVzZXJuYW1lID0gJ2RhbmV0b21zZXRoJztcblx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9hcGkvdXNlcnMvJysgdXNlcm5hbWUpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0JHJvb3RTY29wZS51c2VyID0gcmVzLmRhdGFcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGZvbGxvd0FsYnVtOiAoYWxidW0pID0+IHtcblx0XHRcdGxldCB1c2VyID0gJHJvb3RTY29wZS51c2VyXG5cdFx0XHRpZih1c2VyLmFsYnVtcy5pbmRleE9mKCkgIT09IC0xKSB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdhbGJ1bSBhbHJlYWR5IGV4aXN0cycpO1xuXHRcdFx0fVxuXHRcdFx0dXNlci5hbGJ1bXMucHVzaChhbGJ1bSk7XG5cblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvdXNlcnMvdXBkYXRlJywgdXNlcikudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRpZihyZXMuc3RhdHVzID09PSAyMDApIHtcblx0XHRcdFx0XHREaWFsb2dGYWN0b3J5LmRpc3BsYXkoJ0FkZGVkIFRvIEFsYnVtcycsIDEwMDApXG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdTdGF0dXMgbm90IDIwMCcsIDEwMDApXG5cdFx0XHRcdH1cblx0XHRcdH0pXG5cdFx0fSxcblx0XHRmb2xsb3dQaG90bzogKHBob3RvKSA9PiB7XG5cdFx0XHRsZXQgdXNlciA9ICRyb290U2NvcGUudXNlclxuXHRcdFx0aWYodXNlci5waG90b3MuaW5kZXhPZigpICE9PSAtMSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnUGhvdG8gYWxyZWFkeSBleGlzdHMnKTtcblx0XHRcdH1cblx0XHRcdHVzZXIucGhvdG9zLnB1c2gocGhvdG8pO1xuXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3VzZXJzL3VwZGF0ZScsIHVzZXIpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0aWYocmVzLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCBUbyBQaG90b3MnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnU3RhdHVzIG5vdCAyMDAnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH1cblx0fVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnYWxidW1DYXJkJywgKCRyb290U2NvcGUsICRzdGF0ZSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0Y29udHJvbGxlcjogJ0FsYnVtc0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL2FsYnVtLWNhcmQuaHRtbCcsXG5cdFx0bGluazogKHNjb3BlKSA9PiB7XG5cdFx0XHRzY29wZS5lZGl0QWxidW0gPSAoKSA9PiB7XG5cdFx0XHRcdCRzdGF0ZS5nbygnZWRpdEFsYnVtJywge2FsYnVtSWQ6IHNjb3BlLmFsYnVtLl9pZH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRzY29wZS52aWV3QWxidW0gPSAoKSA9PiB7XG5cdFx0XHRcdCRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogc2NvcGUuYWxidW0uX2lkfSk7XG5cdFx0XHR9XG5cblx0XHRcdHNjb3BlLmFkZFRvRmF2b3JpdGVzID0gKCkgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcImNhbGwgdXNlciBoZXJlXCIpO1xuXHRcdFx0fVxuXHR9XG59XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdzZWxlY3RBbGJ1bScsICgkcm9vdFNjb3BlLCBBd3NGYWN0b3J5KSA9PiB7XG5cdHJldHVybiB7XG5cdFx0cmVzdHJpY3Q6ICdFJyxcblx0XHRjb250cm9sbGVyOiAnQWxidW1zQ3RybCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9hbGJ1bXMvYWxidW0uaHRtbCcsXG5cdFx0bGluazogKHNjb3BlKSA9PiB7XG5cblxuXHRcdFx0c2NvcGUuYWRkUGhvdG8gPSAoYWxidW0pID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ2FsYnVtIGluIGRpcmVjdGl2ZScsIGFsYnVtKTtcblx0XHRcdFx0QXdzRmFjdG9yeS5hZGRQaG90byhhbGJ1bSlcblx0XHRcdH1cblxuXHR9XG59XG59KTsiLCJhcHAuZGlyZWN0aXZlKCd1c2VyQWxidW1zJywgKCRyb290U2NvcGUsICRzdGF0ZSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9hbGJ1bXMvdXNlci1hbGJ1bXMuaHRtbCcsXG5cdFx0bGluazogKHNjb3BlKSA9PiB7XG5cdFx0XHRzY29wZS5lZGl0QWxidW0gPSAoKSA9PiB7XG5cdFx0XHRcdCRzdGF0ZS5nbygnZWRpdEFsYnVtJywge2FsYnVtSWQ6IHNjb3BlLmFsYnVtLl9pZH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRzY29wZS5hZGRUb0Zhdm9yaXRlcyA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJjYWxsIHVzZXIgaGVyZVwiKTtcblx0XHRcdH1cblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnYXdzQWxidW0nLCAoJHJvb3RTY29wZSwgQXdzRmFjdG9yeSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0Y29udHJvbGxlcjogJ0FsYnVtc0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYXdzL2F3cy1hbGJ1bS5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUsIGVsZW1lbnQsIGF0dHIpID0+IHtcblxuXHR9XG59XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdiYW5uZXInLCAoJHJvb3RTY29wZSwgJHN0YXRlLCBTZXNzaW9uLCBVc2VyRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBBdXRoU2VydmljZSkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYmFubmVyL2Jhbm5lci5odG1sJyxcbiAgICAgICAgbGluazogKHNjb3BlKSA9PiB7XG4gICAgICAgICAgICAvLyBVc2VyRmFjdG9yeS5nZXRVc2VyKCkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgIC8vICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgIC8vICAgICByZXR1cm4gQWxidW1GYWN0b3J5LmZpbmRVc2VyQWxidW1zKHVzZXIuX2lkKVxuICAgICAgICAgICAgLy8gfSkudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXIuYWxidW1zLnB1c2goYWxidW1zKTtcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhzY29wZS51c2VyLmFsYnVtcyk7XG4gICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICBVc2VyRmFjdG9yeS5nZXRVc2VyKCkudGhlbih1c2VyID0+IHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzY29wZS51c2VyKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBBbGJ1bUZhY3RvcnkuZmluZFVzZXJBbGJ1bXModXNlci5faWQpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgICAgICAgICBzY29wZS51c2VyQWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgICAgIGlmKHNjb3BlLnVzZXIuYWxidW1zLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyQWxidW1zLnB1c2goc2NvcGUudXNlci5hbGJ1bXMpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNjb3BlLnVzZXJBbGJ1bXMpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgLy8gQWxidW1GYWN0b3J5LmZpbmRVc2VyQWxidW1zKFNlc3Npb24udXNlci5faWQpXG4gICAgICAgICAgICAvLyAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXJBbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAvLyAgICAgY29uc29sZS5sb2coc2NvcGUudXNlckFsYnVtcyk7XG4gICAgICAgICAgICAvLyB9KVxuXG4gICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgICAgIGlmKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmlyc3Q6ICdHdWVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0OiAnJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIHNjb3BlLnNob3dBbGJ1bXMgPSBmYWxzZTtcbiAgICAgICAgICAgIHNjb3BlLnNob3dQaWN0dXJlcyA9IGZhbHNlO1xuXG4gICAgICAgICAgICBzY29wZS5hZGRBbGJ1bXMgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2NvcGUuc2hvd0FsYnVtcyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLmFkZFBpY3R1cmVzID0gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHNjb3BlLnNob3dQaWN0dXJlcyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNjb3BlLnZpZXdBbGJ1bSA9IChhbGJ1bSkgPT4ge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7XG4gICAgICAgICAgICAgICAgICAgIGFsYnVtSWQ6IGFsYnVtLl9pZFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfVxuICAgIH1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3Bob3RvR2FsbGVyeScsIGZ1bmN0aW9uKCR3aW5kb3cpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0FFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9nYWxsZXJ5L2dhbGxlcnkuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBcdC8vIHNjb3BlLmFjdGl2ZSA9IDEwO1xuICAgICAgICAgICAgc2NvcGUuc3RhcnRHYWxsZXJ5ID0gKGl0ZW0pID0+IHtcbiAgICAgICAgICAgIFx0Y29uc29sZS5sb2coaXRlbSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGVsZW1lbnQpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJzbGlkZXNob3dcIikpO1xuICAgICAgICAgICAgJHdpbmRvdy5zY3JvbGxUbygwLCBhbmd1bGFyLmVsZW1lbnQoZWxlbWVudCkub2Zmc2V0VG9wKTtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdmb290ZXJFbGVtJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdBRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvZm9vdGVyL2Zvb3Rlci5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnaW1nTG9hZGluZycsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQUUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2xvYWRlci9pbWdsb2FkaW5nLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbigkcm9vdFNjb3BlLCBBdXRoU2VydmljZSwgQVVUSF9FVkVOVFMsICRzdGF0ZSkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgc2NvcGU6IHt9LFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL25hdmJhci9uYXZiYXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlKSB7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihldmVudCwgdG9TdGF0ZSwgdG9QYXJhbXMsIGZyb21TdGF0ZSwgZnJvbVBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS5jdXJyZW50UGFnZSA9IHRvU3RhdGUubmFtZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG5cbiAgICAgICAgICAgIHNjb3BlLml0ZW1zID0gW3tcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdIb21lJyxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6ICdob21lJ1xuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdQaG90b3MnLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ3Bob3RvcydcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnQWxidW1zJyxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6ICdhbGJ1bXMnXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1VwbG9hZCcsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAndXBsb2FkJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyAsIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgbGFiZWw6ICdOZXcgQWxidW0nLFxuICAgICAgICAgICAgICAgIC8vICAgICBzdGF0ZTogJ25ld0FsYnVtJ1xuICAgICAgICAgICAgICAgIC8vIH0sXG5cbiAgICAgICAgICAgICAgICAvLyB7XG4gICAgICAgICAgICAgICAgLy8gICAgIGxhYmVsOiAnQWRtaW4nLFxuICAgICAgICAgICAgICAgIC8vICAgICBzdGF0ZTogJ2FkbWluJ1xuICAgICAgICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgIF07XG5cbiAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICBzY29wZS5pc0xvZ2dlZEluID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2NvcGUubG9nb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UubG9nb3V0KCkudGhlbihmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG5cblxuICAgICAgICAgICAgdmFyIHNldFVzZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IHVzZXI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgc2V0VXNlcigpO1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dpblN1Y2Nlc3MsIHNldFVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCwgcmVtb3ZlVXNlcik7XG5cbiAgICAgICAgfVxuXG4gICAgfTtcblxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnaW1hZ2VvbmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblxuXG4gICAgICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2Vycm9yJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gYWxlcnQoJ2ltYWdlIGNvdWxkIG5vdCBiZSBsb2FkZWQnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNhbm5vdCBsb2FkIHRodW1iXCIpO1xuICAgICAgICAgICAgICAgIHNjb3BlLnBob3RvLnRodW1iU3JjID0gc2NvcGUucGhvdG8uc3JjO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgZWxlbWVudC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUucGhvdG8udmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIC8vIHNjb3BlLnBob3RvLnZpc2libGUgPSB0cnVlO1xuXG4gICAgICAgICAgICBzY29wZS5pbWFnZUxvYWRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgncGhvdG9FZGl0JywgKFBob3Rvc0ZhY3RvcnkpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vcGhvdG8tZWRpdC5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUsIGVsZW0sIGF0dHIpID0+IHtcblx0XHRcdHNjb3BlLnNhdmVQaG90byA9ICgpID0+IHtcblx0XHRcdFx0UGhvdG9zRmFjdG9yeS5zYXZlUGhvdG8oc2NvcGUucGhvdG8pXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdzaW5nbGVQaG90bycsICgkcm9vdFNjb3BlLCAkc3RhdGUpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdC8vIHNjb3BlOiB7XG5cdFx0Ly8gXHRwaG90bzogJz0nXG5cdFx0Ly8gfSxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL3NpbmdsZS1waG90by5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUpID0+IHtcblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgndXBsb2FkZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0UnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3VwbG9hZC91cGxvYWQuaHRtbCcsXG4gICAgICAgIGxpbms6IChzY29wZSwgZWxlbSwgYXR0cikgPT4ge1xuICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBnYWxsZXJ5VXBsb2FkZXIgPSBuZXcgcXEuRmluZVVwbG9hZGVyKHtcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbmUtdXBsb2FkZXItZ2FsbGVyeVwiKSxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ3FxLXRlbXBsYXRlLWdhbGxlcnknLFxuICAgICAgICAgICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnQ6ICcvYXBpL3VwbG9hZC9waG90by8nKyBzY29wZS51cGxvYWRBbGJ1bVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdGh1bWJuYWlsczoge1xuICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdhaXRpbmdQYXRoOiAnL2Fzc2V0cy9wbGFjZWhvbGRlcnMvd2FpdGluZy1nZW5lcmljLnBuZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBub3RBdmFpbGFibGVQYXRoOiAnL2Fzc2V0cy9wbGFjZWhvbGRlcnMvbm90X2F2YWlsYWJsZS1nZW5lcmljLnBuZydcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdmFsaWRhdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBhbGxvd2VkRXh0ZW5zaW9uczogWydqcGVnJywgJ2pwZycsICdnaWYnLCAncG5nJ11cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuXG4gICAgICAgICAgICBsZXQgdXBkYXRlRW5kcG9pbnQgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgbGV0IGVuZHBvaW50ID0gJy9hcGkvdXBsb2FkL3Bob3RvLycgKyBzY29wZS51cGxvYWRBbGJ1bTtcbiAgICAgICAgICAgICAgICBnYWxsZXJ5VXBsb2FkZXIuc2V0RW5kcG9pbnQoZW5kcG9pbnQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZW5kcG9pbnQgdXBkYXRlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgndXBsb2FkQWxidW0nLCAobmV3VmFsLCBvbGRWYWwpID0+IHtcbiAgICAgICAgICAgICAgICB1cGRhdGVFbmRwb2ludCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
