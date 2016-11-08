app.directive('photoEdit', (PhotosFactory) => {
	return {
		restrict: 'E',
		templateUrl: 'js/common/directives/photo/photo-edit.html',
		link: (scope, elem, attr) => {
			scope.savePhoto = () => {
				PhotosFactory.savePhoto(scope.photo)
			}
		}
	}
});