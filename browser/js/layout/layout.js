app.config(($stateProvider) => {
	$stateProvider.state('layout', {
		url: '/layout',
		templateUrl: 'js/layout/layout.html',
		controller: 'LayoutCtrl',
		resolve: {
        	albums: (AlbumFactory, $stateParams) => {
        		return AlbumFactory.fetchAll()
        	}
        }
	})
});


app.controller('LayoutCtrl', function($scope, PhotosFactory, albums) {
	console.log("all albums", albums);
	$scope.albums = albums;
	$scope.getFiles = () => {
		console.log("getting Files");
		PhotosFactory.getFiles();
	}
});