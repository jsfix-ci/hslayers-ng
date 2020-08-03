import {Component} from '@angular/core';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsDialogContainerService} from '../layout/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsSaveMapResultDialogComponent} from './save-map.result-dialog.component';
import {HsSaveMapService} from './save-map.service';
import { HsSaveMapDialogComponent } from './save-map-dialog.component';

@Component({
  selector: 'hs.save-map',
  template: require('./partials/panel.html'),
})
export class HsSaveMapComponent {
  endpoint = null;
  step = 'context';
  steps = ['context', 'access', 'author'];
  overwrite = false;
  compoData: any;
  downloadableData: string;
  changeTitle: boolean;

  constructor(
    private HsMapService: HsMapService,
    private HsCoreService: HsCoreService,
    private HsSaveMapService: HsSaveMapService,
    private HsConfig: HsConfig,
    private HsSaveMapManagerService: HsSaveMapManagerService,
    private HsLayoutService: HsLayoutService,
    private HsCommonLaymanService: HsCommonLaymanService,
    private HsCommonEndpointsService: HsCommonEndpointsService,
    private HsEventBusService: HsEventBusService,
    private HsDialogContainerService: HsDialogContainerService
  ) {
    this.compoData = this.HsSaveMapManagerService.compoData;

    HsEventBusService.mapResets.subscribe(() => {
      this.step = 'context';
    });

    HsEventBusService.mainPanelChanges.subscribe(() => {
      if (HsLayoutService.mainpanel == 'saveMap') {
        this.step = 'context';
      }
    });

    this.HsSaveMapManagerService.panelOpened.subscribe((composition) => {
      if (composition && composition.endpoint) {
        const openedType = composition.endpoint.type;
        this.endpoint = HsCommonEndpointsService.endpoints.filter(
          (ep) => ep.type == openedType
        )[0];
      }
    });

    this.$watch(
      () => {
        return HsCommonEndpointsService.endpoints;
      },
      (value) => {
        if (value && this.endpoint === null && value.length > 0) {
          const laymans = value.filter((ep) => ep.type == 'layman');
          if (laymans.length > 0) {
            this.endpoint = laymans[0];
            this.endpointChanged();
          } else {
            this.endpoint = value[0];
            this.endpointChanged();
          }
          if (this.endpoint && this.endpoint.type == 'layman') {
            HsCommonLaymanService.getCurrentUser(this.endpoint);
          }
        }
      }
    );
  }

  endpointChanged() {
    if (this.endpoint) {
      if (this.endpoint.getCurrentUserIfNeeded) {
        this.endpoint.getCurrentUserIfNeeded();
      }
      switch (this.endpoint.type) {
        case 'layman':
          this.steps = ['context', 'author'];
          break;
        default:
          this.steps = ['context', 'access', 'author'];
      }
    }
  }

  /**
   * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
   *
   * @function next
   * @memberof hs.save-map
   */
  next() {
    const ixCurrent = this.steps.indexOf(this.step);
    if (this.steps.length > ixCurrent + 1) {
      this.step = this.steps[ixCurrent + 1];
    } else {
      this.step = 'end';
      this.downloadableData =
        'text/json;charset=utf-8,' +
        encodeURIComponent(
          JSON.stringify(
            this.HsSaveMapService.map2json(
              this.HsMapService.map,
              this.compoData,
              this.HsSaveMapManagerService.userData,
              this.HsSaveMapManagerService.statusData
            )
          )
        );
    }
  }

  setStep(step) {
    this.step = step;
  }

  /**
   * Show dialog about result of saving operation
   *
   * @function showResultDialog
   * @memberof hs.save-map
   */
  showResultDialog() {
    this.HsDialogContainerService.create(HsSaveMapResultDialogComponent, {});
  }

  showSaveDialog() {
    this.HsDialogContainerService.create(HsSaveMapDialogComponent, {});
  }

  /**
   * Test if current composition can be saved (User permission, Free title of composition) and a) proceed with saving; b) display advanced save dialog; c) show result dialog, with fail message
   *
   * @function confirmSave
   * @memberof hs.save-map
   */
  confirmSave() {
    this.HsSaveMapManagerService.confirmSave().then(() => {
      this.showSaveDialog();
    });
  }

  save(saveAsNew) {
    this.HsSaveMapManagerService.save(saveAsNew, this.endpoint)
      .then(this.processSaveCallback)
      .catch(this.processSaveCallback);
  }

  processSaveCallback(response) {
    this.HsSaveMapManagerService.statusData.status = response.status;
    if (!response.status) {
      this.HsSaveMapManagerService.statusData.resultCode = response.error
        ? 'error'
        : 'not-saved';
      if (response.error.code == 24) {
        this.overwrite = true;
      }
      this.HsSaveMapManagerService.statusData.error = response.error;
    } else {
      this.step = 'context';
      this.HsLayoutService.setMainPanel('layermanager', true);
    }
    this.showResultDialog();
  }

  titleChanged() {
    this.overwrite = false;
  }

  /**
   * Callback for saving with new title
   *
   * @function selectNewTitle
   * @memberof hs.save-map
   */
  selectNewTitle() {
    this.compoData.title = this.HsSaveMapManagerService.statusData.guessedTitle;
    this.changeTitle = true;
  }

  /**
   * @function focusTitle
   * @memberof hs.save-map
   */
  focusTitle() {
    if (this.HsSaveMapManagerService.statusData.guessedTitle) {
      this.compoData.title = this.HsSaveMapManagerService.statusData.guessedTitle;
    }
    $timeout(() => {
      this.HsLayoutService.contentWrapper
        .querySelector('.hs-stc-title')
        .focus();
    });
  }

  getCurrentExtent() {
    this.compoData.bbox = this.HsSaveMapManagerService.getCurrentExtent();
  }

  isAllowed() {
    if (this.endpoint === null) {
      return false;
    }
    if (this.endpoint.type == 'statusmanager') {
      return !this.HsCoreService.isAuthorized();
    } else if (this.endpoint.type == 'layman') {
      return true;
    }
  }
}
