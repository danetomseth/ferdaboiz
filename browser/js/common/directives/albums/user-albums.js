app.directive('userAlbums', ($rootScope, $state) => {
	return {
		restrict: 'E',
		templateUrl: 'js/common/directives/albums/user-albums.html',
		link: (scope) => {
			scope.editAlbum = () => {
				$state.go('editAlbum', {albumId: scope.album._id});
			}

			scope.addToFavorites = () => {
				console.log("call user here");
			}
	}
}
});