'use strict';

define(['angular', 'ol', 'toolbar', 'layermanager', 'sidebar', 'map', 'ows', 'query', 'search', 'permalink', 'measure', 'legend', 'bootstrap', 'geolocation', 'core', 'datasource_selector', 'api', 'angular-gettext', 'translations', 'compositions', 'status_creator', 'info'],

    function(angular, ol, toolbar, layermanager) {
        var module = angular.module('hs', [
            'hs.sidebar',
            'hs.toolbar',
            'hs.layermanager',
            'hs.map',
            'hs.query',
            'hs.search', 'hs.permalink', 'hs.measure',
            'hs.geolocation', 'hs.core',
            'hs.datasource_selector',
            'hs.status_creator',
            'hs.api',
            'hs.ows',
            'gettext',
            'hs.compositions',
            'hs.info'
        ]);

        module.directive('hs', ['hs.map.service', 'Core', function(OlMap, Core) {
            return {
                templateUrl: hsl_path + 'hslayers.html',
                link: function(scope, element) {
                    Core.fullScreenMap(element);
                }
            };
        }]);

        module.value('config', {
            box_layers: [
                new ol.layer.Group({
                    'img': 'osm.png',
                    title: 'Base layer',
                    layers: [
                        new ol.layer.Tile({
                            source: new ol.source.OSM(),
                            title: "OpenStreetMap",
                            base: true,
                            visible: true,
                            removable: false
                        }),
                        new ol.layer.Tile({
                            title: "OpenCycleMap",
                            visible: false,
                            base: true,
                            source: new ol.source.OSM({
                                url: 'http://{a-c}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png'
                            })
                        }),
                        new ol.layer.Tile({
                            title: "Satellite",
                            visible: false,
                            base: true,
                            source: new ol.source.XYZ({
                                url: 'http://api.tiles.mapbox.com/v4/mapbox.streets-satellite/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoicmFpdGlzYmUiLCJhIjoiY2lrNzRtbGZnMDA2bXZya3Nsb2Z4ZGZ2MiJ9.g1T5zK-bukSbJsOypONL9g'
                            })
                        })
                    ],
                }), new ol.layer.Group({
                    'img': 'armenia.png',
                    title: 'WMS layers',
                    layers: [
                        new ol.layer.Tile({
                            title: "Swiss",
                            source: new ol.source.TileWMS({
                                url: 'http://wms.geo.admin.ch/',
                                params: {
                                    LAYERS: 'ch.swisstopo.pixelkarte-farbe-pk1000.noscale',
                                    INFO_FORMAT: undefined,
                                    FORMAT: "image/png; mode=8bit"
                                },
                                crossOrigin: null
                            }),
                        })
                    ]
                })
            ],
            default_view: new ol.View({
                center: ol.proj.transform([17.474129, 52.574000], 'EPSG:4326', 'EPSG:3857'), //Latitude longitude    to Spherical Mercator
                zoom: 4,
                units: "m"
            }),
            connectTypes: ['', 'WMS', 'WMTS', 'GeoJSON', 'KML'],
            compositions_catalogue_url: 'http://otn-production.intrasoft-intl.com/php/metadata/csw/',
            status_manager_url: 'http://otn-production.intrasoft-intl.com/wwwlibs/statusmanager2/index.php',
            datasources: [{
                title: "Hub layers",
                url: "http://otn-production.intrasoft-intl.com/php/metadata/csw/",
                language: 'eng',
                type: "micka",
                code_list_url: 'http://otn-production.intrasoft-intl.com/php/metadata/util/codelists.php?_dc=1440156028103&language=eng&page=1&start=0&limit=25&filter=%5B%7B%22property%22%3A%22label%22%7D%5D'
            }]
        });

        module.controller('Main', ['$scope', 'Core', 'hs.query.service_infopanel', 'hs.compositions.service_parser', 'config',
            function($scope, Core, InfoPanelService, composition_parser, config) {
                if (console) console.log("Main called");
                $scope.hsl_path = hsl_path; //Get this from hslayers.js file
                $scope.Core = Core;
                Core.sidebarRight = false;
                Core.singleDatasources = true;
                $scope.$on('infopanel.updated', function(event) {
                    if (console) console.log('Attributes', InfoPanelService.attributes, 'Groups', InfoPanelService.groups);
                });
            }
        ]);

        return module;
    });
