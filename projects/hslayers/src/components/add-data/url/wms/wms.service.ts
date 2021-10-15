import {Injectable} from '@angular/core';

import ImageSource from 'ol/source/Image';
import TileSource from 'ol/source/Tile';
import {Group, Image as ImageLayer, Layer, Tile} from 'ol/layer';
import {Options as ImageOptions} from 'ol/layer/BaseImage';
import {ImageWMS, Source, TileWMS} from 'ol/source';
import {Options as TileOptions} from 'ol/layer/BaseTile';
import {WMSCapabilities} from 'ol/format';
import {transformExtent} from 'ol/proj';

//FIX ME
//refactor
import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsConfig} from '../../../../config.service';
import {HsDimensionService} from '../../../../common/get-capabilities/dimension.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUrlTypeServiceModel} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWmsGetCapabilitiesService} from '../../../../common/get-capabilities/wms-get-capabilities.service';
import {
  WMSGetCapabilitiesResponse,
  WmsLayer,
} from '../../../../common/get-capabilities/wms-get-capabilities-response.interface';
import {addAnchors} from '../../../../common/attribution-utils';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {getName, getTitle} from '../../../../common/layer-extensions';
import {getPreferredFormat} from '../../../../common/format-utils';
import {urlDataObject} from '../types/data-object.type';

@Injectable({providedIn: 'root'})
export class HsUrlWmsService implements HsUrlTypeServiceModel {
  data: urlDataObject;
  constructor(
    public hsMapService: HsMapService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsDimensionService: HsDimensionService,
    public hsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsAddDataService: HsAddDataService,
    public hsEventBusService: HsEventBusService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    this.data = {
      add_under: null,
      map_projection: '',
      register_metadata: true,
      tile_size: 512,
      use_resampling: false,
      use_tiles: true,
      visible: true,
    };

    this.hsEventBusService.olMapLoads.subscribe(() => {
      this.data.map_projection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });
  }

