app.factory('UserFactory', ($http, $rootScope, DialogFactory) => {
	return {
		currentUser: () => {
			let user = {
				name: 'Dane',
				picture: 'Something',
				albums: ['One', 'Two', 'Three']
			}
			return user
			//send request for current logged-in user
		},
		createUser: (user) => {
			return $http.post('/api/users/', user).then(res => {
				return res.data;
			})
		},
		getUser: () => {
			let username = 'danetomseth';
			return $http.get('/api/users/'+ username).then(res => {
				$rootScope.user = res.data
				return res.data;
			});
		},

		followAlbum: (album) => {
			let user = $rootScope.user
			if(user.albums.indexOf() !== -1) {
				console.log('album already exists');
			}
			user.albums.push(album);

			$http.post('/api/users/update', user).then(res => {
				if(res.status === 200) {
					DialogFactory.display('Added To Albums', 1000)
				}
				else {
					DialogFactory.display('Status not 200', 1000)
				}
			})
		},
		followPhoto: (photo) => {
			let user = $rootScope.user
			if(user.photos.indexOf() !== -1) {
				console.log('Photo already exists');
			}
			user.photos.push(photo);

			$http.post('/api/users/update', user).then(res => {
				if(res.status === 200) {
					DialogFactory.display('Added To Photos', 1000)
				}
				else {
					DialogFactory.display('Status not 200', 1000)
				}
			})
		}
	}
});