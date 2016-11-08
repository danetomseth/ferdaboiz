app.controller('AlbumsCtrl', ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, DialogFactory) => {
	AlbumFactory.fetchAll()
        .then(albums => {
            $scope.albums = albums;
            $scope.albumOne = $scope.albums[0];
        });

    $scope.viewAlbum = (album) => {
        $state.go('singleAlbum', {albumId: album._id})
    }

    $scope.followAlbum = (album) => {
    	UserFactory.followAlbum(album)
    }

    $scope.createAlbum = () => {
        $state.go('newAlbum');
        // let album = {
        //     title: $scope.newAlbum
        // }
        // AlbumFactory.createAlbum(album).then(album => {
        //     DialogFactory.display("Created");
        // })
    }

});