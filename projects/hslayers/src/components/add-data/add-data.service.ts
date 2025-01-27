import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getBase} from '../../common/layer-extensions';

export type DatasetType = 'url' | 'catalogue' | 'file' | 'OWS';

class HsAddDataParams {
  sidebarLoad: Subject<string> = new Subject();
  dsSelected: DatasetType = undefined;
}

@Injectable({
  providedIn: 'root',
})
export class HsAddDataService {
  apps: {
    [id: string]: HsAddDataParams;
  } = {default: new HsAddDataParams()};

  datasetSelected: Subject<{type: DatasetType; app: string}> = new Subject();
  /**
   * Cancels any external url data request from datasources panel
   */
  cancelUrlRequest: Subject<string> = new Subject();
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsCommonLaymanService: HsCommonLaymanService
  ) {}

  get(app: string): HsAddDataParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataParams();
    }
    return this.apps[app ?? 'default'];
  }

  addLayer(
    layer: Layer<Source>,
    app: string,
    underLayer?: Layer<Source>
  ): void {
    if (underLayer) {
      const layers = this.hsMapService.getLayersArray(app);
      const underZ = underLayer.getZIndex();
      layer.setZIndex(underZ);
      for (const iLayer of layers.filter((l) => !getBase(l))) {
        if (iLayer.getZIndex() >= underZ) {
          iLayer.setZIndex(iLayer.getZIndex() + 1);
        }
      }
      const ix = layers.indexOf(underLayer);
      this.hsMapService.getMap(app).getLayers().insertAt(ix, layer);
    } else {
      this.hsMapService.getMap(app).addLayer(layer);
    }
  }

  selectType(type: DatasetType, app: string): void {
    this.apps[app].dsSelected = type;
    this.datasetSelected.next({type, app});
  }
}
