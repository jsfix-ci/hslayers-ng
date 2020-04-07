import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';

export default [
  '$scope',
  'hs.draw.service',
  'hs.utils.layerUtilsService',
  'hs.query.vectorService',
  '$timeout',
  'hs.layout.service',
  'gettext',
  function (
    $scope,
    drawService,
    layerUtilsService,
    queryVectorService,
    $timeout,
    layoutService,
    gettext
  ) {
    angular.extend($scope, {
      layoutService,
      service: drawService,
      drawableLayers: drawService.drawableLayers,
      isLayerInManager: layerUtilsService.isLayerInManager,
      hasLayerTitle: layerUtilsService.hasLayerTitle,
      isLayerEditable: layerUtilsService.isLayerEditable,
      isLayerDrawable: layerUtilsService.isLayerDrawable,
      useIndividualStyle: true,
      opacity: 0.2,
      linewidth: 1,
      fillcolor: {'background-color': 'rgba(0, 153, 255, 1)'},
      defaultStyle: new Style({
        stroke: new Stroke({
          color: 'rgba(0, 153, 255, 1)',
          width: 1.25,
        }),
        fill: new Fill({
          color: 'rgba(255,255,255,0.4)',
        }),
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: 'rgba(255,255,255,0.4)',
          }),
          stroke: new Stroke({
            color: 'rgba(0, 153, 255, 1)',
            width: 1.25,
          }),
        }),
      }),
      setType(what) {
        drawService.type = what;
        drawService.source = angular.isDefined(
          drawService.selectedLayer.getSource().getSource
        )
          ? drawService.selectedLayer.getSource().getSource() //Is it clustered vector layer?
          : (drawService.source = drawService.selectedLayer.getSource());
        /* Individual feature styling is only available when drawing
				is controlled in special panel not in toolbar */
        $scope.activateDrawing(
          layoutService.panelVisible('draw') && $scope.useIndividualStyle
        );
      },
      activateDrawing(withStyle) {
        drawService.activateDrawing(
          $scope.onDrawStart, //Will add later
          $scope.onDrawEnd,
          $scope.onFeatureSelected, //Will add later
          $scope.onFeatureDeselected, //Will add later
          withStyle ? $scope.changeStyle : undefined,
          true //Activate drawing immediately
        );
      },
      finishDrawing() {
        drawService.draw.finishDrawing();
      },
      removeLastPoint() {
        drawService.removeLastPoint();
      },
      selectLayer(layer) {
        drawService.selectedLayer = layer;
        $scope.layersExpanded = false;
      },
      selectedLayerString() {
        if (drawService.selectedLayer) {
          return (
            drawService.selectedLayer.get('title') ||
            drawService.selectedLayer.get('name')
          );
        } else {
          return gettext('Select layer');
        }
      },
      toggleDrawToolbar(e) {
        if (
          layoutService.layoutElement.clientWidth > 767 &&
          layoutService.layoutElement.clientWidth < 870 &&
          !$scope.drawToolbarExpanded
        ) {
          layoutService.sidebarExpanded = false;
        }
        $scope.drawToolbarExpanded = !$scope.drawToolbarExpanded;
        if (!$scope.drawToolbarExpanded) {
          drawService.stopDrawing();
        }
      },

      updateStyle() {
        drawService.updateStyle($scope.changeStyle);
      },
      /**
       * @function changeStyle
       * @memberOf HsDrawController
       * @param {Event} e optional parameter passed when changeStyle is called
       * for 'ondrawend' event features
       * @description Dynamically create draw feature style according to parameters selected in
       * hs.styler.colorDirective
       * @returns {Array} Array of style definitions
       */
      changeStyle(e = null) {
        return [
          new Style({
            stroke: new Stroke({
              color: $scope.fillcolor['background-color'],
              width: $scope.linewidth,
            }),
            fill: new Fill({
              color:
                $scope.fillcolor['background-color'].slice(0, -2) +
                $scope.opacity +
                ')',
            }),
            image: new Circle({
              radius: 5,
              fill: new Fill({
                color:
                  $scope.fillcolor['background-color'].slice(0, -2) +
                  $scope.opacity +
                  ')',
              }),
              stroke: new Stroke({
                color: $scope.fillcolor['background-color'],
                width: $scope.linewidth,
              }),
            }),
          }),
        ];
      },
      drawStyle() {
        return {
          'background-color':
            $scope.fillcolor['background-color'].slice(0, -2) +
            $scope.opacity +
            ')',
          border:
            $scope.linewidth +
            'px solid ' +
            $scope.fillcolor['background-color'],
        };
      },

      onDrawEnd(e) {
        if (angular.isUndefined(drawService.selectedLayer.get('editor'))) {
          return;
        }
        const editorConfig = drawService.selectedLayer.get('editor');
        if (editorConfig.defaultAttributes) {
          angular.forEach(editorConfig.defaultAttributes, (value, key) => {
            e.feature.set(key, value);
          });
        }
        /*Timeout is necessary because features are not imediately
         * added to the layer and layer can't be retrieved from the
         * feature, so they don't appear in Info panel */
        $timeout(() => {
          layoutService.setMainPanel('info');
          queryVectorService.selector.getFeatures().push(e.feature);
          queryVectorService.createFeatureAttributeList();
        });
      },
    });

    $scope.$emit('scope_loaded', 'DrawToolbar');
  },
];
