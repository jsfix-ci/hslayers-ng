import {Component} from '@angular/core';

import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmtsGetCapabilitiesService} from '../../../../common/wmts/get-capabilities.service';

import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Tile} from 'ol/layer';
import {addAnchors} from '../../../../common/attribution-utils';

@Component({
  selector: 'hs-add-data-url-wmts',
  templateUrl: './addData-url-wmts.html',
  //TODO: require('./add-wms-layer.md.directive.html')
})
export class HsAddDataWmtsComponent {
  [x: string]: any;
  style = '';
  tileMatrixSet = '';
  image_format = '';
  map_projection: any;
  loaderImage: any;
  layersLoading: boolean;
  showDetails: boolean;
  url: any;
  caps: any;
  title: any;
  description: any;
  version: any;
  services: any;

  constructor(
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public HsEventBusService: HsEventBusService,
    public HsLogService: HsLogService
  ) {
    this.map_projection = this.HsMapService.map
      .getView()
      .getProjection()
      .getCode()
      .toUpperCase();

    this.HsEventBusService.owsCapabilitiesReceived.subscribe(
      async ({type, response}) => {
        if (type === 'WMTS') {
          try {
            if (this.showDetails == true) {
              this.capabilitiesReceived(response.data);
            }
          } catch (e) {
            console.warn(e);
          }
        }
      }
    );

    this.hsEventBusService.owsConnecting.subscribe(({type, uri, layer}) => {
      if (type == 'wmts') {
        this.layerToAdd = layer;
        this.setUrlAndConnect(uri);
      }
    });
  }

  connect = (): void => {
    try {
      this.layersLoading = true;
      this.HsWmtsGetCapabilitiesService.requestGetCapabilities(this.url);
    } catch (e) {
      console.warn(e);
    }
    this.showDetails = true;
  };

  selectAllLayers(layers: any[]): void {
    for (const layer of layers) {
      layer.checked = !layer.checked;
      if (layer.Layer) {
        this.selectAllLayers(layer.Layer);
      }
    }
    this.changed();
  }

  checked(): boolean {
    for (const layer of this.services) {
      if (layer.checked) {
        return true;
      }
    }
    return false;
  }

  changed(): void {
    this.isChecked = this.checked();
  }

  setUrlAndConnect(url: string): void {
    this.url = url;
    this.connect();
  }

  addLayers(checkedOnly: boolean): void {
    this.addAll = checkedOnly;
    for (const layer of this.HsAddDataWfsService.services) {
      this.addLayersRecursively(layer);
    }
  }

  private addLayersRecursively(layer): void {
    if (!this.addAll || layer.checked) {
      this.addLayer(layer);
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer);
      }
    }
  }
  /**
   * Parse information recieved in WMTS getCapabilities respond
   *
   * @memberof hs.addLayersWMTS
   * @function capabilitiesReceived
   * @param {object} response Url of requested service
   */
  capabilitiesReceived(response) {
    try {
      const parser = new WMTSCapabilities();
      const caps = parser.read(response);
      this.caps = caps;
      this.title = caps.ServiceIdentification.Title;

      this.description = addAnchors(caps.ServiceIdentification.Abstract);
      this.version = caps.Version || caps.version;
      this.services = caps.Contents.Layer;

      this.layersLoading = false;
    } catch (e) {
      if (console) {
        this.HsLogService.log(e);
      }
      //throw "wmts Capabilities parsing problem";
    }
  }

  /**
   * Returns prefered tile format
   *
   * @memberof hs.addLayersWMTS
   * @function getPreferedFormat
   * @param {object} formats Set of avaliable formats for layer being added
   */
  getPreferredFormat(formats: any) {
    const prefered = formats.find((format) => format.includes('png'));
    return prefered ? prefered : formats[0];
  }

  /**
   * Returns prefered tile tileMatrixSet
   * Looks for the occurence of supported CRS's, if possible picks CRS of current view
   * otherwise returns 3857 as trial(some services support 3857 matrix set even though its not clear from capabilities )
   *
   * @memberof hs.addLayersWMTS
   * @function getPreferedMatrixSet
   * @param {object} sets Set of avaliable matrixSets
   */
  getPreferredMatrixSet(sets): string {
    const supportedFormats = ['3857', '4326', '5514'];
    const prefered = sets.filter((set) =>
      supportedFormats.some((v) => set.TileMatrixSet.includes(v))
    );
    if (prefered.length != 0) {
      const preferCurrent = prefered.find((set) =>
        set.TileMatrixSet.includes(
          this.HsMapService.map.getView().getProjection().getCode()
        )
      );
      return preferCurrent
        ? preferCurrent.TileMatrixSet
        : prefered[0].TileMatrixSet;
    }
    return 'EPSG:3857';
  }

  /**
   * Returns prefered info format
   * Looks for the occurence of supported formats (query.wms)
   * if possible picks HTML, otherwise first from the list of supported is selected
   *
   * @memberof hs.addLayersWMTS
   * @function getPreferedInfoFormat
   * @param {object} response Set of avaliable info formats for layer being added
   */
  getPreferredInfoFormat(formats): string {
    if (formats) {
      const supportedFormats = ['html', 'xml', 'gml'];
      const infos = formats.filter(
        (format) =>
          format.resourceType == 'FeatureInfo' &&
          supportedFormats.some((v) => format.format.includes(v))
      );
      if (infos.length != 0) {
        const preferHTML = infos.find((format) =>
          format.format.includes('html')
        );
        return preferHTML ? preferHTML.format : infos[0].format;
      }
    }
  }

  /**
   * Add WMTS layer to the map
   * Uses previously recieved capabilities response as a reference for the source
   *
   * @memberof hs.addLayersWMTS
   * @function getPreferedInfoFormat
   * @param {object} response Set of avaliable info formats for layer being added
   */
  addLayer(layer) {
    try {
      const wmts = new Tile({
        title: layer.Title,
        info_format: this.getPreferredInfoFormat(layer.ResourceURL),
        source: new WMTS({}),
        queryCapabilities: false,
      });
      // Get WMTS Capabilities and create WMTS source base on it
      const options = optionsFromCapabilities(this.caps, {
        layer: layer.Identifier,
        matrixSet: this.getPreferredMatrixSet(layer.TileMatrixSetLink),
        format: this.getPreferredFormat(layer.Format),
      });
      // WMTS source for raster tiles layer
      const wmtsSource = new WMTS(options);
      // set the data source for raster and vector tile layers
      wmts.setSource(wmtsSource);
      this.HsMapService.addLayer(wmts, true);
    } catch (e) {
      if (console) {
        this.HsLogService.log(e);
      }
      //throw "wmts Capabilities parsing problem";
    }
  }
}
