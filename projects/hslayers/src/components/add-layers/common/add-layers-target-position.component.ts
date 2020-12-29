import BaseLayer from 'ol/layer/Base';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HsLayerManagerService} from '../../layermanager/layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';

@Component({
  selector: 'hs-add-layers-target-position',
  templateUrl: './add-layers-target-position.component.html',
})
export class HsAddLayersTargetPositionComponent {
  @Input() addUnder: BaseLayer | null; // @type'; TODO: comes from another scope
  @Output() addUnderChange = new EventEmitter<BaseLayer | null>();

  constructor(
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLayerManagerService: HsLayerManagerService
  ) {}

  updateChanges(): void {
    this.addUnderChange.next(this.addUnder);
  }
}
