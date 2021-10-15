import {Injectable, NgZone} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry} from 'ol/geom';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

import {HsLogService} from '../../../common/log/log.service';
import {HsMapService} from '../../map/map.service';
import {HsSaveMapService} from '../../save-map/save-map.service';
import {
  getHighlighted,
  getRecord,
  setHighlighted,
} from '../../../common/feature-extensions';
import {
  setShowInLayerManager,
  setTitle,
} from '../../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataCatalogueMapService {
  extentLayer: VectorLayer<VectorSource<Geometry>> = new VectorLayer({
    source: new Vector(),
    style: function (feature, resolution) {
      return [
        new Style({
          stroke: new Stroke({
            color: '#005CB6',
            width: getHighlighted(feature as Feature<Geometry>) ? 4 : 1,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.01)',
          }),
        }),
      ];
    },
  });

  constructor(
    public hsMapService: HsMapService,
    public hsLogService: HsLogService,
    private hsSaveMapService: HsSaveMapService,
    private zone: NgZone
  ) {
    setTitle(this.extentLayer, 'Datasources extents');
    setShowInLayerManager(this.extentLayer, false);
    this.hsMapService.loaded().then((map) => this.init(map));
  }

  /**
   * @param evt -
   */
  mapPointerMoved(evt): void {
    const featuresUnderMouse = this.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    const highlightedFeatures = this.extentLayer
      .getSource()
      .getFeatures()
      .filter((feature) => getRecord(feature).highlighted);

    const dontHighlight = highlightedFeatures.filter(
      (feature) => !featuresUnderMouse.includes(feature)
    );
    const highlight = featuresUnderMouse.filter(
      (feature) => !highlightedFeatures.includes(feature)
    );
    if (dontHighlight.length > 0 || highlight.length > 0) {
      this.zone.run(() => {
        for (const feature of highlight) {
          getRecord(feature).highlighted = true;
        }
        for (const feature of dontHighlight) {
          getRecord(feature).highlighted = false;
        }
      });
    }
  }

  /**
   * @param map -
   */
  init(map): void {
    map.on('pointermove', (evt) => this.mapPointerMoved(evt));
    map.addLayer(this.extentLayer);
    this.hsSaveMapService.internalLayers.push(this.extentLayer);
  }

  clearExtentLayer(): void {
    this.extentLayer.getSource().clear();
  }

  /**
   * @param dataset - Configuration of selected datasource (from app config)
   * Remove layer extent features from map
   */
  clearDatasetFeatures(dataset): void {
    if (dataset.layers) {
      dataset.layers.forEach((val) => {
        try {
          if (val) {
            this.extentLayer.getSource().clear();
          }
        } catch (ex) {
          this.hsLogService.warn(ex);
        }
      });
    }
  }

  /**
   * Test if it possible to zoom to layer overview (bbox has to be defined
   * in metadata of selected layer)
   * @param layer - TODO
   * @returns Returns if bbox is specified and thus layer is zoomable
   */
  isZoomable(layer): boolean {
    return layer.bbox !== undefined;
  }

  /**
   * Callback function which gets executed when extent feature
   * is created. It should add the feature to vector layer source
   * @param extentFeature - OpenLayers Feature
   */
  addExtentFeature(extentFeature: Feature<Geometry>): void {
    this.extentLayer.getSource().addFeatures([extentFeature]);
  }

  highlightLayer(composition, state): void {
    if (composition.feature !== undefined) {
      setHighlighted(composition.feature, state);
    }
  }

  /**
   * ZoomTo / MoveTo to selected layer overview
   * @param bbox - Bounding box of selected layer
   */
  zoomTo(bbox): void {
    if (bbox === undefined) {
      return;
    }
    let b = null;
    if (typeof bbox === 'string') {
      b = bbox.split(' ');
    } else if (Array.isArray(bbox)) {
      b = bbox;
    }
    let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
    let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
    first_pair = transform(
      first_pair,
      'EPSG:4326',
      this.hsMapService.map.getView().getProjection()
    );
    second_pair = transform(
      second_pair,
      'EPSG:4326',
      this.hsMapService.map.getView().getProjection()
    );
    if (
      isNaN(first_pair[0]) ||
      isNaN(first_pair[1]) ||
      isNaN(second_pair[0]) ||
      isNaN(second_pair[1])
    ) {
      return;
    }
    const extent = [
      first_pair[0],
      first_pair[1],
      second_pair[0],
      second_pair[1],
    ];
    this.hsMapService.fitExtent(extent);
  }
}