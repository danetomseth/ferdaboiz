app.config(function ($stateProvider) {
    $stateProvider.state('admin', {
        url: '/admin',
        templateUrl: 'js/admin/admin.html',
        controller: 'AdminCtrl',
        resolve: {
            photos: (PhotosFactory, $stateParams) => {
                // return PhotosFactory.fetchAll()
                return PhotosFactory.fetchAllRandom();
            },
            albums: (AlbumFactory) => {
            	return AlbumFactory.fetchAll();
            }
        }
        // data: {
        //     authenticate: true
        // }
    });
});