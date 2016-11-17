app.controller("AdminCtrl", ($scope, $state, photos, albums, AdminFactory, AlbumFactory, PhotosFactory) => {
    $scope.addingPictures = false;


    $scope.editMode = true;

    $scope.photos = photos;
    $scope.albums = albums;
    console.log("albums: ", albums);

    $scope.deletePhoto = (photo) => {
        console.log("in controller: ", photo);
        PhotosFactory.deletePhoto(photo._id);
    }

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
            $scope.albums.push(album);
            $scope.newAlbum = "";
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
    	$state.go('singleAlbum', {albumId: album._id})
    }


    $scope.updateAlbum = () => {
        AlbumFactory.updateAlbum($scope.currentAlbum).then(res => {
        	$state.reload();
        })
    }

    $scope.uploadPhotos = () => {
        $state.go('uploadPhotos');
    }

    $scope.addToAlbum = (photo) => {
        $scope.currentAlbum.photos.push(photo._id);
    }
})