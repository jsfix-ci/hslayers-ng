/**
 * @namespace hs.rogainonline
 * @memberOf hs
 */
define(['angular', 'core'],

    function(angular) {

        angular.module('hs.rogainonline', ['hs.core'])

        .directive('hs.rogainonline.panelDirective', function() {
            return {
                templateUrl: './panel.html?bust=' + gitsha
            };
        })

    })
