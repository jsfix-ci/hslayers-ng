import {Component, Input} from '@angular/core';

import {HsAddDataUrlService} from '../../../url/add-data-url.service';
import {HsUrlTypeServiceModel} from '../../../url/models/url-type-service.model';

@Component({
  selector: 'hs-url-add',
  templateUrl: './add.component.html',
})
export class HsUrlAddComponent {
  @Input() layers: any;
  @Input() injectedService: HsUrlTypeServiceModel;
  selectAll = true;

  constructor(public hsAddDataUrlService: HsAddDataUrlService) {}

  /**
   * Select all layers from service.
   */
  selectAllLayers(): void {
    this.selectAll = !this.selectAll;
    this.checkAllLayers(this.layers);
  }

  checkAllLayers(layers: any[]): void {
    if (!layers) {
      return;
    }
    for (const layer of layers) {
      layer.checked = false;
      layer.checked = !this.selectAll;
      if (layer.Layer) {
        this.checkAllLayers(layer.Layer);
      }
    }
    this.changed();
  }

  addLayers(checked: boolean): void {
    this.injectedService.addLayers(checked);
    //FIXME: to implement
    // this.injectedService.zoomToLayers();
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked(this.layers);
  }
}
