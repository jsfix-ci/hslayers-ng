import {Injectable} from '@angular/core';
import {SerializedStyle} from './types/serialized-style.type';

import Map from 'ol/Map';
import {Circle, Icon, RegularShape, Style} from 'ol/style';
import {
  Cluster,
  ImageArcGISRest,
  ImageStatic,
  ImageWMS,
  Source,
  TileArcGISRest,
  WMTS,
  XYZ,
} from 'ol/source';
import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {GeoJSONFeatureCollection} from 'ol/format/GeoJSON';
import {Geometry} from 'ol/geom';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {Layer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {transformExtent} from 'ol/proj';

import {BoundingBoxObject} from './types/bounding-box-object.type';
import {CompoData} from './types/compo-data.type';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsShareThumbnailService} from '../permalink/share-thumbnail.service';
import {HsUtilsService} from '../utils/utils.service';
import {LayerJSON} from './types/layer-json.type';
import {MapComposition} from './types/map-composition.type';
import {SerializedImage} from './types/serialized-image.type';
import {StatusData} from './types/status-data.type';
import {UserData} from './types/user-data.type';
import {
  getAttribution,
  getBase,
  getDefinition,
  getDimensions,
  getLegends,
  getMetadata,
  getName,
  getOrigLayers,
  getPath,
  getShowInLayerManager,
  getSld,
  getSubLayers,
  getSwipeSide,
  getTitle,
  getWfsUrl,
  getWorkspace,
} from '../../common/layer-extensions';

