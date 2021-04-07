import {CollectionEvent} from 'ol/Collection';
import {DomSanitizer, SafeHtml} from '@angular/platform-browser';
import {
  Group,
  Image as ImageLayer,
  Layer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
import {ImageWMS, TileArcGISRest, TileWMS} from 'ol/source';
import {Injectable} from '@angular/core';
import {METERS_PER_UNIT} from 'ol/proj';

import {HsBaseLayerDescriptor} from './base-layer-descriptor.interface';
import {HsConfig} from '../../config.service';
import {HsDrawService} from '../draw/draw.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorStylesService} from './layer-editor-styles.service';
import {HsLayerEditorVectorLayerService} from './layer-editor-vector-layer.service';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerSelectorService} from './layer-selector.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  getAbstract,
  getActive,
  getBase,
  getCluster,
  getDeclutter,
  getExclusive,
  getLegends,
  getPath,
  getQueryCapabilities,
  getRemovable,
  getShowInLayerManager,
  getThumbnail,
  setActive,
  setDeclutter,
  setPath,
} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerService {
  /**
   * Containg object for all properties which are shared with controllers.
   */
  data: {
    folders: any;
    layers: HsLayerDescriptor[];
    baselayers: HsBaseLayerDescriptor[];
    terrainlayers: any[];
    baselayersVisible: boolean;
    baselayer?: string;
    box_layers?: any[];
    filter: string;
  } = {
    /**
     * Folders object for structure of layers. Each level contain 5 properties:
     * hsl_path \{String\}: Worded path to folder position in folders hiearchy.
     * coded_path \{String\}: Path encoded in numbers
     * layers \{Array\}: List of layers for current folder
     * sub_folders \{Array\}: List of subfolders for current folder
     * indent \{Number\}: Hiearchy level for current folder
     * name \{String\}: Optional - only from indent 1, base folder is not named
     * @public
     */
    folders: {
      //TODO: need to describe how hsl_path works here
      hsl_path: '',
      coded_path: '0-',
      layers: [],
      sub_folders: [],
      indent: 0,
    },

    /**
     * List of all layers (baselayers are excluded) loaded in LayerManager.
     * @public
     */
    layers: [],
    /**
     * List of all baselayers loaded in layer manager.
     * @public
     */
    baselayers: [],
    /**
     * List of all cesium terrain layers loaded in layer manager.
     * @public
     */
    terrainlayers: [],
    /**
     * Store if baselayers are visible (more precisely one of baselayers)
     * @public
     */
    baselayersVisible: true,
    filter: '',
  };

  /**
   * Property for pointer to main map object
   */
  map: any;
  timer: any;
  currentLayer: HsLayerDescriptor;
  composition_id: string;
  menuExpanded = false;
  currentResolution: number;
  zIndexValue = 0;
  constructor(
    public HsConfig: HsConfig,
    public HsDrawService: HsDrawService,
    public HsEventBusService: HsEventBusService,
    public HsLanguageService: HsLanguageService,
    public HsLayerEditorVectorLayerService: HsLayerEditorVectorLayerService,
    public HsLayerEditorStylesService: HsLayerEditorStylesService,
    public HsLayerManagerMetadata: HsLayerManagerMetadataService,
    public HsLayermanagerWmstService: HsLayerManagerWmstService,
    public HsLayerSelectorService: HsLayerSelectorService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsLayoutService: HsLayoutService,
    public HsLog: HsLogService,
    public HsMapService: HsMapService,
    private HsShareUrlService: HsShareUrlService,
    public HsUtilsService: HsUtilsService,
    public sanitizer: DomSanitizer,
    private hsLayerEditorService: HsLayerEditorService
  ) {
    this.HsMapService.loaded().then(() => this.init());
    this.hsLayerEditorService.layerDimensionDefinitionChange.subscribe(
      ({layer}) => {
        const layerDescriptor = this.data.layers.find(
          (ld) => ld.layer == layer
        );
        if (
          layerDescriptor &&
          this.HsLayermanagerWmstService.layerIsWmsT(layerDescriptor.layer)
        ) {
          this.HsLayermanagerWmstService.setupTimeLayer(layerDescriptor);
        }
      }
    );
    this.HsEventBusService.layerManagerUpdates.subscribe((val) => {
      this.refreshLists();
    });
  }

  /**
   * Function for adding layer added to map into layer manager structure. In service automatically used after layer is added to map. Layers which shouldn´t be in layer manager (showInLayerManager property) aren´t added. Loading events and legends URLs are created for each layer. Layers also get automatic watcher for changing visibility (to synchronize visibility in map and layer manager.) Position is calculated for each layer and for time layers time properties are created. Each layer is also inserted in correct layer list and inserted into folder structure.
   * @private
   * @param e - Event object emited by OL add layer event
   * @param suspendEvents - If set to true, no new values for layerAdditions, layerManagerUpdates or compositionEdits observables will be emmited. Otherwise will.
   */
  layerAdded(e: CollectionEvent, suspendEvents?: boolean): void {
    const layer = e.element;
    this.checkLayerHealth(layer);
    if (
      getShowInLayerManager(layer) !== null &&
      getShowInLayerManager(layer) == false
    ) {
      return;
    }
    this.loadingEvents(layer);
    layer.on('change:visible', (e) => this.layerVisibilityChanged(e));
    if (
      this.HsLayerUtilsService.isLayerVectorLayer(layer) &&
      getCluster(layer) &&
      getDeclutter(layer)
    ) {
      setDeclutter(layer, false);
    }
    if (
      this.HsLayerUtilsService.isLayerVectorLayer(layer) &&
      getCluster(layer)
    ) {
      this.HsLayerEditorVectorLayerService.cluster(
        true,
        layer,
        this.HsConfig.clusteringDistance || 40
      );
    }
    /**
     * Wrapper for layers in layer manager structure. Each layer object stores layer's title, grayed (if layer is currently visible - for layers which have max/min resolution), visible (layer is visible), and actual layer. Each layer wrapper is accessible from layer list or folder structure.
     * @private
     */
    const layerDescriptor: HsLayerDescriptor = {
      title: this.HsLayerUtilsService.getLayerTitle(layer),
      abstract: getAbstract(layer),
      layer,
      grayed: !this.isLayerInResolutionInterval(layer),
      visible: layer.getVisible(),
      uid: this.HsUtilsService.generateUuid(),
      idString() {
        return 'layer' + (this.coded_path || '') + (this.uid || '');
      },
    };
    layerDescriptor.trackBy = layer.ol_uid + ' ' + layerDescriptor.position;

    layer.on('propertychange', (event) => {
      if (event.key == 'title') {
        layerDescriptor.title = this.HsLayerUtilsService.getLayerTitle(layer);
      }
    });

    if (getBase(layer) !== true) {
      this.populateFolders(layer);
      layerDescriptor.legends = getLegends(layer);
      this.data.layers.push(layerDescriptor);
      if (getQueryCapabilities(layer) !== false) {
        this.HsLayerManagerMetadata.fillMetadata(layerDescriptor).then(() => {
          setTimeout(() => {
            layerDescriptor.grayed = !this.isLayerInResolutionInterval(layer);
          }, 50);
        });
      }
    } else {
      layerDescriptor.active = layer.getVisible();
      if (layerDescriptor.active) {
        this.changeBaseLayerVisibility(true, layerDescriptor);
      }
      layerDescriptor.thumbnail = this.getImage(layer);
      this.data.baselayers.push(<HsBaseLayerDescriptor>layerDescriptor);
    }

    if (layer.getVisible() && getBase(layer)) {
      this.data.baselayer = this.HsLayerUtilsService.getLayerTitle(layer);
    }

    this.sortFoldersByZ();
    if (!suspendEvents) {
      this.HsEventBusService.layerAdditions.next(layerDescriptor);
      this.HsEventBusService.layerManagerUpdates.next(layer);
      this.HsEventBusService.compositionEdits.next();
    }
  }

  /**
   * Function for adding baselayer thumbnail visible in basemap gallery.
   * @param layer - Base layer added to map
   */
  getImage(layer: Layer): string {
    const thumbnail = getThumbnail(layer);
    if (thumbnail) {
      if (thumbnail.length > 10) {
        return thumbnail;
      } else {
        return this.HsUtilsService.getAssetsPath() + 'img/' + thumbnail;
      }
    } else {
      return this.HsUtilsService.getAssetsPath() + 'img/default.png';
    }
  }

  /**
   * @param layer
   */
  checkLayerHealth(layer: Layer): void {
    if (this.isWms(layer)) {
      const src = layer.getSource();
      if (src.getParams().LAYERS == undefined) {
        this.HsLog.warn('Layer', layer, 'is missing LAYERS parameter');
      }
    }
  }

  /**
   * @param e
   */
  layerVisibilityChanged(e): void {
    if (getBase(e.target) != true) {
      for (const layer of this.data.layers) {
        if (layer.layer == e.target) {
          layer.visible = e.target.getVisible();
          break;
        }
      }
    } else {
      for (const baseLayer of this.data.baselayers) {
        if (baseLayer.layer == e.target) {
          baseLayer.active = e.target.getVisible();
        } else {
          baseLayer.active = false;
        }
      }
    }
  }

  /**
   * Sort layers which are added to map and registered
   * in layermanager by Z and notify components that layer positions have changed.
   */
  updateLayerListPositions(): void {
    //TODO: We could also sort by title or other property. Not supported right now though, just zIndex
    this.data.layers = this.sortLayersByZ(this.data.layers);
  }

  sortLayersByZ(arr: any[]): any[] {
    const minus = this.HsConfig.reverseLayerList || false;
    return arr.sort((a, b) => {
      a = a.layer.getZIndex();
      b = b.layer.getZIndex();
      const tmp = (a < b ? -1 : a > b ? 1 : 0) * (minus ? -1 : 1);
      return tmp;
    });
  }

  refreshLists(): void {
    this.data.baselayers = Array.from(this.data.baselayers);
    this.data.terrainlayers = Array.from(this.data.terrainlayers);
  }

  /**
   * (PRIVATE) Get layer by its title
   * @private
   * @param title
   */
  getLayerByTitle(title: string): Layer | undefined {
    let tmp;
    for (const layer of this.data.layers) {
      if (layer.title == title) {
        tmp = layer;
      }
    }
    return tmp;
  }

  /**
   * Get layer container object for OL layer
   * @private
   * @param layer - to get layer title
   * @returns Layer container which is used in layer-list directive
   */
  getLayerDescriptorForOlLayer(layer: Layer): HsLayerDescriptor {
    const tmp = this.data.layers.filter((l) => l.layer == layer);
    if (tmp.length > 0) {
      return tmp[0];
    }
    return;
  }

  /**
   * Place layer into layer manager folder structure based on path property hsl-path of layer
   * @private
   * @param lyr - Layer to add into folder structure
   */
  populateFolders(lyr: Layer): void {
    let path = getPath(lyr);
    if (!path) {
      /* Check whether 'other' folder exists.
        Can not just add getTranslationIgnoreNonExisting string in case no path exists
        because on init the translation is ignored.
      */
      if (this.data.folders.sub_folders?.filter((f) => f.name == 'other')[0]) {
        path = 'other';
      } else {
        path = this.HsLanguageService.getTranslationIgnoreNonExisting(
          'LAYERMANAGER',
          'other'
        );
      }
      setPath(lyr, path);
    }
    const parts = path.split('/');
    let curfolder = this.data.folders;
    const zIndex = lyr.getZIndex();
    for (let i = 0; i < parts.length; i++) {
      let found = null;
      for (const folder of curfolder.sub_folders) {
        if (folder.name == parts[i]) {
          found = folder;
        }
      }
      if (found === null) {
        //TODO: Need to describe how hsl_path works here
        const new_folder = {
          sub_folders: [],
          indent: i,
          layers: [],
          name: parts[i],
          hsl_path:
            curfolder.hsl_path +
            (curfolder.hsl_path != '' ? '/' : '') +
            parts[i],
          coded_path: curfolder.coded_path + curfolder.sub_folders.length + '-',
          visible: true,
          zIndex: zIndex,
        };
        curfolder.sub_folders.push(new_folder);
        curfolder = new_folder;
      } else {
        curfolder = found;
      }
    }
    curfolder.zIndex = curfolder.zIndex < zIndex ? zIndex : curfolder.zIndex;
    lyr.coded_path = curfolder.coded_path;
    curfolder.layers.push(lyr);
    // if (this.data.folders.layers.indexOf(lyr) > -1) {
    //   this.data.folders.layers.splice(this.data.folders.layers.indexOf(lyr), 1);
    // }
  }

  /**
   * Remove layer from layer folder structure a clean empty folder
   * @private
   * @param lyr - Layer to remove from layer folder
   */
  cleanFolders(lyr: Layer): void {
    if (getShowInLayerManager(lyr) == false) {
      return;
    }
    if (getPath(lyr) != undefined && getPath(lyr) !== 'undefined') {
      const path = getPath(lyr);
      const parts = path.split('/');
      let curfolder = this.data.folders;
      for (let i = 0; i < parts.length; i++) {
        for (const folder of curfolder.sub_folders) {
          if (folder.name == parts[i]) {
            curfolder = folder;
          }
        }
      }
      curfolder.layers.splice(curfolder.layers.indexOf(lyr), 1);
      for (let i = parts.length; i > 0; i--) {
        if (curfolder.layers.length == 0 && curfolder.sub_folders.length == 0) {
          let newfolder = this.data.folders;
          if (i > 1) {
            for (let j = 0; j < i - 1; j++) {
              for (const folder of newfolder.sub_folders) {
                if (folder.name == parts[j]) {
                  newfolder = folder;
                }
              }
            }
          }
          const ixToRemove = newfolder.sub_folders.indexOf(curfolder);
          if (ixToRemove > -1) {
            newfolder.sub_folders.splice(ixToRemove, 1);
          }
          curfolder = newfolder;
        } else {
          break;
        }
      }
    } else {
      const ixToRemove = this.data.folders.layers.indexOf(lyr);
      if (ixToRemove > -1) {
        this.data.folders.layers.splice(ixToRemove, 1);
      }
    }
  }

  /**
   * Callback function for removing layer. Clean layers variables
   * (PRIVATE)
   * @private
   * @param e - Events emitted by ol.Collection instances are instances of this type.
   */
  layerRemoved(e: CollectionEvent): void {
    this.cleanFolders(e.element);
    for (let i = 0; i < this.data.layers.length; i++) {
      if (this.data.layers[i].layer == e.element) {
        this.data.layers.splice(i, 1);
      }
    }

    for (let i = 0; i < this.data.baselayers.length; i++) {
      if (this.data.baselayers[i].layer == e.element) {
        this.data.baselayers.splice(i, 1);
      }
    }
    this.HsEventBusService.layerManagerUpdates.next(e.element);
    this.HsEventBusService.layerRemovals.next(e.element);
    this.HsEventBusService.compositionEdits.next();
    const layers = this.HsMapService.map.getLayers().getArray();
    if (this.zIndexValue > layers.length) {
      this.zIndexValue--;
    }
  }

  /**
   * Initilaze box layers and their starting active state
   * (PRIVATE)
   * @private
   */
  private boxLayersInit(): void {
    if (this.HsConfig.box_layers != undefined) {
      this.data.box_layers = this.HsConfig.box_layers;
      for (const box of this.data.box_layers) {
        let visible = false;
        let baseVisible = false;
        for (const layer of box.get('layers').getArray()) {
          if (layer.get('visible') == true && getBase(layer) == true) {
            baseVisible = true;
          } else if (layer.get('visible') == true) {
            visible = true;
          }
        }
        setActive(box, baseVisible ? baseVisible : visible);
      }
    }
  }

  /**
   * Change visibility of selected layer. If layer has exclusive setting, other layers from same group may be turned unvisible
   * @param visibility - Visibility layer should have
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeLayerVisibility(visibility: boolean, layer: Layer): void {
    layer.layer.setVisible(visibility);
    layer.visible = visibility;
    layer.grayed = !this.isLayerInResolutionInterval(layer.layer);
    //Set the other exclusive layers invisible - all or the ones with same path based on config
    if (visibility && getExclusive(layer.layer) == true) {
      for (const other_layer of this.data.layers) {
        const pathExclusivity = this.HsConfig.pathExclusivity
          ? getPath(other_layer.layer) == getPath(layer.layer)
          : true;
        if (
          getExclusive(other_layer.layer) == true &&
          other_layer != layer &&
          pathExclusivity
        ) {
          other_layer.layer.setVisible(false);
          other_layer.visible = false;
        }
      }
    }
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeBaseLayerVisibility($event = null, layer = null): void {
    if (layer === null || layer.layer != undefined) {
      if (this.data.baselayersVisible == true) {
        if ($event && this.data.baselayer != layer.title) {
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer.layer) {
              baseLayer.layer.setVisible(false);
              baseLayer.visible = false;
              baseLayer.active = false;
              if (baseLayer != layer) {
                baseLayer.galleryMiniMenu = false;
              }
            }
          }
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer.layer && baseLayer == layer) {
              baseLayer.layer.setVisible(true);
              baseLayer.visible = true;
              baseLayer.active = true;
              this.data.baselayer = layer.title;
              break;
            }
          }
        } else {
          this.data.baselayersVisible = false;
          for (const baseLayer of this.data.baselayers) {
            baseLayer.layer.setVisible(false);
            baseLayer.galleryMiniMenu = false;
          }
        }
      } else {
        if ($event) {
          layer.active = true;
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer != layer) {
              baseLayer.active = false;
              baseLayer.visible = false;
            } else {
              baseLayer.layer.setVisible(true);
              baseLayer.visible = true;
              this.data.baselayer = layer.title;
            }
          }
        } else {
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer.visible == true) {
              baseLayer.layer.setVisible(true);
            }
          }
        }
        this.data.baselayersVisible = true;
      }
    } else {
      for (const baseLayer of this.data.baselayers) {
        if (baseLayer.type != undefined && baseLayer.type == 'terrain') {
          baseLayer.active = baseLayer.visible = baseLayer == layer;
        }
      }
    }
    this.HsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeTerrainLayerVisibility($event, layer): void {
    for (let i = 0; i < this.data.terrainlayers.length; i++) {
      if (
        this.data.terrainlayers[i].type != undefined &&
        this.data.terrainlayers[i].type == 'terrain'
      ) {
        this.data.terrainlayers[i].active = this.data.terrainlayers[i].visible =
          this.data.terrainlayers[i] == layer;
      }
    }
    this.HsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Remove all non-base layers that were added to the map by user.
   * Doesn't remove layers added through app config (In case we want it to be 'removable', it can be set to true in the config.)
   * (PRIVATE)
   * @private
   */
  removeAllLayers(): void {
    const to_be_removed = [];
    this.HsMapService.map.getLayers().forEach((lyr) => {
      if (getRemovable(lyr) == true) {
        if (getBase(lyr) == undefined || getBase(lyr) == false) {
          if (
            getShowInLayerManager(lyr) == undefined ||
            getShowInLayerManager(lyr) == true
          ) {
            to_be_removed.push(lyr);
          }
        }
      }
    });
    while (to_be_removed.length > 0) {
      this.HsMapService.map.removeLayer(to_be_removed.shift());
    }
    this.HsDrawService.fillDrawableLayers();
  }

  /**
   * Show all layers of particular layer group (when groups are defined)
   * @param theme - Group layer to activate
   */
  activateTheme(theme: Group): void {
    let switchOn = true;
    if (getActive(theme) == true) {
      switchOn = false;
    }
    setActive(theme, switchOn);
    let baseSwitched = false;
    theme.setVisible(switchOn);
    for (const layer of theme.get('layers')) {
      if (getBase(layer) == true && !baseSwitched) {
        this.changeBaseLayerVisibility();
        baseSwitched = true;
      } else if (getBase(layer) == true) {
        return;
      } else {
        layer.setVisible(switchOn);
      }
    }
  }

  /**
   * Create events for checking if layer is being loaded or is loaded for ol.layer.Image or ol.layer.Tile
   * @param layer - Layer which is being added
   */
  loadingEvents(layer: Layer): void {
    const source = layer.getSource();
    source.loadCounter = 0;
    source.loadTotal = 0;
    source.loadError = 0;
    source.loaded = true;
    if (this.HsUtilsService.instOf(layer, VectorLayer)) {
      layer.getSource().on('propertychange', (event) => {
        if (event.key == 'loaded') {
          if (event.oldValue == false) {
            this.HsEventBusService.layerLoads.next(layer);
          } else {
            this.HsEventBusService.layerLoadings.next(layer);
          }
        }
      });
    } else if (this.HsUtilsService.instOf(layer, ImageLayer)) {
      source.on('imageloadstart', (event) => {
        source.loaded = false;
        source.loadCounter += 1;
        this.HsEventBusService.layerLoadings.next(layer);
      });
      source.on('imageloadend', (event) => {
        source.loaded = true;
        source.loadCounter -= 1;
        this.HsEventBusService.layerLoads.next(layer);
      });
      source.on('imageloaderror', (event) => {
        source.loaded = true;
        source.error = true;
        this.HsEventBusService.layerLoads.next(layer);
      });
    } else if (this.HsUtilsService.instOf(layer, Tile)) {
      source.on('tileloadstart', (event) => {
        source.loadCounter += 1;
        source.loadTotal += 1;
        if (source.loaded == true) {
          source.loaded = false;
          source.set('loaded', false);
          this.HsEventBusService.layerLoadings.next(layer);
        }
      });
      source.on('tileloadend', (event) => {
        source.loadCounter -= 1;
        if (source.loadCounter == 0) {
          source.loaded = true;
          source.set('loaded', true);
          this.HsEventBusService.layerLoads.next(layer);
        }
      });
      source.on('tileloaderror', (event) => {
        source.loadCounter -= 1;
        source.loadError += 1;
        if (source.loadError == source.loadTotal) {
          source.error = true;
        }
        if (source.loadCounter == 0) {
          source.loaded = true;
          source.set('loaded', true);
          this.HsEventBusService.layerLoads.next(layer);
        }
      });
    }
  }

  /**
   * Checks if given layer is a WMS layer
   */
  isWms(layer: Layer): boolean {
    return (
      this.HsUtilsService.instOf(layer.getSource(), TileWMS) ||
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS) ||
      this.HsUtilsService.instOf(layer.getSource(), TileArcGISRest)
    );
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param lyr - Selected layer
   */
  isLayerInResolutionInterval(lyr: Layer): boolean {
    let cur_res;
    if (this.isWms(lyr)) {
      const view = this.HsMapService.map.getView();
      const resolution = view.getResolution();
      const units = view.getProjection().getUnits();
      const dpi = 25.4 / 0.28;
      const mpu = METERS_PER_UNIT[units];
      cur_res = resolution * mpu * 39.37 * dpi;
    } else {
      cur_res = this.HsMapService.map.getView().getResolution();
    }
    this.currentResolution = cur_res;
    return (
      lyr.getMinResolution() <= cur_res && cur_res <= lyr.getMaxResolution()
    );
  }

  /**
   * Toggles Additional information panel for current layer.
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   * @param toToggle - Part of layer editor to be toggled
   * @param control - Part of layer editor to be controlled for state.
   * Determines whether only toggled part or whole layereditor would be closed
   */
  toggleLayerEditor(
    layer: HsLayerDescriptor,
    toToggle: string,
    control: string
  ): void {
    if (toToggle == 'sublayers' && layer.layer.hasSublayers != true) {
      return;
    }
    if (this.currentLayer != layer) {
      this.toggleCurrentLayer(layer);
      if (this.menuExpanded) {
        this.menuExpanded = false;
      }
      layer[toToggle] = true;
    } else {
      layer[toToggle] = !layer[toToggle];
      if (!layer[control]) {
        this.toggleCurrentLayer(layer);
      }
    }
  }

  /**
   * Opens detailed panel for manipulating selected layer and viewing metadata
   * @param layer - Selected layer to edit or view - Wrapped layer object
   */
  toggleCurrentLayer(layer: HsLayerDescriptor): void | false {
    if (this.currentLayer == layer) {
      layer.sublayers = false;
      layer.settings = false;
      this.currentLayer = null;
      this.HsShareUrlService.updateCustomParams({
        'layerSelected': undefined,
      });
    } else {
      this.setCurrentLayer(layer);
      return false;
    }
  }

  setCurrentLayer(layer: HsLayerDescriptor): false {
    this.currentLayer = layer;
    this.HsShareUrlService.updateCustomParams({
      'layerSelected': layer.title,
    });
    if (!layer.layer.checkedSubLayers) {
      layer.layer.checkedSubLayers = {};
      layer.layer.withChildren = {};
    }
    this.HsLayerSelectorService.select(layer);
    const layerPanel = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-layerpanel'
    );
    if (this.HsUtilsService.runningInBrowser()) {
      const layerNode = document.getElementById(layer.idString());
      if (layerNode) {
        this.HsUtilsService.insertAfter(layerPanel, layerNode);
      }
    }
    return false;
  }

  /**
   * Makes layer grayscale
   * @param layer - Selected layer (currentLayer)
   */
  setGreyscale(layer: Layer): void {
    const layerContainer = this.HsLayoutService.contentWrapper.querySelector(
      '.ol-layers > div:first-child'
    );
    if (layerContainer.classList.contains('hs-grayscale')) {
      layerContainer.classList.remove('hs-grayscale');
      layer.grayscale = false;
    } else {
      layerContainer.classList.add('hs-grayscale');
      layer.grayscale = true;
    }
    setTimeout(() => {
      layer.galleryMiniMenu = false;
    }, 100);
  }

  sortFoldersByZ(): void {
    this.data.folders.sub_folders.sort(
      (a, b) =>
        (a.zIndex < b.zIndex ? -1 : a.zIndex > b.zIndex ? 1 : 0) *
        (this.HsConfig.reverseLayerList ? -1 : 1)
    );
  }

  /**
   * Initialization of needed controllers, run when map object is available
   * (PRIVATE)
   * @private
   */
  async init(): Promise<void> {
    this.map = this.HsMapService.map;
    this.HsMapService.map.getLayers().forEach((lyr) => {
      this.applyZIndex(lyr);
      this.layerAdded(
        {
          element: lyr,
        },
        true
      );
    });
    this.sortFoldersByZ();
    this.sortLayersByZ(this.data.layers);
    this.HsEventBusService.layerManagerUpdates.next();
    this.toggleEditLayerByUrlParam();
    this.boxLayersInit();

    this.map
      .getView()
      .on(
        'change:resolution',
        this.HsUtilsService.debounce(
          this.resolutionChangeDebounceCallback,
          200,
          false,
          this
        )
      );

    this.map.getLayers().on('add', (e) => {
      this.applyZIndex(e.element, true);
      if (getShowInLayerManager(e.element) == false) {
        return;
      }
      this.layerAdded(e);
    });
    this.map.getLayers().on('remove', (e) => this.layerRemoved(e));
  }

  private resolutionChangeDebounceCallback(): void {
    setTimeout(() => {
      for (let i = 0; i < this.data.layers.length; i++) {
        const tmp = !this.isLayerInResolutionInterval(
          this.data.layers[i].layer
        );
        if (this.data.layers[i].grayed != tmp) {
          this.data.layers[i].grayed = tmp;
        }
      }
      this.timer = null;
    }, 250);
  }

  /**
   * Opens editor for layer specified in 'layerSelected' url parameter
   */
  private toggleEditLayerByUrlParam() {
    const layerTitle = this.HsShareUrlService.getParamValue('layerSelected');
    if (layerTitle != undefined) {
      setTimeout(() => {
        const layerFound = this.data.layers.find(
          (layer) => layer.title == layerTitle
        );
        if (layerFound !== undefined) {
          this.toggleLayerEditor(layerFound, 'settings', 'sublayers');
          this.HsEventBusService.layerSelectedFromUrl.next(layerFound.layer);
        }
      }, 500);
    }
  }

  /**
   * Sets zIndex of layer being added to be the highest among layers in same path
   * @param layer - layer being added
   */
  private setPathMaxZIndex(layer: Layer): void {
    let pathLayers;
    if (getBase(layer)) {
      pathLayers = this.data.baselayers;
    } else {
      let path = getPath(layer);
      //If not set itll be assigned inside populateFolders function as 'other'
      path = path ? path : 'other';

      pathLayers = this.data.layers.filter(
        (layer) => getPath(layer.layer) == path
      );
    }

    if (pathLayers.length > 0) {
      //Get max avaialble index value
      const maxPathZIndex = Math.max(
        ...pathLayers.map((lyr) => lyr.layer.getZIndex() || 0)
      );

      layer.setZIndex(maxPathZIndex + 1);
      //Increase zIndex of the layer that are supposed to be rendered above inserted
      for (const lyr of this.data.layers.filter(
        (lyr) => lyr.layer.getZIndex() >= layer.getZIndex()
      )) {
        lyr.layer.setZIndex(lyr.layer.getZIndex() + 1);
      }
    }
  }

  /**
   * Sets zIndex of layer being added.
   * @param layer - layer being added
   * @param asCallback - Whether the function is called directly or as a callback of add layer event.
   * No need to run each layer through setPathMaxZIndex on init
   */
  applyZIndex(layer: Layer, asCallback?: boolean): void {
    if (asCallback && getShowInLayerManager(layer) !== false) {
      this.setPathMaxZIndex(layer);
    }

    if (layer.getZIndex() == undefined) {
      layer.setZIndex(this.zIndexValue++);
    } else {
      this.zIndexValue++;
    }
  }

  expandLayer(layer: Layer): void {
    if (layer.expanded == undefined) {
      layer.expanded = true;
    } else {
      layer.expanded = !layer.expanded;
    }
  }

  makeSafeAndTranslate(group: string, input: string): SafeHtml {
    const translation = this.HsLanguageService.getTranslationIgnoreNonExisting(
      group,
      input
    );
    if (translation) {
      return this.sanitizer.bypassSecurityTrustHtml(translation);
    } else {
      return '';
    }
  }

  expandSettings(layer: Layer, value): void {
    if (layer.opacity == undefined) {
      layer.opacity = layer.layer.getOpacity();
    }
    if (layer.style == undefined && layer.layer.getSource().styleAble) {
      this.HsLayerEditorStylesService.getLayerStyle(layer);
    }
    layer.expandSettings = value;
  }

  expandFilter(layer: HsLayerDescriptor, value): void {
    layer.expandFilter = value;
    this.currentLayer = layer;
    this.HsLayerSelectorService.select(layer);
  }

  expandInfo(layer: HsLayerDescriptor, value): void {
    layer.expandInfo = value;
  }
}
