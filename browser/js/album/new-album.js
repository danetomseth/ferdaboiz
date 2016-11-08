app.config(($stateProvider) => {
	$stateProvider.state('newAlbum', {
		url: '/newAlbum',
		templateUrl: 'js/album/new-album.html',
		controller: 'NewAlbumCtrl'
	})
});

