WebModule.controller('LotController', ['$scope', 'WMService', 'LotService', 'AddressService', 'LotViewState', '$timeout', '$http', '$sce', 'Auction', function($scope, WMService, LotService, AddressService, LotViewState, $timeout, $http, $sce, Auction) {
	$scope.lot = {};
	$scope.WMService = WMService;
	$scope.LotService = LotService;
	$scope.AddressService = AddressService;
	$scope.Auction = Auction;
	$scope.LotViewState = LotViewState;
	$scope.descriptionFields = {'description':{open:true},'changelog':{open:true,important:true},'short_description':{}, 'well_list':{},'property_information':{},'monthly_revenue':{},'document_repository':{}};
	$scope.model = {
		initialized: false, // Will be set to true after init()
		acceptNDA: false,
        heartbeatPromise: null, // Used by heartbeat() to store the heartbeat timeout, which throws heartAttack() if necessary.
	};
	$scope.lotRefreshTimeout = null;
	$scope.isWebsocketAvailable = viewVars.hasOwnProperty('websocket') && viewVars.websocket && viewVars.websocket.url != null && LotService.isWebsocketProtocolCorrect() === true;
    $scope.reconnectAttempts = 0;
    $scope.heartbeatLengthError = false;

	$scope.lotRefreshFn = function(refreshType){
		var websocketAvailable = $scope.isWebsocketAvailable;
		// Check if it is a manual refresh type where we are simply ajax polling
		var isManualRefresh = !websocketAvailable && $scope.LotService.isRefreshable($scope.lot);
		// Check if this is being called by a timer from the volt template, requesting to bypass the usual ajax polling and make an update immediately since the timer has ended.
		var isSecondaryRefresh = typeof refreshType != 'undefined' && (refreshType == 'secondary' || refreshType == true);
		// Check if this is being called by the websocket message handler and an auction-end was received.
		var isWebsocketAuctionEndRefresh = typeof refreshType != 'undefined' && refreshType == 'websocketAuctionEnd';
		
		var isRefreshAvailable = isManualRefresh || isSecondaryRefresh || isWebsocketAuctionEndRefresh;
		
		if (isRefreshAvailable){
			var promise = $http.get(viewVars.endpoints.lotAjax + $scope.lot.row_id);
			promise.success(function(response){
				var preserveData = {web_module: null};
				if ($scope.lot.hasOwnProperty("web_module")){
					preserveData.web_module = $scope.lot.web_module;
				}
				$scope.lot = WMService.afterLot(response.response);
				$scope.lot.web_module = preserveData.web_module;
			
				$scope.$broadcast('timer-start'); //this is how we update the timer!!!!
			});
			promise.error(WMService.handleError);
		}
        LotService.buyersPremium($scope.lot);
		$scope.lotRefreshWrapper();
	};
	$scope.lotRefreshWrapper = function(){
		if (!$scope.isWebsocketAvailable){
            if ($scope.reconnectAttempts >= viewVars.timedWebSocketMaxRetries) {
                console.log('fall back to timed refresh', $scope.reconnectAttempts);
            }
			if ($scope.lotRefreshTimeout){
				$timeout.cancel($scope.lotRefreshTimeout);
			}
			$scope.lotRefreshTimeout = $timeout($scope.lotRefreshFn, viewVars.lotsRefreshTimer);
		} else {
            // cancel the timeout as it isnt needed any more
            if ($scope.lotRefreshTimeout){
                $timeout.cancel($scope.lotRefreshTimeout);
            }
        }
	}
	$scope.init = function(lot){
		//$scope.$apply(function(){
            window.localStorage.removeItem('heartbeatTime');
			lot = WMService.afterLot(lot);
			$scope.lot = lot;
			$scope.model.mainImageIndex = null;
			if ($scope.lot.images.length){
				$scope.setMainImage(0);
			}
			$scope.model.initialized = true;
			if ($scope.lot.auction && $scope.lot.auction.auction_type == 'timed'){
				$scope.lotRefreshWrapper();
			}
        $scope.model.bidderInfoOpen = false;
        if (viewVars.brand == 'stacksbowers' && viewVars.me && !WMService.auctionIsPast($scope.lot.auction)){
            $scope.getStaticGuide('apr-guide');
            $scope.getStaticGuide('price-guide');
            $scope.getStaticGuide('population-guide');
            $scope.getStaticGuide('pcgs-guide');
            $scope.getStaticGuide('ngc-guide');
            $scope.getStaticGuide('cac-guide');
            console.log($scope.staticGuides);
        }
    //});
  };
	$scope.setMainImage = function(index){
		$scope.model.mainImageIndex = index;
		if (viewVars.brand == 'alexcooper'){
			var $imagesWrap = $(".main-image-wrap .images-wrap");
			var imagesContainerWidth = $imagesWrap.width();
			var image = $(".main-image-wrap .images img").eq(index);
			var imageRelativeOffset = image.position();
			if (imageRelativeOffset){
				var imageAbsoluteOffsetLeft = imageRelativeOffset.left + $imagesWrap.scrollLeft();
				$imagesWrap.animate({
					scrollLeft: Math.max(0, imageAbsoluteOffsetLeft - imagesContainerWidth/2 + image.width()/2)
				}, 500);
			}
		}
	};
	$scope.setMainImageWithIndexWrap = function(index){
		if(index < 0) {
			$scope.model.mainImageIndex = $scope.lot.images.length - 1;
		} else if (index >= $scope.lot.images.length) {
			$scope.model.mainImageIndex = 0;
		} else {
			$scope.model.mainImageIndex = index;
		}
	};
	$scope.breadcrumb = function(index){
		if (1 == index){
			var title = ' Auctions';
			var url;
			if ($scope.WMService.auctionIsPast($scope.lot.auction)){
				title = 'Past' + title;
				url = $scope.WMService.endpoints.pastAuctions;
			}
			else {
				title = 'Upcoming' + title;
				url = $scope.WMService.endpoints.upcomingAuctions;
			}
			return {title: title, url: url};
		}
		else if (2 == index){
			return {title: $scope.lot.auction.title, url: $scope.WMService.endpoints.auctionLots + $scope.lot.auction.row_id};
		}
		else if (3 == index){
			return {title: $scope.lot.title, url: window.location.pathname};
		}
	};
	$scope.toggleDescriptionField = function(field){
		if (!$scope.descriptionFields.hasOwnProperty(field)){
			$scope.descriptionFields[field] = {};
		}
		if (!$scope.descriptionFields[field].hasOwnProperty('open')){
			$scope.descriptionFields[field].open = true;
		}
		else {
			$scope.descriptionFields[field].open = !$scope.descriptionFields[field].open;
		}
	}
	$scope.toggleShareBox = function(){
		if (!$scope.lot.hasOwnProperty('_share_box_toggle') || !$scope.lot._share_box_toggle){
			$scope.lot._share_box_toggle = true;
		}
		else {
			$scope.lot._share_box_toggle = false;
		}
	}
	$scope.lotFieldTabs = function(){
		if ($scope.hasOwnProperty('_lotFieldTabs') && $scope._lotFieldTabs != null){
			return $scope._lotFieldTabs;
		}
		var lotFieldTabs = [];
		if (viewVars.lot.description){
			lotFieldTabs.push({key:'description', label: "Description"});
		}
		if (viewVars.lot.document_repository && !(viewVars.lot.auction && WMService.auctionIsPast(viewVars.lot.auction))){
			lotFieldTabs.push({key:'documents', label: "Documents"});
		}
		if (viewVars.lot.terms_of_sale){
			lotFieldTabs.push({key:'terms', label: "Terms of Sale"});
		}
		$scope._lotFieldTabs = lotFieldTabs;
		return lotFieldTabs;
	}
	$scope.currentLotFieldTab = null;
	var lotFieldTabs = $scope.lotFieldTabs();
	if (lotFieldTabs.length > 0){
		$scope.currentLotFieldTab = lotFieldTabs[0].key;
	}
	// This is a setter/getter function that changes the alex cooper tabs.
	$scope.lotFieldTab = function(field){
		if (typeof(field) != 'undefined'){
			$scope.currentLotFieldTab = field;
		}
		else {
			return $scope.currentLotFieldTab;
		}
	}
	$scope.isFirstLotInDocPropertyGroup = function(property, properties){
		var groupsDiscovered = [];
		for (var i = 0; i < properties.length; i++) {
			if (groupsDiscovered.indexOf(properties[i].document_group) == -1){
				if (property.row_id == properties[i].row_id){
					return true;
				}
				groupsDiscovered.push(properties[i].document_group);
			}
		};
		return false;
	}

	$scope.downloadDocument = function(url, name){
		var submitData = {'url': url}

		var promise = $http.post(viewVars.endpoints.downloadDocument, submitData);
		promise.success(function(data){
			download(data.response.url, name);
		});
		promise.error(function(error){
			WMService.handleError(error);
		});
	}

	$scope.executeMessage = function(message){
		$scope.$apply(function(){
            LotService.webSocketUpdate($scope, message, [$scope.lot]);
    		var envelope = $.parseJSON(message.data);
    		if (envelope.type == 'auction-end'){
    			$scope.lotRefreshFn('websocketAuctionEnd');
            }
    		
			$scope.$broadcast('timer-start'); // Update timers
		});
	}

	$scope.initWebSocket = function(){
		$scope.connection = new ReconnectingWebSocket(viewVars.websocket.url);
        $scope.connection.maxReconnectAttempts = viewVars.timedWebSocketMaxRetries;
        $scope.reconnectAttempts = 0;
		// When the connection is open, subscribe to the auction events (or lots).
		$scope.connection.onopen = function () {
			var connectMessage = LotService.webSocketConnectMessage();
			console.log(connectMessage);
			$scope.connection.send(JSON.stringify(connectMessage));
            $scope.reconnectAttempts = 0;
		};

		// Log errors
		$scope.connection.onerror = function (error) {
		  console.log('WebSocket Error: ' + error);
          $scope.isWebsocketAvailable = false;
          $scope.reconnectAttempts++;
          if(!$scope.$$phase){
            $scope.$apply();
          }
          $scope.lotRefreshWrapper();
		};

		$scope.connection.onmessage = $scope.executeMessage;
		$scope.connection.onclose = function(){
			$scope.$apply(function(){$scope.model.connected = false;});
            $scope.isWebsocketAvailable = false;
            if(!$scope.$$phase){
                $scope.$apply();
            }
            $scope.lotRefreshWrapper();
		};
	}

    $scope.heartbeat = function(){
        // capture the time of the heartbeat and store it in localStorage.
        // compare that to the current time, if it is greater than x show the disconnect message
        var actualTime = new Date().getTime();
        var heartbeatTime = window.localStorage.getItem('heartbeatTime');
        var actualTimeMoment = moment(actualTime);
        var heartbeatTimeMoment = moment(parseInt(heartbeatTime));
        var duration = moment.duration(actualTimeMoment.diff(heartbeatTimeMoment));
        var diffInSeconds = duration.asSeconds();

        if (diffInSeconds > 10 || diffInSeconds < -10) {
            if ($scope.heartbeatLengthError === false) {
                window.scrollTo(0, 0);
            }
            $scope.heartbeatLengthError = true;
        }

        if ($scope.model.heartbeatPromise){
            var actualTime = new Date().getTime();
            window.localStorage.setItem('heartbeatTime', actualTime);
            $timeout.cancel($scope.model.heartbeatPromise);
        }
        $scope.model.heartbeatPromise = $timeout($scope.heartAttack, 6000);
    };

    $scope.heartAttack = function(){
        $scope.connection.close();
        $scope.initWebSocket();
    };

	if ($scope.isWebsocketAvailable){
		$scope.initWebSocket();
	}

    $scope.staticGuideNotices = {
        'apr-guide': '** NOTE.  All prices realized reflect the final hammer price plus the buyer’s premium.  As errors can occur, you should contact each pricing source to determine the accuracy of this information. No item may be returned or refused based on the information provided.',
        'price-guide': '**NOTE.  Information listed is intended to be as accurate as possible, and is being provided to our customers as a service. As errors can occur, you should contact each pricing source to determine the accuracy of this information. No item may be returned or refused based on the information provided.',
        'population-guide': '**NOTE.  Information listed is intended to be as accurate as possible, and is being provided to our customers as a service. As errors can occur, you should contact each grading service to determine the accuracy of this information. No item may be returned or refused based on the information provided.',
        'pcgs-guide': '**NOTE.  Information listed is intended to be as accurate as possible, and is being provided to our customers as a service. As errors can occur, you should contact PCGS to determine the accuracy of this information. No item may be returned or refused based on the information provided.',
        'ngc-guide': '**NOTE.  Information listed is intended to be as accurate as possible, and is being provided to our customers as a service. As errors can occur, you should contact NGC to determine the accuracy of this information. No item may be returned or refused based on the information provided.',
        'cac-guide': '**NOTE.  Information listed is intended to be as accurate as possible, and is being provided to our customers as a service. As errors can occur, you should contact CAC to determine the accuracy of this information. No item may be returned or refused based on the information provided.',
    };

    $scope.staticGuides = {

    };

    $scope.getStaticGuide = function(type){
        var promise = $http.get(viewVars.endpoints.lotPriceGuide + $scope.lot.row_id + '/' + type);
        promise.success(function(response){
//            console.log(type);
//            console.log(response);
            $scope.staticGuides[type] = response;
            if (type == 'apr-guide'){
                /*//var lotPromises = [];
                var lotPromise;
                var staticGuide = $scope.staticGuides[type].result_page;
                // Add lot details to link them to lots in Previous Prices Realized
                for (var i=0; i<5; i++){
                    if (i>=staticGuide.length){
                        break;
                    }
                    lotPromise = $http.get(viewVars.endpoints.lotAjax + staticGuide[i].row_id);
                    lotPromise.success(function(lotResponse){
                        for (var currLotIndex=0; currLotIndex<staticGuide.length; currLotIndex++){
                            if (staticGuide[currLotIndex].row_id == lotResponse.response.row_id){
                                staticGuide[currLotIndex].lot = lotResponse.response;
                                break;
                            }
                        }
                    })
                    //lotPromises.push(lotPromise);
                }*/
            }
            else if (type == 'ngc-guide'){
                var newStaticGuideResultPage = [];
                for (var i=0; i<$scope.staticGuides[type].result_page.length; i++){
                    // Remove some fields.
                    if ($scope.staticGuides[type].result_page[i].type != 'Plus' && $scope.staticGuides[type].result_page[i].type != 'PlusStar'){
                        newStaticGuideResultPage.push($scope.staticGuides[type].result_page[i]);
                    }
                }
                $scope.staticGuides[type].result_page = newStaticGuideResultPage;
            }
            else if (type == 'pcgs-guide'){
                var newStaticGuideResultPage = [];
                // Remove some fields.
                for (var i=0; i<$scope.staticGuides[type].result_page.length; i++){
                    if ($scope.staticGuides[type].result_page[i].type != 'Plus' && $scope.staticGuides[type].result_page[i].type != 'Total'){
                        newStaticGuideResultPage.push($scope.staticGuides[type].result_page[i]);
                    }
                }
                $scope.staticGuides[type].result_page = newStaticGuideResultPage;
            }
        });
        promise.error(WMService.handleError);
        /*if ('price-guide' == type){
            $scope.staticGuides[type] = {"GetPricingResult":{"ErrorMessage":null,"Type":"Success","Value":{"CCDNpricing":[{"grade":"10","grading_service":"NGC","price":"108.00000"},{"grade":"12","grading_service":"NGC","price":"184.50000"},{"grade":"15","grading_service":"NGC","price":"211.50000"},{"grade":"2","grading_service":"NGC","price":"39.60000"},{"grade":"20","grading_service":"NGC","price":"337.50000"},{"grade":"25","grading_service":"NGC","price":"391.50000"},{"grade":"3","grading_service":"NGC","price":"35.10000"},{"grade":"30","grading_service":"NGC","price":"459.00000"},{"grade":"35","grading_service":"NGC","price":"517.50000"},{"grade":"4","grading_service":"NGC","price":"65.70000"},{"grade":"40","grading_service":"NGC","price":"675.00000"},{"grade":"45","grading_service":"NGC","price":"765.00000"},{"grade":"45+","grading_service":"NGC","price":"787.50000"},{"grade":"50","grading_service":"NGC","price":"900.00000"},{"grade":"50+","grading_service":"NGC","price":"945.00000"},{"grade":"53","grading_service":"NGC","price":"1125.00000"},{"grade":"53+","grading_service":"NGC","price":"1170.00000"},{"grade":"55","grading_service":"NGC","price":"1350.00000"},{"grade":"55+","grading_service":"NGC","price":"1485.00000"},{"grade":"58","grading_service":"NGC","price":"2250.00000"},{"grade":"58+","grading_service":"NGC","price":"2385.00000"},{"grade":"6","grading_service":"NGC","price":"74.70000"},{"grade":"60","grading_service":"NGC","price":"2700.00000"},{"grade":"61","grading_service":"NGC","price":"2970.00000"},{"grade":"62","grading_service":"NGC","price":"3600.00000"},{"grade":"62+","grading_service":"NGC","price":"3825.00000"},{"grade":"63","grading_service":"NGC","price":"4500.00000"},{"grade":"63+","grading_service":"NGC","price":"4860.00000"},{"grade":"64","grading_service":"NGC","price":"6300.00000"},{"grade":"64+","grading_service":"NGC","price":"7110.00000"},{"grade":"65","grading_service":"NGC","price":"23400.00000"},{"grade":"8","grading_service":"NGC","price":"85.50000"},{"grade":"10","grading_service":"PCGS","price":"114.000000"},{"grade":"12","grading_service":"PCGS","price":"194.750000"},{"grade":"15","grading_service":"PCGS","price":"223.250000"},{"grade":"2","grading_service":"PCGS","price":"41.800000"},{"grade":"20","grading_service":"PCGS","price":"356.250000"},{"grade":"25","grading_service":"PCGS","price":"413.250000"},{"grade":"3","grading_service":"PCGS","price":"37.050000"},{"grade":"30","grading_service":"PCGS","price":"484.500000"},{"grade":"35","grading_service":"PCGS","price":"546.250000"},{"grade":"4","grading_service":"PCGS","price":"69.350000"},{"grade":"40","grading_service":"PCGS","price":"712.500000"},{"grade":"45","grading_service":"PCGS","price":"807.500000"},{"grade":"45+","grading_service":"PCGS","price":"831.250000"},{"grade":"50","grading_service":"PCGS","price":"950.000000"},{"grade":"50+","grading_service":"PCGS","price":"997.500000"},{"grade":"53","grading_service":"PCGS","price":"1187.500000"},{"grade":"53+","grading_service":"PCGS","price":"1235.000000"},{"grade":"55","grading_service":"PCGS","price":"1425.000000"},{"grade":"55+","grading_service":"PCGS","price":"1567.500000"},{"grade":"58","grading_service":"PCGS","price":"2375.000000"},{"grade":"58+","grading_service":"PCGS","price":"2517.500000"},{"grade":"6","grading_service":"PCGS","price":"78.850000"},{"grade":"60","grading_service":"PCGS","price":"2850.000000"},{"grade":"61","grading_service":"PCGS","price":"3135.000000"},{"grade":"62","grading_service":"PCGS","price":"3800.000000"},{"grade":"62+","grading_service":"PCGS","price":"4037.500000"},{"grade":"63","grading_service":"PCGS","price":"4750.000000"},{"grade":"63+","grading_service":"PCGS","price":"5130.000000"},{"grade":"64","grading_service":"PCGS","price":"6650.000000"},{"grade":"64+","grading_service":"PCGS","price":"7505.000000"},{"grade":"65","grading_service":"PCGS","price":"24700.000000"},{"grade":"8","grading_service":"PCGS","price":"90.250000"}],"CCEpricing":null,"CDNpricing":[{"grade":"10","grading_service":null,"price":"102.000000"},{"grade":"12","grading_service":null,"price":"174.250000"},{"grade":"15","grading_service":null,"price":"199.750000"},{"grade":"2","grading_service":null,"price":"37.400000"},{"grade":"20","grading_service":null,"price":"318.750000"},{"grade":"25","grading_service":null,"price":"369.750000"},{"grade":"3","grading_service":null,"price":"33.150000"},{"grade":"30","grading_service":null,"price":"433.500000"},{"grade":"35","grading_service":null,"price":"488.750000"},{"grade":"4","grading_service":null,"price":"62.050000"},{"grade":"40","grading_service":null,"price":"637.500000"},{"grade":"45","grading_service":null,"price":"722.500000"},{"grade":"45+","grading_service":null,"price":"743.750000"},{"grade":"50","grading_service":null,"price":"850.000000"},{"grade":"50+","grading_service":null,"price":"892.500000"},{"grade":"53","grading_service":null,"price":"1062.500000"},{"grade":"53+","grading_service":null,"price":"1105.000000"},{"grade":"55","grading_service":null,"price":"1275.000000"},{"grade":"55+","grading_service":null,"price":"1402.500000"},{"grade":"58","grading_service":null,"price":"2125.000000"},{"grade":"58+","grading_service":null,"price":"2252.500000"},{"grade":"6","grading_service":null,"price":"70.550000"},{"grade":"60","grading_service":null,"price":"2550.000000"},{"grade":"61","grading_service":null,"price":"2805.000000"},{"grade":"62","grading_service":null,"price":"3400.000000"},{"grade":"62+","grading_service":null,"price":"3612.500000"},{"grade":"63","grading_service":null,"price":"4250.000000"},{"grade":"63+","grading_service":null,"price":"4590.000000"},{"grade":"64","grading_service":null,"price":"5950.000000"},{"grade":"64+","grading_service":null,"price":"6715.000000"},{"grade":"65","grading_service":null,"price":"22100.000000"},{"grade":"8","grading_service":null,"price":"80.750000"}],"CoinWorldpricing":[{"grade":"2","grading_service":null,"price":"48.40000"},{"grade":"3","grading_service":null,"price":"42.90000"},{"grade":"4","grading_service":null,"price":"80.30000"},{"grade":"6","grading_service":null,"price":"91.30000"},{"grade":"8","grading_service":null,"price":"104.50000"},{"grade":"10","grading_service":null,"price":"132.00000"},{"grade":"12","grading_service":null,"price":"225.50000"},{"grade":"15","grading_service":null,"price":"258.50000"},{"grade":"20","grading_service":null,"price":"412.50000"},{"grade":"25","grading_service":null,"price":"478.50000"},{"grade":"30","grading_service":null,"price":"561.00000"},{"grade":"35","grading_service":null,"price":"632.50000"},{"grade":"40","grading_service":null,"price":"825.00000"},{"grade":"45","grading_service":null,"price":"935.00000"},{"grade":"45+","grading_service":null,"price":"962.50000"},{"grade":"50","grading_service":null,"price":"1100.00000"},{"grade":"50+","grading_service":null,"price":"1155.00000"},{"grade":"53","grading_service":null,"price":"1375.00000"},{"grade":"53+","grading_service":null,"price":"1430.00000"},{"grade":"55","grading_service":null,"price":"1650.00000"},{"grade":"55+","grading_service":null,"price":"1815.00000"},{"grade":"58","grading_service":null,"price":"2750.00000"},{"grade":"58+","grading_service":null,"price":"2915.00000"},{"grade":"60","grading_service":null,"price":"3300.00000"},{"grade":"61","grading_service":null,"price":"3630.00000"},{"grade":"62","grading_service":null,"price":"4400.00000"},{"grade":"62+","grading_service":null,"price":"4675.00000"},{"grade":"63","grading_service":null,"price":"5500.00000"},{"grade":"63+","grading_service":null,"price":"5940.00000"},{"grade":"64","grading_service":null,"price":"7700.00000"},{"grade":"64+","grading_service":null,"price":"8690.00000"},{"grade":"65","grading_service":null,"price":"28600.00000"}],"NGCpricing":[{"grade":"12","grading_service":"NGC","price":"185.00"},{"grade":"20","grading_service":"NGC","price":"380.00"},{"grade":"4","grading_service":"NGC","price":"75.00"},{"grade":"40","grading_service":"NGC","price":"675.00"},{"grade":"50","grading_service":"NGC","price":"985.00"},{"grade":"53","grading_service":"NGC","price":"1050.00"},{"grade":"55","grading_service":"NGC","price":"1675.00"},{"grade":"58","grading_service":"NGC","price":"1950.00"},{"grade":"60","grading_service":"NGC","price":"2450.00"},{"grade":"61","grading_service":"NGC","price":"2900.00"},{"grade":"62","grading_service":"NGC","price":"3600.00"},{"grade":"63","grading_service":"NGC","price":"4650.00"},{"grade":"64","grading_service":"NGC","price":"7350.00"},{"grade":"65","grading_service":"NGC","price":"22000.00"},{"grade":"8","grading_service":"NGC","price":"110.00"}],"NumismediaCACpricing":null,"NumismediaRpricing":null,"NumismediaWpricing":null,"PCGSpricing":[{"grade":"10","grading_service":"PCGS","price":"120.00"},{"grade":"12","grading_service":"PCGS","price":"205.00"},{"grade":"15","grading_service":"PCGS","price":"235.00"},{"grade":"2","grading_service":"PCGS","price":"44.00"},{"grade":"20","grading_service":"PCGS","price":"375.00"},{"grade":"25","grading_service":"PCGS","price":"435.00"},{"grade":"3","grading_service":"PCGS","price":"39.00"},{"grade":"30","grading_service":"PCGS","price":"510.00"},{"grade":"35","grading_service":"PCGS","price":"575.00"},{"grade":"4","grading_service":"PCGS","price":"73.00"},{"grade":"40","grading_service":"PCGS","price":"750.00"},{"grade":"45","grading_service":"PCGS","price":"850.00"},{"grade":"45+","grading_service":"PCGS","price":"875.00"},{"grade":"50","grading_service":"PCGS","price":"1000.00"},{"grade":"50+","grading_service":"PCGS","price":"1050.00"},{"grade":"53","grading_service":"PCGS","price":"1250.00"},{"grade":"53+","grading_service":"PCGS","price":"1300.00"},{"grade":"55","grading_service":"PCGS","price":"1500.00"},{"grade":"55+","grading_service":"PCGS","price":"1650.00"},{"grade":"58","grading_service":"PCGS","price":"2500.00"},{"grade":"58+","grading_service":"PCGS","price":"2650.00"},{"grade":"6","grading_service":"PCGS","price":"83.00"},{"grade":"60","grading_service":"PCGS","price":"3000.00"},{"grade":"61","grading_service":"PCGS","price":"3300.00"},{"grade":"62","grading_service":"PCGS","price":"4000.00"},{"grade":"62+","grading_service":"PCGS","price":"4250.00"},{"grade":"63","grading_service":"PCGS","price":"5000.00"},{"grade":"63+","grading_service":"PCGS","price":"5400.00"},{"grade":"64","grading_service":"PCGS","price":"7000.00"},{"grade":"64+","grading_service":"PCGS","price":"7900.00"},{"grade":"65","grading_service":"PCGS","price":"26000.00"},{"grade":"8","grading_service":"PCGS","price":"95.00"}],"specNo":"1051"},"errorType":null}};
        }
        else if ('population-guide' == type){
            $scope.staticGuides[type] = {"GetPopulationGuideResult":{"ErrorMessage":null,"Type":"Success","Value":{"Mintage":202908,"Population":[{"Grade":"0","Plus":"0","PopHigher":"0","Population":"0","Service":"PCGS","Total":"333"},{"Grade":"0","Plus":"0","PopHigher":"0","Population":"0","Service":"NGC","Total":"211"},{"Grade":"0","Plus":"-","PopHigher":"0","Population":"0","Service":"CAC","Total":"21"}],"specNo":"1051","strike":"MS"},"errorType":null}};
        }
        else if ('pcgs-guide' == type){
            $scope.staticGuides[type] = {"GetPCGSPopGuideResult":{"ErrorMessage":null,"Type":"Success","Value":[{"Base":"-","Grade":"1","Percent":"-","Plus":"-","Total":"-"},{"Base":"2","Grade":"2","Percent":"0","Plus":"-","Total":"2"},{"Base":"3","Grade":"3","Percent":"0","Plus":"-","Total":"3"},{"Base":"2","Grade":"4","Percent":"0","Plus":"-","Total":"2"},{"Base":"5","Grade":"6","Percent":"1","Plus":"-","Total":"5"},{"Base":"8","Grade":"8","Percent":"2","Plus":"-","Total":"8"},{"Base":"10","Grade":"10","Percent":"3","Plus":"-","Total":"10"},{"Base":"5","Grade":"12","Percent":"1","Plus":"-","Total":"5"},{"Base":"11","Grade":"15","Percent":"3","Plus":"-","Total":"11"},{"Base":"20","Grade":"20","Percent":"6","Plus":"-","Total":"20"},{"Base":"26","Grade":"25","Percent":"7","Plus":"-","Total":"26"},{"Base":"40","Grade":"30","Percent":"12","Plus":"-","Total":"40"},{"Base":"22","Grade":"35","Percent":"6","Plus":"-","Total":"22"},{"Base":"30","Grade":"40","Percent":"9","Plus":"-","Total":"30"},{"Base":"26","Grade":"45","Percent":"7","Plus":"-","Total":"26"},{"Base":"15","Grade":"50","Percent":"4","Plus":"-","Total":"15"},{"Base":"9","Grade":"53","Percent":"2","Plus":"-","Total":"9"},{"Base":"30","Grade":"55","Percent":"9","Plus":"-","Total":"30"},{"Base":"28","Grade":"58","Percent":"8","Plus":"1","Total":"29"},{"Base":"2","Grade":"60","Percent":"0","Plus":"-","Total":"2"},{"Base":"5","Grade":"61","Percent":"1","Plus":"-","Total":"5"},{"Base":"21","Grade":"62","Percent":"6","Plus":"-","Total":"21"},{"Base":"7","Grade":"63","Percent":"2","Plus":"1","Total":"8"},{"Base":"4","Grade":"64","Percent":"1","Plus":"-","Total":"4"},{"Base":"-","Grade":"65","Percent":"-","Plus":"-","Total":"-"},{"Base":"-","Grade":"66","Percent":"-","Plus":"-","Total":"-"},{"Base":"-","Grade":"67","Percent":"-","Plus":"-","Total":"-"},{"Base":"-","Grade":"68","Percent":"-","Plus":"-","Total":"-"},{"Base":"-","Grade":"69","Percent":"-","Plus":"-","Total":"-"},{"Base":"-","Grade":"70","Percent":"-","Plus":"-","Total":"-"},{"Base":"331","Grade":"Total","Percent":"","Plus":"2","Total":"333"}],"errorType":null}};
        }
        else if ('ngc-guide' == type){
            $scope.staticGuides[type] = {"GetNGCPopGuideResult":{"ErrorMessage":null,"Type":"Success","Value":[{"Base":"-","Grade":"1","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"-","Grade":"2","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"2","Grade":"3","Percent":"0","Plus":"-","PlusStar":"-","Star":"-","Total":"2"},{"Base":"3","Grade":"4","Percent":"1","Plus":"-","PlusStar":"-","Star":"-","Total":"3"},{"Base":"7","Grade":"6","Percent":"3","Plus":"-","PlusStar":"-","Star":"-","Total":"7"},{"Base":"6","Grade":"8","Percent":"2","Plus":"-","PlusStar":"-","Star":"-","Total":"6"},{"Base":"3","Grade":"10","Percent":"1","Plus":"-","PlusStar":"-","Star":"-","Total":"3"},{"Base":"9","Grade":"12","Percent":"4","Plus":"-","PlusStar":"-","Star":"-","Total":"9"},{"Base":"5","Grade":"15","Percent":"2","Plus":"-","PlusStar":"-","Star":"-","Total":"5"},{"Base":"8","Grade":"20","Percent":"3","Plus":"-","PlusStar":"-","Star":"-","Total":"8"},{"Base":"11","Grade":"25","Percent":"5","Plus":"-","PlusStar":"-","Star":"-","Total":"11"},{"Base":"9","Grade":"30","Percent":"4","Plus":"-","PlusStar":"-","Star":"-","Total":"9"},{"Base":"8","Grade":"35","Percent":"3","Plus":"-","PlusStar":"-","Star":"-","Total":"8"},{"Base":"17","Grade":"40","Percent":"8","Plus":"-","PlusStar":"-","Star":"-","Total":"17"},{"Base":"17","Grade":"45","Percent":"8","Plus":"-","PlusStar":"-","Star":"-","Total":"17"},{"Base":"11","Grade":"50","Percent":"5","Plus":"-","PlusStar":"-","Star":"-","Total":"11"},{"Base":"7","Grade":"53","Percent":"3","Plus":"-","PlusStar":"-","Star":"-","Total":"7"},{"Base":"20","Grade":"55","Percent":"9","Plus":"-","PlusStar":"-","Star":"-","Total":"20"},{"Base":"14","Grade":"58","Percent":"6","Plus":"-","PlusStar":"-","Star":"-","Total":"14"},{"Base":"-","Grade":"60","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"12","Grade":"61","Percent":"5","Plus":"-","PlusStar":"-","Star":"-","Total":"12"},{"Base":"20","Grade":"62","Percent":"9","Plus":"-","PlusStar":"-","Star":"-","Total":"20"},{"Base":"15","Grade":"63","Percent":"7","Plus":"-","PlusStar":"-","Star":"-","Total":"15"},{"Base":"6","Grade":"64","Percent":"2","Plus":"-","PlusStar":"-","Star":"-","Total":"6"},{"Base":"1","Grade":"65","Percent":"0","Plus":"-","PlusStar":"-","Star":"-","Total":"1"},{"Base":"-","Grade":"66","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"-","Grade":"67","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"-","Grade":"68","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"-","Grade":"69","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"-","Grade":"70","Percent":"-","Plus":"-","PlusStar":"-","Star":"-","Total":"-"},{"Base":"211","Grade":"Total","Percent":"","Plus":null,"PlusStar":null,"Star":null,"Total":"211"}],"errorType":null}};
        }
        else if ('cac-guide' == type){
            $scope.staticGuides[type] = {"GetCACPopGuideResult":{"ErrorMessage":null,"Type":"Success","Value":[{"Gold":"-","Grade":"1","Green":"-"},{"Gold":"-","Grade":"2","Green":"-"},{"Gold":"-","Grade":"3","Green":"-"},{"Gold":"-","Grade":"4","Green":"-"},{"Gold":"-","Grade":"6","Green":"-"},{"Gold":"-","Grade":"8","Green":"-"},{"Gold":"-","Grade":"10","Green":"-"},{"Gold":"-","Grade":"12","Green":"-"},{"Gold":"-","Grade":"15","Green":"-"},{"Gold":"-","Grade":"20","Green":"1"},{"Gold":"-","Grade":"25","Green":"2"},{"Gold":"-","Grade":"30","Green":"1"},{"Gold":"-","Grade":"35","Green":"-"},{"Gold":"-","Grade":"40","Green":"3"},{"Gold":"-","Grade":"45","Green":"2"},{"Gold":"-","Grade":"50","Green":"1"},{"Gold":"-","Grade":"53","Green":"-"},{"Gold":"-","Grade":"55","Green":"2"},{"Gold":"-","Grade":"58","Green":"4"},{"Gold":"-","Grade":"60","Green":"-"},{"Gold":"-","Grade":"61","Green":"-"},{"Gold":"-","Grade":"62","Green":"2"},{"Gold":"-","Grade":"63","Green":"3"},{"Gold":"-","Grade":"64","Green":"-"},{"Gold":"-","Grade":"65","Green":"-"},{"Gold":"-","Grade":"66","Green":"-"},{"Gold":"-","Grade":"67","Green":"-"},{"Gold":"-","Grade":"68","Green":"-"},{"Gold":"-","Grade":"69","Green":"-"},{"Gold":"-","Grade":"70","Green":"-"},{"Gold":null,"Grade":"Total","Green":"21"}],"errorType":null}};
        }*/
    }

    $scope.staticGuideTotalsFromRows = function(column, rows){
        var total = 0;
        var val = 0;
        for (var i=0; i<rows.length; i++){
            val = parseInt(rows[i][column]);
            if (typeof val == 'number'){
                total += val;
            }
        }
        return total;
    }

    $scope.orderedStaticGuideFieldNames = function(row, type){
        var columns = Object.keys(row);
        var filteredColumns = [];
        for (var i=0; i<columns.length; i++){
            if (columns[i] != '$$hashKey'){
                if (!(type == 'apr-guide' && columns[i] == 'auction_lot')){
                    filteredColumns.push(columns[i]);
                }
            }
        }
        if (type == 'apr-guide'){
            filteredColumns = ['auction_lot.cover_thumbnail','auction_lot.lot_number','auction_lot.title','auctiondate',/* 'certification','grade',*/ 'prices_realized'];
        }
        else if (type == 'population-guide'){
            var ordered = ['service','grade','population','plus','pophigher','total'];
            filteredColumns = [];
            for (var i=0; i<ordered.length; i++){
                if (columns.indexOf(ordered[i]) > -1){
                    filteredColumns.push(ordered[i]);
                }
            }
        }
        else if (type == 'price-guide'){            
            var ordered = ['grade','cdn','cpg','cdncac','trends',/*'cacmarketvalue',*/'pcgsprice','pcgspriceplus','ngcprice','ngcpriceplus'];
            filteredColumns = [];
            for (var i=0; i<ordered.length; i++){
                if (columns.indexOf(ordered[i]) > -1){
                    filteredColumns.push(ordered[i]);
                }
            }
        }
        else {
            filteredColumns.sort(function(a,b){
                if (a == 'type'){
                    return -1;
                }
                if (b == 'type'){
                    return 1;
                }
                if (a == 'total'){
                    return 1;
                }
                if (b == 'total'){
                    return -1;
                }

                // Set 'g4' as earlier than 'g35' for example
                if (a.length > 1 && a[0] == 'g' && !isNaN(parseFloat(a[1])) && isFinite(a[1]) && b.length > 1 && b[0] == 'g' && !isNaN(parseFloat(b[1])) && isFinite(b[1])){
                    var aFiltered = a.replace("+","").replace("p","");
                    var bFiltered = b.replace("+","").replace("p","");
                    if (aFiltered.length < bFiltered.length){
                        return -1;
                    }
                    else if (aFiltered.length > bFiltered.length){
                        return 1;
                    }
                    else {
                        // Comparing the "68" in g68 to "69" in g69
                        if (parseInt(aFiltered.slice(1)) < parseInt(bFiltered.slice(1))){
                            return -1;
                        }
                        else if (parseInt(aFiltered.slice(1)) > parseInt(bFiltered.slice(1))){
                            return 1;
                        }
                        // In this else clause, we are comparing g68 vs g68p, and g68p needs to be greater.
                        else {
                            if (a.slice(1).length > b.slice(1).length){
                                return 1;
                            }
                            else {
                                return -1;
                            }
                        }
                    }
                }

                if (type == 'price-guide'){
                    if (a == 'grade'){
                        return -1;
                    }
                    else if (b == 'grade'){
                        return 1;
                    }
                }
            });
        }
        return filteredColumns;
    }

    $scope.staticGuideFieldLabel = function(fieldname, type){
        if (type == 'apr-guide'){
            var mapping = {
                'auction_lot.cover_thumbnail': 'Image',
                'prices_realized': 'Realized**',
                'auctiondate': 'Date',
                'auction_lot.lot_number': 'Auction/Lot',
                'auction_lot.title': 'Description'
            }
            if (mapping.hasOwnProperty(fieldname)){
                return mapping[fieldname];
            }
            return fieldname;
        }
        else {
            var mapping = {
                'gradetype': "Grade",
                'grade': "Grade",
                'type': "Grade",
                'cdncac': 'CAC Market Review',
                'proofmint': 'Proof/Mint',
                'cacmarketvalue': 'CAC Market Values',
                'pophigher': 'Population in Higher Grade',
                'population': 'Population in this Grade',
                'ccdn_ngc': 'ngc +',
                'ccdn_pcgs': 'pcgs +',
                'ngcprice': 'NGC Price Guide',
                'pcgsprice': 'PCGS Price Guide',
                'ngcpriceplus': 'NGC +',
                'pcgspriceplus': 'PCGS +',
                'trends': 'Coin World Trends',
                'cpg': 'Collector\'s Price Guide',
                'cdn': 'Greysheet'
            }
            if (mapping.hasOwnProperty(fieldname)){
                return mapping[fieldname];
            }
            else if (fieldname.length > 1 && fieldname.search(/g[0-9]+(p)?$/i) > -1){
                return fieldname.slice(1).replace("p","+");
            }
            return fieldname;
        }
    }

    // Returns a map of {'row_id': '1-324', ...}
    $scope.staticGuideFieldValues = function(row, type){
        var fieldNames = $scope.orderedStaticGuideFieldNames(row, type);
        var orderedValues = {};
        for (var i=0; i<fieldNames.length; i++){
            if (row.hasOwnProperty(fieldNames[i])){
                var currValue = $scope.staticGuideAmendFieldValue(fieldNames[i], row[fieldNames[i]], type);
                orderedValues[fieldNames[i]] = currValue;
            }
            else {
                var subFields = fieldNames[i].split(".");
                var currValue = null;
                if (subFields.length > 1){
                    currValue = row;
                    for (var j=0; j<subFields.length; j++){
                        if (j + 1 < subFields.length){
                            if (!currValue.hasOwnProperty(subFields[j])){
                                currValue = null;
                                break;
                            }
                            if (currValue !== null) {
                                currValue = currValue[subFields[j]]; // Recurse one level down
                            }
                        }
                        else {
                            if (currValue !== null) {
                                currValue = $scope.staticGuideAmendFieldValue(subFields[j], currValue[subFields[j]], type);
                            }
                        }
                    }
                    orderedValues[fieldNames[i]] = currValue;
                }
            }
        }
        return orderedValues;
    }

    $scope.staticGuideAmendFieldValue = function(fieldname, value, type){
        var currValue;
        /*if ('auctiondate'==fieldname && value){
            var splitted = value.split(" ").slice(0,-1);
            currValue = splitted.join(" ");
        }
        else {*/
            currValue = value;
        //}
        return currValue;
    }

    // Returns an array of ['1-324',...] in the correct order of field names
    $scope.orderedStaticGuideFieldValues = function(row, type){
        var fieldNames = $scope.orderedStaticGuideFieldNames(row, type);
        var orderedValues = [];
        var fieldValues = $scope.staticGuideFieldValues(row, type);
        for (var i=0; i<fieldNames.length; i++){
            orderedValues.push(fieldValues[fieldNames[i]]);
        }
        return orderedValues;
    }

	$scope.init(viewVars.lot); 

    $scope.WMService.calculateLocalTimeDifferenceWithServerTime();
}]);