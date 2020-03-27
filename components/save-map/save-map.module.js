import 'angular-cookies';
import saveMapComponent from './save-map.component';
import saveMapService from './save-map.service';
import saveMapManagerService from './save-map-manager.service';
import statusManagerService from './status-manager.service';
import laymanService from './layman.service';
import layerSynchronizerService from './layer-synchronizer.service';
import '../../common/widgets/widgets.module';

/**
 * @namespace hs.save-map
 * @memberOf hs
 */
angular.module('hs.save-map', ['hs.map', 'hs.core', 'ngCookies', 'hs.widgets'])
/**
     * @ngdoc directive
     * @name hs.save-map.directive
     * @memberof hs.save-map
     * @description Display Save map (composition) dialog
     */
  .directive('hs.save-map.directive', ['config', function (config) {
    return {
      template: require('./partials/dialog.html')
    };
  }])

  /**
   * @ngdoc directive
   * @name hs.saveMap.directiveForm
   * @memberof hs.save-map
   * @description Display advanced form to collect information (metadata) about saved composition
   */
  .directive('hs.saveMap.directiveForm', ['config', function (config) {
    return {
      template: require('./partials/form.html')
    };
  }])

  /**
   * @ngdoc directive
   * @name hs.saveMap.directiveSimpleform
   * @memberof hs.save-map
   * @description Display simple form to collect information (metadata) about saved composition
   */
  .directive('hs.saveMap.directiveSimpleform', ['config', function (config) {
    return {
      template: require('./partials/simpleform.html')
    };
  }])

  /**
   * @ngdoc directive
   * @name hs.saveMap.resultDialogDirective
   * @memberof hs.save-map
   * @description Display dialog about result of saving to status manager operation
   */
  .directive('hs.saveMap.resultDialogDirective', ['config', function (config) {
    return {
      template: require('./partials/dialog_result.html'),
      link: function (scope, element, attrs) {
        scope.resultModalVisible = true;
      }
    };
  }])

  /**
   * @ngdoc directive
   * @name hs.saveMap.saveDialogDirective
   * @memberof hs.save-map
   * @description Display saving dialog (confirmation of saving, overwriting, selection of name)
   */
  .directive('hs.saveMap.saveDialogDirective', ['config', function (config) {
    return {
      template: require('./partials/dialog_save.html'),
      link: function (scope, element, attrs) {
        scope.saveCompositionModalVisible = true;
      }
    };
  }])

  /**
   * @ngdoc directive
   * @name hs.saveMap.focusName
   * @memberof hs.save-map
   * @description UNUSED?
   */
  .directive('hs.saveMap.focusName', ['timeout', '$log', ($timeout, $log) => {
    return {
      link: function (scope, element, attrs) {
        scope.$watch(attrs.focusName, (value) => {
          if (value === true) {
            $log.log('value=', value);
            element[0].focus();
            scope[attrs.focusName] = false;
            //});
          }
        });
      }
    };
  }])

  /**
   * @ngdoc service
   * @name hs.save-map.service
   * @memberof hs.save-map
   * @description Service for converting composition and composition data into JSON object which can be saved on server
   */
  .factory('hs.save-map.service', saveMapService)

  /**
   * @ngdoc service
   * @name hs.save-map.service
   * @memberof hs.save-map
   * @description Service for managing saving logic to various providers.
   * Currently Layman and Status manager are supported.
   */
  .factory('hs.saveMapManagerService', saveMapManagerService)

  /**
   * @ngdoc service
   * @name hs.laymanService
   * @memberof hs.save-map
   * @description Service for sending and retrieving compositions from Status
   * Manager backend
   */
  .factory('hs.statusManagerService', statusManagerService)

  /**
   * @ngdoc service
   * @name hs.laymanService
   * @memberof hs.save-map
   * @description Service for sending and retrieving data from Layman
   * (compositions, layers) (https://github.com/jirik/gspld)
   */
  .factory('hs.laymanService', laymanService)

  /**
   * @ngdoc service
   * @name hs.layerSynchronizerService
   * @memberof hs.save-map
   * @description Service which monitors vector layers and initiates sending
   * and gets requesting of features to/from Layman
   */
  .factory('hs.layerSynchronizerService', layerSynchronizerService)

  /**
   * @ngdoc component
   * @name hs.saveMap
   * @memberof hs.save-map
   * @description Save map panel
   */
  .component('hs.saveMap', saveMapComponent);
