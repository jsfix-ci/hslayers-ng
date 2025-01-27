import {Injectable} from '@angular/core';

import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {WMSCapabilities} from 'ol/format';
import {transformExtent} from 'ol/proj';

import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerManagerMetadataService} from '../layermanager-metadata.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLegendDescriptor} from '../../legend/legend-descriptor.interface';
import {HsLegendService} from '../../legend/legend.service';
import {HsMapService} from '../../map/map.service';
import {HsWmsGetCapabilitiesService} from '../../../common/get-capabilities/wms-get-capabilities.service';
import {
  getCluster,
  getInlineLegend,
  setCluster,
} from '../../../common/layer-extensions';

class HsLayerEditorServiceParams {
  legendDescriptor: HsLegendDescriptor;
}

@Injectable({
  providedIn: 'root',
})
export class HsLayerEditorService {
  apps: {
    [id: string]: HsLayerEditorServiceParams;
  } = {default: new HsLayerEditorServiceParams()};

  layerTitleChange: Subject<{
    newTitle: string;
    oldTitle: string;
    layer: Layer<Source>;
  }> = new Subject();

  constructor(
    public HsMapService: HsMapService,
    public HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public HsLegendService: HsLegendService,
    public HsLayerSelectorService: HsLayerSelectorService,
    public HsLayerManagerMetadataService: HsLayerManagerMetadataService
  ) {
    this.HsLayerSelectorService.layerSelected.subscribe(
      async ({layer, app}) => {
        this.get(app).legendDescriptor =
          await this.HsLegendService.getLayerLegendDescriptor(layer.layer, app);
      }
    );
  }
  get(app: string) {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsLayerEditorServiceParams();
    }
    return this.apps[app ?? 'default'];
  }
  /**
   * Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabilities request (for WMS layer)
   * @param layer - OpenLayers layer to zoom to
   */
  async zoomToLayer(layer: Layer<Source>, app: string): Promise<boolean> {
    let extent = null;
    if (layer.getExtent()) {
      extent = layer.getExtent();
    } else if ((<any>layer.getSource()).getExtent != undefined) {
      extent = (<any>layer.getSource()).getExtent();
    }
    if (extent) {
      this.fitIfExtentSet(extent, layer, app);
      return true;
    }
    if (extent === null && this.HsLayerUtilsService.isLayerWMS(layer)) {
      const url = this.HsLayerUtilsService.getURL(layer);
      const wrapper = await this.HsWmsGetCapabilitiesService.request(url, app);
      const parser = new WMSCapabilities();
      const caps = parser.read(wrapper.response);
      if (Array.isArray(caps.Capability.Layer.Layer)) {
        const foundDefs = caps.Capability.Layer.Layer.map((lyr) =>
          this.HsLayerManagerMetadataService.identifyLayerObject(
            this.HsLayerUtilsService.getLayerParams(layer)?.LAYERS,
            lyr
          )
        ).filter((item) => item);
        const foundDef = foundDefs.length > 0 ? foundDefs[0] : null;
        if (foundDef) {
          extent = foundDef.EX_GeographicBoundingBox || foundDef.BoundingBox;
          this.fitIfExtentSet(
            this.transformToCurrentProj(extent, app),
            layer,
            app
          );
          return true;
        }
      } else if (typeof caps.Capability.Layer == 'object') {
        extent =
          caps.Capability.Layer.EX_GeographicBoundingBox ||
          caps.Capability.Layer.BoundingBox;
        this.fitIfExtentSet(
          this.transformToCurrentProj(extent, app),
          layer,
          app
        );
        return true;
      } else {
        return false;
      }
    }
  }

  /**
   * Set cluster for layer
   * @param layer - Layer
   * @param newValue - To cluster or not to cluster
   * @param distance - Distance in pixels
   * @returns Current cluster state
   */
  cluster(
    layer: Layer<Source>,
    newValue: boolean,
    distance: number,
    app: string
  ): boolean {
    if (layer == undefined) {
      return;
    }
    if (newValue != undefined) {
      setCluster(layer, newValue);
      this.HsLayerEditorVectorLayerService.cluster(
        newValue,
        layer,
        distance,
        !this.HsLayerEditorVectorLayerService.layersClusteredFromStart.includes(
          layer
        ),
        app
      );
      this.HsEventBusService.compositionEdits.next({app});
    } else {
      return getCluster(layer);
    }
  }

  /**
   * @typedef {Array<number>} Extent
   * @param {Extent} extent - Extent in EPSG:4326
   * @param layer
   */
  fitIfExtentSet(extent: number[], layer: Layer<Source>, app: string): void {
    if (extent !== null) {
      layer.setExtent(extent);
      this.HsMapService.fitExtent(extent, app);
    }
  }

  /**
   * @param extent
   */
  transformToCurrentProj(extent: number[], app: string): number[] {
    return transformExtent(
      extent,
      'EPSG:4326',
      this.HsMapService.getCurrentProj(app)
    );
  }

  legendVisible(app: string): boolean {
    const legendDescriptor = this.get(app).legendDescriptor;
    return (
      this.HsLegendService.legendValid(legendDescriptor) &&
      (getInlineLegend(legendDescriptor.lyr) ||
        !this.HsLayoutService.panelEnabled('legend', app))
    );
  }

  /**
   * Test if layer is Vector layer
   * @param layer - Selected layer
   */
  isLayerVectorLayer(layer: Layer<Source>): boolean {
    return this.HsLayerUtilsService.isLayerVectorLayer(layer);
  }
}