const LCLSTORAGE_EXPIRE = 5000;

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapService {
  public internalLayers: Layer<Source>[] = [];
  constructor(
    private hsMapService: HsMapService,
    private hsUtilsService: HsUtilsService,
    private hsLogService: HsLogService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsShareThumbnailService: HsShareThumbnailService
  ) {}

  /**
   * Create Json object, which stores information about composition, user, map state and map layers (including layer data)
   * @param map - Selected OL map object
   * @param compoData - Composition general metadata
   * @param userData - Metadata about user
   * @param statusData - Metadata about permissions
   * @param app - App identifier
   * @returns - JSON object with all required map composition's metadata
   */
  map2json(
    map: Map,
    compoData: CompoData,
    userData: UserData,
    statusData: StatusData,
    app: string
  ): MapComposition {
    const groups: any = {};
    for (const g of statusData.groups || []) {
      if (g.r || g.w) {
        groups[g.roleName] = (g.r ? 'r' : '') + (g.w ? 'w' : '');
      }
    }
    if (groups.guest == undefined) {
      groups.guest = 'r';
    }
    const bbox = this.getBboxFromObject(compoData.bbox);
    const json: MapComposition = {
      abstract: compoData.abstract,
      title: compoData.name,
      keywords: compoData.keywords,
      nativeExtent: transformExtent(
        bbox,
        'EPSG:4326',
        this.hsMapService.getCurrentProj(app)
      ),
      extent: bbox,
      user: <UserData>{
        address: userData.address,
        city: userData.city,
        country: userData.country,
        email: userData.email || 'none@none',
        name: userData.name,
        organization: userData.organization,
        phone: userData.phone,
        position: userData.position,
        postalcode: userData.postalCode,
        state: userData.state,
      },
      describedBy:
        'https://raw.githubusercontent.com/hslayers/map-compositions/2.0.0/schema.json',
      schema_version: '2.0.0',
      groups: groups,
    };

    // Map properties
    const currentProj = this.hsMapService.getCurrentProj(app);
    json.scale = currentProj.getMetersPerUnit();
    json.projection = currentProj.getCode().toLowerCase();
    const center = map.getView().getCenter();
    if (center) {
      json.center = [center[0], center[1]];
    }
    json.units = currentProj.getUnits();

    //*NOTE Does not exist on OL map anymore
    // if (map.maxExtent) {
    //   json.maxExtent = {};
    //   json.maxExtent.left = map.maxExtent.left;
    //   json.maxExtent.bottom = map.maxExtent.bottom;
    //   json.maxExtent.right = map.maxExtent.right;
    //   json.maxExtent.top = map.maxExtent.top;
    // }

    //json.minResolution = map.minResolution;
    //json.maxResolution = map.maxResolution;
    //json.numZoomLevels = map.numZoomLevels;

    //json.resolutions = map.resolutions;
    //json.scales = map.scales;
    //json.sphericalMercator = map.sphericalMercator;

    // Layers properties
    const olLayers = compoData.layers.map((l) => l.layer);
    json.layers = this.layers2json(olLayers, app);
    json.current_base_layer = this.getCurrentBaseLayer(app);
    return json;
  }
  /**
   * Get currently selected base layer from the OL map
   * @param app - App identifier
   * @returns Object with currently selected base layer's title as attribute
   */
  getCurrentBaseLayer(app: string) {
    let current_base_layer = null;
    for (const lyr of this.hsMapService.getLayersArray(app)) {
      if (
        (getShowInLayerManager(lyr) == undefined ||
          getShowInLayerManager(lyr) == true) &&
        getBase(lyr) == true &&
        lyr.getVisible()
      ) {
        current_base_layer = {
          title: getTitle(lyr),
        };
      }
    }
    return current_base_layer;
  }

  /**
   * Get bounding box from object {east: value, south: value, west: value, north: value}
   * @param bbox - Bounding box
   * @returns Returns bounding box as number array
   */
  getBboxFromObject(bbox: number[] | BoundingBoxObject): number[] {
    if (bbox && !Array.isArray(bbox)) {
      return [
        parseFloat(bbox.east),
        parseFloat(bbox.south),
        parseFloat(bbox.west),
        parseFloat(bbox.north),
      ];
    } else {
      return bbox as number[];
    }
  }

  /**
   * Convert map layers into a JSON object
   * Uses layer2json().
   * @param layers - All map layers
   * @param app - App identifier
   * @returns JSON object representing the layers
   */
  layers2json(layers: Layer[], app: string): LayerJSON[] {
    const json: LayerJSON[] = [];
    layers.forEach((layer) => {
      const l = this.layer2json(layer, app);
      if (l) {
        json.unshift(l);
      }
    });
    return json;
  }

  /**
   * Converts map layer from Layer object to text in JSON notation.
   *
   * Syntactic sugar for layer2json() UNUSED?
   *
   * @param layer - Layer to be converted
   * @param pretty - Whether to use pretty notation
   * @param app - App identifier
   * @returns Text in JSON notation representing the layer
   */
  layer2string(layer, pretty, app: string) {
    const json = this.layer2json(layer, app);
    const text = JSON.stringify(json, pretty);
    return text;
  }

  /**
   * Convert layer's style object into JSON object, partial function of layer2style
   * (saves Fill color, Stroke color/width, Image fill, stroke, radius, src and type)
   *
   * @param style - Style to convert
   * @param app - App identifier
   * @returns Converted JSON object replacing OL style
   */
  serializeStyle(style: Style | Style[], app: string): SerializedStyle {
    const s = Array.isArray(style) ? style[0] : style;
    const o: SerializedStyle = {};
    const ima: SerializedImage = {};
    if (s.getFill() && s.getFill() !== null) {
      o.fill = s.getFill().getColor();
    }
    if (s.getStroke() && s.getStroke() !== null) {
      o.stroke = {
        color: s.getStroke().getColor(),
        width: s.getStroke().getWidth(),
      };
    }
    if (s.getImage() && s.getImage() !== null) {
      const style_img = s.getImage();
      if (this.hsUtilsService.instOf(style_img, RegularShape)) {
        const regShape = style_img as RegularShape;
        if (regShape.getFill()) {
          ima.fill = regShape.getFill().getColor();
        }

        if (regShape.getStroke()) {
          ima.stroke = {
            color: regShape.getStroke().getColor(),
            width: regShape.getStroke().getWidth(),
          };
        }
        ima.radius = regShape.getRadius();
      }

      if (
        this.hsUtilsService.instOf(style_img, Icon) &&
        typeof (style_img as Icon).getSrc() === 'string' &&
        !(style_img as Icon).getSrc().startsWith('data:image')
      ) {
        ima.src = this.hsUtilsService.proxify(
          (style_img as Icon).getSrc(),
          app
        );
      }

      if (this.hsUtilsService.instOf(style_img, Circle)) {
        ima.type = 'circle';
      }

      if (this.hsUtilsService.instOf(style_img, Icon)) {
        ima.type = 'icon';
      }

      o.image = ima;
    }
    return o;
  }

  /**
   * Convert map layer into a JSON object (only for ol.layer.Layer)
   * Layer properties covered:  (CLASS_NAME), name, url, params,
   *                            group, displayInLayerSwitcher, *visibility, *opacity
   *                            attribution, transitionEffect,
   *                             isBaseLayer, minResolution,
   *                            maxResolution, metadata,
   *                            abstract, opacity, singleTile, removable,
   *                            queryable, legend, projections,
   *                            wmsMinScale, wmsMaxScale
   *
   * The layer index is not covered, as we assume
   * that it is corresponding to the layers order.
   *
   * @param layer - Map layer that should be converted
   * @param app - App identifier
   * @returns JSON object representing the layer
   */
  layer2json(layer: Layer<Source>, app: string): LayerJSON {
    const json: LayerJSON = {
      metadata: getMetadata(layer) || {},
    };

    /*
          Commented out because we cant reliably use instanceof.
          utils.instOf is also not possible, because Layer is a base type

          if (!layer instanceof Layer) {
              return;
          }
          */

    // Common stuff

    // type
    //json.className = layer.CLASS_NAME;
    //json.origClassName = layer.CLASS_NAME; // the original type

    // options
    json.visibility = layer.getVisible();
    json.swipeSide = getSwipeSide(layer);
    json.opacity = layer.getOpacity();
    json.base = getBase(layer) ?? false;
    json.title = getTitle(layer);
    if (getTitle(layer) == undefined) {
      this.hsLogService.warn('Layer title undefined', layer);
    }
    //json.index = layer.map.getLayerIndex(layer);
    json.path = getPath(layer);

    if (layer.getExtent()) {
      const ex = layer.getExtent();
      json.maxExtent = {
        left: ex[0],
        bottom: ex[3],
        right: ex[2],
        top: ex[1],
      };
    }

    // HTTPRequest
    if (
      this.hsUtilsService.instOf(layer, Tile) ||
      this.hsUtilsService.instOf(layer, ImageLayer)
    ) {
      const src = layer.getSource();
      if (layer.getMaxResolution() !== null) {
        json.maxResolution = layer.getMaxResolution();
      }
      if (layer.getMinResolution() !== null) {
        json.minResolution = layer.getMinResolution();
      }
      json.displayInLayerSwitcher = getShowInLayerManager(layer);
      if (getDimensions(layer)) {
        json.dimensions = getDimensions(layer);
      }
      if (this.hsUtilsService.instOf(src, XYZ)) {
        json.className = 'XYZ';
      }
      if (
        this.hsUtilsService.instOf(src, ImageArcGISRest) ||
        this.hsUtilsService.instOf(src, TileArcGISRest)
      ) {
        json.className = 'ArcGISRest';
        json.singleTile = this.hsUtilsService.instOf(src, ImageArcGISRest);
      }
      if (this.hsUtilsService.instOf(src, ImageStatic)) {
        json.className = 'StaticImage';
        json.extent = (src as ImageStatic).getImageExtent();
      }
      if (this.hsLayerUtilsService.isLayerWMS(layer)) {
        json.className = 'HSLayers.Layer.WMS';
        json.singleTile = this.hsUtilsService.instOf(src, ImageWMS);
        if (getLegends(layer)) {
          json.legends = [];
          const legends = getLegends(layer);
          if (Array.isArray(legends)) {
            json.legends = legends.map((l) => encodeURIComponent(l));
          }
          if (typeof legends == 'string') {
            json.legends = [legends];
          }
        }
        if (src.getProjection()) {
          json.projection = src.getProjection().getCode().toLowerCase();
        }
        json.params = this.hsLayerUtilsService.getLayerParams(layer);
        if (getOrigLayers(layer)) {
          json.params.LAYERS = getOrigLayers(layer);
        }
        json.subLayers = getSubLayers(layer);
        json.metadata.styles = src.get('styles');
      }
      json.url = encodeURIComponent(this.hsLayerUtilsService.getURL(layer));
      if (getAttribution(layer)) {
        json.attributions = getAttribution(layer);
      }

      if (this.hsUtilsService.instOf(src, WMTS)) {
        const wmts = src as WMTS;
        json.className = 'HSLayers.Layer.WMTS';
        json.matrixSet = wmts.getMatrixSet();
        json.layer = wmts.getLayer();
        json.format = wmts.getFormat();
        json.info_format = layer.get('info_format');
        json.url = wmts.getUrls()[0];
      }
    }

    // Vector
    if (this.hsUtilsService.instOf(layer, VectorLayer)) {
      let src = layer.getSource();
      if (this.hsLayerUtilsService.isLayerClustered(layer)) {
        src = (src as Cluster).getSource();
      }
      json.name = getName(layer);
      json.className = 'Vector';
      const definition = getDefinition(layer);
      if (definition && definition.url) {
        json.protocol = {
          url: encodeURIComponent(definition.url),
          format: definition.format,
        };
        json.workspace = getWorkspace(layer);
        delete json.features;
      } else {
        if (getWfsUrl(layer)) {
          json.protocol = {
            url: getWfsUrl(layer),
            format: 'hs.format.externalWFS',
          };
        } else {
          try {
            json.features = this.getFeaturesJson(
              (src as VectorSource<Geometry>).getFeatures(),
              app
            );
          } catch (ex) {
            //Do nothing
          }
        }
      }
      json.maxResolution = layer.getMaxResolution();
      json.minResolution = layer.getMinResolution();
      json.projection = 'epsg:4326';
      if (getSld(layer) != undefined) {
        json.style = getSld(layer);
      } else if (
        this.hsUtilsService.instOf(
          (layer as VectorLayer<VectorSource<Geometry>>).getStyle(),
          Style
        )
      ) {
        json.style = this.serializeStyle(
          (layer as VectorLayer<VectorSource<Geometry>>).getStyle() as Style,
          app
        );
      }
    }
    return json;
  }

  /**
   * Convert feature array to GeoJSON string
   *
   * @param features - Array of features
   * @param app - App identifier
   * @returns GeoJSON
   */
  getFeaturesJson(
    features: Feature<Geometry>[],
    app: string
  ): GeoJSONFeatureCollection {
    const f = new GeoJSON();
    const featureProjection = this.hsMapService.getCurrentProj(app).getCode();
    return f.writeFeaturesObject(features, {
      dataProjection: 'EPSG:4326',
      featureProjection,
    });
  }

  /**
   * Create thumbnail of the map view and save it into selected element
   * @param $element - Selected element
   * @param app - App identifier
   * @param newRender - Force new render
   */
  generateThumbnail($element: Element, app: string, newRender?): void {
    if ($element === null) {
      return;
    }
    $element.setAttribute('crossOrigin', 'Anonymous');
    const map = this.hsMapService.getMap(app);
    map.once('postcompose', () =>
      this.hsShareThumbnailService.rendered($element, app, newRender)
    );
    if (newRender) {
      map.renderSync();
    } else {
      this.hsShareThumbnailService.rendered($element, app, newRender);
    }
  }

  /**
   * Save map layers to browsers' local storage
   * @param app - App identifier
   */
  save2storage(app: string): void {
    const data = {
      expires: new Date().getTime() + LCLSTORAGE_EXPIRE,
      layers: this.hsMapService
        .getLayersArray(app)
        .filter(
          (lyr) =>
            !this.internalLayers.includes(lyr) &&
            (getShowInLayerManager(lyr) == undefined ||
              getShowInLayerManager(lyr) == true)
        )
        .map((lyr: Layer<Source>) => this.layer2json(lyr, app)),
    };
    //TODO: Set the item sooner, so it can be reloaded after accidental browser crash
    // but remove it if leaving the site for good
    localStorage.setItem('hs_layers', JSON.stringify(data));
  }
}
