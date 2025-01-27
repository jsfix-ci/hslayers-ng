import {Component, ViewRef} from '@angular/core';
import {HsCompositionsService} from '../compositions.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from '../../save-map/save-map-manager.service';
@Component({
  selector: 'hs-compositions-overwrite-dialog',
  templateUrl: './dialog_overwriteconfirm.html',
})
export class HsCompositionsOverwriteDialogComponent
  implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsService: HsCompositionsService,
    public HsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this, this.data.app);
  }

  /**
   * @public
   * Load new composition without saving old composition
   */
  overwrite() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.get(this.data.app).compositionToLoad.url,
      this.data.app,
      true
    );
    this.close();
  }

  /**
   * @public
   * Save currently loaded composition first
   */
  save() {
    this.HsSaveMapManagerService.openPanel(null, this.data.app);
    this.close();
  }

  /**
   * @public
   * Load new composition (with service_parser Load function) and merge it with old composition
   */
  add() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.get(this.data.app).compositionToLoad.url,
      this.data.app,
      false
    );
    this.close();
  }
}
