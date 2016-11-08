app.controller('AlbumCtrl', ($scope, $timeout, $state, AdminFactory, AlbumFactory, PhotosFactory, DialogFactory) => {
    $scope.addingPictures = false;

    AlbumFactory.fetchAll()
        .then(albums => {
            $scope.albums = albums;
            $scope.albumOne = $scope.albums[0];
        });

    PhotosFactory.fetchTen()
        .then(photos => {
            $scope.photos = photos;
        });

    $scope.deleteAlbum = (album) => {
        AlbumFactory.deleteAlbum(album._id);
        let albumIndex = $scope.albums.indexOf(album);
        $scope.albums.splice(albumIndex, 1);
    }

    $scope.createAlbum = () => {
        let album = {
            title: $scope.newAlbum
        }
        AlbumFactory.createAlbum(album).then(album => {
            DialogFactory.display("Created");
        })
    }

    $scope.addPhotos = (album) => {
        $scope.selectingPictures = true;
        $scope.currentAlbum = album;
        PhotosFactory.fetchAll()
            .then(photos => {
                $scope.photos = photos;
            });
    }

    $scope.viewAlbum = (album) => {

    }


    $scope.updateAlbum = () => {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(res => {
            DialogFactory.display("Updated", 1500);
            $timeout(function() {
                $state.reload();
            }, 1000);
        })
    }

    $scope.viewAlbum = (album) => {
        $state.go('singleAlbum', {albumId: album._id})
    }

    $scope.addToAlbum = (photo) => {
        $scope.currentAlbum.photos.push(photo._id);
        DialogFactory.display("Added", 1000);
    }



})