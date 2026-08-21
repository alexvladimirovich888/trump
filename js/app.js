var ngModules = ['ngAnimate', 'ngSanitize', 'ui.bootstrap', 'timer', 'checklist-model','pascalprecht.translate'];
if (viewVars.features.searchSuggestions && viewVars.brand != 'admin'){
  ngModules = ngModules.concat('ngMaterial'); // Needed for search box autocomplete
}
if (viewVars.features.bidSuggestionsInfiniteScroll && viewVars.brand !== 'admin'){
  ngModules = ngModules.concat('hg.scrollStop');
}
if (viewVars.brand == 'admin'){
  ngModules = ngModules.concat('dndLists','ngDroplet','selectize', 'ngFileUpload', 'ngOboe');
}else {
  
}

if(viewVars.currentRouteName == 'auction-quickbid-slug' || viewVars.currentRouteName == 'auction-quickbid'){
  ngModules = ngModules.concat('selectize');
}
if(viewVars.hasOwnProperty('isLotsMapView') && viewVars.isLotsMapView){
  ngModules = ngModules.concat('ngMap', 'angular-loading-bar');
}
if (viewVars.brand == 'admin' && ['auction-create','auction-edit','new-property','edit-property'].indexOf(viewVars.currentRouteName) != -1){
  ngModules = ngModules.concat('ui.bootstrap.datetimepicker','google.places');
}

if(viewVars.features.calendar && viewVars.brand != 'admin'){
  ngModules = ngModules.concat('mwl.calendar');
}

if(viewVars.brand == 'admin' && ['static-page-settings','static-page-settings-edit','edit-property','new-property'].indexOf(viewVars.currentRouteName) != -1){
  ngModules = ngModules.concat('froala'); 
}

if(viewVars.brand == 'admin' && ['realEstate'].indexOf(viewVars.products) !== -1 && ['new-lot','edit-lot','edit-lot','create-lot'].indexOf(viewVars.currentRouteName) != -1){
  ngModules = ngModules.concat('froala');
}

if(viewVars.brand != 'admin'){
  ngModules = ngModules.concat('infinite-scroll');
}

if (viewVars.brand == 'admin' && ['s3-browser','s3-upload','s3-upload-auction','import-lots'].indexOf(viewVars.currentRouteName) != -1){
  ngModules = ngModules.concat('infinite-scroll');
}
if (['live-auction-mobile'].indexOf(viewVars.currentRouteName) != -1){
  ngModules = ngModules.concat('rzModule');
}

if(['profile'].indexOf(viewVars.currentRouteName) != -1 && viewVars.paymentProcessor == 'nmi'){
  
}

var WebModule = angular.module('WebModule',ngModules);

if (ngModules.indexOf('ngMaterial') > -1){
  WebModule.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
      .primaryPalette('red');
  });
}

var serverTimeDifference = 0;

moment.now = function() {
    var dt = new Date();
    if (serverTimeDifference > 0 ) {
        // local time is ahead to Server time so subtracts the same time difference in the date
        dt.setSeconds( dt.getSeconds() - serverTimeDifference);
    } else if (serverTimeDifference < 0) {
        // local time is behind to Server time so add the same time difference in the date
        dt.setSeconds( dt.getSeconds() + (-1 * serverTimeDifference)); //convert -ve  no in to +ve and add this time
    }

    return dt;
}

WebModule.filter('firstUpper', function() {
    return function(input, scope) {
        return input ? input.substring(0,1).toUpperCase()+input.substring(1).toLowerCase() : "";
    }
});

WebModule.filter('translateDropDown', function($filter) {
  return function(input, scope) {
    var translatedString = input.select_label;
    if (input.hasOwnProperty('translate') === false) {
      // translate by default
      translatedString = $filter('translate')(input.select_label);
    } else if (input.hasOwnProperty('translate') === true && input.translate === true) {
      // translate still as it is explicit
      translatedString = $filter('translate')(input.select_label);
    } else {
      // do not translate
      translatedString = input.select_label;
    }
    return translatedString;
  }
});

WebModule.filter('encodeUri', function() {
  return window.encodeURIComponent;
});

WebModule.filter('nl2br', function($sce){
    return function(msg) { 
        var msg = (msg + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1'+ "<br>" +'$2');
        return $sce.trustAsHtml(msg);
    }
});

WebModule.filter('split', function() {
    return function(input, splitChar, splitIndex) {
        // do some bounds checking here to ensure it has that index
        return input.split(splitChar)[splitIndex];
    }
});

WebModule.filter('objectLength', function() {
    return function(obj) {
        return Object.keys(obj).length;
    }
});

viewVars.keypressCodes = {
  'Enter': [13],
  'Up': [38],
  'Down': [40]
};

/*viewVars.keypressCodes = {};
for (var key in viewVars.keypressActions){
  for (var i = viewVars.keypressActions[key].length - 1; i >= 0; i--) {
    viewVars.keypressCodes[viewVars.keypressActions[key][i]] = key;
  };
};
console.log(viewVars.keypressCodes);*/

/*
This directive allows us to pass a function in on an enter key to do what we want.
 */
WebModule.directive('ngEnter', function () {
  return function (scope, element, attrs) {
    element.bind("keydown keypress", function (event) {
        if(event.which === 13) {
          scope.$apply(function (){
              scope.$eval(attrs.ngEnter);
          });

          event.preventDefault();
        }
    });
  }
});

WebModule.directive('customOnChange', function() {
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      var onChangeFunc = scope.$eval(attrs.customOnChange);
      element.bind('change', onChangeFunc);
    }
  };
});

WebModule.directive('clickOutside', function ($document, $parse, $timeout) {
  return {
    restrict: 'A',
    link: function($scope, elem, attr) {
      // postpone linking to next digest to allow for unique id generation
      $timeout(function() {
        var classList = (attr.outsideIfNot !== undefined) ? attr.outsideIfNot.split(/[ ,]+/) : [],
          fn;

        function eventHandler(e) {
          var i,
            element,
            r,
            id,
            classNames,
            l;

          // check if our element already hidden and abort if so
          if (angular.element(elem).hasClass("ng-hide")) {
            return;
          }

          // if there is no click target, no point going on
          if (!e || !e.target) {
             return;
          }

          // loop through the available elements, looking for classes in the class list that might match and so will eat
          for (element = e.target; element; element = element.parentNode) {
            // check if the element is the same element the directive is attached to and exit if so (props @CosticaPuntaru)
            if (element === elem[0]) {
              return;
            }
            
            // now we have done the initial checks, start gathering id's and classes
            id = element.id,
            classNames = element.className,
            l = classList.length;

            // Unwrap SVGAnimatedString classes
            if (classNames && classNames.baseVal !== undefined) {
              classNames = classNames.baseVal;
            }

            // if there are no class names on the element clicked, skip the check
            if (classNames || id) {

              // loop through the elements id's and classnames looking for exceptions
              for (i = 0; i < l; i++) {
                //prepare regex for class word matching
                r = new RegExp('\\b' + classList[i] + '\\b');

                // check for exact matches on id's or classes, but only if they exist in the first place
                if ((id !== undefined && id === classList[i]) || (classNames && r.test(classNames))) {
                  // now let's exit out as it is an element that has been defined as being ignored for clicking outside
                  return;
                }
              }
            }
          }

          // if we have got this far, then we are good to go with processing the command passed in via the click-outside attribute
          $timeout(function() {
              fn = $parse(attr['clickOutside']);
              fn($scope, { event: e });
          });
        }

        // if the devices has a touchscreen, listen for this event
        if (_hasTouch()) {
          $document.on('touchstart', eventHandler);
        }

        // still listen for the click event even if there is touch to cater for touchscreen laptops
        $document.on('click', eventHandler);

        // when the scope is destroyed, clean up the documents event handlers as we don't want it hanging around
        $scope.$on('$destroy', function() {
          if (_hasTouch()) {
            $document.off('touchstart', eventHandler);
          }

          $document.off('click', eventHandler);
        });

        /**
         * @description Private function to attempt to figure out if we are on a touch device
         * @private
         **/
        function _hasTouch() {
          // works on most browsers, IE10/11 and Surface
          return 'ontouchstart' in window || navigator.maxTouchPoints;
        };
      });
    }
};
});


WebModule.directive('clickOutside', function ($document, $parse, $timeout) {
  return {
    restrict: 'A',
    link: function($scope, elem, attr) {
      // postpone linking to next digest to allow for unique id generation
      $timeout(function() {
        var classList = (attr.outsideIfNot !== undefined) ? attr.outsideIfNot.split(/[ ,]+/) : [],
          fn;

        function eventHandler(e) {
          var i,
            element,
            r,
            id,
            classNames,
            l;

          // check if our element already hidden and abort if so
          if (angular.element(elem).hasClass("ng-hide")) {
            return;
          }

          // if there is no click target, no point going on
          if (!e || !e.target) {
             return;
          }

          // loop through the available elements, looking for classes in the class list that might match and so will eat
          for (element = e.target; element; element = element.parentNode) {
            // check if the element is the same element the directive is attached to and exit if so (props @CosticaPuntaru)
            if (element === elem[0]) {
              return;
            }
            
            // now we have done the initial checks, start gathering id's and classes
            id = element.id,
            classNames = element.className,
            l = classList.length;

            // Unwrap SVGAnimatedString classes
            if (classNames && classNames.baseVal !== undefined) {
              classNames = classNames.baseVal;
            }

            // if there are no class names on the element clicked, skip the check
            if (classNames || id) {

              // loop through the elements id's and classnames looking for exceptions
              for (i = 0; i < l; i++) {
                //prepare regex for class word matching
                r = new RegExp('\\b' + classList[i] + '\\b');

                // check for exact matches on id's or classes, but only if they exist in the first place
                if ((id !== undefined && id === classList[i]) || (classNames && r.test(classNames))) {
                  // now let's exit out as it is an element that has been defined as being ignored for clicking outside
                  return;
                }
              }
            }
          }

          // if we have got this far, then we are good to go with processing the command passed in via the click-outside attribute
          $timeout(function() {
              fn = $parse(attr['clickOutside']);
              fn($scope, { event: e });
          });
        }

        // if the devices has a touchscreen, listen for this event
        if (_hasTouch()) {
          $document.on('touchstart', eventHandler);
        }

        // still listen for the click event even if there is touch to cater for touchscreen laptops
        $document.on('click', eventHandler);

        // when the scope is destroyed, clean up the documents event handlers as we don't want it hanging around
        $scope.$on('$destroy', function() {
          if (_hasTouch()) {
            $document.off('touchstart', eventHandler);
          }

          $document.off('click', eventHandler);
        });

        /**
         * @description Private function to attempt to figure out if we are on a touch device
         * @private
         **/
        function _hasTouch() {
          // works on most browsers, IE10/11 and Surface
          return 'ontouchstart' in window || navigator.maxTouchPoints;
        };
      });
    }
};
});

/**
 * Directive: amyAutomation
 * Dynamically sets the `amy-qa-attr` for automation testing if the cookie is enabled.
 * Uses $interpolate to evaluate the expression and $rootScope.setAutomationAttr for logic.
 *
 * Example: <div amy-automation="'FieldName:123'"></div>
 * Result:  <div amy-qa-attr="field_name_123"></div>
 */
WebModule.directive('amyAutomation', ['$rootScope', '$interpolate', function($rootScope, $interpolate) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            const expr = attrs.amyAutomation;
            const evaluated = $interpolate(expr)(scope);

            $rootScope.setAutomationAttr(evaluated, element);
        }
    };
}]);

/*viewVars.keypressCodes = {};
for (var key in viewVars.keypressActions){
  for (var i = viewVars.keypressActions[key].length - 1; i >= 0; i--) {
    viewVars.keypressCodes[viewVars.keypressActions[key][i]] = key;
  };
};
console.log(viewVars.keypressCodes);*/

var keypressFn = function(scope,element,attrs){
  element.bind("keydown", function (event) {
    //console.log(viewVars.keypressDirectives);
    var keyCodes = Object.keys(viewVars.keypressCodes);
    var keyCode = event.which.toString();

    for (var keyName in viewVars.keypressCodes){
      for (var i = viewVars.keypressCodes[keyName].length - 1; i >= 0; i--) {
        if (viewVars.keypressCodes[keyName][i].toString() == keyCode && attrs.hasOwnProperty('ngKey'+keyName)){
          scope.$apply(function (){
              scope.$eval(attrs['ngKey'+keyName]);
          });

          /*event.preventDefault();*/
        }
      };
    };
  });
};

WebModule.directive('ngKeypress', function(){return keypressFn;});

/*WebModule.directive("watchScroll", function () {
    return function (scope, element, attrs) {
        scope.$watch("ajaxErrorMessage", function (value) {
            $(window).scroll();
        });
    };
});*/

// Set focus on an input field if the focusVar in `focus-me="focusVar"` is set to true.
// Taken from http://stackoverflow.com/questions/14833326/how-to-set-focus-on-input-field
WebModule.directive('focusMe', function($timeout, $parse) {
  return {
    //scope: true,   // optionally create a child scope
    link: function(scope, element, attrs) {
      var model = $parse(attrs.focusMe);
      scope.$watch(model, function(value) {
        //console.log('value=',value);
        if(value === true) { 
          $timeout(function() {
            element[0].focus(); 
          });
        }
      });
    }
  };
});

WebModule.directive('errSrc', function() {
    return {
      link: function(scope, element, attrs) {
        element.bind('error', function() {
          if (attrs.src != attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
        
        attrs.$observe('ngSrc', function(value) {
          if (!value && attrs.errSrc) {
            attrs.$set('src', attrs.errSrc);
          }
        });
      }
    }
  });

/*this directive allows anything to be clickable to go to a url*/
WebModule.directive('goClick', function ($window) {
  return function (scope, element, attrs){
    var path;

    attrs.$observe('goClick', function (val){
      path = val;
    });

    element.bind('click', function(){
      scope.$apply(function(){
        $window.location.href = path;
      });
    });
  };
});


WebModule.config(function($animateProvider) {
  $animateProvider.classNameFilter(/animate/);
})
WebModule.config(function($locationProvider){
  if(viewVars.currentRouteName == 'live-auction' || viewVars.currentRouteName == 'live-auction-page'){
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    }).hashPrefix('!');
  }
});


WebModule.config(['$translateProvider', function ($translateProvider) {
  /*$translateProvider.useStaticFilesLoader({
    files: [{
        prefix: '/translations/locale-',
        suffix: '.json'
    }]
  });
  $translateProvider.preferredLanguage(viewVars.locale);*/
  $translateProvider.translations(viewVars.locale, viewVars.translation);
  $translateProvider.translations('en', viewVars.translationFallback);
    if (viewVars.shouldApplyCspNonce === true) {
        // CSP route: use the eval-free interpolator (csp-safe-interpolation.js).
        $translateProvider.addInterpolation('cspSafeInterpolation');
        $translateProvider.useInterpolation('cspSafeInterpolation');
    } else {
        $translateProvider.useMessageFormatInterpolation();
    }
  $translateProvider.preferredLanguage(viewVars.locale);
  $translateProvider.useSanitizeValueStrategy('escapeParameters');
  $translateProvider.fallbackLanguage('en');

  //todo when we want to change the language we will use $translate.use(key)
  //i suggest we set that in config in viewVars where empty just defaults to english
}]);
/*WebModule.config(function($httpProvider){
  // Use x-www-form-urlencoded Content-Type
  $httpProvider.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
*/
  /**
   * The workhorse; converts an object to x-www-form-urlencoded serialization.
   * @param {Object} obj
   * @return {String}
   */ 
  /*var param = function(obj) {
    var query = '', name, value, fullSubName, subName, subValue, innerObj, i;

    for(name in obj) {
      value = obj[name];

      if(value instanceof Array) {
        for(i=0; i<value.length; ++i) {
          subValue = value[i];
          fullSubName = name + '[' + i + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value instanceof Object) {
        for(subName in value) {
          subValue = value[subName];
          fullSubName = name + '[' + subName + ']';
          innerObj = {};
          innerObj[fullSubName] = subValue;
          query += param(innerObj) + '&';
        }
      }
      else if(value !== undefined && value !== null)
        query += encodeURIComponent(name) + '=' + encodeURIComponent(value) + '&';
    }

    return query.length ? query.substr(0, query.length - 1) : query;
  };

  // Override $http service's default transformRequest
  $httpProvider.defaults.transformRequest = [function(data) {
      return data;
    return (angular.isObject(data) && String(data) !== '[object File]') ? param(data) : data;
  }];
});*/
WebModule.directive('focusOn', function() {
   return function(scope, elem, attr) {
      scope.$on(attr.focusOn, function(e) {
          elem[0].focus();
      });
   };
});

WebModule.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

Array.unique = function(arr) {
    var unique = [];
    for (var i = 0; i < arr.length; i++) {
        if (unique.indexOf(arr[i]) == -1) {
            unique.push(arr[i]);
        }
    }
    return unique;
};

Array.range = function(start, end, step) {
    var range = [];
    var typeofStart = typeof start;
    var typeofEnd = typeof end;

    if (step === 0) {
        throw TypeError("Step cannot be zero.");
    }

    if (typeofStart == "undefined" || typeofEnd == "undefined") {
        throw TypeError("Must pass start and end arguments.");
    } else if (typeofStart != typeofEnd) {
        throw TypeError("Start and end arguments must be of same type.");
    }

    typeof step == "undefined" && (step = 1);

    if (end < start) {
        step = -step;
    }

    if (typeofStart == "number") {

        while (step > 0 ? end >= start : end <= start) {
            range.push(start);
            start += step;
        }

    } else if (typeofStart == "string") {

        if (start.length != 1 || end.length != 1) {
            throw TypeError("Only strings with one character are supported.");
        }

        start = start.charCodeAt(0);
        end = end.charCodeAt(0);

        while (step > 0 ? end >= start : end <= start) {
            range.push(String.fromCharCode(start));
            start += step;
        }

    } else {
        throw TypeError("Only string and number types are supported");
    }

    return range;
}

WebModule.filter('moment', function() {
    return function(dateString, format, timezone) {
      var momentObj = moment(dateString);
      if (typeof (timezone) != 'undefined' && timezone){
        momentObj.tz(timezone);
      }
      return momentObj.locale(viewVars.locale).format(format);
    };
});

WebModule.filter('toTrusted', function ($sce) {
    return function (value) {
        return $sce.trustAsHtml(value);
    };
});

WebModule.filter('myCurrency', ['$filter', function ($filter) {
  return function(input) {
    input = parseFloat(input);

    if(input % 1 === 0) {
      input = input.toFixed(0);
    }
    else {
      input = input.toFixed(2);
    }

    return '$' + input.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
}]);

WebModule.filter("replace", [ function(){
 return function(str, pattern, replacement, global){
    global = (typeof global == 'undefined' ? true : global);
    try {
      return (str || '').replace(new RegExp(pattern,global ? "g": ""),function(match, group) {
        return replacement;
      });  
    } catch(e) {
      console.error("error in string.replace", e);
      return (str || '');
    }     
  } 
 }                
]);

WebModule.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
});

WebModule.filter('slice', function() {
  return function(arr, start, end) {
    return (arr || []).slice(start, end);
  };
});
WebModule.filter('reverse', function() {
  return function(items) {
    if (typeof(items) != 'undefined'){
      return items.slice().reverse(); 
    }
  };
});
WebModule.filter('truncateWith', function() {
  return function(string, length, append) {
    append = (append === undefined) ? '...' : append;
    length = (length === undefined) ? 50 : length;
    if (string.length > length) {
      return string.substring(0, length).trim() + append;
    } else {
      return string;
    }
  };
});

WebModule.filter('bidPct', ['WMService', 'LotService', function(WMService, LotService) {
  /**
   * The purpose of this function is to take a bid percentage and format it
   * @param  {Float} bidAmount  percentage bid
   * @param  {Integer} decimals  number of decimal places, defaults to 1
   * @return {String}           formatted percentage
   */
  return function(bidAmount, decimals) {
    var prettyAmount;
    if (bidAmount == '' || !bidAmount) {
      return '';
    }
    if (typeof decimals == 'undefined' || decimals == null) {
      decimals = 1;
    }
    prettyAmount = BigNumber(bidAmount).toFixed(decimals) + '%';
    return prettyAmount;
  };
}]);

WebModule.filter('pricePctSafe', function($filter) {
    /**
   * This function is a transitional function that will send to the price filter with a fake lot so that we
   * can format prices even if the auction is decimal
   * params are the same as price filter
   */
  // FIXME delete this when we fix the price filter everywhere
  return function(price, currency_code, decimals, lot, remove00) {
    lot = {
      auction: {
        percentage_bidding: false,
      }
    }
    price = $filter('price')(price, currency_code, decimals, lot, remove00);
    return price;
  };
});
WebModule.filter('price', ['WMService', 'LotService', function(WMService, LotService) {
  /**
   * The purpose of this function is to take a price (AND ONLY A PRICE, DO NOT SEND PERCENTAGES!!) and format it
   * @param  {Integer|Float} price   price of the lot
   * @param  {String} currency_code  currency code of the lot
   * @param  {Integer} decimals      number of decimal places. defaults to 2
   * @param  {Object} lot            lot object
   * @param  {Boolean} remove00      remove the .00 from a price like 100.00. defaults to true
   * @return {String}                Formatted price
   */
  // FIXME currently this function can format percentages because of some bad logic. We need to remove that.
  // will also allow us to remove lot as a parameter.
  // We MUST convert all percentage value filters before we remove the code here
  return function(price, currency_code, decimals, lot, remove00) {
    if (typeof remove00 == 'undefined' || remove00 == null) {
      remove00 = true;
    }
    if(price == "" || !price) return "";
    var format = WMService.currencyFormat() || '{currency-sign}{price}';
    if(viewVars.locale == 'fr'){ //we want the currency sign after
      format = WMService.currencyFormat() || '{price}{currency-sign}';
    }
    if(typeof currency_code == 'undefined') currency_code = 'USD';
    if (currency_code == null){
      format = '{price}';
    }
    if(typeof decimals == 'undefined' || decimals == null) {
      if (WMService.isPercentageBiddingEnabled(lot) === true ) {
        decimals = 1;
      } else {
        decimals = 2;
      }
    }

    if (WMService.isPercentageBiddingEnabled(lot) === true && LotService.isSold(lot) === false) {
      return BigNumber(price).toFixed(decimals) + '%';
    }

    var newPrice = parseFloat(price).toFixed(decimals);
    newPrice = newPrice.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (remove00 == true) {
      var removeSuffix = '.00';
      if (newPrice.length > 3 && newPrice.indexOf(removeSuffix,newPrice.length-removeSuffix.length) !== -1){
        newPrice = newPrice.slice(0,-removeSuffix.length);
      }
    }
    var price = format
                  .replace("{currency-code}", currency_code)
                  .replace("{price}", newPrice)
                  .replace("{currency-sign}", WMService.currencySign(currency_code))
                  .trim();
    return price;
  };
}]);
WebModule.filter('ackerJpyPrice', ['WMService', function(WMService) {
  return function(price) {
    if(price == "" || !price) return "";
    format = '{price}';
    var newPrice = parseFloat(price);
    var jpyLabel = "";
    if ( price >= 10000 ){
      jpyLabel = '万円';
      newPrice = newPrice / 10000 ;
      //$('span#LclBidNext2').number(jpbid,1);
      newPrice = parseFloat(newPrice).toFixed(1);
    }else{
      jpyLabel = '円';
      newPrice = parseFloat(newPrice).toFixed(0);
      //$('span#LclBidNext2').number(jpbid);
    }
    var price = format.replace("{price}", newPrice).trim();
    return price+jpyLabel;
  };
}]);
WebModule.filter('tel', function () {
    return function (tel) {
        if (!tel) { return ''; }

        var value = tel.toString().trim().replace(/^\+/, '');

        if (value.match(/[^0-9]/)) {
            return tel;
        }

        var country, city, number;

        switch (value.length) {
            case 10: // +1PPP####### -> C (PPP) ###-####
                country = 1;
                city = value.slice(0, 3);
                number = value.slice(3);
                break;

            case 11: // +CPPP####### -> CCC (PP) ###-####
                country = value[0];
                city = value.slice(1, 4);
                number = value.slice(4);
                break;

            case 12: // +CCCPP####### -> CCC (PP) ###-####
                country = value.slice(0, 3);
                city = value.slice(3, 5);
                number = value.slice(5);
                break;

            default:
                return tel;
        }

        if (country == 1) {
            country = "";
        }

        number = number.slice(0, 3) + '-' + number.slice(3);

        return (country + " (" + city + ") " + number).trim();
    };
});

var hasGoogleAnalytics = function(){
    return viewVars.googleAnalytics['keys'].hasOwnProperty(viewVars.brand) && viewVars.googleAnalytics['keys'][viewVars.brand] && viewVars.googleAnalytics['keys'][viewVars.brand].hasOwnProperty(viewVars.deploymentEnvironment);
};

var isGoogleAnalytics4 = function() {
    return hasGoogleAnalytics() && viewVars.googleAnalytics['keys'][viewVars.brand][viewVars.deploymentEnvironment].startsWith('G-') && typeof gtag === 'function';
};

var sendGoogleAnalyticsData = function (...params) {
    if (hasGoogleAnalytics()) {
        if (isGoogleAnalytics4()) {
            var indexToKeyMapping = {
                2 : 'event_category',
                4 : 'event_label',
                5 : 'value'
            };

            // Create gtag event only if the given payload is for sending an event
            if (params.length >= 3 && params[0] === 'send' && params[1] === 'event') {
                var eventPayload = {};

                for (var i in indexToKeyMapping) {
                    if (typeof params[i] !== 'undefined') {
                        eventPayload[indexToKeyMapping[i]] = params[i];
                    }
                }

                // Prepare gtag supported params
                gtag('event', params[3], eventPayload);
            }
        } else if (typeof ga === 'function') { // Making sure the Google analytics js is loaded and the ga function is available
            ga(...params);
        }
    }
};

WebModule.controller('RootController', ['$rootScope','WMService','LotService','FilterService','$http','$timeout', 'AMDate', '$interpolate', '$scope', '$filter', function($rootScope, WMService, LotService, FilterService, $http, $timeout, AMDate, $interpolate, $scope, $filter){
  $rootScope.template = {
    dynamicTitleActive: false,
    searchOpen: false
  };
  $rootScope.isPopup = window.name == 'auctionmobility-popup';
  $rootScope.moment = moment;
  $rootScope.WMService = WMService;
  $rootScope.LotService = LotService;
  $rootScope.FilterService = FilterService;
  $rootScope.Object = Object;
  $rootScope.Array = Array;
  $rootScope.JSON = JSON;
  $rootScope.parseFloat = parseFloat;
  $rootScope.viewVars = viewVars;
  $rootScope.location = location;
  $rootScope.AMDate = AMDate;
  $rootScope.ajaxErrorMessage = '';
  $rootScope.menu = {
    upcomingAuctions: viewVars.upcomingAuctions,
    upcomingAuctionsBidSheets: [],
    //notifications: viewVars.notifications
    notificationsToggle: false
  };
  if (viewVars.brand == 'ogclearinghouse'){
    $rootScope.footerLinks = [
      {name:'Privacy Policy',url:'/privacy-policy'},
      {name:'Conditions of Sale',url:'/conditions-of-sale'},
      {name:'Past Successes',url:'http://www.ogclearinghouse.com/PastSuccesses/past.asp'},
      {name:'News',url:'http://www.ogclearinghouse.com/press.asp'},
      {name:'Contact',url:'http://www.ogclearinghouse.com/ContactUs.asp'}
    ];
    
    // Notify OG that this token is still valid.
    if (viewVars.hasOwnProperty('ogSessionToken') && viewVars.ogSessionToken){
      var promise = $http.get("http://webservices.ogclearinghouse.com/ssoservices/ogsso.svc/ValidateToken?token="+viewVars.ogSessionToken);
      promise.success(function(data){
        console.log(data);
        // If OG says the token is no longer valid, get phalcon to drop it so we
        // no longer notify OG with an invalid token.
        if (!data.hasOwnProperty('d') || !data.d || !data.d.hasOwnProperty('sessiontoken') || !data.d.isactive){
          var dropTokenPromise = $http.get(viewVars.endpoints.dropOgSSO);
          dropTokenPromise.success(function(dropTokenResponse){
            console.log(dropTokenResponse);
          })
        }
      });
    }
  }
  //check if mobile for ipad and android devices
  $rootScope.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|PlayBook|IEMobile|Opera Mini/i.test(navigator.userAgent) == true;
  $rootScope.isiPhone = /iPhone/i.test(navigator.userAgent) == true;
  $rootScope.isiPad = /iPad/i.test(navigator.userAgent) == true;
  $rootScope.isSafari11 = /\/11.* Safari/i.test(navigator.userAgent) == true;
  $rootScope.isMobileNotiPad = /Android|webOS|iPhone|iPod|BlackBerry|PlayBook|IEMobile|Opera Mini/i.test(navigator.userAgent) == true;
  $rootScope.isLandscape = window.matchMedia("(orientation: landscape)").matches;
  $rootScope.isPortrait = window.matchMedia("(orientation: portrait)").matches;
  $rootScope.isResponsiveDesktopOnly = viewVars.isResponsive == 'desktop';
  $rootScope.isFullyResponsive = viewVars.isResponsive == true;
  //console.log(navigator.userAgent);
  //console.log( $rootScope.isLandscape);
  /*for (var key in $rootScope.menu.notifications.result_page){
    $rootScope.menu.notifications.result_page[key].friendly_created_at = moment($rootScope.menu.notifications.result_page[key].created_at).fromNow();
  }*/

  /*$rootScope.$watch("ajaxErrorMessage", function (value) {
      $(window).scroll();
  });*/

  //remove all of the live auction from the bidsheet link
  if(viewVars.brand == 'phillips'){
    for(var i =0; i<$rootScope.menu.upcomingAuctions.result_page.length; i++){
      if($rootScope.menu.upcomingAuctions.result_page[i].auction_type == 'live'){
        $rootScope.menu.upcomingAuctions.result_page.splice(i, 1);
      }
    }
  }

  if (viewVars.brand == 'alexcooper'){
    var queryParams = FilterService.queryParams(location.search);
    // Update the alexcooper global search input with the value from GET params.
    if (queryParams.hasOwnProperty("search")){
      $rootScope.globalSearchValue = queryParams.search;
    }
  }

  if ($rootScope.menu != null && $rootScope.menu.hasOwnProperty('upcomingAuctions') && $rootScope.menu.upcomingAuctions != null && $rootScope.menu.upcomingAuctions.hasOwnProperty('result_page')){
    for (var i=0; i<$rootScope.menu.upcomingAuctions.result_page.length; i++){
      if (WMService.auctionRegistration($rootScope.menu.upcomingAuctions.result_page[i]) && (WMService.isAbsenteeBiddingEnabled($rootScope.menu.upcomingAuctions.result_page[i]))){
        $rootScope.menu.upcomingAuctionsBidSheets.push($rootScope.menu.upcomingAuctions.result_page[i]);
      }
    };
  }

  $rootScope.closeCookieWarning = function (e) {
    viewVars.hideCookieWarning = true;
    var $bottomFilters = $(".bottom-scroll-sticky");
    if ($bottomFilters.length > 0){
      $bottomFilters.css({
        'bottom': 0
      });
    }
    var now = new Date();
    var time = now.getTime();
    var expireTime = time + 1000 * 36000 * 24 * 30;
    now.setTime(expireTime);
    var tempExp = 'Wed, 31 Oct 2012 08:50:17 GMT';
    document.cookie = 'hide_cookie_warning' + '=; Path=/; Expires=' + now.toGMTString() + ';';
  }
  $rootScope.isOverflown = function (e) {
    var e = $(e);
    if (typeof e[0] === 'undefined') {
      return false;
    }
    if(!$rootScope.$$phase){
      $rootScope.$apply();
    }
    return e.outerHeight() < e[0].scrollHeight;
  }

  $rootScope.isMoreBidSuggestionsNeeded = function(lot){
    if (lot._bid_suggestions_scroll_event && lot._bid_suggestions_scroll_event.direction == 'down'){
      var $choicesContainer = lot._bid_suggestions_scroll_event.target;
      var visibleEndOffsetPx = $choicesContainer.height() + $choicesContainer.scrollTop();
      //console.log($choicesContainer.scrollTop());
      // If we're near the end of list of suggestions, return true so we end up adding more suggestions.
      var $choices = $choicesContainer.find(".bid-suggestion");
      if ($choices.length && $choices.height()){
        return (visibleEndOffsetPx + 100) > ($choices.length * $choices.height());
      }
    }
    return false;
  }

  $rootScope.setBidSuggestionsScrollProperties = function(lot, event){
    lot._bid_suggestions_scroll_event = event;
  }

  $rootScope.isMobileWidth = function(){
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0) <= 991;
  }

$rootScope.popoverThumbnailLots = function(timeoutDelay, offset) {
    //Timeout delay set to load after html bind
    var timeoutDelayInSecond = timeoutDelay ? timeoutDelay : 5000;
    var count = offset;
    var getImageSrc = null;
    setTimeout(function(timeoutDelayInSecond) {
        $('.popover-thumbnail').mouseenter(function() {
            getImageSrc = $(this).parent().find('img.cover-thumbnail').attr('src');
            $('.tabsWrap.position-fixed').css('z-index', '1111');
        });
        $('.popover-thumbnail').mouseout(function() {
            $('.tabsWrap.position-fixed').css('z-index', '111');
        });
        $(".popover-thumbnail").each(function() {
            lot_number_id =  $(this).val();
            if (offset) {
                count++;
            }
            if ((offset && offset <= count) || !offset) {
                popupPosition = viewVars.currentRouteName == 'live-auction' ? 'left' : 'right';
                popupOffset = viewVars.currentRouteName == 'live-auction' ? 150 : 0;
                var lot_hover_id = lot_number_id;
                var popoverInstance = PopoverComponent.init({
                    ele: '[data-popover-target="#popover-target-'+ lot_hover_id +'"]',
                    position: popupPosition,
                    disableUpdatePosition: false,
                    showOnHover: true,
                    offset: popupOffset,
                    enterDelay: 500,
                    afterShow: function() {
                      if (getImageSrc) {
                          var getImageSrcPath = getImageSrc.substring(0, getImageSrc.indexOf('?'));
                          var imageToLoad = getImageSrcPath + '?width=450&height=450&resizeinbox=false';
                          var image = new Image();
                          image.onload = function () {
                              $('.popover-loader-' + lot_hover_id).addClass('hide-div');
                              $('#popover-img-' + lot_hover_id).attr('src', imageToLoad);
                                // Update position after image loads to handle viewport boundaries
                                if (popoverInstance && popoverInstance.popper && typeof popoverInstance.popper.updatePosition === 'function') {
                                    popoverInstance.popper.updatePosition();
                                }
                          }
                          image.src = imageToLoad;
                        }
                    },
                });
            }
        });
    }, timeoutDelayInSecond);
}

  if (viewVars.auctionmobilitySource === null) { //we only want to do this if it is null. If it is false then we do not care.
    var url = "https://c.auctionmobility.com/ajax/getcookie";
    var promise = $http.get(url, {withCredentials: true});
    promise.success(function(data){
      if(data == null) { //we have no cookie so set it to false
        var now = new Date();
        var minutes = 43200; //set for 30 days
        now.setTime(now.getTime() + (minutes * 60 * 1000));
        document.cookie = 'auctionmobility_source=false;expires='+now.toGMTString()+';path=/;domain=.'+document.domain;
      }else{
        var now = new Date();
        var minutes = 43200; //set for 30 days
        now.setTime(now.getTime() + (minutes * 60 * 1000));
        document.cookie = 'auctionmobility_source='+data+';expires='+now.toGMTString()+';path=/;domain=.'+document.domain;
      }
    });
    promise.error(function(data){
      //we want this to error to the console so that the user does not have an error at the top of the screen
      console.log("source error "+data);
    });
  }

  $rootScope.visible = function(values){
    var classes = "";
    if(viewVars.isResponsive !== true){
      // If its hidden on md, lg and xl, due to visible-xs or visible-sm classes alone, then make it hidden on sm and xs, so that mobile looks like desktop
      if (values.indexOf('md') == -1 && (values.indexOf('lg') == -1 && values.indexOf('xl') == -1) && (values.indexOf('xs') > -1 || values.indexOf('sm') > -1)){
        /*newValues = values;
        newValues.splice(newValues.indexOf('xs'),1);
        newValues.splice(newValues.indexOf('sm'),1);
        // We need these new values so that we have visible-lg and visible-xl classes added. This will result in xs, sm, and md classes hidden.
        newValues.push('lg');
        newValues.push('xl');*/
        return 'hidden';
      }
      // If its hidden on md, due to visible-lg or visible-xl classes, then make it hidden on sm and xs
      else if (values.indexOf('md') == -1 && (values.indexOf('lg') > -1 || values.indexOf('xl') > -1)){
        newValues = values;
        newValues.splice(newValues.indexOf('xs'),1);
        newValues.splice(newValues.indexOf('sm'),1);
        values = newValues;
        // In this case, we don't need to add visible lg or xl classes since they are already present, and they are already helping us make xs, sm and md hidden
      }
      // If its visible on md, make it visible on xs and sm
      else if (values.indexOf('md') > -1){
        newValues = values;
        if (newValues.indexOf('xs') == -1){
            newValues.push('xs');
        }
        if (newValues.indexOf('sm') == -1){
            newValues.push('sm');
        }
        values = newValues;
      }
    }
    for(var i=0; i<values.length; i++){
      classes += " visible-"+values[i];
    }
    return classes;
  }

  $rootScope.hidden = function(values){
    var classes = "";
    if(viewVars.isResponsive !== true){
      //If its visible on md, lg and xl, due to hidden-xs or hidden-sm classes alone, then simply drop the hidden-xs and hidden-sm classes so that mobile looks like desktop
      if (values.indexOf('md') == -1 && (values.indexOf('lg') == -1 && values.indexOf('xl') == -1) && (values.indexOf('xs') > -1 || values.indexOf('sm') > -1)){
        /*newValues = values;
        newValues.splice(newValues.indexOf('xs'),1);
        newValues.splice(newValues.indexOf('sm'),1);
        // We need these new values so that we have visible-lg and visible-xl classes added. This will result in xs, sm, and md classes hidden.
        newValues.push('lg');
        newValues.push('xl');
        values = newValues;*/
        values = [];
        return classes;
      }
      // If its visible on md, ensure that is visible on sm and xs as well by removing any hidden-sm and hidden-xs classes, if any.
      else if (values.indexOf('md') == -1){
        newValues = values;
        newValues.splice(newValues.indexOf('xs'),1);
        newValues.splice(newValues.indexOf('sm'),1);
        values = newValues;
        // In this case, we don't need to add visible lg or xl classes since they are already present, and they are already helping us make xs, sm and md hidden
      }
      // If its hidden on md, make it hidden on xs and sm
      else if (values.indexOf('md') > -1){
        newValues = values;
        if (newValues.indexOf('xs') == -1){
            newValues.push('xs');
        }
        if (newValues.indexOf('sm') == -1){
            newValues.push('sm');
        }
        values = newValues;
      }
    }
    for(var i=0; i<values.length; i++){
      classes += " hidden-"+values[i];
    }
    return classes;
  }
  
  $rootScope.col = function(columns){
    if (typeof columns == 'string' || typeof columns == 'number'){
      columns = parseInt(columns);
    }
    if (typeof columns == 'number'){
      columns = {
        'md':columns
      };
    }
    
    // If it's not responsive down to mobile, make the mobile look exactly the
    // same as desktop by making mobile columns the exact same as desktop.
    if (viewVars.isResponsive != true && columns.hasOwnProperty('md')){
      columns['xs'] = columns['md'];
      columns['sm'] = columns['md'];
    }
    var classes = "";
    for (var key in columns){
      classes += "col-"+key+"-"+columns[key]+" ";
    }
    return classes;
  }

  $rootScope.consoleLog = function(variable){
    console.log(variable);
  };

  $rootScope.updateTimer = function () {
    $scope.$broadcast('timer-reset');
    $scope.$broadcast('timer-start'); //this is how we update the timer!!!!
  }
  
  $rootScope.closeMobileFilters = function () {
    $('.mobile-filters-screen').animate({
        right: "-100%",
    });
  };

    $rootScope.parseInt = function(variable){
      return parseInt(variable);
    };
    $rootScope.parseFloat = function(variable){
      return parseFloat(variable);
    };
    $rootScope.print = function(){
      return window.print();
    }

  $rootScope.convertCurrency = function(oldCurrencyAmount, oldCurrencyCode, newCurrencyCode, currenciesResultPage){
    if (oldCurrencyCode == newCurrencyCode){
      return oldCurrencyAmount;
    }

    var oldCurrencyObject = null;
    var newCurrencyObject = null;
    for (var i=0; i<currenciesResultPage.length; i++){
      if (currenciesResultPage[i].currency_code == oldCurrencyCode){
        oldCurrencyObject = currenciesResultPage[i];
      }
      if (currenciesResultPage[i].currency_code == newCurrencyCode){
        newCurrencyObject = currenciesResultPage[i];
      }
    }

    if (oldCurrencyObject == null || newCurrencyObject == null){
      return null;
    }

    // Convert the amount to USD first, then we can convert it to the final currency (if different than USD).
    var usdAmount = null;
    if (oldCurrencyCode == 'USD'){
      usdAmount = oldCurrencyAmount;
    }
    else {
      usdAmount = oldCurrencyAmount/oldCurrencyObject.usd_per_unit;
    }
    if (newCurrencyCode == 'USD'){
      return usdAmount;
    }

    // Convert the USD amount to HKD (for example).
    return usdAmount*newCurrencyObject.usd_per_unit;
  }

  $rootScope.myBidsLink = function(){
    if ($rootScope.menu.upcomingAuctionsBidSheets.length > 0){
      return viewVars.endpoints.bidSheet + $rootScope.menu.upcomingAuctionsBidSheets[0].row_id;
    }
    else {
      return viewVars.endpoints.myPastBids;
    }
  };
  
  $rootScope.accountBarName = function(name){
    var splitted = name.split(" ");
    if (splitted.length > 1 && splitted[splitted.length-1].length > 0){
      splitted[splitted.length - 1] = splitted[splitted.length - 1].charAt(0)+'.';
      return splitted.join(" ");
    }
    return name;
  }

  $rootScope.globalBidLiveUrl = function(){
    var firstLiveAuction = WMService.firstLiveAuction(viewVars.upcomingAuctions);
    if (firstLiveAuction){
      var numLiveAuctions = 0;
      for (var i=0;i<viewVars.upcomingAuctions.result_page.length;i++){
        if (viewVars.upcomingAuctions.result_page[i].realtime_server_url){
          numLiveAuctions += 1;
        }
      }
      if (numLiveAuctions == 1){
        return viewVars.endpoints.liveAuction + firstLiveAuction.row_id;
      }
      else {
        return viewVars.endpoints.upcomingAuctions;
      }
    }
    return null;
  }

  $rootScope.closeAppBanner = function(){
    var url = viewVars.endpoints.closeAppBanner;
    var promise = $http.get(url);
    promise.success(function(data){
      viewVars.showAppBanner = false;
    });
    promise.error(function(data){
      WMService.handleError(data);
    });
  }

  $rootScope.scrollToTop = function(){
    $("html, body").animate(
      { 
        scrollTop: 0 
      }, "slow"); 
    return false;
  }

  $rootScope.isNaN = function(number){
    return isNaN(number);
  }

  $timeout(function() {
    if (!$rootScope.hasOwnProperty('navbarCollapserRun') || !$rootScope.navbarCollapserRun){
      $rootScope.navbarCollapserRun = true;
    }
    else {
      return;
    }
    $rootScope.headerLogo = $("#auction-header .logo, .static-header .logo");
    if ($rootScope.headerLogo.length){
      $rootScope.smallLogoScrollThreshold = $rootScope.headerLogo.offset().top + $rootScope.headerLogo.outerHeight() - $(".navbar").outerHeight();
      $(window).scroll($rootScope.updateNavbarLogo);
      $rootScope.updateNavbarLogo();
    }
    $rootScope.hasLargeNavbarLogo = viewVars.largeNavbarLogoVisible;
    $rootScope.navbarBackground = $(".navbar-background");
    $rootScope.navbarMenu = $("#menu");
    // If the navbar is expanded, calculate the threshold at which to collapse.
    // The threshold is set such that when the navbar collapses, there is no
    // white space below and the auction header is *not* visible.
    // This gives a clean transition effect where the expanded navbar hits the
    // v1 filters bar, and once collapsing, you don't see any part of the
    // auction header popping up.
    if ($rootScope.hasLargeNavbarLogo){
      var expandedHeight = $rootScope.navbarBackground.outerHeight();
      var collapsedHeight = $rootScope.navbarMenu.outerHeight();
      var heightDifference = expandedHeight - collapsedHeight;
      // The threshold is set such that after the navbar collapses, the bottom
      // of the navbar will be at the same position as the bottom of the auction
      // header. The resulting effect is that there won't be any portion of the
      // the auction header visible after the navbar collapses.
      $rootScope.smallLogoScrollThreshold = $("#auction-header,.static-header").height() + (heightDifference);
      $(window).scroll($rootScope.updateNavbarLogo);
      $rootScope.updateNavbarLogo();
    }

    if (viewVars.brand == 'alexcooper'){

      $rootScope.footerToBottomCSS = function(){
        var newMarginTop = $(window).height() - $('.site-footer').height() - $("#main").outerHeight() - $("#main").offset().top;
        newMarginTop = Math.round(newMarginTop);

        if (newMarginTop < 0){
          return {};
          $('.site-footer').css('margin-top','');
        }
        else {
          return {'margin-top': newMarginTop};
          $('.site-footer').css('margin-top', newMarginTop);
        }

      }
    } else if (WMService.hasProduct('realEstate')) {
      $rootScope.footerToBottomCSS = function(){
        var newMarginTop = $(window).height() - ($('.site-footer').height() * -1) - $("#main").outerHeight() - $("#main").offset().top;
        newMarginTop = Math.round(newMarginTop);

        if (newMarginTop < 0){
          return {};
          $('.site-footer').css('margin-top','');
        }
        else {
          return {'margin-top': newMarginTop};
          $('.site-footer').css('margin-top', newMarginTop);
        }

      }
    }else if (viewVars.features.responsive){
      $rootScope.footerToBottomCSS = function(){
        var newMarginTop = $(window).height() - $('#footer-mobile').height() - $("#main").outerHeight() - $("#main").offset().top;
        newMarginTop = Math.round(newMarginTop);

        if (newMarginTop < 0){
          return {};
          $('#footer-mobile').css('margin-top','');
        }
        else {
          return {'margin-top': newMarginTop};
          $('#footer-mobile').css('margin-top', newMarginTop);
        }
        $('#footer-mobile').css('display', 'block !important');
      }
    }
  });

  // Determine whether to show the small logo, if you've scrolled far enough down the page.
  $rootScope.smallNavbarLogoVisible = function(){
    // If we have a large navbar logo such as langs, where the navbar size collapses when scrolling, then make sure we don't collapse when the height
    // of the page isn't high enough. This avoids the jitter effect (AM-5248).
    if ($rootScope.hasLargeNavbarLogo){
      var pageHeight = $("body").height();
      var browserHeight = $("html").height();
      var collapseHeight = $rootScope.navbarBackground.height() - $rootScope.navbarMenu.height();
      // If collapsing the large logo results in the bottom of the page not reaching the bottom of the browser, do not collapse.
      if (pageHeight - collapseHeight - $rootScope.smallLogoScrollThreshold < browserHeight){
        return false;
      }
    }
    return $(window).scrollTop() >= $rootScope.smallLogoScrollThreshold;
  };

  $rootScope.checkOverflow = function(item){
    console.log($rootScope.this)
    if ($event.target.offsetHeight < $event.target.scrollHeight ||
      $event.target.offsetWidth < $event.target.scrollWidth) {
      // your element have overflow
      alert('yes')
    } else {
      // your element doesn't have overflow
      alert('no')
    }
  }

  $rootScope.updateNavbarLogo = function(){
    if(viewVars.features.navbarStyle2){
      return;
    }
    if (viewVars.brand === 'goodingco') {
      return;
    }
    if ($rootScope.smallNavbarLogoVisible()){
      $(".navbar-header .logo:not(.large-navbar-logo)").addClass('visible collapsed');
      $(".container.nav-container, .container-non-responsive.nav-container").addClass('logo-collapsed');
      if (viewVars.largeNavbarLogoVisible){
        $("body").removeClass('large-navbar-logo-visible');
        $(".large-navbar-logo").removeClass('visible');
      }
      $(".container.nav-container, .container-non-responsive.nav-container").addClass('logo-collapsed');
      $rootScope.headerLogo.css('opacity', 0);
    }
    else {
      $(".container.nav-container, .container-non-responsive.nav-container").removeClass('logo-collapsed');
      $(".navbar-header .logo:not(.large-navbar-logo)").removeClass('visible collapsed');
      $(".container.nav-container, .container-non-responsive.nav-container").removeClass('logo-collapsed');
      if (viewVars.largeNavbarLogoVisible){
        $("body").addClass('large-navbar-logo-visible');
        $(".large-navbar-logo").addClass('visible');
      }
      $(".container.nav-container, .container-non-responsive.nav-container").removeClass('logo-collapsed');
      $rootScope.headerLogo.css('opacity', 1);
    }
    // Make the fixed flash bars adjust to the new size of the navbar
    var timeout = setTimeout(function(){ $rootScope.scrollSticky(); }, 300);
    
  }
  
  $(window).resize(function() {
    $rootScope.adjustStickWidth();
  });

  $rootScope.adjustStickWidth = function(){
    //we only want to do this for stacks now but we can adjust it if needed
    if(viewVars.brand == 'stacksbowers' && viewVars.currentRouteName!='live-auction'){
      var containerWidth = $('.content-container').innerWidth();
      var stickWidth = containerWidth - 20;
      $('.stick').css("width", stickWidth+"px");
    }
  }

  $rootScope.mainProduct = function(){
    //the main product is the first defined. This function is rather pointless other than to reinforce that fact
    return viewVars.products[0];
  }

  $rootScope.scrollSticky = function() {
      /*
      stickyOffset - this should be outerheight of the elements that we want to show before the sticky element
      */
      var scrollStickyElements = $(".scroll-sticky");
      var stickyOffset = 0;
      if ($(".navbar-background, .navbar, .navbar-default").length){
        stickyOffset = $(".navbar-background, .navbar, .navbar-default").outerHeight();
        if (viewVars.supportBarVisible === true) {
          stickyOffset = stickyOffset + $('.support-bar').outerHeight();
        }
      }
      if($rootScope.isMobile){
        stickyOffset = $(".slicknav-holder, .auction-header-wrap").outerHeight();
      }
      if (viewVars.brand == 'alexcooper'){
        stickyOffset = $(".navbar").outerHeight();
      }
      if (viewVars.brand == 'freemansauction'){
        stickyOffset = $(".navbar-fixed-top").outerHeight();
      }
      if($rootScope.mainProduct() == 'realEstate'){
        stickyOffset = $(".navbar").outerHeight();
        if(viewVars.features.returnToLink){
          //we have to increase it by the margin of the navbar as this is the height of the return to link container
          stickyOffset = $(".navbar").outerHeight() + parseInt($('.navbar').css('marginTop'));
        }
      }

      var $maintenanceMessage = $(".maintenance-message");
      if ($maintenanceMessage.length){
        stickyOffset += $maintenanceMessage.outerHeight();
      }
      if(viewVars.brand == 'dupuis'){
        stickyOffset = 0;
      }
      if(viewVars.brand == 'bidvenues'){
        stickyOffset = 44;
      }

      var scrollStickyPlaceholder = $(".scroll-sticky-placeholder");

      if (!scrollStickyPlaceholder.length){
        $(".scroll-sticky").after("<div class=\"scroll-sticky-placeholder\"></div>");
        scrollStickyPlaceholder = $(".scroll-sticky-placeholder");
      }
      
      if (typeof stickyScrollThreshold == 'undefined'){
        stickyScrollThreshold = 0;
      }
      if (!scrollStickyElements.hasClass('stick')){
        var top = 0;
        if (scrollStickyElements.length){
          top = scrollStickyElements.offset().top;
        }
        stickyScrollThreshold = top - stickyOffset;
      }
      var scrollPosition = $(window).scrollTop();
      if (scrollPosition > stickyScrollThreshold) {
        var totalHeight = 0;
        scrollStickyElements.each(function(){
          totalHeight += $(this).outerHeight();
        });
        scrollStickyPlaceholder.css('height', totalHeight);
        scrollStickyElements.addClass('stick').css('width',scrollStickyPlaceholder.width());
        var currTop = stickyOffset;
        scrollStickyElements.each(function(){
          $(this).css("top", currTop);
          currTop += $(this).outerHeight();
          $rootScope.adjustStickWidth();
        });

      }
      else {
        scrollStickyElements.removeClass('stick').css("top", 0).css('width','');
        scrollStickyPlaceholder.css('height', 0);
      }

      var $bottomFilters = $(".bottom-scroll-sticky");
      if($rootScope.isMobile){
        var $footer = $("#footer-mobile");
      }else{
        var $footer = $("#footer");
      }
      if ($bottomFilters.length && $footer.length){
        var scrollStickyPlaceholder = $(".filter-v1-placeholder");
        var bodyHeight = $("body").height();
        var windowHeight = $("html").height();

        if($bottomFilters.hasClass('bulk-bid-wrapper')){
          $bottomFilters.addClass('stick');
        }

        if (scrollPosition < 200 && !$bottomFilters.hasClass('bulk-bid-wrapper')){
          $bottomFilters.css('display', 'none');
        }
        else {
          $bottomFilters.css('display', 'block');
        }
        if (scrollPosition + windowHeight > bodyHeight - $footer.outerHeight()){
          scrollStickyPlaceholder.css('height', 0);
          if($rootScope.isMobile){
            var navHeight = Math.max($('.slicknav_menu').outerHeight() || 0),
                topSticky = Math.max($('.filters-container.scroll-sticky.stick').outerHeight() || 0),
                position = navHeight + topSticky + 'px';
            $bottomFilters.css({
              'position': 'fixed',
              'bottom': '',
              'top': position
            });
          }else{
            $bottomFilters.css({
              'position': ''
            });
          }
          if($bottomFilters.hasClass('bulk-bid-wrapper') && !$rootScope.isMobile){
            $bottomFilters.css({
              'width': '100%',
            });
          }
        }
        else {
          scrollStickyPlaceholder.css('height',$bottomFilters.outerHeight());
          $bottomFilters.css({
            'position': 'fixed',
            'bottom': 0,
            'top': ''
          });
          if($('.cookie-warning-v2').length > 0){
            var cookieHeight = Math.max($('.cookie-warning-v2').outerHeight() || 0) + 'px';
            $bottomFilters.css({
                'bottom': cookieHeight,
              });
          }
        }
      }
  };
  /*$rootScope.scrollSticky = function() {

      var scrollStickyElements = $(".scroll-sticky");
      var stickyOffset = $(".navbar-background").outerHeight();
      var $maintenanceMessage = $(".maintenance-message");
      if ($maintenanceMessage.length){
        stickyOffset += $maintenanceMessage.outerHeight();
      }
      var scrollStickyPlaceholder = $(".scroll-sticky-placeholder");

      if (!scrollStickyPlaceholder.length){
        $(".scroll-sticky:last").after("<div class=\"scroll-sticky-placeholder\"></div>");
        scrollStickyPlaceholder = $(".scroll-sticky-placeholder");
      }

      if (!scrollStickyElements.hasClass('stick')){
        var top = 0;
        if (scrollStickyElements.length){
          top = scrollStickyElements.offset().top;
        }
        stickyScrollThreshold = top - stickyOffset;
      }
      var scrollPosition = $(window).scrollTop();
      if (scrollPosition > stickyScrollThreshold) {
            scrollStickyElements.addClass('stick');
            var currTop = stickyOffset;

            scrollStickyElements.each(function(){
            $(this).css("top", currTop);
            currTop += $(this).outerHeight();
            $rootScope.adjustStickWidth();
          });

          var totalHeight = 0;
          scrollStickyElements.each(function(){
            totalHeight += $(this).outerHeight();
          });
          scrollStickyPlaceholder.css('height', totalHeight);

      }
      else {
        scrollStickyElements.removeClass('stick').css("top", 0);
        scrollStickyPlaceholder.css('height', 0);
      }

      var $bottomFilters = $(".bottom-scroll-sticky");
      var $footer = $("#footer");
      if ($bottomFilters.length && $footer.length){
        var scrollStickyPlaceholder = $(".filter-v1-placeholder");
        var bodyHeight = $("body").height();
        var windowHeight = $("html").height();
        if($bottomFilters.hasClass('bulk-bid-wrapper')){
          $bottomFilters.addClass('stick');
        }
        if (scrollPosition < 200 && !$bottomFilters.hasClass('bulk-bid-wrapper')){
          $bottomFilters.css('display', 'none');
        }
        else {
          $bottomFilters.css('display', 'block');
        }
        if (scrollPosition + windowHeight > bodyHeight - $footer.outerHeight()){
          scrollStickyPlaceholder.css('height', 0);
          $bottomFilters.css({
            'position': ''
          });
          if($bottomFilters.hasClass('bulk-bid-wrapper')){
            $bottomFilters.css({
              'width': '100%',
            });
          }
        }
        else {
          scrollStickyPlaceholder.css('height',$bottomFilters.outerHeight());
          $bottomFilters.css({
            'position': 'fixed',
            'bottom': 0
          });
        }
      }
  };*/

  $rootScope.initScrollSticky = function(){
    $(function () {
        $(window).scroll($rootScope.scrollSticky);
        $timeout(function(){
          $rootScope.scrollSticky();
        });
    });
  };
  $rootScope.initScrollSticky();

  $rootScope.getNotifications = function(){
    var promise = $http.get(viewVars.endpoints.notificationsAjax);
    $rootScope.menu.notificationsLoading = true;
    $rootScope.menu.notifications = null;
    promise.error(function(data, status, headers, config){
      $rootScope.menu.notificationsLoading = false;
      WMService.handleError(data);
    });
    promise.success(function(data){
      $rootScope.menu.notificationsLoading = false;
      $rootScope.menu.notifications = $rootScope.afterNotifications(data);
    });
  };

  $rootScope.clickNotificationsToggle = function(){
    $rootScope.menu.notificationsToggle = !$rootScope.menu.notificationsToggle;
    if ($rootScope.menu.notificationsToggle){
      $rootScope.getNotifications();
    }
  };

  $rootScope.clickNotification = function(notification){
    $rootScope.menu.notificationsToggle = false;
    var promise = $http.get(viewVars.endpoints.readNotification + notification.id);
    promise.success(function(data){
      window.location.href = $rootScope.notificationUrl(notification);
    });
    promise.error(WMService.handleError);
  };

  $rootScope.notificationUrl = function(notification){
    if (notification.type == 'auction_start'){
      return viewVars.endpoints.liveAuction + notification.auction_id;
    }
    else if (notification.hasOwnProperty('auction_id') && notification.auction_id){
      return viewVars.endpoints.lots + notification.auction_id;
    }
  };

  $rootScope.afterNotifications = function(notifications){
    for (var key in notifications.result_page){
      notifications.result_page[key].friendly_created_at = moment(notifications.result_page[key].created_at).fromNow();
    }
    return notifications;
  }
  $rootScope.dismissAjaxError = function(){
    $rootScope.ajaxErrorMessage = '';
    $timeout(function() {
      $(window).scroll();
    });
  }
  $rootScope.setAjaxError = function(error, scope){
    if (typeof scope != 'undefined'){
      $rootScope.ajaxErrorMessage = $interpolate(error.message)(scope);
    }
    else {
      $rootScope.ajaxErrorMessage = $interpolate(error.message)($rootScope);
    }
    if (error.hasOwnProperty('classes')){
      $rootScope.ajaxErrorMessageClasses = error.classes;
      // Remove .bid-error's after 5 seconds, which are displayed on the bidding room.
      var fadeNoticeClasses = ['bid-error','fade-error','fade-notice'];
      var isNoticeTemporary = error.classes.find(function(element){ return fadeNoticeClasses.indexOf(element) > -1; }) != undefined;
      if (isNoticeTemporary && viewVars.brand != 'stacksbowers'){
        var timeout = 5000;
        if (viewVars.brand == 'alexcooper'){
          timeout = 9000;
        }
        $timeout(function(){
          $rootScope.ajaxErrorMessage = null;
          $(window).scroll();
        }, timeout);
      }
    }
    else {
      $rootScope.ajaxErrorMessageClasses = [];
    }
    if (error.hasOwnProperty('messageType')){
      $rootScope.ajaxErrorMessageClasses.push('alert-'+error.messageType);
    }
    else {
      $rootScope.ajaxErrorMessageClasses.push('alert-danger');
    }
    $timeout(function() {
      $(window).scroll();
    });
  }

  $rootScope.setPageTitle = function(title){
    if (!$rootScope.template.dynamicTitleActive){
      $rootScope.template.dynamicTitleActive = true;
    }
    $rootScope.template.title = title;
  };

  $rootScope.searchSite = function(query){
    var url = viewVars.endpoints.lots;
    if (viewVars.features.searchUpcomingLotsOnly){
      // Search upcoming lots only.
      url = viewVars.endpoints.upcomingLots;
    }
    if (typeof query != 'undefined'){
      url += "?search=" + encodeURIComponent(query).replace(/%20/g, "+");
    }
    if (viewVars.brand == 'scammellauctions' || viewVars.features.defaultToUpcomingForFilters === true) {
      url += '&lots_range=upcoming';
    }
    if (viewVars.brand == 'alexcooper'){
      if (typeof query == 'undefined'){
        url += '?';
      }
      else {
        url += '&';
      }
      url += 'tab=active_listings'; 
    }
    if (viewVars.isLotsMapView){

      if (typeof query == 'undefined'){
        url += '?';
      }
      else {
        url += '&';
      }
      url += 'view=map';
    }
    window.location.href =  url;
  };

  $rootScope.smartFilterSearch = function(searchValue, categoryValue){
    var url = viewVars.endpoints.lots;
    if (typeof searchValue != 'undefined'){
      var lotsRange = "upcoming";
      if(viewVars.currentRouteName == 'past-auctions')
        lotsRange = "past";
      searchValue = encodeURIComponent(searchValue).replace(/%20/g, "+");
      url += "?search=" + searchValue;
      if (typeof categoryValue != 'undefined'){
        categoryValue = encodeURIComponent(categoryValue).replace(/%20/g, "+");
        url += "&parent_category=" + categoryValue;
      }
      url += "&lots_range=" + lotsRange;
    }
    window.location.href =  url;
  }

  $rootScope.jumpToLotAjax = function(lotNumber, auctionId){
    if(typeof lotNumber == 'undefined'){
      var message = $filter('translate')('The lot number must not be empty.');
      WMService.handleError({'message': message,'classes':['fade-error']});
      return;
    }
    var promise = $http.get(viewVars.endpoints.jumpToLot + lotNumber + "/"+ auctionId);
    promise.success(function(data){
      console.log(data);
      var url = viewVars.endpoints.lot+data.result_page[0].row_id;
      if(viewVars.currentRouteName == 'lot-live-bids'){
        url = viewVars.endpoints.liveBids+data.result_page[0].row_id;
      }else if(viewVars.currentRouteName == 'lot-absentee-bids'){
        url = viewVars.endpoints.absenteeBids+data.result_page[0].row_id;
      }
      window.location.href = url;
    });
    promise.error(WMService.handleError);
  }

  $rootScope.translateJqValidate = function () {
    if (typeof jQuery.validator !== 'undefined') {
      jQuery.extend(jQuery.validator.messages, {
        required: $filter('translate')("This field is required."),
        email: $filter('translate')("Please enter a valid email address."),
        number: $filter('translate')("Please enter a valid number."),
        digits: $filter('translate')("Please enter only digits."),
        creditcard: $filter('translate')("Please enter a valid credit card number."),
        phoneIntl: $filter('translate')("Please enter a valid phone number."),
      });
    }
  }
  $rootScope.translateJqValidate();

  $rootScope.clickSearchButton = function(searchValue){
    if (searchValue && $rootScope.template.searchOpen){
      $rootScope.template.searchOpen = false;
      $rootScope.searchSite(searchValue);
    }
    else if (!searchValue && $rootScope.template.searchOpen){
      $rootScope.template.searchOpen = false;
    }
    else {
      $rootScope.template.searchOpen = true;
      $("#main-search-field").focus();
    }
  };

  $rootScope.showLocaleSwitcher = function(){
    return viewVars.availableLocales !== null && typeof viewVars.availableLocales === 'object';
  }

  $rootScope.changeLocale = function(newLocale){
    var url = WMService.generateUrl('ajaxChangeLocale');
    var promise = $http.post(url, {locale: newLocale});
    promise.success(function(){
      location.reload();
    });
    promise.error(function(error){
      WMService.handleError(error);
    });
  }

  $rootScope.getBaseLocale = function(locale){
    //if we have a locale like fr-CA return just fr
    baseLocale = locale.split('-');
    return baseLocale[0];
  }

  $rootScope.getLocaleName = function(locale){
    var baseLocale = $rootScope.getBaseLocale(locale);
    if(viewVars.localeMapping.hasOwnProperty(locale)) {
      // start with strict in case we have a strict mapping
      return viewVars.localeMapping[locale];
    } else if(viewVars.localeMapping.hasOwnProperty(baseLocale)) {
      // for things like fr-fr and fr-ca. both are french technically.
      // we may want to differentiat this in the future
      return viewVars.localeMapping[baseLocale];
    } else {
      //better to have any text than nothing
      return locale;
    }
  }

  // Exec this right before opening a modal so that you don't have the background in ios jumping around. It will
  // also allow you to have select elements in a modal without ios completely butchering the modal until you scroll all the way up.
  // These issues are much better explained in AM-16004 with videos.
  $rootScope.preventScrollHijackingForModalsInIOS = function(){
    var cPosition = false;

    $('.modal').on('show.bs.modal', function(){
        cPosition = $(window).scrollTop();
    })
    .on('shown.bs.modal', function(){
        $('body').css({
            position:'fixed'
        });

    })
    .on('hide.bs.modal', function(){
        $('body').css({
            position:'relative'
        });

        window.scrollTo(0, cPosition);
    });
  }

  /*if (viewVars.hasOwnProperty('title')){
    $rootScope.setPageTitle(viewVars.title);
  }*/
  if (viewVars.hasOwnProperty('me') && viewVars.me){
    viewVars.me = WMService.afterMe(viewVars.me);
  }

    /**
     * Check if the 'enable_qa_automation' cookie is set to 'true'
     * @returns {boolean} True if cookie is set and equals 'true'
     */
    $rootScope.hasAutomationCookie = function() {
        const cookies = document.cookie.split(';').map(cookie => cookie.trim());
        const cookie = cookies.find(c => c.startsWith('enable_qa_automation='));
        return cookie ? cookie.split('=')[1] === 'true' : false;
    }

    /**
     * Generate and optionally set the "amy-qa-attr" attribute for automation testing
     * @param {string} field - Raw field string, e.g., "FieldName:123"
     * @param {object} [element] - Optional Angular/jQuery-wrapped DOM element
     * @returns {string} - The formatted selector or empty string
     */
    $rootScope.setAutomationAttr = function(field, element) {
        if (!$rootScope.hasAutomationCookie()) {
            return '';
        }

        if (typeof field !== 'string' || !field.trim()) {
            return '';
        }

        const [rawField, rawId] = field.split(':');
        if (!rawField) return '';

        const snakeCase = rawField.replace(/([A-Z])/g, '_$1').toLowerCase();
        const cleanedField = snakeCase.replace(/['"\[\]\s]/g, '');

        const cleanedId = rawId
            ? rawId.replace(/['"\[\]\s]/g, '')
            : null;

        const selector = cleanedId ? `${cleanedField}_${cleanedId}` : cleanedField;

        // If element is provided, apply the attribute directly
        if (element && typeof element.attr === 'function') {
            element.attr('amy-qa-attr', selector);
        }

        return selector;
    }

}]);


/* To use FilterService, you need to call FilterService.init(query_info, type) 
 * where query_info is what you would get from the server's lot list endpoint (or any other list endpoint).
 * where type is the type of object you are using the filter service with
 *
 * If you want to use this FilterService for anything other than lots, you will need to change:
 *  1. filters.all.sort - With all of the possible sort options.
 *  2. filters.default.sort - The default sort option, must be one of the keys in filters.all.sort.
 */
WebModule.factory('FilterService', ['$location', '$filter', '$timeout', 'WMService', '$http', function($location, $filter, $timeout, WMService, $http){
  if(viewVars.features.smartFilters){
    viewVars.allCategories = {};
    viewVars.allCategories.result_page = [];
  }
  var categoriesList = [ { row_id: null, name: 'All ' + viewVars.categoryLabel.plural } ];
  var defaultLotListView = 'list';
  if (WMService.hasProduct('corePremium1') === true) {
    defaultLotListView = 'grid';
  }
  var filters = {
    labels: {
      bottle_sizes: 'Bottle Sizes',
      vintage: 'Vintage',
      others: 'Others',
    },
    current: {}, // Only include parameters that should be updated by GET/POST inside here, so no objects/arrays allowed, same goes for defaults
    // Store temporary filter states. For example, if the user is in the midst of typing in a new page number, instead of updating the value in $scope.filters.current,
    // store it in temp instead. That way, if the user decides not to use the newly typed page number, and presses next, the value from current will be used to determine
    // the next page.
    temp: {},
    defaults: {
      view: defaultLotListView,
      sort: viewVars.defaultLotSort, // This value is different if we are viewing all lots (instead of those in a specific auction), see init()
      page: 1,
      categories: null,
      bottle_sizes: null,
      lots_range: null,
      is_mixed_lot: 'never',
      vintage_range_low: null,
      vintage_range_high: null
    },
    all: {
      view: ['list','grid'],
      limit: [12,24,36,48,96],
      sort: {
        'lot_number': 'Lot Number',
      },
      lots_range: [
        {key: null, label: 'All'},
        {key:'upcoming', label: 'Upcoming'},
        {key:'past', label: 'Past'}
      ],
      categories: function() {
        if(viewVars.hasOwnProperty('allCategories') && viewVars.allCategories != null){
          if(viewVars.allCategories.hasOwnProperty('result_page')){
            return categoriesList.concat(viewVars.allCategories.result_page);
          }else{
            return null;
          }
        }
      }(),
      bottle_sizes: [
        {key: 'less_than_bottle', name: 'Smaller than Standard'},
        {key: 'bottle', name: 'Bottle'},
        {key: 'magnum', name: 'Magnum'},
        {key: 'magnum_plus', name: 'Larger than Magnum'}
      ],
      vintages: [
        // All of these vintage objects actually have 'key' and 'name'
        // properties as well. They are generated using the getVintageField()
        // function below.
        {
          vintage_year_low: "null",
          vintage_year_high: "null",
          vintage_range_low: null,
          vintage_range_high: null
        },
        {
          vintage_year_low: null,
          vintage_year_high: null,
          vintage_range_low: null,
          vintage_range_high: null
        },
        {
          vintage_year_low: null,
          vintage_year_high: null,
          vintage_range_low: null,
          vintage_range_high: 1969
        },
        {
          vintage_year_low: null,
          vintage_year_high: null,
          vintage_range_low: 1970,
          vintage_range_high: 1979
        },
        {
          vintage_year_low: null,
          vintage_year_high: null,
          vintage_range_low: 1980,
          vintage_range_high: 1989
        },
        {
          vintage_year_low: null,
          vintage_year_high: null,
          vintage_range_low: 1990,
          vintage_range_high: 1999
        },
        {
          vintage_year_low: null,
          vintage_year_high: null,
          vintage_range_low: 2000,
          vintage_range_high: null
        },
      ],
      lot_type: [
        {key: 'featured_auction', name: "Featured Auctions", short_name: 'Featured'},
      ],
      others : [
        {key: 'is_mixed_lot', name: "Include Mixed Lots", value:"sometimes", not_value:"never"},
        {key: 'quantity', name: "Display Single Bottle Lots Only", value:"1", not_value:null},
        {key: 'has_package_type', name: "Display OWC & OC Only", value:"always", not_value:null},
        {key: 'is_perfect_condition', name: "Lots with No Conditions Only", value:"always", not_value:null},
      ]
    },
  };
  if (viewVars.brand === 'stacksbowers') {
    filters.all.sort.numismatic_order = 'Numismatic Order';
  }
  if (viewVars.hasOwnProperty('defaultLotListView') && viewVars.defaultLotListView !== null) {
    var newFiltersAll = [ viewVars.defaultLotListView ];
    filters.defaults.view = viewVars.defaultLotListView;
    for (var i=0; i < filters.all.view.length; i++) {
      if (filters.all.view[i] !== viewVars.defaultLotListView) {
        newFiltersAll.push(filters.all.view[i]);
      }
    }
    filters.all.view = newFiltersAll;
  }

  if (viewVars.features.persistentLotListView === true) {
    if (viewVars.hasOwnProperty('currentLotListView') && viewVars.currentLotListView !== null) {
      filters.defaults.view = viewVars.currentLotListView;
    }
  }

  if (viewVars.brand === 'alexcooper') {
    var foreclosures = {key: 'foreclosure', name: "Foreclosures", short_name: 'Foreclosure'};
    filters.all.lot_type.push(foreclosures);
  }
  if (viewVars.features.traditionalListings === true || viewVars.brand === 'alexcooper') {
    var traditionalListings = {key: 'traditional', name: "Traditional Listings", short_name: 'Traditional'};
    filters.all.lot_type.push(traditionalListings);
  }
  if (viewVars.brand === 'hdh') {
    filters.defaults.is_mixed_lot = 'sometimes';
  }

  if (WMService.hasProduct('realEstateHybrid') === true) {
    filters.all.sort.lot_number = 'Item Number';
  }

  if(viewVars.brand == 'jpking'){
    filters.all.sort.lot_number = 'Property Number';
  }

  if(viewVars.brand == 'fasigtipton'){
    filters.all.sort.lot_number = 'HIP Number';
  };

  if (viewVars.brand === 'bidvenues') {
    Object.keys(filters.all.lots_range).forEach( function(idx) {
      if (filters.all.lots_range[idx].key === 'upcoming') {
        filters.all.lots_range[idx].label = 'Current';
      }
    });
    filters.all.sort = {};
    filters.all.sort['lot_number'] = 'Lot Number';
    if (typeof viewVars.auction !== 'undefined' && viewVars.auction !== null && viewVars.auction.auction_type == 'timed'){
        filters.all.sort['end_time'] = 'Time Left';
    }
    filters.all.sort['most_recently_listed'] = 'Most Recently Listed';
    filters.all.sort['bids_asc'] = 'Bids: Low to High';
    filters.all.sort['bids_desc'] = 'Bids: High to Low';
  }

  if(viewVars.brand == 'acker'){
    filters.all.others = [
      {key: 'is_mixed_lot', name: "Include Mixed Lots", value:"sometimes", not_value:"never"},
      {key: 'quantity', name: "Display Single Bottle Lots Only", value:"1", not_value:null},
      {key: 'package_type', name: "Display OWC & OC Only", value:"OWC", not_value:null}
    ];
  }

  if (viewVars.brand == 'breedersworld'){
    filters.all.sort = {
      'lot_number': 'Lot Number'
    };
  }
  if (viewVars.brand === 'stacksbowers') {
    if (!WMService.isPercentageBiddingEnabled(viewVars.auction)) {
      filters.all.sort.current_price_asc = 'Current Price: Low to High';
      filters.all.sort.current_price_desc = 'Current Price: High to Low';
    }
    if (viewVars.auction === null) {
      filters.all.sort.sale_date = 'Sale Date';
    }
    filters.all.sort.numismatic_order = 'Numismatic Order';
  }

  if (viewVars.brand == 'alexcooper'){
    var numWeeks = 3;
    var dateFormat = "YYYY-MM-DD";
    //var dateTimeFormat = "YYYY-MM-DD\THH:mm:ss";
    filters.all.property_week = [
      {start_date: null, end_date: null}
    ];
    var currentWeek = moment();
    for (var i=0; i<numWeeks; i++){
      filters.all.property_week.push({
        start_date: currentWeek.startOf('week').format(dateFormat), end_date: currentWeek.endOf('week').format(dateFormat)
      });
      currentWeek = currentWeek.add(1,'w');
    }


    if (viewVars.hasOwnProperty('defaultStatus')){
      filters.defaults.status = viewVars.defaultStatus;
    }

    // filters.all.property_day_of_week is created in init();
  }

  var lotTypeKeyToObject = function(key){
    for (var i=0; i<filters.all.lot_type.length; i++){
      if (filters.all.lot_type[i].key == key){
        return filters.all.lot_type[i];
      }
    }
  }

  var isLotTypeChecked = function(lotType){
    // if lotType == null, check if all Lot Types are selected. Return true if it is.
    if (lotType == null){
      if (!filters.current.hasOwnProperty('lot_type') || !filters.current.lot_type){
        return true;
      }
      var lotTypeCheckSplitted = filters.current.lot_type.trim().split(" ");
      return lotTypeCheckSplitted.length == 0;
    }
    if (filters.current.hasOwnProperty('lot_type')){
       var currentLotTypes = filters.current.lot_type.trim().split(" ");
       return currentLotTypes.indexOf(lotType) > -1;
    }
    else {
      return false;
    }
  }

  // You can pass in filters.current into lotTypeLabel to get the current lot type
  var lotTypeLabel = function(lotType){
    if (typeof(lotType) == 'undefined'){
      var currentLotTypes = [];
      if (filters.current.hasOwnProperty('lot_type')){
        currentLotTypes = filters.current.lot_type.split(" ");
      }
      if (currentLotTypes.length == 0){
        return "Sale Type";
      }
      else if (currentLotTypes.length == 1){
        return lotTypeKeyToObject(currentLotTypes[0]).name;
      }
      else {
        var labels = [];
        for (var i=0;i<currentLotTypes.length;i++){
          labels.push(lotTypeKeyToObject(currentLotTypes[i]).short_name);
        }
        return labels.join(", ");
      }
    }
    else {
      return lotType.name;
    }
  }
  var toggleLotType = function(lotType){
    var currentLotTypes = [];
    if (filters.current.hasOwnProperty('lot_type')){
      currentLotTypes = filters.current.lot_type.split(" ");
    }

    var lotTypeIndex = currentLotTypes.indexOf(lotType);
    // If we found 'traditional' (for example) in the current list of lot types selected, remove it.
    if (lotTypeIndex > -1){
      currentLotTypes.splice(lotTypeIndex, 1);
    }
    // If we didn't find 'traditional', then add it. Notice we do not add null here, so if you were trying
    // to deselect all lot types, you can still do so since the previous currentLotTypes=[] line would continue
    // to take effect.
    else if (lotType){
      currentLotTypes.push(lotType);
    }
    else if (!lotType){
      currentLotTypes = [];
    }
    
    var currentLotTypesJoined = currentLotTypes.join(" ").trim();
    if (currentLotTypesJoined == ""){
      currentLotTypesJoined = null;
    }

    // Reset status to null if you have something other than just traditional selected.
    if(currentLotTypesJoined != "traditional"){
      setFilter('status', null, false);
    }

    // If Lot Type is being set to null or contains "foreclosure", make Property Type null as well.
    if (lotType == null || lotType == 'foreclosure'){
      setFilter('property_type', null, false);
    }

    setFilter('lot_type', currentLotTypesJoined);
  }

  var toggleSortAscDesc = function(sortBase, newDirection){
    if (typeof newDirection == 'undefined'){
      newDirection = 'desc';
    }
    var sortSplitted = null;
    if (filters.current.hasOwnProperty('sort') && filters.current.sort){
      sortSplitted = filters.current.sort.split("_");
      var currDirection = sortSplitted[sortSplitted.length-1];
      if (currDirection == 'desc'){
        newDirection = 'asc';
      }
      else if (currDirection == 'asc'){
        newDirection = 'desc';
      }
    }

    return setFilter('sort', sortBase+'_'+newDirection);
  }

  var sortField = function(){
    var sortF = null;
    if (filters.current.hasOwnProperty('sort') && filters.current.sort){
      sortSplitted = filters.current.sort.split("_");
      if (sortSplitted[sortSplitted.length-1] == 'asc' || sortSplitted[sortSplitted.length-1] == 'desc'){
        sortSplitted.pop();
      }
      return sortSplitted.join("_");
    }

    return sortF;
  }

  var sortDirection = function(){
    var sortDir = null;
    if (filters.current.hasOwnProperty('sort') && filters.current.sort){
      sortSplitted = filters.current.sort.split("_");
      return sortSplitted[sortSplitted.length-1];
    }

    return sortDir;
  }
  // You can pass in filters.current into propertyWeek to get the current week
  var propertyWeekLabel = function(propertyWeek){
    if (!propertyWeek.hasOwnProperty('start_date') || !propertyWeek.start_date){
      return "All Weeks";
    }
    var startDate = moment(propertyWeek.start_date).startOf('week');
    var endDate = moment(propertyWeek.end_date).subtract(1,'seconds').endOf('week'); // Subtract 1 second to get the end of week according to start date, not the new upcoming week

    return startDate.format("MMMM") + " " + startDate.format("D") + " - " + endDate.format("MMMM") + " " + endDate.format("D");
  }
  // You can pass in filters.current into propertyDay to get the current day
  var propertyDayOfWeekLabel = function(propertyDay){
    if (!propertyDay.hasOwnProperty('start_date') || !propertyDay.hasOwnProperty('end_date')){
      return "All Days";
    }
    else if (moment(propertyDay.end_date).diff(moment(propertyDay.start_date), 'days') == 1){
      return moment(propertyDay.start_date).format("dddd");
    }
    else {
      return "All Days";
    }
  }

  if (viewVars.hasOwnProperty('lotsType')){
    filters.temp.lotsType = viewVars.lotsType;
  }

  if (viewVars.hasOwnProperty('propertyTypes')){
    filters.all.property_type = viewVars.propertyTypes.result_page;
  }
  if (viewVars.hasOwnProperty('propertyLocations')){
    filters.all.property_location = viewVars.propertyLocations.result_page;
  }
  if (viewVars.hasOwnProperty('propertyCounties')){
    filters.all['auction_county'] = viewVars.propertyCounties.result_page;
  }
  if(viewVars.brand == 'alexcooper' || WMService.hasProduct('realEstate')){
    filters.all['status'] = [
      {
        name: 'Active',
        value: 'active'
      },
      {
        name: 'Under Contract',
        value: 'under_contract'
      },
      {
        name: 'Sold',
        value: 'pre_sold sold post_sold'
      }
    ];
  }
  
  if (viewVars.features.noPastLots){
    var newLotsRange = [];
    for (var i=0; i<filters.all.lots_range.length; i++){
      if (['past',null].indexOf(filters.all.lots_range[i].key) == -1){
        newLotsRange.push(filters.all.lots_range[i]);
      }
    }
    filters.all.lots_range = newLotsRange;
  }

  if(viewVars.currentRouteName == 'past-auctions'){
    filters.defaults = {
      
    };
  }


  if(viewVars.currentRouteName == 'orders-past'){
    filters.all.sort = {
      'auction_date': 'Auction',
      'price_desc': 'Price Highest First',
      'price_asc': 'Price Lowest First',
    }
    filters.defaults.sort = viewVars.defaultOrderSort;
  }

  if(viewVars.currentRouteName == 'artist-settings'){
    delete(filters.defaults.is_mixed_lot);
    delete(filters.defaults.view);
  }
  

  var getVintageField = function(filters, field){
    var vintageRangeLow = null;
    var vintageRangeHigh = null;
    if (filters.hasOwnProperty('vintage_year_low') && filters.vintage_year_low == "null" && filters.hasOwnProperty('vintage_year_high') && filters.vintage_year_high == "null"){
      if (field == 'key'){
        return 'nv';
      }
      else if (field == 'name'){
        return 'NV / MV';
      }
    }
    if (filters.hasOwnProperty('vintage_range_low')){
      vintageRangeLow = filters.vintage_range_low;
    }
    if (filters.hasOwnProperty('vintage_range_high')){
      vintageRangeHigh = filters.vintage_range_high;
    }
    if (!vintageRangeLow && !vintageRangeHigh){
      if (field == 'key'){
        return 'all';
      }
      else if (field == 'name'){
        return 'All Vintages';
      }
    }
    else if (!vintageRangeLow){
      if (field == 'key'){
        return 'before_'+vintageRangeHigh;
      }
      else if (field == 'name'){
        return 'Older than '+vintageRangeHigh;
      }
    }
    else if (!vintageRangeHigh){
      if (field == 'key'){
        return vintageRangeLow + '_to_now';
      }
      else if (field == 'name'){
        return vintageRangeLow + ' to Today';
      }
    }
    if (field == 'key'){
      return vintageRangeLow+'_to_'+vintageRangeHigh;
    }
    else if (field == 'name'){
      if (vintageRangeLow == vintageRangeHigh){
        return vintageRangeLow;
      }
      return vintageRangeLow+' to '+vintageRangeHigh;
    }
  }
  
  for (var i=0;i<filters.all.vintages.length;i++){
    filters.all.vintages[i].key = getVintageField(filters.all.vintages[i],'key');
    filters.all.vintages[i].name = getVintageField(filters.all.vintages[i],'name');
  }
  
  if(!viewVars.auction){
    if(viewVars.currentRouteName != 'orders-past'){
      delete filters.all.sort['lot_number'];
      
      filters.all.sort['auction_date_lot_number_asc'] = "Lot Number";
      if (WMService.hasProduct('realEstateHybrid') === true) {
        filters.all.sort.auction_date_lot_number_asc ='Item Number';
      }

      if(viewVars.brand == 'ogclearinghouse'){
        filters.all.sort.auction_date_lot_number = "Auction Number";
      }else if(viewVars.brand == 'jpking'){
        filters.all.sort.auction_date_lot_number = 'Property Number';
      } else if (viewVars.brand == 'fasigtipton') {
        filters.all.sort.auction_date_lot_number_asc = "HIP Number";
      }
      if (viewVars.hasOwnProperty('lotsRange')){
        filters.defaults['lots_range'] = viewVars.lotsRange;
      }
    }
    if (viewVars.currentRouteName === 'watched-lots-index') {
      if (viewVars.lotsRange === 'upcoming') {
        filters.all.sort['auction_date_lot_number_asc'] = "Lot Number";
        delete filters.all.sort.auction_date_lot_number;
      } else {
        filters.all.sort['auction_date_lot_number'] = "Lot Number";
        delete filters.all.sort.auction_date_lot_number_asc;
      }
    }
  }
  else {
    if (viewVars.auction.auction_type == 'timed'){
      if (viewVars.brand !== 'bidvenues') {
        filters.all.sort['end_time'] = 'Time Left';
      }
    }
  }
  if (viewVars.features.groupBidding && viewVars.hasOwnProperty('lotsType') && viewVars.lotsType == 'bids'){
    filters.all.sort['bid_group_lot_number'] = 'Bid Groups';
  }

  if (viewVars.features.nonGridListLimits || (viewVars.brand == 'admin' && viewVars.me && viewVars.me.tenant.brand == 'hdh')){
      filters.all.limit = [20,30,50,100];
  }

  if (viewVars.filterOptions.hasOwnProperty('showSortByEstimatesFilterOption') === false && !WMService.isPercentageBiddingEnabled(viewVars.auction)) {
    // we need to default to having the estimates filter because everyone already has it.
    filters.all.sort.high_estimate_asc = 'Estimate: Low to High';
    filters.all.sort.high_estimate_desc = 'Estimate: High to Low';
  }

  if (viewVars.filterOptions.hasOwnProperty('showSortByEstimatesFilterOption') === true && viewVars.filterOptions.showSortByEstimatesFilterOption === true && !WMService.isPercentageBiddingEnabled(viewVars.auction)) {
    filters.all.sort.high_estimate_asc = 'Estimate: Low to High';
    filters.all.sort.high_estimate_desc = 'Estimate: High to Low';
  }

  if ((viewVars.brand=='hdh' || viewVars.brand=='acker') || (viewVars.brand == 'admin'  && viewVars.me && (viewVars.me.tenant.brand == 'hdh' || viewVars.me.tenant.brand == 'acker'))){
      filters.all.sort['vintage_asc'] = "Vintage: Oldest to Youngest";
      filters.all.sort['vintage_desc'] = "Vintage: Youngest to Oldest";
  }

  if (viewVars.filterOptions.hasOwnProperty('showSortByVintageFilterOption') === true && viewVars.filterOptions.showSortByVintageFilterOption === true) {
    filters.all.sort['vintage_asc'] = "Vintage: Oldest to Youngest";
    filters.all.sort['vintage_desc'] = "Vintage: Youngest to Oldest";
  }

  if (viewVars.filterOptions.hasOwnProperty('showSortByArtistFilterOption') === true && viewVars.filterOptions.showSortByArtistFilterOption === true) {
    var label = viewVars.artistLabel;
    label = label.charAt(0).toUpperCase() + label.slice(1)
    filters.all.sort.artist_name = `${label} Name`;
  }

  if (viewVars.features.artists){
      var label = viewVars.artistLabel;
      if (viewVars.artistLabel == 'producer'){
          label = "Producer Name";
      }
      else {
          label = label.charAt(0).toUpperCase() + label.slice(1)
          filters.all.sort.artist_name = `${label} Name`;
      }
      filters.all.sort.artist_name = label;
  }

  var query_info = {};

  var initialized = false; // This will become true at the end of init() which will indicate to the filters bar that it can be displayed.
  var isInitialized = function(){
    return initialized;
  }
  var updateQueryInfo = function(queryInfo){
    query_info = $.extend(query_info, queryInfo);    
  }
  var init = function(queryInfo,type){
    updateQueryInfo(queryInfo);
    if (typeof(type) != 'undefined' && (type == 'registrations')){
      filters.defaults.sort = null;
      filters.defaults.is_mixed_lot = null;
      if(type == 'registrations'){
        filters.defaults.view = null;
      }
    }
    // Set filter options, from the defaults and the GET parameters
    if(queryParams(location.search).hasOwnProperty('search')){
      filters.all.sort['relevance'] = 'Relevance';
    }
    $.extend(filters.current, filters.defaults, queryParams(location.search));
    // If page_start_offset is provided, such as when we are using jump to lot, determine the page number based on the server's page_start_offset.
    if (query_info.hasOwnProperty('page_start_offset')){
      filters.current.page = Math.floor(query_info.page_start_offset/query_info.page_size) + 1;
    }
    // Set temporary states for filter options that have temporary states, such as page number

    if(viewVars.features.smartFilters && typeof viewVars.lots != 'undefined' && typeof viewVars.lots.smart_filter != 'undefined' && viewVars.brand != 'admin'){
      //so because categories for smartfilters are actually subcategoris we need to have some fun here 
      var categoriesArr = [];
      for(i in viewVars.lots.smart_filter.categories){ //loop through the categories and compile the children
        if(viewVars.lots.smart_filter.categories[i].hasOwnProperty('children') && viewVars.lots.smart_filter.categories[i].children.length >0){
          categoriesArr = categoriesArr.concat(returnSmartFilterCategories(viewVars.lots.smart_filter.categories[i]));
        }
      }
      filters.all.categories = categoriesArr;
      var typeArr = [];
      for(i in viewVars.lots.smart_filter.categories){ //loop through the categories and compile the children
        typeArr.push(viewVars.lots.smart_filter.categories[i]);
      }
      filters.all.parent_category = typeArr;
      filters.all.reserve_status = [
        {name:'No Reserve',value:'no_reserve'},
        {name:'Reserve Met',value:'reserve_met'},
        {name:'Reserve Not Met',value:'reserve_not_met'},
      ];
    }
    if(viewVars.features.consignments && viewVars.currentRouteName == 'auction-consignments-index'){
      filters.all.consignments = [
        {
          'name':'Active',
          'value':'active'
        },
        {
          'name':'Sold',
          'value':'sold'
        },
        {
          'name':'Unsold',
          'value':'unsold'
        },
        {
          'name':'All Past',
          'value':'past'
        },
        {
          'name':'All',
          'value':null
        },
      ];

    }
    filters.temp.page = filters.current.page;
    filters.current.limit = query_info.page_size;
    filters.queryInfo = query_info;
    if(filters.current.categories)
      filters.temp.categories = returnCategories(filters.current.categories);
    else
      filters.temp.categories = [];

    var multiselectsToBeInit = {
      'bottle_sizes': {key: 'key'},
      'property_type': {key: 'row_id'},
      'property_location': {key: 'row_id'},
    }
    
    for (var multiselectKey in multiselectsToBeInit){
      if(filters.current[multiselectKey]){
        var multiselectValue = returnMultiselect(multiselectKey,multiselectsToBeInit[multiselectKey].key);
        filters.temp[multiselectKey] = multiselectValue;
      }
      else {
        filters.temp[multiselectKey] = [];
      } 
    }

    if(filters.current.parent_category)
      filters.temp.parent_category = returnType(filters.current.parent_category);
    else
      filters.temp.parent_category = [];

    if(filters.current.parent_category)
      filters.temp.parent_category = returnType(filters.current.parent_category);
    else
      filters.temp.parent_category = [];

    if(filters.current.search){
      filters.temp.search = filters.current.search;
    }


    if(filters.current.reserve_status){
      console.log(filters.all.reserve_status)
      filters.temp.reserve_status = filters.current.reserve_status; //better to have something than nothing at all
      for(i in filters.all.reserve_status){
        if(filters.all.reserve_status[i].value == filters.current.reserve_status){
          filters.temp.reserve_status = filters.all.reserve_status[i].name;
        }
      }
    }

    if(filters.current.vintage_range_low && filters.current.vintage_range_low == filters.current.vintage_range_high){
      filters.temp.vintage_year = filters.current.vintage_range_low;
    }

    if (filters.current.hasOwnProperty("jump_to_lot") || filters.current.hasOwnProperty("jump_to_lot_id")){
      $(function(){
        var lotDomSelector;
        if(viewVars.brand == 'grays'){
          filters.current.view = 'grid';
        }
        if (filters.current.hasOwnProperty("jump_to_lot")){
          lotDomSelector = "#"+filters.current.view+"-lot-"+filters.current.jump_to_lot;
        }
        else {
          lotDomSelector = "."+filters.current.view+"-lot-id-"+filters.current.jump_to_lot_id;
        }
        //var smallNavbarHeight = parseInt($("#main").css("margin-top").replace("px",''));

        $timeout(function(){
          if ($(lotDomSelector).length){
            if(viewVars.features.navbarStyle2){
              var smallNavbarHeight = $(".navbar-background").outerHeight();
            }else{
              var smallNavbarHeight = $(".navbar").outerHeight();
            }
            var scrollTopAmount = $(lotDomSelector).offset().top + 1 - (smallNavbarHeight + $(".filters-container:not(.bottom-scroll-sticky)").outerHeight());
            $('html,body').scrollTop(scrollTopAmount);
          }
        });
        
        $(".lots.grid-view " + lotDomSelector + " .lot-thumbnail-overlay-wrap").addClass("hover");
      });
    }

    if(viewVars.features.smartFilters){
      filters.search = {};
      if(filters.current.search){
        filters.search.value = filters.current.search;
      }else{
        filters.search.value = "";
      }
    }

    if (viewVars.brand == 'alexcooper'){
      if (filters.current.hasOwnProperty('start_date') && filters.current.start_date && filters.current.hasOwnProperty('end_date') && filters.current.end_date){
        var daysOfWeeks = [];
        daysOfWeeks.push({start_date: moment(filters.current.start_date).startOf('week').format(dateFormat), end_date: moment(filters.current.start_date).endOf('week').format(dateFormat)});
        var currentDayOfWeek = moment(filters.current.start_date).startOf('week');
        for (var i=0; i<7; i++){
          daysOfWeeks.push({start_date: currentDayOfWeek.startOf('day').format(dateFormat), end_date: currentDayOfWeek.add(1, 'days').startOf('day').format(dateFormat)});
        }
        filters.all.property_day_of_week = daysOfWeeks;
      }
    }
    initialized = true;
  };

  var hasActiveFilters = function(){
    if(viewVars.features.smartFilters){
      for(i in filters.temp){
        //console.log(filters.temp.parent_category)
        if(i != 'limit' && i != 'page' && i != 'sort' && i != 'view' && i != 'lots_range' && i != 'jump_to_lot' && i != 'is_mixed_lot' && i != 'lotsType'){
          if(Object.keys(filters.temp[i]).length){
            //console.log(filters.temp[i])
            return true;
          }
        }
      }
      return false;
    }else{
      //
      // activeFiltersCriteria works that if nothing is defined for a key then all of those will be blacklisted. If we only want to 
      // blacklist a certain element then we can define it as a blacklist. In the example below view is completely blacklisted but
      // is_mixed_lot is only blacklisted on the sometimes.
      // var activeFiltersCriteria = {
      //   view: {},
      //   is_mixed_lot: {blacklist: ['sometimes']},
      // }
      //
      var activeFiltersCriteria = {
        view: {},
        sort: {},
        page: {},
        limit: {},
        lots_range: {},
        is_mixed_lot: {blacklist: ['never']},
      }
      //console.log(filters.current)
      
      var afterBlacklistFilters = jQuery.extend({}, filters.current)
      for(key in afterBlacklistFilters){
        if(activeFiltersCriteria.hasOwnProperty(key) && !activeFiltersCriteria[key].hasOwnProperty('blacklist')){
          //empty object in the blacklist so just delete it
          delete afterBlacklistFilters[key];
        }else if(activeFiltersCriteria.hasOwnProperty(key) && activeFiltersCriteria[key].hasOwnProperty('blacklist')){
          //we have a blacklist
          if(activeFiltersCriteria[key].blacklist.indexOf(filters.current[key]) != -1){
            //we have a blacklisted value so we want to delete it
            delete afterBlacklistFilters[key];
          }
        }
        if(afterBlacklistFilters[key] == null){
          //empty object here so just delete it
          delete afterBlacklistFilters[key];
        }

      }
      return JSON.stringify(afterBlacklistFilters) !== JSON.stringify({});
    }
  }

  var lotsRangeObject = function(lotsRangeKey){
    for (var i = 0; i < filters.all.lots_range.length; i++) {
      if (filters.all.lots_range[i].key == lotsRangeKey){
        return filters.all.lots_range[i];
      }
    };
    return null;
  }

  var initSubcategoryDropDown = function(parent){
    //this function will return true if a child of a subcategory is selected thus allowing us to auto expand the category check box.
    if(filters.current.categories == null)
      return false;

    var categories = filters.current.categories.replace(/\+/g, " ");
    categories.split(" ");
    for(var i=0; i<parent.children.length; i++){
      if(categories.indexOf(parent.children[i].value) != -1)
        return true;
    }
    if(categories.indexOf(parent.extended_children) != -1){
      //this allows us to expand the grandparent if a grandchild is selected
      return true;
    }
    return false;

  }

  var returnCategories = function(categories){
    categories = categories.replace(/\+/g, " ");
    categories = categories.split(" ");
    var categoriesArr = [];
    var row_id = "row_id";
    if(viewVars.features.smartFilters)
      row_id = 'value';
    for (var i=0;i<filters.all.categories.length;i++){
      if(categories.indexOf(filters.all.categories[i][row_id]) != -1 ){
        categoriesArr.push(filters.all.categories[i]);
      }
    }
    return categoriesArr;
  }
  
  var returnMultiselect = function(field,key){
    var fieldsArray = [];
    var fieldIds = [];
    if (filters.current[field] && filters.current[field].length){
      fieldIds = $.extend({}, filters.current);
      fieldIds = fieldIds[field];
      fieldIds = fieldIds.replace(/\+/g, " ");
      fieldIds = fieldIds.split(" ");
    }

    for (var i=0;i<filters.all[field].length;i++){
      if(fieldIds.indexOf(filters.all[field][i][key]) != -1){
        fieldsArray.push(filters.all[field][i]);
      }
    }
    return JSON.parse(JSON.stringify(fieldsArray));
  }

  var returnType = function(type){
    for(i in filters.all.parent_category){
      if(type.indexOf(filters.all.parent_category[i].value) != -1){
        return filters.all.parent_category[i];
      }
    }
  }

  var returnSmartFilterCategories = function(categories){
    var categoriesArr = [];
    if(categories.children.length >0){
      for(j in categories.children){
        categoriesArr.push(categories.children[j]);
        //console.log(categoriesArr);
        categoriesArr = categoriesArr.concat(returnSmartFilterCategories(categories.children[j]));
      }
    }
    return categoriesArr;
  }

  var returnType = function(type){
    for(i in filters.all.parent_category){
      if(type.indexOf(filters.all.parent_category[i].value) != -1){
        return filters.all.parent_category[i];
      }
    }
  }

  var returnSmartFilterCategories = function(categories){
    var categoriesArr = [];
    if(categories.children.length >0){
      for(j in categories.children){
        categoriesArr.push(categories.children[j]);
        //console.log(categoriesArr);
        categoriesArr = categoriesArr.concat(returnSmartFilterCategories(categories.children[j]));
      }
    }
    return categoriesArr;
  }

  var categoryIdToLabel = function(categoryId){
    var label = '';
    var row_id = "row_id";
    if(viewVars.features.smartFilters)
      row_id = 'value';
    for (var i=0;i<filters.all.categories.length;i++){
      if (filters.all.categories[i][row_id] == categoryId){
        label = filters.all.categories[i].name;
      }
    }
    return label;
  };

  var hasLotsRange = function(){
    var currLotsRange = getFilter('lots_range');
    if (!currLotsRange){
      return false;
    }
    return true;
  }

  var getFilter = function(name){
    var allFilters = $.extend({},filters.current);
    if (typeof name == 'undefined'){
      for (var tempName in filters.current){
        if (filters.current[tempName] == null || filters.current[tempName] == ''){
          delete allFilters[tempName];
        }
      }
      return allFilters;
    }
    if (allFilters.hasOwnProperty(name)){
      return allFilters[name];
    }
    return null;
  }

  var setSmartFilter = function(filter){
    var smartFilters = "";
    for(var item=0; item<filters.temp[filter].length; item++){
      smartFilters += filters.temp[filter][item].value + " ";
    }
    var newFilter = [];
    smartFilters = smartFilters.slice(0, - 1);
    if(smartFilters == "")
      smartFilters = null;
    newFilter[filter] = smartFilters;
    
    setFilter(newFilter);
  }

  var createCustomAll = function(filter){
    //this function creates an all object for the filters.all object for custom smart filters
    var filterArr = [];
    for(var i=0; i<viewVars.lots.smart_filter[filter].length; i++){
      filterArr.push(viewVars.lots.smart_filter[filter][i]);
    }
    filters.all[filter] = filterArr;

    if(filters.current[filter])
      filters.temp[filter] = returnCustomFilters(filters.current[filter], filter);
    else
      filters.temp[filter] = [];
  }

  var returnCustomFilters = function(customFilters, filter){
    //this returns an array of the active filter objects based on a space delimited list of values
    customFilters = customFilters.replace(/\+/g, " ");
    customFilters = customFilters.split(" ");
    var filtersArr = [];
    for (var i=0;i<filters.all[filter].length;i++){
      if(customFilters.indexOf(filters.all[filter][i].value) != -1 ){
        filtersArr.push(filters.all[filter][i]);
      }
    }
    console.log(filtersArr)
    return filtersArr;
  }

  var setFilter = function(name, value, refreshPage){
    //console.log('filters.temp',filters.temp.parent_category);
    //console.log('filters.current',filters.current.parent_category);
    var oldFiltersCurrent = $.extend({},filters.current);
    if (typeof(refreshPage) == 'undefined'){
      refreshPage = true;
    }
    //console.log(filters.current.parent_category);
    //throw new Error('die');
    // We can also pass in an object of key value pairs into the name param as
    // well, if you want to pass in multiple.
    if (typeof(name) == 'object'){
      $.extend(filters.current, name);
    }
    else {
      filters.current[name] = value;
    }

    //remove other sort order when using jump to lot as it gets confused
    if(filters.current.hasOwnProperty('jump_to_lot') && name =="jump_to_lot"){
      filters.current['sort'] = "lot_number";
    }
    // Remove jump_to_lot when you touch any other filters, since it's only supposed to be used once.
    if (name != 'jump_to_lot' && filters.current.hasOwnProperty('jump_to_lot')){
      delete filters.current['jump_to_lot'];
    }
    if (name != 'jump_to_lot_id' && filters.current.hasOwnProperty('jump_to_lot_id')){
      delete filters.current['jump_to_lot_id'];
    }
    // Go back to the first page when you change any filters that affect the lots returned.
    var allowedFilters = ['view','page','order','order_by'];
    if(allowedFilters.indexOf(name) == -1){
      delete filters.current['page'];
    }
    // Delete empty/null values so it doesn't appear in GET params anymore.
    for (var tempName in filters.current){
      if (filters.current[tempName] == null || filters.current[tempName] == ''){
        delete filters.current[tempName];
      }
    }
    
    if(filters.current.hasOwnProperty('search') &&
      !oldFiltersCurrent.hasOwnProperty('search')
      ){
        // Only set to relevance sort order if the sort param was not manually
        // overridden. You can override it by passing in an object like
        // {search:"wine","sort":"lot_number"} in the name parameter.
        if (typeof(name) != 'object' || !name.hasOwnProperty('sort')){
          // We simply delete sort order and rely on the backend default
          // sort order for searching. This is likely 'relevance'. But hdh
          // doesn't want this. Either case, check the backend to be 100% sure.
          delete filters.current['sort'];
        }
    }
    
    // If the search param is unset, make sure the sort order is not set to
    // relevance. Remove the sort order param if it is.
    if(!filters.current.hasOwnProperty('search') &&
        filters.current.hasOwnProperty('sort') &&
        filters.current['sort'] == 'relevance'){
      delete filters.current['sort'];
    }

    if (name == 'watched' && value == null){
      if (viewVars.currentRouteName == 'watched-lots-index'){
        location.href = viewVars.endpoints.lots + '?' + $.param(filters.current);;
      }
    }
    else {
      if (refreshPage){
        // Delete default values that were not changed for pretty urls. For example, no need to add is_mixed_lot=sometimes when that is already the default.
        var neatFiltersCurrent = {};
        for (var key in filters.current){
          if (!filters.defaults.hasOwnProperty(key) || filters.defaults[key] != filters.current[key]){
            neatFiltersCurrent[key] = filters.current[key];
          }
        }
        // if we have a lots range then we need to keep that set so that we do not change the view
        if (filters.current.hasOwnProperty('lots_range') === true && name !== 'consignments') {
          neatFiltersCurrent['lots_range'] = filters.current.lots_range;
        }
        location.search = $.param(neatFiltersCurrent);
        filters.current = oldFiltersCurrent;
      }
      else {
        $location.search(name, value);
      }
    }
    if (viewVars.features.persistentLotListView === true) {
      if (name === 'view') {
        // ajax set the currentLotListView
        var submitData = {
          currentLotListView: value,
        };
        var url = WMService.generateUrl('saveCurrentLotListViewAjax');
        var promise = $http.post(url, submitData);
        promise.success(function () {
        });
        promise.error(function (error) {
          WMService.handleError(error);
        });
      }
    }
  };

  /*var setFilterV2 = function(name, value){

    if (typeof(name) == 'object'){
      $.extend(filters.current, name);
    }
    else {
      filters.current[name] = value;
    }

    // Remove jump_to_lot when you touch any other filters, since it's only supposed to be used once.
    if (name != 'jump_to_lot' && filters.current.hasOwnProperty('jump_to_lot')){
      delete filters.current['jump_to_lot'];
    }
    if (name != 'jump_to_lot_id' && filters.current.hasOwnProperty('jump_to_lot_id')){
      delete filters.current['jump_to_lot_id'];
    }

    // Go back to the first page when you change categories, sort options, or search.
    if (name == 'categories' || name == 'sort' || name == 'search' || name == 'q'){
      delete filters.current['page'];
    }

    for (var tempName in filters.current){
      if (filters.current[tempName] == null){
        delete filters.current[tempName];
      }
    }
    if(name == "sort")
      filters.current.sort = value;

    $location.search(name, value);
    location.search = $.param(filters.current);
  };*/

  /*
  converts categories object into space delimited list of category ids
  */
  var setCategories = function(checkCategory, removeChildren){
    if(typeof value == 'undefined')
      value = null;
    var categories = "";
    var row_id_name = "row_id";
    if(viewVars.features.smartFilters){
      var row_id_name = "value";
      var found = false;
      if(typeof removeChildren == 'undefined')
        removeChildren = true;
      for(var h in filters.temp.categories){
        if(filters.temp.categories[h].value == checkCategory.value){ //check if the item was added or removed
          found = true;
        }
        for(var i in filters.all.categories){
          //set the parent if it is a child
          /*if(filters.all.categories[i].children){
            for(j in filters.all.categories[i].children){
              if(filters.temp.categories[h].value == filters.all.categories[i].children[j].value){
                if(filters.all.categories[i].value.indexOf(categories) == -1 || categories==""){
                  //do not double set the parent category
                  categories += filters.all.categories[i].value + " ";
                }
              }
            }
          }*/
        }
        
        //set all children if it is a parent that is clicked
        if(filters.temp.categories[h].value == checkCategory[row_id_name] && filters.temp.categories[h].children.length > 0){
          for(z in filters.temp.categories[h].children){
            categories += filters.temp.categories[h].children[z].value + ' ';
          }
          if(found)
            categories += filters.temp.categories[h].value + ' ';
        }

        //remove the parent if a child is removed
        if(checkCategory.parent){
          for(var i = filters.temp.categories.length-1; i>=0; i--){
            if(filters.temp.categories[i].value == checkCategory.parent){
              filters.temp.categories.splice(i, 1);    
            }
          }
        }
        //compile list of children for parent
        var children = [];
        for(var i in checkCategory.children){
          children.push(checkCategory.children[i].value)
        }
      }
      if(removeChildren){
        //remove all of the children if the parent is removed using previously compiled list
        //for(i in filters.temp.categories){
        for(var i = filters.temp.categories.length-1; i>=0; i--){
          if(children.indexOf(filters.temp.categories[i].value) != -1){
            filters.temp.categories.splice(i, 1);
          }
        }
      }
      //throw new Error('asd')
    }//endif smartFilter is enabled
    for(var i in filters.temp.categories){
      //console.log('creating category');;
      if(filters.temp.categories[i]){
        categories += filters.temp.categories[i][row_id_name] + " ";
      }
    }
    categories = categories.slice(0, - 1);

    if (categories == ''){
      categories = null;
    }
    
    setFilter('categories', categories);
  }
  
  var setMultiselect = function(field,key){
    var multiselectField = '';
    for(var i in filters.temp[field]){
      if(filters.temp[field][i]){
        multiselectField += filters.temp[field][i][key] + " ";
      }
    }
    multiselectField = multiselectField.slice(0, - 1);

    if (multiselectField == ''){
      multiselectField = null;
    }

    setFilter(field, multiselectField);
  }

  var clearCategories = function(){
    filters.temp.categories = [];
    setCategories();
  }
  
  var clearMultiselect = function(field,key){
    var multiselectField = [];
    filters.temp[field] = [];
    
    for(var i in filters.temp[field]){
      if(filters.temp[field][i]){
        multiselectField += filters.temp[field][i][key] + " ";
      }
    }
    multiselectField = multiselectField.slice(0, - 1);

    if (multiselectField == ''){
      multiselectField = null;
    }
    
    setFilter(field, multiselectField);
  }
  var clearFilters = function(){
    var resetObj = {};
    for(var key in filters.all){
      resetObj[key] = null;
    }
    resetObj['lots_range'] = 'all';
    resetObj['search'] = null;
    var resetFields = Object.keys(filters.all).concat(['vintage_range_low','vintage_range_high']);
    for (var i=0; i<filters.all.others.length; i++){
      resetFields.push(filters.all.others[i].key);
    }
    
    for(var i=0; i<resetFields.length; i++){
      resetObj[resetFields[i]] = null;
    }
    
    if(viewVars.brand == 'stacksbowers' && filters.current.hasOwnProperty('lots_range')){
      resetObj['lots_range'] = filters.current.lots_range;
    }
    
    /*
    console.log(filters.temp);
    console.log(filters.current);
    console.log(filters.all);
    */
    
    setFilter(resetObj);
  }

  var clearSmartFilter = function(filterType){
    var resetObj = {};
    resetObj[filterType] = null;
    /*
    console.log(filters.temp);
    console.log(filters.current);
    console.log(filters.all);
    */
    setFilter(resetObj);
  }
  var removeSearch = function(){
    filters.temp.search = '';
    setFilter('search',null);
  }

  var removeCategory = function(category, type){
    if(typeof type == 'undefined'){
      type = "categories";
    }
    if(type == 'parent_category'){
      filters.temp[type] = null;
      resetObj = {};
      resetObj[type] = null;
      setFilter(resetObj);
    }else{
      for(var i=0; i<filters.temp[type].length; i++){
        var row_id = "row_id";
        if(viewVars.features.smartFilters)
          row_id = 'value';
        if(filters.temp[type][i][row_id] == category[row_id])
          filters.temp[type].splice(i, 1);
      }
      setCategories(category);
    }
  }
  
  var removeMultiselectFieldValue = function(value, fieldName, key){
    for(var i=0; i<filters.temp[fieldName].length; i++){
      if(filters.temp[fieldName][i][key] == value[key])
        filters.temp[fieldName].splice(i, 1);
    }
    setMultiselect(fieldName, key);
  }

  var offsetPage = function(offset){
    if (typeof(offset) != 'int'){
      offset = parseInt(offset);
    }
    var currentPage = parseInt(filters.current.page);
    var newPage = currentPage + offset;
    page(newPage);
  };
  var page = function(newPage){
    if (typeof(newPage) != 'undefined'){
      var numPagesCount = numPages();
      if (typeof(newPage) != 'int'){
        newPage = parseInt(newPage);
      }
      if (newPage > numPagesCount){
        newPage = numPagesCount;
      }
      else if (newPage < 1){
        newPage = 1;
      }
      setFilter('page', newPage);
    }
    else {
      return parseInt(filters.current.page);
    }
  };
  var viewMode = function(newViewMode){
    if (typeof(newViewMode) != 'undefined'){
      setFilter({'limit':null, page: 1, view: newViewMode});
    }
    else {
      return filters.current.view;
    }
  }
  var limit = function(newLimit){
    if (typeof(newLimit) != 'undefined'){
      newLimit = parseInt(newLimit);
      setFilter({'limit':newLimit,'page':1});
    }
    else {
      return filters.current.limit;
    }
  }
  var numPages = function(){
    var totalCount = query_info.total_num_results;
    var fullPages = ~~(totalCount/filters.current.limit);
    if (totalCount % filters.current.limit){
      return fullPages + 1;
    }
    return fullPages;
  };
  var queryParams = function(str){
    var queryParams = (str || document.location.search).replace(/(^\?)/,'').split("&");
    var queryParamsObj = {};

    var splitted;
    for (var i=0; i<queryParams.length; i++){
      splitted = queryParams[i].split("=");
      if (splitted.length == 1){
        queryParamsObj[splitted[0]] = null;
      }
      else if (splitted.length == 2){
        queryParamsObj[splitted[0]] = decodeURIComponent(splitted[1].replace(/\+/g, '%20'));
      }
    }
    if (queryParamsObj.hasOwnProperty('')){
      delete queryParamsObj[''];
    }
    return queryParamsObj;
  };

  var indentChild = function(category){
    //console.log(filters.all.categories)
    var indent = 0;
    for(var i in filters.all.categories){
      if(filters.all.categories[i].children){
        indent = checkChild(filters.all.categories[i], category);
      }
      if(indent != 0) break;
    }

    return {'margin-left':indent+'px'};
  }

  var checkChild = function(parent, child){
    var indent = 0;
    for(var i in parent.children){
      if(parent.children[i].children){
        indent = indent + checkChild(parent.children[i], child);
      }
      if(parent.children[i].value == child.value){
        indent = indent + 10;
        return indent;
      }
    }

    return indent;
  }

  var noPlacard = function(key){
    var exclude =[
      'limit',
      'categories',
      'parent_category',
      'page',
      'sort',
      'view',
      'lots_range',
      'search',
      'reserve_status',
      'is_mixed_lot'
    ];
    return exclude.indexOf(key) == -1;  //means it is not found so it returns false, thus not showing the div
  }

  var picklistLabel = function(picklistType, allOptionLabel, isMultiselect, valueFieldName){
    if (!filters.current.hasOwnProperty(picklistType) || !filters.current[picklistType] || filters.current[picklistType] == 'all'){
      return allOptionLabel;
    }
    else {
      var labels = [];
      var ids;
      if(typeof valueFieldName == 'undefined'){
        valueFieldName = "row_id";
      }
      if (typeof isMultiselect == 'undefined'){
        isMultiselect = true;
      }
      if (isMultiselect){
        ids = filters.current[picklistType].split(" ");
      }
      else {
        ids = [filters.current[picklistType]];
      }
      for (var i = filters.all[picklistType].length - 1; i >= 0; i--) {
        if (ids.indexOf(filters.all[picklistType][i][valueFieldName]) > -1){
          labels.push(filters.all[picklistType][i].name);
        }
      };
      return labels.join(", ");
    }
  }

  var propertyTypeLabel = function(){
    return picklistLabel('property_type','Property Type');
  }

  var propertyLocationLabel = function(){
    return picklistLabel('property_location','Location');
  }

  var propertyCountyLabel = function(){
    return picklistLabel('auction_county','All Counties', false);
  }

  var propertyStatusLabel = function(){
    return picklistLabel('status','All', false, 'value');
  }

  var searchLotsPlaceholder = function(){
    var placeholder = $filter('translate')("Search Lots");
    if(viewVars.features.realEstateHybrid){
      placeholder = $filter('translate')("Search Items");;
    }
    if(viewVars.brand == 'langs'){
      placeholder = $filter('translate')("Keyword Search");;
    }else if(viewVars.brand == 'jpking'){
      placeholder = $filter('translate')("Search Properties");;
    }
    return placeholder;
  }
  var jumpToLotTitle = function(){
    var placeholder = $filter('translate')("Jump To Lot");
    if(viewVars.features.realEstateHybrid){
      placeholder = $filter('translate')("Jump To Item");;
    }
    if(viewVars.brand == 'jpking'){
      placeholder = $filter('translate')("Jump To Lot");
    }
    return placeholder;
  }
  var jumpToLotPlaceholder = function(){
    var placeholder = $filter('translate')("Lot #");
    if(viewVars.features.realEstateHybrid){
      placeholder = $filter('translate')("Item #");;
    }
    if(viewVars.brand == 'jpking'){
      placeholder = $filter('translate')("Lot #");
    }
    return placeholder;
  }

  return {
    updateQueryInfo: updateQueryInfo,
    init: init,
    isInitialized: isInitialized,
    hasActiveFilters: hasActiveFilters,
    categoryIdToLabel: categoryIdToLabel,
    queryInfo: query_info,
    filters: filters,
    hasLotsRange: hasLotsRange,
    lotsRangeObject: lotsRangeObject,
    getFilter: getFilter,
    toggleSortAscDesc: toggleSortAscDesc,
    sortField: sortField,
    sortDirection: sortDirection,
    setFilter: setFilter,
    setMultiselect: setMultiselect,
    //setFilterV2: setFilterV2,
    offsetPage: offsetPage,
    page: page,
    viewMode: viewMode,
    limit: limit,
    numPages: numPages,
    queryParams: queryParams,
    setCategories: setCategories,
    setSmartFilter: setSmartFilter,
    getVintageField: getVintageField,
    createCustomAll: createCustomAll,
    clearCategories: clearCategories,
    clearMultiselect: clearMultiselect,
    clearFilters: clearFilters,
    clearSmartFilter: clearSmartFilter,
    removeSearch: removeSearch,
    removeCategory: removeCategory,
    removeMultiselectFieldValue: removeMultiselectFieldValue,
    initSubcategoryDropDown: initSubcategoryDropDown,
    indentChild: indentChild,
    noPlacard: noPlacard,
    lotTypeLabel: lotTypeLabel,
    isLotTypeChecked: isLotTypeChecked,
    toggleLotType: toggleLotType,
    propertyWeekLabel: propertyWeekLabel,
    propertyDayOfWeekLabel: propertyDayOfWeekLabel,
    propertyTypeLabel: propertyTypeLabel,
    propertyLocationLabel: propertyLocationLabel,
    propertyCountyLabel: propertyCountyLabel,
    propertyStatusLabel: propertyStatusLabel,
    searchLotsPlaceholder: searchLotsPlaceholder,
    jumpToLotTitle: jumpToLotTitle,
    jumpToLotPlaceholder: jumpToLotPlaceholder,
  }
}]);

/* A general multipurpose Web Module Service that can be used around the site. */
WebModule.factory('WMService', ['$http', '$rootScope', '$filter', '$sce', function($http, $rootScope, $filter, $sce) {
  var currencySigns = viewVars.currencyList;
  var timezones = {
    '':'',
    'Pacific/Kwajalein': 'Pacific/Kwajalein',
    'Pacific/Midway': 'Pacific Ocean/Samoa',
    'Pacific/Honolulu': 'Pacific Ocean/Honolulu',
    'America/Anchorage': 'America/Alaska',
    'America/Los_Angeles': 'America/PST/Los Angeles',
    'America/Denver': 'America/MST/Denver',
    'America/Chicago': 'America/CST/Chicago',
    'America/Mexico_City': 'America/Mexico City',
    'America/New_York': 'America/EST/NYC',
    'America/Puerto_Rico': 'America/Atlantic',
    'America/St_Johns': 'America/St_Johns NF',
    'America/Argentina/Buenos_Aires': 'America/Buenos Aires',
    'Atlantic/Azores': 'Atlantic Ocean/Azores',
    'America/Godthab': 'Atlantic Ocean/SE Greenland',
    'Europe/London' : 'Europe/London',
    'Europe/Paris' : 'Europe/Paris',
    'Europe/Helsinki' : 'Europe/Helsinki',
    'Europe/Moscow' : 'Europe/Moscow',
    'Asia/Tehran': 'Asia/Tehran',
    'Asia/Baku' : 'Asia/Baku',
    'Asia/Karachi' : 'Asia/Karachi',
    'Asia/Colombo' : 'Asia/Colombo',
    'Asia/Bangkok' : 'Asia/Bangkok',
    'Asia/Singapore' : 'Asia/Singapore',
    'Asia/Hong_Kong' : 'Asia/Hong Kong',
    'Asia/Tokyo' : 'Asia/Tokyo',
    'Australia/Sydney': 'Pacific Ocean/Sydney',
    'Asia/Magadan': 'Asia/Magadan',
    'Asia/Kamchatka': 'Asia/Kamchatka',
    'Asia/Kolkata': 'Asia/Kolkata',
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Abidjan":"Africa/Abidjan",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Maputo":"Africa/Maputo",
    "Africa/Maputo":"Africa/Maputo",
    "Africa/Maputo":"Africa/Maputo",
    "Africa/Maputo":"Africa/Maputo",
    "Africa/Maputo":"Africa/Maputo",
    "Africa/Maputo":"Africa/Maputo",
    "Africa/Maputo":"Africa/Maputo",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Lagos":"Africa/Lagos",
    "Africa/Johannesburg":"Africa/Johannesburg",
    "Africa/Johannesburg":"Africa/Johannesburg",
    "Africa/Khartoum":"Africa/Khartoum",
    "Asia/Nicosia":"Asia/Nicosia",
    "Asia/Qatar":"Asia/Qatar",
    "Asia/Riyadh":"Asia/Riyadh",
    "Asia/Riyadh":"Asia/Riyadh",
    "Asia/Bangkok":"Asia/Bangkok",
    "Asia/Bangkok":"Asia/Bangkok",
    "Asia/Dubai":"Asia/Dubai",
    "Pacific/Auckland":"Pacific/Auckland",
    "Africa/Nairobi":"Africa/Nairobi",
    "Africa/Abidjan":"Africa/Abidjan",
    "America/Argentina/Catamarca":"America/Argentina/Catamarca",
    "America/Adak":"America/Adak",
    "America/Argentina/Buenos_Aires":"America/Argentina/Buenos_Aires",
    "America/Argentina/Catamarca":"America/Argentina/Catamarca",
    "America/Atikokan":"America/Atikokan",
    "America/Argentina/Cordoba":"America/Argentina/Cordoba",
    "America/Tijuana":"America/Tijuana",
    "America/Indiana/Indianapolis":"America/Indiana/Indianapolis",
    "America/Indiana/Indianapolis":"America/Indiana/Indianapolis",
    "America/Argentina/Jujuy":"America/Argentina/Jujuy",
    "America/Indiana/Knox":"America/Indiana/Knox",
    "America/Kentucky/Louisville":"America/Kentucky/Louisville",
    "America/Argentina/Mendoza":"America/Argentina/Mendoza",
    "America/Rio_Branco":"America/Rio_Branco",
    "America/Argentina/Cordoba":"America/Argentina/Cordoba",
    "America/Denver":"America/Denver",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "Pacific/Auckland":"Pacific/Auckland",
    "Asia/Ashgabat":"Asia/Ashgabat",
    "Asia/Kolkata":"Asia/Kolkata",
    "Asia/Shanghai":"Asia/Shanghai",
    "Asia/Shanghai":"Asia/Shanghai",
    "Asia/Dhaka":"Asia/Dhaka",
    "Asia/Shanghai":"Asia/Shanghai",
    "Asia/Urumqi":"Asia/Urumqi",
    "Asia/Kathmandu":"Asia/Kathmandu",
    "Asia/Macau":"Asia/Macau",
    "Asia/Ho_Chi_Minh":"Asia/Ho_Chi_Minh",
    "Asia/Jerusalem":"Asia/Jerusalem",
    "Asia/Thimphu":"Asia/Thimphu",
    "Asia/Makassar":"Asia/Makassar",
    "Asia/Ulaanbaatar":"Asia/Ulaanbaatar",
    "Atlantic/Faroe":"Atlantic/Faroe",
    "Europe/Oslo":"Europe/Oslo",
    "Australia/Sydney":"Australia/Sydney",
    "Australia/Sydney":"Australia/Sydney",
    "Australia/Lord_Howe":"Australia/Lord_Howe",
    "Australia/Sydney":"Australia/Sydney",
    "Australia/Darwin":"Australia/Darwin",
    "Australia/Brisbane":"Australia/Brisbane",
    "Australia/Adelaide":"Australia/Adelaide",
    "Australia/Hobart":"Australia/Hobart",
    "Australia/Melbourne":"Australia/Melbourne",
    "Australia/Perth":"Australia/Perth",
    "Australia/Broken_Hill":"Australia/Broken_Hill",
    "America/Rio_Branco":"America/Rio_Branco",
    "America/Noronha":"America/Noronha",
    "America/Sao_Paulo":"America/Sao_Paulo",
    "America/Manaus":"America/Manaus",
    "America/Halifax":"America/Halifax",
    "America/Winnipeg":"America/Winnipeg",
    "America/Regina":"America/Regina",
    "America/Toronto":"America/Toronto",
    "America/Edmonton":"America/Edmonton",
    "America/St_Johns":"America/St_Johns",
    "America/Vancouver":"America/Vancouver",
    "America/Regina":"America/Regina",
    "America/Whitehorse":"America/Whitehorse",
    "America/Santiago":"America/Santiago",
    "Pacific/Easter":"Pacific/Easter",
    "America/Havana":"America/Havana",
    "Africa/Cairo":"Africa/Cairo",
    "Europe/Dublin":"Europe/Dublin",
    "Europe/London":"Europe/London",
    "Europe/Chisinau":"Europe/Chisinau",
    "Europe/London":"Europe/London",
    "Europe/London":"Europe/London",
    "Etc/GMT":"Etc/GMT",
    "Etc/GMT":"Etc/GMT",
    "Etc/GMT":"Etc/GMT",
    "Etc/GMT":"Etc/GMT",
    "Asia/Hong_Kong":"Asia/Hong_Kong",
    "Atlantic/Reykjavik":"Atlantic/Reykjavik",
    "Asia/Tehran":"Asia/Tehran",
    "Asia/Jerusalem":"Asia/Jerusalem",
    "America/Jamaica":"America/Jamaica",
    "Asia/Tokyo":"Asia/Tokyo",
    "Pacific/Kwajalein":"Pacific/Kwajalein",
    "Africa/Tripoli":"Africa/Tripoli",
    "America/Tijuana":"America/Tijuana",
    "America/Mazatlan":"America/Mazatlan",
    "America/Mexico_City":"America/Mexico_City",
    "Pacific/Auckland":"Pacific/Auckland",
    "Pacific/Chatham":"Pacific/Chatham",
    "America/Denver":"America/Denver",
    "Asia/Shanghai":"Asia/Shanghai",
    "Pacific/Pohnpei":"Pacific/Pohnpei",
    "Pacific/Pago_Pago":"Pacific/Pago_Pago",
    "Pacific/Chuuk":"Pacific/Chuuk",
    "Pacific/Chuuk":"Pacific/Chuuk",
    "Europe/Warsaw":"Europe/Warsaw",
    "Europe/Lisbon":"Europe/Lisbon",
    "Asia/Taipei":"Asia/Taipei",
    "Asia/Seoul":"Asia/Seoul",
    "Asia/Singapore":"Asia/Singapore",
    "Europe/Istanbul":"Europe/Istanbul",
    "Etc/UCT":"Etc/UCT",
    "America/Anchorage":"America/Anchorage",
    "America/Adak":"America/Adak",
    "America/Phoenix":"America/Phoenix",
    "America/Chicago":"America/Chicago",
    "America/Indiana/Indianapolis":"America/Indiana/Indianapolis",
    "America/New_York":"America/New_York",
    "Pacific/Honolulu":"Pacific/Honolulu",
    "America/Indiana/Knox":"America/Indiana/Knox",
    "America/Detroit":"America/Detroit",
    "America/Denver":"America/Denver",
    "America/Los_Angeles":"America/Los_Angeles",
    "Pacific/Pago_Pago":"Pacific/Pago_Pago",
    "Etc/UTC":"Etc/UTC",
    "Etc/UTC":"Etc/UTC",
    "Europe/Moscow":"Europe/Moscow",
    "Etc/UTC":"Etc/UTC",
    "Africa/Asmara":"Africa/Asmara",
    "Antarctica/McMurdo":"Antarctica/McMurdo",
    "Asia/Chongqing":"Asia/Chongqing",
    "Etc/GMT":"Etc/GMT",
    "Etc/UTC":"Etc/UTC",
    "Etc/UTC":"Etc/UTC",
    "Etc/GMT":"Etc/GMT",
    "Etc/GMT":"Etc/GMT",
    "Etc/GMT":"Etc/GMT",
    "Etc/GMT":"Etc/GMT",
    "Europe/London":"Europe/London",
    "Europe/London":"Europe/London",
    "Europe/London":"Europe/London",
    "Europe/Helsinki":"Europe/Helsinki",
    "Europe/Zurich":"Europe/Zurich",
    "Europe/Rome":"Europe/Rome",
    "Europe/Rome":"Europe/Rome",
    "Europe/Zurich":"Europe/Zurich",
    "Europe/Oslo":"Europe/Oslo",
    "Europe/Belgrade":"Europe/Belgrade",
    "Europe/Belgrade":"Europe/Belgrade",
    "Europe/Belgrade":"Europe/Belgrade",
    "Europe/Belgrade":"Europe/Belgrade",
    "Europe/Belgrade":"Europe/Belgrade",
    "Europe/Prague":"Europe/Prague",
    "Europe/Istanbul":"Europe/Istanbul",
    "Pacific/Honolulu":"Pacific/Honolulu",
    "America/Los_Angeles":"America/Los_Angeles",
    "America/Curacao":"America/Curacao",
    "America/Curacao":"America/Curacao",
    "America/Curacao":"America/Curacao",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
    "America/Port_of_Spain":"America/Port_of_Spain",
  }

  var timezoneMap = {
    "Africa/Bamako": "Africa/Abidjan",
    "Africa/Banjul": "Africa/Abidjan",
    "Africa/Conakry": "Africa/Abidjan",
    "Africa/Dakar": "Africa/Abidjan",
    "Africa/Freetown": "Africa/Abidjan",
    "Africa/Lome": "Africa/Abidjan",
    "Africa/Nouakchott": "Africa/Abidjan",
    "Africa/Ouagadougou": "Africa/Abidjan",
    "Africa/Sao_Tome": "Africa/Abidjan",
    "Atlantic/St_Helena": "Africa/Abidjan",
    "Africa/Addis_Ababa": "Africa/Nairobi",
    "Africa/Asmara": "Africa/Nairobi",
    "Africa/Dar_es_Salaam": "Africa/Nairobi",
    "Africa/Djibouti": "Africa/Nairobi",
    "Africa/Kampala": "Africa/Nairobi",
    "Africa/Mogadishu": "Africa/Nairobi",
    "Indian/Antananarivo": "Africa/Nairobi",
    "Indian/Comoro": "Africa/Nairobi",
    "Indian/Mayotte": "Africa/Nairobi",
    "Africa/Blantyre": "Africa/Maputo",
    "Africa/Bujumbura": "Africa/Maputo",
    "Africa/Gaborone": "Africa/Maputo",
    "Africa/Harare": "Africa/Maputo",
    "Africa/Kigali": "Africa/Maputo",
    "Africa/Lubumbashi": "Africa/Maputo",
    "Africa/Lusaka": "Africa/Maputo",
    "Africa/Bangui": "Africa/Lagos",
    "Africa/Brazzaville": "Africa/Lagos",
    "Africa/Douala": "Africa/Lagos",
    "Africa/Kinshasa": "Africa/Lagos",
    "Africa/Libreville": "Africa/Lagos",
    "Africa/Luanda": "Africa/Lagos",
    "Africa/Malabo": "Africa/Lagos",
    "Africa/Niamey": "Africa/Lagos",
    "Africa/Porto-Novo": "Africa/Lagos",
    "Africa/Maseru": "Africa/Johannesburg",
    "Africa/Mbabane": "Africa/Johannesburg",
    "Africa/Juba": "Africa/Khartoum",
    "Europe/Nicosia": "Asia/Nicosia",
    "Asia/Bahrain": "Asia/Qatar",
    "Asia/Aden": "Asia/Riyadh",
    "Asia/Kuwait": "Asia/Riyadh",
    "Asia/Phnom_Penh": "Asia/Bangkok",
    "Asia/Vientiane": "Asia/Bangkok",
    "Asia/Muscat": "Asia/Dubai",
    "Antarctica/McMurdo": "Pacific/Auckland",
    "Africa/Asmera": "Africa/Nairobi",
    "Africa/Timbuktu": "Africa/Abidjan",
    "America/Argentina/ComodRivadavia": "America/Argentina/Catamarca",
    "America/Atka": "America/Adak",
    "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
    "America/Catamarca": "America/Argentina/Catamarca",
    "America/Coral_Harbour": "America/Atikokan",
    "America/Cordoba": "America/Argentina/Cordoba",
    "America/Ensenada": "America/Tijuana",
    "America/Fort_Wayne": "America/Indiana/Indianapolis",
    "America/Indianapolis": "America/Indiana/Indianapolis",
    "America/Jujuy": "America/Argentina/Jujuy",
    "America/Knox_IN": "America/Indiana/Knox",
    "America/Louisville": "America/Kentucky/Louisville",
    "America/Mendoza": "America/Argentina/Mendoza",
    "America/Porto_Acre": "America/Rio_Branco",
    "America/Rosario": "America/Argentina/Cordoba",
    "America/Shiprock": "America/Denver",
    "America/Virgin": "America/Port_of_Spain",
    "Antarctica/South_Pole": "Pacific/Auckland",
    "Asia/Ashkhabad": "Asia/Ashgabat",
    "Asia/Calcutta": "Asia/Kolkata",
    "Asia/Chongqing": "Asia/Shanghai",
    "Asia/Chungking": "Asia/Shanghai",
    "Asia/Dacca": "Asia/Dhaka",
    "Asia/Harbin": "Asia/Shanghai",
    "Asia/Kashgar": "Asia/Urumqi",
    "Asia/Katmandu": "Asia/Kathmandu",
    "Asia/Macao": "Asia/Macau",
    "Asia/Saigon": "Asia/Ho_Chi_Minh",
    "Asia/Tel_Aviv": "Asia/Jerusalem",
    "Asia/Thimbu": "Asia/Thimphu",
    "Asia/Ujung_Pandang": "Asia/Makassar",
    "Asia/Ulan_Bator": "Asia/Ulaanbaatar",
    "Atlantic/Faeroe": "Atlantic/Faroe",
    "Atlantic/Jan_Mayen": "Europe/Oslo",
    "Australia/ACT": "Australia/Sydney",
    "Australia/Canberra": "Australia/Sydney",
    "Australia/LHI": "Australia/Lord_Howe",
    "Australia/NSW": "Australia/Sydney",
    "Australia/North": "Australia/Darwin",
    "Australia/Queensland": "Australia/Brisbane",
    "Australia/South": "Australia/Adelaide",
    "Australia/Tasmania": "Australia/Hobart",
    "Australia/Victoria": "Australia/Melbourne",
    "Australia/West": "Australia/Perth",
    "Australia/Yancowinna": "Australia/Broken_Hill",
    "Brazil/Acre": "America/Rio_Branco",
    "Brazil/DeNoronha": "America/Noronha",
    "Brazil/East": "America/Sao_Paulo",
    "Brazil/West": "America/Manaus",
    "Canada/Atlantic": "America/Halifax",
    "Canada/Central": "America/Winnipeg",
    "Canada/East-Saskatchewan": "America/Regina",
    "Canada/Eastern": "America/Toronto",
    "Canada/Mountain": "America/Edmonton",
    "Canada/Newfoundland": "America/St_Johns",
    "Canada/Pacific": "America/Vancouver",
    "Canada/Saskatchewan": "America/Regina",
    "Canada/Yukon": "America/Whitehorse",
    "Chile/Continental": "America/Santiago",
    "Chile/EasterIsland": "Pacific/Easter",
    "Cuba": "America/Havana",
    "Egypt": "Africa/Cairo",
    "Eire": "Europe/Dublin",
    "Europe/Belfast": "Europe/London",
    "Europe/Tiraspol": "Europe/Chisinau",
    "GB": "Europe/London",
    "GB-Eire": "Europe/London",
    "GMT+0": "Etc/GMT",
    "GMT-0": "Etc/GMT",
    "GMT0": "Etc/GMT",
    "Greenwich": "Etc/GMT",
    "Hongkong": "Asia/Hong_Kong",
    "Iceland": "Atlantic/Reykjavik",
    "Iran": "Asia/Tehran",
    "Israel": "Asia/Jerusalem",
    "Jamaica": "America/Jamaica",
    "Japan": "Asia/Tokyo",
    "Kwajalein": "Pacific/Kwajalein",
    "Libya": "Africa/Tripoli",
    "Mexico/BajaNorte": "America/Tijuana",
    "Mexico/BajaSur": "America/Mazatlan",
    "Mexico/General": "America/Mexico_City",
    "NZ": "Pacific/Auckland",
    "NZ-CHAT": "Pacific/Chatham",
    "Navajo": "America/Denver",
    "PRC": "Asia/Shanghai",
    "Pacific/Ponape": "Pacific/Pohnpei",
    "Pacific/Samoa": "Pacific/Pago_Pago",
    "Pacific/Truk": "Pacific/Chuuk",
    "Pacific/Yap": "Pacific/Chuuk",
    "Poland": "Europe/Warsaw",
    "Portugal": "Europe/Lisbon",
    "ROC": "Asia/Taipei",
    "ROK": "Asia/Seoul",
    "Singapore": "Asia/Singapore",
    "Turkey": "Europe/Istanbul",
    "UCT": "Etc/UCT",
    "US/Alaska": "America/Anchorage",
    "US/Aleutian": "America/Adak",
    "US/Arizona": "America/Phoenix",
    "US/Central": "America/Chicago",
    "US/East-Indiana": "America/Indiana/Indianapolis",
    "US/Eastern": "America/New_York",
    "US/Hawaii": "Pacific/Honolulu",
    "US/Indiana-Starke": "America/Indiana/Knox",
    "US/Michigan": "America/Detroit",
    "US/Mountain": "America/Denver",
    "US/Pacific": "America/Los_Angeles",
    "US/Samoa": "Pacific/Pago_Pago",
    "UTC": "Etc/UTC",
    "Universal": "Etc/UTC",
    "W-SU": "Europe/Moscow",
    "Zulu": "Etc/UTC",
    "Africa/Asmera": "Africa/Asmara",
    "Antarctica/South_Pole": "Antarctica/McMurdo",
    "Asia/Chungking": "Asia/Chongqing",
    "GMT": "Etc/GMT",
    "Etc/Universal": "Etc/UTC",
    "Etc/Zulu": "Etc/UTC",
    "Etc/Greenwich": "Etc/GMT",
    "Etc/GMT-0": "Etc/GMT",
    "Etc/GMT+0": "Etc/GMT",
    "Etc/GMT0": "Etc/GMT",
    "Europe/Jersey": "Europe/London",
    "Europe/Guernsey": "Europe/London",
    "Europe/Isle_of_Man": "Europe/London",
    "Europe/Mariehamn": "Europe/Helsinki",
    "Europe/Busingen": "Europe/Zurich",
    "Europe/Vatican": "Europe/Rome",
    "Europe/San_Marino": "Europe/Rome",
    "Europe/Vaduz": "Europe/Zurich",
    "Arctic/Longyearbyen": "Europe/Oslo",
    "Europe/Ljubljana": "Europe/Belgrade",
    "Europe/Podgorica": "Europe/Belgrade",
    "Europe/Sarajevo": "Europe/Belgrade",
    "Europe/Skopje": "Europe/Belgrade",
    "Europe/Zagreb": "Europe/Belgrade",
    "Europe/Bratislava": "Europe/Prague",
    "Asia/Istanbul": "Europe/Istanbul",
    "Pacific/Johnston": "Pacific/Honolulu",
    "US/Pacific-New": "America/Los_Angeles",
    "America/Aruba": "America/Curacao",
    "America/Lower_Princes": "America/Curacao",
    "America/Kralendijk": "America/Curacao",
    "America/Anguilla": "America/Port_of_Spain",
    "America/Dominica": "America/Port_of_Spain",
    "America/Grenada": "America/Port_of_Spain",
    "America/Guadeloupe": "America/Port_of_Spain",
    "America/Marigot": "America/Port_of_Spain",
    "America/Montserrat": "America/Port_of_Spain",
    "America/St_Barthelemy": "America/Port_of_Spain",
    "America/St_Kitts": "America/Port_of_Spain",
    "America/St_Lucia": "America/Port_of_Spain",
    "America/St_Thomas": "America/Port_of_Spain",
    "America/St_Vincent": "America/Port_of_Spain",
    "America/Tortola": "America/Port_of_Spain",
  }

  var endpoints = viewVars.endpoints;

  var disableAddLot = function (auction) {
    // the purpose of this function is to tell us if the addition of lots to an auction is allowed
    // we return true when we are not allowed to add lots
    if (auction.hasOwnProperty('lot_extended_end_time_interval') === true && auction.lot_extended_end_time_interval !== null && auctionStartDatePassed(auction) === true) {
      // we have an extended end time auction.
      return true;
    }
    return false;
  }

  var isLiveBiddingEnabled = function(auction){
    var returnVal = viewVars.features.hasOwnProperty('liveBidding') && viewVars.features.liveBidding;
    if (typeof auction != 'undefined'){
      returnVal = returnVal && !(auction.hasOwnProperty('bidder_registration_allowed') && !auction.bidder_registration_allowed);
    }
    return returnVal;
  };
  var isAbsenteeBiddingEnabled = function(auction){
    var returnVal = viewVars.features.hasOwnProperty('absenteeBidding') && viewVars.features.absenteeBidding;
    if (typeof(auction) != 'undefined' && auction){
      returnVal = returnVal && (!viewVars.features.noLiveAuctionAbsenteeBidding || auction.auction_type != 'live') && !(auction.hasOwnProperty('bidder_registration_allowed') && !auction.bidder_registration_allowed);
    }
    return returnVal;
  };

  var isPercentageBiddingEnabled = function(lot) {
    if (lot !== undefined && lot !== null && lot.auction && lot.auction.hasOwnProperty('percentage_bidding')) {
      return lot.auction.hasOwnProperty('percentage_bidding') && lot.auction.percentage_bidding === true;
    } else if (
      // fixme we need to alway s pass the lot here and remove this branch of the if
      // before we can fix this we need to do two things
      //   * make sure all instances of isPercentageBiddingEnabled pass the lot before we do this
      //   * fix all percentages to use the bidPct filter (do not use the price filter)
        (viewVars.hasOwnProperty('auction') === true && viewVars.auction !== null && viewVars.auction.hasOwnProperty('percentage_bidding') && viewVars.auction.percentage_bidding === true) ||
        (viewVars.hasOwnProperty('lot') === true && viewVars.lot.hasOwnProperty('auction') && viewVars.lot.auction.hasOwnProperty('percentage_bidding') && viewVars.lot.auction.percentage_bidding === true)) {
      return true;
    } else {
      return false;
    }
  };

  var hasLotFilterFeatures = function(){
    for(var feature in viewVars.features){
      if(viewVars.features[feature] === true){
        if(viewVars.lotFilterFeatures.indexOf(feature) != -1){
          return true;
        }
      }
    }
    return false;
  }

  var consoleLog = function(variable){
    console.log(variable);
  };
  var currencyFormat = function(){
    return viewVars.currencyFormat;
  };
  var currencySign = function(currencyCode){
    var returnValue = '';
    if (currencyCode == null || currencySigns[currencyCode] == 'undefined' || currencyCode == ''){
      return '';
    }
    try {
        returnValue = currencySigns[currencyCode].symbol;
    } catch(error) {
        console.error(error)
    }
    return returnValue;
  };
  var auctionIsLive = function(auction){
    return Boolean(auction.realtime_server_url);
  };
  var firstLiveAuction = function(auctions){
    for (var i=0; i<auctions.result_page.length; i++){
      if (auctions.result_page[i].realtime_server_url){
        return auctions.result_page[i];
      }
    }
    return null;
  }
  var auctionIsPast = function(auction){
    if (auctionIsLive(auction)){
      return false;
    }
    if(auction.auction_type == 'timed'){ //this is only for timed auctions, not timed then life
      return auctionEffectiveEndTime(auction).isBefore();
    }else{
      var interval = moment.interval(moment(auction.time_start), moment.duration(auction.duration));
      return interval.end().isBefore();
    }
  };
  var lotIsPast = function(lot){
    if(lot.extended_end_time == null) return false;
    var end = moment(lot.extended_end_time);
    return end.isBefore();
  };
  var dateWithTimezone = function(dateString,timezoneString){
    var date = moment(dateString);
    if (timezoneString){
      date.tz(timezoneString);
    }
    return date;
  }
  var auctionStartDate = function(auction){
    var startDate = moment(auction.time_start);
    if (auction.timezone){
      startDate = startDate.tz(auction.timezone);
    }
    return startDate;
  };
  var biddingStartDate = function(auction){
    var startDate = moment(auction.time_start_live_auction);
    if (auction.timezone){
      startDate = startDate.tz(auction.timezone);
    }
    return startDate;
  }
  var biddingStartDatePassed = function(auction){
    return typeof(auction) != 'undefined' && auction && biddingStartDate(auction).isBefore();
  }
  var auctionRegistrationStartDatePassed = function(auction){
    return typeof(auction) != 'undefined' && auction && moment(auction.time_start).subtract(viewVars.numLiveAuctionEarlyRegistrationDays, 'days').isBefore();
  }
  var auctionRegistrationStartDate = function(auction){
    var startDate;
    if (viewVars.brand === 'alexcooper' && auction.auction_type === 'timed') {
        startDate = moment(auctionEndDate(auction)).subtract(viewVars.numLiveAuctionEarlyRegistrationDays, 'days');
    } else {
        startDate = moment(auction.time_start).subtract(viewVars.numLiveAuctionEarlyRegistrationDays, 'days');
    }
    if (auction.timezone){
      startDate = startDate.tz(auction.timezone);
    }
    return startDate;
  }
  var auctionStartDatePassed = function(auction){
    return typeof(auction) != 'undefined' && auction && moment(auction.time_start).isBefore();
  };
  var daysTillAuctionStart = function (auction) {
    var startDate = auctionStartDate(auction),
        currentDate = moment(),
        daysDiff = startDate.diff(currentDate),
        daysDiff = daysDiff / (1000*60*60*24);
    return daysDiff;
  }
	var daysTillAuctionEnd = function (auction) {
    var endDate = auctionEndDate(auction),
        currentDate = moment(),
        daysDiff = endDate.diff(currentDate),
        daysDiff = daysDiff / (1000*60*60*24);
    return daysDiff;
  }
  var auctionEndDate = function(auction,noFormat){
    if (typeof(auction) == 'undefined' || !auction){
      return null;
    }
    var interval = moment.interval(moment(auction.time_start), moment.duration(auction.duration));
    var end = interval.end();
    if (auction.timezone){
      end = end.tz(auction.timezone);
    }
    if(typeof(noFormat) == 'undefined' || noFormat){
      return end;
    }
    else {
      return end.format();
    }
  };
  var auctionEffectiveEndTime = function(auction,noFormat){
    var end = moment(auction.effective_end_time);
    if (auction.timezone){
      end = end.tz(auction.timezone);
    }
    if(typeof(noFormat) == 'undefined' || noFormat){
      return end;
    }
    else {
      return end.format();
    }
  };
  var auctionEndDatePassed = function(auction){
    var tempEndDate = auctionEndDate(auction);
    return tempEndDate.isBefore() || tempEndDate.isSame(moment(), 'second');
  };
  var auctionEffectiveEndTimePassed = function(auction){
    var tempEndDate = auctionEffectiveEndTime(auction);
    return tempEndDate.isBefore() || tempEndDate.isSame(moment(), 'second');
  };
  var nowDate = function(){
    return moment().format();
  };
  var auctionStartDateOnly = function(auction){
    return moment(auction.time_start).tz(auction.timezone).locale(viewVars.locale).format('L');
  };
  var auctionEndDateOnly = function(auction){
    var interval = moment.interval(moment(auction.time_start), moment.duration(auction.duration));
    var end = interval.end();
    return end.tz(auction.timezone).locale(viewVars.locale).format('L');
  };

  var auctionSubtitle = function(auction, numLots, includeDate){
    var date;
    /*var formats = {
        longDate: "LLL z",
        shortTime: "h:mm a z"
    };*/

    if (auction.timezone){
        date = moment(auction.time_start).tz(auction.timezone);
    }
    else {
        date = moment(auction.time_start);
    }

    if (viewVars.brand != 'phillips'){
      var numLots = auction.lot_count;
      var fullSubtitle = numLots + ' Lot';
      var separator = " • ";
      if (numLots != 1){
        fullSubtitle += 's';
      }
      if(includeDate){
          fullSubtitle += separator + $rootScope.AMDate.longDate(date);
      } else {
          fullSubtitle += separator + $rootScope.AMDate.shortTime(date);
      }
      if (auction.hasOwnProperty('location_name') && auction.location_name){
        fullSubtitle += separator + auction.location_name;
      }
    }
    else {
      var fullSubtitle = "";
      var separator = " ";
      if (auction.hasOwnProperty('location_name') && auction.location_name){
        fullSubtitle += auction.location_name + separator;
      }
      if(includeDate){
          fullSubtitle += $rootScope.AMDate.longDate(date);
      } else {
          fullSubtitle += $rootScope.AMDate.shortTime(date);
      }
    }
    return fullSubtitle;
  }
  var auctionSubtitleV2 = function(auction, numLots){
    var date;
    /*var formats = {
        longDate: "LLL z",
        shortTime: "h:mm a z"
    };*/

    var time_start = auction.time_start;
    if(viewVars.brand == 'stacksbowers' && auction.time_start_live_auction != null){
      time_start = auction.time_start_live_auction;
    }

    if (auction.timezone){
        date = moment(time_start).tz(auction.timezone);
    }
    else {
        date = moment(time_start);
    }

    if (viewVars.brand != 'phillips'){
      
      var fullSubtitle = "";
      var separator = " • ";

      if(auction.auction_type == "timed"){
        /*todo remove these after we confirm it is working correctly
        var dateFormatter = 'MMM D, YYYY h:mm A z'; 
        if(date.format('mm') == '00'){
          dateFormatter = 'MMM D, YYYY h A z'; 
        }*/
        if(date > moment()){
          fullSubtitle += $filter('translate')('Starts') + ' ' + $rootScope.AMDate.dateTime(date, false, false) + separator;
        }
        
        /*
        todo remove these after we confirm it is working correctly
        dateFormatter = 'MMM D, YYYY h:mm A z'; 
        if(auctionEndDate(auction).format('mm') == '00'){
          dateFormatter = 'MMM D, YYYY h A z'; 
        }*/
        fullSubtitle += $filter('translate')('Ends') + ' ' + $rootScope.AMDate.dateTime(auctionEndDate(auction), false, false);
      }else{

        /*var dateFormatter = 'MMM D, YYYY';
        var timeFormatter = 'h:mm A';
        if(date.format('mm') == '00'){
          timeFormatter = 'h A';
        }
        timeFormatter += ' z';*/
        if(viewVars.brand === 'fasigtipton') {
          fullSubtitle += $rootScope.AMDate.time(date, false, false);
        } else {
          fullSubtitle += $rootScope.AMDate.date(date) + separator + $rootScope.AMDate.time(date, false, false);
        }
      }
      if (auction.hasOwnProperty('location_name') && auction.location_name){
        fullSubtitle += separator + auction.location_name;
      }
    }
    else {
      //TODO change this but as this is only phillips so leaving as is for now
      var fullSubtitle = "";
      var separator = " ";
      if (auction.hasOwnProperty('location_name') && auction.location_name){
        fullSubtitle += auction.location_name + separator;
      }
      if(includeDate){
          fullSubtitle += $rootScope.amDate.longDate(date);
      } else {
          fullSubtitle += $rootScope.amDate.shortTime(date);
      }
    }

    //add another separator because we will be showing the time left
    if(auction.auction_type=='timed' && auctionStartDatePassed(auction) && !auctionEndDatePassed(auction))
      fullSubtitle += separator;

    return fullSubtitle;
  }
  var auctionSubtitleMobile = function(auction, numLots){

    var date;
    if (auction.timezone){
        date = moment(auction.time_start).tz(auction.timezone);
    }else {
        date = moment(auction.time_start);
    }
      
    var fullSubtitle = auction.auction_type+" Auction";
    var separator = " • ";

    /*var timeFormatter = 'h:mm A';
    if(date.format('mm') == '00'){
      timeFormatter = 'h A';
    }
    timeFormatter += ' z';*/
    fullSubtitle += separator + $rootScope.AMDate.time(date, false, false);
    if (auction.hasOwnProperty('location_name') && auction.location_name){
      fullSubtitle += separator + auction.location_name;
    }
  
    return fullSubtitle;
  }
  var auctionBids = function(auction){
    var reg = auctionRegistration(auction);
    var bids = {live_bids:[], absentee_bids:[]};
    if (reg){
      if (reg.hasOwnProperty('live_bids')){
        bids.live_bids = reg.live_bids;
      }
      if (reg.hasOwnProperty('bids')){
        bids.absentee_bids = reg.bids;
      }
    }
    return bids;
  };
  // Get the user's number of lots that they've bid on.
  var auctionBidsLotCount = function(auction, bidCount){
    var count = 0;
    var item_count = 0;
    if (viewVars.features.bidsInLotObject === true){
      if (bidCount != undefined && bidCount != ''){
        var bid_count = 0;
          angular.forEach(bidCount, function(bids, value){
            if (auction.row_id === bids.auction_id){
              bid_count = bids.count;
            }
          });
          return bid_count;
      }
      if(viewVars.userAuctionBidsCount){
        angular.forEach(viewVars.userAuctionBidsCount, function(item, value) {
          if (auction.row_id === item.auction_id){
            count = 1;
            item_count = item.count;
          }
        });
      }
      if(viewVars.userAuctionBidsCountPast){
        angular.forEach(viewVars.userAuctionBidsCountPast, function(item, value) {
          if (auction.row_id === item.auction_id){
            count = 1;
            item_count = item.count;
          }
        });
      }
      if (count == 1){
        return item_count;
      }
      return null;
    } else {
      var groupedBids = auctionBids(auction);
    }

    var lotIds = [];
    for (var i=0; i<groupedBids.live_bids.length; i++){
      lotIds.push(groupedBids.live_bids[i].auction_lot_id);
    }
    for (var i=0; i<groupedBids.absentee_bids.length; i++){
      lotIds.push(groupedBids.absentee_bids[i].lot_id);
    }
    lotIds = Array.unique(lotIds); // Remove duplicate bids on the same lot so we only get the number of lots they've bid on, rather than the total number of bids.
    return lotIds.length;
  };
  var bidSheetButtonLabel = function(auction){
    if (auctionIsPast(auction)){
      return 'View My Results';
    }
    else {
      return 'View My Bids';
    }
  };
    var joinAuction = function(auction, isReturnUrl) {
    var url = '';
    if (viewVars.features.enableMobileBiddingRoom === true && ($rootScope.isMobileNotiPad)) {
      url = generateUrl('liveAuctionMobile', {'auctionId': auction.row_id});
    } else {
      url = endpoints.liveAuction + auction.row_id;
    }
    if (isReturnUrl) {
        return url;
    }
    window.location.href = url;
  };
  var registerToBid = function(auction){
    window.location.href = endpoints.registerToBid + auction.row_id;
  };
  var auctionRegistration = function(auction){
    var auctionId;
    if (typeof auction == 'string'){
      auctionId = auction;
    }
    else {
      if (!auction){
        return null;
      }
      auctionId = auction.row_id;
    }
    if (viewVars.hasOwnProperty('me') && viewVars.me && viewVars.me.hasOwnProperty('auction_registrations')){
      for (var i=0;i<viewVars.me.auction_registrations.length;i++){
        if (viewVars.me.auction_registrations[i].auction_id == auctionId){
          //console.log(viewVars.me.auction_registrations[i]);
          return viewVars.me.auction_registrations[i];
        }
      }
    }
    return null;
  };
  // TODO afterLot() and afterLots() should really be inside LotService now that that's been created.
  var afterLot = function(lot){

    lot.currency_sign = currencySign(lot.currency_code);
    if (lot.sold_price == "0.00"){
      lot.sold_price = null;
    }
    if (!viewVars.features.noSSL && viewVars.deploymentEnvironment == 'production'){
      if (lot.hasOwnProperty('cover_thumbnail') && lot.cover_thumbnail){
        lot.cover_thumbnail = lot.cover_thumbnail.replace("http://","https://");
      }
      if (lot.hasOwnProperty('images')){
        for (var i = 0; i < lot.images.length; i++) {
          if (lot.images[i].hasOwnProperty('detail_url') && lot.images[i].detail_url){
            lot.images[i].detail_url = lot.images[i].detail_url.replace("http://","https://");
          }
          if (lot.images[i].hasOwnProperty('thumbnail_url') && lot.images[i].thumbnail_url){
            lot.images[i].thumbnail_url = lot.images[i].thumbnail_url.replace("http://","https://");
          }
        };
      }
    }
    if(lot.hasOwnProperty('starting_price') && typeof lot.starting_price != 'undefined' && lot.starting_price != null){
      var bidSug = $rootScope.LotService.bidSuggestions(lot);
      if(bidSug.length)
        lot.minimum_bid = bidSug[0];
    }

    lot.lot_label = "Lot " + lot.lot_number + lot.lot_number_extension; // Setting lot_label allows us to search these lot objects using a query like "lot 1a"
    if (!lot.hasOwnProperty('web_module') || !lot.web_module){
      lot.web_module = {absentee_bid: {}};
    }
    else if (!lot.web_module.hasOwnProperty('absentee_bid')){
      lot.web_module.absentee_bid = {};
    }

    return lot;
  };
  var afterLots = function(lots){
    for (var i = 0; i < lots.length; i++) {
      lots[i] = afterLot(lots[i]);
    };
    return lots;
  };
  var afterMe = function(me){
    if(viewVars.module != 'backend' && me.auction_registrations){
      for (var i=0;i<me.auction_registrations.length;i++){
        me.auction_registrations[i] = afterAuctionRegistration(me.auction_registrations[i]);
      }
    }
    return me;
  };
  var afterAuctionRegistration = function(auctionReg){
    for (var i=0; i<auctionReg.either_or.groups.length; i++){
      auctionReg.either_or.groups[i] = afterGroup(auctionReg.either_or.groups[i]);
      /*if (auctionReg.either_or.groups[i].max_quantity == null){
        auctionReg.either_or.groups[i].temp_quantity = 1;
      }
      else {
        auctionReg.either_or.groups[i].temp_quantity = auctionReg.either_or.groups[i].max_quantity;
      }*/
    }
    return auctionReg;
  };

  var isPendingAuctionRegistration = function(auction){
    var auctionReg = auctionRegistration(auction);
    if (!auctionReg){
      return false;
    }
    return !auctionReg.approved_at && !auctionReg.reviewed_at;
  };

  var isDeclinedAuctionRegistration = function(auction){
    var auctionReg = auctionRegistration(auction);
    if (!auctionReg){
      return false;
    }
    return !auctionReg.approved_at && auctionReg.reviewed_at;
  };

  var isApprovedAuctionRegistration = function(auction){
    var auctionReg = auctionRegistration(auction);
    if (!auctionReg){
      return false;
    }
    return auctionReg.approved_at;
  };

  var afterGroup = function(group){
    if (group.max_quantity == null){
      group.temp_quantity = 1;
    }
    else {
      group.temp_quantity = group.max_quantity;
    }
    return group;
  };

  var handleLotErrorFn = function(lot){
    var scope = $rootScope.$new(true);
    scope.lot = lot;
    return function(error){
      return handleError(error, scope);
    }
  }

  var handleError = function(error, scope){
    console.log(error);
    if (!error.hasOwnProperty('silent') || !error.silent){
      if (error.hasOwnProperty('redirect')){
        window.location.href = error.redirect;
      }
      else if (error.hasOwnProperty('refresh') && error.refresh){
        location.reload(); // TODO Do this in an angular way
      }
      else if (error.hasOwnProperty('message')){
        if (typeof scope != 'undefined'){
          $rootScope.setAjaxError(error, scope);
        }
        else {
          $rootScope.setAjaxError(error);
        }
      }
    }
  }

  // We want to use handleError because it is versatile enough to show blue flash messages (non errors). So here we alias handleError to handleAction.
  var handleAction = handleError;

  var silentHandleError = function(error){
    error.silent = true;
    return handleError(error);
  }
  var watch = function(type, obj, watch, $event){
    var endpoint;
    if(typeof $event !== 'undefined') {
      $event.preventDefault();
    }
    if(hasGoogleAnalytics()){
      if(watch){
        //Catalog -> Watch Lot -> AuctionLotDetails -> 1
        sendGoogleAnalyticsData('send', 'event', 'Catalog', 'WatchLot', 'AuctionLotDetails', 1);
      }else{
        //Catalog -> Unwatch Lot -> AuctionLotDetails -> -1
        sendGoogleAnalyticsData('send', 'event', 'Catalog', 'UnwatchLot', 'AuctionLotDetails', 1);
      }
    }
    if (type == 'lot'){
      if (watch){
        endpoint = endpoints.watchLot; 
      }else {
        endpoint = endpoints.unwatchLot; 
      }
    }else if (type == 'artist'){
      if (watch){
        endpoint = endpoints.watchArtist; 
      }else {
        endpoint = endpoints.unwatchArtist; 
      }
    }
    var promise = $http.get(endpoint + obj.row_id);
    var currWatchValue = obj.is_watched;
    obj.is_watched = watch;
    promise.success(function(){
      //obj.is_watched = watch;
    });
    promise.error(function(error){obj.is_watched = currWatchValue; handleError(error);});
  };

  var unwatchLot = function(lot){
    return watch('lot',lot,false);
  };
  var watchLot = function(lot){
    return watch('lot',lot,true);
  };
  var unwatchArtist = function(artist){
    return watch('artist',artist,false);
  };
  var watchArtist = function(artist){
    return watch('artist',artist,true);
  };
  moment.lang('en', {
    calendar : {
        lastDay : '[Yesterday at] LT',
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        lastWeek : '[last] dddd [at] LT',
        nextWeek : 'dddd [at] LT',
        sameElse : 'dddd, MMM Do YYYY [at] LT'
    }
  });
  var friendlyDate = function(date){
    return moment(date).calendar();
  };
  var lotEndDate = function(lot, noFormat){
    if(!lot.extended_end_time){
        if (viewVars.brand !== 'alexcooper') {
            return;
        } else {
            return auctionEndDate(lot.auction);
        }
    }
    var end = moment(lot.extended_end_time);
    if (lot.auction.timezone){
      end = end.tz(lot.auction.timezone);
    }
    if(noFormat)
      return end;
    else
      return end.format();
  }
  var lotOrAuctionEndDate = function(lot,noFormat){
    var endDate = lotEndDate(lot,noFormat);
    if (endDate){
      return endDate;
    }
    return auctionEndDate(lot.auction,noFormat);
  }
  var endDatePassed = function(endDate){
    var now = moment().format();
    if (endDate){
      // Careful here, there is the case where the endDate is exactly equal
      // to the current time (since we're not accounting for milliseconds).
      // And in that case, both isBefore() and isAfter() will be false.
      // If the time is exactly equal, then return true. In practice, we want
      // the UI, such as timers, to refresh when it hits 0 secs.
      //console.log(endDate.isBefore(now) || endDate.isSame(now, 'second'));
      return endDate.isBefore(now) || endDate.isSame(now, 'second');
    }
    else {
      return false;   
    }
  }
  var lotEndDatePassed = function(lot, allowAuctionEndDate){

    var endDate = lotEndDate(lot, true);
    if(!endDate && allowAuctionEndDate){
      endDate = auctionEndDate(lot.auction);
    }
    return endDatePassed(endDate);
  };
  var lotOrAuctionEndDatePassed = function(lot){
    var endDate = lotOrAuctionEndDate(lot, true);
    return endDatePassed(endDate);
  }
  var auctionStartDateSubtitle = function(auction){
    var date = auctionStartDate(auction);
    var atText = " at ";
    if(viewVars.brand == 'stacksbowers'){
      atText = " @ ";
    }
    //var returnString = date.locale(viewVars.locale).format("MMM D, YYYY") + atText + date.locale(viewVars.locale).format("h:mm A z");
    var returnString = $rootScope.AMDate.date(date) + atText + $rootScope.AMDate.time(date, true, false);
    return returnString;
  }
  var biddingStartDateSubtitle = function(auction){
    var date = biddingStartDate(auction);
    var atText = " " + $filter('translate')('at') + " ";
    if(viewVars.brand == 'stacksbowers'){
      atText = " @ ";
    }
    //var returnString = date.locale(viewVars.locale).format("MMM D, YYYY") + atText + date.locale(viewVars.locale).format("h:mm A z");
    var returnString = $rootScope.AMDate.date(date) + atText + $rootScope.AMDate.time(date, true, false);
    return returnString;
  }

  var lotOrAuctionEndDateSubtitle = function(lot){
    var endDate = lotEndDate(lot, true);
    if(!endDate){
      endDate = auctionEndDate(lot.auction, true);
    }
  
    var atText = " at ";
    if(viewVars.brand == 'stacksbowers'){
      atText = " @ ";
    }
    //var returnString = date_end.locale(viewVars.locale).format("MMM D, YYYY") + " at " + date_end.locale(viewVars.locale).format("h:mm A z");
    var returnString = $rootScope.AMDate.date(endDate) + atText + $rootScope.AMDate.time(endDate, true, false);
    return returnString;
  }

  var auctionEndDateSubtitle = function(auction){
    date_end = auctionEndDate(auction);
    var atText = " at ";
    if(viewVars.brand == 'stacksbowers'){
      atText = " @ ";
    }
    //var returnString = date_end.locale(viewVars.locale).format("MMM D, YYYY") + " at " + date_end.locale(viewVars.locale).format("h:mm A z");
    var returnString = $rootScope.AMDate.date(date_end) + atText + $rootScope.AMDate.time(date_end, true, false);
    return returnString;
  }
  var wonTabText = function(auction){
    var pastLabel = true;
    if(auction.auction_type == "timed"){
      pastLabel = auctionEndDatePassed(auction);
    }
    
    var wonTabText = "Won";
    if(!pastLabel)
      wonTabText = "Winning";

    return wonTabText;
  }
  var lostTabText = function(auction){
    var pastLabel = true;
    if(auction.auction_type == "timed")
      pastLabel = auctionEndDatePassed(auction);
    
    var lostTabText = "Lost";
    if(!pastLabel)
      lostTabText = "Outbid";

    return lostTabText;
  }

  var getCoverThumbSize = function(auction){
    var width = 455;
    var height = 250;
    
    if(auctionIsPast(auction) || viewVars.brand == 'grays'){
      height = 167;
    }
    //console.log($rootScope.isMobile);
    if(viewVars.brand == 'stacksbowers' ){
      if(!$rootScope.isMobile){
        if(viewVars.currentRouteName != 'past-auctions'){
          width = 248;
          height = 250;
        }else if(viewVars.currentRouteName == 'past-auctions'){
          width = 382;
          height = 250;
        }
      }else{
        if(viewVars.currentRouteName != 'past-auctions'){
          width = 288;
          height = 200;
        }else if(viewVars.currentRouteName == 'past-auctions'){
          //this is stacks past auctions when mobile
          width = 288;
          height = 200;
        }else{
          width = 400;
          height = 300;
        }
        //since we are mobile we should make the images larger so that ipad looks nice
        width *= 2;
        height *= 2;
      }
    }

    if(viewVars.features.retinaImages){
      height *= 2;
      width *= 2;
    }
    return {'height':height, 'width':width};
  }

  var timerFormat = function(days, hours, minutes, seconds){
    var returnString = "";
    if(days != 0 && typeof days != 'undefined')
      returnString += days+'d ';
    if(hours != 0 && typeof hours != 'undefined')
      returnString += hours+'h ';
    if(minutes != 0 && typeof minutes != 'undefined')
      returnString += minutes+'m ';
    if(seconds != 0 && typeof seconds != 'undefined')
      returnString += seconds+'s ';
   
    return returnString;
    //{{days!=0?(days+'d '):''}}{{(days != 0 || hours != 0)?(hours+'h '):''}}{{minutes}}m
  }

  var adminV1Url = function(){
    return viewVars.adminV1Url;
  }
  
  var trustResourceUrl = function(src) {
    return $sce.trustAsResourceUrl(src);
  }

  var isAuctionHeaderInLotListVisible = function(currentSort){
    if (typeof currentSort == 'undefined' || viewVars.isLotsMapView){
      return true;
    }
    var acceptedSorts = [
      'bid_group_lot_number',
      'auction_date',
      'auction_date_bid_group_lot_number',
      'end_time',
      'auction_date_lot_number',
      'auction_date_lot_number_asc',
    ];
    
    return acceptedSorts.indexOf(currentSort) !== -1;
  }

  var isLotNumberInLotListVisible = function(lot, currentSort){
    return  isAuctionHeaderInLotListVisible(currentSort) &&
            !(lot.hasOwnProperty('listing') && lot.listing && lot.listing.listing_type == 'normal') &&
            !(lot.auction && lot.auction.lot_count == 1);
  }
  var currentDate = function(){
    return new Date();
  }

  var positionBidSuggestions = function(event){
    //disabling this for now
    return;
    //we need to get the bid suggestions left, width, and top then set those and set it to fixed.
    if(typeof event != 'undefined'){
      var $bidSuggestions = $(event.target).siblings('.bid-suggestions');
      viewVars._bidSuggestionsElement = $bidSuggestions;
    }else{
      var $bidSuggestions = viewVars._bidSuggestionsElement;
    }
    //console.log($bidSuggestions);
    if(typeof $bidSuggestions != 'undefined' && $bidSuggestions.length){
      /*if ($bidSuggestions.offset().top + 400 > angular.element("body").height()){
        lot.web_module.dropup = true;
      }else {
        lot.web_module.dropup = false;
      }*/

      cssSettings = $bidSuggestions.siblings('.bid-amount-input').offset();
      
      if($bidSuggestions.hasClass('dropup')){
        cssSettings.top = cssSettings.top - $bidSuggestions.outerHeight() - 4;
      }else{
        cssSettings.top = cssSettings.top + $bidSuggestions.siblings('.bid-amount-input').height() + 4;
      }
      
      $bidSuggestions.css('display', 'block');
      cssSettings.width = $bidSuggestions.outerWidth();
      cssSettings.height = $bidSuggestions.outerHeight();
      cssSettings.position = 'fixed';
      $bidSuggestions.css('display', '');
      if(cssSettings.width != 0){
        $bidSuggestions.css(cssSettings);
      }
    }
  }

  var unpositionBidSuggestions = function(){
    return;
    var $bidSuggestions = viewVars._bidSuggestionsElement;
    cssSettings = {
      left: 'auto',
      top: 'auto',
      position: 'absolute'
    }
    $bidSuggestions.attr('style', '');
  }

  var inLiveAuctionV2 = function(){
    return viewVars.featureVersions.liveAuction == 2 && (viewVars.currentRouteName == 'live-auction' || viewVars.currentRouteName == 'live-auction-page');
  }

  var generateUrl = function(routeName, params){
    var route = viewVars.endpoints[routeName];
    for(var param in params){
      route = route.replace("\{"+param+"\}", params[param]);
    }
    return route;
  }

  var hasDocumentRepository = function(version){
    if(!viewVars.features.documentRepository){
      return false;
    }
    if(viewVars.featureVersions.documentRepository == version){
      return true;
    }
    return false;
  }

  var downloadAllDocuments = function(lot){
    return downloadDocument(null, lot._slug + '-documents.zip', lot);
  }

  var downloadDocument = function(url, name, lot){
    //this function depends on us inlcuding download.js library
    var submitData = {'url': url};
    if (typeof lot != 'undefined' && lot){
      submitData['lotId'] = lot.row_id;
    }

    var promise = $http.post(viewVars.endpoints.downloadDocument, submitData);
    promise.success(function(data){
      var url = data.response.url;
      var defaultMime = "application/octet-stream"
      var anchor = document.createElement("a");
      fileName = url.split("/").pop().split("?")[0];
      anchor.href = url; // assign href prop to temp anchor
        if(anchor.href.indexOf(url) !== -1){ // if the browser determines that it's a potentially valid url path:
        var ajax=new XMLHttpRequest();
        ajax.open( "GET", url, true);
        ajax.responseType = 'blob';
        ajax.onload= function(e){ 
          download(e.target.response, name, defaultMime);
        };
        setTimeout(function(){ ajax.send();}, 0); // allows setting custom ajax headers using the return:
        return ajax;
      } // end if valid url?

    });
    promise.error(function(error){
      handleError(error);
    });
  }

  var extensionFromFilename = function(filename){
    var splittedFilename = filename.split('.');
    if (splittedFilename.length > 0){
      return splittedFilename.pop();
    }
    else {
      return null;
    }
  }
  /**
   * @param  {Array|String} - array or string of products to match
   * @return {Boolean} - if the product matches
   */
  var hasProduct = function(product){
    //the purpose of this function is to return true if a brand has a product
    if(viewVars.products != null && typeof viewVars.products == 'object'){
      for(var key in viewVars.products){
        if(typeof product === 'object'){
          if (product.indexOf(viewVars.products[key]) !== -1) {
            return true;
          }
        }else{
          if(viewVars.products[key] == product){
            return true;
          }
        }
      }
    }else if(viewVars.products != null){
      return viewVars.products.indexOf(product) != -1;
    }
    return false;
  }

  var prettyAuctionType = function (auction) {
    if (auction.auction_type === 'live') {
      return "Live";
    } else if (auction.auction_type === 'timed') {
      return 'Timed';
    } else if (auction.auction_type === 'timed_then_live') {
      return 'Timed Then Live';
    }
  }

  var prettyPublicationStatus = function (status) {
    var statuses = {
      none: 'Draft',
      full: 'Published',
      header_only: 'Published (Header Only)',
      calendar_only: 'Published (Calendar Only)',
    }
    if (statuses.hasOwnProperty(status)) {
      return statuses[status];
    } else {
      return status;
    }
  }

  /**
   * the purpose of this function is to tell us if we should show a certain view mode
   * @param  {String} lotListViewMode the view mode we maybe want to show
   * @param  {String} currentViewMode the current view mode from filter service
   * @return {Boolean}                 if we should show the mode
   */
  var showLotListViewMode = function (lotListViewMode, currentViewMode) {
    /*
    * accepted view modes are follows
    * listView
    * gridView
    * expandedGridView
    */
    var shouldShow = false;
    switch (lotListViewMode) {
      case 'listView':
        if (viewVars.features.coreLotListExpandedGridViewOnly === true) {
          shouldShow = false;
        } else if (currentViewMode === 'list') {
          shouldShow = true;
        }
        break;
      case 'gridView':
        if (viewVars.features.coreLotListExpandedGridViewOnly === true || viewVars.features.coreLotListExpandedGridView === true) {
          shouldShow = false;
        } else if (currentViewMode === 'grid') {
          shouldShow = true;
        }
        break;
      case 'expandedGridView':
        if (viewVars.features.coreLotListExpandedGridViewOnly === true) {
          shouldShow = true;
        }
        if (viewVars.features.coreLotListExpandedGridView === true && currentViewMode === 'grid') {
          shouldShow = true;
        }
        break;
      default:
        shouldShow = false;
    }
    return shouldShow;
  }
  
  var showPastLots = function(auction) {
    if(this.auctionEndDatePassed(auction) && viewVars.features.noPastLots === true) {
      return false;
    }
    return true;
  }

  var currencyHasDecimals = function(auction) {
    var noDecimals = [
      'jpy',
    ];
    if (auction.hasOwnProperty('currency_code') && auction.currency_code !== null) {
      if (noDecimals.indexOf(auction.currency_code.toLowerCase()) !== -1) {
        return false;
      }
    }
    return true;
  }

  var liveBidButtonText = function () {
    if (viewVars.features.spectatorMode === true) {
      return 'Watch/Bid Live';
    } else {
      return 'Bid Live';
    }
  }

    var calculateLocalTimeDifferenceWithServerTime = function (url, reattempt = true) {
        var url = url || 'https://timer.auctionatlas.com/time-utc',
            url = url + '?t=' + new Date().getTime(),
            startTime = moment().utc().valueOf(),
            secondsToAdd = 0,
            endTime,
            promise = $http.get(url, {
                timeout: 3000
            });

        promise.success(function (responseData) {
            // Get total response time
            endTime = moment().utc().valueOf() - startTime;
            // Converting ms to s
            endTime = endTime / 1000;
            secondsToAdd = endTime * 0.80;
            timeDifference = moment(moment.utc()).diff(responseData.response.date_time, 'milliseconds');
            // Converting ms to seconds
            timeDifference = timeDifference / 1000;

            // Add the seconds based on the time difference
            if (timeDifference < 0 || timeDifference > 0) {
                timeDifference -= secondsToAdd;
            } else {
                timeDifference = secondsToAdd;
            }

            if (timeDifference !== 0 && (timeDifference >= 2 || timeDifference <= -2)) {
                //update serverTimeDifference if the timeDifferece is greater than 2 or less than to -2 seconds
                serverTimeDifference = timeDifference;
                $rootScope.updateTimer();
            }
        });

        promise.catch(function () {
            if (reattempt) {
                setTimeout(() => {
                    calculateLocalTimeDifferenceWithServerTime('https://timer2.auctionatlas.com/time-utc', false);
                }, 30000);
            }
        });
    }

  return {
    endpoints: endpoints,

    isLiveBiddingEnabled: isLiveBiddingEnabled,
    isAbsenteeBiddingEnabled: isAbsenteeBiddingEnabled,
    isPercentageBiddingEnabled: isPercentageBiddingEnabled,
    disableAddLot: disableAddLot,
    hasLotFilterFeatures: hasLotFilterFeatures,

    auctionIsLive: auctionIsLive,
    firstLiveAuction: firstLiveAuction,
    auctionIsPast: auctionIsPast,
    lotIsPast: lotIsPast,
    nowDate: nowDate,
    dateWithTimezone: dateWithTimezone,
    auctionStartDate: auctionStartDate,
    biddingStartDate: biddingStartDate,
    biddingStartDatePassed: biddingStartDatePassed,
    auctionStartDatePassed: auctionStartDatePassed,
    daysTillAuctionStart: daysTillAuctionStart,
    daysTillAuctionEnd: daysTillAuctionEnd,
    auctionEndDate: auctionEndDate,
    auctionEffectiveEndTime: auctionEffectiveEndTime,
    auctionEndDatePassed: auctionEndDatePassed,
    auctionEffectiveEndTimePassed: auctionEffectiveEndTimePassed,
    auctionStartDateOnly: auctionStartDateOnly,
    auctionEndDateOnly: auctionEndDateOnly,
    hasGoogleAnalytics: hasGoogleAnalytics,
    auctionSubtitle: auctionSubtitle,
    auctionSubtitleV2: auctionSubtitleV2,
    auctionSubtitleMobile: auctionSubtitleMobile,
    lotOrAuctionEndDate: lotOrAuctionEndDate,
    lotEndDate: lotEndDate,
    endDatePassed: endDatePassed,
    datePassed: endDatePassed,
    lotEndDatePassed: lotEndDatePassed,
    lotOrAuctionEndDatePassed: lotOrAuctionEndDatePassed,
    auctionStartDateSubtitle: auctionStartDateSubtitle,
    biddingStartDateSubtitle: biddingStartDateSubtitle,
    lotOrAuctionEndDateSubtitle: lotOrAuctionEndDateSubtitle,
    auctionEndDateSubtitle: auctionEndDateSubtitle,
    auctionRegistration: auctionRegistration,
    isPendingAuctionRegistration: isPendingAuctionRegistration,
    isDeclinedAuctionRegistration: isDeclinedAuctionRegistration,
    isApprovedAuctionRegistration: isApprovedAuctionRegistration,
    afterMe: afterMe,
    afterAuctionRegistration: afterAuctionRegistration,
    afterGroup: afterGroup,
    auctionBids: auctionBids,
    auctionBidsLotCount: auctionBidsLotCount,
    bidSheetButtonLabel: bidSheetButtonLabel,
    joinAuction: joinAuction,
    registerToBid: registerToBid,
    currencySign: currencySign,
    currencySigns: currencySigns,
    timezones: timezones,
    timezoneMap: timezoneMap,
    currencyFormat: currencyFormat,
    afterLot: afterLot,
    afterLots: afterLots,
    watch: watch,
    watchLot: watchLot,
    unwatchLot: unwatchLot,
    watchArtist: watchArtist,
    unwatchArtist: unwatchArtist,
    wonTabText: wonTabText,
    lostTabText: lostTabText,
    getCoverThumbSize: getCoverThumbSize,
    timerFormat: timerFormat,
    friendlyDate: friendlyDate,
    adminV1Url: adminV1Url,
    handleLotErrorFn: handleLotErrorFn,
    handleError: handleError,
    handleAction: handleAction,
    silentHandleError: silentHandleError,
    consoleLog: consoleLog,
    parseInt: parseInt,
    trustResourceUrl: trustResourceUrl,
    isAuctionHeaderInLotListVisible: isAuctionHeaderInLotListVisible,
    isLotNumberInLotListVisible: isLotNumberInLotListVisible,
    currentDate: currentDate,
    positionBidSuggestions: positionBidSuggestions,
    unpositionBidSuggestions: unpositionBidSuggestions,
    inLiveAuctionV2: inLiveAuctionV2,
    generateUrl: generateUrl,
    hasDocumentRepository: hasDocumentRepository,
    downloadDocument: downloadDocument,
    downloadAllDocuments: downloadAllDocuments,
    extensionFromFilename: extensionFromFilename,
    hasProduct: hasProduct,
    prettyAuctionType: prettyAuctionType,
    prettyPublicationStatus: prettyPublicationStatus,
    auctionRegistrationStartDate: auctionRegistrationStartDate,
    auctionRegistrationStartDatePassed: auctionRegistrationStartDatePassed,
    showLotListViewMode: showLotListViewMode,
    showPastLots: showPastLots,
    currencyHasDecimals: currencyHasDecimals,
    liveBidButtonText: liveBidButtonText,
    calculateLocalTimeDifferenceWithServerTime : calculateLocalTimeDifferenceWithServerTime,
  };
}]);

WebModule.factory('AuctionService', ['$http', '$rootScope', 'WMService', 'LotService', function($http, $rootScope, WMService, LotService){
  var isRefreshable = function(auction, lots){
    if(!auction){
      //this branch return false if none need updated
      var refreshable = false;
      for(var i=0; i<lots.result_page.length; i++){

        if(!lots.result_page[i].hasOwnProperty('auction') || !lots.result_page[i].auction || lots.result_page[i].auction.auction_type != "timed" || WMService.lotIsPast(lots.result_page[i])){
          continue;
        }

        var refreshThreshold = WMService.auctionEndDate(lots.result_page[i].auction).subtract(viewVars.lotsRefreshThreshold, 'seconds');
        var endDate = WMService.auctionEndDate(lots.result_page[i].auction);

        if (!refreshThreshold.isBefore()){
          continue;
        }
        
        // If we are within the last 10 minutes of the auction end date, have the page refresh.
        if (endDate.isAfter()){
          refreshable = true;
        }
        // At this point, we know that the auction is closed. Only refresh if there is a lot that's currently active.
        if (LotService.isActive(lots.result_page[i])){
          refreshable = true;
        }

        //no sense in continueing the loop if true for just one
        if(refreshable){
          break;
        }
        
      }/*for loop*/
      return refreshable;
    }else if(auction.auction_type != 'timed'){
      return false;
    }else{
      var refreshThreshold = WMService.auctionEndDate(auction).subtract(viewVars.lotsRefreshThreshold, 'seconds');
      var endDate = WMService.auctionEndDate(auction);
      // Make sure we have passed the refresh threshold of the auction time (usually 10 minutes before the auction end date).
      if (!refreshThreshold.isBefore()){
        return false;
      }
      // If we are within the last 10 minutes of the auction end date, have the page refresh.
      if (endDate.isAfter()){
        return true;
      }
      // At this point, we know that the auction is closed. Only refresh if there is a lot that's currently active.
      for (var i = 0; i < lots.result_page.length; i++) {
        if (LotService.isActive(lots.result_page[i])){
          return true;
        }
      };
      return false;
    }
  }
  var isSpendingLimitEditMode = function(auction){
    var auctionReg = WMService.auctionRegistration(auction);
    return auctionReg.hasOwnProperty("web_module") && auctionReg.web_module.hasOwnProperty("spending_limit_edit_mode") && auctionReg.web_module.spending_limit_edit_mode;
  };

  var isSpendingLimitConfirmEditMode = function(auction){
    var auctionReg = WMService.auctionRegistration(auction);
    return auctionReg.hasOwnProperty("web_module") && auctionReg.web_module.hasOwnProperty("spending_limit_confirm_edit_mode") && auctionReg.web_module.spending_limit_confirm_edit_mode;
  };

  var enterSpendingLimitEditMode = function(auction){
    var auctionReg = WMService.auctionRegistration(auction);
    if (!auctionReg.hasOwnProperty("web_module")){
      auctionReg.web_module = {};
    }
    auctionReg.web_module.spending_limit_edit_mode = true;
    if (auctionReg.hasOwnProperty('max_spendable')){
      auctionReg.web_module.max_spendable = parseInt(auctionReg.max_spendable);
      //console.log(auctionReg.web_module);
    }
  };
  
  var enterSpendingLimitConfirmEditMode = function(auction){
    var auctionReg = WMService.auctionRegistration(auction);
    if (!auctionReg.hasOwnProperty("web_module")){
      auctionReg.web_module = {};
    }
    auctionReg.web_module.spending_limit_confirm_edit_mode = true;
  };

  var saveSpendingLimit = function(auction, spendable){
    var endpoint = viewVars.endpoints.saveMaxSpendable;
    if (spendable == null || parseInt(spendable) == 0 || spendable == 'NaN'){
      spendable = null;
    }
    else {
      if (spendable != null){
        spendable = spendable.toString();
      }
    }
    var promise = $http({method: 'POST', url: endpoint + auction.row_id, data: {max_spendable: spendable}});
    promise.success(function(data, status, headers, config) {
      if(WMService.hasGoogleAnalytics()){
        //My Bids -> Spending Limit -> Edit -> (value of limit)
        sendGoogleAnalyticsData('send', 'event', 'MyBids', 'SpendingLimit', 'Edit', spendable);
      }
      if (data.hasOwnProperty('me')){
        viewVars.me = data.me;
        viewVars.me = WMService.afterMe(viewVars.me);
        exitSpendingLimitEditMode(auction);
      }
    });
    promise.error(WMService.handleError);
  };
  
  var exitSpendingLimitEditMode = function(auction){
    var auctionReg = WMService.auctionRegistration(auction);
    if (auctionReg.hasOwnProperty('web_module')){
      auctionReg.web_module.spending_limit_edit_mode = false;
    }
  };
    
  var exitSpendingLimitConfirmEditMode = function(auction){
    var auctionReg = WMService.auctionRegistration(auction);
    if (auctionReg.hasOwnProperty('web_module')){
      auctionReg.web_module.spending_limit_confirm_edit_mode = false;
    }
  };

  var afterAuction = function(auction){
    auction.currency_sign = WMService.currencySign(auction.currency_code);
    return auction;
  };
  
  var shippingMethods = [
    {'label':'GENCO/Ground Shipping', value: null},
    {'label':'Customer Pickup', value: 'local-pickup'}
  ];
  
  var getShippingMethod = function(value){
    var method = null;
    for (var i=0; i<shippingMethods.length; i++){
      if (shippingMethods[i].value == value){
        return shippingMethods[i];
      }
    }
    return method;
  }


  var prettyPublicationStatus = function (status) {
    WMService.prettyPublicationStatus(status);
  }

  return {
    isRefreshable: isRefreshable,
    isSpendingLimitEditMode: isSpendingLimitEditMode,
    isSpendingLimitConfirmEditMode: isSpendingLimitConfirmEditMode,
    enterSpendingLimitEditMode: enterSpendingLimitEditMode,
    enterSpendingLimitConfirmEditMode: enterSpendingLimitConfirmEditMode,
    saveSpendingLimit: saveSpendingLimit,
    exitSpendingLimitEditMode: exitSpendingLimitEditMode,
    exitSpendingLimitConfirmEditMode: exitSpendingLimitConfirmEditMode,
    afterAuction: afterAuction,
    shippingMethods: shippingMethods,
    getShippingMethod: getShippingMethod,
    prettyPublicationStatus: prettyPublicationStatus,
  }
}]);

WebModule.factory('LotService', ['$http', '$rootScope', 'WMService', '$timeout', '$filter', function($http, $rootScope, WMService, $timeout, $filter){
  $rootScope.bulkBidAmount = 0;
  $rootScope.bulkBidCount = 0;
  $rootScope.buyersPremium = 0;
  $rootScope.bulkBidCancelMode = false;
  $rootScope.sentBulkBids = false;
  $rootScope.bulkBidArray = [];

  var fieldLabels = {
    description: 'Lot Description',
    provenance: 'Provenance',
    exhibited: 'Exhibited',
    short_description: 'Highlights',
    well_list: 'Well List',
    changelog: 'Lot Updates',
    property_information: 'Lot Information',
    monthly_revenue: 'Monthly Revenue',
    document_repository: 'Document Repository',
    seller: 'Seller',
    operator: 'Operators',
    interest_type: 'Interest Type',
    literature: 'Literature',
  };


  var lotStatuses = {} 
  if(!viewVars.features.realEstate){
    lotStatuses = {
      'active': 'Active',
      'sold': 'Sold',
      'expired': 'Passed',
      'withdrawn': 'Withdrawn',
      'reserve_not_met': 'Reserve Not Met',
      'lot_open': 'Lot Open',
      'bidding_open': 'Bidding Open',
    };
  }else{
    lotStatuses = {
      'active': 'Active',
      'sold': 'Sold',
      'expired': 'Expired',
      'withdrawn': 'Withdrawn',
      'bidding_open': 'Bidding Open',
      'reserve_not_met': 'Reserve Not Met',
      'lot_open': 'Lot Open',
      'cancelled': 'Cancelled',
      'postponed': 'Postponed',
      'under_contract': 'Under Contract',
      'pre_sold': 'Pre Sold',
      'post_sold': 'Post Sold',
    };
  }
  // todo remove this hack and do it correctly
  if (viewVars.currentRouteName === 'edit-lot') {
    if (viewVars.lot.auction.auction_type === 'timed') {
      delete lotStatuses.bidding_open;
    }
  }
  var saleStatuses = {
    'under_contract': 'Under Contract',
    'pre_sold': 'Presold',
    'sold': 'Sold',
    'post_sold': 'Sold Post Auction',
    'postponed': 'Postponed',
    'cancelled': 'Cancelled'
  };
  var isCurrentLot = function(lot, auctionState){
    if (typeof auctionState == 'undefined' || !auctionState || lot === undefined) {
      return false;
    }
    return lot.row_id == auctionState.row_id;
  }
  var lotStatusClasses = function(lot, auctionState){
    //if (typeof auctionState == 'undefined'){ auctionState = null; }
    return lotStatus(lot, auctionState).classes;
  };
  var lotStatusLabel = function(lot, auctionState){
    //if (typeof auctionState == 'undefined'){ auctionState = null; }
    if(viewVars.brand == 'wright' && lotStatus(lot, auctionState).label == 'Passed'){
      return null;
    }
    // Remove the Sold lot status since we display it as a sale status instead.
    if(viewVars.brand == 'alexcooper' && lotStatus(lot, auctionState).label == 'Sold'){
      return null;
    }
    // Change 'Outbid' to 'You have been Outbid'.
    if(viewVars.brand == 'alexcooper' && lotStatus(lot, auctionState).label == 'Outbid'){
      return 'You have been Outbid';
    }
    return lotStatus(lot, auctionState).label;
  };
  var lotStatusLabelDetails = function(lot, auctionState){
    //if (typeof auctionState == 'undefined'){ auctionState = null; }
    return lotStatus(lot, auctionState).labelDetails;
  };
  var saleStatusLabel = function(lot){
    if (lot.status in saleStatuses){
      return saleStatuses[lot.status];
    }
    return null;
  }
  var lotSoldPrice = function(lot){
    //this function will calculate the sold price based on if the tenant has the buyersPremium feature and if the buyers_premium_amount is set.
    //console.log(lot.sold_price, lot.buyers_premium_amount)
    //lot.buyers_premium_amount = 1200
    if(viewVars.features.buyersPremium && lot.hasOwnProperty('buyers_premium_amount') && lot.buyers_premium_amount){
      return parseFloat(lot.sold_price) + parseFloat(lot.buyers_premium_amount);
    }
    return lot.sold_price;
  }

  var isNow = function(lot, auctionState){
    if (lot === undefined) {
      return false;
    }
    // If an auctionState (lot.state from the API) is provided, use it to determine whether or not the given lot is active. The lot is considered active if the auctionState
    // is active and the auctionState's current lot is the same as the given lot. This is used in a live area such as the bidding room.
    if (isCurrentLot(lot, auctionState)){
      return auctionState.active;// && !$scope.lot.state.ended_at; 
    }
    // If an auctionState is not provided, use the info from the lot object to determine if the lot is active. This is used in a static area where we are not connecting
    // to the realtime server, such as on the lots index page.
    else {
      //return true;
      return lot.status == 'bidding_open' || lot.status == 'lot_open';
    }
  };

  var isProxyBiddable = function(lot){
    //NOW() > auction.time_start_proxy_bidding (and time_start_proxy_bidding IS NOT NULL
    if(lot.auction.time_start_proxy_bidding != null){
      var now = moment();
      return now.isAfter(moment(lot.auction.time_start_proxy_bidding));
    }
    return false;
  }

  var isPaused = function(lot, auctionState){
    if (isCurrentLot(lot, auctionState)){
      return !auctionState.active && !auctionState.ended_at && auctionState.hasOwnProperty('started_at') && auctionState.started_at;
    }
    else {
      return false;
    }
  };
  var isStarting = function(lot, auctionState){
    if (isCurrentLot(lot, auctionState)){
      return !auctionState.active && !auctionState.ended_at && (!auctionState.hasOwnProperty('started_at') || !auctionState.started_at);
    }
    else {
      return false;
    }
  };
  var isClosed = function(lot, auctionState){
    if (isCurrentLot(lot, auctionState)){
      return !auctionState.active && auctionState.ended_at;
    }
    else {
      return false; // Don't display a lot as closed outside the bidding room. Instead, one of isWin, isLost, isSold, isWithdrawn, or isPassed will be true.
    }
  };
  var isActive = function(lot, auctionState){
    if (isCurrentLot(lot, auctionState)){
      return false;
    }
    return lot.status == 'active';
  };
  // This is used only for the lot detail page.
  var isRefreshable = function(lot){
    if (!lot.auction || lot.auction.auction_type != 'timed'){
      return false;
    }
    if (isActive(lot)){
      return true;
    }
    var endDate = WMService.auctionEndDate(lot.auction);
    var refreshThreshold = endDate.subtract(viewVars.lotsRefreshThreshold, 'seconds');
    return refreshThreshold.isBefore() && endDate.isAfter();
  }
  var hasWinningBid = function(lot){
    // Notice that winning_bid_id must be not null in order for a lot to be "won"
    if (!viewVars.me || !lot.winning_bid_id){
      return false;
    }
    var noWinningBidObj = !lot.hasOwnProperty('winning_bid') || !lot.winning_bid;
    if (noWinningBidObj){
      // Here we are saying if winning_bid_id is not null (from above), and the
      // winning_bid value is null, then it's considered "won". The server only
      // sends us winning_bid_id with an empty winning_bid to the winner.
      return true;
    }
    // If the winning_bid was provided, we need to check whether it belongs to
    // us, because in this case, it's possible that the winning_bid_id does not
    // actually belong to us since the winning_bid is provided (it is meant to
    // be checked).
    return lot.winning_bid && lot.winning_bid.registration && lot.winning_bid.registration.customer && lot.winning_bid.registration.customer.row_id == viewVars.me.row_id;
  };
  /*var numLotsWon = function(auction){
    var count = 0;
    var auctionReg = WMService.auctionRegistration(auction);
    if (!auctionReg || !auctionReg.hasOwnProperty('live_bids') || !auctionReg.live_bids){
      return count;
    }
    for (var i=0;i<auctionReg.live_bids.length;i++){
      if (isWin(auctionReg.live_bids[i])){
        count += 1;
      }
    }
    return count;
  }*/
  var isWin = function(lot, auctionState){
    if (isCurrentLot(lot, auctionState)){
      return isClosed(lot, auctionState) && isHighestBidder(auctionState);
    }
    else {
      return isSold(lot) && hasWinningBid(lot);
    }
  };
  var isLost = function(lot){
    return isSold(lot) && hasBid(lot) && !hasWinningBid(lot);
  };
  var isSold = function(lot, auctionState){
    if ((typeof auctionState != 'undefined' && isCurrentLot(lot, auctionState) && !isClosed(lot, auctionState)) || lot === undefined) {
      return false;
    }
    return lot.status == 'sold';
  };
  var isWithdrawn = function(lot, auctionState){
    if ((typeof auctionState != 'undefined' && isCurrentLot(lot, auctionState) && !isClosed(lot, auctionState)) || lot === undefined) {
      return false;
    }
    return lot.status == 'withdrawn';
  };
  var isPassed = function(lot, auctionState){
    if ((typeof auctionState != 'undefined' && isCurrentLot(lot, auctionState) && !isClosed(lot, auctionState)) || lot === undefined) {
      return false;
    }
    return lot.status == 'expired' || lot.status == 'reserve_not_met';
  };
  var isWatched = function(lot){
    return lot.is_watched;
  };
  var isInLiveAuction = function(lot){
    return Boolean(lot.auction.realtime_server_url);
  };
  var isLiveBiddingEnabled = function(){
    return WMService.liveBiddingEnabled();
  };
  var isAbsenteeBiddingEnabled = function(auction){
    if (typeof(auction)!='undefined'){
      return WMService.isAbsenteeBiddingEnabled(auction);
    }
    else {
      return WMService.isAbsenteeBiddingEnabled();
    }
  };
  var isBidderRegistrationAllowed = function(lot){
    return !(lot.hasOwnProperty('auction') && lot.auction && lot.auction.hasOwnProperty('bidder_registration_allowed') && !lot.auction.bidder_registration_allowed);
  }
  var isAbsenteeBiddable = function(lot, auctionState){
    if (lot === undefined || (lot.hasOwnProperty('bidding_enabled') && lot.bidding_enabled === false)) {
      return false;
    }
    var isTimedAuction = lot.hasOwnProperty('auction') && lot.auction && ['timed','timed_then_live'].indexOf(lot.auction.auction_type) > -1;
    var isDuringTimedAuction = WMService.auctionStartDatePassed(lot.auction);
    return  isActive(lot, auctionState) && (!isTimedAuction || isDuringTimedAuction) && isAbsenteeBiddingEnabled(lot.auction) &&
            isBidderRegistrationAllowed(lot);
  };
  var isHighestBidder = function(state){
    return state.highbid != null && viewVars.me && state.highbid.user_id == viewVars.me.row_id;
  };
  var currentAuctionRegistration = function(lot){
    return WMService.auctionRegistration(lot.auction);
  };
  var currentAbsenteeBid = function(lot){
    if (viewVars.features.bidsInLotObject === true){
      return lot.absentee_bid;
    }

    var auctionRegistration = currentAuctionRegistration(lot);
    if (auctionRegistration && auctionRegistration.hasOwnProperty('bids') && auctionRegistration.bids !== null) {
      for (var i=0; i<auctionRegistration.bids.length; i++){
        if (auctionRegistration.bids[i].lot_id == lot.row_id){
          return auctionRegistration.bids[i];
        }
      }
    }
    return null;
  };
  var currentTimedBid = function(lot){
    if (viewVars.features.bidsInLotObject === true && lot.hasOwnProperty('absentee_bid') && lot.absentee_bid !== null && lot.absentee_bid.type == 'timed') {
      return lot.absentee_bid;
    }
    
    var auctionRegistration = currentAuctionRegistration(lot);
    if (auctionRegistration && auctionRegistration.hasOwnProperty('bids') && auctionRegistration.bids !== null) {
      for (var i=0; i<auctionRegistration.bids.length; i++){
        if (auctionRegistration.bids[i].lot_id == lot.row_id){
          if(auctionRegistration.bids[i].type=='timed'){
            return auctionRegistration.bids[i];
          }
        }
      }
    }
    return null;
  };
  var currentProxyBid = function(lot){
    if (viewVars.features.bidsInLotObject === true && lot.hasOwnProperty('absentee_bid') === true && lot.absentee_bid !== null && lot.absentee_bid.type === 'proxy'){
      return lot.absentee_bid;
    }
    
    var auctionRegistration = currentAuctionRegistration(lot);
    if (auctionRegistration && auctionRegistration.hasOwnProperty('bids') && auctionRegistration.bids !== null) {
      for (var i=0; i<auctionRegistration.bids.length; i++){
        if (auctionRegistration.bids[i].lot_id == lot.row_id){
          if(auctionRegistration.bids[i].type=='proxy'){
            return auctionRegistration.bids[i];
          }
        }
      }
    }
    return null;
  };
  var hasAbsenteeBid = function(lot){
    return Boolean(currentAbsenteeBid(lot));
  };
  var hasBid = function(lot){
    if (lot === undefined) {
      return false;
    }
    return hasAbsenteeBid(lot) || hasLiveBid(lot);
  };
  var timedOutbid = function(lot){
    return (hasBid(lot) && !hasTopTimedBid(lot)) && (lot.auction.auction_type == 'timed' || lot.auction.auction_type == 'timed_then_live' )
  }
  var hasTopTimedBid = function(lot){
    //return lot.timed_auction_bid && lot.timed_auction_bid.registration.customer.row_id == viewVars.me.row_id;
    var currBid = currentLiveBid(lot);
    var currBidRegistrationId = currBid && currBid.registration_id ? currBid.registration_id : (currBid && currBid.registration !== null ? currBid.registration.row_id : false);
    //todo investigate why this is not being refreshed when placing a bid
    var returnValue = currBid && (lot.auction.auction_type == 'timed' || lot.auction.auction_type == 'timed_then_live') && lot.timed_auction_bid && (lot.timed_auction_bid.registration !== null && lot.timed_auction_bid.registration.hasOwnProperty('row_id') && currBidRegistrationId === lot.timed_auction_bid.registration.row_id);
    return returnValue;
  };
  var nonGroups = [{ngId: "single-bids", group_id: null}, {ngId: "new-group", max_quantity: 1, temp_quantity: 1}];

  var absenteeBidGroups = function(lot){
    var groups = [];
    var auctionReg = currentAuctionRegistration(lot);
    if (auctionReg){
      //groups = auctionReg.either_or.groups;
      //var group = null;
      groups.push(nonGroups[0]); // Make single bids appear at the top.
      for (var i=0; i<auctionReg.either_or.groups.length; i++){
        //group = {ngId: auctionReg.either_or.groups[i].group_id, group_id: auctionReg.either_or.groups[i].group_id};
        auctionReg.either_or.groups[i].ngId = auctionReg.either_or.groups[i].group_id;
        groups.push(auctionReg.either_or.groups[i]);
      }
      groups.push(nonGroups[1]); // Make the new group appear at the bottom.
    }
    return groups;
  };
  var groupDetails = function(auctionId, groupId){
    var auctionReg = WMService.auctionRegistration(auctionId);
    for (var i=0; i<auctionReg.either_or.groups.length; i++){
      if (auctionReg.either_or.groups[i].group_id == groupId){
        /*if (!auctionReg.either_or.groups[i].hasOwnProperty('temp_quantity')){
          auctionReg.either_or.groups[i].temp_quantity = auctionReg.either_or.groups[i].max_quantity;
        }*/
        return auctionReg.either_or.groups[i];
      }
    }
    return null;
  };
  var quantitiesForLotGroup = function(lot){
    var max;
    var group = lot.web_module.absentee_bid.group;
    
    if(typeof group == 'undefined'){
      //lot.web_module.absentee_bid.group = {group_id:'single-bids'}
      return 0;
    }
    if (group.ngId == 'new-group'){
      max = 1;
    }
    else {
      var allBids = currentAuctionRegistration(lot).bids;
      var numGroupBids = 0;
      for (var i=0; i<allBids.length; i++){
        if (allBids[i].group_id == group.group_id){
          numGroupBids += 1;
        }
      }
      max = numGroupBids - 1;
      var currBid = currentAbsenteeBid(lot);
      if (!currBid || (currBid && currBid.group_id != group.group_id)){
        max += 1;
      }
      if (max < 1){
        max = 1;
      }
    }
    // If for whatever reason, the max_quantity field is greater than the number of lots within it, just display max_quantity as an available option.
    if (group.max_quantity > max){
      max = group.max_quantity;
    }
    return max;
  };
  var quantitiesForGroup = function(groupId, auctionId){
    var max;
    var auctionReg = WMService.auctionRegistration(auctionId);
    var group;
    for (var i=0; i<auctionReg.either_or.groups.length; i++){
      if (auctionReg.either_or.groups[i].group_id == groupId){
        group = auctionReg.either_or.groups[i];
      }
    }

    if (!group){
      max = 1;
    }
    else {
      var allBids = auctionReg.bids;
      var numGroupBids = 0;
      for (var i=0; i<allBids.length; i++){
        if (allBids[i].group_id == group.group_id){
          numGroupBids += 1;
        }
      }
      max = numGroupBids - 1;
      if (max < 1){
        max = 1;
      }
    }
    // If for whatever reason, the max_quantity field is greater than the number of lots within it, just display max_quantity as an available option.
    if (group && group.max_quantity > max){
      max = group.max_quantity;
    }
    return max;
  }
  /*var absenteeBidGroups = function(lot){
    var groups = {'single-bid':{group_id: null}};
    return groups;
    var auctionReg = currentAuctionRegistration(lot);
    console.log(auctionReg);
    if (auctionReg){
      var group = null;
      for (var i=0; i<auctionReg.either_or.groups.length; i++){
        group = {ngId: auctionReg.either_or.groups[i].group_id, group_id: auctionReg.either_or.groups[i].group_id};
        groups.push(group);
      }
      var newGroup = {ngId: "new-group"};
      if (false && group){
        var lastGroupId = group.group_id;
        newGroup.group_id = String.fromCharCode(lastGroupId.charCodeAt(lastGroupId.length-1)+1);
      }
      else {
        newGroup.group_id = 'A';
      }
      groups.push(newGroup);
    }
    return groups;
  };*/
  var groupLabel = function(lot){
    if (lot.auction.auction_type != 'live'){
      return null;
    }
    var bid = currentBid(lot);
    //console.log(absentee);
    if (bid && bid.type == 'absentee' && bid.hasOwnProperty('group_id')){
      return groupIdToLabel(bid.group_id);
    }
    else if (bid.type == 'live'){
      return 'Live Bid';
    }
    else {
      return null;
    }
  };
  var groupIdToLabel = function(groupId){
    if (groupId == null){
      if (viewVars.features.groupBidding){
        return 'Single Bid';
      }
      else {
        return null;//'Absentee Bid';
      }
    }
    else {
      return 'Group ' + groupId;
    }
  };
  var groupObjectToLabel = function(lot, groupObject){
    if (groupObject.hasOwnProperty("ngId") && groupObject.ngId == 'new-group'){
      return "New Group";
    }
    else {
      return groupIdToLabel(groupObject.group_id);
    }
  };
  var groupObjectToGroupId = function(lot, groupObject){
    if (groupObject.hasOwnProperty("ngId") && groupObject.ngId == 'new-group'){
      // Determine new group id
      var auctionReg = currentAuctionRegistration(lot);
      var lastGroupIdChar = null;
      var currGroupIdChar = null;
      for (var i=0; i<auctionReg.either_or.groups.length; i++){
        var groupId = auctionReg.either_or.groups[i].group_id;
        currGroupIdChar = groupId.charCodeAt(groupId.length-1);
        if (!lastGroupIdChar || currGroupIdChar > lastGroupIdChar){
          lastGroupIdChar = currGroupIdChar;
        }
      }

      if (lastGroupIdChar){
        return String.fromCharCode(lastGroupIdChar+1);
      }
      else {
        return 'A';
      }
    }
    else {
      return groupIdToLabel(groupObject.group_id);
    }
  };
  var currentLiveBid = function(lot){
    if (viewVars.features.bidsInLotObject === true && lot.hasOwnProperty('highest_live_bid') && lot.highest_live_bid !== null) {
      return lot.highest_live_bid;
    }

    var auctionRegistration = currentAuctionRegistration(lot);
    if(lot.auction && (lot.auction.auction_type == 'timed' || lot.auction.auction_type == 'timed_then_live')){
      if(lot.timed_auction_bid != null && viewVars.me != null){
        if(lot.timed_auction_bid.registration && lot.timed_auction_bid.registration.hasOwnProperty('customer') && lot.timed_auction_bid.registration.customer &&
            viewVars.me.row_id == lot.timed_auction_bid.registration.customer.row_id){
          lot.timed_auction_bid.auction_lot_id = lot.row_id;
          auctionRegistration = {'live_bids':[lot.timed_auction_bid]};
        }else{ 
          //todo fix comment
          //basically this branch will be used to set the outbid amount that the user bid. we need more info from the server
        }
      }
    }
    if (auctionRegistration){
      var maxBid = null;
      if (auctionRegistration.hasOwnProperty('live_bids') && auctionRegistration.live_bids !== null) {
        for (var i=0; i<auctionRegistration.live_bids.length; i++){
          if (auctionRegistration.live_bids[i].auction_lot_id == lot.row_id &&
              (!maxBid || parseFloat(auctionRegistration.live_bids[i].amount) >= parseFloat(maxBid.amount))){
            maxBid = auctionRegistration.live_bids[i];
          }
        }
      }
      return maxBid;
    }
    return null;
  };
  var hasProxyBid = function(lot){
    var proxyBid = currentProxyBid(lot);
    if(proxyBid)
      return true;
    return false;
  }
  var hasTimedBid = function(lot){
    var timedBid = currentTimedBid(lot);
    if(timedBid)
      return true;
    return false; 
  }
  var currentBidRaw = function(lot){
    var liveBid = currentLiveBid(lot);
    var absenteeBid = currentAbsenteeBid(lot);  
    var returnValue = {rawBid: null, type: null};
    if (!liveBid && !absenteeBid){
      return returnValue;
    }
    else if (liveBid && !absenteeBid){
      returnValue.rawBid = liveBid;
      returnValue.type = 'live';
    }
    else if (!liveBid && absenteeBid){
      returnValue.rawBid = absenteeBid;
      returnValue.type = 'absentee';
    }
    else {
      // Note the use of the '>' operator - the current bid will only be indicated as a live bid if its greater than absentee. So, the user would
      // have to make a live bid manually that takes them above their absentee bid. This is important in cases where
      // an absentee bid goes through and becomes a live bid: We still want to indicate that the bid is originally an absentee bid. This way, we can still display
      // special absentee bid flags like group_id and so on, even if it turns into a live bid.
      if (parseFloat(liveBid.amount) > parseFloat(absenteeBid.max_bid)){
        returnValue.rawBid = liveBid;
        returnValue.type = 'live';
      }
      else {
        returnValue.rawBid = absenteeBid;
        returnValue.type = 'absentee';
      }
    }
    return returnValue;
  };
  var currentBid = function(lot){
    var rawBidWrap = currentBidRaw(lot);
    var rawBid = rawBidWrap.rawBid;
    if (!rawBid){
      return rawBid;
    }
    var bid = {row_id: rawBid.row_id, type: rawBidWrap.type, group_id: null, confirmed: true};

    if (!rawBid.hasOwnProperty('amount')){
      bid.amount = rawBid.max_bid;
    }
    else {
      bid.amount = rawBid.amount;
    }

    if (!rawBid.hasOwnProperty('lot_id')){
      bid.lot_id = rawBid.auction_lot_id;
    }
    else {
      bid.lot_id = rawBid.lot_id;
    }

    if (rawBid.hasOwnProperty('group_id')){
      bid.group_id = rawBid.group_id;
    }

    if (rawBid.hasOwnProperty('confirmed')){
      bid.confirmed = rawBid.confirmed;
    }
    if (WMService.isPercentageBiddingEnabled(lot)) {
      bid.max_bid_percentage = rawBid.max_bid_percentage;
    }
    return bid;
  };

  var hasLiveBid = function(lot){
    return Boolean(currentLiveBid(lot));
  };

  var formatBidAmount = function(amount, addCommas){
    var newAmount = amount.toString();
    newAmount = newAmount.replace(/[^0-9.]/g,"");
    newAmount = parseFloat(newAmount).toFixed(2);
    if (typeof addCommas != 'undefined' && addCommas){
      newAmount = newAmount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    return newAmount;
  }

  var currentBidSuggestionIndex = function(lot){
    var offset = null;
    var inputAmount = 0;
    if (lot.hasOwnProperty('web_module') && lot.web_module.hasOwnProperty('absentee_bid') && lot.web_module.absentee_bid.hasOwnProperty('amount')){
        inputAmount = lot.web_module.absentee_bid.amount;
        if (typeof(inputAmount) == 'string'){
          inputAmount = inputAmount.replace(/[^0-9.]/g,"");
        }
        inputAmount = parseInt(inputAmount);
        // If inputAmount is not a valid integer, just make it 0.
        if (!(!isNaN(inputAmount) && parseInt(Number(inputAmount)) == inputAmount && !isNaN(parseInt(inputAmount, 10)))){
          inputAmount = 0;
        }
        offset = bidSuggestions(lot).indexOf(inputAmount);
        if (offset == -1){
          offset = null;
        }
    }
    return offset;
  }

  var pickBidSuggestionOffset = function(lot, offset){
    if (!lot.hasOwnProperty('web_module')){
      lot.web_module = {};
    }
    if (!lot.web_module.hasOwnProperty('absentee_bid')){
      lot.web_module.absentee_bid = {};
    }
    var bidSugg = bidSuggestions(lot);
    if (bidSugg.length > 0){
      var currIndex = currentBidSuggestionIndex(lot);
      //if (typeof currIndex == 'number'){
      var newIndex = null;
      if (typeof currIndex == 'number'){
        if (currIndex + offset < 0){
          newIndex = bidSugg.length + offset;
        }
        else {
          newIndex = (currIndex + offset) % bidSugg.length;
        }
      }
      else {
        if (offset != 0){
          if (offset < 0){
            newIndex = bidSugg.length + offset;
          }
          else {
            newIndex = offset - 1;
          }
        }
      }
      if (newIndex != null){
        lot.web_module.absentee_bid.amount = bidSugg[newIndex];
        if(viewVars.brand == 'stacksbowers')
          buyersPremium(lot);
      }
    }
  }

  var pickBidSuggestion = function(lot, index){
    if (!lot.hasOwnProperty('web_module')){
      lot.web_module = {};
    }
    if (!lot.web_module.hasOwnProperty('absentee_bid')){
      lot.web_module.absentee_bid = {};
    }
    var bidSugg = bidSuggestions(lot);
    if (bidSugg.length > 0){
      lot.web_module.absentee_bid.amount = BigNumber(bidSugg[index]).toFixed(2);
    }
    lot.web_module.showBidSuggestions = false;
    if(viewVars.brand === 'stacksbowers'){
      getBulkBidAmount();
      buyersPremium(lot);
      // lot.bidSuggestions = bidSugg;
    }
  }

  var numBidSuggestions = function(lot){
    var numSugg = 30;
    if (lot._bid_suggestions){
      numSugg = lot._bid_suggestions.length;
    }
    if ($rootScope.isMoreBidSuggestionsNeeded(lot)){
      numSugg += 30;
    }
    return numSugg;
  }

  var bidSuggestions = function(lot, numSuggestions){
    var bidTable = null;
    
    if (lot.hasOwnProperty('bid_table') && lot.bid_table) {
        bidTable = lot.bid_table;
    } else if (lot.auction && lot.auction.hasOwnProperty('bid_table') && lot.auction.bid_table) {
      bidTable = lot.auction.bid_table;
    } else if (viewVars.hasOwnProperty('me') && viewVars.me && viewVars.me.hasOwnProperty('tenant') && viewVars.me.tenant.hasOwnProperty('bid_table') && viewVars.me.tenant.bid_table) {
      bidTable = viewVars.me.tenant.bid_table;
    }
    var allBids = [];
    if (!bidTable){
      return allBids;
    }
    var inputAmount = "0.00";
    if (lot.hasOwnProperty('web_module') && lot.web_module.hasOwnProperty('absentee_bid') && lot.web_module.absentee_bid.hasOwnProperty('amount') && lot.web_module.absentee_bid.amount){
      inputAmount = lot.web_module.absentee_bid.suggestionAmount;
      if (typeof inputAmount == 'string')
        inputAmount = inputAmount.replace(/[^0-9.]/g,"");
    }
    inputAmount = BigNumber(inputAmount);
    // If inputAmount is not a valid integer, just make it 0.
    if (inputAmount.isNaN()){
      inputAmount = BigNumber(0);
    }
    inputAmount = inputAmount.toNumber();
    var amounts = [inputAmount];
    var minimumAmount = currentMinBid(lot);
    if (inputAmount > BigNumber(minimumAmount).toNumber()){
      minimumAmount = inputAmount;
    }

    //if (typeof numSuggestions == 'undefined'){
      numSuggestions = numBidSuggestions(lot);
    //}
    var _suggestions = bidIncrements(lot, numSuggestions, minimumAmount);
    if (!_suggestions){
      console.log(_suggestions);
    }
    //if (!lot._bid_suggestions || lot._bid_suggestions[0] != _suggestions[0]){
      lot._bid_suggestions = _suggestions;
    /*}
    else {
      for (var i=0; i<_suggestions.length; i++){
        if (lot._bid_suggestions.indexOf(_suggestions[i]) == -1){
          lot._bid_suggestions.push(_suggestions[i]);
        }
      }
    }*/
    //console.log(lot._bid_suggestions);
    return lot._bid_suggestions;
  }

  var bidIncrements = function(lot, numSuggestions, minimumAmount){
    var cacheKey = lot.row_id + '.' + numSuggestions.toString();

    if (minimumAmount !== undefined
        && minimumAmount !== null) {
      cacheKey += '.' + minimumAmount.toString();
    } else {
      cacheKey += '.0';
    }

    if (lot.hasOwnProperty('_bid_increments')
        && lot._bid_increments.hasOwnProperty(cacheKey)
        && lot._bid_increments[cacheKey]) {
      return lot._bid_increments[cacheKey];
    }

    if(typeof numSuggestions == 'undefined'){
      numSuggestions = 10;
    }

    if(typeof minimumAmount == 'undefined'){
      minimumAmount = null;
    }

    var minimumAmountExcluded = false;
    if(minimumAmount == null){
      if(lot.hasOwnProperty('timed_auction_bid') && lot.timed_auction_bid && lot.timed_auction_bid.hasOwnProperty('amount') && lot.timed_auction_bid.amount &&  lot.starting_price <= lot.timed_auction_bid.amount){
        minimumAmount = (parseInt(lot.timed_auction_bid.amount));
        minimumAmountExcluded = true;
      }else if (lot.hasOwnProperty('starting_price') && lot.starting_price){
        minimumAmount = (parseInt(lot.starting_price));
        minimumAmountExcluded = false;
      }else if(lot.starting_price == null){
        minimumAmount = (parseInt(1));
        minimumAmountExcluded = false;
      }
    }
    
    var bidTable = null;
    if (lot.hasOwnProperty('bid_table') && lot.bid_table) {
        bidTable = lot.bid_table;
    } else if (lot.auction && lot.auction.hasOwnProperty('bid_table') && lot.auction.bid_table) {
      bidTable = lot.auction.bid_table;
    } else if (viewVars.hasOwnProperty('me') && viewVars.me && viewVars.me.hasOwnProperty('tenant') && viewVars.me.tenant.hasOwnProperty('bid_table') && viewVars.me.tenant.bid_table) {
      bidTable = viewVars.me.tenant.bid_table;
    }
    var allBids = [];
    if (!bidTable){
      //this is needed if we are not logged in and there is no bid table on the auction
      return [minimumAmount];
    }

    var currentIncrement;
    var previousIncrement;
    var currentIncrementBase;
    var totalIterations = 0;
    // console.log(bidTable);
    var bidBases = Object.keys(bidTable).sort(function(a,b){
      if (isNaN(a) || isNaN(b)){return 0;}
      return new BigNumber(a).minus(b);
    });
    // console.log(bidBases);

    // TODO: If we ever need to support half increments like 0.50, simply change all occurences of 'parseInt' to 'parseFloat' within this loop.
    baseLoop: for (var incrementBaseIndex=0; incrementBaseIndex<bidBases.length; incrementBaseIndex++){
      currentIncrementBase = bidBases[incrementBaseIndex];
      currentIncrement = new BigNumber(currentIncrementBase).toNumber();
      // Iterate over increments within bases like 20, 30, 30, 20, etc.
      for (var i=0; true; i++){
        // Fail safe for bad data, if we go over x iterations, just stop iterating.
        totalIterations += 1;
        var maxIterations = 100000;
        if (WMService.isPercentageBiddingEnabled(lot) === true) {
          // todo figure out why this was added. added another 0 to fix decimal increments.
          maxIterations = 10000;
        }
        if (totalIterations > maxIterations){
          break baseLoop;
        }

        if (BigNumber(currentIncrementBase).isNaN()) {
          break;
        }
        // If we've reached the last increment within the base, start from the beginning increment. So from 20, 30, 30, 20 and then back to 20 again.
        if (i == bidTable[currentIncrementBase].length){
          i = 0;
        }
        // If we've already generated numSuggestions, break out of both loops. Or if the current increment is > 10 billion, don't want to lag up the browser.
        // Or if the increment count within this base is over 10000000 which should never happen unless there's bad data.
        if (i > 10000000 || currentIncrement > 10000000000 || allBids.indexOf(currentIncrement) >= (numSuggestions-1)){
          break baseLoop;
        }
        previousIncrement = currentIncrement;
        currentIncrement = BigNumber(currentIncrement).plus(BigNumber(bidTable[currentIncrementBase][i]).toNumber()).toNumber();

        // Stop incrementing within this base if the current increment is greater than the next base (meaning we should
        // move to the next base). So for example, the 500 increment would be generated using the 0 base + 500 in increments, and 550 would
        // be generated using the 500 base + 50 increment. The line below works because adding another increment to the 0 base would make the current
        // increment 520, which is greater than the 500 base. Therefore, 520 will not be added since the predicate below would be true.
        if ((incrementBaseIndex + 1 < bidBases.length) && currentIncrement > BigNumber(bidBases[incrementBaseIndex + 1]).toNumber()) {
          break;
        }
        else {
          // Add the current increment if it is greater than the minimum amount.
          if ( (minimumAmountExcluded && BigNumber(minimumAmount).isLessThan(BigNumber(currentIncrement)))
               || (!minimumAmountExcluded && BigNumber(minimumAmount).isLessThanOrEqualTo(BigNumber(currentIncrement))) ) {
            allBids.push(currentIncrement);
          }
        }
      }
    }
    if (lot.hasOwnProperty('_bid_increments') === false) {
      lot._bid_increments = {};
    }
    lot._bid_increments[cacheKey] = allBids;
    return allBids;
  }

    var clearBidAmount = function (lot) {
        if (
            lot &&
            lot.web_module &&
            lot.web_module.absentee_bid &&
            typeof lot.web_module.absentee_bid.amount !== 'undefined'
        ) {
            delete lot.web_module.absentee_bid.amount;
        }
    };

  var addAbsenteeBid = function(lot, bid, bidType, successCallback){
    if(typeof bidType == 'undefined' || bidType == null){
    //we need to set a bid type based on the auction type here
    //this may be a bit confusing but we always explicitly state that a proxy bid is of type proxy
    //therefore when we have an auction of type timed_then_live we set it to type timed
      if (WMService.isPercentageBiddingEnabled(lot) === true) {
          bidType = "percentage";
      } else {
        if (lot.auction.auction_type=='live') {
          bidType = "absentee";
        } else if(lot.auction.auction_type === 'timed') {
          bidType = 'timed';
        } else if(lot.auction.auction_type === "timed_then_live") {
          bidType = 'timed';
        }
      }
    } else if (WMService.isPercentageBiddingEnabled(lot) === true && bidType === 'proxy') {
      bidType = "proxy_percentage";
    }

    if (typeof bid.amount != 'undefined'){
      $rootScope.bulkBidArray = [];
      var endpoint = viewVars.endpoints.addAbsenteeBid;
      var url = endpoint + lot.auction.row_id + '/' + lot.row_id;
      if(lot.auction.auction_type == "timed_then_live" && typeof bidType != 'undefined'){
        url = url + '/' + bidType;
      }
      if (lot.web_module.absenteeBidEditModeType === 'jumpIncrement') {
        url = url + '/' + lot.web_module.absenteeBidEditModeType;
      }
      var postData = {};
      postData.amount =  bid.amount;
      postData.group_id = null;
      if (bid.hasOwnProperty('group')){
        if (bid.group.hasOwnProperty('group_id')){
          postData.group_id = bid.group.group_id; // TODO we'll have bid.group as an object instead of bid.group_id. keep bid.amount the way it is.
        }
        else if (bid.group.hasOwnProperty('ngId') && bid.group.ngId == 'new-group') {
          postData.group_id = groupObjectToGroupId(lot, bid.group);
        }

        if (bid.group.hasOwnProperty('temp_quantity')){
          postData.group_quantity = bid.group.temp_quantity;
        }
      }
      lot.web_module.updateInProgress = true;
      var promise = $http({method: 'POST', url: url, data: postData});
      promise.success(function(data, status, headers, config) {
        lot.web_module.updateInProgress = false;
        $rootScope.updateTimer();
        //console.log(data);
        if(WMService.hasGoogleAnalytics()){
          if (lot.auction.auction_type == 'live'){//we have a live auction
            if(lot.web_module.previousAbsenteeBidEditMode){
              //LiveAuction -> Absentee Bid -> ConfirmEditedBid -> (value of bid)
                sendGoogleAnalyticsData('send', 'event', 'LiveAuction', 'AbsenteeBid', 'ConfirmEditedBid', bid.amount);
            }else{
              //LiveAuction -> AbsenteeBid -> ConfirmBid -> (value of bid)
                sendGoogleAnalyticsData('send', 'event', 'LiveAuction', 'AbsenteeBid', 'ConfirmBid', bid.amount);
            }
          }else {
            if(lot.web_module.previousAbsenteeBidEditMode){
              //TimedAuction -> Timed Bid -> ConfirmNewBid -> (value of bid)
                sendGoogleAnalyticsData('send', 'event', 'TimedAuction', 'TimedBid', 'ConfirmEditedBid', bid.amount);
            }else{
              //TimedAuction -> Timed Bid -> ConfirmBid -> (value of bid)
                sendGoogleAnalyticsData('send', 'event', 'TimedAuction', 'TimedBid', 'ConfirmBid', bid.amount);
            }
          }

          if (viewVars.brand == 'phillips'){
            sendGoogleAnalyticsData( 'send',
                {
                  hitType: 'event',
                  eventCategory: 'Advance Bid',
                  eventAction: 'Confirmed',
                  eventLabel: 'Sale: '+lot.auction.row_id + ', Lot: '+lot.row_id,
                  eventValue: parseFloat(bid.amount.toString().replace(",",""))
                }
            );
          }
          $rootScope.updateTimer();
        }

        if (data.hasOwnProperty('updatedLot') === true) {
          lot.timed_auction_bid = data.updatedLot.response.timed_auction_bid;
            if (data.hasOwnProperty('response') && data.response.hasOwnProperty('auction_lot') && data.response.auction_lot) {
                $.extend(lot, data.response.auction_lot);
            }
          $.extend(lot, data.updatedLot.response);
          bidSuggestions(lot);
        } else if (data.hasOwnProperty('me') === true){
          viewVars.me = data.me;
          WMService.afterMe(viewVars.me);
          if (data.hasOwnProperty('response') && data.response.type == 'timed_bid'){
            lot.timed_auction_bid = data.response;
            if (data.response.hasOwnProperty('auction_lot') && data.response.auction_lot){
              $.extend(lot, data.response.auction_lot);
            }
          }
        }

        if (data.hasOwnProperty('me') === true || viewVars.features.bidsInLotObject === true) {
          exitAbsenteeBidEditMode(lot);
          var newBid = currentBid(lot);
          var newBidAmount = newBid.amount;
          if (newBid.amount === null) {
            newBidAmount = BigNumber(newBid.max_bid_percentage).toFixed(2);
          }
          var oldBidFormatted = formatBidAmount(bid.amount);
          //lot.web_module.absentee_bid.is_amount_rounded = oldBidFormatted != newBid.amount;
          if (oldBidFormatted !== newBidAmount && viewVars.currentRouteName !== 'live-auction') { // Do not open popup for live auction room since there is no space for it. AM-21105
            lot.web_module.absentee_bid.rounded_amount_message_open = true;
            var popupDuration = 5000;
            if (viewVars.brand === 'alexcooper'){
              popupDuration = 9000;
            }
            $timeout(
              function(){lot.web_module.absentee_bid.rounded_amount_message_open = false;},
              popupDuration
            );
            lot.web_module.absentee_bid.rounded_amount_message_title = $filter('translate')("Bid Rounded Down to Nearest Bid Increment");
            lot.web_module.absentee_bid.rounded_amount_message_content = $filter('translate')("Feel free to increase your absentee bid to the next increment.");
          }
          else {
            lot.web_module.absentee_bid.rounded_amount_message_title = "";
            lot.web_module.absentee_bid.rounded_amount_message_content = "";
          }
        }

        if (typeof successCallback == 'function'){
            successCallback(lot);
        }

        recalculateBulkBids(lot);
        clearBidAmount(lot);
      });

      promise.error(function(response){
        WMService.handleLotErrorFn(lot)(response);
        lot.web_module.updateInProgress = false;
        clearBidAmount(lot);
      });
    }
  };
  var closeMobileBidEditModalFn = function(lot){
    $('#my-bid-mobile-edit').modal('hide');
  }
  var deleteAbsenteeBid = function(lot, successCallback){
    var endpoint = viewVars.endpoints.deleteAbsenteeBid;
    var promise = $http({method: 'POST', url: endpoint + lot.auction.row_id + '/' + lot.row_id});
    promise.success(function(data, status, headers, config) {
      if(WMService.hasGoogleAnalytics()){
        //LiveAuction -> Absentee Bid -> Delete Bid
        sendGoogleAnalyticsData('send', 'event', 'LiveAuction', 'AbsenteeBid', 'DeleteBid', 1);
      }
      if (data.hasOwnProperty('me')){
        viewVars.me = data.me;
        viewVars.me = WMService.afterMe(viewVars.me);
        lot.web_module.absentee_bid.amount = '';
        exitAbsenteeBidEditMode(lot);
        exitAbsenteeBidConfirmDeleteMode(lot);
        if (typeof successCallback == 'function'){
          successCallback(lot);
        }
      }
    });
    promise.error(WMService.handleError);
  };
  var isAbsenteeBidEditMode = function(lot){
    //if(lot.web_module.hasOwnProperty('absenteeBidEditModeType'))
    //  console.log(lot.web_module.absenteeBidEditModeType)
    return (lot.hasOwnProperty('web_module') && lot.web_module && lot.web_module.hasOwnProperty('absenteeBidEditMode') && lot.web_module.absenteeBidEditMode && lot.web_module.absenteeBidEditModeType != 'proxy');
  };
  var isProxyBidEditMode = function(lot){
    //if(lot.web_module.hasOwnProperty('absenteeBidEditModeType'))
    //  console.log(lot.web_module.absenteeBidEditModeType)
    return (lot.hasOwnProperty('web_module') && lot.web_module && lot.web_module.hasOwnProperty('absenteeBidEditMode') && lot.web_module.absenteeBidEditMode && lot.web_module.absenteeBidEditModeType == 'proxy');
  };
  var initAbsenteeBidBox = function(lot){
    if(viewVars.features.bidInputOpened && ( (!hasBid(lot) && isAbsenteeBiddable(lot) && registeredToBid(lot) && viewVars.features.bidInputOpened) || timedOutbid(lot) ) ){
        enterAbsenteeBidEditMode(lot);
    }
  };
  var enterAbsenteeBidEditMode = function(lot, bid_type, forceMobile){
    var bid = currentBid(lot);
    lot.web_module.absentee_bid.group = nonGroups[0];

    if (typeof forceMobile == 'undefined'){
      forceMobile = false;
    }

    // If there is an existing bid, use it to populate the bid amount and group fields.
    if (bid){
      lot.web_module.previousAbsenteeBidEditMode = true;
      if(WMService.hasGoogleAnalytics()){
        //LiveAuction -> Absentee Bid -> Edit Bid
        sendGoogleAnalyticsData('send', 'event', 'LiveAuction', 'AbsenteeBid', 'EditBid', 1);
      }
      if (WMService.isPercentageBiddingEnabled(lot)) {
        lot.web_module.absentee_bid.amount = BigNumber(bid.max_bid_percentage).toNumber().toFixed(2);
      } else {
        lot.web_module.absentee_bid.amount = BigNumber(bid.amount).toNumber().toFixed(2);; // Preselect the bid amount based on the existing bid.
      }
      if (bid.hasOwnProperty('group_id')){
        var allGroups = absenteeBidGroups(lot);
        for (var i=0; i<allGroups.length; i++){
          if (allGroups[i].hasOwnProperty('group_id') && allGroups[i].group_id == bid.group_id){
            lot.web_module.absentee_bid.group = allGroups[i]; // Preselect the group based on the existing bid.
          }
        }
        // Reset the group quantity field by calling afterAuctionRegistration(), which will update the temp_quantity value to max_quantity.
        // But only do so if there are no other bids in edit mode in the same group.
        var allGroupLotsClosed = true;
        //for (var i=0; i<viewVars.me.)
        if (allGroupLotsClosed){
          lot.web_module.absentee_bid.group = WMService.afterGroup(lot.web_module.absentee_bid.group);
        }
        //lot.web_module.absentee_bid.group_id = bid.group_id; // TODO Use one of the group objects from absenteeBidGroups depending on the value of the current bid's group_id. If null, use 'single-bids'. 
      }
    }else if (lot.estimate_low) {
      // Otherwise, populate the bid amount with low lot estimate
      if (viewVars.brand == 'hdh' && lot.estimate_low){
        lot.web_module.absentee_bid.amount = BigNumber(lot.estimate_low).toNumber().toFixed(2); // The value in that text field is prefilled according to the low estimate value.
      }
    }
    lot._bidMode = 'edit';
    lot._editModeTriggered = true;
    lot.web_module.absenteeBidEditMode = true;
    if (lot.auction.auction_type == "timed_then_live" || bid_type === 'jumpIncrement') {
      lot.web_module.absenteeBidEditModeType = bid_type;
    } else {
      lot.web_module.absenteeBidEditModeType = undefined;
    }
    
    if (bid_type === 'jumpIncrement') {
      lot.web_module.absentee_bid.amount = bidSuggestions(lot)[0];
    }
    if (($rootScope.isMobileWidth() || forceMobile) && viewVars.isResponsive == true && viewVars.features.bidInputOpened === false){
      if ($("#my-bid-mobile-edit").length > 0){
        $rootScope.bidPopupLot = lot;

        $rootScope.preventScrollHijackingForModalsInIOS();
        $("#my-bid-mobile-edit").modal();
      }
    }
  };
  var focusBidInput = function(lot,event){

    lot._bid_suggestions = null;
    lot.web_module.absentee_bid.suggestionAmount = lot.web_module.absentee_bid.amount;
    lot.web_module.bidInputFocused = true;
    lot.web_module.showBidSuggestions = true;
    if (event && typeof(event.target) != undefined){
      // Reserve at least 400 px for the bid suggestions. TODO Do this in an
      // angular way.
      if (angular.element(event.target).offset().top + 400 > angular.element("body").height()){
        lot.web_module.dropup = true;
      }
      else {
        lot.web_module.dropup = false;
      }
      $('.bid-suggestions, .'+viewVars.brand+'-bid-suggestions').scrollTop(0);
    }
    if(viewVars.brand =='stacksbowers'){
      if(lot.web_module.absentee_bid.amount && $rootScope.bulkBidArray.length >= 10 && $rootScope.bulkBidArray.indexOf(lot.lot_number) === -1){
        WMService.handleError({message: 'You can place 10 bulk bid at a time.'});
        delete lot.web_module.bulkBid;
        delete lot.web_module.absentee_bid.amount;
        return false;
      }
      prepareBulkBidding(lot);
      getBulkBidAmount();
      buyersPremium(lot, currentMinBid(lot));
    }

    if(viewVars.featureVersions.liveAuction == 2 && (viewVars.currentRouteName == 'live-auction' || viewVars.currentRouteName == 'live-auction-page')){
      WMService.positionBidSuggestions(event);
    }
  }
  var prepareBulkBidding = function(lot){
    lot.web_module.bulkBid = true;
    $rootScope.sentBulkBids = false;
    $rootScope.scrollSticky();
  }
  var getBulkBidAmount = function(){
    if (viewVars.currentRouteName !== 'auction-lots-index' && viewVars.currentRouteName !== 'auction-lots-index-slug') {
        return;
    }
    var lots = viewVars.lots.result_page;
    var bulkBid = 0;
    var bp = 0;
    for(i in lots){
      if(lots[i].web_module.hasOwnProperty('bulkBid') && lots[i].web_module.bulkBid == true){
        if(lots[i].web_module.absentee_bid.hasOwnProperty("amount") && lots[i].web_module.absentee_bid.amount){
          bulkBid = parseFloat(bulkBid) + parseFloat(lots[i].web_module.absentee_bid.amount);
          bp = bp + parseFloat(buyersPremium(lots[i]));
        }
      }
    }
    getBulkBidCount();
    $rootScope.bulkBidAmount = bulkBid;
    $rootScope.buyersPremium = bp;
    $rootScope.scrollSticky();
  }
  var recalculateBulkBids = function(lot){
    delete lot.web_module.bulkBid;
    getBulkBidAmount();
    getBulkBidCount();
    $rootScope.scrollSticky();
  }
  var getBulkBidCount = function(){
    if(typeof viewVars.lots == 'undefined')
      return;
    var lots = viewVars.lots.result_page;
    var bulkBidCount = 0;
    for(i in lots){
      if(lots[i].web_module.hasOwnProperty('bulkBid') && lots[i].web_module.bulkBid == true){
        if(lots[i].web_module.absentee_bid.hasOwnProperty("amount") && lots[i].web_module.absentee_bid.amount){
          bulkBidCount++;
        }
      }
    }
    $rootScope.bulkBidCount = bulkBidCount;
  }
  var sendBulkBids = function(){
    var lots = viewVars.lots.result_page;
    for(i in lots){
      if(lots[i].web_module.hasOwnProperty('bulkBid') && lots[i].web_module.bulkBid == true){
        if(lots[i].web_module.absentee_bid.hasOwnProperty("amount") && lots[i].web_module.absentee_bid.amount){
          addAbsenteeBid(lots[i], lots[i].web_module.absentee_bid, null);
          //console.log(lots[i].web_module.absentee_bid);
        }
      }
    }
    $rootScope.sentBulkBids = true;
  }
  var cancelBulkBid = function(option){
    var lots = viewVars.lots.result_page;
    if(option===null){
      $rootScope.bulkBidCancelMode=true;
    }else if(option===false){
      $rootScope.bulkBidCancelMode=false;
    }else if(option==true){
      $rootScope.bulkBidCancelMode=false;
      for(i in lots){
        if(lots[i].web_module.hasOwnProperty('bulkBid')){
          if(lots[i].web_module.absentee_bid.hasOwnProperty("amount") && lots[i].web_module.absentee_bid.amount){
            delete lots[i].web_module.absentee_bid.amount;
          }
          delete lots[i].web_module.bulkBid;
        }
      }
      $rootScope.sentBulkBids = false;
      getBulkBidCount();
      getBulkBidAmount();
      $rootScope.buyersPremium = 0;
    }
  }
  var getBidValue = function(lot, init){
    if(typeof init == 'undefined'){
      init = false;
    }
    if((viewVars.brand=='stacksbowers' && lot.auction.auction_type=='timed') || (lot.auction.auction_type=='timed_then_live')){
      if(!hasProxyBid(lot) && !isWin(lot) && currentAbsenteeBid(lot) && timedOutbid(lot)){
        delete lot.web_module.absentee_bid.amount;
      }
    }
    if(viewVars.features.bidInputOpened && init){
      lot.web_module.bidInputFocused = false;  
    }else{
      lot.web_module.bidInputFocused = true;
    }
  }
  var unfocusBidInput = function(lot){
    $timeout(function(){
      lot.web_module.bidInputFocused = false;
      lot._bid_suggestions = null;
      if(viewVars.brand == 'stacksbowers'){
        if(lot.web_module.absentee_bid.amount){
          $rootScope.bulkBidArray.push(lot.lot_number);
        }else if(!lot.web_module.absentee_bid.amount && $rootScope.bulkBidArray.indexOf(lot.lot_number) !== -1){
          $rootScope.bulkBidArray.splice($rootScope.bulkBidArray.indexOf(lot.lot_number), 1);
        }
        $rootScope.bulkBidArray = $rootScope.bulkBidArray.filter(function(value, index){ return $rootScope.bulkBidArray.indexOf(value) == index });
      }
      //lot._bid_suggestions_scroll_event = null;
    },500);
    if(viewVars.featureVersions.liveAuction == 2 && (viewVars.currentRouteName == 'live-auction' || viewVars.currentRouteName == 'live-auction-page')){
      WMService.unpositionBidSuggestions();
    }
    // lot._bid_suggestions = null;
    // lot._bid_suggestions_scroll_event = null;
  }
  var exitAbsenteeBidEditMode = function(lot){
    if(typeof bidType == 'undefined'){
      bidType = 'timed';
    }
    if(viewVars.features.bidInputOpened){
      delete lot.web_module.absenteeBidEditModeType;
    }
    if(viewVars.features.bidInputOpened && timedOutbid(lot)){
      //this branch shouldnt be getting entered but it is...
      //todo something is messed up with timedOutbid, investigate
    }else{
      lot._bidMode = 'view';
      lot.web_module.absenteeBidEditMode = false;
      lot.web_module.previousAbsenteeBidEditMode = false;
    }
  };
  var exitProxyBidEditMode = function(lot){
    exitAbsenteeBidEditMode(lot);
    lot.web_module.absenteeBidEditMode = true;
  };
  var submitAbsenteeBid = function(lot){
    var endpoint = viewVars.endpoints.submitAbsenteeBid;
    var promise = $http({method: 'POST', url: endpoint + lot.auction.row_id + '/' + lot.row_id});
    promise.success(function(data, status, headers, config) {
      if (data.hasOwnProperty('me')){
        viewVars.me = data.me;
        WMService.afterMe(viewVars.me);
      }
    });
    promise.error(WMService.handleError);
  };

  var isAbsenteeBidConfirmDeleteMode = function(lot){
    return lot.hasOwnProperty('web_module') && lot.web_module && lot.web_module.hasOwnProperty('absenteeBidConfirmDeleteMode') && lot.web_module.absenteeBidConfirmDeleteMode;
  };

  var enterAbsenteeBidConfirmDeleteMode = function(lot){
    lot.web_module.absenteeBidConfirmDeleteMode = true;
  };

  var exitAbsenteeBidConfirmDeleteMode = function(lot){
    lot.web_module.absenteeBidConfirmDeleteMode = false;
  };

  var isAbsenteeBidQuantityAcceptMode = function(group){
    return group.hasOwnProperty('quantity') && group.hasOwnProperty('temp_quantity') && group.quantity != group.temp_quantity;
  };

  var cancelAbsenteeBidQuantityAcceptMode = function(group){
    group.temp_quantity = group.quantity;
  };

  var updateGroupQuantity = function(auctionId, group){
    var endpoint = viewVars.endpoints.absenteeBidGroupQuantity;
    var promise = $http({method: 'POST', url: endpoint + auctionId + '/' + group.group_id + '/' + group.temp_quantity});
    promise.success(function(data, status, headers, config) {
        if (data.hasOwnProperty('me')){
            viewVars.me = data.me;
            WMService.afterMe(viewVars.me);
        }
        else {
            var auctionReg = WMService.auctionRegistration(auctionId);
            auctionReg.either_or = $.extend(auctionReg.either_or, data.response);
            /*for (var i=0; i<auctionReg.either_or.groups.length; i++){
             if (auctionReg.either_or.groups[i].group_id == groupId){
             console.log(auctionReg.either_or.groups[i]);
             break;
             }
             }*/
        }
        var newGroupDetails = groupDetails(auctionId, group.group_id);
        group.temp_quantity = newGroupDetails.max_quantity;
        group.quantity = group.temp_quantity;
    });
    promise.error(WMService.handleError);
    //promise.then(function(){cancelAbsenteeBidQuantityAcceptMode(group);});
  };

  var isProxyBid = function(lot){
    return lot.auction && lot.auction.auction_type=='timed_then_live' && hasProxyBid(lot) && !isPassed(lot) && !isLost(lot) && !isWin(lot) && !isSold(lot);
  }

  var lotStatus = function(lot, auctionState){
    if (viewVars.brand == 'alexcooper'){
      return alexcooperLotStatus(lot, auctionState);
    }
    if (typeof auctionState == 'undefined'){ auctionState = null; }
    var status = {
      classes:[],
      label: null,
      labelDetails: null
    };
    if (isNow(lot, auctionState)){
      if(viewVars.brand == 'grays' && viewVars.currentRouteName == 'live-auction')
        status = {classes:['now'], label: 'Now'};
      else
        status = isInLiveAuction(lot) ? {classes:['now'], label: 'Live!'} : {classes:[''], label: ''};
    }
    else if (isPaused(lot, auctionState)){
      status = {classes:['paused'], label: 'Paused'};
    }
    else if (isWin(lot)){
      status = {classes:['win'], label: 'Won', labelDetails: "Purchased for " + $filter('currency')(lot.sold_price, lot.currency_code) };
    }
    else if(isProxyBid(lot)){
      //proxy bid stuff. lot 64 on auction 1cf48 for stackstest
      status = {classes:['win'], label: 'Proxy Bid'};
    }
    else if (isLost(lot)){
      status = {classes:['lost'], label: 'Lost', labelDetails: "Sold for " + $filter('currency')(lot.sold_price, lot.currency_code) };
    }
    else if (isSold(lot)){
      status = {classes:['sold'], label: 'Sold', labelDetails: "Sold for " + $filter('currency')(lot.sold_price, lot.currency_code) };
    }
    else if (isPassed(lot)){
      var label = 'Passed';
      if (lot.auction.auction_type == 'timed'){
        label = 'Ended';
      }
      status = {classes:['passed'], label: label};
    }
    else if (isWithdrawn(lot)){
      status = {classes:['withdrawn'], label: 'Withdrawn'};
    }
    else if (isClosed(lot, auctionState)){
      status = {classes:['closed'], label: 'Closed'};
    }
    else if (hasBid(lot)){
      var label = 'Bidding';
      if (viewVars.brand == 'wright'){
        label += ':';
      }
      var classes = ['bid'];
      if (lot.auction.auction_type == 'timed' || lot.auction.auction_type == 'timed_then_live'){
        label = (viewVars.brand !== 'stacksbowers') ? "Winning" : "Bidding";
        if (!hasTopTimedBid(lot)){
          classes = ['lost'];
          label = 'Outbid';
        }
        else {
          classes = ['win', 'winning'];
        }
      }
      status = {classes:classes, label: label, labelDetails: $filter('currency')(lot.sold_price, lot.currency_code) };
    }else{
      //show the current bid if we have one and are stacksbowers
      if(viewVars.brand == 'stacksbowers' && (lot.hasOwnProperty('timed_auction_bid') && lot.timed_auction_bid!=null && lot.timed_auction_bid.hasOwnProperty('amount') && lot.timed_auction_bid.amount)){
        status = {classes:['current'], label: $filter('currency')(lot.timed_auction_bid.amount)};
      }
    }

    if (isWatched(lot)){
      status.classes.push('watched');
    }
    return status;
  };
  var alexcooperLotStatus = function(lot, auctionState){
    if (typeof auctionState == 'undefined'){ auctionState = null; }
    var status = {
      classes:[],
      label: null,
      labelDetails: null
    };
    if (isNow(lot, auctionState)){
        status = {classes:['now'], label: 'Live'};
    }
    else if (isPaused(lot, auctionState)){
      status = {classes:['paused'], label: 'Paused'};
    }
    else if (isWin(lot)){
      status = {classes:['win'], label: 'Won' };
    }
    else if(isProxyBid(lot)){
      //proxy bid stuff. lot 64 on auction 1cf48 for stackstest
      status = {classes:['win'], label: 'Proxy Bid'};
    }
    else if (isLost(lot)){
      status = {classes:['lost'], label: 'Lost' };
    }
    else if (isSold(lot)){
      status = {classes:['sold'], label: 'Sold' };
    }
    else if (isPassed(lot)){
      var label = 'Passed';
      if (lot.auction.auction_type == 'timed'){
        label = 'Ended';
      }
      status = {classes:['passed'], label: label};
    }
    else if (isWithdrawn(lot)){
      status = {classes:['withdrawn'], label: 'Withdrawn'};
    }
    else if (isClosed(lot, auctionState)){
      status = {classes:['closed'], label: 'Closed'};
    }
    else if (hasBid(lot)){
      var label = 'Bidding';
      var classes = ['bid'];
      if (lot.auction.auction_type == 'timed' || lot.auction.auction_type == 'timed_then_live'){
        if (!hasTopTimedBid(lot)){
          classes = ['lost'];
          label = 'Outbid';
        }
        else {
          classes = ['win', 'winning'];
          label = 'Highest Bidder';
        }
      }
      status = {classes:classes, label: label, labelDetails: $filter('currency')(lot.sold_price, lot.currency_code) };
    }

    if (isWatched(lot)){
      status.classes.push('watched');
    }
    return status;
  }

  var artistLabel = function(lot){
    var artistNames = [];
    //we need this for grid view with the lazy loader on the lot list
    if(lot.hasOwnProperty('artist_records')){
      for (var i=0; i<lot.artist_records.length; i++){
        artistNames.push(lot.artist_records[i].name);
      }
    }
    return artistNames.join(",");
  };
  var getAuctionId = function(lot){
    var auctionId;
    if (typeof lot == 'string'){
      auctionId = lot;
    }
    else {
      auctionId = lot.auction.row_id;
    }
    return auctionId;
  }

  var registerToBid = function(lot){
    var auctionId = getAuctionId(lot);
    window.location.href = viewVars.endpoints.registerToBid + auctionId;
  };
  var registeredToBid = function(lot){
    var auctionId = getAuctionId(lot);
    if (viewVars.hasOwnProperty('me') && viewVars.me && viewVars.me.hasOwnProperty('auction_registrations')){
      if (viewVars.brand === 'stacksbowers') {
        return true;
      }
      for (var i=0;i<viewVars.me.auction_registrations.length;i++){
        if (viewVars.me.auction_registrations[i].auction_id == auctionId){
          return true;
        }
      }
    }
    return false;
  };

    var viewBidSheet = function(lotOrAuctionId, newWindow, isReturnUrl) {
    if(typeof newWindow == 'undefined')
      newWindow = false;
    var auctionId;
    //var urlSuffix = '';
    if (typeof(lotOrAuctionId) == 'string'){
      auctionId = lotOrAuctionId;
    }
    else {
      auctionId = getAuctionId(lotOrAuctionId);
      //if (currentBid(lotOrAuctionId).type=='absentee' && currentBid(lotOrAuctionId).confirmed == false){
        //urlSuffix += '?absentee_bid_status=pending';
      //}
    }
    var url = viewVars.endpoints.bidSheet + auctionId;// + urlSuffix;
    if (isReturnUrl) {
        return url;
    }
    if(newWindow){
      window.open(url, '_blank');
    }else{
      window.location.href = url;
    }
  }

  var placeBidButton = function(lot, bid_type, forceMobile){
    if (!viewVars.features.globalBidderRegistration && !registeredToBid(lot) && !viewVars.features.bidderRegWithAccountCreation){
      registerToBid(lot);
    } else if ((viewVars.features.globalBidderRegistration || viewVars.features.bidderRegWithAccountCreation) && !viewVars.me) {
      window.location.href = viewVars.endpoints.login;
    } else {
      if(WMService.hasGoogleAnalytics()){
        if (lot.auction.auction_type == 'live'){ //we have a live auction
            //LiveAuction -> AbsenteeBid -> PlaceBid -> 1
            sendGoogleAnalyticsData('send', 'event', 'LiveAuction', 'AbsenteeBid', 'PlaceBid',1);
        }else{
            //TimedAuction -> Timed Bid -> Place Bid -> 1
            sendGoogleAnalyticsData('send', 'event', 'TimedAuction', 'TimedBid', 'PlaceBid',1);
        }
      }
      if (typeof forceMobile == 'undefined'){
        forceMobile = false;
      }
      enterAbsenteeBidEditMode(lot, bid_type, forceMobile);
    }
  };
  var viewLot = function(lot, event){
    window.location.href = lot._detail_url;
  };
  var clickLotRow = function(lot, event){
    var element = $(event.target);
    if (!element.is(".btn, a, .watch-ribbon, .current-bid-box, .confirm-delete-bid-box, .watch-icon") && !element.parents(".current-bid-box, .watch-icon-wrap, .watch-icon, .inner-place-bid-box, .confirm-delete-bid-box").length){
      viewLot(lot, event);
    }
  };

  var numLotListFields = function(lot, widthType){
    if(lot.hasOwnProperty('_placeholder')){
      return 0;
    }
    if (viewVars.brand == 'peachtreebennett'){
      var total = 0;
      if (widthType == 1){
        total += 0;
      }
      else if (widthType == 2){
        total += 0;
      }
      else if (widthType == 3){
        total +=  (lot.artist_records.length?1:0) +
                  ((lot.starting_price && viewVars.features.startingPriceVisible)?1:0);
      }
      return total;
    }
    else {
      var total = 0;
      if (widthType == 1){
        total += (Boolean(lot.description)?1:0);
      }
      else if (widthType == 2){
        total += (Boolean(lot.condition)?1:0);
      }
      else if (widthType == 3){
        total +=  ((lot.artist_records.length && viewVars.brand != 'hdh')?1:0) +
                  (Boolean(lot.dimensions)?1:0) +
                  ((lot.starting_price && viewVars.features.startingPriceVisible)?1:0);
      }
      return total;
    }
  }

  var buyersPremium = function(lot, currentPrice){
    
    if(typeof currentPrice == 'undefined'){
      currentPrice = false;
    }

    if(isWin(lot)){//the lot is done and won so we can use the buyers_premium_amount plus the sold_price
        return Number(lot.sold_price) + Number(lot.buyers_premium_amount);
    }else{ //we need to calculate the buyers premium here.
      var buyersPremiumTable = lot.auction.default_buyers_premium;
      var buyersPremiumArr = [];
      var currentBuyersPremiumPct = 0;
      //convert buyers premium into an array
      for(i in buyersPremiumTable){
        buyersPremiumArr.push({"value":i, "percent": buyersPremiumTable[i]}) 
      }
      buyersPremiumArr.reverse();
      for(i=0; i<=buyersPremiumArr.length-1; i++){
        if(buyersPremiumArr[i].value <= lot.starting_price){
          currentBuyersPremiumPct = buyersPremiumArr[i].percent;
          break;
        }
      }
      var minBid = currentMinBid(lot);
      if(lot.web_module.hasOwnProperty('absentee_bid') && lot.web_module.absentee_bid.hasOwnProperty('amount') && lot.web_module.absentee_bid.amount){
        minBid = lot.web_module.absentee_bid.amount;
      }
      if(currentPrice){
        minBid = currentPrice;
      }

      if (viewVars.brand == 'stacksbowers' && lot.web_module.hasOwnProperty('absentee_bid') && lot.web_module.absentee_bid.hasOwnProperty('amount') && lot.web_module.absentee_bid.amount) {
          minBid = lot.web_module.absentee_bid.amount;
        if (viewVars.features.buyersPremium && viewVars.currentRouteName == 'live-auction' && currentPrice) {
            minBid = currentPrice;
        }
      }

      var bp = currentBuyersPremiumPct*parseFloat(minBid);

      //if a minimum buyers premium is not null then set the buyers premium to that if it is lower
      if(lot.auction.minimum_buyers_premium != null && parseFloat(bp) < parseFloat(lot.auction.minimum_buyers_premium)){
        bp = parseFloat(lot.auction.minimum_buyers_premium);
      }

      lot.web_module.buyersPremium = parseFloat(minBid) + bp;
      return lot.web_module.buyersPremium;
    }
  }

  var currentMinBid = function(lot, isPlaceholder){
    if(typeof isPlaceholder == 'undefined')
      isPlaceholder = false;
    if(viewVars.brand == 'stacksbowers' && isPlaceholder)
      return false;

    if (viewVars.brand === 'stacksbowers') {
      var currentBid = null;
      var returnIndex = 0;
      var bidKey = 'amount';
      if (WMService.isPercentageBiddingEnabled(lot)) {
        bidKey = 'amount_percentage';
      }
      if(lot.hasOwnProperty('timed_auction_bid') && lot.timed_auction_bid !== null && lot.timed_auction_bid.hasOwnProperty(bidKey) && lot.timed_auction_bid[bidKey]){
        currentBid = lot.timed_auction_bid[bidKey];
        returnIndex = 1;
      } else if (lot.hasOwnProperty('starting_price') && lot.starting_price !== null) {
        currentBid = lot.starting_price;
        returnIndex = 0;
        return currentBid;
      }
      var minBid = bidIncrements(lot, 2, currentBid);
      returnIndex = BigNumber(minBid[0]).isGreaterThan(BigNumber(currentBid)) ? 0 : returnIndex;
      return minBid[returnIndex];
    }

    var highestMinimumBid = null;
    var increments = [];
    var possibleMinBids = [];

    var currAbsenteeBid = currentAbsenteeBid(lot);
    if(lot.hasOwnProperty('timed_auction_bid') && lot.timed_auction_bid!=null && lot.timed_auction_bid.hasOwnProperty('amount') && lot.timed_auction_bid.amount){
      if (hasTopTimedBid(lot) && currAbsenteeBid && currAbsenteeBid.hasOwnProperty('max_bid') && currAbsenteeBid.max_bid){
        possibleMinBids.push(currAbsenteeBid.max_bid);
      }
      else {
        possibleMinBids.push(lot.timed_auction_bid.amount);
      }
    }
    else {
      if (currAbsenteeBid && currAbsenteeBid.hasOwnProperty('max_bid') && currAbsenteeBid.max_bid){
        possibleMinBids.push(currAbsenteeBid.max_bid);
      }
    }
    if(lot.starting_price){
      possibleMinBids.push(lot.starting_price);
    }
    var numStartingPriceOccurrences = 0;
    for(var i=0; i<possibleMinBids.length; i++){
      if (typeof possibleMinBids[i] == 'string'){
        possibleMinBids[i] = possibleMinBids[i].replace(",","");
      }

      possibleMinBids[i] = parseFloat(possibleMinBids[i]);
      if (highestMinimumBid === null || possibleMinBids[i] > highestMinimumBid){
        highestMinimumBid = possibleMinBids[i];
      }

      if (possibleMinBids[i] === parseFloat(lot.starting_price)){
        numStartingPriceOccurrences += 1;
      }
    }

    if (highestMinimumBid === null){
      highestMinimumBid = 0;
    }

    increments = bidIncrements(lot, 2, highestMinimumBid);

    // Allow the starting price to be usable as a bid. In which case, the user can bid the highestMinimumBid amount, if available as an increment in the increments array.
    // If however, the starting price is not the highestMinimumBid, the first usable bid must be strictly greater than highestMinimumBid.
    var isHighestMinimumBidUsable = parseFloat(lot.starting_price) === highestMinimumBid && numStartingPriceOccurrences === 1;
    
    if (highestMinimumBid < parseFloat(increments[0]) || (isHighestMinimumBidUsable && highestMinimumBid <= parseFloat(increments[0]))){
      return increments[0];
    }
    else {
      return increments[1];
    }

  /*if(!lot.hasOwnProperty('timed_auction_bid') || lot.timed_auction_bid==null || parseFloat(lot.timed_auction_bid.amount)==0){
      if(typeof lot.starting_price != 'undefined' && lot.starting_price != null)
        return lot.starting_price;
      else
        return "";
    }else{
      return lot.timed_auction_bid.amount;
    }*/
  }

  var isConsignor = function(lot){
    if(!viewVars.me)
      return false;
    if(lot.consignor_customer_id == viewVars.me.row_id){
      return true;
    }else{
      return false;
    }
  }

  var isBelowReserve = function(lot){
    if(typeof lot.reserve_met == 'undefined' || lot.reserve_met || lot.reserve_met == null){
      return false;
    }
    return true;
  }
  
  var youtubeVideoUrl = function(id){
    return 'https://www.youtube.com/embed/'+id;
  }

  var formattedLotStatus = function(status){
    console.log(statuses)
    var statuses = {
      'active':'Active',
      'sold':'Sold',
      'expired':'Passed',
      'withdrawn':'Withdrawn',
      'reserve_not_met':'Reserve Not Met',
    }
    return statuses[status];
  }

  var myLivePendingBid = function(liveLot){
    if (!liveLot.hasOwnProperty('pendingBids') || !liveLot.pendingBids){
      return null;
    }
    var auctionReg = WMService.auctionRegistration(liveLot.auction.row_id);
    if (!auctionReg){
      return null;
    }
    var index = null;
    liveLot.pendingBids.some(function(b, i) {
      if (b.paddle == auctionReg.paddle || (b.hasOwnProperty('user') && b.user.hasOwnProperty('paddle') && b.user.paddle == auctionReg.paddle)){
        return index = i;
      }
    });
    if (index != null && liveLot.pendingBids[index].pending){
      return liveLot.pendingBids[index]; 
    }
    return null;
  }

  var acceptNda = function(lot){
    var url = viewVars.endpoints.acceptLotNda;
    var submitData = {lotId: lot.row_id};
    var promise = $http.post(url, submitData);
    promise.success(function(data){
      if (data.hasOwnProperty('response')){
        lot.nda_signed_at = moment().format();
      }
      if (WMService.hasGoogleAnalytics() && (viewVars.brand ==='alexcooper' || viewVars.brand === 'alexcooperfineart')) {
        sendGoogleAnalyticsData('send', 'event', 'User', 'AcceptNDA');
      }
    });
    promise.error(function(data){
      WMService.handleError(data);
    });
  }

  var toggleLotDescription = function(lot){
    lot._descriptionClosed = !lot._descriptionClosed;
  }

  var lotType = function(lot){
    if (lot.auction && lot.auction.auction_type == 'foreclosure'){
      return 'foreclosure';
    }
    else if (lot.listing && lot.listing.listing_type == 'normal'){
      return 'traditional';
    }
    else {
      return 'featured_auction';
    }
  }
  var isWebsocketProtocolCorrect = function() {
    var url = window.location.href,
      siteProtocol  = url.split("/")[0],
      websocketUrl,
      websocketProtocol;
    if (viewVars.hasOwnProperty('websocket') === true && viewVars.websocket && viewVars.websocket.url !== null) {
      if (siteProtocol.toLowerCase() === 'https:') {
          // since we are on https we have to make sure that the websocket is wss
        websocketUrl = viewVars.websocket.url;
        websocketProtocol = websocketUrl.split("/")[0];
        if (websocketProtocol.toLowerCase() === 'ws:') {
          return false;
        } else {
          return true;
        }
      }
      return true;
    }
    return false;
  }
  var webSocketUpdateLot = function(newLot, oldLots){
    for (var i=0; i<oldLots.length; i++){
      if (newLot.row_id == oldLots[i].row_id){
        var fieldsToReplace = ['sold_price','status','extended_end_time', 'winning_bid_id'];
        var fieldsToExtend = ['winning_bid'];
        var currField = null;

        for (var j=0; j<fieldsToReplace.length; j++){
          currField = fieldsToReplace[j];
          oldLots[i][currField] = newLot[currField];
        }

        for (var j=0; j<fieldsToExtend.length; j++){
          currField = fieldsToExtend[j];
          if (newLot.hasOwnProperty(currField)){
            if (!oldLots[i].hasOwnProperty(currField) || !oldLots[i][currField]){
              oldLots[i][currField] = {};
            }
            $.extend(oldLots[i][currField], newLot[currField]);
          }
        }
      }
    }
    $rootScope.updateTimer();

    return oldLots;
  }

  var webSocketInit = function($scope){
    $scope.reconnectAttempts = 0;
    $scope.connection = new ReconnectingWebSocket(viewVars.websocket.url);
    $scope.connection.maxReconnectAttempts = viewVars.timedWebSocketMaxRetries;
    // When the connection is open, subscribe to the auction events (or lots).
    $scope.connection.onopen = function () {
      $scope.registerWebSocket();
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
      $scope.lotsRefreshWrapper();
    };

    $scope.connection.onmessage = $scope.executeMessage;
    $scope.connection.onclose = function(){
      $scope.$apply(function(){$scope.model.connected = false;});
      $scope.isWebsocketAvailable = false;
      if(!$scope.$$phase){
          $scope.$apply();
      }
      $scope.lotsRefreshWrapper();
    };
  }
  var heartbeatLengthError = false;
  var heartbeatPromise = null;
  var heartbeat = function(){
    // capture the time of the heartbeat and store it in localStorage.
    // compare that to the current time, if it is greater than x show the disconnect message
    var actualTime = new Date().getTime();
    var heartbeatTime = window.localStorage.getItem('heartbeatTime');
    var actualTimeMoment = moment(actualTime);
    var heartbeatTimeMoment = moment(parseInt(heartbeatTime));
    var duration = moment.duration(actualTimeMoment.diff(heartbeatTimeMoment));

    if (duration.asSeconds() > 10) {
      heartbeatLengthError = true;
    }

    if (heartbeatPromise){
      var actualTime = new Date().getTime();
      window.localStorage.setItem('heartbeatTime', actualTime);
      $timeout.cancel(heartbeatPromise);
    }
    heartbeatPromise = $timeout(heartAttack, 6000);
  };
  var heartAttack = function () {
    $scope.connection.close();
    initWebSocket();
  }
  var webSocketUpdate = function($scope, message, lots){
    var envelope = $.parseJSON(message.data);

    if(envelope.type !== 'heartbeat') {
      console.log(envelope);
    }
    if(envelope.type === 'heartbeat') {
      heartbeat();
    } else if ('auction-lot-end' == envelope.type) {
      for (var i=0; i<lots.length; i++){
        if (envelope.message.row_id == lots[i].row_id){
          var fieldsToReplace = ['sold_price','status','extended_end_time', 'winning_bid_id'];
          var fieldsToExtend = ['winning_bid'];
          var currField = null;

          for (var j=0; j<fieldsToReplace.length; j++){
            currField = fieldsToReplace[j];
            if (envelope.message.hasOwnProperty(currField)){
              lots[i][currField] = envelope.message[currField];
            }
          }

          for (var j=0; j<fieldsToExtend.length; j++){
            currField = fieldsToExtend[j];
            if (envelope.message.hasOwnProperty(currField)){
              if (!lots[i].hasOwnProperty(currField) || !lots[i][currField]){
                lots[i][currField] = {};
              }
              $.extend(lots[i][currField], envelope.message[currField]);
            }
          }
        }
      }
    }
    else if ('auction-lot-group-extended-end-time' == envelope.type){
      for (var i=0; i<envelope.message.lots.length; i++){
        webSocketUpdateLot(envelope.message.lots[i], lots);
      }
      $rootScope.updateTimer();
    }
    else if (['bid','outbid'].indexOf(envelope.type) > -1){
      var lotRefreshIndex = null;
      for (var i=0; i<lots.length; i++){
        if (envelope.message.auction_lot.row_id == lots[i].row_id){
          if (!lots[i].timed_auction_bid){
            lots[i].timed_auction_bid = $.extend(true, lots[i].timed_auction_bid, envelope.message.bid);
          }
          // If timed_auction_bid is already defined in the lot list, instead of overriding it, just extend it with what is in the websocket.
          // This way any angular references to the original timed_auction_bid object won't be broken.
          else {
            $.extend(true, lots[i].timed_auction_bid, envelope.message.bid);
          }

          if (viewVars.me !== null) {
            if (viewVars.me.row_id === envelope.message.bid.registration.customer.row_id) {
              if (lots[i].hasOwnProperty('highest_live_bid') === false) {
                lots[i].highest_live_bid = $.extend(true, lots[i].highest_live_bid, envelope.message.bid);
              } else {
                // If highest_live_bid is already defined in the lot list, instead of overriding it, just extend it with what is in the websocket.
                // This way any angular references to the original highest_live_bid object won't be broken.
                $.extend(true, lots[i].highest_live_bid, envelope.message.bid);
              }
            }
            if (envelope.type == 'outbid' && viewVars.features.bidInputOpened) {
                // Open the bid box if the user is outbid
                enterAbsenteeBidEditMode(lots[i]);
            }
          }

          if (!lots[i].hasOwnProperty('web_module') || !lots[i].web_module){
            lots[i].web_module = {};
          }
          lotRefreshIndex = i;
          lots[lotRefreshIndex].web_module.updateInProgress = true;
          $.extend(true, lots[i], envelope.message.auction_lot);
          $timeout(function(){
            if (!lots[lotRefreshIndex].hasOwnProperty('web_module') || !lots[lotRefreshIndex].web_module){
              lots[lotRefreshIndex].web_module = {};
            }
            lots[lotRefreshIndex].web_module.updateInProgress = false;
            $rootScope.updateTimer();
          })

          // Update the reserve met details of the lot
            if (typeof envelope.message.auction_lot.reserve_met != 'undefined' && envelope.message.auction_lot.row_id === lots[i].row_id) {
                lots[i].reserve_met = envelope.message.auction_lot.reserve_met;
            }
        }
      }
    }
    else if ('error' == envelope.type){
      WMService.handleError(envelope.message);
    }
    else if ('message' == envelope.type){
      WMService.handleError($.extend(true, {}, envelope.message, {messageType: 'info'}));
    }
  }

  var webSocketConnectMessage = function(lotIds){
      var connectMessage = 
      {
        'type':'register',
        'message': {
          'tenant': viewVars.websocket.tenant,
          'api_version': "1"
        }
      };
      if (viewVars.me){
        connectMessage.message.customer_id = viewVars.me.row_id;
      }
      if (viewVars.websocket.auction_id){
        connectMessage.message.auction_id = viewVars.websocket.auction_id;
      }
      if (typeof lotIds != 'undefined'){
        connectMessage.message.auction_lot_ids = lotIds;
      }
      else if (viewVars.websocket.auction_lot_ids != null){
        connectMessage.message.auction_lot_ids = viewVars.websocket.auction_lot_ids;
      }
      return connectMessage;
  }
  var webSocketExecuteMessage = function($scope, message, lots){
    $scope.$apply(function(){
      var envelope = $.parseJSON(message.data);
      // Commented out instead of removing for future use
      // if (envelope.type == 'heartbeat'){}
      webSocketUpdate($scope, message, lots);

      var envelope = $.parseJSON(message.data);
      if (envelope.type == 'auction-end' && typeof $scope.lotsRefreshFn == 'function'){
        $scope.lotsRefreshFn('websocketAuctionEnd');
      }
    });
  }

  var lotNumberPrefix = function(lot){
    /*if (viewVars.brand == 'annmaris'){
      var charLength = lot.lot_number.toString().length;
      if (lot.lot_number_extension){
        charLength += lot.lot_number_extension.toString().length;
      }
      var paddingLength = 3-charLength;
      if (paddingLength > 0){
        return "0".repeat(paddingLength);
      }
      else {
        return "";
      }
    }*/
    return null;
  }

  var calculateTotalBidCost = function(lot, amount) {
    if(typeof amount == 'undefined') {
      return lot.timed_auction_bid.amount * lot.quantity;
    }
    return amount * lot.quantity;
  }

  return {
    fieldLabels: fieldLabels,
    lotStatuses: lotStatuses,
    isRefreshable: isRefreshable,

    isCurrentLot: isCurrentLot,
    lotStatus: lotStatus,
    lotStatusClasses: lotStatusClasses,
    lotStatusLabel: lotStatusLabel,
    lotStatusLabelDetails: lotStatusLabelDetails,
    lotSoldPrice: lotSoldPrice,
    saleStatusLabel: saleStatusLabel,
    isNow: isNow,
    isProxyBiddable: isProxyBiddable,
    isActive: isActive,
    isPaused: isPaused,
    isStarting: isStarting,
    isClosed: isClosed,
    //numLotsWon: numLotsWon,
    isWin: isWin,
    hasWinningBid: hasWinningBid,
    isLost: isLost,
    isSold: isSold,
    isPassed: isPassed,
    isWithdrawn: isWithdrawn,
    isProxyBid: isProxyBid,
    isWatched: isWatched,
    isBidderRegistrationAllowed: isBidderRegistrationAllowed,
    isAbsenteeBiddable: isAbsenteeBiddable,
    isHighestBidder: isHighestBidder,
    currentAuctionRegistration: currentAuctionRegistration,

    absenteeBidGroups: absenteeBidGroups,
    groupDetails: groupDetails,
    groupLabel: groupLabel,
    quantitiesForLotGroup: quantitiesForLotGroup,
    quantitiesForGroup: quantitiesForGroup,
    groupIdToLabel: groupIdToLabel,
    groupObjectToLabel: groupObjectToLabel,
    groupObjectToGroupId: groupObjectToGroupId,

    currentAbsenteeBid: currentAbsenteeBid,
    currentTimedBid: currentTimedBid,
    currentProxyBid: currentProxyBid,
    currentLiveBid: currentLiveBid,
    hasTimedBid: hasTimedBid,
    hasProxyBid: hasProxyBid,
    currentBid: currentBid,
    currentBidRaw: currentBidRaw,
    hasAbsenteeBid: hasAbsenteeBid,
    hasLiveBid: hasLiveBid,
    hasBid: hasBid,
    hasTopTimedBid: hasTopTimedBid,
    addAbsenteeBid: addAbsenteeBid,
    numBidSuggestions: numBidSuggestions,
    bidSuggestions: bidSuggestions,
    bidIncrements: bidIncrements,
    currentBidSuggestionIndex: currentBidSuggestionIndex,
    pickBidSuggestionOffset: pickBidSuggestionOffset,
    pickBidSuggestion: pickBidSuggestion,
    formatBidAmount: formatBidAmount,
    submitAbsenteeBid: submitAbsenteeBid,
    //changeGroupQuantity: changeGroupQuantity,
    updateGroupQuantity: updateGroupQuantity,
    closeMobileBidEditModalFn: closeMobileBidEditModalFn,
    deleteAbsenteeBid: deleteAbsenteeBid,
    isLiveBiddingEnabled: isLiveBiddingEnabled,
    isAbsenteeBiddingEnabled: isAbsenteeBiddingEnabled,
    isAbsenteeBidEditMode: isAbsenteeBidEditMode,
    isProxyBidEditMode: isProxyBidEditMode,
    enterAbsenteeBidEditMode: enterAbsenteeBidEditMode,
    initAbsenteeBidBox: initAbsenteeBidBox,
    focusBidInput: focusBidInput,
    unfocusBidInput: unfocusBidInput,
    exitAbsenteeBidEditMode: exitAbsenteeBidEditMode,
    prepareBulkBidding: prepareBulkBidding,
    getBulkBidAmount: getBulkBidAmount,
    recalculateBulkBids: recalculateBulkBids,
    sendBulkBids: sendBulkBids,
    getBidValue: getBidValue,
    cancelBulkBid: cancelBulkBid,
    exitProxyBidEditMode: exitProxyBidEditMode,
    isAbsenteeBidConfirmDeleteMode: isAbsenteeBidConfirmDeleteMode,
    enterAbsenteeBidConfirmDeleteMode: enterAbsenteeBidConfirmDeleteMode,
    exitAbsenteeBidConfirmDeleteMode: exitAbsenteeBidConfirmDeleteMode,
    isAbsenteeBidQuantityAcceptMode: isAbsenteeBidQuantityAcceptMode,
    //enterAbsenteeBidQuantityAcceptMode: enterAbsenteeBidQuantityAcceptMode,
    cancelAbsenteeBidQuantityAcceptMode: cancelAbsenteeBidQuantityAcceptMode,
    registerToBid: registerToBid,
    registeredToBid: registeredToBid,
    viewBidSheet: viewBidSheet,
    placeBidButton: placeBidButton,
    clickLotRow: clickLotRow,
    viewLot: viewLot,
    artistLabel: artistLabel,
    timedOutbid: timedOutbid,
    buyersPremium: buyersPremium,
    currentMinBid: currentMinBid,
    isConsignor: isConsignor,
    isBelowReserve: isBelowReserve,

    numLotListFields: numLotListFields,
    youtubeVideoUrl: youtubeVideoUrl,
    formattedLotStatus: formattedLotStatus,
    myLivePendingBid: myLivePendingBid,
    acceptNda: acceptNda,
    toggleLotDescription: toggleLotDescription,

    lotType: lotType,

    isWebsocketProtocolCorrect: isWebsocketProtocolCorrect,
    webSocketInit: webSocketInit,
    webSocketUpdate: webSocketUpdate,
    webSocketConnectMessage: webSocketConnectMessage,
    webSocketExecuteMessage: webSocketExecuteMessage,

    lotNumberPrefix: lotNumberPrefix,
    calculateTotalBidCost: calculateTotalBidCost,
  };
}]);

WebModule.factory('CreditCardService', ['$http', /*'$rootScope', 'WMService', */function($http/*, $rootScope, WMService*/){
  var creditCardLabel = function(card){
    if (card.hasOwnProperty('label')){
      return card.label;
    }
    if(card.hasOwnProperty('last4')){
      return card.brand + ' **** **** **** ' + card.last4
    }else{
      return card.brand + ' **** **** **** ' + card.last_four_digits;
    }
  };

  var stripeAddressMap = {
    'address_line_one': 'address',
    'address_line_two': 'address_2',
    'address_state': 'state',
    'address_city': 'city',
    'address_postal_code': 'zip_code',
    'address_country': 'country',
  };

  var expirationMonths = [
    {value:"01", label:"01 - January"},
    {value:"02", label:"02 - February"},
    {value:"03", label:"03 - March"},
    {value:"04", label:"04 - April"},
    {value:"05", label:"05 - May"},
    {value:"06", label:"06 - June"},
    {value:"07", label:"07 - July"},
    {value:"08", label:"08 - August"},
    {value:"09", label:"09 - September"},
    {value:"10", label:"10 - October"},
    {value:"11", label:"11 - November"},
    {value:"12", label:"12 - December"},
  ]; 

  var getPreferredCard = function(payment_methods){
    var preferred_card = payment_methods[0]
    for(i in payment_methods){
      if(payment_methods.preferred === true){
        preferred_card = payment_methods[i];
      }
    }
    if(typeof preferred_card == 'undefined')
      preferred_card = {'id':0}
    return preferred_card;
  }

  var getStripeFormInfo = function(formSelector){
    var stripeInfo = {};
    var selector = "[data-stripe]";
    if (typeof(formSelector) != 'undefined'){
      selector = formSelector + " " + selector;
    }
    $(selector).each(function(index, element){
      var $element = $(element);
      var key = $element.attr("data-stripe");
      var value = $element.val();
      if (key == 'first_name' || key == 'last_name'){
        if (!stripeInfo.hasOwnProperty('name')){
          stripeInfo['name'] = '';
        }
        if (key == 'first_name'){
          stripeInfo['name'] += value;
        }
        if (key == 'last_name'){
          stripeInfo['name'] += ' ' + value;
        }
      }
      else {
        //todo remove this hacky method to fix the dropdowns
        if(key == 'address_state'){
          value = value.replace('string:', '');
        }
        stripeInfo[key] = value;
      }
    });
    return stripeInfo;
  }

  var getExpirationYears = function(){
    var currentYear = new Date().getFullYear(), years = [];
    var endYear = currentYear+16;
    while( currentYear < endYear){
      years.push(currentYear++);
    } 
    return years;
  } 

  var getExpDate = function(cardId){
    for(var i=0; i<viewVars.me.credit_cards.length; i++ ){
      if(viewVars.me.credit_cards[i].row_id == cardId){
        return {expMonth:viewVars.me.credit_cards[i].expiration_month, expYear: viewVars.me.credit_cards[i].expiration_year}
      }
    }
  }

  var formatExpMonth = function(month){
    var formattedMonth = moment(month, 'M');
    return formattedMonth.locale(viewVars.locale).format('MMM');
  }

  var getCardFromId = function(cards, id){
    for(var i=0; i<cards.length; i++){
      if(cards[i].id == id){
        return cards[i];
      }
    }
  }
    
  return {
    creditCardLabel: creditCardLabel,
    getPreferredCard: getPreferredCard,
    stripeAddressMap: stripeAddressMap,
    getStripeFormInfo: getStripeFormInfo,
    getExpirationYears: getExpirationYears,
    expirationMonths: expirationMonths,
    formatExpMonth: formatExpMonth,
    getExpDate: getExpDate,
    getCardFromId: getCardFromId,
  };
}]);

WebModule.factory('ProfileService', ['WMService', '$http', '$rootScope', '$location', function(WMService, $http, $rootScope, $location){

  var customerTitles = [
    {
      label: "No title",
      value: null
    },
    {
      label: "Mr",
      value: "Mr"
    },
    {
      label: "Mrs",
      value: "Mrs"
    },
    {
      label: "Ms",
      value: "Ms"
    },
    {
      label: "Dr",
      value: "Dr"
    }
  ];
  if (viewVars.hasOwnProperty('customerTitles') && viewVars.customerTitles){
    customerTitles = viewVars.customerTitles;
  }
  for (var i = customerTitles.length - 1; i >= 0; i--) {
    if (customerTitles[i].value == null){
      customerTitles[i].select_label = "Select a title";
    } else {
      customerTitles[i].select_label = customerTitles[i].label;
    }
    if (customerTitles[i].hasOwnProperty('translate') === false) {
      customerTitles[i].translate = true;
    }
  };
  var priceGuideSubscriptionPlans = [
      {price: '4.99', frequency: 'week', granularity: 'weekly'},
      {price: '14.99', frequency: 'month', granularity: 'monthly'},
      {price: '149.99', frequency: 'year', granularity: 'yearly'},
  ];

  var serverCustomerMap = {
    // webName: serverName
    'title': 'title',
    'name': 'name',
    'given_name': 'given_name',
    'family_name': 'family_name',
    'company_name': 'company_name',
    'preferred_email': 'preferred_email',
    'phone': 'phone_number',
    'phone_2': 'phone_number_two',
    'fax': 'fax_number',
    'password': 'password',
    'current_password': 'current_password',
    'confirm_password': 'confirm_password',
    'preferred_payment_method': 'preferred_payment_method'
  };
  if(viewVars.brand == 'phillips')
    serverCustomerMap.external_account_number = 'external_account_number';

  var preferredPaymentMethods = function(){
    //rewrote this into a function to remove paypal and creditcard if the order total was over 2500.
    var paymentMethods =  {
      credit_card: "Credit Card",
      wire_transfer: "Wire Transfer",
      cheque: "Check",
      paypal: "PayPal"
    };
    if(viewVars.currentRouteName=="orders-checkout" ){
      if(!isNaN(viewVars.order.response.amount) && viewVars.order.response.amount > 2500){
        delete paymentMethods.credit_card;
        delete paymentMethods.paypal;
      }
    }
    if (viewVars.brand == 'lauro'){
      delete paymentMethods['credit_card'];
    }
    if (viewVars.brand == 'dupuis'){
      delete paymentMethods['money'];
    }
    if(viewVars.brand != 'stacksbowers'){
      delete paymentMethods['paypal'];
    }

    if(viewVars.brand == 'admin' && viewVars.currentRouteName == 'user-registrations'){
      paymentMethods =  {
        cashiers_cheque: 'Check',
        wire_transfer: 'Wire Transfer',
        cash: 'Cash'
      };
    }
    return paymentMethods;
  }
  
  var analytics = [
    {
      'key':'analytics_participating_online',
      'label':'Online (Mobile & Web)'
    },
    {
      'key':'analytics_participating_on_phone',
      'label':'Phone'
    },
    {
      'key':'analytics_participating_in_person',
      'label':'In Person'
    },
    {
      'key':'analytics_is_trade',
      'label':'Are you US Trade?',
      'type':'radio',
      'subtitle': 'Please select yes if you are a U.S. commercial client bidding on behalf of a restaurant, wholesaler, or other business establishment.'
    }
  ];

  var customerLabels = {
    // webName: label
    'title': 'Title',
    'name': 'Full Name',
    'given_name': 'First Name',
    'family_name': 'Last Name',
    'company_name': 'Company Name',
    'preferred_email': 'Email',
    'phone': 'Phone',
    'phone_2': 'Phone 2',
    'fax': 'Fax',
    'password': 'Password',
    'current_password': 'Current Password',
    'confirm_password': 'Confirm Password',
    'preferred_payment_method': 'Preferred Payment Method'
  };
  if(viewVars.brand == 'phillips')
    customerLabels.external_account_number = 'My Account Number';
  var mapServerCustomerToModel = function(serverCustomer, model){
    for (var key in serverCustomerMap){
      if (serverCustomer.hasOwnProperty(serverCustomerMap[key])){
        model[key] = serverCustomer[serverCustomerMap[key]];
      }
      else {
        model[key] = null;
      }
    }
    return model;
  }

  var getUserInfoStates = function(){
    // Create an array of states such as:
    //    {name: {edit: false, value: "Baseer Siddiqui"}}
    // edit is set to true when we want to enter edit mode.
    var userInfoStates = mapServerCustomerToModel(viewVars.me, {});
    for (var fieldName in userInfoStates){
      userInfoStates[fieldName] = {edit:false, value: userInfoStates[fieldName]};
    }
    return userInfoStates;
  };

  var getUserProfileStates = function(){
    
    var userProfileStates = mapServerCustomerToModel(viewVars.me, {});
    for (var fieldName in userProfileStates){
      userProfileStates[fieldName] = {value: userProfileStates[fieldName]};
    }
    userProfileStates.edit = false;
    userProfileStates.edit_profile = false;
    return userProfileStates;
  };

  var getUserCustomFieldsStates = function(){
    var userCustomFieldsStates = viewVars.me.custom_fields;
    for (var fieldName in userCustomFieldsStates){
      userCustomFieldsStates[fieldName] = { value: userCustomFieldsStates[fieldName] };
    }
    userCustomFieldsStates.edit = false;
    return userCustomFieldsStates;
  };

  var editUserInfo = function(fieldName, states){
    var userInfo = mapServerCustomerToModel(viewVars.me, {});
    states[fieldName].edit = true;
    states[fieldName].value = userInfo[fieldName];
    if (fieldName == 'given_name'){
      states['family_name'].edit = true;
      states['family_name'].value = userInfo['family_name'];
    }
    if (fieldName == 'family_name'){
      states['given_name'].edit = true;
      states['given_name'].value = userInfo['given_name'];
    }
  };
  var exitEditUserInfo = function(fieldName, states){
    if(fieldName == "password"){
      states['current_password'].edit  = false;
      states['current_password'].value = "";
      states['confirm_password'].edit  = false;
      states['confirm_password'].value = "";
    }
    states[fieldName].edit = false;
    if (fieldName == 'given_name'){
      states['family_name'].edit = false;
    }
    if (fieldName == 'family_name'){
      states['given_name'].edit = false;
    }
  };

  var saveUserInfo = function(fieldName, states, event){
    var form = $(event.target).parents("form");
    //console.log(form);
    form.validate();
    if (form.valid()){
      var data = {};
      data[serverCustomerMap[fieldName]] = states[fieldName].value;
      if(fieldName == "password"){
        data[serverCustomerMap["current_password"]] = states["current_password"].value;
        data[serverCustomerMap["confirm_password"]] = states["confirm_password"].value;
      }
      if(fieldName == "phone"){
        value = states["phone"].value;
        data[serverCustomerMap["phone"]] = value.replace(/[^\d\+]/g,"");
      }
      if(fieldName == "fax"){
        value = states["fax"].value;
        if(value != null)
          data[serverCustomerMap["fax"]] = value.replace(/[^\d\+]/g,"");
      }
      var alternateFieldName;
      if (fieldName == 'given_name' || fieldName == 'family_name'){
        if (fieldName == 'given_name'){
          alternateFieldName = 'family_name';
        }
        else if (fieldName == 'family_name'){
          alternateFieldName = 'given_name';
        }
        data[serverCustomerMap[alternateFieldName]] = states[alternateFieldName].value;
      }
      var promise = $http.post(viewVars.endpoints.saveProfile, data);
      promise.success(function(newData){
        if (newData.hasOwnProperty('me')){
          $rootScope.viewVars.me = newData.me;
          WMService.afterMe($rootScope.viewVars.me);
          //$rootScope.$apply();
        }
        exitEditUserInfo(fieldName, states);
      });
      promise.error(WMService.handleError);
    }
  };

  var editProfile = function(states){
    var userInfo = mapServerCustomerToModel(viewVars.me, {});

    states.edit = true;
    for (var fieldName in states){
      states[fieldName].value = userInfo[fieldName];
    }
  };

  var saveProfile = function(model, event){
    var form = $(event.target).parents("form");
    form.validate();
    if (form.valid()){
      var submitData = {};
      for(fieldName in model){
        //we dont need these so remove them.        
        if(fieldName == "external_account_number" || fieldName == "name")
          continue;
        var alternateFieldName;
        if (fieldName == 'given_name' || fieldName == 'family_name'){
          if (fieldName == 'given_name'){
            alternateFieldName = 'family_name';
          }else if (fieldName == 'family_name'){
            alternateFieldName = 'given_name';
          }
          submitData[alternateFieldName] = model[alternateFieldName].value;
        }else if(fieldName == 'preferred_email'){
          submitData['email_address'] = model[fieldName].value
        }else{

          submitData[fieldName] = model[fieldName].value;
        }
      }
      var promise = $http.post(viewVars.endpoints.saveProfile, submitData);
      promise.success(function(data){
        if (data.hasOwnProperty('me')){
          $rootScope.viewVars.me = WMService.afterMe(data.me);
        }
        model.edit = false;
        exitEditPassword(model);
        if (typeof callback != "undefined"){
            callback();
        }
      });
      promise.error(WMService.handleError);
    }
  }

  var editCustomFields = function (model) {
    for (var fieldName in model){
      model[fieldName].editValue = model[fieldName].value;
    }
    model.edit = true;
  }

  var exitEditPassword = function(model){
    if($rootScope.ajaxErrorMessageClasses == 'password-error'){
      $rootScope.dismissAjaxError();
    }
    model.edit_password = false;
    model.password = '';
    model.confirm_password = '';
    model.current_password = '';
  }

  var payInvoice = function(orderId, cardId, paymentMethod, addressStates, userProfileStates){
    if(typeof paymentMethod == 'undefined'){
      paymentMethod = "stripe";
    }
    var form = $("form");
    form.validate();
    if (!form.valid()) {
      return false;
    }

    var addressData = addressStates.values;

    var profileData = {
        title: userProfileStates.title.value,
        given_name: userProfileStates.given_name.value,
        family_name: userProfileStates.family_name.value,
        phone_number: userProfileStates.phone.value,
        company_name: userProfileStates.company_name.value,
        fax_number: userProfileStates.fax.value,
    };

    // if source is available in viewVars then set that, otherwise set source as 'web'
    var source = viewVars.paypalWebViewData && viewVars.paypalWebViewData.source ? viewVars.paypalWebViewData.source : 'web';
    // Apending source query parameter to the URL.
    var url = viewVars.endpoints.invoice+orderId+"/pay?source=" + source;
    
    // if am_token is available in viewVars then set that, otherwise set source as null.
    var am_token = viewVars.paypalWebViewData && viewVars.paypalWebViewData.am_token ? viewVars.paypalWebViewData.am_token : null;
    // Apending am_token query parameter to the URL.
    url += am_token ? '&am_token='+am_token : '';
    
    var promise = $http.post(url, {card_id:cardId, amount: viewVars.order.response.amount, currency_code: viewVars.order.response.currency_code, payment_method: paymentMethod, description: viewVars.order.response.auction.title, address:addressData, profile:profileData});
    promise.success(function(data){
      console.log(data);
      if(data.response.status == 'success'){
        var redirect = "/orders/"+orderId+"/confirm";
        window.location.href = redirect;
      }
      if(data.response.status == 'paypal'){
        //console.log(data.response);
        for(i in data.response.links){
          if(data.response.links[i].rel == 'approve'){
            //console.log(data.response.links[i].href);
            window.location.href = data.response.links[i].href;
          }
        }
      }
    });
    promise.error(WMService.handleError);

  }

  var isOverOrderThreshold = function(order){
    if(parseFloat(order.amount) > parseFloat(viewVars.orderThreshold))
      return true;
    return false;
  }


  return {
    serverCustomerMap: serverCustomerMap,
    customerLabels: customerLabels,
    customerTitles: customerTitles,
    priceGuideSubscriptionPlans: priceGuideSubscriptionPlans,
    analytics: analytics,
    preferredPaymentMethods: preferredPaymentMethods,
    mapServerCustomerToModel: mapServerCustomerToModel,
    getUserInfoStates: getUserInfoStates,
    getUserProfileStates: getUserProfileStates,
    getUserCustomFieldsStates: getUserCustomFieldsStates,
    editUserInfo: editUserInfo,
    exitEditUserInfo: exitEditUserInfo,
    saveUserInfo: saveUserInfo,
    editProfile: editProfile,
    saveProfile: saveProfile,
    editCustomFields: editCustomFields,
    exitEditPassword: exitEditPassword,
    payInvoice: payInvoice,
    isOverOrderThreshold: isOverOrderThreshold
  };
}]);

WebModule.factory('AddressService', ['CreditCardService', 'WMService', '$rootScope', '$http', function(CreditCardService, WMService, $rootScope, $http){
  var toFriendlyString = function(address, format){
    if (!address){
      return null;
    }
    if(typeof format == 'undefined'){
      format = 'prefer-address';
    }

    var prettyAddress = (address.address_line_one?(address.address_line_one + ', '):'') + (address.address_line_two?(address.address_line_two + ', '):'') + (address.city?(address.city + ' '):'') + (address.country?address.country:'');    
    if(format == 'address-only'){
      return prettyAddress;
    }else if(format == 'prefer-address'){
      if(prettyAddress == '' || prettyAddress == null){
        prettyAddress = (address.gps_coordinates.latitude ? (address.gps_coordinates.latitude+', ') : '') + (address.gps_coordinates.longitude ? (address.gps_coordinates.longitude) : '');
      }
    }else if(format =='gps-only'){
      prettyAddress = (address.gps_coordinates.latitude ? (address.gps_coordinates.latitude+', ') : '') + (address.gps_coordinates.longitude ? (address.gps_coordinates.longitude) : '');
    }else if(format == 'prefer-gps'){
      if(address.gps_coordinates != '' && address.gps_coordinates != null){
        prettyAddress = (address.gps_coordinates.latitude ? (address.gps_coordinates.latitude+', ') : '') + (address.gps_coordinates.longitude ? (address.gps_coordinates.longitude) : '');
      }
    }
    
    if(prettyAddress == ''){
      return null;
    }
    return prettyAddress;
  }
  var getCurrentAddress = function(type, admin){
    if(typeof admin =="undefined"){
      adming = false;
    }
    var addressId = null;
    var userVar = $rootScope.viewVars.me;
    if(admin === true){
      userVar = $rootScope.viewVars.user;
    }
    if (type == 'shipping'){
      if (userVar.hasOwnProperty('shipping_address_id') && userVar.shipping_address_id){
        addressId = userVar.shipping_address_id;
      }
    }
    else if (type == 'billing'){
      if (userVar.hasOwnProperty('billing_address_id') && userVar.billing_address_id){
        addressId = userVar.billing_address_id;
      }
    }

    if (addressId && userVar.addresses){
      for (var i=0;i<userVar.addresses.length;i++){
        if (addressId == userVar.addresses[i].row_id){
          return userVar.addresses[i];
        }
      }
    }

    return null;
  }

  var prepopulateBillingAddress = function(card, model){
    if (card.row_id){
      for (var key in CreditCardService.stripeAddressMap){
        model[CreditCardService.stripeAddressMap[key]] = card[key];
      }
    }
    return model;
  };

  var serverAddressMap = {
    // webName: serverName
    //'name': 'addressee',
    //'company_name': 'company_name',
    //'phone': 'phone',
    'address': 'street_address',
    'address_2': 'extended_address',
    'state': 'region',
    'city': 'locality',
    'zip_code': 'postal_code',
    'country': 'country_code',
    'phone': 'phone',
  };

  var countries = {
    //'': 'Select a country',
    AF: "Afghanistan",
    AX: "Åland Islands",
    AL: "Albania",
    DZ: "Algeria",
    AS: "American Samoa",
    AD: "Andorra",
    AO: "Angola",
    AI: "Anguilla",
    AQ: "Antarctica",
    AG: "Antigua and Barbuda",
    AR: "Argentina",
    AM: "Armenia",
    AW: "Aruba",
    AU: "Australia",
    AT: "Austria",
    AZ: "Azerbaijan",
    BS: "Bahamas",
    BH: "Bahrain",
    BD: "Bangladesh",
    BB: "Barbados",
    BY: "Belarus",
    BE: "Belgium",
    BZ: "Belize",
    BJ: "Benin",
    BM: "Bermuda",
    BT: "Bhutan",
    BO: "Bolivia, Plurinational State of",
    BQ: "Bonaire, Sint Eustatius and Saba",
    BA: "Bosnia and Herzegovina",
    BW: "Botswana",
    BV: "Bouvet Island",
    BR: "Brazil",
    IO: "British Indian Ocean Territory",
    BN: "Brunei Darussalam",
    BG: "Bulgaria",
    BF: "Burkina Faso",
    BI: "Burundi",
    KH: "Cambodia",
    CM: "Cameroon",
    CA: "Canada",
    CV: "Cape Verde",
    KY: "Cayman Islands",
    CF: "Central African Republic",
    TD: "Chad",
    CL: "Chile",
    CN: "China",
    CX: "Christmas Island",
    CC: "Cocos (Keeling) Islands",
    CO: "Colombia",
    KM: "Comoros",
    CG: "Congo",
    CD: "Congo, the Democratic Republic of the",
    CK: "Cook Islands",
    CR: "Costa Rica",
    CI: "Côte d'Ivoire",
    HR: "Croatia",
    CU: "Cuba",
    CW: "Curaçao",
    CY: "Cyprus",
    CZ: "Czech Republic",
    DK: "Denmark",
    DJ: "Djibouti",
    DM: "Dominica",
    DO: "Dominican Republic",
    EC: "Ecuador",
    EG: "Egypt",
    SV: "El Salvador",
    GQ: "Equatorial Guinea",
    ER: "Eritrea",
    EE: "Estonia",
    ET: "Ethiopia",
    FK: "Falkland Islands (Malvinas)",
    FO: "Faroe Islands",
    FJ: "Fiji",
    FI: "Finland",
    FR: "France",
    GF: "French Guiana",
    PF: "French Polynesia",
    TF: "French Southern Territories",
    GA: "Gabon",
    GM: "Gambia",
    GE: "Georgia",
    DE: "Germany",
    GH: "Ghana",
    GI: "Gibraltar",
    GR: "Greece",
    GL: "Greenland",
    GD: "Grenada",
    GP: "Guadeloupe",
    GU: "Guam",
    GT: "Guatemala",
    GG: "Guernsey",
    GN: "Guinea",
    GW: "Guinea-Bissau",
    GY: "Guyana",
    HT: "Haiti",
    VA: "Holy See (Vatican City State)",
    HN: "Honduras",
    HK: "Hong Kong",
    HU: "Hungary",
    IS: "Iceland",
    IN: "India",
    ID: "Indonesia",
    IR: "Iran, Islamic Republic of",
    IQ: "Iraq",
    IE: "Ireland",
    IM: "Isle of Man",
    IL: "Israel",
    IT: "Italy",
    JM: "Jamaica",
    JP: "Japan",
    JE: "Jersey",
    JO: "Jordan",
    KZ: "Kazakhstan",
    KE: "Kenya",
    KI: "Kiribati",
    KP: "Korea, Democratic People's Republic of",
    KR: "Korea, Republic of",
    KW: "Kuwait",
    KG: "Kyrgyzstan",
    LA: "Lao People's Democratic Republic",
    LV: "Latvia",
    LB: "Lebanon",
    LS: "Lesotho",
    LR: "Liberia",
    LY: "Libya",
    LI: "Liechtenstein",
    LT: "Lithuania",
    LU: "Luxembourg",
    MO: "Macao",
    MK: "Macedonia, the Former Yugoslav Republic of",
    MG: "Madagascar",
    MW: "Malawi",
    MY: "Malaysia",
    MV: "Maldives",
    ML: "Mali",
    MT: "Malta",
    MH: "Marshall Islands",
    MQ: "Martinique",
    MR: "Mauritania",
    MU: "Mauritius",
    YT: "Mayotte",
    MX: "Mexico",
    FM: "Micronesia, Federated States of",
    MD: "Moldova, Republic of",
    MC: "Monaco",
    MN: "Mongolia",
    ME: "Montenegro",
    MS: "Montserrat",
    MA: "Morocco",
    MZ: "Mozambique",
    MM: "Myanmar",
    NA: "Namibia",
    NR: "Nauru",
    NP: "Nepal",
    NL: "Netherlands",
    NC: "New Caledonia",
    NZ: "New Zealand",
    NI: "Nicaragua",
    NE: "Niger",
    NG: "Nigeria",
    NU: "Niue",
    NF: "Norfolk Island",
    MP: "Northern Mariana Islands",
    NO: "Norway",
    OM: "Oman",
    PK: "Pakistan",
    PW: "Palau",
    PS: "Palestine, State of",
    PA: "Panama",
    PG: "Papua New Guinea",
    PY: "Paraguay",
    PE: "Peru",
    PH: "Philippines",
    PN: "Pitcairn",
    PL: "Poland",
    PT: "Portugal",
    PR: "Puerto Rico",
    QA: "Qatar",
    RE: "Réunion",
    RO: "Romania",
    RU: "Russian Federation",
    RW: "Rwanda",
    BL: "Saint Barthélemy",
    SH: "Saint Helena, Ascension and Tristan da Cunha",
    KN: "Saint Kitts and Nevis",
    LC: "Saint Lucia",
    MF: "Saint Martin (French part)",
    PM: "Saint Pierre and Miquelon",
    VC: "Saint Vincent and the Grenadines",
    WS: "Samoa",
    SM: "San Marino",
    ST: "Sao Tome and Principe",
    SA: "Saudi Arabia",
    SN: "Senegal",
    RS: "Serbia",
    SC: "Seychelles",
    SL: "Sierra Leone",
    SG: "Singapore",
    SX: "Sint Maarten (Dutch part)",
    SK: "Slovakia",
    SI: "Slovenia",
    SB: "Solomon Islands",
    SO: "Somalia",
    ZA: "South Africa",
    GS: "South Georgia and the South Sandwich Islands",
    SS: "South Sudan",
    ES: "Spain",
    LK: "Sri Lanka",
    SD: "Sudan",
    SR: "Suriname",
    SJ: "Svalbard and Jan Mayen",
    SZ: "Swaziland",
    SE: "Sweden",
    CH: "Switzerland",
    SY: "Syrian Arab Republic",
    TW: "Taiwan",
    TJ: "Tajikistan",
    TZ: "Tanzania, United Republic of",
    TH: "Thailand",
    TL: "Timor-Leste",
    TG: "Togo",
    TK: "Tokelau",
    TO: "Tonga",
    TT: "Trinidad and Tobago",
    TN: "Tunisia",
    TR: "Turkey",
    TM: "Turkmenistan",
    TC: "Turks and Caicos Islands",
    TV: "Tuvalu",
    UG: "Uganda",
    UA: "Ukraine",
    AE: "United Arab Emirates",
    GB: "United Kingdom",
    US: "United States",
    UM: "United States Minor Outlying Islands",
    UY: "Uruguay",
    UZ: "Uzbekistan",
    VU: "Vanuatu",
    VE: "Venezuela, Bolivarian Republic of",
    VN: "Viet Nam",
    VG: "Virgin Islands, British",
    VI: "Virgin Islands, U.S.",
    WF: "Wallis and Futuna",
    EH: "Western Sahara",
    YE: "Yemen",
    ZM: "Zambia",
    ZW: "Zimbabwe"
  };

  var countriesSorted = [];
  for (var countryCode in countries){
    countriesSorted.push({id: countryCode, name: countries[countryCode]});
  }

  countriesSorted.sort(function (a, b) {
    return (a.name > b.name ? 1 : -1);
  });

  if(['new-property', 'edit-property', 'new-lot', 'edit-lot'].indexOf(viewVars.currentRouteName) != -1){
    countriesSorted.unshift({id: 0, name: "Select Country"});
  }

  var states = {
      //''  : 'Select a state',
    'AL':"Alabama",
    'AK':"Alaska",  
    'AZ':"Arizona",  
    'AR':"Arkansas",  
    'CA':"California",  
    'CO':"Colorado",  
    'CT':"Connecticut",  
    'DE':"Delaware",  
    'DC':"District Of Columbia",  
    'FL':"Florida",  
    'GA':"Georgia",  
    'HI':"Hawaii",  
    'ID':"Idaho",  
    'IL':"Illinois",  
    'IN':"Indiana",  
    'IA':"Iowa",  
    'KS':"Kansas",  
    'KY':"Kentucky",  
    'LA':"Louisiana",  
    'ME':"Maine",  
    'MD':"Maryland",  
    'MA':"Massachusetts",  
    'MI':"Michigan",  
    'AA':"Military Mail – AA",
    'AE':"Military Mail – AE",
    'AP':"Military Mail – AP",
    'MN':"Minnesota",  
    'MS':"Mississippi",  
    'MO':"Missouri",  
    'MT':"Montana",
    'NE':"Nebraska",
    'NV':"Nevada",
    'NH':"New Hampshire",
    'NJ':"New Jersey",
    'NM':"New Mexico",
    'NY':"New York",
    'NC':"North Carolina",
    'ND':"North Dakota",
    'OH':"Ohio",  
    'OK':"Oklahoma",  
    'OR':"Oregon",  
    'PA':"Pennsylvania",  
    'RI':"Rhode Island",  
    'SC':"South Carolina",  
    'SD':"South Dakota",
    'TN':"Tennessee",  
    'TX':"Texas",  
    'UT':"Utah",  
    'VT':"Vermont",  
    'VA':"Virginia",  
    'WA':"Washington",  
    'WV':"West Virginia",  
    'WI':"Wisconsin",  
    'WY':"Wyoming"
  };
  var shippingStates = {};
  $.extend(shippingStates, states);

  /*if (viewVars.hasOwnProperty('restrictedUSShippingStates')){
    for (var i=0;i<viewVars.restrictedUSShippingStates.length;i++){
      if (shippingStates.hasOwnProperty(viewVars.restrictedUSShippingStates[i])){
        delete shippingStates[viewVars.restrictedUSShippingStates[i]];
      }
    }
  }*/

  var provinces = {
    //''   : 'Select a province',
    "AB" : "Alberta",
    "BC" : "British Columbia",
    "MB" : "Manitoba",
    "NB" : "New Brunswick",
    "NL" : "Newfoundland and Labrador",
    "NT" : "Northwest Territories",
    "NS" : "Nova Scotia",
    "NU" : "Nunavut",
    "ON" : "Ontario",
    "PE" : "Prince Edward Island",
    "QC" : "Quebec",
    "SK" : "Saskatchewan",
    "YT" : "Yukon",
  };

  var getStates = function(addressModel, addressType){
    if (addressModel.hasOwnProperty('country') && addressModel.country == 'CA'){

      if(viewVars.module=='backend'){
        provinces = $.extend({"":"Choose a province"}, provinces);
      }
      return provinces;
    }
    if (typeof(addressType) != 'undefined' && addressType == 'shipping' && addressModel.country == 'US'){
      if(viewVars.module=='backend'){
        shippingStates = $.extend({"":"Choose a state"}, shippingStates);
        return shippingStates;
      }
      else {
        if (viewVars.hasOwnProperty('restrictedUSShippingStates')){
          var filteredShippingStates = {};
          for (var key in shippingStates){
            if (viewVars.restrictedUSShippingStates.indexOf(key) == -1){
              filteredShippingStates[key] = shippingStates[key];
            }
          }
          return filteredShippingStates;
        }
        return shippingStates;
      }
    }
    else {

      if(viewVars.module=='backend'){
        states = $.extend({"":"Choose a state"}, states);
      }
      return states; 
    }
  };

  var mapServerAddressToModel = function(serverAddress, model){
    for (key in serverAddressMap){
      if (serverAddressMap.hasOwnProperty(key) && serverAddress.hasOwnProperty(serverAddressMap[key])){
        model[key] = serverAddress[serverAddressMap[key]];
      }
    }
    model = setAddressDefaults(model);
    return model;
  };

  var mapStripeAddressToModel = function(card, model){
    for (var key in CreditCardService.stripeAddressMap){
      if (card.hasOwnProperty(key)){
        model[CreditCardService.stripeAddressMap[key]] = card[key];
      }
      else {
        model[CreditCardService.stripeAddressMap[key]] = null;
      }
    }
    return model;
  }

  // Default all values to '' so we don't get any undefined angular models - this is particularly important so that angular doesn't put an extra empty select option element.
  // For country, default to 'US'.
  var setAddressDefaults = function(model){
    for (key in serverAddressMap){
      if (!model.hasOwnProperty(key)){
        if (key == 'country'){
          model[key] = viewVars.userCountry;
        }
        else {
          model[key] = '';
        }
      }
    }
    return model;
  }

  var prepareAddressForServer = function(model){
    var newModel = {};
    for (key in serverAddressMap){
      if(model.hasOwnProperty(key)){
        newModel[serverAddressMap[key]] = model[key];
      }
    }
    return newModel;
  }

  var editAddress = function(type, model){
    var currAddress = getCurrentAddress(type);
    if (currAddress){
      model.values = mapServerAddressToModel(currAddress, model.values);
    }
    else {
      model.values = setAddressDefaults(model.values);
    }
    model.edit = true;
    return model;
  };

  var saveAddress = function(type, model, event, callback){
    var form = $(event.target).parents("form");
    form.validate();
    if (form.valid()){
      var url = viewVars.endpoints.saveAddress + type;
      var promise = $http.post(url, model.values);
      promise.success(function(data){
        if (data.hasOwnProperty('me')){
          $rootScope.viewVars.me = WMService.afterMe(data.me);
        }
        model.edit = false;
        if (typeof callback != "undefined"){
            callback();
        }
      });
      promise.error(WMService.handleError);
    }
  }

  var addressLabel = function(type){
    if (type == 'shipping'){
      if (viewVars.brand == 'alexcooper'){
        return 'Primary';
      }
      return 'Shipping';
    }
    else if (type == 'billing'){
      return 'Account Billing';
    }
    return type;
  }


  return {
    serverAddressMap: serverAddressMap,
    addressLabel: addressLabel,
    toFriendlyString: toFriendlyString,
    getCurrentAddress: getCurrentAddress,
    mapServerAddressToModel: mapServerAddressToModel,
    mapStripeAddressToModel: mapStripeAddressToModel,
    setAddressDefaults: setAddressDefaults,
    prepareAddressForServer: prepareAddressForServer,
    editAddress: editAddress,
    saveAddress: saveAddress,
    prepopulateBillingAddress: prepopulateBillingAddress,
    countries: countries,
    countriesSorted: countriesSorted,
    states: states,
    getStates: getStates,
    provinces: provinces,
  };
}]);

WebModule.factory('EmailService', ['WMService', '$rootScope', '$http', function(WMService, $rootScope, $http){
  return {
    contact: function(data,successHandler){
      var promise = $http.post(viewVars.endpoints.ajaxContact, data);
      promise.success(successHandler);
      promise.error(WMService.handleError);
    }
  }
}]);

// See https://github.com/auctionmobility/auction-web-live-module/wiki/How-we-can-refactor-bid-states
// for more details on the purpose of this service as well as documentation.
WebModule.service('LotViewState', ['LotService', 'WMService' ,function(LotService, WMService){
  /* This is for future compatibility where we may require alternating states
  depending on whether a lot is currently in a timed auction or a live auction
  when a lot is part of a 'timed_then_live' auction.
  
  So for example, when a lot is behaving like a timed auction lot, then
  this.isTimedAuctionLot(lot) should return true. And when a lot is
  behaving like a live auction lot, then this.isLiveAuctionLot(lot) should
  return true.
  
  Currently, all it does is check the auction type. The full solution would be
  to actually look at timed auction end time and live auction start times. */
  this.isLiveAuctionLot = function(lot){
    if (typeof lot === 'undefined' || lot.hasOwnProperty('auction') === false ) {
      return false;
    }
    return lot.auction && (lot.auction.auction_type == 'live' ||
      (lot.auction.auction_type == 'timed_then_live' && lot.status !== 'active' )
    );
  }
  /**
   * the purpose of this function is to tell us if the lot is in a timed auction style state
   * @param  {Object}  lot - the lot object
   * @return {Boolean}     true if the lot is in a timed auction state, false otherwise
   */
  this.isTimedAuctionLot = function(lot){
    if (typeof lot === 'undefined' || lot.hasOwnProperty('auction') === false ) {
      return false;
    }
    return lot.auction && (lot.auction.auction_type == 'timed' ||
      (lot.auction.auction_type == 'timed_then_live' && lot.status === 'active')
    );
  }
  this.isCatalogOnlyAuctionLot = function(lot){
    return lot.auction && lot.auction.auction_type == 'catalog_only';
  }
  this.isTraditionalLot = function(lot){
    return lot.hasOwnProperty('listing') && lot.listing && lot.listing.listing_type == 'normal';
  }
  /* States that apply to all types of auctions, such as live, timed, etc. */
  this.isLost = function(lot){
    return LotService.isLost(lot);
  }
  this.isWon = function(lot){
    return LotService.isWin(lot);
  }
  this.isPresold = function(lot){
    return lot.status == 'pre_sold' && !LotService.isWin(lot) && !LotService.isLost(lot);
  }
  this.isPostsold = function(lot){
    return lot.status == 'post_sold' && !LotService.isWin(lot) && !LotService.isLost(lot);
  }
  this.isSold = function(lot){
    return lot.status == 'sold' && !LotService.isWin(lot) && !LotService.isLost(lot);
  }
  /* Live auction only states */
  this.isLive = function(lot){
    return this.isLiveAuctionLot(lot) && LotService.isNow(lot);
  }
  this.isLiveWithMyBid = function(lot){
    return this.isLiveAuctionLot(lot) && LotService.isNow(lot) && LotService.hasBid(lot);
  }
  this.isPassed = function(lot){
    return this.isLiveAuctionLot(lot) && (lot.status == 'expired' || lot.status == 'reserve_not_met');
  }
  this.isWithdrawn = function(lot){
    return this.isLiveAuctionLot(lot) && lot.status == 'withdrawn';
  }
  /**
   * the purpose of this function is to tell us if we should show the static states.
   * @param  {Object} lot the lot
   * @return {Boolean}     if we should show the static states
   */
  this.showStaticStates = function (lot) {
    var showStaticStates = (this.isActiveLiveWithMyBid(lot) || this.isLiveWithMyBid(lot)) ||
                            this.isWinning(lot) ||
                            this.isWon(lot) ||
                            this.isOutbid(lot) ||
                            (this.isSold(lot) || this.isLost(lot)) ||
                            this.isPassed(lot) ||
                            this.isEnded(lot) ||
                            this.isLive(lot);
    return showStaticStates;
  }
  // Just a helper function for isActiveLiveWithMyBid and isActiveLiveWithoutMyBid to reduce duplication. Not meant to be used in a template since it would cause confusion due to too many state functions.
  // Return whether or not a live lot is active, where active means the status is 'active' and bidder_registration_allowed is false.
  this._isActiveLive = function(lot){
    if (viewVars.brand == 'alexcooper') {
      return this.isLiveAuctionLot(lot)
          && (lot.status == 'active' || lot.status == 'bidding_open' || lot.status == 'lot_open')
          && this.bidderRegistrationAllowed(lot);
    } else {
      return this.isLiveAuctionLot(lot) && lot.status == 'active' && this.bidderRegistrationAllowed(lot);
    }
  }
  this.isActiveLiveWithMyBid = function(lot){
    return this._isActiveLive(lot) && LotService.hasBid(lot);
  }
  this.isActiveLiveWithoutMyBid = function(lot){
    return this._isActiveLive(lot) && !LotService.hasBid(lot);
  }
  /* Timed auction only states */
  this.isPresale = function(lot){
    return  this.isTimedAuctionLot(lot) && lot.status == 'active' && !WMService.auctionStartDatePassed(lot.auction);
  }
  this.isOutbid = function(lot){
    return  this.isTimedAuctionLot(lot) && lot.status == 'active' &&
            LotService.hasBid(lot) && !LotService.hasTopTimedBid(lot);
  }
  this.isWinning = function(lot){
    return  this.isTimedAuctionLot(lot) && lot.status == 'active' &&
            LotService.hasTopTimedBid(lot);
  }
  this.isEnded = function(lot){
    return  this.isTimedAuctionLot(lot) && (lot.status == 'expired' || lot.status == 'reserve_not_met');
  }
  this.isEndedOutbid = function(lot){
    return  this.isTimedAuctionLot(lot) && (lot.status == 'expired' || lot.status == 'reserve_not_met') &&
            LotService.hasBid(lot) && !LotService.hasTopTimedBid(lot);
  }
  // Just a helper function for isActiveTimedWithBid and isActiveTimedWithoutBid to reduce duplication. Not meant to be used in a template since it would cause confusion due to too many state functions.
  // Return whether or not a timed lot is active, where active means the status is 'active', the start time has passed and bidder_registration_allowed is false.
  this._isActiveTimed = function(lot){
    return this.isTimedAuctionLot(lot) && lot.status == 'active' && WMService.auctionStartDatePassed(lot.auction) && this.bidderRegistrationAllowed(lot);
  }
  // Note that both isActiveTimedWithBid and isActiveTimedWithoutBid expect you
  // not to have your own bid. 'WithBid' and 'WithoutBid' simply represent
  // someone else placing bids.
  // The states to be used when you have placed your own bid would be isWinning
  // and isOutbid.
  this.isActiveTimedWithBid = function(lot){
    return  this._isActiveTimed(lot) && !LotService.hasBid(lot) && lot.timed_auction_bid;
  }
  this.isActiveTimedWithoutBid = function(lot){
    return  this._isActiveTimed(lot) && !LotService.hasBid(lot) && (!lot.hasOwnProperty('timed_auction_bid') || !lot.timed_auction_bid);
  }
  /* Catalog only auction states */
  this.isActiveCatalogOnly = function(lot){
    return this.isCatalogOnlyAuctionLot(lot) && lot.status == 'active';
  }
  /* Traditional lot states */
  this.isActiveTraditionalLot = function(lot){
    return this.isTraditionalLot(lot) && lot.status == 'active';
  }
  /* End of traditional lot states */

  this.isTimerRunning = function(lot){
    return  this.isTimedAuctionLot(lot) && lot.status == 'active';
  }
  this.clickPlaceBidButton = function(lot){
    return LotService.placeBidButton(lot);
  }
  this.defaultBidMode = function(lot){
    if (this.isAbsenteeBiddable(lot) && viewVars.features.bidInputOpened && !LotService.hasBid(lot) && WMService.isApprovedAuctionRegistration(lot.auction)){
      return 'edit';
    }
    else {
      return 'view';
    }
  }
  this.isBidInputFocused = function(lot){
    // If the user manually clicked on edit bid, focus on the bid input regardless of the default bid mode.
    if (lot.hasOwnProperty('_editModeTriggered') && lot._editModeTriggered){
      lot._editModeTriggered = false;
      return true;
    }
    return this.defaultBidMode(lot) != 'edit';
  }
  this.isViewBidMode = function(lot){
    if (lot.hasOwnProperty('_bidMode') && lot._bidMode){
      return lot._bidMode == 'view';
    }
    return this.defaultBidMode(lot) == 'view';
    //return !this.isEditBidMode(lot) && !this.isConfirmDeleteBidMode(lot);
  }
  this.isEditBidMode = function(lot){
    if (lot.hasOwnProperty('_bidMode') && lot._bidMode){
      return lot._bidMode == 'edit';
    }
    return this.defaultBidMode(lot) == 'edit';
    //return LotService.isAbsenteeBidEditMode(lot) && !this.isConfirmDeleteBidMode(lot);
  }
  this.enterConfirmDeleteBidMode = function(lot){
    lot._previousBidMode = this.defaultBidMode(lot);
    if (lot.hasOwnProperty('_bidMode')){
      lot._previousBidMode = lot._bidMode;
    }
    return lot._bidMode = 'confirm-delete';
  }
  this.exitConfirmDeleteBidMode = function(lot){
    return lot._bidMode = lot._previousBidMode;
  }
  this.isConfirmDeleteBidMode = function(lot){
    if (lot.hasOwnProperty('_bidMode')){
      return lot._bidMode == 'confirm-delete';
    }
    return LotService.isAbsenteeBidConfirmDeleteMode(lot);
  }
  this.enterEditBidMode = function(lot){
    return LotService.enterAbsenteeBidEditMode(lot);
  }
  this.exitEditBidMode = function(lot){
    return LotService.exitAbsenteeBidEditMode(lot);
  }
  this.bidderRegistrationAllowed = function(lot){
    var bidderRegistrationDisallowed = lot.hasOwnProperty('auction') && lot.auction && lot.auction.hasOwnProperty('bidder_registration_allowed') && !lot.auction.bidder_registration_allowed;
    return !bidderRegistrationDisallowed;
  }
  this.isRegisteredToBid = function(lot){
    return LotService.registeredToBid(lot);
  }
  this.isBidEditableInCurrentPage = function(lot){
    return !(viewVars.currentRouteName == 'live-auction' && viewVars.features.noLiveAuctionAbsenteeBidding);
  }
  this.isAbsenteeBiddable = function(lot){
    return LotService.isAbsenteeBiddable(lot);
  }
}]);

WebModule.service('LiveLotViewState', ['LotService',function(LotService){

  this.isWinning = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isHighestBidder(liveLot.state) && !LotService.isPaused(currentLotDetail, liveLot.state) && !LotService.isClosed(currentLotDetail, liveLot.state);
  }

  this.isPaused = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isPaused(currentLotDetail, liveLot.state) && !LotService.isStarting(currentLotDetail, liveLot.state);
  }

  this.isPreparing = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isStarting(currentLotDetail, liveLot.state) && currentLotDetail.query_offset !== 0;
  }

  this.isAuctionStarting = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isStarting(currentLotDetail, liveLot.state) && currentLotDetail.query_offset === 0;
  }

  this.isClosed = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isClosed(currentLotDetail, liveLot.state) && !LotService.isHighestBidder(liveLot.state) && !LotService.isSold(currentLotDetail) && !LotService.isNow(currentLotDetail, liveLot.state) && !this.isPassed(liveLot, currentLotDetail, connected);
    //return connected && LotService.isClosed(currentLotDetail, liveLot.state) && !LotService.isHighestBidder(liveLot.state) && !LotService.isSold(currentLotDetail) && !LotService.isNow(currentLotDetail, liveLot.state) && !LotService.isPassed(liveLot.item); //&& currentLotDetail.status != 'reserve_not_met' && liveLot.state.ending_price == 0;
  }

  this.isSold = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isSold(currentLotDetail) && !LotService.isWin(currentLotDetail, liveLot.state) && !LotService.isLost(currentLotDetail) && !LotService.isNow(currentLotDetail, liveLot.state);
  }

  this.isPassed = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isClosed(currentLotDetail, liveLot.state) && !LotService.isHighestBidder(liveLot.state) && LotService.isPassed(liveLot.item); 
  }
  
  this.isWon = function(liveLot, currentLotDetail, connected){
    return connected && LotService.isWin(currentLotDetail, liveLot.state);
  }
  
  this.isPendingBid = function(liveLot, currentLotDetail, connected, bidSentShowStatus){
    return connected && !LotService.isPaused(currentLotDetail, liveLot.state) && !LotService.isClosed(currentLotDetail, liveLot.state) && (LotService.myLivePendingBid(liveLot) || bidSentShowStatus);
  }

  this.showIncrement = function(liveLot, currentLotDetail, connected){
    return connected && liveLot.state.increment && (LotService.isNow(currentLotDetail, liveLot.state) || LotService.isPaused(currentLotDetail, liveLot.state));
  }

  this.showHighestBid = function(liveLot, currentLotDetail, connected){
    return !LotService.isStarting(currentLotDetail, liveLot.state) && !this.isWon(liveLot, currentLotDetail, connected) && !this.isSold(liveLot, currentLotDetail, connected) && !this.isPassed(liveLot, currentLotDetail, connected) && connected;
  }

  this.showHighestBidMobile = function(liveLot, currentLotDetail, connected) {
    return connected;
  }

  this.isNow = function(liveLot, currentLotDetail, connected){
    return LotService.isNow(currentLotDetail, liveLot.state) && connected;
  }

}]);

WebModule.service('Authorizations', ['WMService', '$http',function(WMService, $http){


  this.save = function(authorization, userId, auctionId, successHandlerFn){
    if(typeof successHandlerFn=='undefined'){
      successHandlerFn = function(data){
        authorization = data;
        return authorization;
      }
    }

    var url = WMService.generateUrl('ajaxSaveAuthorization', {'userId':userId, 'auctionId':auctionId});

    var promise = $http.post(url, authorization);

    promise.success(function(data){
      successHandlerFn(data);
    });
    promise.error(function(data){
      WMService.handleError(data);
      throw new Error('Error: ' + data);
    });
  }

  this.void = function(authorization, successHandlerFn){
    if(typeof successHandlerFn=='undefined'){
      successHandlerFn = function(data){
        authorization = data;
        return authorization;
      }
    }
    ///v1/admin/customer/:customerId/auction/:auctionId/transaction/:transactionId
    var url = WMService.generateUrl('ajaxVoidAuthorization', {'userId':authorization.customer_id, 'auctionId':authorization.auction_id, 'authorizationId':authorization.row_id});
    var promise = $http.post(url);
    promise.success(function(data){
      successHandlerFn(data);
    });
    promise.error(function(data){
      WMService.handleError(data);
      throw new Error('Error: ' + data);
    });
  }

  this.validate = function(increments, form){
    if(typeof form.$error.required != 'undefined' && form.$error.required){
      //we have an error here so need to handle it
      var error = '';
      for(var i=0; i<form.$error.required.length; i++){
        if(typeof this.errorClass(form.$error.required[i].$name) != 'undefined' && typeof this.errorClass(form.$error.required[i].$name).msg != 'undefined'){
          error += this.errorClass(form.$error.required[i].$name).msg+"<br>";
        }else{
          console.log('Missing validation for: ' + form.$error.required[i].$name);
        }
      }
      WMService.handleError({message: error});
      throw new Error('Error: ' + error)
    }
    
    return increments;
  }

  this.errorClass = function(errorClass){
    var errorClasses = {
      'increment': {msg:"The increment(s) are required."}, 
      'base': {msg:"The to value is required."}, 
    };
    return errorClasses[errorClass];
  }

}]);

WebModule.service('Increments', ['WMService', '$http',function(WMService, $http){

  this.edit = function(increments){
    var newIncrements = {};
    newIncrements._state = 'edit';
    newIncrements._edit = [];

    if(typeof increments != 'undefined'){
      var baseIncrements = Object.keys(increments).sort(function(a,b){
        if (isNaN(a) || isNaN(b)){return 0;}
        return parseInt(a)-parseInt(b);
      });
      for(var i=0; i<baseIncrements.length; i++){
        newIncrements._edit.push({ 'base': baseIncrements[i], 'increments': increments[baseIncrements[i]] });
      }
    }else{
      newIncrements._edit.push({ 'base': 0.00, 'increments': [] });
    }
    return newIncrements;
  }

  this.processCustomBidTable = function(increments){
    //this function will convert the custom bid table on the increments._edit object into a json format.
    var bidTable = {};
    bidTable.bid_table = {};
    for(var i=0; i<increments._edit.length; i++){
      //bidTable.bid_table[parseFloat(increments._edit[i].base).toFixed(2)] = [parseFloat(increments._edit[i].increments).toFixed(2)];
      bidTable.bid_table[parseFloat(increments._edit[i].base).toFixed(2)] = [];
      for(var j=0; j<increments._edit[i].increments.length; j++){
        bidTable.bid_table[parseFloat(increments._edit[i].base).toFixed(2)].push(parseFloat(increments._edit[i].increments[j]).toFixed(2));
      }
      //bidTable.bid_table[parseFloat(increments._edit[i].base).toFixed(2)] = [parseFloat(increments._edit[i].increments).toFixed(2)];
    }
    console.log(bidTable);
    return bidTable;
  }

  this.processIncrements = function(increments){
    var newIncrements = Object.keys(increments).sort(function(a,b){
      if (isNaN(a) || isNaN(b)){return 0;}
      return parseInt(a)-parseInt(b);
    });
    return newIncrements;
  }

  this.save = function(increments, successHandlerFn){
    //we need to get the increments back into the correct format.
    var bidTable = this.processCustomBidTable(increments);

    if(typeof successHandlerFn=='undefined'){
      successHandlerFn = function(data){
        increments = data;
        increments._state = 'view';
        return increments;
      }
    }

    if (viewVars.currentRouteName === 'new-lot' || viewVars.currentRouteName === 'edit-lot') {
      if(increments._edit.hasOwnProperty('row_id')){
        throw new Error('unimplemented');
      }else{
        var url = WMService.generateUrl('ajaxSaveIncrements');
      }
    } else {
      if(increments._edit.hasOwnProperty('row_id')){
        var url = WMService.generateUrl('ajaxSaveAuction', {'auctionId':auction._edit.row_id});
      }else{
        var url = WMService.generateUrl('ajaxSaveIncrements');
      }
    }


    //auction._edit=this.validate(auction._edit);
    var promise = $http.post(url, bidTable);

    promise.success(function(data){
      successHandlerFn(data);
    });
    promise.error(function(data){
      WMService.handleError(data);
    });
  }

  this.validate = function(increments, form){
    if(typeof form.$error.required != 'undefined' && form.$error.required){
      //we have an error here so need to handle it
      var error = '';
      for(var i=0; i<form.$error.required.length; i++){
        if(typeof this.errorClass(form.$error.required[i].$name) != 'undefined' && typeof this.errorClass(form.$error.required[i].$name).msg != 'undefined'){
          error += this.errorClass(form.$error.required[i].$name).msg+"<br>";
        }else{
          console.log('Missing validation for: ' + form.$error.required[i].$name);
        }
      }
      WMService.handleError({message: error});
      throw new Error('Error: ' + error)
    }
    
    return increments;
  }

  this.errorClass = function(errorClass){
    var errorClasses = {
      'increment': {msg:"The increment(s) are required."}, 
      'base': {msg:"The to value is required."}, 
    };
    return errorClasses[errorClass];
  }

}]);

WebModule.service('Auction', ['WMService', '$http',function(WMService, $http){
  
  this.edit = function(auction){
    var newAuction = {};
    newAuction._state = 'edit';
    newAuction._edit = {};
    if(typeof auction != 'undefined'){
      var auctionFields = [
        'row_id',
        'auction_type',
        'title',
        'timezone',
        'description',
        'viewing_information',
        'currency_code',
        'payments',
        'shipping_info',
        'time_start',
        'time_start_live_auction',
        'duration',
        'images',
        'publication_status',
        'lot_extended_end_time_interval',
        'location_name',
        'location_description',
        'auction_code',
        'percentage_bidding',
        'spot_price',
      ];
      if (viewVars.me.tenant.brand === 'sagafurs') {
        auctionFields.push('auction_staggered_type');
        auctionFields.push('lot_extensions_limit');
      }

      if (viewVars.me.tenant.brand === 'phillips') {
        auctionFields.push('contact_notes');
      }

      if (viewVars.me.tenant.brand === 'breedersworld') {
        auctionFields.push('is_times_the_money');
      }

      if (viewVars.me.tenant.brand === 'stacks') {
        auctionFields.push('time_start_proxy_bidding');
      }

      for(var i=0; i<auctionFields.length; i++){
        newAuction._edit[auctionFields[i]] = auction[auctionFields[i]];
      }
    }else{
      var auctionFields = ['auction_type', 'timezone', 'currency_code'];
      for(var i=0; i<auctionFields.length; i++){
        newAuction._edit[auctionFields[i]] = "";
      }
    }

    if (typeof auction == 'undefined' || auction == null || (auction.hasOwnProperty('require_approval') && auction.require_approval == null)){
      newAuction._edit['auto_approval'] = null;
    }
    else {
      newAuction._edit['auto_approval'] = !auction.require_approval;
    }
    if (viewVars.me.tenant.brand === 'stacks') {
      newAuction._edit['auction_type'] = 'timed_then_live';
    }
    console.log(newAuction);
    return newAuction;
  }

  this.save = function(auction, successHandlerFn){
    if(typeof successHandlerFn=='undefined'){
      successHandlerFn = function(data){
        auction = data;
        auction._state = 'view';
        return auction;
      }
    }

    if(auction._edit.hasOwnProperty('row_id')){
      var url = WMService.generateUrl('ajaxSaveAuction', {'auctionId':auction._edit.row_id});
    }else{
      var url = WMService.generateUrl('ajaxCreateAuction');
    }

    if (viewVars.me.tenant.brand === 'stacks') {
      auction._edit['auction_type'] = 'timed_then_live';
    }

    //auction._edit=this.validate(auction._edit);
    var saveData = $.extend(true, {}, auction._edit);
    if (auction._edit.hasOwnProperty('auto_approval')){
      if (auction._edit.auto_approval == null){
        saveData['require_approval'] = null;
      }
      else {
        saveData['require_approval'] = !auction._edit.auto_approval;
      }
      if (saveData.hasOwnProperty('auto_approval')){
        delete(saveData.auto_approval);
      }
    }

    if(WMService.timezoneMap.hasOwnProperty(saveData.timezone)){
      saveData.timezone = WMService.timezoneMap[saveData.timezone];
    }

    var promise = $http.post(url, saveData);

    promise.success(function(data){
      successHandlerFn(data);
    });
    promise.error(function(data){
      WMService.handleError(data);
      throw new Error('Error: ' + data);
    });
  }

  this.validate = function(auction, form){
    if(typeof form.$error.required != 'undefined'){
      //we have an error here so need to handle it
      var error = '';
      for(var i=0; i<form.$error.required.length; i++){
        if(typeof this.errorClass(form.$error.required[i].$name) != 'undefined' && typeof this.errorClass(form.$error.required[i].$name).msg != 'undefined'){
          error += this.errorClass(form.$error.required[i].$name).msg+"<br>";
        }else{
          console.log('Missing validation for: ' + form.$error.required[i].$name);
        }
      }
      WMService.handleError({message: error});
      throw new Error('Error: ' + error);
    }
    //nullIfEmpty will set a variable to null if it is empty
    //notEmptiable will remove a variable if it is empty
    //emptiable will set a variable to '' if it is null
    var nullIfEmpty = ['timezone','currency_code','auction_type'];
    var notEmptiable = [];
    var emptiable = ['description'];
    
    for(var i=0; i<emptiable.length; i++){
      if(typeof auction[emptiable[i]] == 'undefined'){
        auction[emptiable[i]] = '';
      }
    }
    for(var i=0; i<notEmptiable.length; i++){
      if(auction[notEmptiable[i]] == null || auction[notEmptiable[i]].trim() == ""){
        delete(auction[notEmptiable[i]]);
      }
    }
    for(var i=0; i<nullIfEmpty.length; i++){
      if(auction.hasOwnProperty(nullIfEmpty[i]) && auction[nullIfEmpty[i]].trim() == ""){
        delete(auction[nullIfEmpty[i]]);
      }
    }
    //loop through, remove if empty
    return auction;
  }

  this.isTimeVisibleForAuction = function(auction){
    // For auctions that are catalog_only or live that have a lot count > 1, do not show any time or time left.
    return !(auction && (auction.auction_type == 'catalog_only' || auction.auction_type == 'live') && auction.lot_count > 1);
  }

  this.isMultiLotCatalogOnlyAuction = function(auction){
    return auction.auction_type == 'catalog_only' && auction.lot_count > 1;
  }

  this.isMultiLotLiveAuction = function(auction){
    return auction.auction_type == 'live' && auction.lot_count > 1;
  }

  this.isRegistrationStartDateTimeVisibleInAuctionHeader = function(auction){
    // Used by alexcooper only atm.
    // since live auctions apparently NEVER show the date that the registration starts just return false
    if (auction.auction_type == 'live') return false;
    return auction.auction_type == 'live' &&
      !this.isMultiLotCatalogOnlyAuction(auction) &&
      !WMService.auctionRegistrationStartDatePassed(auction) &&
      !WMService.auctionIsLive(auction) &&
      WMService.daysTillAuctionEnd(auction) < viewVars.numLiveAuctionEarlyRegistrationDays;
  }

  this.isStartDateTimeVisibleInAuctionHeader = function(auction){
    // Used by alexcooper only atm.
    return !this.isRegistrationStartDateTimeVisibleInAuctionHeader(auction) &&
      !this.isMultiLotCatalogOnlyAuction(auction) &&
      !WMService.auctionStartDatePassed(auction) &&
      !WMService.auctionIsLive(auction)
  }

  this.isRegisterToBidVisibleInAuctionHeader = function(auction){
    // Used by alexcooper only atm.
    var valid = !this.isMultiLotCatalogOnlyAuction(auction)
      && !viewVars.features.globalBidderRegistration
      && !WMService.auctionIsLive(auction)
      && !WMService.auctionRegistration(auction)
      && !WMService.auctionIsPast(auction)
      && (WMService.isLiveBiddingEnabled(auction) || WMService.isAbsenteeBiddingEnabled(auction));
    if (viewVars.brand == 'alexcooper' && auction.auction_type == 'live' && valid) {
      // Checks if live auction is starting within the next 5 days
      valid = moment().add(viewVars.numLiveAuctionEarlyRegistrationDays,'days') >= moment(auction.time_start);
    }
    else if (viewVars.brand == 'alexcooper' && auction.auction_type == 'timed' && valid)
    {
      valid = !this.isStartDateTimeVisibleInAuctionHeader(auction);
    }

    return valid;
  }

  this.errorClass = function(errorClass){
    var errorClasses = {
      'auction_type': {msg:"The auction type is required."}, 
      'title': {msg:"The auction title is required."}, 
      'location_name': {msg:"The location is required."}, 
      'time_start': {msg:"The start time is required."}, 
      'time_end': {msg:"The end time is required."}, 
      'duration': {msg:"The end time is required."}, 
      'timezone': {msg:"The timezone is required."}, 
      'currency_code': {msg:"The currency type is required."}, 
      //'timezone', 'description', 'viewing_information', 'currency_code', 'payments', 'shipping_info', 'time_start', 'duration', 'images', 'publication_status', 'lot_extended_end_time_interval', 'location_name', 'location_description'
    };
    return errorClasses[errorClass];
  }
 
}]);

WebModule.service('DocumentRepository', ['WMService', '$http',function(WMService, $http){
  
  this.validate = function(documentRepository){
    
    //nullIfEmpty will set a variable to null if it is empty
    //notEmptiable will remove a variable if it is empty
    //emptiable will set a variable to '' if it is null
    var nullIfEmpty = [];
    var notEmptiable = ['s3_bucket','s3_path','s3_url'];
    var emptiable = [];

    for(var j=0; j<documentRepository.length; j++){
      for(var i=0; i<emptiable.length; i++){
        if(typeof documentRepository[j][emptiable[i]] == 'undefined'){
          documentRepository[j][emptiable[i]] = '';
        }
      }
      for(var i=0; i<notEmptiable.length; i++){
        if(documentRepository[j][notEmptiable[i]] == null || documentRepository[j][notEmptiable[i]].trim() == ""){
          console.log(notEmptiable[i])
          delete(documentRepository[j][notEmptiable[i]]);
        }
      }
      for(var i=0; i<nullIfEmpty.length; i++){
        if(documentRepository[j].hasOwnProperty(nullIfEmpty[i]) && documentRepository[j][nullIfEmpty[i]].trim() == ""){
          delete(documentRepository[j][nullIfEmpty[i]]);
        }
      }
    }
    
    //loop through, remove if empty
    return documentRepository;
  }
 
}]);

WebModule.service('AMDate', [function(){
  //possibly have locale which false is do not apply, null is apply default locale, locale string apply the custom locale

  /*
  blacklistTimezone supports
  1. True - removes timezone
  2. False - keeps timezone
  3. String - removes timezone only in the case that the formatted timezone by moment == blacklistTimezone
  4. Array - removes timezone only in the case that the formatted timezone by moment is in the blacklistTimezone array.
*/
  this.setupMoment = function(dateMoment){
    if(moment.isMoment(dateMoment) == false){
      dateMoment = moment(dateMoment);
      //console.log('the date string supplied was not a moment');
    }
    dateMoment.locale(viewVars.locale);

    return dateMoment;
  }

  this.getMoment = function (dateString, timezone) {
    if (moment.isMoment(dateString) === true) {
      // already a moment here so we are good
      return dateString;
    }

    if (typeof timezone === 'undefined') {
      date = moment(dateString);
    } else {
      date = moment(dateString).tz(timezone);
    }

    return date;
  }

  this.date = function(dateMoment){

    dateMoment = this.setupMoment(dateMoment);

    if(typeof blacklistTimezone == 'undefined'){
      blacklistTimezone = true;
    }

    var format = viewVars.localeOptions.dateTimeFormats.dateFormat;

    return dateMoment.format(format);
  }

  this.time = function(dateMoment, forceShowMinutes, blacklistTimezone){
    if(typeof forceShowMinutes == 'undefined'){
      forceShowMinutes = false;
    }

    dateMoment = this.setupMoment(dateMoment);

    if(typeof blacklistTimezone == 'undefined'){
      blacklistTimezone = true;
    }

    var format = "";
    if(dateMoment.format('mm') == '00' && forceShowMinutes == false){
      format = viewVars.localeOptions.dateTimeFormats.timeFormatNoMinutes;
    }else{
      format = viewVars.localeOptions.dateTimeFormats.timeFormat;
    }

    //in each of these cases we will want to show the timezone
    if(blacklistTimezone === false){
      format = format + " z";
    }else if(typeof blacklistTimezone == 'string'){
      if(dateMoment.format('z') != blacklistTimezone){
        format = format + " z";
      }
    }else if(Array.isArray(blacklistTimezone)){
      if(blacklistTimezone.indexOf(dateMoment.format('z')) == -1){
        format = format + " z"; 
      }
    }

    return dateMoment.format(format);
  }

  this.dateTime = function(dateMoment, forceShowMinutes, blacklistTimezone){
    if(typeof forceShowMinutes == 'undefined'){
      forceShowMinutes = false;
    }

    if(typeof blacklistTimezone == 'undefined'){
      blacklistTimezone = true;
    }

    dateMoment = this.setupMoment(dateMoment);

    return this.date(dateMoment) + ' ' + this.time(dateMoment, forceShowMinutes, blacklistTimezone);
  }

  this.longDate = function(dateMoment, forceShowMinutes){
    dateMoment = this.setupMoment(dateMoment);

    return dateMoment.format(viewVars.localeOptions.dateTimeFormats.longDate);
  }

  this.longDateNoTime = function(dateMoment){
    dateMoment = this.setupMoment(dateMoment);

    return dateMoment.format(viewVars.localeOptions.dateTimeFormats.longDateNoTimeFormat);
  }

  this.shortTime = function(dateMoment, forceShowMinutes){
    dateMoment = this.setupMoment(dateMoment);

    if(typeof forceShowMinutes == 'undefined'){
      forceShowMinutes = false;
    }

    this.setupMoment(dateMoment);

    if(dateMoment.format('mm') == '00' && forceShowMinutes == false){
      return dateMoment.format(viewVars.localeOptions.dateTimeFormats.shortTimeNoMinutes);
    }else{
      return dateMoment.format(viewVars.localeOptions.dateTimeFormats.shortTime);
    }

  }
}]);

WebModule.service('StaticPages', ['WMService', '$http',function(WMService, $http){

 this.save = function(staticPage, successHandlerFn){
    if(typeof successHandlerFn=='undefined'){
      successHandlerFn = function(data){
        staticPage = data;
        return staticPage;
      }
    }
    //console.log(staticPage)
    var hadError = this.validate(staticPage);

    if(hadError){
      WMService.handleError({'message': 'An error has occurred.'});
      throw new Error('An error has occurred.');
    }
    
    //remove the private variables
    for(module in staticPage.config_value.modules){
      //if they were in the middle of deleting a dataset remove the _deleteMode property so that we do not save that.
      if(Array.isArray(staticPage.config_value.modules[module].data)){
        for(var i=0; i<staticPage.config_value.modules[module].data.length; i++){
          delete staticPage.config_value.modules[module].data[i]._deleteMode;
        }
      }
      //console.log(staticPage.config_value.modules[module].data)
      //throw new Error('stop');
      delete staticPage.config_value.modules[module]._expanded;
      delete staticPage.config_value.modules[module]._loadedTemplate;
      delete staticPage.config_value.modules[module]._rules;
    }


    var url = WMService.generateUrl('ajaxSaveStaticPage');
    //auction._edit=this.validate(auction._edit);
    var promise = $http.post(url, staticPage);

    promise.success(function(data){
      successHandlerFn(data);
    });
    promise.error(function(data){
      WMService.handleError(data);
    });
  }
  this.loadConfigItem = function(configItem, successHandlerFn){
    if(typeof successHandlerFn=='undefined'){
      successHandlerFn = function(data){
        return data;
      }
    }

    var url = WMService.generateUrl('ajaxGetConfigItem');

    var promise = $http.post(url,{'configItem':configItem});
    promise.success(function(data){
      successHandlerFn(data);
    });
    promise.error(WMService.handleError);
  }

  this.validate = function(staticPage){
    //todo we need to make sure that we even have valid json for the su case
    //we need to first clear the previous errors
    this.clearErrors(staticPage);
    //we need to parse the rules to make sure that they are correct.
    var hadError = false
    for(module in staticPage.config_value.modules){
      if(staticPage.config_value.modules[module].hasOwnProperty('_rules')){
        //because we have the rules we know that they expanded the item. we need to validate against the rules provided now.
        //console.log("rules ", staticPage.config_value.modules[module]._rules);
        var rules = staticPage.config_value.modules[module]._rules;
        if(Array.isArray(staticPage.config_value.modules[module].data)){ //we have an array of objects
          //TODO I believe this is depricated. Revisit and remove if so
          //console.log("array");throw new Error('die')
          for(var i=0; i<staticPage.config_value.modules[module].data.length; i++){
            //console.log("data ",staticPage.config_value.modules[module].data[i]);
            for(dataItemKey in staticPage.config_value.modules[module].data[i]){
              if(!rules.hasOwnProperty(dataItemKey)){
                continue;
              }
              //validate against required
              staticPage.config_value.modules[module] = this.validateRequired(staticPage.config_value.modules[module].data[i][dataItemKey], staticPage.config_value.modules[module], dataItemKey, i, rules);
            }
          }
        }else{ //we have just an object
          //console.log(staticPage.config_value.modules[module].data)
          for(dataItemKey in staticPage.config_value.modules[module].data){
            //console.log(dataItemKey, rules, staticPage.config_value.modules[module].data)
            if(Array.isArray(staticPage.config_value.modules[module].data[dataItemKey])){
              //we have a collection, time for the ~fun~ mess...
              if(!rules.hasOwnProperty(dataItemKey)){
                //there are no rules for this
                continue;
              }
              var arrayRules = rules[dataItemKey];
              for(var z=0; z<staticPage.config_value.modules[module].data[dataItemKey].length; z++){
                //now since we have an array we have to iterate over the objects in the array
                for(arrayDataItemKey in staticPage.config_value.modules[module].data[dataItemKey][z]){
                  if(!arrayRules.hasOwnProperty(arrayDataItemKey)){
                    //there are no rules for this item
                    continue;
                  }
                  //console.log('we are hjere now')
                  staticPage.config_value.modules[module] = this.validateRequired(staticPage.config_value.modules[module].data[dataItemKey][z][arrayDataItemKey], staticPage.config_value.modules[module], arrayDataItemKey, z, arrayRules);
                }
              }
            }else{
              //we have a regular variable
              //THIS BRANCH WORKS FINE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
              if(!rules.hasOwnProperty(dataItemKey)){
                //there are no rules for this
                continue;
              }
              //validate against required
              console.log(staticPage.config_value.modules[module].data[dataItemKey], staticPage.config_value.modules[module], dataItemKey, 0, rules)
              staticPage.config_value.modules[module] = this.validateRequired(staticPage.config_value.modules[module].data[dataItemKey], staticPage.config_value.modules[module], dataItemKey, 0, rules);
            }
          }
        }
      }
    }
    var hadError = false;
    for(module in staticPage.config_value.modules){
      if(staticPage.config_value.modules[module].hasOwnProperty('_errors')){
        hadError = true;
      }
    }
    //console.log("hes dead jim", hadError);throw new Error('die')
    return hadError;
  }
  this.clearErrors = function(staticPage){
    for(module in staticPage.config_value.modules){
      if(staticPage.config_value.modules[module].hasOwnProperty('_errors')){ 
        delete staticPage.config_value.modules[module]._errors;
      }
    }
  }
  this.isEmpty = function(data){
    if(data == '' || data == null || data == undefined || typeof data == 'undefined'){
      return true;
    }
    return false;
  }
  this.setupErrors = function(currentModule, dataItemKey){
    if(!currentModule.hasOwnProperty('_errors')){
      currentModule._errors = {};
    }
    if(!Array.isArray(currentModule._errors[dataItemKey])){
      currentModule._errors[dataItemKey] = {};
    }
    return currentModule;
  }
  this.validateRequired = function(data, currentModule, dataItemKey, position, rules){
    //console.log(data, currentModule, dataItemKey, position, rules)
    if(rules[dataItemKey].hasOwnProperty('required') && rules[dataItemKey].required === true){
      if(this.isEmpty(data)){
        hadError = true;
        currentModule = this.setupErrors(currentModule, dataItemKey);
        var tempError = {};
        tempError["position_"+position] = "This is a required field";
        currentModule._errors[dataItemKey][position] = "This is a required field";
      }
    }
    return currentModule;
  }
}]);

WebModule.service('CreditCard', ['WMService', '$http', '$filter',function(WMService, $http, $filter){
  /*
    eventually we will want to decomission the creditcardservice factory
  */
  this.checkFields = function(creditCardInfo){
    //eventually we need to make this work for other people than nmi but 
    var failureMessage = '';
    var hadFailure = false
    if(viewVars.paymentProcessor == 'nmi'){
      if(!creditCardInfo['ccnumber']){
        failureMessage = failureMessage + $filter('translate')('Credit Card Number is required.') + "<br>";
      }
      if(!creditCardInfo['exp-month']){
        failureMessage = failureMessage + $filter('translate')('Expiration Month is required.') + "<br>";
      }
      if(!creditCardInfo['exp-year']){
        failureMessage = failureMessage + $filter('translate')('Expiration Year is required.') + "<br>";
      }
      if(!creditCardInfo['cvv']){
        failureMessage = failureMessage + $filter('translate')('CVV Code is required.') + "<br>";
      }
    }
    if(failureMessage){
      WMService.handleError({message:failureMessage});
      hadFailure = true;
    }
    return hadFailure;
  }
  this.processNmiCert = function(nmiCert){
    //remove the first ***
    nmiCert = nmiCert.substring(3, nmiCert.length);
    //find the first | and split by it
    var splitLoc = nmiCert.indexOf("|");
    var keyId = nmiCert.substring(0, splitLoc);

    nmiCert = nmiCert.substring(splitLoc+1);
    //remove the final ***
    nmiCert = nmiCert.substring(0, nmiCert.length - 3);
    
    return {cert: nmiCert, keyId: keyId};
  }
  this.encryptNmiAesKey = function(creditCardInfo){
    /*var certString = "***4415|MIIERzCCAy+gAwIBAgIBADANBgkqhkiG9w0BAQUFADCBvTELMAkGA1UE"+
    "BhMCVVMxETAPBgNVBAgMCElsbGlub2lzMRMwEQYDVQQHDApTY2hhdW1idXJnMRgw"+
    "FgYDVQQKDA9TYWZlV2ViU2VydmljZXMxHjAcBgNVBAsMFUVuZC10by1lbmQgZW5j"+
    "cnlwdGlvbjEgMB4GA1UEAwwXd3d3LnNhZmV3ZWJzZXJ2aWNlcy5jb20xKjAoBgkq"+
    "hkiG9w0BCQEWG3N1cHBvcnRAc2FmZXdlYnNlcnZpY2VzLmNvbTAeFw0xNzAyMDgx"+
    "NjM0MjVaFw0xNzAyMDkxNjM0MjVaMIG9MQswCQYDVQQGEwJVUzERMA8GA1UECAwI"+
    "SWxsaW5vaXMxEzARBgNVBAcMClNjaGF1bWJ1cmcxGDAWBgNVBAoMD1NhZmVXZWJT"+
    "ZXJ2aWNlczEeMBwGA1UECwwVRW5kLXRvLWVuZCBlbmNyeXB0aW9uMSAwHgYDVQQD"+
    "DBd3d3cuc2FmZXdlYnNlcnZpY2VzLmNvbTEqMCgGCSqGSIb3DQEJARYbc3VwcG9y"+
    "dEBzYWZld2Vic2VydmljZXMuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB"+
    "CgKCAQEAyaWL5vLIk1AHuTKGkoizjXpB66uiExZu3ovYgE6Lc0sBUtjYlBNEF6xT"+
    "BJZe453nQLAJlpTbCHg4P0p3RpY1tGKG0nsFlod2UU561poABGkhaHbW5PDY2got"+
    "chwh75PbmXntXc7+dlfiG7own+i87T8TPyFCMqt3gljvOg6uLVw5uo+pRtDrOTai"+
    "HX4WVu3XwK8yuy4dj8IZd4xSoi4ADARx37VlUwu82Lc6w+UEp+2gvowrQyA7V0H4"+
    "9faoCcmbfY3D5Whmhpk2dFDS6lBQ81WKXYSFcbcSKre7Wwi5k4io77pLOMPEGgVV"+
    "v6KSn5MYmiAlTHGI2Krph8GaSuG+CwIDAQABo1AwTjAdBgNVHQ4EFgQUJQIP+wSB"+
    "3lY/xX3i8IWPQwz3nAEwHwYDVR0jBBgwFoAUJQIP+wSB3lY/xX3i8IWPQwz3nAEw"+
    "DAYDVR0TBAUwAwEB/zANBgkqhkiG9w0BAQUFAAOCAQEAiXQNqILdGlzw3mEafHL4"+
    "xLsJNOc2OOA7Caj0sJGzeFJ5PlbwNU+jmGex0zgBtZ4BeFT8nQnEeYcpsDglaqid"+
    "OBAaJ3t+WUzg7C9Lde7sAnNbuC+vtTWX9/VBo27DRpaDSMGf18CXG6d/1RTixYl+"+
    "6IVdIrCt8iRdoI7HHzHjBgoYpS1W8X9ZN3pXARuWDWOZ00/VGagU4WoyDG3QIFLj"+
    "M8KOZd6nR4fMk+Fb59weK0pr93rrcbN+ammjfH4GFqTBacsZOeL+7k7zogiTtGET"+
    "Wmn2oeELmG9kuHotTpOjD2DJZSTHjOjjINuyFxUXLBeEb8CHPNQ6+vtKjTnpzX/j"+
    "zA==***";*/
    var certString = viewVars.nmiCert;
    var processedNmiCert = this.processNmiCert(certString);

    // base64-decode DER bytes
    var certDerBytes = forge.util.decode64(processedNmiCert.cert);
    // parse DER to an ASN.1 object
    var obj = forge.asn1.fromDer(certDerBytes);
    // convert ASN.1 object to forge certificate object
    var cert = forge.pki.certificateFromAsn1(obj);
    // get forge public key object
    var publicKey = cert.publicKey;

    var aesItems = this.aesEncryptNmiString(creditCardInfo);

    var encKey = publicKey.encrypt(aesItems.key);
    var keyResult = forge.util.encode64(encKey);
    var ivResult = forge.util.encode64(aesItems.iv)
    var dataResult = forge.util.encode64(aesItems.aesEncryptedString);

    var FORMAT_ID = "GWSC";
    var VERSION = "1";
    var keyId = processedNmiCert.keyId;
    var test = FORMAT_ID + "|" + VERSION + "|" + keyId + "|" + keyResult + "|" + ivResult + "|" + dataResult;
    /*
    var publicKey = forge.pki.publicKeyFromPem(key);
    var encrypted = publicKey.encrypt(aesKey);*/
    //console.log(forge.util.encode64(test))
    return forge.util.encode64(test);
  }
  

  this.createNmiString = function(creditCardInfo){
    //we only want the last 2 of the expiration
    creditCardInfo['exp-year'] = creditCardInfo['exp-year'].slice(-2);
    if(creditCardInfo['exp-month'].length == 1){
      creditCardInfo['exp-month'] = "0"+creditCardInfo['exp-month']
    }
    var newCreditCardInfo = {
      'ccnumber': creditCardInfo['ccnumber'],
      'cvv': creditCardInfo['cvc'],
      'ccexp': creditCardInfo['exp-month']+creditCardInfo['exp-year'],
    };
    if(viewVars.module == 'backend'){
      newCreditCardInfo.ccnumber = creditCardInfo.number;
    }
    var nmiString = "ccnumber="+newCreditCardInfo['ccnumber'] + "&cvv=" + newCreditCardInfo['cvv'] + "&ccexp=" + newCreditCardInfo['ccexp'];
    return nmiString;
  }

  this.aesEncryptNmiString = function(creditCardInfo){
    var key = forge.random.getBytesSync(32);
    var iv = forge.random.getBytesSync(16);

    var nmiString = this.createNmiString(creditCardInfo);
    var cipher = forge.cipher.createCipher('AES-CBC', key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(nmiString, 'utf8'));
    cipher.finish();
    var encrypted = cipher.output;
    return {aesEncryptedString: encrypted.data, iv: iv, key:key};
  }
}]);