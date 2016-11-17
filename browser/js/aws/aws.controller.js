app.controller('AwsCtrl', function($scope, AwsFactory) {

	$scope.albums = AwsFactory.albums;

    $scope.listAlbums = () => {
       	AwsFactory.listAlbumsPromise().then(function(data) {
            var albums = data.CommonPrefixes.map(function(commonPrefix) {
                    var prefix = commonPrefix.Prefix;
                    var albumName = decodeURIComponent(prefix.replace('/', ''));
                    return albumName;
                });
            $scope.albums = albums;
            $scope.$digest();
        }).catch(function(err) {
            console.log(err);
        });
        $scope.albumsFetched = true;
    }

    $scope.update = AwsFactory.updateCredentials;

    $scope.createAlbum = (albumName) => {
        console.log("creating album", albumName);
        AwsFactory.createAlbum(albumName);
    }


    $scope.addPhoto = (albumName) => {

    }

    $scope.viewAlbum = AwsFactory.viewAlbum;

    $scope.addPhoto = AwsFactory.addPhoto;

    $scope.deletePhoto = AwsFactory.deletePhoto;

    $scope.deleteAlbum = AwsFactory.deleteAlbum;



    // var uploader = new qq.s3.FineUploader({
    //         debug: true,
    //         element: document.getElementById('fine-uploader'),
    //         request: {
    //             endpoint: '{ YOUR_BUCKET_NAME }.s3.amazonaws.com'
    //             accessKey: '{ YOUR_ACCESS_KEY }'
    //         },
    //         signature: {
    //             endpoint: '/s3/signature'
    //         },
    //         uploadSuccess: {
    //             endpoint: '/s3/success'
    //         },
    //         iframeSupport: {
    //             localBlankPagePath: '/success.html'
    //         },
    //         retry: {
    //            enableAuto: true // defaults to false
    //         },
    //         deleteFile: {
    //             enabled: true,
    //             endpoint: '/s3handler'
    //         }
    //     });


   
});