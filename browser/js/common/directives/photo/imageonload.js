app.directive('imageonload', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {


            element.css({
                display: 'none'
            })

            element.bind('error', function() {
                // alert('image could not be loaded');
                console.log("cannot load thumb");
                scope.photo.thumbSrc = scope.photo.src;
            });


            element.on('load', function() {
                scope.$apply(function() {
                    scope.photo.visible = true;
                });
                element.css({
                    display: 'block'
                })
            });


            // scope.photo.visible = true;

            scope.imageLoaded = true;
        }
    };
});