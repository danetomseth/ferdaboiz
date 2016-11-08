app.controller('UploadCtrl', ($scope, $state, albums, PhotosFactory, AlbumFactory, FileUploader) => {

    let albumCreated = false;
    let addToAlbum;


    $scope.selectedAlbum = null;

    $scope.uploadAlbum = "none";

    $scope.uploadUrl = "/api/upload/photo/"

    $scope.creatingAlbum = false;


    $scope.setAlbum = (album) => {
        $scope.selectedAlbum = album;
        $scope.uploadAlbum = album._id;
        console.log($scope.selectedAlbum);
    }
    $scope.newAlbum = false;
    $scope.photoAlbum = null;
    $scope.albums = albums;
    $scope.createAlbum = () => {
        let album = {
            title: $scope.albumTitle
        }
        if($scope.private) {
            album.private = true;
        }
        AlbumFactory.createAlbum(album).then(album => {
            $scope.albums.push(album);
            $scope.selectedAlbum = album;
            $scope.uploadAlbum = album._id;
            $scope.creatingAlbum = false;
        })
    }
    $scope.checkAlbum = () => {
        if (albumCreated) {
            addToAlbum = albumCreated;
        } else {
            addToAlbum = $scope.photoAlbum
        }
    }



});