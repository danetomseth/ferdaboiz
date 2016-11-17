app.directive('uploader', function() {
    return {
        restrict: 'E',
        templateUrl: 'js/common/directives/upload/upload.html',
        link: (scope, elem, attr) => {
            // let uploadUrl = "/api/upload/photo/"
            let uploadUrl = "/api/aws/photo/"
            var galleryUploader = new qq.FineUploader({
                element: document.getElementById("fine-uploader-gallery"),
                template: 'qq-template-gallery',
                request: {
                    endpoint: uploadUrl + scope.uploadAlbum
                },
                thumbnails: {
                    placeholders: {
                        waitingPath: '/assets/placeholders/waiting-generic.png',
                        notAvailablePath: '/assets/placeholders/not_available-generic.png'
                    }
                },
                validation: {
                    allowedExtensions: ['jpeg', 'jpg', 'gif', 'png']
                }
            });


            let updateEndpoint = () => {
                let endpoint = uploadUrl + scope.uploadAlbum;
                galleryUploader.setEndpoint(endpoint);
                console.log("endpoint updated");
            }
            scope.$watch('uploadAlbum', (newVal, oldVal) => {
                updateEndpoint();
            });
        }

    }
});