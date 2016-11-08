app.config(($stateProvider) => {
	$stateProvider.state('login',{
		url: '/login',
		templateUrl: 'js/auth/login.html',
		controller: 'LoginCtrl'
	})
});

app.controller('LoginCtrl', ($scope, $state, AuthService, DialogFactory) => {
	$scope.login = () => {
		let credentials = {
			email: $scope.email,
			password: $scope.password
		}
		AuthService.login(credentials).then((res) => {
			$state.go('home');
		});
	}

	$scope.getUser = () => {
		AuthService.getLoggedInUser().then(user => {
			console.log('Login.js: logged in user', user);
			
		})
	}
})