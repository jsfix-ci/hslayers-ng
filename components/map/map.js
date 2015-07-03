define(['angular', 'app', 'permalink', 'ol'], function(angular, app, permalink, ol) {
    angular.module('hs.map', ['hs'])
        //This is used to share map object between components.
        .service('OlMap', ['default_view', function(default_view) {
            this.map = new ol.Map({
                target: 'map',
                interactions: [],
                view: default_view
            });

            this.duration = 400;

            this.interactions = {
                'DoubleClickZoom': new ol.interaction.DoubleClickZoom({
                    duration: this.duration
                }),
                'KeyboardPan': new ol.interaction.KeyboardPan({
                    pixelDelta: 256
                }),
                'KeyboardZoom': new ol.interaction.KeyboardZoom({
                    duration: this.duration
                }),
                'MouseWheelZoom': new ol.interaction.MouseWheelZoom({
                    duration: this.duration
                }),
                'PinchRotate': new ol.interaction.PinchRotate(),
                'PinchZoom': new ol.interaction.PinchZoom({
                    duration: this.duration
                }),
                'DragPan': new ol.interaction.DragPan({
                    kinetic: new ol.Kinetic(-0.01, 0.1, 200)
                }),
                'DragZoom': new ol.interaction.DragZoom(),
                'DragRotate': new ol.interaction.DragRotate(),
            }

            var me = this;

            this.findLayerByTitle = function(title) {
                var layers = me.map.getLayers();
                var tmp = null;
                angular.forEach(layers, function(layer) {
                    if (layer.get('title') == title) tmp = layer;
                });
                return tmp;
            }
            angular.forEach(this.interactions, function(value, key) {
                me.map.addInteraction(value);
            });
        }])

    .directive('map', function() {
        return {
            templateUrl: hsl_path + 'components/map/partials/map.html',
            link: function(scope, element) {
                $(".ol-zoomslider", element).width(28).height(200);
            }
        };
    })

    .controller('Map', ['$scope', 'OlMap', 'default_layers', 'box_layers', 'default_view', 'BrowserUrlService',
        function($scope, OlMap, default_layers, box_layers, default_view, bus) {
            var map = OlMap.map;

            $scope.moveToAndZoom = function(x, y, zoom) {
                var view = OlMap.map.getView();
                view.setCenter([x, y]);
                view.setZoom(zoom);
            }

            $scope.getMap = function() {
                return OlMap.map;
            }

            $scope.setTargetDiv = function(div_id) {
                OlMap.map.setTarget(div_id);
            }

            $scope.findLayerByTitle = OlMap.findLayerByTitle;

            $scope.showFeaturesWithAttrHideRest = function(source, attribute, value, attr_to_change, invisible_value, visible_value) {

            }

            angular.forEach(box_layers, function(box) {
                angular.forEach(box.get('layers'), function(lyr) {
                    OlMap.map.addLayer(lyr);
                });
            });
            angular.forEach(default_layers, function(lyr) {
                OlMap.map.addLayer(lyr);
            });
            if (bus.getParamValue('hs_x') && bus.getParamValue('hs_y') && bus.getParamValue('hs_z')) {
                var loc = location.search;
                $scope.moveToAndZoom(parseFloat(bus.getParamValue('hs_x', loc)), parseFloat(bus.getParamValue('hs_y', loc)), parseInt(bus.getParamValue('hs_z', loc)));
            }
            map.addControl(new ol.control.ZoomSlider());
            map.addControl(new ol.control.ScaleLine());
            var mousePositionControl = new ol.control.MousePosition({
                coordinateFormat: ol.coordinate.createStringXY(4),
                undefinedHTML: '&nbsp;'
            });
            $scope.setTargetDiv("map")
                //map.addControl(mousePositionControl);
            $scope.$emit('scope_loaded', "Map");
        }
    ]);
})
