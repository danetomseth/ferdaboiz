app.directive('banner', ($rootScope, $state, Session, UserFactory, AlbumFactory, AuthService) => {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/banner/banner.html',
        link: (scope) => {
            // UserFactory.getUser().then(user => {
            //     scope.user = user;
            //     return AlbumFactory.findUserAlbums(user._id)
            // }).then(albums => {
            //     scope.user.albums.push(albums);
            //     console.log(scope.user.albums);
            // })

            UserFactory.getUser().then(user => {
                scope.user = user;
                console.log(scope.user);

                return AlbumFactory.findUserAlbums(user._id)
            })
            .then(albums => {
                scope.userAlbums = albums;
                if(scope.user.albums.length) {
                    scope.userAlbums.push(scope.user.albums)
                }
                console.log(scope.userAlbums);
            })

            // AlbumFactory.findUserAlbums(Session.user._id)
            // .then(albums => {
            //     scope.userAlbums = albums;
            //     console.log(scope.userAlbums);
            // })

            AuthService.getLoggedInUser().then(user => {
                if(user) {
                    scope.user = user;
                }
                else {
                    scope.user = {
                        first: 'Guest',
                        last: ''
                    }
                }
            })
            scope.showAlbums = false;
            scope.showPictures = false;

            scope.addAlbums = () => {
                scope.showAlbums = true;
            }

            scope.addPictures = () => {
                scope.showPictures = true;
            }

            scope.viewAlbum = (album) => {
                $state.go('singleAlbum', {
                    albumId: album._id
                })
            }

        }
    }
});