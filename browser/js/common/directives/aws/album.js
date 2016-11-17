app.directive('awsAlbum', ($rootScope, AwsFactory) => {
	return {
		restrict: 'E',
		controller: 'AlbumsCtrl',
		templateUrl: 'js/common/directives/aws/aws-album.html',
		link: (scope, element, attr) => {

	}
}
});