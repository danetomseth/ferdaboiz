app.factory('DialogFactory', function($http, $mdDialog, $timeout) { 
	

	let showDialog = (message) => {
		var parentEl = angular.element(document.body);
       $mdDialog.show({
         parent: parentEl,
         template:
           '<md-dialog aria-label="List dialog" id="dialog">' +
           '  <md-dialog-content>'+
           	message +
           '  </md-dialog-content>' +
           '</md-dialog>'
      });
	}


	return {
		display: (message, timeout) => {
			showDialog(message);
			$timeout(function() {
				$mdDialog.hide();
			}, timeout)
		}
	}



});