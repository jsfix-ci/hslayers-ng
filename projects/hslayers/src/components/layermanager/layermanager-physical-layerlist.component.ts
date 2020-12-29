import BaseLayer from 'ol/layer/Base';
import {Component, Input} from '@angular/core';
import {HsConfig} from './../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
@Component({
  selector: 'hs-layermanager-physical-layer-list',
  templateUrl: './partials/physical-layerlist.html',
  styles: [
    `
      .activeLayer {
        background-color: rgba(0, 0, 0, 0.2);
      }
    `,
  ],
})
export class HsLayerPhysicalListComponent {
  @Input() layers: Array<any>;
  layersCopy: Array<{
    title: string;
    layer: BaseLayer;
    active?: boolean;
  }> = [];
  previoslySelectedLayer: any;
  constructor(
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsEventBusService: HsEventBusService,
    public HsConfig: HsConfig
  ) {
    this.fillLayers();
    this.HsEventBusService.layerManagerUpdates.subscribe(
      (suspendListSourceUpdate: boolean) => {
        this.fillLayers(suspendListSourceUpdate);
      }
    );
  }

  private fillLayers(suspendListSourceUpdate?: boolean) {
    if (this.layers == undefined) {
      return;
    }
    if (
      suspendListSourceUpdate !== undefined &&
      typeof suspendListSourceUpdate == 'boolean' &&
      suspendListSourceUpdate
    ) {
      this.layersCopy = this.HsLayerManagerService.sortLayersByZ(
        this.layersCopy
      );
    } else {
      this.layersCopy = this.HsLayerManagerService.sortLayersByZ(
        this.layers.map((l) => {
          return {title: l.title, layer: l.layer};
        })
      );
    }
  }

  moveLayer(layer, orient: string): void {
    if (this.previoslySelectedLayer !== undefined) {
      this.previoslySelectedLayer.active = false;
    }
    layer.active = true;
    this.previoslySelectedLayer = layer;
    const currentLayerIndex = this.layersCopy.indexOf(layer);
    switch (orient) {
      case 'up':
        if (currentLayerIndex != 0) {
          this.setLayerZIndex(currentLayerIndex - 1, layer.layer);
        }
        break;
      case 'down':
        if (currentLayerIndex < this.layersCopy.length - 1) {
          this.setLayerZIndex(currentLayerIndex + 1, layer.layer);
        }
        break;
      default:
    }
  }
  setLayerZIndex(indexTo: number, layer: BaseLayer): void {
    const layerSwitchedWith = this.layersCopy[indexTo].layer;
    const interactedLayerZIndex = layer.getZIndex();
    layer.setZIndex(layerSwitchedWith.getZIndex());
    layerSwitchedWith.setZIndex(interactedLayerZIndex);
    const suspendListSourceUpdate = true;
    this.HsEventBusService.layerManagerUpdates.next(suspendListSourceUpdate);
  }
}
