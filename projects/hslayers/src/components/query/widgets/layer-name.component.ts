import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsQueryPopupWidgetBaseComponent} from '../query-popup-widget-base.component';

@Component({
  selector: 'hs-layer-name',
  templateUrl: './layer-name.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HsLayerNameComponent
  extends HsQueryPopupWidgetBaseComponent
  implements OnInit
{
  layerDescriptor: any;
  name = 'layer-name';

  @Input() data: {
    layerDescriptor: any;
    app: string;
  };

  constructor(private hsLayerUtilsService: HsLayerUtilsService) {
    super();
  }
  ngOnInit(): void {
    this.layerDescriptor = this.data.layerDescriptor;
  }

  /**
   * Get title translation
   * @param title - Title to translate
   * @returns Translated title
   */
  translateTitle(title: string): string {
    return this.hsLayerUtilsService.translateTitle(title, this.data.app);
  }
}
