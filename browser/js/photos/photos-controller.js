app.controller('PhotoCtrl', ($scope, $state, PhotosFactory, AlbumFactory, UserFactory, $window, photos) => {
    let albumArray = [];
    $scope.title = "Welcome";
    $scope.photosGot = false;
    $scope.selectedPage = 0;
    $scope.active = 5;


    // $scope.photos = shuffle(photos);
    $scope.photoPages = splitArray(shuffle(photos));

    let photoArray = [];

    function splitArray(array) {
    	let returnArray = []
    	let chopArray = array;
    	while(chopArray.length) {
    		let newChunk = chopArray.splice(0, 20)
    		if(newChunk) {
    			returnArray.push(newChunk)
    		}
    	}
    	return returnArray;
    }

    function shuffle(array) {
        var currentIndex = array.length,
            temporaryValue, randomIndex;

        while (0 !== currentIndex) {

            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }


   


    $scope.setPage = (index) => {
    	$scope.selectedPage = index;
    }

     $scope.forward = () => {
     	if($scope.selectedPage < $scope.photoPages.length) {
    		$scope.selectedPage++;
     	}
    }

    $scope.backward = () => {
    	if($scope.selectedPage > 0) {
    		$scope.selectedPage--;
     	}
    }



    $scope.openGallery = (index) => {
   		
   		let slideIndex = index
    	$scope.slideIndex = index;
    	console.log(index);
    	// $scope.active = index;
        $scope.active = index;

    	let imgArray = $scope.photoPages[$scope.selectedPage]
   	 	imgArray.forEach(function(elem, index) {
   	 		elem.id = index;
   	 		if(index === slideIndex) {
   	 			elem.active = true;
   	 			console.log("active:", elem);
   	 		}
            else {
                elem.active = false;
            }
   	 	})
        console.log(imgArray);
       $scope.galleryPhotos = imgArray;
       $scope.showGallery = true;
       
       
       // $window.scrollTo(0, 0);
    }

    $scope.show = (photo) => {
   	 	// galleryPhotos();
   	 	

    }

    $scope.closeGallery = () => {
        $scope.showGallery = false;
    }

    $scope.editMode = false;



});