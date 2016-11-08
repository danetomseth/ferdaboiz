app.directive('selectAlbum', ($rootScope) => {
	return {
		restrict: 'E',
		controller: 'AlbumsCtrl',
		templateUrl: 'js/common/directives/albums/album.html',
		link: (scope) => {

	}
}
});