  async addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper
  ): Promise<void> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.hsAddDataCommonService.throwParsingError(wrapper.response.message);
      return;
    }
    try {
      await this.capabilitiesReceived(
        wrapper.response,
        this.hsAddDataCommonService.layerToSelect
      );
      if (this.hsAddDataCommonService.layerToSelect) {
        this.addLayers(true);
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
    }
  }

  /**
   * Expands all sibling cells belonging to the same row after overflown cell is clicked
   */
  expandTableRow(e): void {
    const action = e.target.className.includes('hs-wms-expandedRow')
      ? 'remove'
      : 'add';
    if (this.hsUtilsService.isOverflown(e.target) || action == 'remove') {
      const selectedRow = e.target.parentElement;
      for (const el of selectedRow.children) {
        el.classList[action]('hs-wms-expandedRow');
      }
    }
  }

  /**
   * Fills list of available projections
   */
  fillProjections(caps, response): void {
    if (caps.Capability.Layer.CRS !== undefined) {
      this.data.srss = caps.Capability.Layer.CRS;
    } else if (
      caps.Capability.Layer.Layer &&
      caps.Capability.Layer.Layer.length > 0 &&
      caps.Capability.Layer.Layer[0].CRS
    ) {
      this.data.srss = caps.Capability.Layer.Layer[0].CRS;
    } else {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;
      doc.querySelectorAll('Capability>Layer CRS').forEach((srs) => {
        this.data.srss.push(srs.innerHTML);
      });
      /**
       * SRS is a malformed input and an error but let's be generous...
       */
      if (this.data.srss.length == 0) {
        doc.querySelectorAll('Capability>Layer SRS').forEach((srs) => {
          this.data.srss.push(srs.innerHTML);
        });
      }
      //filter out duplicate records
      this.data.srss = [...new Set(this.data.srss)];
    }
    if (this.data.srss.length == 0) {
      this.data.srss = ['EPSG:4326'];
      this.hsAddDataCommonService.throwParsingError(
        "No CRS found in the service's Capabilities. This is an error on the provider's site. Guessing WGS84 will be supported. This may or may not be correct."
      );
    }
  }

  async capabilitiesReceived(response, layerToSelect: string): Promise<void> {
    try {
      const parser = new WMSCapabilities();
      const caps: WMSGetCapabilitiesResponse = parser.read(response);
      this.data.map_projection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      this.data.title = caps.Service.Title || 'Wms layer';
      this.data.description = addAnchors(caps.Service.Abstract);
      this.data.version = caps.Version || caps.version;
      this.data.image_formats = caps.Capability.Request.GetMap.Format
        ? (caps.Capability.Request.GetMap.Format as Array<string>)
        : [];
      this.data.query_formats = caps.Capability.Request.GetFeatureInfo
        ? (caps.Capability.Request.GetFeatureInfo.Format as Array<string>)
        : [];
      this.data.exceptions = caps.Capability.Exception;
      this.data.srss = [];
      this.fillProjections(caps, response);
      //TODO: WHY?
      if (this.data.srss.includes('CRS:84')) {
        this.data.srss.splice(this.data.srss.indexOf('CRS:84'), 1);
      }
      if (
        this.hsAddDataCommonService.currentProjectionSupported(this.data.srss)
      ) {
        this.data.srs = this.data.srss.includes(
          this.hsMapService.map.getView().getProjection().getCode()
        )
          ? this.hsMapService.map.getView().getProjection().getCode()
          : this.hsMapService.map
              .getView()
              .getProjection()
              .getCode()
              .toLowerCase();
      } else if (this.data.srss.includes('EPSG:4326')) {
        this.data.srs = 'EPSG:4326';
      } else {
        this.data.srs = this.data.srss[0];
      }
      this.data.resample_warning = this.hsAddDataCommonService.srsChanged(
        this.data.srs
      );
      this.data.services = this.filterCapabilitiesLayers(caps.Capability.Layer);

      //Make sure every service has a title to be displayed in table
      for (const service of this.data.services) {
        if (service.Title.length == 0) {
          service.Title = service.Name;
        }
      }

      const serviceLayer = this.hsAddDataUrlService.selectLayerByName(
        layerToSelect,
        this.data.services,
        'Name'
      );

      //TODO: shalln't we move this logic after the layer is added to map?
      if (layerToSelect) {
        this.data.extent = this.getLayerBBox(serviceLayer);
      } else {
        this.data.extent = this.calcAllLayersExtent(this.data.services);
      }
      this.hsAddDataUrlService.selectLayerByName(
        layerToSelect,
        this.data.services,
        'Name'
      );
      this.hsDimensionService.fillDimensionValues(caps.Capability.Layer);

      this.data.get_map_url = this.removePortIfProxified(
        caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource
      );
      this.data.image_format = getPreferredFormat(this.data.image_formats, [
        'image/png; mode=8bit',
        'image/png',
        'image/gif',
        'image/jpeg',
      ]);
      this.data.query_format = getPreferredFormat(this.data.query_formats, [
        'application/vnd.esri.wms_featureinfo_xml',
        'application/vnd.ogc.gml',
        'application/vnd.ogc.wms_xml',
        'text/plain',
        'text/html',
      ]);
      this.hsAddDataCommonService.loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * For given array of layers (service layer definitions) it calculates a cumulative bounding box which encloses all the layers
   */
  calcAllLayersExtent(serviceLayers: any): any {
    if (!Array.isArray(serviceLayers)) {
      return this.getLayerBBox(serviceLayers);
    }
    return serviceLayers
      .map((lyr) => this.getLayerBBox(lyr))
      .reduce((acc, curr) => {
        //some services define layer bboxes beyond the canonical 180/90 degrees intervals, the checks are necessary then
        const [west, south, east, north] = curr;
        //minimum easting
        if (-180 <= west < acc[0]) {
          acc[0] = west;
        }
        //minimum northing
        if (-90 <= south < acc[1]) {
          acc[1] = south;
        }
        //maximum easting
        if (180 >= east > acc[2]) {
          acc[2] = east;
        }
        //maximum northing
        if (90 >= north > acc[3]) {
          acc[3] = north;
        }
        return acc;
      });
  }

  getLayerBBox(serviceLayer: any): any {
    return serviceLayer.EX_GeographicBoundingBox; // TODO: ?? serviceLayer.BoundingBox; (is more complex, contains SRS definition etc.)
  }

  //TODO: what is the reason to do such things?
  filterCapabilitiesLayers(layers: WmsLayer | Array<WmsLayer>): Array<any> {
    if (Array.isArray(layers)) {
      return layers;
    }
    let tmp = [];
    if (typeof layers == 'object') {
      if (layers.Layer && Array.isArray(layers.Layer)) {
        const layersWithNameParam = layers.Layer.filter((layer) => layer.Name);
        if (layersWithNameParam.length > 0) {
          return layersWithNameParam;
        }
        for (const layer of layers.Layer) {
          if (Array.isArray(layer?.Layer)) {
            tmp.push(...layer.Layer.filter((layer) => layer.Name));
          }
        }
      } else {
        tmp = [layers];
      }
    }
    return tmp;
  }

  /**
   * Removes extra port which is added to the getMap request when
   * GetCapabilities is queried through proxy. <GetMap><DCPType><HTTP><Get>
   * \<OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/maps"/\>
   * then becomes <GetMap><DCPType><HTTP><Get>
   * \<OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz:8085/cgi-bin/mapserv?map=/home/maps"/\>
   * which is wrong.
   * @param url - URL for which to remove port but only when proxified
   * with port in proxy path.
   * @returns URL without proxy services port added to it.
   */
  removePortIfProxified(url: string): string {
    if (this.hsConfig.proxyPrefix === undefined) {
      return url;
    }
    const proxyPort = parseInt(
      this.hsUtilsService.getPortFromUrl(this.hsConfig.proxyPrefix)
    );
    if (proxyPort > 0) {
      return url.replace(':' + proxyPort.toString(), '');
    }
    return url;
  }

  /**
   * Second step in adding layers to the map, with resampling or without. Loops through the list of layers and calls addLayer.
   * @param checkedOnly - Add all available layers or only checked ones. checkedOnly=false=all
   */
  addLayers(checkedOnly: boolean): void {
    if (this.data.services === undefined) {
      return;
    }
    //Limit visible layers to 10 to not freeze accidentally
    this.data.visible =
      this.data.services.filter((l) => l.checked === true).length <= 10;
    if (this.data.base) {
      this.addLayer(
        {},
        {
          layerName: this.data.title.replace(/\//g, '&#47;'),
          layerTitle: this.hsUtilsService.undefineEmptyString(
            this.data.folder_name
          ),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
          subLayers: null,
        }
      );
    } else {
      for (const layer of this.data.services) {
        this.addLayersRecursively(layer, {checkedOnly: checkedOnly});
      }
      this.zoomToLayers();
    }
    this.data.base = false;
    this.hsLayoutService.setMainPanel('layermanager');
  }

  /**
   * Add selected layer to map
   * @param layer - capabilities layer object
   * @param layerName - layer name in the map
   * @param path - Path (folder) name
   * @param imageFormat - Format in which to serve image. Usually: image/png
   * @param queryFormat - See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param tileSize - Tile size in pixels
   * @param crs - of the layer
   * @param subLayers - Static sub-layers of the layer
   */
  addLayer(layer, options: addLayerOptions): void {
    let attributions = [];
    if (layer.Attribution) {
      attributions = [
        `<a href="${layer.Attribution.OnlineResource}">${layer.Attribution.Title}</a>`,
      ];
    }

    let boundingbox = layer.BoundingBox;
    let preferred;
    if (Array.isArray(layer.BoundingBox)) {
      preferred = boundingbox.filter((bboxInCrs) => {
        return bboxInCrs.crs == this.data.map_projection;
      })[0];
    }
    if (preferred) {
      boundingbox = preferred.extent;
    } else if (options.crs !== undefined) {
      if (layer.EX_GeographicBoundingBox !== undefined) {
        boundingbox = transformExtent(
          layer.EX_GeographicBoundingBox,
          'EPSG:4326',
          this.hsMapService.map.getView().getProjection()
        );
      }
    } else {
      if (this.data.map_projection != options.crs) {
        boundingbox = layer.LatLonBoundingBox;
      }
    }
    const dimensions = {};
    if (layer.Dimension) {
      for (const val of layer.Dimension) {
        dimensions[val.name] = val;
      }
    }

    const {styles, legends} = this.getLayerStyles(layer);
    const sourceOptions = {
      url: this.data.get_map_url,
      attributions,
      projection: this.data.srs,
      params: {
        LAYERS: this.data.base
          ? this.hsAddDataCommonService.createBasemapName(
              this.data.services,
              'Name'
            )
          : layer.Name,
        INFO_FORMAT: layer.queryable ? options.queryFormat : undefined,
        FORMAT: options.imageFormat,
        VERSION: this.data.version,
        STYLES: styles,
        ...this.hsDimensionService.paramsFromDimensions(layer),
      },
      crossOrigin: 'anonymous',
    };
    const source: ImageWMS | TileWMS = !this.data.use_tiles
      ? new ImageWMS(sourceOptions)
      : new TileWMS(sourceOptions);
    const metadata =
      this.hsWmsGetCapabilitiesService.getMetadataObjectWithUrls(layer);
    const layerOptions = {
      title: options.layerName,
      name: options.layerName,
      source,
      minResolution: layer.MinScaleDenominator,
      maxResolution: layer.MaxScaleDenominator,
      removable: true,
      abstract: layer.Abstract,
      metadata,
      extent: boundingbox,
      path: options.path,
      dimensions: dimensions,
      legends: legends,
      subLayers: options.subLayers,
      base: this.data.base,
      visible: this.data.visible,
    };
    const new_layer = !this.data.use_tiles
      ? new ImageLayer(layerOptions as ImageOptions<ImageSource>)
      : new Tile(layerOptions as TileOptions<TileSource>);
    this.hsMapService.proxifyLayerLoader(new_layer, this.data.use_tiles);
    this.hsAddDataService.addLayer(new_layer, this.data.add_under);
  }

  private getLayerStyles(layer: any): {styles: string[]; legends: string[]} {
    const legends = [];
    let styles = undefined;
    if (layer.styleSelected) {
      styles = layer.styleSelected.Name;
      if (layer.styleSelected.LegendURL?.length > 0) {
        legends.push(layer.styleSelected.LegendURL[0].OnlineResource);
      }
    } else if (layer.Style && layer.Style.length > 0) {
      const firstStyle = layer.Style[0];
      styles = firstStyle.Name;
      if (firstStyle.LegendURL) {
        legends.push(firstStyle.LegendURL[0].OnlineResource);
      }
    } else {
      styles = '';
    }
    return {styles, legends};
  }

  /**
   * FIXME: UNUSED
   * Add service and its layers to project
   * @param url - Service URL
   * @param addUnder - OL layer before which to add new layer
   * @param path - Folder name with path to group layers
   * @param group - Group layer to which add layer to
   * @param layerName - Name of layer to add. If not specified then all layers are added
   */
  async addService(
    url: string,
    group: Group,
    layerName: string,
    addUnder?: Layer<Source>,
    path?: string
  ): Promise<void> {
    const wrapper = await this.hsWmsGetCapabilitiesService.request(url);

    let ol_layers = this.hsWmsGetCapabilitiesService.service2layers(
      wrapper.response,
      path
    );
    if (layerName) {
      ol_layers = ol_layers.filter(
        (layer) =>
          getName(layer) == layerName ||
          (getName(layer) == undefined && //Backwards compatibility with layman when title==name
            getTitle(layer) == layerName)
      );
    }
    ol_layers.forEach((layer) => {
      if (group !== undefined) {
        group.getLayers().push(layer);
      } else {
        this.hsAddDataService.addLayer(layer, addUnder);
      }
    });
  }

  addLayersRecursively(
    layer: any,
    options: addLayersRecursivelyOptions = {checkedOnly: true}
  ): void {
    if (!options.checkedOnly || layer.checked) {
      if (layer.Layer === undefined) {
        this.addLayer(layer, {
          layerName: layer.Title.replace(/\//g, '&#47;'),
          layerTitle: this.hsUtilsService.undefineEmptyString(
            this.data.folder_name
          ),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
          subLayers: this.hsAddDataCommonService.getSublayerNames(layer),
        });
      } else {
        const clone = this.hsUtilsService.structuredClone(layer);
        delete clone.Layer;
        this.addLayer(layer, {
          layerName: layer.Title.replace(/\//g, '&#47;'),
          layerTitle: this.hsUtilsService.undefineEmptyString(
            this.data.folder_name
          ),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
          subLayers: this.hsAddDataCommonService.getSublayerNames(layer),
        });
      }
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer, {checkedOnly: options.checkedOnly});
      }
    }
  }

  private zoomToLayers() {
    if (this.data.extent) {
      const extent = transformExtent(
        this.data.extent,
        'EPSG:4326',
        this.hsMapService.map.getView().getProjection()
      );
      if (extent) {
        this.hsMapService.fitExtent(extent);
      }
    }
  }
}