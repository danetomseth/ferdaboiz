app.directive('photoGallery', function($window) {
    return {
        restrict: 'AE',
        templateUrl: 'js/common/directives/gallery/gallery.html',
        link: function(scope, element, attrs) {
        	// scope.active = 10;
            scope.startGallery = (item) => {
            	console.log(item);
            }

            console.log(element);
            console.log(document.getElementById("slideshow"));
            $window.scrollTo(0, angular.element(element).offsetTop);
        }
    };
});