/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ngMaterial'],

    function(angular, ol) {
        angular.module('hs.material.bottomToolbar', ['ngMaterial'])
            
            .directive('hs.material.bottomtoolbar.directive', function() {
                return {
                    templateUrl: hsl_path + 'examples/liberecMaterial/materialComponents/bottomToolbar.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            .controller('hs.material.bottomToolbar.controller', ['$scope', 'config', 
                function($scope, config) {
                    $scope.buttons = [
                        {
                            item: 'measure',
                            tooltip: 'Measure on map',
                            icon: 'timeline',
                            show: (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.measure)) ? config.bottomToolbar.measure : true
                        },
                        {
                            item: 'share',
                            tooltip: 'Share map',
                            icon: 'share',
                            show: (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.share)) ? config.bottomToolbar.share : true
                        },
                        {
                            item: 'print',
                            tooltip: 'Print map',
                            icon: 'print',
                            show:  (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.print)) ? config.bottomToolbar.print : true
                        },
                        ,
                        {
                            item: 'help',
                            tooltip: 'App help',
                            icon: 'help',
                            show: (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.help)) ? config.bottomToolbar.help : true
                        },
                        {
                            item: 'info',
                            tooltip: 'App info',
                            icon: 'info',
                            show:  (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.info)) ? config.bottomToolbar.info : true
                        }
                    ];

                    $scope.buttonClicked = function(button) {
                        $scope.$emit('menuButtonClicked', button);
                        console.log("sendo");
                    }

                    if (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.customButton)) {
                        
                    }

                    /*
                        config.bottomToolbar.buttonStatus.xxx
                    */

                    $scope.$emit('scope_loaded', "bottomToolbar");
                }
            ]);
    })
