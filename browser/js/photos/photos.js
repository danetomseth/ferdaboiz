app.config(function ($stateProvider) {
    $stateProvider.state('photos', {
        url: '/photos',
        templateUrl: 'js/photos/photos.html',
        controller: 'PhotoCtrl',
        resolve: {
            photos: (PhotosFactory, $stateParams) => {
                // return PhotosFactory.fetchAll()
                return PhotosFactory.fetchAllRandom();
            }
        }
    });
});





