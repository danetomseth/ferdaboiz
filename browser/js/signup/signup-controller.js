app.controller('SignupCtrl', ($scope, $rootScope, UserFactory) => {
	$scope.user = {};
	$scope.submit = () => {
		UserFactory.createUser($scope.user)
		.then(user => {
			$rootScope.user = user;
		})
	}
});