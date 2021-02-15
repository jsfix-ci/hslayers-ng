import BaseLayer from 'ol/layer/Base';
import {HsConfig} from '../../config.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Injectable} from '@angular/core';
import {getBase} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataService {
  typeSelected: string;
  //Holds reference to data.url.component type selected
  urlType: string;
  constructor(
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public HsConfig: HsConfig
  ) {}

  addLayer(layer: BaseLayer, underLayer?: BaseLayer) {
    if (underLayer) {
      const layers = this.hsMapService.getLayersArray();
      const underZ = underLayer.getZIndex();
      layer.setZIndex(underZ);
      for (const iLayer of layers.filter((l) => !getBase(l))) {
        if (iLayer.getZIndex() >= underZ) {
          iLayer.setZIndex(iLayer.getZIndex() + 1);
        }
      }
      const ix = layers.indexOf(underLayer);
      this.hsMapService.map.getLayers().insertAt(ix, layer);
    } else {
      this.hsMapService.map.addLayer(layer);
    }
  }

  selectType(type: string): void {
    this.typeSelected = type;
  }
}
