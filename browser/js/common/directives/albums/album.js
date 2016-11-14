app.directive('selectAlbum', ($rootScope, AwsFactory) => {
	return {
		restrict: 'E',
		controller: 'AlbumsCtrl',
		templateUrl: 'js/common/directives/albums/album.html',
		link: (scope) => {


			scope.addPhoto = (album) => {
				console.log('album in directive', album);
				AwsFactory.addPhoto(album)
			}

	}
}
});