app.config(function($stateProvider) {
	$stateProvider.state('aws', {
		url: '/aws',
		templateUrl: 'js/aws/aws.html',
		controller: 'AwsCtrl'
	})
});