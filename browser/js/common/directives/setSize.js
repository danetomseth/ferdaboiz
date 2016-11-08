app.directive('ztSize', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attr) {
            let size = attr.ztSize.split('x');

            if (attr.abs) {
                if (size[0].length) {
                    element.css({
                        width: size[0] + 'px'
                    });
                }

                if (size[1].length) {
                    element.css({
                        height: size[1] + 'px'
                    });
                }
            } else {
                if (size[0].length) {
                    element.css({
                        'min-width': size[0] + 'px'
                    });
                }

                if (size[1].length) {
                    element.css({
                        'min-height': size[1] + 'px'
                    });
                }
            }


        }
    }
});