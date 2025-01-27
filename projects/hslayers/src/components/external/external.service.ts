import {Injectable} from '@angular/core';

import BaseLayer from 'ol/layer/Base';
import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {ObjectEvent} from 'ol/Object';
import {Source} from 'ol/source';
import {Vector as VectorSource} from 'ol/source';
import {getCenter} from 'ol/extent';

import {DOMFeatureLink} from '../../common/dom-feature-link.type';
import {
  DOM_FEATURE_LINKS,
  getDomFeatureLinks,
} from '../../common/layer-extensions';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsMapService} from '../map/map.service';
import {HsQueryPopupService} from '../query/query-popup.service';
import {HsUtilsService} from '../utils/utils.service';

export type FeatureDomEventLink = {
  handles: EventListenerOrEventListenerObject[];
  layer: Layer<Source>;
  domElements: Element[];
  event: string;
};

export interface FeatureDomEventLinkDict {
  [key: string]: FeatureDomEventLink;
}

@Injectable({
  providedIn: 'root',
})
export class HsExternalService {
  featureLinks: FeatureDomEventLinkDict = {};
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsQueryPopupService: HsQueryPopupService
  ) {}

  async init(app: string) {
    await this.hsMapService.loaded(app);
    const map = this.hsMapService.getMap(app);
    for (const layer of map.getLayers().getArray()) {
      this.layerAdded(layer as Layer<Source>, app);
    }
    map.getLayers().on('add', (e) => this.layerAdded(e.element, app));
    map.getLayers().on('remove', (e) => this.layerRemoved(e.element));
  }

  layerRemoved(layer: BaseLayer): void {
    if (this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      for (const key of Object.keys(this.featureLinks)) {
        const link = this.featureLinks[key];
        if (link.layer == layer) {
          this.removeFeatureLink(link);
          delete this.featureLinks[key];
        }
      }
    }
  }

  layerAdded(layer: BaseLayer, app: string): void {
    if (this.hsLayerUtilsService.isLayerVectorLayer(layer)) {
      if (getDomFeatureLinks(layer)) {
        this.processLinks(layer as Layer, app);
      }
      layer.on('propertychange', (e) => {
        this.hsUtilsService.debounce(
          this.layerPropChanged(e, app),
          100,
          false,
          this
        );
      });
    }
  }
  layerPropChanged(e: ObjectEvent, app: string): void {
    if (e.key == DOM_FEATURE_LINKS) {
      this.processLinks(e.target as Layer<Source>, app);
    }
  }

  private processLinks(layer: Layer<any>, app: string) {
    const source: VectorSource<Geometry> =
      this.hsLayerUtilsService.isLayerClustered(layer)
        ? layer.getSource().getSource()
        : layer.getSource();
    for (const link of getDomFeatureLinks(layer)) {
      const domElements = document.querySelectorAll(link.domSelector);
      domElements.forEach((domElement) => {
        const feature = this.getFeature(layer, source, link, domElement);
        if (feature.getId() === undefined) {
          feature.setId(this.hsUtilsService.generateUuid());
        }
        //We dont want to add handlers with the same feature and domElement twice
        if (
          feature &&
          (!this.featureLinks[feature.getId()] ||
            !this.featureLinks[feature.getId()].domElements.includes(
              domElement
            ))
        ) {
          const featureId = feature.getId();
          //This was the only way how to unregister handlers afterwards
          const handler = (e) => {
            for (const action of link.actions) {
              this.actOnFeature(action, feature, domElement, e, app);
            }
          };
          if (!this.featureLinks[featureId]) {
            this.featureLinks[featureId] = {
              handles: [],
              layer,
              domElements: [],
              event: link.event,
            };
          }
          this.featureLinks[featureId].handles.push(handler);
          this.featureLinks[featureId].domElements.push(domElement);
          domElement.addEventListener(link.event, handler);
        }
      });
    }
    source.on('removefeature', (event) => {
      if (!event.features) {
        return;
      }
      for (const removedFeature of event.features) {
        const linkage = this.featureLinks[removedFeature.getId()];
        if (linkage) {
          this.removeFeatureLink(linkage);
          delete this.featureLinks[removedFeature.getId()];
        }
      }
    });
  }

  private removeFeatureLink(linkage: FeatureDomEventLink) {
    for (const handle of linkage.handles) {
      for (const domEl of linkage.domElements) {
        domEl.removeEventListener(linkage.event, handle);
      }
    }
  }

  actOnFeature(
    action:
      | 'zoomToExtent'
      | 'panToCenter'
      | 'showPopup'
      | 'hidePopup'
      | ((feature: Feature<Geometry>, domElement: Element, event: any) => any),
    feature: any,
    domElement: Element,
    e: Event,
    app: string
  ) {
    if (!this.hsMapService.getLayerForFeature(feature, app)?.getVisible()) {
      return;
    }
    const extent = feature.getGeometry().getExtent();
    const center = getCenter(extent);
    const map = this.hsMapService.getMap(app);
    switch (action) {
      case 'zoomToExtent':
        this.hsMapService.fitExtent(extent, app);
        break;
      case 'panToCenter':
        map.getView().setCenter(center);
        break;
      case 'showPopup':
        this.hsQueryPopupService.fillFeatures([feature], app);
        const pixel = map.getPixelFromCoordinate(center);
        this.hsQueryPopupService.showPopup({pixel, map}, app);
        break;
      case 'hidePopup':
        this.hsQueryPopupService.closePopup(app);
        break;
      default:
        if (typeof action == 'function') {
          action(feature, domElement, e);
        }
    }
  }

  private getFeature(
    layer: Layer<Source>,
    source: VectorSource<Geometry>,
    link: DOMFeatureLink,
    domElement: Element
  ): Feature<Geometry> {
    if (typeof link.feature == 'string') {
      return source
        .getFeatures()
        .find((feature) => feature.get('id'), link.feature);
    } else if (this.hsUtilsService.instOf(link.feature, Feature)) {
      return link.feature as Feature<Geometry>;
    } else if (typeof link.feature == 'function') {
      return link.feature(layer, domElement);
    }
  }
}
