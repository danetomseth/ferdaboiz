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

app.controller("AdminCtrl", function ($scope, $state, photos, albums, AdminFactory, AlbumFactory, PhotosFactory) {
    $scope.addingPictures = false;

    $scope.editMode = true;

    $scope.photos = photos;
    $scope.albums = albums;
    console.log("albums: ", albums);

    $scope.deletePhoto = function (photo) {
        console.log("in controller: ", photo);
        PhotosFactory.deletePhoto(photo._id);
    };

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
        controller: 'AdminCtrl',
        resolve: {
            photos: function photos(PhotosFactory, $stateParams) {
                // return PhotosFactory.fetchAll()
                return PhotosFactory.fetchAllRandom();
            },
            albums: function albums(AlbumFactory) {
                return AlbumFactory.fetchAll();
            }
        }
        // data: {
        //     authenticate: true
        // }
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
            return $http.get('/api/photos/allPhotos').then(function (res) {
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
            return $http.get('/api/photos/randomize').then(function (res) {
                console.log("res: ", res.data);
                return res.data;
            });
        },
        deletePhoto: function deletePhoto(photoId) {
            console.log("deleteing", photoId);
            return $http['delete']('/api/photos/singlePhoto/' + photoId).then(function (res) {
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
app.directive('footerElem', function () {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/footer/footer.html',
        link: function link(scope, element, attrs) {}
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
app.directive('imgLoading', function () {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/loader/imgloading.html',
        link: function link(scope, element, attrs) {}
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
            }, {
                label: 'Admin',
                state: 'admin'
            }];

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
app.directive('uploader', function () {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/upload/upload.html',
        link: function link(scope, elem, attr) {
            // let uploadUrl = "/api/upload/photo/"
            var uploadUrl = "/api/aws/photo/";
            var galleryUploader = new qq.FineUploader({
                element: document.getElementById("fine-uploader-gallery"),
                template: 'qq-template-gallery',
                request: {
                    endpoint: uploadUrl + scope.uploadAlbum
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
                var endpoint = uploadUrl + scope.uploadAlbum;
                galleryUploader.setEndpoint(endpoint);
                console.log("endpoint updated");
            };
            scope.$watch('uploadAlbum', function (newVal, oldVal) {
                updateEndpoint();
            });
        }

    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFkbWluL2FkbWluLWNvbnRyb2xsZXIuanMiLCJhZG1pbi9hZG1pbi1mYWN0b3J5LmpzIiwiYWRtaW4vYWRtaW4uanMiLCJhbGJ1bS9hbGJ1bS1jb250cm9sbGVyLmpzIiwiYWxidW0vYWxidW0uanMiLCJhbGJ1bS9hbGJ1bXMtY29udHJvbGxlci5qcyIsImFsYnVtL2FsYnVtcy5qcyIsImFsYnVtL2VkaXQtYWxidW0uanMiLCJhbGJ1bS9uZXctYWxidW0tY29udHJvbGxlci5qcyIsImFsYnVtL25ldy1hbGJ1bS5qcyIsImFsYnVtL3NpbmdsZS1hbGJ1bS1jb250cm9sbGVyLmpzIiwiYXdzL2F3cy5jb250cm9sbGVyLmpzIiwiYXdzL2F3cy5qcyIsImF1dGgvYXV0aC5qcyIsImF1dGgvbG9naW4uanMiLCJob21lL2hvbWUuY29udHJvbGxlci5qcyIsImhvbWUvaG9tZS5qcyIsImxheW91dC9sYXlvdXQuanMiLCJwaG90b3MvcGhvdG9zLWNvbnRyb2xsZXIuanMiLCJwaG90b3MvcGhvdG9zLmpzIiwic2lnbnVwL3NpZ251cC1jb250cm9sbGVyLmpzIiwic2lnbnVwL3NpZ251cC5qcyIsInVwbG9hZC91cGxvYWQuY29udHJvbGxlci5qcyIsInVwbG9hZC91cGxvYWQuanMiLCJjb21tb24vZGlhbG9nL2RpYWxvZy1mYWN0b3J5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2V0U2l6ZS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYWxidW0tZmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvYXdzLmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL3Bob3Rvcy1mYWN0b3J5LmpzIiwiY29tbW9uL2ZhY3Rvcmllcy91c2VyLWZhY3RvcnkuanMiLCJjb21tb24vZGlyZWN0aXZlcy9hbGJ1bXMvYWxidW0tY2FyZC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy9hbGJ1bS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy91c2VyLWFsYnVtcy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2F3cy9hbGJ1bS5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Zvb3Rlci9mb290ZXIuanMiLCJjb21tb24vZGlyZWN0aXZlcy9iYW5uZXIvYmFubmVyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvZ2FsbGVyeS9nYWxsZXJ5LmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbG9hZGVyL2ltZ2xvYWRpbmcuanMiLCJjb21tb24vZGlyZWN0aXZlcy9waG90by9pbWFnZW9ubG9hZC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL3Bob3RvLWVkaXQuanMiLCJjb21tb24vZGlyZWN0aXZlcy9waG90by9zaW5nbGUtcGhvdG8uanMiLCJjb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvdXBsb2FkL3VwbG9hZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFBLENBQUE7QUFDQSxNQUFBLENBQUEsR0FBQSxHQUFBLE9BQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLG1CQUFBLEVBQUEsV0FBQSxFQUFBLGNBQUEsRUFBQSxXQUFBLEVBQUEsbUJBQUEsRUFBQSxZQUFBLEVBQUEsa0JBQUEsQ0FBQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQSxrQkFBQSxFQUFBOztBQUVBLHFCQUFBLENBQUEsU0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBOztBQUVBLHNCQUFBLENBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxhQUFBLEdBQUE7QUFDQSxZQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGFBQUEsRUFBQSxTQUFBO0FBQ0EsYUFBQSxFQUFBLFNBQUE7QUFDQSxhQUFBLEVBQUEsU0FBQTtBQUNBLGNBQUEsRUFBQSxTQUFBO0FBQ0EsY0FBQSxFQUFBLFNBQUE7QUFDQSxjQUFBLEVBQUEsU0FBQTtBQUNBLGNBQUEsRUFBQSxTQUFBO0tBQ0EsQ0FBQTs7QUFHQSxzQkFBQSxDQUFBLEtBQUEsQ0FBQSxTQUFBLENBQUEsQ0FDQSxjQUFBLENBQUEsTUFBQSxDQUFBLENBQ0EsYUFBQSxDQUFBLFFBQUEsQ0FBQSxDQUNBLFdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7O0FBR0EsR0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLFVBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBOzs7QUFHQSxRQUFBLDRCQUFBLEdBQUEsU0FBQSw0QkFBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsS0FBQSxDQUFBLElBQUEsSUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsQ0FBQTtLQUNBLENBQUE7Ozs7QUFJQSxjQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFFBQUEsRUFBQTs7QUFFQSxZQUFBLENBQUEsNEJBQUEsQ0FBQSxPQUFBLENBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7QUFFQSxZQUFBLFdBQUEsQ0FBQSxlQUFBLEVBQUEsRUFBQTs7O0FBR0EsbUJBQUE7U0FDQTs7O0FBR0EsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBOzs7Ozs7Ozs7O1NBVUEsQ0FBQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxDQUFBOztBQ3pFQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxXQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxNQUFBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxpQkFBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EscUJBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsS0FBQSxHQUFBO0FBQ0EsaUJBQUEsRUFBQSxNQUFBLENBQUEsUUFBQTtTQUNBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFFBQUEsR0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsaUJBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLEVBQUEsQ0FBQSxhQUFBLEVBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLEdBQUEsRUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsWUFBQSxHQUFBLFlBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLGNBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUMxREEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLEVBRUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ0pBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEscUJBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsdUJBQUEsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBO2FBQ0E7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsQ0FBQSxRQUFBLEVBQUEsQ0FBQTthQUNBO1NBQ0E7Ozs7S0FJQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNsQkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsY0FBQSxHQUFBLEtBQUEsQ0FBQTs7QUFFQSxnQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFFBQUEsR0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLEtBQUEsR0FBQTtBQUNBLGlCQUFBLEVBQUEsTUFBQSxDQUFBLFFBQUE7U0FDQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EseUJBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsaUJBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxNQUFBLEdBQUEsTUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBLEVBRUEsQ0FBQTs7QUFHQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsWUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EseUJBQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxZQUFBO0FBQ0Esc0JBQUEsQ0FBQSxNQUFBLEVBQUEsQ0FBQTthQUNBLEVBQUEsSUFBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsRUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBSUEsQ0FBQSxDQUFBOztBQzlEQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLGlCQUFBO0FBQ0EsbUJBQUEsRUFBQSw0QkFBQTtBQUNBLGtCQUFBLEVBQUEsaUJBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxpQkFBQSxFQUFBLGVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQTtBQUNBLHVCQUFBLFlBQUEsQ0FBQSxRQUFBLENBQUEsWUFBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQTs7S0FFQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FDYkEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsUUFBQSxFQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxXQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLGNBQUEsQ0FBQSxFQUFBLENBQUEsVUFBQSxDQUFBLENBQUE7Ozs7Ozs7S0FPQSxDQUFBO0NBRUEsQ0FBQSxDQUFBO0FDekJBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsc0JBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNOQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsV0FBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLHFCQUFBO0FBQ0EsbUJBQUEsRUFBQSwwQkFBQTtBQUNBLGtCQUFBLEVBQUEsZUFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGlCQUFBLEVBQUEsZUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsdUJBQUEsWUFBQSxDQUFBLFFBQUEsQ0FBQSxZQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQUdBLEdBQUEsQ0FBQSxVQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUEsYUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLFFBQUEsT0FBQSxHQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsYUFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxXQUFBLEVBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxpQkFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLHlCQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsUUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxFQUFBLE1BQUEsQ0FBQSxDQUFBO0FBQ0Esa0JBQUEsQ0FBQSxpQkFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFVBQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLG9CQUFBLENBQUEsUUFBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQzlDQSxHQUFBLENBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsWUFBQSxFQUFBLGFBQUEsRUFBQSxPQUFBLEVBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFdBQUEsQ0FBQSxHQUFBLENBQUEsU0FBQSxFQUFBLE9BQUEsQ0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFVBQUEsR0FBQSxLQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxPQUFBLENBQUEsSUFBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsS0FBQSxHQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUEsR0FBQSxDQUFBO1NBQ0E7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTs7QUFFQSxvQkFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUlBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxxQkFBQSxDQUFBLE9BQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUMxQkEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxXQUFBO0FBQ0EsbUJBQUEsRUFBQSx5QkFBQTtBQUNBLGtCQUFBLEVBQUEsY0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNOQSxHQUFBLENBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsUUFBQSxFQUFBLE1BQUEsRUFBQSxLQUFBLEVBQUEsWUFBQSxFQUFBLFlBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxjQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFdBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTs7QUFHQSxXQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxLQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsZUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsWUFBQSxVQUFBLEdBQUEsTUFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFlBQUEsR0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLFlBQUEsR0FBQSxJQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsWUFBQTtBQUNBLGtCQUFBLENBQUEsY0FBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsV0FBQSxHQUFBLElBQUEsQ0FBQTtTQUNBLEVBQUEsR0FBQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxjQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLGNBQUEsR0FBQSxLQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsWUFBQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEVBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBR0EsVUFBQSxDQUFBLFdBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsS0FBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLGtCQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxLQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUM1Q0EsR0FBQSxDQUFBLFVBQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBOztBQUVBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsVUFBQSxDQUFBLE1BQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSxrQkFBQSxDQUFBLGlCQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxNQUFBLEdBQUEsSUFBQSxDQUFBLGNBQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxZQUFBLEVBQUE7QUFDQSxvQkFBQSxNQUFBLEdBQUEsWUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLG9CQUFBLFNBQUEsR0FBQSxrQkFBQSxDQUFBLE1BQUEsQ0FBQSxPQUFBLENBQUEsR0FBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxTQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLE9BQUEsRUFBQSxDQUFBO1NBQ0EsQ0FBQSxTQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxHQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxhQUFBLEdBQUEsSUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsTUFBQSxHQUFBLFVBQUEsQ0FBQSxpQkFBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLEVBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLFdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBR0EsVUFBQSxDQUFBLFFBQUEsR0FBQSxVQUFBLFNBQUEsRUFBQSxFQUVBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFNBQUEsR0FBQSxVQUFBLENBQUEsU0FBQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxDQUFBLFFBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQStCQSxDQUFBLENBQUE7QUNwRUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxNQUFBO0FBQ0EsbUJBQUEsRUFBQSxpQkFBQTtBQUNBLGtCQUFBLEVBQUEsU0FBQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ05BLENBQUEsWUFBQTs7QUFFQSxnQkFBQSxDQUFBOzs7QUFHQSxRQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLHdCQUFBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLEdBQUEsR0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsWUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSxzQkFBQSxDQUFBLENBQUE7QUFDQSxlQUFBLE1BQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLFFBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7Ozs7QUFLQSxPQUFBLENBQUEsUUFBQSxDQUFBLGFBQUEsRUFBQTtBQUNBLG9CQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxFQUFBLG1CQUFBO0FBQ0EscUJBQUEsRUFBQSxxQkFBQTtBQUNBLHNCQUFBLEVBQUEsc0JBQUE7QUFDQSx3QkFBQSxFQUFBLHdCQUFBO0FBQ0EscUJBQUEsRUFBQSxxQkFBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsRUFBQSxFQUFBLFdBQUEsRUFBQTtBQUNBLFlBQUEsVUFBQSxHQUFBO0FBQ0EsZUFBQSxFQUFBLFdBQUEsQ0FBQSxnQkFBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsYUFBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtBQUNBLGVBQUEsRUFBQSxXQUFBLENBQUEsY0FBQTtTQUNBLENBQUE7QUFDQSxlQUFBO0FBQ0EseUJBQUEsRUFBQSx1QkFBQSxRQUFBLEVBQUE7QUFDQSwwQkFBQSxDQUFBLFVBQUEsQ0FBQSxVQUFBLENBQUEsUUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQTthQUNBO1NBQ0EsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsYUFBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxZQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsV0FBQSxFQUNBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsbUJBQUEsU0FBQSxDQUFBLEdBQUEsQ0FBQSxpQkFBQSxDQUFBLENBQUE7U0FDQSxDQUNBLENBQUEsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxPQUFBLENBQUEsT0FBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxFQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsaUJBQUEsaUJBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsUUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxFQUFBLEVBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxVQUFBLENBQUEsV0FBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsSUFBQSxDQUFBLElBQUEsQ0FBQTtTQUNBOzs7O0FBSUEsWUFBQSxDQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsQ0FBQSxDQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxlQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUE7Ozs7Ozs7Ozs7QUFVQSxnQkFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLElBQUEsVUFBQSxLQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLEVBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0E7Ozs7O0FBS0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsaUJBQUEsQ0FBQSxTQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUVBLENBQUE7O0FBRUEsWUFBQSxDQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxpQkFBQSxDQUFBLFNBQ0EsQ0FBQSxZQUFBO0FBQ0EsdUJBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxFQUFBLE9BQUEsRUFBQSw0QkFBQSxFQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxDQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxTQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7QUFDQSwwQkFBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBOztBQUVBLE9BQUEsQ0FBQSxPQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQTs7QUFFQSxZQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGdCQUFBLEVBQUEsWUFBQTtBQUNBLGdCQUFBLENBQUEsT0FBQSxFQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7O0FBRUEsa0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxZQUFBLENBQUEsRUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFlBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLFlBQUEsQ0FBQSxNQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQTs7QUFFQSxZQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxnQkFBQSxDQUFBLEVBQUEsR0FBQSxJQUFBLENBQUE7QUFDQSxnQkFBQSxDQUFBLElBQUEsR0FBQSxJQUFBLENBQUE7U0FDQSxDQUFBO0tBRUEsQ0FBQSxDQUFBO0NBRUEsQ0FBQSxFQUFBLENBQUE7O0FDbklBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsUUFBQTtBQUNBLG1CQUFBLEVBQUEsb0JBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7O0FBRUEsR0FBQSxDQUFBLFVBQUEsQ0FBQSxXQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLFdBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsS0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLFdBQUEsR0FBQTtBQUNBLGlCQUFBLEVBQUEsTUFBQSxDQUFBLEtBQUE7QUFDQSxvQkFBQSxFQUFBLE1BQUEsQ0FBQSxRQUFBO1NBQ0EsQ0FBQTtBQUNBLG1CQUFBLENBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsRUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxtQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLDBCQUFBLEVBQUEsSUFBQSxDQUFBLENBQUE7U0FFQSxDQUFBLENBQUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDekJBLEdBQUEsQ0FBQSxVQUFBLENBQUEsVUFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxhQUFBLEVBQUE7QUFDQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxxQkFBQSxDQUFBLFNBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsU0FBQSxHQUFBLFlBQUEsRUFDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxDQUFBOztBQUdBLEtBQUEsQ0FBQSxRQUFBLENBQUEsQ0FBQSxLQUFBLENBQUEsWUFBQTs7QUFFQSxTQUFBLENBQUEsV0FBQSxDQUFBLENBQUEsV0FBQSxDQUFBOztBQUVBLG9CQUFBLEVBQUEsSUFBQTs7O0FBR0Esc0JBQUEsRUFBQSxJQUFBO0FBQ0Esc0JBQUEsRUFBQSxLQUFBO0FBQ0Esc0JBQUEsRUFBQSxJQUFBOztTQUVBLENBQUEsQ0FBQTtLQUVBLENBQUEsQ0FBQTtDQUdBLENBQUEsQ0FBQTtBQzNCQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLG9CQUFBO0FBQ0Esa0JBQUEsRUFBQSxVQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esc0JBQUEsRUFBQSxvQkFBQSxhQUFBLEVBQUE7QUFDQSx1QkFBQSxhQUFBLENBQUEsU0FBQSxDQUFBLEVBQUEsQ0FBQSxDQUFBO2FBQ0E7U0FDQTs7S0FFQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNaQSxHQUFBLENBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxFQUFBO0FBQ0EsV0FBQSxFQUFBLFNBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0FBQ0EsZUFBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxnQkFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBO0FBQ0EsdUJBQUEsWUFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUFHQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxhQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxDQUFBLEdBQUEsQ0FBQSxZQUFBLEVBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsZUFBQSxDQUFBLENBQUE7QUFDQSxxQkFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ3JCQSxHQUFBLENBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsYUFBQSxFQUFBLFlBQUEsRUFBQSxXQUFBLEVBQUEsT0FBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFFBQUEsVUFBQSxHQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxLQUFBLEdBQUEsU0FBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFNBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsWUFBQSxHQUFBLENBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLEdBQUEsQ0FBQSxDQUFBOzs7QUFJQSxVQUFBLENBQUEsVUFBQSxHQUFBLFVBQUEsQ0FBQSxPQUFBLENBQUEsTUFBQSxDQUFBLENBQUEsQ0FBQTs7QUFFQSxRQUFBLFVBQUEsR0FBQSxFQUFBLENBQUE7O0FBRUEsYUFBQSxVQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsWUFBQSxXQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsWUFBQSxTQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZUFBQSxTQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsZ0JBQUEsUUFBQSxHQUFBLFNBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxFQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0JBQUEsUUFBQSxFQUFBO0FBQ0EsMkJBQUEsQ0FBQSxJQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7YUFDQTtTQUNBO0FBQ0EsZUFBQSxXQUFBLENBQUE7S0FDQTs7QUFFQSxhQUFBLE9BQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxZQUFBLFlBQUEsR0FBQSxLQUFBLENBQUEsTUFBQTtZQUNBLGNBQUE7WUFBQSxXQUFBLENBQUE7O0FBRUEsZUFBQSxDQUFBLEtBQUEsWUFBQSxFQUFBOztBQUVBLHVCQUFBLEdBQUEsSUFBQSxDQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLEdBQUEsWUFBQSxDQUFBLENBQUE7QUFDQSx3QkFBQSxJQUFBLENBQUEsQ0FBQTs7QUFFQSwwQkFBQSxHQUFBLEtBQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtBQUNBLGlCQUFBLENBQUEsWUFBQSxDQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxXQUFBLENBQUEsR0FBQSxjQUFBLENBQUE7U0FDQTtBQUNBLGVBQUEsS0FBQSxDQUFBO0tBQ0E7O0FBTUEsVUFBQSxDQUFBLE9BQUEsR0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGNBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxVQUFBLENBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLE1BQUEsQ0FBQSxZQUFBLEdBQUEsTUFBQSxDQUFBLFVBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsTUFBQSxDQUFBLFlBQUEsR0FBQSxDQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBOztBQUlBLFVBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7O0FBRUEsWUFBQSxVQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsY0FBQSxDQUFBLFVBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBOztBQUVBLGNBQUEsQ0FBQSxNQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLFlBQUEsUUFBQSxHQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsQ0FBQSxDQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxPQUFBLENBQUEsVUFBQSxJQUFBLEVBQUEsS0FBQSxFQUFBO0FBQ0EsZ0JBQUEsQ0FBQSxFQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsZ0JBQUEsS0FBQSxLQUFBLFVBQUEsRUFBQTtBQUNBLG9CQUFBLENBQUEsTUFBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLFNBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTthQUNBLE1BQ0E7QUFDQSxvQkFBQSxDQUFBLE1BQUEsR0FBQSxLQUFBLENBQUE7YUFDQTtTQUNBLENBQUEsQ0FBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsUUFBQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsYUFBQSxHQUFBLFFBQUEsQ0FBQTtBQUNBLGNBQUEsQ0FBQSxXQUFBLEdBQUEsSUFBQSxDQUFBOzs7S0FJQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxJQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7OztLQUlBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFlBQUEsR0FBQSxZQUFBO0FBQ0EsY0FBQSxDQUFBLFdBQUEsR0FBQSxLQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFVBQUEsQ0FBQSxRQUFBLEdBQUEsS0FBQSxDQUFBO0NBSUEsQ0FBQSxDQUFBO0FDeEdBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLFdBQUE7QUFDQSxlQUFBLEVBQUE7QUFDQSxrQkFBQSxFQUFBLGdCQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsdUJBQUEsYUFBQSxDQUFBLGNBQUEsRUFBQSxDQUFBO2FBQ0E7U0FDQTtLQUNBLENBQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTs7QUNaQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLElBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSxtQkFBQSxDQUFBLFVBQUEsQ0FBQSxNQUFBLENBQUEsSUFBQSxDQUFBLENBQ0EsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1JBLEdBQUEsQ0FBQSxNQUFBLENBQUEsVUFBQSxjQUFBLEVBQUE7QUFDQSxrQkFBQSxDQUFBLEtBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLEVBQUEsU0FBQTtBQUNBLG1CQUFBLEVBQUEsdUJBQUE7QUFDQSxrQkFBQSxFQUFBLFlBQUE7S0FDQSxDQUFBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNOQSxHQUFBLENBQUEsVUFBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUEsTUFBQSxFQUFBLGFBQUEsRUFBQSxZQUFBLEVBQUEsWUFBQSxFQUFBOztBQUVBLFFBQUEsWUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFFBQUEsVUFBQSxZQUFBLENBQUE7O0FBR0EsVUFBQSxDQUFBLGFBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsR0FBQSxNQUFBLENBQUE7OztBQUdBLFVBQUEsQ0FBQSxTQUFBLEdBQUEsaUJBQUEsQ0FBQTs7QUFFQSxVQUFBLENBQUEsYUFBQSxHQUFBLEtBQUEsQ0FBQTs7QUFHQSxVQUFBLENBQUEsUUFBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsY0FBQSxDQUFBLGFBQUEsR0FBQSxLQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsV0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxhQUFBLENBQUEsQ0FBQTtLQUNBLENBQUE7QUFDQSxVQUFBLENBQUEsUUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxVQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLE1BQUEsR0FBQSxNQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLEtBQUEsR0FBQTtBQUNBLGlCQUFBLEVBQUEsTUFBQSxDQUFBLFVBQUE7U0FDQSxDQUFBO0FBQ0EsWUFBQSxNQUFBLFdBQUEsRUFBQTtBQUNBLGlCQUFBLFdBQUEsR0FBQSxJQUFBLENBQUE7U0FDQTtBQUNBLG9CQUFBLENBQUEsV0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsYUFBQSxHQUFBLEtBQUEsQ0FBQTtBQUNBLGtCQUFBLENBQUEsV0FBQSxHQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxrQkFBQSxDQUFBLGFBQUEsR0FBQSxLQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBO0FBQ0EsVUFBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxZQUFBLEVBQUE7QUFDQSxzQkFBQSxHQUFBLFlBQUEsQ0FBQTtTQUNBLE1BQUE7QUFDQSxzQkFBQSxHQUFBLE1BQUEsQ0FBQSxVQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FJQSxDQUFBLENBQUE7QUNoREEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxVQUFBLGNBQUEsRUFBQTtBQUNBLGtCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsRUFBQSxTQUFBO0FBQ0EsbUJBQUEsRUFBQSx1QkFBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtBQUNBLGVBQUEsRUFBQTtBQUNBLGtCQUFBLEVBQUEsZ0JBQUEsWUFBQSxFQUFBO0FBQ0EsdUJBQUEsWUFBQSxDQUFBLFFBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLDJCQUFBLE1BQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQTtTQUNBO0tBQ0EsQ0FBQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBOztBQ2JBLEdBQUEsQ0FBQSxPQUFBLENBQUEsZUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLFNBQUEsRUFBQSxRQUFBLEVBQUE7O0FBR0EsUUFBQSxVQUFBLEdBQUEsU0FBQSxVQUFBLENBQUEsT0FBQSxFQUFBO0FBQ0EsWUFBQSxRQUFBLEdBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7QUFDQSxpQkFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLGtCQUFBLEVBQUEsUUFBQTtBQUNBLG9CQUFBLEVBQ0Esa0RBQUEsR0FDQSx1QkFBQSxHQUNBLE9BQUEsR0FDQSx3QkFBQSxHQUNBLGNBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUdBLFdBQUE7QUFDQSxlQUFBLEVBQUEsaUJBQUEsT0FBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLHNCQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLFlBQUE7QUFDQSx5QkFBQSxDQUFBLElBQUEsRUFBQSxDQUFBO2FBQ0EsRUFBQSxPQUFBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUlBLENBQUEsQ0FBQTtBQzVCQSxHQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQSxNQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBOztBQUVBLGdCQUFBLElBQUEsQ0FBQSxHQUFBLEVBQUE7QUFDQSxvQkFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsMkJBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSw2QkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBO3FCQUNBLENBQUEsQ0FBQTtpQkFDQTs7QUFFQSxvQkFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsMkJBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSw4QkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBO3FCQUNBLENBQUEsQ0FBQTtpQkFDQTthQUNBLE1BQUE7QUFDQSxvQkFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsMkJBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxtQ0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBO3FCQUNBLENBQUEsQ0FBQTtpQkFDQTs7QUFFQSxvQkFBQSxJQUFBLENBQUEsQ0FBQSxDQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsMkJBQUEsQ0FBQSxHQUFBLENBQUE7QUFDQSxvQ0FBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLENBQUEsR0FBQSxJQUFBO3FCQUNBLENBQUEsQ0FBQTtpQkFDQTthQUNBO1NBR0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDbkNBLEdBQUEsQ0FBQSxPQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsS0FBQSxFQUFBLE1BQUEsRUFBQSxRQUFBLEVBQUEsYUFBQSxFQUFBO0FBQ0EsUUFBQSxPQUFBLEdBQUEsU0FBQSxPQUFBLENBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxPQUFBLENBQUEsSUFBQSxFQUFBLEdBQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTtBQUNBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLHFCQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsY0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLEVBQUEsR0FBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxTQUNBLENBQUEsVUFBQSxDQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEtBQUEsQ0FBQSxvQkFBQSxFQUFBLENBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBRUE7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxjQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxtQkFBQSxFQUFBLHFCQUFBLEtBQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsb0JBQUEsRUFBQSxLQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLGtCQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsY0FBQSxHQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLHNCQUFBLEVBQUEsd0JBQUEsTUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQSxtQkFBQSxHQUFBLE1BQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGdCQUFBLEVBQUEsa0JBQUEsT0FBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsR0FBQSxFQUFBLENBQUE7QUFDQSxlQUFBLENBQUEsT0FBQSxHQUFBLE9BQUEsQ0FBQTtBQUNBLGVBQUEsQ0FBQSxPQUFBLEdBQUEsT0FBQSxDQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxzQkFBQSxFQUFBLEdBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLG1CQUFBLEVBQUEscUJBQUEsT0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxVQUFBLENBQUEsY0FBQSxHQUFBLE9BQUEsQ0FBQSxDQUFBO1NBQ0E7QUFDQSwwQkFBQSxFQUFBLDRCQUFBLE9BQUEsRUFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEscUJBQUEsR0FBQSxPQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUMzREEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxRQUFBLE9BQUEsR0FBQSxFQUFBLENBQUE7Ozs7OztBQU9BLFdBQUEsQ0FBQSxNQUFBLEdBQUEsRUFBQSxDQUFBO0FBQ0EsUUFBQSxlQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsUUFBQSxZQUFBLEdBQUEsV0FBQSxDQUFBO0FBQ0EsUUFBQSxjQUFBLEdBQUEsZ0RBQUEsQ0FBQTtBQUNBLFFBQUEsRUFBQSxZQUFBLENBQUE7QUFDQSxPQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsQ0FBQTtBQUNBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsbUJBQUEsRUFBQSxJQUFBLEdBQUEsQ0FBQSwwQkFBQSxDQUFBO0FBQ0EsMEJBQUEsRUFBQSxjQUFBO1NBQ0EsQ0FBQTtLQUNBLENBQUEsQ0FBQTs7QUFFQSxNQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsRUFBQSxDQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0FBQ0EsY0FBQSxFQUFBO0FBQ0Esa0JBQUEsRUFBQSxlQUFBO1NBQ0E7S0FDQSxDQUFBLENBQUE7O0FBRUEsV0FBQSxDQUFBLGlCQUFBLEdBQUEsWUFBQTtBQUNBLFdBQUEsQ0FBQSxNQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0FBQ0EsdUJBQUEsRUFBQSxJQUFBLEdBQUEsQ0FBQSwwQkFBQSxDQUFBO0FBQ0EsOEJBQUEsRUFBQSxjQUFBO2FBQ0EsQ0FBQTtTQUNBLENBQUEsQ0FBQTs7QUFFQSxVQUFBLEdBQUEsSUFBQSxHQUFBLENBQUEsRUFBQSxDQUFBO0FBQ0Esc0JBQUEsRUFBQSxZQUFBO0FBQ0Esa0JBQUEsRUFBQTtBQUNBLHNCQUFBLEVBQUEsZUFBQTthQUNBO1NBQ0EsQ0FBQSxDQUFBOztBQUVBLGVBQUEsQ0FBQSxHQUFBLENBQUEsR0FBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxhQUFBLE9BQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxlQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7S0FDQTs7QUFFQSxXQUFBLENBQUEsaUJBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7QUFDQSxZQUFBLE1BQUEsR0FBQTtBQUNBLHFCQUFBLEVBQUEsR0FBQTtTQUNBLENBQUE7O0FBRUEsWUFBQSxXQUFBLEdBQUEsRUFBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBLENBQUEsQ0FBQSxPQUFBLEVBQUEsQ0FBQTs7QUFFQSxlQUFBLFdBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQSxDQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxDQUFBLEdBQUEsQ0FBQSxnQkFBQSxDQUFBLENBQUE7QUFDQSxZQUFBLE1BQUEsR0FBQTtBQUNBLHFCQUFBLEVBQUEsR0FBQTtTQUNBLENBQUE7O0FBRUEsVUFBQSxDQUFBLFdBQUEsQ0FBQTtBQUNBLHFCQUFBLEVBQUEsR0FBQTtTQUNBLEVBQUEsVUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsZ0JBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsS0FBQSxDQUFBLDBDQUFBLEdBQUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2FBQ0EsTUFBQTtBQUNBLG9CQUFBLE1BQUEsR0FBQSxJQUFBLENBQUEsY0FBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLFlBQUEsRUFBQTtBQUNBLHdCQUFBLE1BQUEsR0FBQSxZQUFBLENBQUEsTUFBQSxDQUFBO0FBQ0Esd0JBQUEsU0FBQSxHQUFBLGtCQUFBLENBQUEsTUFBQSxDQUFBLE9BQUEsQ0FBQSxHQUFBLEVBQUEsRUFBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLDJCQUFBLFNBQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxPQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsR0FDQSxPQUFBLENBQUEsQ0FDQSwyQ0FBQSxFQUNBLDRDQUFBLENBQ0EsQ0FBQSxHQUNBLHFEQUFBLENBQUE7QUFDQSxvQkFBQSxZQUFBLEdBQUEsQ0FDQSxpQkFBQSxFQUNBLE9BQUEsRUFDQSxNQUFBLEVBQ0EsT0FBQSxDQUFBLE1BQUEsQ0FBQSxFQUNBLE9BQUEsRUFDQSxnRUFBQSxFQUNBLGtCQUFBLEVBQ0EsV0FBQSxDQUNBLENBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxRQUFBLEVBQUEsTUFBQSxDQUFBLENBQUE7QUFDQSxvQkFBQSxDQUFBLE1BQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSwyQkFBQSxLQUFBLENBQUE7aUJBQ0EsTUFBQTtBQUNBLDJCQUFBLENBQUEsTUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLDJCQUFBLE1BQUEsQ0FBQTtpQkFDQTthQUNBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFFQSxXQUFBLENBQUEsV0FBQSxHQUFBLFVBQUEsU0FBQSxFQUFBO0FBQ0EsaUJBQUEsR0FBQSxTQUFBLENBQUEsSUFBQSxFQUFBLENBQUE7QUFDQSxZQUFBLENBQUEsU0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLDREQUFBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsWUFBQSxTQUFBLENBQUEsT0FBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLHFDQUFBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsWUFBQSxRQUFBLEdBQUEsa0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxHQUFBLENBQUE7QUFDQSxVQUFBLENBQUEsVUFBQSxDQUFBO0FBQ0EsZUFBQSxFQUFBLFFBQUE7U0FDQSxFQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLENBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsS0FBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQTthQUNBO0FBQ0EsZ0JBQUEsR0FBQSxDQUFBLElBQUEsS0FBQSxVQUFBLEVBQUE7QUFDQSx1QkFBQSxLQUFBLENBQUEsMENBQUEsR0FBQSxHQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTtBQUNBLGNBQUEsQ0FBQSxTQUFBLENBQUE7QUFDQSxtQkFBQSxFQUFBLFFBQUE7YUFDQSxFQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLG9CQUFBLEdBQUEsRUFBQTtBQUNBLDJCQUFBLEtBQUEsQ0FBQSwwQ0FBQSxHQUFBLEdBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTtpQkFDQTtBQUNBLHFCQUFBLENBQUEsNkJBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxTQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUEsQ0FBQSxTQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxZQUFBLGNBQUEsR0FBQSxrQkFBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLElBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxXQUFBLENBQUE7QUFDQSxrQkFBQSxFQUFBLGNBQUE7U0FDQSxFQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEtBQUEsQ0FBQSx5Q0FBQSxHQUFBLEdBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBOztBQUVBLGdCQUFBLElBQUEsR0FBQSxJQUFBLENBQUEsT0FBQSxDQUFBLFdBQUEsQ0FBQSxRQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsZ0JBQUEsU0FBQSxHQUFBLElBQUEsR0FBQSxlQUFBLEdBQUEsR0FBQSxDQUFBOztBQUVBLGdCQUFBLE1BQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLG9CQUFBLFFBQUEsR0FBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0Esb0JBQUEsUUFBQSxHQUFBLFNBQUEsR0FBQSxrQkFBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsT0FBQSxDQUFBLENBQ0EsUUFBQSxFQUNBLE9BQUEsRUFDQSw4Q0FBQSxHQUFBLFFBQUEsR0FBQSxLQUFBLEVBQ0EsUUFBQSxFQUNBLE9BQUEsRUFDQSxnQ0FBQSxHQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsUUFBQSxHQUFBLE9BQUEsRUFDQSxHQUFBLEVBQ0EsU0FBQSxFQUNBLFFBQUEsRUFDQSxRQUFBLENBQUEsT0FBQSxDQUFBLGNBQUEsRUFBQSxFQUFBLENBQUEsRUFDQSxTQUFBLEVBQ0EsUUFBQSxFQUNBLFFBQUEsQ0FDQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7QUFDQSxnQkFBQSxPQUFBLEdBQUEsTUFBQSxDQUFBLE1BQUEsR0FDQSwyQ0FBQSxHQUNBLHFFQUFBLENBQUE7QUFDQSxnQkFBQSxZQUFBLEdBQUEsQ0FDQSxNQUFBLEVBQ0EsU0FBQSxHQUFBLFNBQUEsRUFDQSxPQUFBLEVBQ0EsT0FBQSxFQUNBLE9BQUEsRUFDQSxPQUFBLENBQUEsTUFBQSxDQUFBLEVBQ0EsUUFBQSxFQUNBLHVEQUFBLEVBQ0EsNkNBQUEsR0FBQSxTQUFBLEdBQUEsT0FBQSxFQUNBLFdBQUEsRUFDQSxXQUFBLEVBQ0Esa0NBQUEsRUFDQSxnQkFBQSxFQUNBLFdBQUEsQ0FDQSxDQUFBO0FBQ0Esb0JBQUEsQ0FBQSxjQUFBLENBQUEsS0FBQSxDQUFBLENBQUEsU0FBQSxHQUFBLE9BQUEsQ0FBQSxZQUFBLENBQUEsQ0FBQTtTQUNBLENBQUEsQ0FBQTtLQUNBLENBQUE7O0FBRUEsV0FBQSxDQUFBLFFBQUEsR0FBQSxVQUFBLFNBQUEsRUFBQTtBQUNBLGVBQUEsQ0FBQSxHQUFBLENBQUEsaUJBQUEsRUFBQSxTQUFBLENBQUEsQ0FBQTtBQUNBLFlBQUEsS0FBQSxHQUFBLFFBQUEsQ0FBQSxjQUFBLENBQUEsYUFBQSxDQUFBLENBQUEsS0FBQSxDQUFBO0FBQ0EsWUFBQSxDQUFBLEtBQUEsQ0FBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsdUNBQUEsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxZQUFBLElBQUEsR0FBQSxLQUFBLENBQUEsQ0FBQSxDQUFBLENBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxJQUFBLENBQUEsSUFBQSxDQUFBO0FBQ0EsWUFBQSxjQUFBLEdBQUEsa0JBQUEsQ0FBQSxTQUFBLENBQUEsR0FBQSxJQUFBLENBQUE7O0FBRUEsWUFBQSxRQUFBLEdBQUEsY0FBQSxHQUFBLFFBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxNQUFBLENBQUE7QUFDQSxlQUFBLEVBQUEsUUFBQTtBQUNBLGdCQUFBLEVBQUEsSUFBQTtBQUNBLGVBQUEsRUFBQSxhQUFBO1NBQ0EsRUFBQSxVQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxLQUFBLENBQUEsMkNBQUEsRUFBQSxHQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTtBQUNBLGlCQUFBLENBQUEsOEJBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxTQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBO0FBQ0EsVUFBQSxDQUFBLFlBQUEsQ0FBQTtBQUNBLGVBQUEsRUFBQSxRQUFBO1NBQ0EsRUFBQSxVQUFBLEdBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxnQkFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxLQUFBLENBQUEsMENBQUEsRUFBQSxHQUFBLENBQUEsT0FBQSxDQUFBLENBQUE7YUFDQTtBQUNBLGlCQUFBLENBQUEsNkJBQUEsQ0FBQSxDQUFBO0FBQ0EsbUJBQUEsQ0FBQSxTQUFBLENBQUEsU0FBQSxDQUFBLENBQUE7U0FDQSxDQUFBLENBQUE7S0FDQSxDQUFBOztBQUVBLFdBQUEsQ0FBQSxXQUFBLEdBQUEsVUFBQSxTQUFBLEVBQUE7QUFDQSxZQUFBLFFBQUEsR0FBQSxrQkFBQSxDQUFBLFNBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBLFVBQUEsQ0FBQSxXQUFBLENBQUE7QUFDQSxrQkFBQSxFQUFBLFFBQUE7U0FDQSxFQUFBLFVBQUEsR0FBQSxFQUFBLElBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEtBQUEsQ0FBQSwwQ0FBQSxFQUFBLEdBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTthQUNBO0FBQ0EsZ0JBQUEsT0FBQSxHQUFBLElBQUEsQ0FBQSxRQUFBLENBQUEsR0FBQSxDQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsdUJBQUE7QUFDQSx1QkFBQSxFQUFBLE1BQUEsQ0FBQSxHQUFBO2lCQUNBLENBQUE7YUFDQSxDQUFBLENBQUE7QUFDQSxjQUFBLENBQUEsYUFBQSxDQUFBO0FBQ0Esc0JBQUEsRUFBQTtBQUNBLDJCQUFBLEVBQUEsT0FBQTtBQUNBLHlCQUFBLEVBQUEsSUFBQTtpQkFDQTthQUNBLEVBQUEsVUFBQSxHQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0Esb0JBQUEsR0FBQSxFQUFBO0FBQ0EsMkJBQUEsS0FBQSxDQUFBLDBDQUFBLEVBQUEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBO2lCQUNBO0FBQ0EscUJBQUEsQ0FBQSw2QkFBQSxDQUFBLENBQUE7QUFDQSx1QkFBQSxDQUFBLFVBQUEsRUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0EsQ0FBQSxDQUFBO0tBQ0EsQ0FBQTs7QUFNQSxXQUFBLE9BQUEsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ2pRQSxHQUFBLENBQUEsT0FBQSxDQUFBLGVBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLGtCQUFBLEdBQUEsRUFBQTtBQUNBLGdCQUFBLEtBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsR0FBQTtBQUNBLG9CQUFBLEVBQUEsTUFBQTthQUNBLENBQUE7QUFDQSxpQkFBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLEtBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQSxFQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsaUJBQUEsRUFBQSxtQkFBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLElBQUEsQ0FBQSxvQkFBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsZ0JBQUEsRUFBQSxvQkFBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsdUJBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGdCQUFBLEVBQUEsb0JBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLENBQUEsQ0FDQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7QUFDQSxnQkFBQSxFQUFBLG9CQUFBO0FBQ0EsaUJBQUEsQ0FBQSxHQUFBLENBQUEsc0JBQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLENBQUEsSUFBQSxDQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLGlCQUFBLEVBQUEscUJBQUE7QUFDQSxpQkFBQSxDQUFBLEdBQUEsQ0FBQSx1QkFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsaUJBQUEsRUFBQSxtQkFBQSxNQUFBLEVBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHFCQUFBLEdBQUEsTUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtBQUNBLHNCQUFBLEVBQUEsMEJBQUE7QUFDQSxtQkFBQSxLQUFBLENBQUEsR0FBQSxDQUFBLHVCQUFBLENBQUEsQ0FBQSxJQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxPQUFBLEVBQUE7QUFDQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7QUFDQSxtQkFBQSxLQUFBLFVBQUEsQ0FBQSwwQkFBQSxHQUFBLE9BQUEsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLHVCQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUMzREEsR0FBQSxDQUFBLE9BQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUEsVUFBQSxFQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxtQkFBQSxFQUFBLHVCQUFBO0FBQ0EsZ0JBQUEsSUFBQSxHQUFBO0FBQ0Esb0JBQUEsRUFBQSxNQUFBO0FBQ0EsdUJBQUEsRUFBQSxXQUFBO0FBQ0Esc0JBQUEsRUFBQSxDQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsT0FBQSxDQUFBO2FBQ0EsQ0FBQTtBQUNBLG1CQUFBLElBQUEsQ0FBQTs7U0FFQTtBQUNBLGtCQUFBLEVBQUEsb0JBQUEsSUFBQSxFQUFBO0FBQ0EsbUJBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxhQUFBLEVBQUEsSUFBQSxDQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsdUJBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsZUFBQSxFQUFBLG1CQUFBO0FBQ0EsZ0JBQUEsUUFBQSxHQUFBLGFBQUEsQ0FBQTtBQUNBLG1CQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEsYUFBQSxHQUFBLFFBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLDBCQUFBLENBQUEsSUFBQSxHQUFBLEdBQUEsQ0FBQSxJQUFBLENBQUE7QUFDQSx1QkFBQSxHQUFBLENBQUEsSUFBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBO1NBQ0E7O0FBRUEsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLGdCQUFBLElBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxzQkFBQSxDQUFBLENBQUE7YUFDQTtBQUNBLGdCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLElBQUEsQ0FBQSxtQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG9CQUFBLEdBQUEsQ0FBQSxNQUFBLEtBQUEsR0FBQSxFQUFBO0FBQ0EsaUNBQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtpQkFDQSxNQUNBO0FBQ0EsaUNBQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtpQkFDQTthQUNBLENBQUEsQ0FBQTtTQUNBO0FBQ0EsbUJBQUEsRUFBQSxxQkFBQSxLQUFBLEVBQUE7QUFDQSxnQkFBQSxJQUFBLEdBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQTtBQUNBLGdCQUFBLElBQUEsQ0FBQSxNQUFBLENBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxzQkFBQSxDQUFBLENBQUE7YUFDQTtBQUNBLGdCQUFBLENBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLElBQUEsQ0FBQSxtQkFBQSxFQUFBLElBQUEsQ0FBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUNBLG9CQUFBLEdBQUEsQ0FBQSxNQUFBLEtBQUEsR0FBQSxFQUFBO0FBQ0EsaUNBQUEsQ0FBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtpQkFDQSxNQUNBO0FBQ0EsaUNBQUEsQ0FBQSxPQUFBLENBQUEsZ0JBQUEsRUFBQSxJQUFBLENBQUEsQ0FBQTtpQkFDQTthQUNBLENBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ3pEQSxHQUFBLENBQUEsU0FBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0FBQ0EsbUJBQUEsRUFBQSw2Q0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQTtBQUNBLGlCQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxzQkFBQSxDQUFBLEVBQUEsQ0FBQSxXQUFBLEVBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLEtBQUEsQ0FBQSxHQUFBLEVBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxjQUFBLEdBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNuQkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxhQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsVUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGtCQUFBLEVBQUEsWUFBQTtBQUNBLG1CQUFBLEVBQUEsd0NBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7O0FBR0EsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSx1QkFBQSxDQUFBLEdBQUEsQ0FBQSxvQkFBQSxFQUFBLEtBQUEsQ0FBQSxDQUFBO0FBQ0EsMEJBQUEsQ0FBQSxRQUFBLENBQUEsS0FBQSxDQUFBLENBQUE7YUFDQSxDQUFBO1NBRUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDZkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEsOENBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsV0FBQSxFQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsQ0FBQSxLQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxjQUFBLEdBQUEsWUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLGdCQUFBLENBQUEsQ0FBQTthQUNBLENBQUE7U0FDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNkQSxHQUFBLENBQUEsU0FBQSxDQUFBLFVBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxVQUFBLEVBQUE7QUFDQSxXQUFBO0FBQ0EsZ0JBQUEsRUFBQSxHQUFBO0FBQ0Esa0JBQUEsRUFBQSxZQUFBO0FBQ0EsbUJBQUEsRUFBQSx5Q0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsSUFBQSxFQUFBLEVBRUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDVEEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLElBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsRUFDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNQQSxHQUFBLENBQUEsU0FBQSxDQUFBLFFBQUEsRUFBQSxVQUFBLFVBQUEsRUFBQSxNQUFBLEVBQUEsT0FBQSxFQUFBLFdBQUEsRUFBQSxZQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLG1CQUFBLEVBQUEseUNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUE7Ozs7Ozs7OztBQVNBLHVCQUFBLENBQUEsT0FBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EscUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBOztBQUVBLHVCQUFBLFlBQUEsQ0FBQSxjQUFBLENBQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUNBLElBQUEsQ0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsVUFBQSxHQUFBLE1BQUEsQ0FBQTtBQUNBLG9CQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxDQUFBLE1BQUEsRUFBQTtBQUNBLHlCQUFBLENBQUEsVUFBQSxDQUFBLElBQUEsQ0FBQSxLQUFBLENBQUEsSUFBQSxDQUFBLE1BQUEsQ0FBQSxDQUFBO2lCQUNBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsS0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQSxDQUFBOzs7Ozs7OztBQVFBLHVCQUFBLENBQUEsZUFBQSxFQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0Esb0JBQUEsSUFBQSxFQUFBO0FBQ0EseUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBO2lCQUNBLE1BQ0E7QUFDQSx5QkFBQSxDQUFBLElBQUEsR0FBQTtBQUNBLDZCQUFBLEVBQUEsT0FBQTtBQUNBLDRCQUFBLEVBQUEsRUFBQTtxQkFDQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxVQUFBLEdBQUEsS0FBQSxDQUFBO0FBQ0EsaUJBQUEsQ0FBQSxZQUFBLEdBQUEsS0FBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsU0FBQSxHQUFBLFlBQUE7QUFDQSxxQkFBQSxDQUFBLFVBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsV0FBQSxHQUFBLFlBQUE7QUFDQSxxQkFBQSxDQUFBLFlBQUEsR0FBQSxJQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsU0FBQSxHQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0Esc0JBQUEsQ0FBQSxFQUFBLENBQUEsYUFBQSxFQUFBO0FBQ0EsMkJBQUEsRUFBQSxLQUFBLENBQUEsR0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQSxDQUFBO1NBRUE7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDL0RBLEdBQUEsQ0FBQSxTQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsSUFBQTtBQUNBLG1CQUFBLEVBQUEsMkNBQUE7QUFDQSxZQUFBLEVBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUEsRUFBQTs7QUFFQSxpQkFBQSxDQUFBLFlBQUEsR0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBLElBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFFQSxtQkFBQSxDQUFBLEdBQUEsQ0FBQSxPQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsR0FBQSxDQUFBLFFBQUEsQ0FBQSxjQUFBLENBQUEsV0FBQSxDQUFBLENBQUEsQ0FBQTtBQUNBLG1CQUFBLENBQUEsUUFBQSxDQUFBLENBQUEsRUFBQSxPQUFBLENBQUEsT0FBQSxDQUFBLE9BQUEsQ0FBQSxDQUFBLFNBQUEsQ0FBQSxDQUFBO1NBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDZkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxZQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLElBQUE7QUFDQSxtQkFBQSxFQUFBLDZDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBLEVBQUEsRUFDQTtLQUNBLENBQUE7Q0FDQSxDQUFBLENBQUE7QUNQQSxHQUFBLENBQUEsU0FBQSxDQUFBLGFBQUEsRUFBQSxZQUFBO0FBQ0EsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQSxFQUFBOztBQUdBLG1CQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsdUJBQUEsRUFBQSxNQUFBO2FBQ0EsQ0FBQSxDQUFBOztBQUVBLG1CQUFBLENBQUEsSUFBQSxDQUFBLE9BQUEsRUFBQSxZQUFBOztBQUVBLHVCQUFBLENBQUEsR0FBQSxDQUFBLG1CQUFBLENBQUEsQ0FBQTtBQUNBLHFCQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsR0FBQSxLQUFBLENBQUEsS0FBQSxDQUFBLEdBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTs7QUFHQSxtQkFBQSxDQUFBLEVBQUEsQ0FBQSxNQUFBLEVBQUEsWUFBQTtBQUNBLHFCQUFBLENBQUEsTUFBQSxDQUFBLFlBQUE7QUFDQSx5QkFBQSxDQUFBLEtBQUEsQ0FBQSxPQUFBLEdBQUEsSUFBQSxDQUFBO2lCQUNBLENBQUEsQ0FBQTtBQUNBLHVCQUFBLENBQUEsR0FBQSxDQUFBO0FBQ0EsMkJBQUEsRUFBQSxPQUFBO2lCQUNBLENBQUEsQ0FBQTthQUNBLENBQUEsQ0FBQTs7OztBQUtBLGlCQUFBLENBQUEsV0FBQSxHQUFBLElBQUEsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ2hDQSxHQUFBLENBQUEsU0FBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLGFBQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLDRDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxpQkFBQSxDQUFBLFNBQUEsR0FBQSxZQUFBO0FBQ0EsNkJBQUEsQ0FBQSxTQUFBLENBQUEsS0FBQSxDQUFBLEtBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTtTQUNBO0tBQ0EsQ0FBQTtDQUNBLENBQUEsQ0FBQTtBQ1ZBLEdBQUEsQ0FBQSxTQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLE1BQUEsRUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7Ozs7QUFJQSxtQkFBQSxFQUFBLDhDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLEVBQ0E7S0FDQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBO0FDVkEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxRQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLFdBQUEsRUFBQSxNQUFBLEVBQUE7O0FBRUEsV0FBQTtBQUNBLGdCQUFBLEVBQUEsR0FBQTtBQUNBLGFBQUEsRUFBQSxFQUFBO0FBQ0EsbUJBQUEsRUFBQSx5Q0FBQTtBQUNBLFlBQUEsRUFBQSxjQUFBLEtBQUEsRUFBQTs7QUFFQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxxQkFBQSxFQUNBLFVBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQSxRQUFBLEVBQUEsU0FBQSxFQUFBLFVBQUEsRUFBQTtBQUNBLHFCQUFBLENBQUEsV0FBQSxHQUFBLE9BQUEsQ0FBQSxJQUFBLENBQUE7YUFDQSxDQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxLQUFBLEdBQUEsQ0FBQTtBQUNBLHFCQUFBLEVBQUEsTUFBQTtBQUNBLHFCQUFBLEVBQUEsTUFBQTthQUNBLEVBQUE7QUFDQSxxQkFBQSxFQUFBLFFBQUE7QUFDQSxxQkFBQSxFQUFBLFFBQUE7YUFDQSxFQUFBO0FBQ0EscUJBQUEsRUFBQSxRQUFBO0FBQ0EscUJBQUEsRUFBQSxRQUFBO2FBQ0EsRUFBQTtBQUNBLHFCQUFBLEVBQUEsUUFBQTtBQUNBLHFCQUFBLEVBQUEsUUFBQTthQUNBLEVBQ0E7QUFDQSxxQkFBQSxFQUFBLE9BQUE7QUFDQSxxQkFBQSxFQUFBLE9BQUE7YUFDQSxDQUNBLENBQUE7O0FBRUEsaUJBQUEsQ0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsVUFBQSxHQUFBLFlBQUE7QUFDQSx1QkFBQSxXQUFBLENBQUEsZUFBQSxFQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGlCQUFBLENBQUEsTUFBQSxHQUFBLFlBQUE7QUFDQSwyQkFBQSxDQUFBLE1BQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsMEJBQUEsQ0FBQSxFQUFBLENBQUEsTUFBQSxDQUFBLENBQUE7aUJBQ0EsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTs7QUFJQSxnQkFBQSxPQUFBLEdBQUEsU0FBQSxPQUFBLEdBQUE7QUFDQSwyQkFBQSxDQUFBLGVBQUEsRUFBQSxDQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLHlCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTtpQkFDQSxDQUFBLENBQUE7YUFDQSxDQUFBOztBQUVBLGdCQUFBLFVBQUEsR0FBQSxTQUFBLFVBQUEsR0FBQTtBQUNBLHFCQUFBLENBQUEsSUFBQSxHQUFBLElBQUEsQ0FBQTthQUNBLENBQUE7O0FBRUEsbUJBQUEsRUFBQSxDQUFBOztBQUVBLHNCQUFBLENBQUEsR0FBQSxDQUFBLFdBQUEsQ0FBQSxZQUFBLEVBQUEsT0FBQSxDQUFBLENBQUE7QUFDQSxzQkFBQSxDQUFBLEdBQUEsQ0FBQSxXQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsQ0FBQSxDQUFBO0FBQ0Esc0JBQUEsQ0FBQSxHQUFBLENBQUEsV0FBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLENBQUEsQ0FBQTtTQUVBOztLQUVBLENBQUE7Q0FFQSxDQUFBLENBQUE7QUNuRUEsR0FBQSxDQUFBLFNBQUEsQ0FBQSxVQUFBLEVBQUEsWUFBQTtBQUNBLFdBQUE7QUFDQSxnQkFBQSxFQUFBLEdBQUE7QUFDQSxtQkFBQSxFQUFBLHlDQUFBO0FBQ0EsWUFBQSxFQUFBLGNBQUEsS0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLEVBQUE7O0FBRUEsZ0JBQUEsU0FBQSxHQUFBLGlCQUFBLENBQUE7QUFDQSxnQkFBQSxlQUFBLEdBQUEsSUFBQSxFQUFBLENBQUEsWUFBQSxDQUFBO0FBQ0EsdUJBQUEsRUFBQSxRQUFBLENBQUEsY0FBQSxDQUFBLHVCQUFBLENBQUE7QUFDQSx3QkFBQSxFQUFBLHFCQUFBO0FBQ0EsdUJBQUEsRUFBQTtBQUNBLDRCQUFBLEVBQUEsU0FBQSxHQUFBLEtBQUEsQ0FBQSxXQUFBO2lCQUNBO0FBQ0EsMEJBQUEsRUFBQTtBQUNBLGdDQUFBLEVBQUE7QUFDQSxtQ0FBQSxFQUFBLDBDQUFBO0FBQ0Esd0NBQUEsRUFBQSxnREFBQTtxQkFDQTtpQkFDQTtBQUNBLDBCQUFBLEVBQUE7QUFDQSxxQ0FBQSxFQUFBLENBQUEsTUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLEVBQUEsS0FBQSxDQUFBO2lCQUNBO2FBQ0EsQ0FBQSxDQUFBOztBQUdBLGdCQUFBLGNBQUEsR0FBQSxTQUFBLGNBQUEsR0FBQTtBQUNBLG9CQUFBLFFBQUEsR0FBQSxTQUFBLEdBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQTtBQUNBLCtCQUFBLENBQUEsV0FBQSxDQUFBLFFBQUEsQ0FBQSxDQUFBO0FBQ0EsdUJBQUEsQ0FBQSxHQUFBLENBQUEsa0JBQUEsQ0FBQSxDQUFBO2FBQ0EsQ0FBQTtBQUNBLGlCQUFBLENBQUEsTUFBQSxDQUFBLGFBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSw4QkFBQSxFQUFBLENBQUE7YUFDQSxDQUFBLENBQUE7U0FDQTs7S0FFQSxDQUFBO0NBQ0EsQ0FBQSxDQUFBIiwiZmlsZSI6Im1haW4uanMiLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIHN0cmljdCc7XG53aW5kb3cuYXBwID0gYW5ndWxhci5tb2R1bGUoJ1pURicsIFsnZnNhUHJlQnVpbHQnLCdib290c3RyYXBMaWdodGJveCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICdhbmd1bGFyRmlsZVVwbG9hZCcsICduZ01hdGVyaWFsJywgJ2Frb2VuaWcuZGVja2dyaWQnXSk7XG5cbmFwcC5jb25maWcoZnVuY3Rpb24gKCR1cmxSb3V0ZXJQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICRtZFRoZW1pbmdQcm92aWRlcikge1xuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG4gICAgLy8gSWYgd2UgZ28gdG8gYSBVUkwgdGhhdCB1aS1yb3V0ZXIgZG9lc24ndCBoYXZlIHJlZ2lzdGVyZWQsIGdvIHRvIHRoZSBcIi9cIiB1cmwuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xuICAgICB2YXIgY3VzdG9tUHJpbWFyeSA9IHtcbiAgICAgICAgJzUwJzogJyNkOGJmOGMnLFxuICAgICAgICAnMTAwJzogJyNkMWI1NzknLFxuICAgICAgICAnMjAwJzogJyNjYmFhNjYnLFxuICAgICAgICAnMzAwJzogJyNjNGEwNTMnLFxuICAgICAgICAnNDAwJzogJyNiZDk1NDAnLFxuICAgICAgICAnNTAwJzogJyNhYTg2M2EnLFxuICAgICAgICAnNjAwJzogJyM5Nzc3MzQnLFxuICAgICAgICAnNzAwJzogJyM4NDY4MmQnLFxuICAgICAgICAnODAwJzogJyM3MTU5MjcnLFxuICAgICAgICAnOTAwJzogJyM1ZTRhMjAnLFxuICAgICAgICAnQTEwMCc6ICcjZGVjYTlmJyxcbiAgICAgICAgJ0EyMDAnOiAnI2U1ZDRiMicsXG4gICAgICAgICdBNDAwJzogJyNlYmRmYzUnLFxuICAgICAgICAnQTcwMCc6ICcjNGIzYjFhJ1xuICAgIH07XG4gIFxuXG4gICAkbWRUaGVtaW5nUHJvdmlkZXIudGhlbWUoJ2RlZmF1bHQnKVxuICAgICAgIC5wcmltYXJ5UGFsZXR0ZSgnYmx1ZScpXG4gICAgICAgLmFjY2VudFBhbGV0dGUoJ3B1cnBsZScpXG4gICAgICAgLndhcm5QYWxldHRlKCd5ZWxsb3cnKVxufSk7XG5cbi8vIFRoaXMgYXBwLnJ1biBpcyBmb3IgY29udHJvbGxpbmcgYWNjZXNzIHRvIHNwZWNpZmljIHN0YXRlcy5cbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcblxuICAgIC8vIFRoZSBnaXZlbiBzdGF0ZSByZXF1aXJlcyBhbiBhdXRoZW50aWNhdGVkIHVzZXIuXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgcmV0dXJuIHN0YXRlLmRhdGEgJiYgc3RhdGUuZGF0YS5hdXRoZW50aWNhdGU7XG4gICAgfTtcblxuICAgIC8vICRzdGF0ZUNoYW5nZVN0YXJ0IGlzIGFuIGV2ZW50IGZpcmVkXG4gICAgLy8gd2hlbmV2ZXIgdGhlIHByb2Nlc3Mgb2YgY2hhbmdpbmcgYSBzdGF0ZSBiZWdpbnMuXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xuXG4gICAgICAgIGlmICghZGVzdGluYXRpb25TdGF0ZVJlcXVpcmVzQXV0aCh0b1N0YXRlKSkge1xuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXG4gICAgICAgICAgICAvLyBTaG9ydCBjaXJjdWl0IHdpdGggcmV0dXJuLlxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuY2VsIG5hdmlnYXRpbmcgdG8gbmV3IHN0YXRlLlxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cbiAgICAgICAgICAgIC8vICh0aGUgc2Vjb25kIHRpbWUsIEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpIHdpbGwgd29yaylcbiAgICAgICAgICAgIC8vIG90aGVyd2lzZSwgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW4sIGdvIHRvIFwibG9naW5cIiBzdGF0ZS5cbiAgICAgICAgICAgIC8vJHJvb3RTY29wZS5sb2dnZWRJblVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgLy8gaWYgKHVzZXIpIHtcbiAgICAgICAgICAgIC8vICAgICAkc3RhdGUuZ28odG9TdGF0ZS5uYW1lLCB0b1BhcmFtcyk7XG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gICAgICRzdGF0ZS5nbygnbG9naW4nKTtcbiAgICAgICAgICAgIC8vIH1cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxufSk7XG4iLCJhcHAuY29udHJvbGxlcihcIkFkbWluQ3RybFwiLCAoJHNjb3BlLCAkc3RhdGUsIHBob3RvcywgYWxidW1zLCBBZG1pbkZhY3RvcnksIEFsYnVtRmFjdG9yeSwgUGhvdG9zRmFjdG9yeSkgPT4ge1xuICAgICRzY29wZS5hZGRpbmdQaWN0dXJlcyA9IGZhbHNlO1xuXG5cbiAgICAkc2NvcGUuZWRpdE1vZGUgPSB0cnVlO1xuXG4gICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgIGNvbnNvbGUubG9nKFwiYWxidW1zOiBcIiwgYWxidW1zKTtcblxuICAgICRzY29wZS5kZWxldGVQaG90byA9IChwaG90bykgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImluIGNvbnRyb2xsZXI6IFwiLCBwaG90byk7XG4gICAgICAgIFBob3Rvc0ZhY3RvcnkuZGVsZXRlUGhvdG8ocGhvdG8uX2lkKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuZGVsZXRlQWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LmRlbGV0ZUFsYnVtKGFsYnVtLl9pZCk7XG4gICAgICAgIGxldCBhbGJ1bUluZGV4ID0gJHNjb3BlLmFsYnVtcy5pbmRleE9mKGFsYnVtKTtcbiAgICAgICAgJHNjb3BlLmFsYnVtcy5zcGxpY2UoYWxidW1JbmRleCwgMSk7XG4gICAgfVxuXG4gICAgJHNjb3BlLmNyZWF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBsZXQgYWxidW0gPSB7XG4gICAgICAgICAgICB0aXRsZTogJHNjb3BlLm5ld0FsYnVtXG4gICAgICAgIH1cbiAgICAgICAgQWxidW1GYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICAgICAgICAgICRzY29wZS5hbGJ1bXMucHVzaChhbGJ1bSk7XG4gICAgICAgICAgICAkc2NvcGUubmV3QWxidW0gPSBcIlwiO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRQaG90b3MgPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bSA9IGFsYnVtO1xuICAgICAgICBQaG90b3NGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICBcdCRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cblxuICAgICRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5jdXJyZW50QWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgXHQkc3RhdGUucmVsb2FkKCk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgJHNjb3BlLnVwbG9hZFBob3RvcyA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCd1cGxvYWRQaG90b3MnKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuYWRkVG9BbGJ1bSA9IChwaG90bykgPT4ge1xuICAgICAgICAkc2NvcGUuY3VycmVudEFsYnVtLnBob3Rvcy5wdXNoKHBob3RvLl9pZCk7XG4gICAgfVxufSkiLCJhcHAuZmFjdG9yeShcIkFkbWluRmFjdG9yeVwiLCAoJGh0dHApID0+IHtcblx0cmV0dXJuIHtcblx0XHRcblx0fVxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvYWRtaW4vYWRtaW4uaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pbkN0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBwaG90b3M6IChQaG90b3NGYWN0b3J5LCAkc3RhdGVQYXJhbXMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gUGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGxSYW5kb20oKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbGJ1bXM6IChBbGJ1bUZhY3RvcnkpID0+IHtcbiAgICAgICAgICAgIFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGRhdGE6IHtcbiAgICAgICAgLy8gICAgIGF1dGhlbnRpY2F0ZTogdHJ1ZVxuICAgICAgICAvLyB9XG4gICAgfSk7XG59KTsiLCJhcHAuY29udHJvbGxlcignQWxidW1DdHJsJywgKCRzY29wZSwgJHRpbWVvdXQsICRzdGF0ZSwgQWRtaW5GYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFBob3Rvc0ZhY3RvcnksIERpYWxvZ0ZhY3RvcnkpID0+IHtcbiAgICAkc2NvcGUuYWRkaW5nUGljdHVyZXMgPSBmYWxzZTtcblxuICAgIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtT25lID0gJHNjb3BlLmFsYnVtc1swXTtcbiAgICAgICAgfSk7XG5cbiAgICBQaG90b3NGYWN0b3J5LmZldGNoVGVuKClcbiAgICAgICAgLnRoZW4ocGhvdG9zID0+IHtcbiAgICAgICAgICAgICRzY29wZS5waG90b3MgPSBwaG90b3M7XG4gICAgICAgIH0pO1xuXG4gICAgJHNjb3BlLmRlbGV0ZUFsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgIEFsYnVtRmFjdG9yeS5kZWxldGVBbGJ1bShhbGJ1bS5faWQpO1xuICAgICAgICBsZXQgYWxidW1JbmRleCA9ICRzY29wZS5hbGJ1bXMuaW5kZXhPZihhbGJ1bSk7XG4gICAgICAgICRzY29wZS5hbGJ1bXMuc3BsaWNlKGFsYnVtSW5kZXgsIDEpO1xuICAgIH1cblxuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgbGV0IGFsYnVtID0ge1xuICAgICAgICAgICAgdGl0bGU6ICRzY29wZS5uZXdBbGJ1bVxuICAgICAgICB9XG4gICAgICAgIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bShhbGJ1bSkudGhlbihhbGJ1bSA9PiB7XG4gICAgICAgICAgICBEaWFsb2dGYWN0b3J5LmRpc3BsYXkoXCJDcmVhdGVkXCIpO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRQaG90b3MgPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLmN1cnJlbnRBbGJ1bSA9IGFsYnVtO1xuICAgICAgICBQaG90b3NGYWN0b3J5LmZldGNoQWxsKClcbiAgICAgICAgICAgIC50aGVuKHBob3RvcyA9PiB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnBob3RvcyA9IHBob3RvcztcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcblxuICAgIH1cblxuXG4gICAgJHNjb3BlLnVwZGF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBBbGJ1bUZhY3RvcnkudXBkYXRlQWxidW0oJHNjb3BlLmN1cnJlbnRBbGJ1bSkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgRGlhbG9nRmFjdG9yeS5kaXNwbGF5KFwiVXBkYXRlZFwiLCAxNTAwKTtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRzdGF0ZS5yZWxvYWQoKTtcbiAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCdzaW5nbGVBbGJ1bScsIHthbGJ1bUlkOiBhbGJ1bS5faWR9KVxuICAgIH1cblxuICAgICRzY29wZS5hZGRUb0FsYnVtID0gKHBob3RvKSA9PiB7XG4gICAgICAgICRzY29wZS5jdXJyZW50QWxidW0ucGhvdG9zLnB1c2gocGhvdG8uX2lkKTtcbiAgICAgICAgRGlhbG9nRmFjdG9yeS5kaXNwbGF5KFwiQWRkZWRcIiwgMTAwMCk7XG4gICAgfVxuXG5cblxufSkiLCJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpbmdsZUFsYnVtJywge1xuICAgICAgICB1cmw6ICcvQWxidW0vOmFsYnVtSWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL3NpbmdsZS1hbGJ1bS5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ1NpbmdsZUFsYnVtQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRhbGJ1bTogKEFsYnVtRmFjdG9yeSwgJHN0YXRlUGFyYW1zKSA9PiB7XG4gICAgICAgIFx0XHRyZXR1cm4gQWxidW1GYWN0b3J5LmZldGNoT25lKCRzdGF0ZVBhcmFtcy5hbGJ1bUlkKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgICAgXG4gICAgfSk7XG59KTtcbiIsImFwcC5jb250cm9sbGVyKCdBbGJ1bXNDdHJsJywgKCRzY29wZSwgJHN0YXRlLCBQaG90b3NGYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFVzZXJGYWN0b3J5LCBEaWFsb2dGYWN0b3J5KSA9PiB7XG5cdEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgJHNjb3BlLmFsYnVtT25lID0gJHNjb3BlLmFsYnVtc1swXTtcbiAgICAgICAgfSk7XG5cbiAgICAkc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICRzdGF0ZS5nbygnc2luZ2xlQWxidW0nLCB7YWxidW1JZDogYWxidW0uX2lkfSlcbiAgICB9XG5cbiAgICAkc2NvcGUuZm9sbG93QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICBcdFVzZXJGYWN0b3J5LmZvbGxvd0FsYnVtKGFsYnVtKVxuICAgIH1cblxuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgJHN0YXRlLmdvKCduZXdBbGJ1bScpO1xuICAgICAgICAvLyBsZXQgYWxidW0gPSB7XG4gICAgICAgIC8vICAgICB0aXRsZTogJHNjb3BlLm5ld0FsYnVtXG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gQWxidW1GYWN0b3J5LmNyZWF0ZUFsYnVtKGFsYnVtKS50aGVuKGFsYnVtID0+IHtcbiAgICAgICAgLy8gICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheShcIkNyZWF0ZWRcIik7XG4gICAgICAgIC8vIH0pXG4gICAgfVxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhbGJ1bXMnLCB7XG4gICAgICAgIHVybDogJy9hbGJ1bXMnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL2FsYnVtcy5odG1sJyxcbiAgICAgICAgY29udHJvbGxlcjogJ0FsYnVtc0N0cmwnXG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKCgkc3RhdGVQcm92aWRlcikgPT4ge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnZWRpdEFsYnVtJywge1xuXHRcdHVybDogJy9lZGl0QWxidW0vOmFsYnVtSWQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvYWxidW0vZWRpdC1hbGJ1bS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnRWRpdEFsYnVtQ3RybCcsXG5cdFx0cmVzb2x2ZToge1xuXHRcdFx0YWxidW06IChBbGJ1bUZhY3RvcnksICRzdGF0ZVBhcmFtcykgPT4ge1xuXHRcdFx0XHRyZXR1cm4gQWxidW1GYWN0b3J5LmZldGNoT25lKCRzdGF0ZVBhcmFtcy5hbGJ1bUlkKVxuXHRcdFx0fVxuXHRcdH1cblx0fSlcbn0pO1xuXG5cbmFwcC5jb250cm9sbGVyKCdFZGl0QWxidW1DdHJsJywgKCRzY29wZSwgQWxidW1GYWN0b3J5LCBQaG90b3NGYWN0b3J5LCBEaWFsb2dGYWN0b3J5LCBhbGJ1bSkgPT4ge1xuXHQkc2NvcGUuYWRkaW5nUGljdHVyZXMgPSBmYWxzZTtcblxuXHRsZXQgc2V0RGF0ZSA9ICgpID0+IHtcblx0XHRhbGJ1bS5kYXRlID0gbmV3IERhdGUoYWxidW0uZGF0ZSk7XG5cdFx0JHNjb3BlLmFsYnVtID0gYWxidW07XG5cdH1cblx0c2V0RGF0ZSgpO1xuXG5cdCRzY29wZS5zYXZlQWxidW0gPSgpID0+IHtcblx0XHRBbGJ1bUZhY3RvcnkudXBkYXRlQWxidW0oJHNjb3BlLmFsYnVtKVxuXHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHQkc2NvcGUuYWxidW0gPSByZXM7XG5cdFx0XHQkc2NvcGUuc2VsZWN0aW5nUGljdHVyZXMgPSBmYWxzZTtcblx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnU2F2ZWQnLCAxMDAwKTtcblx0XHR9KVxuXHR9XG5cblx0JHNjb3BlLmFkZFBob3RvcyA9ICgpID0+IHtcblx0XHRjb25zb2xlLmxvZygnYWRkaW5nJyk7XG5cdFx0UGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpLnRoZW4ocGhvdG9zID0+IHtcblx0XHRcdGNvbnNvbGUubG9nKCdwaG90b3MnLCBwaG90b3MpO1xuXHRcdFx0JHNjb3BlLnNlbGVjdGluZ1BpY3R1cmVzID0gdHJ1ZTtcblx0XHRcdCRzY29wZS5waG90b3MgPSBwaG90b3M7XG5cdFx0fSlcblx0fVxuXG5cdCRzY29wZS5hZGRUb0FsYnVtID0gKHBob3RvKSA9PiB7XG5cdFx0Y29uc29sZS5sb2coXCJhZGRlZFwiLCBwaG90byk7XG4gICAgICAgICRzY29wZS5hbGJ1bS5waG90b3MucHVzaChwaG90by5faWQpO1xuICAgICAgICBBbGJ1bUZhY3RvcnkuYWRkUGhvdG8oYWxidW0uX2lkLCBwaG90by5faWQpXG4gICAgfVxufSkiLCJhcHAuY29udHJvbGxlcignTmV3QWxidW1DdHJsJywgKCRzY29wZSwgJHN0YXRlLCBBbGJ1bUZhY3RvcnksIFBob3Rvc0ZhY3RvcnksIFNlc3Npb24sIERpYWxvZ0ZhY3RvcnksIEF1dGhTZXJ2aWNlKSA9PiB7XG5cdGNvbnNvbGUubG9nKCdTZXNzaW9uJywgU2Vzc2lvbik7XG5cdCRzY29wZS5zaG93UGhvdG9zID0gZmFsc2U7XG5cblx0JHNjb3BlLmNyZWF0ZUFsYnVtID0gKCkgPT4ge1xuICAgICAgICBpZihTZXNzaW9uLnVzZXIpIHtcblx0XHQgICRzY29wZS5hbGJ1bS5vd25lciA9IFNlc3Npb24udXNlci5faWQ7XG4gICAgICAgIH1cblx0XHRjb25zb2xlLmxvZygkc2NvcGUuYWxidW0pO1xuXG4gICAgICAgIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bSgkc2NvcGUuYWxidW0pXG4gICAgfVxuXG5cblxuICAgICRzY29wZS5hZGRUb0FsYnVtID0gKHBob3RvKSA9PiB7XG4gICAgXHREaWFsb2dGYWN0b3J5LmRpc3BsYXkoJ0FkZGVkJywgNzUwKTtcbiAgICAgICAgJHNjb3BlLmFsYnVtLnBob3Rvcy5wdXNoKHBob3RvKTtcbiAgICAgICAgJHNjb3BlLmFsYnVtLmNvdmVyID0gcGhvdG87XG4gICAgfVxuXG4gICAgJHNjb3BlLnNhdmVBbGJ1bSA9ICgpID0+IHtcbiAgICBcdEFsYnVtRmFjdG9yeS51cGRhdGVBbGJ1bSgkc2NvcGUuYWxidW0pLnRoZW4oYWxidW0gPT4ge1xuICAgIFx0XHQkc3RhdGUuZ28oJ2FsYnVtcycpO1xuICAgIFx0fSlcbiAgICB9XG59KTsiLCJhcHAuY29uZmlnKCgkc3RhdGVQcm92aWRlcikgPT4ge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnbmV3QWxidW0nLCB7XG5cdFx0dXJsOiAnL25ld0FsYnVtJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2FsYnVtL25ldy1hbGJ1bS5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnTmV3QWxidW1DdHJsJ1xuXHR9KVxufSk7XG5cbiIsImFwcC5jb250cm9sbGVyKCdTaW5nbGVBbGJ1bUN0cmwnLCAoJHNjb3BlLCAkdGltZW91dCwgJHN0YXRlLCBhbGJ1bSwgQWRtaW5GYWN0b3J5LCBBbGJ1bUZhY3RvcnksIFBob3Rvc0ZhY3RvcnkpID0+IHtcblx0JHNjb3BlLmFsYnVtID0gYWxidW07XG5cdCRzY29wZS5zZWxlY3RpbmdDb3ZlciA9IGZhbHNlO1xuXHQkc2NvcGUuY2hhbmdlc01hZGUgPSBmYWxzZTtcblx0JHNjb3BlLnJlbW92ZVBob3RvcyA9IGZhbHNlO1xuXG5cblx0Y29uc29sZS5sb2coXCJwaG90b3M6IFwiLCBhbGJ1bS5waG90b3MpO1xuXHQkc2NvcGUucGhvdG9zID0gYWxidW0ucGhvdG9zO1xuXHQkc2NvcGUucmVtb3ZlRnJvbUFsYnVtID0gKHBob3RvKSA9PiB7XG5cdFx0bGV0IHBob3RvSW5kZXggPSAkc2NvcGUuYWxidW0ucGhvdG9zLmluZGV4T2YocGhvdG8pO1xuXHRcdCRzY29wZS5hbGJ1bS5waG90b3Muc3BsaWNlKHBob3RvSW5kZXgsIDEpO1xuXHR9XG5cblx0JHNjb3BlLmRlbGV0ZVBob3RvcyA9ICgpID0+IHtcblx0XHQkc2NvcGUucmVtb3ZlUGhvdG9zID0gdHJ1ZTtcblx0fVxuXG5cdCRzY29wZS5zZWxlY3RDb3ZlciA9ICgpID0+IHtcblx0XHQkdGltZW91dCgoKSA9PiB7XG5cdFx0XHQkc2NvcGUuc2VsZWN0aW5nQ292ZXIgPSB0cnVlO1xuXHRcdFx0JHNjb3BlLmNoYW5nZXNNYWRlID0gdHJ1ZTtcblx0XHR9LCA1MDApO1xuXHR9XG5cblx0JHNjb3BlLmFkZENvdmVyID0gKHBob3RvKSA9PiB7XG4gICAgICAgICRzY29wZS5hbGJ1bS5jb3ZlciA9IHBob3RvLl9pZDtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGluZ0NvdmVyID0gZmFsc2U7XG4gICAgfVxuXG5cdCRzY29wZS51cGRhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgQWxidW1GYWN0b3J5LnVwZGF0ZUFsYnVtKCRzY29wZS5hbGJ1bSkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbicpO1xuICAgICAgICB9KVxuICAgIH1cblxuXG4gICAgJHNjb3BlLmZldGNoUGhvdG9zID0gKCkgPT4ge1xuICAgIFx0Y29uc29sZS5sb2coXCJhbGJ1bTogXCIsIGFsYnVtKTtcbiAgICBcdEFsYnVtRmFjdG9yeS5mZXRjaFBob3Rvc0luQWxidW0oYWxidW0uX2lkKVxuICAgIFx0LnRoZW4oYWxidW0gPT4ge1xuICAgIFx0XHRjb25zb2xlLmxvZyhcInJldHVybmVkOiBcIiwgYWxidW0pO1xuICAgIFx0fSlcbiAgICB9XG59KTsiLCJhcHAuY29udHJvbGxlcignQXdzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgQXdzRmFjdG9yeSkge1xuXG5cdCRzY29wZS5hbGJ1bXMgPSBBd3NGYWN0b3J5LmFsYnVtcztcblxuICAgICRzY29wZS5saXN0QWxidW1zID0gKCkgPT4ge1xuICAgICAgIFx0QXdzRmFjdG9yeS5saXN0QWxidW1zUHJvbWlzZSgpLnRoZW4oZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIGFsYnVtcyA9IGRhdGEuQ29tbW9uUHJlZml4ZXMubWFwKGZ1bmN0aW9uKGNvbW1vblByZWZpeCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcHJlZml4ID0gY29tbW9uUHJlZml4LlByZWZpeDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFsYnVtTmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChwcmVmaXgucmVwbGFjZSgnLycsICcnKSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGJ1bU5hbWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICAgICAgICAgJHNjb3BlLiRkaWdlc3QoKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlcnIpO1xuICAgICAgICB9KTtcbiAgICAgICAgJHNjb3BlLmFsYnVtc0ZldGNoZWQgPSB0cnVlO1xuICAgIH1cblxuICAgICRzY29wZS51cGRhdGUgPSBBd3NGYWN0b3J5LnVwZGF0ZUNyZWRlbnRpYWxzO1xuXG4gICAgJHNjb3BlLmNyZWF0ZUFsYnVtID0gKGFsYnVtTmFtZSkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImNyZWF0aW5nIGFsYnVtXCIsIGFsYnVtTmFtZSk7XG4gICAgICAgIEF3c0ZhY3RvcnkuY3JlYXRlQWxidW0oYWxidW1OYW1lKTtcbiAgICB9XG5cblxuICAgICRzY29wZS5hZGRQaG90byA9IChhbGJ1bU5hbWUpID0+IHtcblxuICAgIH1cblxuICAgICRzY29wZS52aWV3QWxidW0gPSBBd3NGYWN0b3J5LnZpZXdBbGJ1bTtcblxuICAgICRzY29wZS5hZGRQaG90byA9IEF3c0ZhY3RvcnkuYWRkUGhvdG87XG5cbiAgICAkc2NvcGUuZGVsZXRlUGhvdG8gPSBBd3NGYWN0b3J5LmRlbGV0ZVBob3RvO1xuXG4gICAgJHNjb3BlLmRlbGV0ZUFsYnVtID0gQXdzRmFjdG9yeS5kZWxldGVBbGJ1bTtcblxuXG5cbiAgICAvLyB2YXIgdXBsb2FkZXIgPSBuZXcgcXEuczMuRmluZVVwbG9hZGVyKHtcbiAgICAvLyAgICAgICAgIGRlYnVnOiB0cnVlLFxuICAgIC8vICAgICAgICAgZWxlbWVudDogZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2ZpbmUtdXBsb2FkZXInKSxcbiAgICAvLyAgICAgICAgIHJlcXVlc3Q6IHtcbiAgICAvLyAgICAgICAgICAgICBlbmRwb2ludDogJ3sgWU9VUl9CVUNLRVRfTkFNRSB9LnMzLmFtYXpvbmF3cy5jb20nXG4gICAgLy8gICAgICAgICAgICAgYWNjZXNzS2V5OiAneyBZT1VSX0FDQ0VTU19LRVkgfSdcbiAgICAvLyAgICAgICAgIH0sXG4gICAgLy8gICAgICAgICBzaWduYXR1cmU6IHtcbiAgICAvLyAgICAgICAgICAgICBlbmRwb2ludDogJy9zMy9zaWduYXR1cmUnXG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgdXBsb2FkU3VjY2Vzczoge1xuICAgIC8vICAgICAgICAgICAgIGVuZHBvaW50OiAnL3MzL3N1Y2Nlc3MnXG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgaWZyYW1lU3VwcG9ydDoge1xuICAgIC8vICAgICAgICAgICAgIGxvY2FsQmxhbmtQYWdlUGF0aDogJy9zdWNjZXNzLmh0bWwnXG4gICAgLy8gICAgICAgICB9LFxuICAgIC8vICAgICAgICAgcmV0cnk6IHtcbiAgICAvLyAgICAgICAgICAgIGVuYWJsZUF1dG86IHRydWUgLy8gZGVmYXVsdHMgdG8gZmFsc2VcbiAgICAvLyAgICAgICAgIH0sXG4gICAgLy8gICAgICAgICBkZWxldGVGaWxlOiB7XG4gICAgLy8gICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAvLyAgICAgICAgICAgICBlbmRwb2ludDogJy9zM2hhbmRsZXInXG4gICAgLy8gICAgICAgICB9XG4gICAgLy8gICAgIH0pO1xuXG5cbiAgIFxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcikge1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXdzJywge1xuXHRcdHVybDogJy9hd3MnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvYXdzL2F3cy5odG1sJyxcblx0XHRjb250cm9sbGVyOiAnQXdzQ3RybCdcblx0fSlcbn0pOyIsIihmdW5jdGlvbiAoKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXG4gICAgaWYgKCF3aW5kb3cuYW5ndWxhcikgdGhyb3cgbmV3IEVycm9yKCdJIGNhblxcJ3QgZmluZCBBbmd1bGFyIScpO1xuXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcblxuICAgIGFwcC5mYWN0b3J5KCdTb2NrZXQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuaW8od2luZG93LmxvY2F0aW9uLm9yaWdpbik7XG4gICAgfSk7XG5cbiAgICAvLyBBVVRIX0VWRU5UUyBpcyB1c2VkIHRocm91Z2hvdXQgb3VyIGFwcCB0b1xuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXG4gICAgLy8gZm9yIGltcG9ydGFudCBldmVudHMgYWJvdXQgYXV0aGVudGljYXRpb24gZmxvdy5cbiAgICBhcHAuY29uc3RhbnQoJ0FVVEhfRVZFTlRTJywge1xuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxuICAgICAgICBsb2dpbkZhaWxlZDogJ2F1dGgtbG9naW4tZmFpbGVkJyxcbiAgICAgICAgbG9nb3V0U3VjY2VzczogJ2F1dGgtbG9nb3V0LXN1Y2Nlc3MnLFxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcbiAgICAgICAgbm90QXV0aGVudGljYXRlZDogJ2F1dGgtbm90LWF1dGhlbnRpY2F0ZWQnLFxuICAgICAgICBub3RBdXRob3JpemVkOiAnYXV0aC1ub3QtYXV0aG9yaXplZCdcbiAgICB9KTtcblxuICAgIGFwcC5mYWN0b3J5KCdBdXRoSW50ZXJjZXB0b3InLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgJHEsIEFVVEhfRVZFTlRTKSB7XG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xuICAgICAgICAgICAgNDAxOiBBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLFxuICAgICAgICAgICAgNDAzOiBBVVRIX0VWRU5UUy5ub3RBdXRob3JpemVkLFxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcbiAgICAgICAgICAgIDQ0MDogQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXRcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChzdGF0dXNEaWN0W3Jlc3BvbnNlLnN0YXR1c10sIHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4gICAgYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcbiAgICAgICAgICAgICckaW5qZWN0b3InLFxuICAgICAgICAgICAgZnVuY3Rpb24gKCRpbmplY3Rvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnQXV0aFNlcnZpY2UnLCBmdW5jdGlvbiAoJGh0dHAsIFNlc3Npb24sICRyb290U2NvcGUsIEFVVEhfRVZFTlRTLCAkcSwgJHN0YXRlKSB7XG4gICAgICAgIGZ1bmN0aW9uIG9uU3VjY2Vzc2Z1bExvZ2luKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHJlc3BvbnNlLmRhdGE7XG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xuICAgICAgICAgICAgJHJvb3RTY29wZS4kYnJvYWRjYXN0KEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcyk7XG4gICAgICAgICAgICByZXR1cm4gZGF0YS51c2VyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gVXNlcyB0aGUgc2Vzc2lvbiBmYWN0b3J5IHRvIHNlZSBpZiBhblxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXG4gICAgICAgIHRoaXMuaXNBdXRoZW50aWNhdGVkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICEhU2Vzc2lvbi51c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZ2V0TG9nZ2VkSW5Vc2VyID0gZnVuY3Rpb24gKGZyb21TZXJ2ZXIpIHtcblxuICAgICAgICAgICAgLy8gSWYgYW4gYXV0aGVudGljYXRlZCBzZXNzaW9uIGV4aXN0cywgd2VcbiAgICAgICAgICAgIC8vIHJldHVybiB0aGUgdXNlciBhdHRhY2hlZCB0byB0aGF0IHNlc3Npb25cbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cbiAgICAgICAgICAgIC8vIGFsd2F5cyBpbnRlcmZhY2Ugd2l0aCB0aGlzIG1ldGhvZCBhc3luY2hyb25vdXNseS5cblxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXG4gICAgICAgICAgICAvLyB0aGVuIHRoaXMgY2FjaGVkIHZhbHVlIHdpbGwgbm90IGJlIHVzZWQuXG5cbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEud2hlbihTZXNzaW9uLnVzZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBNYWtlIHJlcXVlc3QgR0VUIC9zZXNzaW9uLlxuICAgICAgICAgICAgLy8gSWYgaXQgcmV0dXJucyBhIHVzZXIsIGNhbGwgb25TdWNjZXNzZnVsTG9naW4gd2l0aCB0aGUgcmVzcG9uc2UuXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvc2Vzc2lvbicpLnRoZW4ob25TdWNjZXNzZnVsTG9naW4pLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5sb2dpbiA9IGZ1bmN0aW9uIChjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLnBvc3QoJy9sb2dpbicsIGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QoeyBtZXNzYWdlOiAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2xvZ291dCcpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIFNlc3Npb24uZGVzdHJveSgpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSk7XG5cbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5ub3RBdXRoZW50aWNhdGVkLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLmRlc3Ryb3koKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMuc2Vzc2lvblRpbWVvdXQsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcbiAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBzZXNzaW9uSWQ7XG4gICAgICAgICAgICB0aGlzLnVzZXIgPSB1c2VyO1xuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuZGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xuICAgICAgICAgICAgdGhpcy51c2VyID0gbnVsbDtcbiAgICAgICAgfTtcblxuICAgIH0pO1xuXG59KSgpO1xuIiwiYXBwLmNvbmZpZygoJHN0YXRlUHJvdmlkZXIpID0+IHtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2xvZ2luJyx7XG5cdFx0dXJsOiAnL2xvZ2luJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2F1dGgvbG9naW4uaHRtbCcsXG5cdFx0Y29udHJvbGxlcjogJ0xvZ2luQ3RybCdcblx0fSlcbn0pO1xuXG5hcHAuY29udHJvbGxlcignTG9naW5DdHJsJywgKCRzY29wZSwgJHN0YXRlLCBBdXRoU2VydmljZSwgRGlhbG9nRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUubG9naW4gPSAoKSA9PiB7XG5cdFx0bGV0IGNyZWRlbnRpYWxzID0ge1xuXHRcdFx0ZW1haWw6ICRzY29wZS5lbWFpbCxcblx0XHRcdHBhc3N3b3JkOiAkc2NvcGUucGFzc3dvcmRcblx0XHR9XG5cdFx0QXV0aFNlcnZpY2UubG9naW4oY3JlZGVudGlhbHMpLnRoZW4oKHJlcykgPT4ge1xuXHRcdFx0JHN0YXRlLmdvKCdob21lJyk7XG5cdFx0fSk7XG5cdH1cblxuXHQkc2NvcGUuZ2V0VXNlciA9ICgpID0+IHtcblx0XHRBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKHVzZXIgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coJ0xvZ2luLmpzOiBsb2dnZWQgaW4gdXNlcicsIHVzZXIpO1xuXHRcdFx0XG5cdFx0fSlcblx0fVxufSkiLCJhcHAuY29udHJvbGxlcignSG9tZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGhvbWVQaG90b3MsIFBob3Rvc0ZhY3RvcnkpIHtcbiAgICAkc2NvcGUudXBkYXRlQWxsID0gKCkgPT4ge1xuICAgICAgICBQaG90b3NGYWN0b3J5LnVwZGF0ZUFsbCgpXG4gICAgfVxuXG4gICAgJHNjb3BlLmdldFJhbmRvbSA9ICgpID0+IHtcbiAgICB9XG5cbiAgICAkc2NvcGUuc2xpZGVQaG90b3MgPSBob21lUGhvdG9zO1xuXG5cbiAgICAkKGRvY3VtZW50KS5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICAgICQoXCIjb3dsLWRlbW9cIikub3dsQ2Fyb3VzZWwoe1xuXG4gICAgICAgICAgICBhdXRvUGxheTogMzAwMCwgLy9TZXQgQXV0b1BsYXkgdG8gMyBzZWNvbmRzXG5cbiAgICAgICAgICAgIC8vIGl0ZW1zOiAxLFxuICAgICAgICAgICAgbmF2aWdhdGlvbjogdHJ1ZSxcbiAgICAgICAgICAgIHBhZ2luYXRpb246IGZhbHNlLFxuICAgICAgICAgICAgc2luZ2xlSXRlbTp0cnVlXG5cbiAgICAgICAgfSk7XG5cbiAgICB9KTtcblxuXG59KSIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJy9qcy9ob21lL2hvbWUuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdIb21lQ3RybCcsXG4gICAgICAgIHJlc29sdmU6IHtcbiAgICAgICAgXHRob21lUGhvdG9zOiAoUGhvdG9zRmFjdG9yeSkgPT4ge1xuICAgICAgICBcdFx0cmV0dXJuIFBob3Rvc0ZhY3RvcnkuZ2V0UmFuZG9tKDEwKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICB9KTtcbn0pOyIsImFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyKSA9PiB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsYXlvdXQnLCB7XG5cdFx0dXJsOiAnL2xheW91dCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9sYXlvdXQvbGF5b3V0Lmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdMYXlvdXRDdHJsJyxcblx0XHRyZXNvbHZlOiB7XG4gICAgICAgIFx0YWxidW1zOiAoQWxidW1GYWN0b3J5LCAkc3RhdGVQYXJhbXMpID0+IHtcbiAgICAgICAgXHRcdHJldHVybiBBbGJ1bUZhY3RvcnkuZmV0Y2hBbGwoKVxuICAgICAgICBcdH1cbiAgICAgICAgfVxuXHR9KVxufSk7XG5cblxuYXBwLmNvbnRyb2xsZXIoJ0xheW91dEN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIFBob3Rvc0ZhY3RvcnksIGFsYnVtcykge1xuXHRjb25zb2xlLmxvZyhcImFsbCBhbGJ1bXNcIiwgYWxidW1zKTtcblx0JHNjb3BlLmFsYnVtcyA9IGFsYnVtcztcblx0JHNjb3BlLmdldEZpbGVzID0gKCkgPT4ge1xuXHRcdGNvbnNvbGUubG9nKFwiZ2V0dGluZyBGaWxlc1wiKTtcblx0XHRQaG90b3NGYWN0b3J5LmdldEZpbGVzKCk7XG5cdH1cbn0pOyIsImFwcC5jb250cm9sbGVyKCdQaG90b0N0cmwnLCAoJHNjb3BlLCAkc3RhdGUsIFBob3Rvc0ZhY3RvcnksIEFsYnVtRmFjdG9yeSwgVXNlckZhY3RvcnksICR3aW5kb3csIHBob3RvcykgPT4ge1xuICAgIGxldCBhbGJ1bUFycmF5ID0gW107XG4gICAgJHNjb3BlLnRpdGxlID0gXCJXZWxjb21lXCI7XG4gICAgJHNjb3BlLnBob3Rvc0dvdCA9IGZhbHNlO1xuICAgICRzY29wZS5zZWxlY3RlZFBhZ2UgPSAwO1xuICAgICRzY29wZS5hY3RpdmUgPSA1O1xuXG5cbiAgICAvLyAkc2NvcGUucGhvdG9zID0gc2h1ZmZsZShwaG90b3MpO1xuICAgICRzY29wZS5waG90b1BhZ2VzID0gc3BsaXRBcnJheShzaHVmZmxlKHBob3RvcykpO1xuXG4gICAgbGV0IHBob3RvQXJyYXkgPSBbXTtcblxuICAgIGZ1bmN0aW9uIHNwbGl0QXJyYXkoYXJyYXkpIHtcbiAgICBcdGxldCByZXR1cm5BcnJheSA9IFtdXG4gICAgXHRsZXQgY2hvcEFycmF5ID0gYXJyYXk7XG4gICAgXHR3aGlsZShjaG9wQXJyYXkubGVuZ3RoKSB7XG4gICAgXHRcdGxldCBuZXdDaHVuayA9IGNob3BBcnJheS5zcGxpY2UoMCwgMjApXG4gICAgXHRcdGlmKG5ld0NodW5rKSB7XG4gICAgXHRcdFx0cmV0dXJuQXJyYXkucHVzaChuZXdDaHVuaylcbiAgICBcdFx0fVxuICAgIFx0fVxuICAgIFx0cmV0dXJuIHJldHVybkFycmF5O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNodWZmbGUoYXJyYXkpIHtcbiAgICAgICAgdmFyIGN1cnJlbnRJbmRleCA9IGFycmF5Lmxlbmd0aCxcbiAgICAgICAgICAgIHRlbXBvcmFyeVZhbHVlLCByYW5kb21JbmRleDtcblxuICAgICAgICB3aGlsZSAoMCAhPT0gY3VycmVudEluZGV4KSB7XG5cbiAgICAgICAgICAgIHJhbmRvbUluZGV4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY3VycmVudEluZGV4KTtcbiAgICAgICAgICAgIGN1cnJlbnRJbmRleCAtPSAxO1xuXG4gICAgICAgICAgICB0ZW1wb3JhcnlWYWx1ZSA9IGFycmF5W2N1cnJlbnRJbmRleF07XG4gICAgICAgICAgICBhcnJheVtjdXJyZW50SW5kZXhdID0gYXJyYXlbcmFuZG9tSW5kZXhdO1xuICAgICAgICAgICAgYXJyYXlbcmFuZG9tSW5kZXhdID0gdGVtcG9yYXJ5VmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cblxuXG4gICBcblxuXG4gICAgJHNjb3BlLnNldFBhZ2UgPSAoaW5kZXgpID0+IHtcbiAgICBcdCRzY29wZS5zZWxlY3RlZFBhZ2UgPSBpbmRleDtcbiAgICB9XG5cbiAgICAgJHNjb3BlLmZvcndhcmQgPSAoKSA9PiB7XG4gICAgIFx0aWYoJHNjb3BlLnNlbGVjdGVkUGFnZSA8ICRzY29wZS5waG90b1BhZ2VzLmxlbmd0aCkge1xuICAgIFx0XHQkc2NvcGUuc2VsZWN0ZWRQYWdlKys7XG4gICAgIFx0fVxuICAgIH1cblxuICAgICRzY29wZS5iYWNrd2FyZCA9ICgpID0+IHtcbiAgICBcdGlmKCRzY29wZS5zZWxlY3RlZFBhZ2UgPiAwKSB7XG4gICAgXHRcdCRzY29wZS5zZWxlY3RlZFBhZ2UtLTtcbiAgICAgXHR9XG4gICAgfVxuXG5cblxuICAgICRzY29wZS5vcGVuR2FsbGVyeSA9IChpbmRleCkgPT4ge1xuICAgXHRcdFxuICAgXHRcdGxldCBzbGlkZUluZGV4ID0gaW5kZXhcbiAgICBcdCRzY29wZS5zbGlkZUluZGV4ID0gaW5kZXg7XG4gICAgXHRjb25zb2xlLmxvZyhpbmRleCk7XG4gICAgXHQvLyAkc2NvcGUuYWN0aXZlID0gaW5kZXg7XG4gICAgICAgICRzY29wZS5hY3RpdmUgPSBpbmRleDtcblxuICAgIFx0bGV0IGltZ0FycmF5ID0gJHNjb3BlLnBob3RvUGFnZXNbJHNjb3BlLnNlbGVjdGVkUGFnZV1cbiAgIFx0IFx0aW1nQXJyYXkuZm9yRWFjaChmdW5jdGlvbihlbGVtLCBpbmRleCkge1xuICAgXHQgXHRcdGVsZW0uaWQgPSBpbmRleDtcbiAgIFx0IFx0XHRpZihpbmRleCA9PT0gc2xpZGVJbmRleCkge1xuICAgXHQgXHRcdFx0ZWxlbS5hY3RpdmUgPSB0cnVlO1xuICAgXHQgXHRcdFx0Y29uc29sZS5sb2coXCJhY3RpdmU6XCIsIGVsZW0pO1xuICAgXHQgXHRcdH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGVsZW0uYWN0aXZlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICBcdCBcdH0pXG4gICAgICAgIGNvbnNvbGUubG9nKGltZ0FycmF5KTtcbiAgICAgICAkc2NvcGUuZ2FsbGVyeVBob3RvcyA9IGltZ0FycmF5O1xuICAgICAgICRzY29wZS5zaG93R2FsbGVyeSA9IHRydWU7XG4gICAgICAgXG4gICAgICAgXG4gICAgICAgLy8gJHdpbmRvdy5zY3JvbGxUbygwLCAwKTtcbiAgICB9XG5cbiAgICAkc2NvcGUuc2hvdyA9IChwaG90bykgPT4ge1xuICAgXHQgXHQvLyBnYWxsZXJ5UGhvdG9zKCk7XG4gICBcdCBcdFxuXG4gICAgfVxuXG4gICAgJHNjb3BlLmNsb3NlR2FsbGVyeSA9ICgpID0+IHtcbiAgICAgICAgJHNjb3BlLnNob3dHYWxsZXJ5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgJHNjb3BlLmVkaXRNb2RlID0gZmFsc2U7XG5cblxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwaG90b3MnLCB7XG4gICAgICAgIHVybDogJy9waG90b3MnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3Bob3Rvcy9waG90b3MuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdQaG90b0N0cmwnLFxuICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICBwaG90b3M6IChQaG90b3NGYWN0b3J5LCAkc3RhdGVQYXJhbXMpID0+IHtcbiAgICAgICAgICAgICAgICAvLyByZXR1cm4gUGhvdG9zRmFjdG9yeS5mZXRjaEFsbCgpXG4gICAgICAgICAgICAgICAgcmV0dXJuIFBob3Rvc0ZhY3RvcnkuZmV0Y2hBbGxSYW5kb20oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7XG5cblxuXG5cblxuIiwiYXBwLmNvbnRyb2xsZXIoJ1NpZ251cEN0cmwnLCAoJHNjb3BlLCAkcm9vdFNjb3BlLCBVc2VyRmFjdG9yeSkgPT4ge1xuXHQkc2NvcGUudXNlciA9IHt9O1xuXHQkc2NvcGUuc3VibWl0ID0gKCkgPT4ge1xuXHRcdFVzZXJGYWN0b3J5LmNyZWF0ZVVzZXIoJHNjb3BlLnVzZXIpXG5cdFx0LnRoZW4odXNlciA9PiB7XG5cdFx0XHQkcm9vdFNjb3BlLnVzZXIgPSB1c2VyO1xuXHRcdH0pXG5cdH1cbn0pOyIsImFwcC5jb25maWcoKCRzdGF0ZVByb3ZpZGVyKSA9PiB7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0dGVtcGxhdGVVcmw6ICdqcy9zaWdudXAvc2lnbnVwLmh0bWwnLFxuXHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDdHJsJ1xuXHR9KVxufSk7IiwiYXBwLmNvbnRyb2xsZXIoJ1VwbG9hZEN0cmwnLCAoJHNjb3BlLCAkc3RhdGUsIGFsYnVtcywgUGhvdG9zRmFjdG9yeSwgQWxidW1GYWN0b3J5LCBGaWxlVXBsb2FkZXIpID0+IHtcblxuICAgIGxldCBhbGJ1bUNyZWF0ZWQgPSBmYWxzZTtcbiAgICBsZXQgYWRkVG9BbGJ1bTtcblxuXG4gICAgJHNjb3BlLnNlbGVjdGVkQWxidW0gPSBudWxsO1xuXG4gICAgJHNjb3BlLnVwbG9hZEFsYnVtID0gXCJub25lXCI7XG5cbiAgICAvLyAkc2NvcGUudXBsb2FkVXJsID0gXCIvYXBpL3VwbG9hZC9waG90by9cIlxuICAgICRzY29wZS51cGxvYWRVcmwgPSBcIi9hcGkvYXdzL3Bob3RvL1wiXG5cbiAgICAkc2NvcGUuY3JlYXRpbmdBbGJ1bSA9IGZhbHNlO1xuXG5cbiAgICAkc2NvcGUuc2V0QWxidW0gPSAoYWxidW0pID0+IHtcbiAgICAgICAgJHNjb3BlLnNlbGVjdGVkQWxidW0gPSBhbGJ1bTtcbiAgICAgICAgJHNjb3BlLnVwbG9hZEFsYnVtID0gYWxidW0uX2lkO1xuICAgICAgICBjb25zb2xlLmxvZygkc2NvcGUuc2VsZWN0ZWRBbGJ1bSk7XG4gICAgfVxuICAgICRzY29wZS5uZXdBbGJ1bSA9IGZhbHNlO1xuICAgICRzY29wZS5waG90b0FsYnVtID0gbnVsbDtcbiAgICAkc2NvcGUuYWxidW1zID0gYWxidW1zO1xuICAgICRzY29wZS5jcmVhdGVBbGJ1bSA9ICgpID0+IHtcbiAgICAgICAgbGV0IGFsYnVtID0ge1xuICAgICAgICAgICAgdGl0bGU6ICRzY29wZS5hbGJ1bVRpdGxlXG4gICAgICAgIH1cbiAgICAgICAgaWYoJHNjb3BlLnByaXZhdGUpIHtcbiAgICAgICAgICAgIGFsYnVtLnByaXZhdGUgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIEFsYnVtRmFjdG9yeS5jcmVhdGVBbGJ1bShhbGJ1bSkudGhlbihhbGJ1bSA9PiB7XG4gICAgICAgICAgICAkc2NvcGUuYWxidW1zLnB1c2goYWxidW0pO1xuICAgICAgICAgICAgJHNjb3BlLnNlbGVjdGVkQWxidW0gPSBhbGJ1bTtcbiAgICAgICAgICAgICRzY29wZS51cGxvYWRBbGJ1bSA9IGFsYnVtLl9pZDtcbiAgICAgICAgICAgICRzY29wZS5jcmVhdGluZ0FsYnVtID0gZmFsc2U7XG4gICAgICAgIH0pXG4gICAgfVxuICAgICRzY29wZS5jaGVja0FsYnVtID0gKCkgPT4ge1xuICAgICAgICBpZiAoYWxidW1DcmVhdGVkKSB7XG4gICAgICAgICAgICBhZGRUb0FsYnVtID0gYWxidW1DcmVhdGVkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYWRkVG9BbGJ1bSA9ICRzY29wZS5waG90b0FsYnVtXG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1cGxvYWQnLCB7XG4gICAgICAgIHVybDogJy91cGxvYWQnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL3VwbG9hZC91cGxvYWQuaHRtbCcsXG4gICAgICAgIGNvbnRyb2xsZXI6ICdVcGxvYWRDdHJsJyxcbiAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICBcdGFsYnVtczogKEFsYnVtRmFjdG9yeSkgPT4ge1xuICAgICAgICBcdFx0cmV0dXJuIEFsYnVtRmFjdG9yeS5mZXRjaEFsbCgpLnRoZW4oYWxidW1zID0+IHtcbiAgICAgICAgXHRcdFx0cmV0dXJuIGFsYnVtcztcbiAgICAgICAgXHRcdH0pXG4gICAgICAgIFx0fVxuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCJhcHAuZmFjdG9yeSgnRGlhbG9nRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkbWREaWFsb2csICR0aW1lb3V0KSB7IFxuXHRcblxuXHRsZXQgc2hvd0RpYWxvZyA9IChtZXNzYWdlKSA9PiB7XG5cdFx0dmFyIHBhcmVudEVsID0gYW5ndWxhci5lbGVtZW50KGRvY3VtZW50LmJvZHkpO1xuICAgICAgICRtZERpYWxvZy5zaG93KHtcbiAgICAgICAgIHBhcmVudDogcGFyZW50RWwsXG4gICAgICAgICB0ZW1wbGF0ZTpcbiAgICAgICAgICAgJzxtZC1kaWFsb2cgYXJpYS1sYWJlbD1cIkxpc3QgZGlhbG9nXCIgaWQ9XCJkaWFsb2dcIj4nICtcbiAgICAgICAgICAgJyAgPG1kLWRpYWxvZy1jb250ZW50PicrXG4gICAgICAgICAgIFx0bWVzc2FnZSArXG4gICAgICAgICAgICcgIDwvbWQtZGlhbG9nLWNvbnRlbnQ+JyArXG4gICAgICAgICAgICc8L21kLWRpYWxvZz4nXG4gICAgICB9KTtcblx0fVxuXG5cblx0cmV0dXJuIHtcblx0XHRkaXNwbGF5OiAobWVzc2FnZSwgdGltZW91dCkgPT4ge1xuXHRcdFx0c2hvd0RpYWxvZyhtZXNzYWdlKTtcblx0XHRcdCR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQkbWREaWFsb2cuaGlkZSgpO1xuXHRcdFx0fSwgdGltZW91dClcblx0XHR9XG5cdH1cblxuXG5cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3p0U2l6ZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRyKSB7XG4gICAgICAgICAgICBsZXQgc2l6ZSA9IGF0dHIuenRTaXplLnNwbGl0KCd4Jyk7XG5cbiAgICAgICAgICAgIGlmIChhdHRyLmFicykge1xuICAgICAgICAgICAgICAgIGlmIChzaXplWzBdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICB3aWR0aDogc2l6ZVswXSArICdweCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKHNpemVbMV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuY3NzKHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogc2l6ZVsxXSArICdweCdcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAoc2l6ZVswXS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICAgICAgJ21pbi13aWR0aCc6IHNpemVbMF0gKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChzaXplWzFdLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgICAgICAgICAnbWluLWhlaWdodCc6IHNpemVbMV0gKyAncHgnXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgIH1cbiAgICB9XG59KTsiLCJhcHAuZmFjdG9yeSgnQWxidW1GYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRzdGF0ZSwgJHRpbWVvdXQsIERpYWxvZ0ZhY3RvcnkpIHtcbiAgICBsZXQgc3VjY2VzcyA9ICh0ZXh0KSA9PiB7XG4gICAgICAgIERpYWxvZ0ZhY3RvcnkuZGlzcGxheSh0ZXh0LCA3NTApO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBjcmVhdGVBbGJ1bTogKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvJywgYWxidW0pLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICBzdWNjZXNzKFwiY3JlYXRlZFwiKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcInJlc1wiLCByZXMpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuY2F0Y2goZSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcImVycm9yIHNhdmluZyBhbGJ1bVwiLCBlKTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgfSxcbiAgICAgICAgZmV0Y2hBbGw6ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvYWxidW1zLycpXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZUFsYnVtOiAoYWxidW0pID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2FsYnVtcy91cGRhdGUnLCBhbGJ1bSlcbiAgICAgICAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgZmV0Y2hPbmU6IChhbGJ1bUlkKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2FsYnVtcy8nKyBhbGJ1bUlkKVxuICAgICAgICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzLmRhdGFcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBmaW5kVXNlckFsYnVtczogKHVzZXJJZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmdldCgnL2FwaS9hbGJ1bXMvdXNlci8nICsgdXNlcklkKS50aGVuKHJlcyA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcy5kYXRhO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSxcbiAgICAgICAgYWRkUGhvdG86IChhbGJ1bUlkLCBwaG90b0lkKSA9PiB7XG4gICAgICAgICAgICBsZXQgb2JqID0ge307XG4gICAgICAgICAgICBvYmouYWxidW1JZCA9IGFsYnVtSWQ7XG4gICAgICAgICAgICBvYmoucGhvdG9JZCA9IHBob3RvSWQ7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAucG9zdCgnL2FwaS9hbGJ1bXMvYWRkUGhvdG8nLCBvYmopXG4gICAgICAgICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZUFsYnVtOiAoYWxidW1JZCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9hbGJ1bXMvJysgYWxidW1JZClcbiAgICAgICAgfSwgXG4gICAgICAgIGZldGNoUGhvdG9zSW5BbGJ1bTogKGFsYnVtSWQpID0+IHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvYWxidW1zL3Bob3Rvcy8nICsgYWxidW1JZCkudGhlbihyZXMgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwicmVzXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXMuZGF0YVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG5cbn0pIiwiYXBwLmZhY3RvcnkoJ0F3c0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuICAgIGxldCBzZXJ2aWNlID0ge307XG5cblxuICAgIC8vICAgIGZ1bmN0aW9uIGdldEh0bWwodGVtcGxhdGUpIHtcbiAgICAvLyBcdHJldHVybiB0ZW1wbGF0ZS5qb2luKCdcXG4nKTtcbiAgICAvLyB9XG5cbiAgICBzZXJ2aWNlLmFsYnVtcyA9IFtdO1xuICAgIHZhciBhbGJ1bUJ1Y2tldE5hbWUgPSAnenRmJztcbiAgICB2YXIgYnVja2V0UmVnaW9uID0gJ3VzLXdlc3QtMic7XG4gICAgdmFyIElkZW50aXR5UG9vbElkID0gJ3VzLXdlc3QtMjo1NjE5ZDg4MC1kODc0LTQxMGItOWMwYy1lM2EyMjYwZjMyYWEnO1xuICAgIGxldCBzMztcbiAgICBBV1MuY29uZmlnLnVwZGF0ZSh7XG4gICAgICAgIHJlZ2lvbjogYnVja2V0UmVnaW9uLFxuICAgICAgICBjcmVkZW50aWFsczogbmV3IEFXUy5Db2duaXRvSWRlbnRpdHlDcmVkZW50aWFscyh7XG4gICAgICAgICAgICBJZGVudGl0eVBvb2xJZDogSWRlbnRpdHlQb29sSWRcbiAgICAgICAgfSlcbiAgICB9KTtcblxuICAgIHMzID0gbmV3IEFXUy5TMyh7XG4gICAgICAgIGFwaVZlcnNpb246ICcyMDA2LTAzLTAxJyxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBCdWNrZXQ6IGFsYnVtQnVja2V0TmFtZVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBzZXJ2aWNlLnVwZGF0ZUNyZWRlbnRpYWxzID0gKCkgPT4ge1xuICAgICAgICBBV1MuY29uZmlnLnVwZGF0ZSh7XG4gICAgICAgICAgICByZWdpb246IGJ1Y2tldFJlZ2lvbixcbiAgICAgICAgICAgIGNyZWRlbnRpYWxzOiBuZXcgQVdTLkNvZ25pdG9JZGVudGl0eUNyZWRlbnRpYWxzKHtcbiAgICAgICAgICAgICAgICBJZGVudGl0eVBvb2xJZDogSWRlbnRpdHlQb29sSWRcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHMzID0gbmV3IEFXUy5TMyh7XG4gICAgICAgICAgICBhcGlWZXJzaW9uOiAnMjAwNi0wMy0wMScsXG4gICAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgICAgICBCdWNrZXQ6IGFsYnVtQnVja2V0TmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBjb25zb2xlLmxvZyhBV1MuY29uZmlnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRIdG1sKHRlbXBsYXRlKSB7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZS5qb2luKCdcXG4nKTtcbiAgICB9XG5cbiAgICBzZXJ2aWNlLmxpc3RBbGJ1bXNQcm9taXNlID0gKCkgPT4ge1xuICAgICAgICBjb25zb2xlLmxvZyhcImxpc3RpbmcgYWxidW1zXCIpO1xuICAgICAgICBsZXQgcGFyYW1zID0ge1xuICAgICAgICAgICAgRGVsaW1pdGVyOiAnLydcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBsaXN0UHJvbWlzZSA9IHMzLmxpc3RPYmplY3RzKHBhcmFtcykucHJvbWlzZSgpXG5cbiAgICAgICAgcmV0dXJuIGxpc3RQcm9taXNlO1xuICAgIH1cblxuICAgIHNlcnZpY2UubGlzdEFsYnVtcyA9ICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coXCJsaXN0aW5nIGFsYnVtc1wiKTtcbiAgICAgICAgbGV0IHBhcmFtcyA9IHtcbiAgICAgICAgICAgIERlbGltaXRlcjogJy8nXG4gICAgICAgIH1cblxuICAgICAgICBzMy5saXN0T2JqZWN0cyh7XG4gICAgICAgICAgICBEZWxpbWl0ZXI6ICcvJ1xuICAgICAgICB9LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciBsaXN0aW5nIHlvdXIgYWxidW1zOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgYWxidW1zID0gZGF0YS5Db21tb25QcmVmaXhlcy5tYXAoZnVuY3Rpb24oY29tbW9uUHJlZml4KSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmVmaXggPSBjb21tb25QcmVmaXguUHJlZml4O1xuICAgICAgICAgICAgICAgICAgICB2YXIgYWxidW1OYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KHByZWZpeC5yZXBsYWNlKCcvJywgJycpKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsYnVtTmFtZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgbWVzc2FnZSA9IGFsYnVtcy5sZW5ndGggP1xuICAgICAgICAgICAgICAgICAgICBnZXRIdG1sKFtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8cD5DbGljayBvbiBhbiBhbGJ1bSBuYW1lIHRvIHZpZXcgaXQuPC9wPicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHA+Q2xpY2sgb24gdGhlIFggdG8gZGVsZXRlIHRoZSBhbGJ1bS48L3A+J1xuICAgICAgICAgICAgICAgICAgICBdKSA6XG4gICAgICAgICAgICAgICAgICAgICc8cD5Zb3UgZG8gbm90IGhhdmUgYW55IGFsYnVtcy4gUGxlYXNlIENyZWF0ZSBhbGJ1bS4nO1xuICAgICAgICAgICAgICAgIHZhciBodG1sVGVtcGxhdGUgPSBbXG4gICAgICAgICAgICAgICAgICAgICc8aDI+QWxidW1zPC9oMj4nLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLFxuICAgICAgICAgICAgICAgICAgICAnPHVsPicsXG4gICAgICAgICAgICAgICAgICAgIGdldEh0bWwoYWxidW1zKSxcbiAgICAgICAgICAgICAgICAgICAgJzwvdWw+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxidXR0b24gbmctY2xpY2s9XCJjcmVhdGVBbGJ1bShwcm9tcHQoXFwnRW50ZXIgQWxidW0gTmFtZTpcXCcpKVwiPicsXG4gICAgICAgICAgICAgICAgICAgICdDcmVhdGUgTmV3IEFsYnVtJyxcbiAgICAgICAgICAgICAgICAgICAgJzwvYnV0dG9uPidcbiAgICAgICAgICAgICAgICBdXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2FsYnVtcycsIGFsYnVtcyk7XG4gICAgICAgICAgICAgICAgaWYgKCFhbGJ1bXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlLmFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFsYnVtcztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlcnZpY2UuY3JlYXRlQWxidW0gPSAoYWxidW1OYW1lKSA9PiB7XG4gICAgICAgIGFsYnVtTmFtZSA9IGFsYnVtTmFtZS50cmltKCk7XG4gICAgICAgIGlmICghYWxidW1OYW1lKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoJ0FsYnVtIG5hbWVzIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgbm9uLXNwYWNlIGNoYXJhY3Rlci4nKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoYWxidW1OYW1lLmluZGV4T2YoJy8nKSAhPT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBhbGVydCgnQWxidW0gbmFtZXMgY2Fubm90IGNvbnRhaW4gc2xhc2hlcy4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYWxidW1LZXkgPSBlbmNvZGVVUklDb21wb25lbnQoYWxidW1OYW1lKSArICcvJztcbiAgICAgICAgczMuaGVhZE9iamVjdCh7XG4gICAgICAgICAgICBLZXk6IGFsYnVtS2V5XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKCFlcnIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQoJ0FsYnVtIGFscmVhZHkgZXhpc3RzLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGVyci5jb2RlICE9PSAnTm90Rm91bmQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgY3JlYXRpbmcgeW91ciBhbGJ1bTogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHMzLnB1dE9iamVjdCh7XG4gICAgICAgICAgICAgICAgS2V5OiBhbGJ1bUtleVxuICAgICAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1RoZXJlIHdhcyBhbiBlcnJvciBjcmVhdGluZyB5b3VyIGFsYnVtOiAnICsgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhbGVydCgnU3VjY2Vzc2Z1bGx5IGNyZWF0ZWQgYWxidW0uJyk7XG4gICAgICAgICAgICAgICAgc2VydmljZS52aWV3QWxidW0oYWxidW1OYW1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXJ2aWNlLnZpZXdBbGJ1bSA9IChhbGJ1bU5hbWUpID0+IHtcbiAgICAgICAgdmFyIGFsYnVtUGhvdG9zS2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KGFsYnVtTmFtZSkgKyAnLy8nO1xuICAgICAgICBzMy5saXN0T2JqZWN0cyh7XG4gICAgICAgICAgICBQcmVmaXg6IGFsYnVtUGhvdG9zS2V5XG4gICAgICAgIH0sIGZ1bmN0aW9uKGVyciwgZGF0YSkge1xuICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIHZpZXdpbmcgeW91ciBhbGJ1bTogJyArIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIGB0aGlzYCByZWZlcmVuY2VzIHRoZSBBV1MuUmVzcG9uc2UgaW5zdGFuY2UgdGhhdCByZXByZXNlbnRzIHRoZSByZXNwb25zZVxuICAgICAgICAgICAgdmFyIGhyZWYgPSB0aGlzLnJlcXVlc3QuaHR0cFJlcXVlc3QuZW5kcG9pbnQuaHJlZjtcbiAgICAgICAgICAgIHZhciBidWNrZXRVcmwgPSBocmVmICsgYWxidW1CdWNrZXROYW1lICsgJy8nO1xuXG4gICAgICAgICAgICB2YXIgcGhvdG9zID0gZGF0YS5Db250ZW50cy5tYXAoZnVuY3Rpb24ocGhvdG8pIHtcbiAgICAgICAgICAgICAgICB2YXIgcGhvdG9LZXkgPSBwaG90by5LZXk7XG4gICAgICAgICAgICAgICAgdmFyIHBob3RvVXJsID0gYnVja2V0VXJsICsgZW5jb2RlVVJJQ29tcG9uZW50KHBob3RvS2V5KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0SHRtbChbXG4gICAgICAgICAgICAgICAgICAgICc8c3Bhbj4nLFxuICAgICAgICAgICAgICAgICAgICAnPGRpdj4nLFxuICAgICAgICAgICAgICAgICAgICAnPGltZyBzdHlsZT1cIndpZHRoOjEyOHB4O2hlaWdodDoxMjhweDtcIiBzcmM9XCInICsgcGhvdG9VcmwgKyAnXCIvPicsXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nLFxuICAgICAgICAgICAgICAgICAgICAnPGRpdj4nLFxuICAgICAgICAgICAgICAgICAgICAnPHNwYW4gbmctY2xpY2s9XCJkZWxldGVQaG90byhcXCcnICsgYWxidW1OYW1lICsgXCInLCdcIiArIHBob3RvS2V5ICsgJ1xcJylcIj4nLFxuICAgICAgICAgICAgICAgICAgICAnWCcsXG4gICAgICAgICAgICAgICAgICAgICc8L3NwYW4+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxzcGFuPicsXG4gICAgICAgICAgICAgICAgICAgIHBob3RvS2V5LnJlcGxhY2UoYWxidW1QaG90b3NLZXksICcnKSxcbiAgICAgICAgICAgICAgICAgICAgJzwvc3Bhbj4nLFxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyxcbiAgICAgICAgICAgICAgICAgICAgJzxzcGFuPicsXG4gICAgICAgICAgICAgICAgXSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHZhciBtZXNzYWdlID0gcGhvdG9zLmxlbmd0aCA/XG4gICAgICAgICAgICAgICAgJzxwPkNsaWNrIG9uIHRoZSBYIHRvIGRlbGV0ZSB0aGUgcGhvdG88L3A+JyA6XG4gICAgICAgICAgICAgICAgJzxwPllvdSBkbyBub3QgaGF2ZSBhbnkgcGhvdG9zIGluIHRoaXMgYWxidW0uIFBsZWFzZSBhZGQgcGhvdG9zLjwvcD4nO1xuICAgICAgICAgICAgdmFyIGh0bWxUZW1wbGF0ZSA9IFtcbiAgICAgICAgICAgICAgICAnPGgyPicsXG4gICAgICAgICAgICAgICAgJ0FsYnVtOiAnICsgYWxidW1OYW1lLFxuICAgICAgICAgICAgICAgICc8L2gyPicsXG4gICAgICAgICAgICAgICAgbWVzc2FnZSxcbiAgICAgICAgICAgICAgICAnPGRpdj4nLFxuICAgICAgICAgICAgICAgIGdldEh0bWwocGhvdG9zKSxcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyxcbiAgICAgICAgICAgICAgICAnPGlucHV0IGlkPVwicGhvdG91cGxvYWRcIiB0eXBlPVwiZmlsZVwiIGFjY2VwdD1cImltYWdlLypcIj4nLFxuICAgICAgICAgICAgICAgICc8YnV0dG9uIGlkPVwiYWRkcGhvdG9cIiBuZy1jbGljaz1cImFkZFBob3RvKFxcJycgKyBhbGJ1bU5hbWUgKyAnXFwnKVwiPicsXG4gICAgICAgICAgICAgICAgJ0FkZCBQaG90bycsXG4gICAgICAgICAgICAgICAgJzwvYnV0dG9uPicsXG4gICAgICAgICAgICAgICAgJzxidXR0b24gbmctY2xpY2s9XCJsaXN0QWxidW1zKClcIj4nLFxuICAgICAgICAgICAgICAgICdCYWNrIFRvIEFsYnVtcycsXG4gICAgICAgICAgICAgICAgJzwvYnV0dG9uPicsXG4gICAgICAgICAgICBdXG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYXBwJykuaW5uZXJIVE1MID0gZ2V0SHRtbChodG1sVGVtcGxhdGUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXJ2aWNlLmFkZFBob3RvID0gKGFsYnVtTmFtZSkgPT4ge1xuICAgIFx0Y29uc29sZS5sb2coXCJhZGRpbmcgdG8gYWxidW1cIiwgYWxidW1OYW1lKTtcbiAgICAgICAgdmFyIGZpbGVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Bob3RvdXBsb2FkJykuZmlsZXM7XG4gICAgICAgIGlmICghZmlsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gYWxlcnQoJ1BsZWFzZSBjaG9vc2UgYSBmaWxlIHRvIHVwbG9hZCBmaXJzdC4nKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZmlsZSA9IGZpbGVzWzBdO1xuICAgICAgICB2YXIgZmlsZU5hbWUgPSBmaWxlLm5hbWU7XG4gICAgICAgIHZhciBhbGJ1bVBob3Rvc0tleSA9IGVuY29kZVVSSUNvbXBvbmVudChhbGJ1bU5hbWUpICsgJy8vJztcblxuICAgICAgICB2YXIgcGhvdG9LZXkgPSBhbGJ1bVBob3Rvc0tleSArIGZpbGVOYW1lO1xuICAgICAgICBzMy51cGxvYWQoe1xuICAgICAgICAgICAgS2V5OiBwaG90b0tleSxcbiAgICAgICAgICAgIEJvZHk6IGZpbGUsXG4gICAgICAgICAgICBBQ0w6ICdwdWJsaWMtcmVhZCdcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgdXBsb2FkaW5nIHlvdXIgcGhvdG86ICcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFsZXJ0KCdTdWNjZXNzZnVsbHkgdXBsb2FkZWQgcGhvdG8uJyk7XG4gICAgICAgICAgICBzZXJ2aWNlLnZpZXdBbGJ1bShhbGJ1bU5hbWUpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZXJ2aWNlLmRlbGV0ZVBob3RvID0gKGFsYnVtTmFtZSwgcGhvdG9LZXkpID0+IHtcbiAgICAgICAgczMuZGVsZXRlT2JqZWN0KHtcbiAgICAgICAgICAgIEtleTogcGhvdG9LZXlcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgZGVsZXRpbmcgeW91ciBwaG90bzogJywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYWxlcnQoJ1N1Y2Nlc3NmdWxseSBkZWxldGVkIHBob3RvLicpO1xuICAgICAgICAgICAgc2VydmljZS52aWV3QWxidW0oYWxidW1OYW1lKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VydmljZS5kZWxldGVBbGJ1bSA9IChhbGJ1bU5hbWUpID0+IHtcbiAgICAgICAgdmFyIGFsYnVtS2V5ID0gZW5jb2RlVVJJQ29tcG9uZW50KGFsYnVtTmFtZSkgKyAnLyc7XG4gICAgICAgIHMzLmxpc3RPYmplY3RzKHtcbiAgICAgICAgICAgIFByZWZpeDogYWxidW1LZXlcbiAgICAgICAgfSwgZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGFsZXJ0KCdUaGVyZSB3YXMgYW4gZXJyb3IgZGVsZXRpbmcgeW91ciBhbGJ1bTogJywgZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG9iamVjdHMgPSBkYXRhLkNvbnRlbnRzLm1hcChmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICBLZXk6IG9iamVjdC5LZXlcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBzMy5kZWxldGVPYmplY3RzKHtcbiAgICAgICAgICAgICAgICBEZWxldGU6IHtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0czogb2JqZWN0cyxcbiAgICAgICAgICAgICAgICAgICAgUXVpZXQ6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCBmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBhbGVydCgnVGhlcmUgd2FzIGFuIGVycm9yIGRlbGV0aW5nIHlvdXIgYWxidW06ICcsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWxlcnQoJ1N1Y2Nlc3NmdWxseSBkZWxldGVkIGFsYnVtLicpO1xuICAgICAgICAgICAgICAgIHNlcnZpY2UubGlzdEFsYnVtcygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuXG5cblxuXG4gICAgcmV0dXJuIHNlcnZpY2U7XG59KTsiLCJhcHAuZmFjdG9yeSgnUGhvdG9zRmFjdG9yeScsICgkaHR0cCkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdGFkZFBob3RvOiAoc3JjKSA9PiB7XG5cdFx0XHRsZXQgcGhvdG8gPSB7XG5cdFx0XHRcdHNyYzogc3JjLFxuXHRcdFx0XHRuYW1lOiAndGVzdCdcblx0XHRcdH1cblx0XHRcdCRodHRwLnBvc3QoJy9hcGkvcGhvdG9zL2FkZCcsIHBob3RvKVxuXHRcdFx0LnRoZW4ocmVzID0+IHtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRzYXZlUGhvdG86IChwaG90bykgPT4ge1xuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS9waG90b3MvdXBkYXRlJywgcGhvdG8pLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2cocmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGZldGNoQWxsOiAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Bob3Rvcy9hbGxQaG90b3MnKVxuXHRcdFx0LnRoZW4ocmVzID0+IHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGZldGNoVGVuOiAoKSA9PiB7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3Bob3Rvcy9saW1pdDEwJylcblx0XHRcdC50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRnZXRGaWxlczogKCkgPT4ge1xuXHRcdFx0JGh0dHAuZ2V0KCcvYXBpL2dldEZpbGVzL2FsYnVtQScpXG5cdFx0XHQudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcIlJldHVybmVkOiBcIiwgcmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdHVwZGF0ZUFsbDogKCkgPT4ge1xuXHRcdFx0JGh0dHAucHV0KCcvYXBpL3Bob3Rvcy91cGRhdGVBbGwnKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwicmVzOiBcIiwgcmVzLmRhdGEpO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGdldFJhbmRvbTogKGFtb3VudCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MvcmFuZG9tLycgKyBhbW91bnQpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJyZXM6IFwiLCByZXMuZGF0YSk7XG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pXG5cdFx0fSxcblx0XHRmZXRjaEFsbFJhbmRvbTogKCkgPT4ge1xuXHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9waG90b3MvcmFuZG9taXplJykudGhlbihyZXMgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmxvZyhcInJlczogXCIsIHJlcy5kYXRhKTtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGRlbGV0ZVBob3RvOiAocGhvdG9JZCkgPT4ge1xuXHRcdFx0Y29uc29sZS5sb2coXCJkZWxldGVpbmdcIiwgcGhvdG9JZCk7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKCcvYXBpL3Bob3Rvcy9zaW5nbGVQaG90by8nKyBwaG90b0lkKVxuXHRcdFx0LnRoZW4ocmVzID0+IHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHR9XG59KTsiLCJhcHAuZmFjdG9yeSgnVXNlckZhY3RvcnknLCAoJGh0dHAsICRyb290U2NvcGUsIERpYWxvZ0ZhY3RvcnkpID0+IHtcblx0cmV0dXJuIHtcblx0XHRjdXJyZW50VXNlcjogKCkgPT4ge1xuXHRcdFx0bGV0IHVzZXIgPSB7XG5cdFx0XHRcdG5hbWU6ICdEYW5lJyxcblx0XHRcdFx0cGljdHVyZTogJ1NvbWV0aGluZycsXG5cdFx0XHRcdGFsYnVtczogWydPbmUnLCAnVHdvJywgJ1RocmVlJ11cblx0XHRcdH1cblx0XHRcdHJldHVybiB1c2VyXG5cdFx0XHQvL3NlbmQgcmVxdWVzdCBmb3IgY3VycmVudCBsb2dnZWQtaW4gdXNlclxuXHRcdH0sXG5cdFx0Y3JlYXRlVXNlcjogKHVzZXIpID0+IHtcblx0XHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3VzZXJzLycsIHVzZXIpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0cmV0dXJuIHJlcy5kYXRhO1xuXHRcdFx0fSlcblx0XHR9LFxuXHRcdGdldFVzZXI6ICgpID0+IHtcblx0XHRcdGxldCB1c2VybmFtZSA9ICdkYW5ldG9tc2V0aCc7XG5cdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3VzZXJzLycrIHVzZXJuYW1lKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdCRyb290U2NvcGUudXNlciA9IHJlcy5kYXRhXG5cdFx0XHRcdHJldHVybiByZXMuZGF0YTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRmb2xsb3dBbGJ1bTogKGFsYnVtKSA9PiB7XG5cdFx0XHRsZXQgdXNlciA9ICRyb290U2NvcGUudXNlclxuXHRcdFx0aWYodXNlci5hbGJ1bXMuaW5kZXhPZigpICE9PSAtMSkge1xuXHRcdFx0XHRjb25zb2xlLmxvZygnYWxidW0gYWxyZWFkeSBleGlzdHMnKTtcblx0XHRcdH1cblx0XHRcdHVzZXIuYWxidW1zLnB1c2goYWxidW0pO1xuXG5cdFx0XHQkaHR0cC5wb3N0KCcvYXBpL3VzZXJzL3VwZGF0ZScsIHVzZXIpLnRoZW4ocmVzID0+IHtcblx0XHRcdFx0aWYocmVzLnN0YXR1cyA9PT0gMjAwKSB7XG5cdFx0XHRcdFx0RGlhbG9nRmFjdG9yeS5kaXNwbGF5KCdBZGRlZCBUbyBBbGJ1bXMnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2Uge1xuXHRcdFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnU3RhdHVzIG5vdCAyMDAnLCAxMDAwKVxuXHRcdFx0XHR9XG5cdFx0XHR9KVxuXHRcdH0sXG5cdFx0Zm9sbG93UGhvdG86IChwaG90bykgPT4ge1xuXHRcdFx0bGV0IHVzZXIgPSAkcm9vdFNjb3BlLnVzZXJcblx0XHRcdGlmKHVzZXIucGhvdG9zLmluZGV4T2YoKSAhPT0gLTEpIHtcblx0XHRcdFx0Y29uc29sZS5sb2coJ1Bob3RvIGFscmVhZHkgZXhpc3RzJyk7XG5cdFx0XHR9XG5cdFx0XHR1c2VyLnBob3Rvcy5wdXNoKHBob3RvKTtcblxuXHRcdFx0JGh0dHAucG9zdCgnL2FwaS91c2Vycy91cGRhdGUnLCB1c2VyKS50aGVuKHJlcyA9PiB7XG5cdFx0XHRcdGlmKHJlcy5zdGF0dXMgPT09IDIwMCkge1xuXHRcdFx0XHRcdERpYWxvZ0ZhY3RvcnkuZGlzcGxheSgnQWRkZWQgVG8gUGhvdG9zJywgMTAwMClcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHREaWFsb2dGYWN0b3J5LmRpc3BsYXkoJ1N0YXR1cyBub3QgMjAwJywgMTAwMClcblx0XHRcdFx0fVxuXHRcdFx0fSlcblx0XHR9XG5cdH1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2FsYnVtQ2FyZCcsICgkcm9vdFNjb3BlLCAkc3RhdGUpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdGNvbnRyb2xsZXI6ICdBbGJ1bXNDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2FsYnVtcy9hbGJ1bS1jYXJkLmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXHRcdFx0c2NvcGUuZWRpdEFsYnVtID0gKCkgPT4ge1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2VkaXRBbGJ1bScsIHthbGJ1bUlkOiBzY29wZS5hbGJ1bS5faWR9KTtcblx0XHRcdH1cblxuXHRcdFx0c2NvcGUudmlld0FsYnVtID0gKCkgPT4ge1xuXHRcdFx0XHQkc3RhdGUuZ28oJ3NpbmdsZUFsYnVtJywge2FsYnVtSWQ6IHNjb3BlLmFsYnVtLl9pZH0pO1xuXHRcdFx0fVxuXG5cdFx0XHRzY29wZS5hZGRUb0Zhdm9yaXRlcyA9ICgpID0+IHtcblx0XHRcdFx0Y29uc29sZS5sb2coXCJjYWxsIHVzZXIgaGVyZVwiKTtcblx0XHRcdH1cblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc2VsZWN0QWxidW0nLCAoJHJvb3RTY29wZSwgQXdzRmFjdG9yeSkgPT4ge1xuXHRyZXR1cm4ge1xuXHRcdHJlc3RyaWN0OiAnRScsXG5cdFx0Y29udHJvbGxlcjogJ0FsYnVtc0N0cmwnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL2FsYnVtLmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXG5cblx0XHRcdHNjb3BlLmFkZFBob3RvID0gKGFsYnVtKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKCdhbGJ1bSBpbiBkaXJlY3RpdmUnLCBhbGJ1bSk7XG5cdFx0XHRcdEF3c0ZhY3RvcnkuYWRkUGhvdG8oYWxidW0pXG5cdFx0XHR9XG5cblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgndXNlckFsYnVtcycsICgkcm9vdFNjb3BlLCAkc3RhdGUpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvYWxidW1zL3VzZXItYWxidW1zLmh0bWwnLFxuXHRcdGxpbms6IChzY29wZSkgPT4ge1xuXHRcdFx0c2NvcGUuZWRpdEFsYnVtID0gKCkgPT4ge1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2VkaXRBbGJ1bScsIHthbGJ1bUlkOiBzY29wZS5hbGJ1bS5faWR9KTtcblx0XHRcdH1cblxuXHRcdFx0c2NvcGUuYWRkVG9GYXZvcml0ZXMgPSAoKSA9PiB7XG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiY2FsbCB1c2VyIGhlcmVcIik7XG5cdFx0XHR9XG5cdH1cbn1cbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2F3c0FsYnVtJywgKCRyb290U2NvcGUsIEF3c0ZhY3RvcnkpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdGNvbnRyb2xsZXI6ICdBbGJ1bXNDdHJsJyxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2F3cy9hd3MtYWxidW0uaHRtbCcsXG5cdFx0bGluazogKHNjb3BlLCBlbGVtZW50LCBhdHRyKSA9PiB7XG5cblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnZm9vdGVyRWxlbScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQUUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2Zvb3Rlci9mb290ZXIuaHRtbCcsXG4gICAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2Jhbm5lcicsICgkcm9vdFNjb3BlLCAkc3RhdGUsIFNlc3Npb24sIFVzZXJGYWN0b3J5LCBBbGJ1bUZhY3RvcnksIEF1dGhTZXJ2aWNlKSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9iYW5uZXIvYmFubmVyLmh0bWwnLFxuICAgICAgICBsaW5rOiAoc2NvcGUpID0+IHtcbiAgICAgICAgICAgIC8vIFVzZXJGYWN0b3J5LmdldFVzZXIoKS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgLy8gICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgLy8gICAgIHJldHVybiBBbGJ1bUZhY3RvcnkuZmluZFVzZXJBbGJ1bXModXNlci5faWQpXG4gICAgICAgICAgICAvLyB9KS50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICAvLyAgICAgc2NvcGUudXNlci5hbGJ1bXMucHVzaChhbGJ1bXMpO1xuICAgICAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKHNjb3BlLnVzZXIuYWxidW1zKTtcbiAgICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICAgIFVzZXJGYWN0b3J5LmdldFVzZXIoKS50aGVuKHVzZXIgPT4ge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNjb3BlLnVzZXIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIEFsYnVtRmFjdG9yeS5maW5kVXNlckFsYnVtcyh1c2VyLl9pZClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihhbGJ1bXMgPT4ge1xuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXJBbGJ1bXMgPSBhbGJ1bXM7XG4gICAgICAgICAgICAgICAgaWYoc2NvcGUudXNlci5hbGJ1bXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXJBbGJ1bXMucHVzaChzY29wZS51c2VyLmFsYnVtcylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coc2NvcGUudXNlckFsYnVtcyk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICAvLyBBbGJ1bUZhY3RvcnkuZmluZFVzZXJBbGJ1bXMoU2Vzc2lvbi51c2VyLl9pZClcbiAgICAgICAgICAgIC8vIC50aGVuKGFsYnVtcyA9PiB7XG4gICAgICAgICAgICAvLyAgICAgc2NvcGUudXNlckFsYnVtcyA9IGFsYnVtcztcbiAgICAgICAgICAgIC8vICAgICBjb25zb2xlLmxvZyhzY29wZS51c2VyQWxidW1zKTtcbiAgICAgICAgICAgIC8vIH0pXG5cbiAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4odXNlciA9PiB7XG4gICAgICAgICAgICAgICAgaWYodXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmaXJzdDogJ0d1ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3Q6ICcnXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgc2NvcGUuc2hvd0FsYnVtcyA9IGZhbHNlO1xuICAgICAgICAgICAgc2NvcGUuc2hvd1BpY3R1cmVzID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHNjb3BlLmFkZEFsYnVtcyA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBzY29wZS5zaG93QWxidW1zID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NvcGUuYWRkUGljdHVyZXMgPSAoKSA9PiB7XG4gICAgICAgICAgICAgICAgc2NvcGUuc2hvd1BpY3R1cmVzID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2NvcGUudmlld0FsYnVtID0gKGFsYnVtKSA9PiB7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzaW5nbGVBbGJ1bScsIHtcbiAgICAgICAgICAgICAgICAgICAgYWxidW1JZDogYWxidW0uX2lkXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9XG4gICAgfVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgncGhvdG9HYWxsZXJ5JywgZnVuY3Rpb24oJHdpbmRvdykge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnQUUnLFxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL2dhbGxlcnkvZ2FsbGVyeS5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIFx0Ly8gc2NvcGUuYWN0aXZlID0gMTA7XG4gICAgICAgICAgICBzY29wZS5zdGFydEdhbGxlcnkgPSAoaXRlbSkgPT4ge1xuICAgICAgICAgICAgXHRjb25zb2xlLmxvZyhpdGVtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc29sZS5sb2coZWxlbWVudCk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInNsaWRlc2hvd1wiKSk7XG4gICAgICAgICAgICAkd2luZG93LnNjcm9sbFRvKDAsIGFuZ3VsYXIuZWxlbWVudChlbGVtZW50KS5vZmZzZXRUb3ApO1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ2ltZ0xvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0FFJyxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9sb2FkZXIvaW1nbG9hZGluZy5odG1sJyxcbiAgICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnaW1hZ2VvbmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcblxuXG4gICAgICAgICAgICBlbGVtZW50LmNzcyh7XG4gICAgICAgICAgICAgICAgZGlzcGxheTogJ25vbmUnXG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBlbGVtZW50LmJpbmQoJ2Vycm9yJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gYWxlcnQoJ2ltYWdlIGNvdWxkIG5vdCBiZSBsb2FkZWQnKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNhbm5vdCBsb2FkIHRodW1iXCIpO1xuICAgICAgICAgICAgICAgIHNjb3BlLnBob3RvLnRodW1iU3JjID0gc2NvcGUucGhvdG8uc3JjO1xuICAgICAgICAgICAgfSk7XG5cblxuICAgICAgICAgICAgZWxlbWVudC5vbignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUucGhvdG8udmlzaWJsZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5jc3Moe1xuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiAnYmxvY2snXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIC8vIHNjb3BlLnBob3RvLnZpc2libGUgPSB0cnVlO1xuXG4gICAgICAgICAgICBzY29wZS5pbWFnZUxvYWRlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgncGhvdG9FZGl0JywgKFBob3Rvc0ZhY3RvcnkpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvcGhvdG8vcGhvdG8tZWRpdC5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUsIGVsZW0sIGF0dHIpID0+IHtcblx0XHRcdHNjb3BlLnNhdmVQaG90byA9ICgpID0+IHtcblx0XHRcdFx0UGhvdG9zRmFjdG9yeS5zYXZlUGhvdG8oc2NvcGUucGhvdG8pXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdzaW5nbGVQaG90bycsICgkcm9vdFNjb3BlLCAkc3RhdGUpID0+IHtcblx0cmV0dXJuIHtcblx0XHRyZXN0cmljdDogJ0UnLFxuXHRcdC8vIHNjb3BlOiB7XG5cdFx0Ly8gXHRwaG90bzogJz0nXG5cdFx0Ly8gfSxcblx0XHR0ZW1wbGF0ZVVybDogJ2pzL2NvbW1vbi9kaXJlY3RpdmVzL3Bob3RvL3NpbmdsZS1waG90by5odG1sJyxcblx0XHRsaW5rOiAoc2NvcGUpID0+IHtcblx0fVxufVxufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmF2YmFyJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHNjb3BlOiB7fSxcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdqcy9jb21tb24vZGlyZWN0aXZlcy9uYXZiYXIvbmF2YmFyLmh0bWwnLFxuICAgICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSkge1xuXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oZXZlbnQsIHRvU3RhdGUsIHRvUGFyYW1zLCBmcm9tU3RhdGUsIGZyb21QYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuY3VycmVudFBhZ2UgPSB0b1N0YXRlLm5hbWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFt7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnaG9tZSdcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnUGhvdG9zJyxcbiAgICAgICAgICAgICAgICAgICAgc3RhdGU6ICdwaG90b3MnXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ0FsYnVtcycsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnYWxidW1zJ1xuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdVcGxvYWQnLFxuICAgICAgICAgICAgICAgICAgICBzdGF0ZTogJ3VwbG9hZCdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdBZG1pbicsXG4gICAgICAgICAgICAgICAgICAgIHN0YXRlOiAnYWRtaW4nXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcblxuICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2hvbWUnKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cblxuXG4gICAgICAgICAgICB2YXIgc2V0VXNlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpLnRoZW4oZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgICAgICAgICBzY29wZS51c2VyID0gdXNlcjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciByZW1vdmVVc2VyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUudXNlciA9IG51bGw7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBzZXRVc2VyKCk7XG5cbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLmxvZ2luU3VjY2Vzcywgc2V0VXNlcik7XG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRvbihBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzLCByZW1vdmVVc2VyKTtcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcblxuICAgICAgICB9XG5cbiAgICB9O1xuXG59KTsiLCJhcHAuZGlyZWN0aXZlKCd1cGxvYWRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIHJlc3RyaWN0OiAnRScsXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnanMvY29tbW9uL2RpcmVjdGl2ZXMvdXBsb2FkL3VwbG9hZC5odG1sJyxcbiAgICAgICAgbGluazogKHNjb3BlLCBlbGVtLCBhdHRyKSA9PiB7XG4gICAgICAgICAgICAvLyBsZXQgdXBsb2FkVXJsID0gXCIvYXBpL3VwbG9hZC9waG90by9cIlxuICAgICAgICAgICAgbGV0IHVwbG9hZFVybCA9IFwiL2FwaS9hd3MvcGhvdG8vXCJcbiAgICAgICAgICAgIHZhciBnYWxsZXJ5VXBsb2FkZXIgPSBuZXcgcXEuRmluZVVwbG9hZGVyKHtcbiAgICAgICAgICAgICAgICBlbGVtZW50OiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImZpbmUtdXBsb2FkZXItZ2FsbGVyeVwiKSxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ3FxLXRlbXBsYXRlLWdhbGxlcnknLFxuICAgICAgICAgICAgICAgIHJlcXVlc3Q6IHtcbiAgICAgICAgICAgICAgICAgICAgZW5kcG9pbnQ6IHVwbG9hZFVybCArIHNjb3BlLnVwbG9hZEFsYnVtXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0aHVtYm5haWxzOiB7XG4gICAgICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2FpdGluZ1BhdGg6ICcvYXNzZXRzL3BsYWNlaG9sZGVycy93YWl0aW5nLWdlbmVyaWMucG5nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vdEF2YWlsYWJsZVBhdGg6ICcvYXNzZXRzL3BsYWNlaG9sZGVycy9ub3RfYXZhaWxhYmxlLWdlbmVyaWMucG5nJ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB2YWxpZGF0aW9uOiB7XG4gICAgICAgICAgICAgICAgICAgIGFsbG93ZWRFeHRlbnNpb25zOiBbJ2pwZWcnLCAnanBnJywgJ2dpZicsICdwbmcnXVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG5cbiAgICAgICAgICAgIGxldCB1cGRhdGVFbmRwb2ludCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICBsZXQgZW5kcG9pbnQgPSB1cGxvYWRVcmwgKyBzY29wZS51cGxvYWRBbGJ1bTtcbiAgICAgICAgICAgICAgICBnYWxsZXJ5VXBsb2FkZXIuc2V0RW5kcG9pbnQoZW5kcG9pbnQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZW5kcG9pbnQgdXBkYXRlZFwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaCgndXBsb2FkQWxidW0nLCAobmV3VmFsLCBvbGRWYWwpID0+IHtcbiAgICAgICAgICAgICAgICB1cGRhdGVFbmRwb2ludCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
