
app.config(function ($stateProvider) {
    $stateProvider.state('singleAlbum', {
        url: '/Album/:albumId',
        templateUrl: 'js/album/single-album.html',
        controller: 'SingleAlbumCtrl',
        resolve: {
        	album: (AlbumFactory, $stateParams) => {
        		return AlbumFactory.fetchOne($stateParams.albumId)
        	}
        }
      
    });
});
