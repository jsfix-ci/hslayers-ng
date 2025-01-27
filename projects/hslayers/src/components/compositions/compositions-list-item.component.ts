import {Component, Input} from '@angular/core';

import {HsCompositionsDeleteDialogComponent} from './dialogs/delete-dialog.component';
import {HsCompositionsInfoDialogComponent} from './dialogs/info-dialog.component';
import {HsCompositionsService} from './compositions.service';
import {HsCompositionsShareDialogComponent} from './dialogs/share-dialog.component';
import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsLanguageService} from '../language/language.service';
import {HsMapCompositionDescriptor} from './models/composition-descriptor.model';
import {HsSetPermissionsDialogComponent} from '../../common/layman/dialog-set-permissions/set-permissions.component';
import {HsToastService} from '../layout/toast/toast.service';
@Component({
  selector: 'hs-compositions-list-item',
  templateUrl: 'compositions-list-item.component.html',
})
export class HsCompositionsListItemComponent {
  @Input() composition: HsMapCompositionDescriptor;
  @Input() selectedCompId: string;
  @Input() app = 'default';
  constructor(
    private hsCompositionsService: HsCompositionsService,
    private hsToastService: HsToastService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsConfig: HsConfig,
    private hsLanguageService: HsLanguageService
  ) {}

  /**
   * Load selected composition
   * @param composition - Selected composition
   */
  openComposition(composition: HsMapCompositionDescriptor): void {
    this.hsCompositionsService.loadCompositionParser(composition, this.app);
  }
  /**
   * @param record - Composition to show details
   * Load info about composition through service and display composition info dialog
   */
  async detailComposition(record: HsMapCompositionDescriptor): Promise<void> {
    const info = await this.hsCompositionsService.getCompositionInfo(
      record,
      this.app
    );
    if (info !== undefined) {
      this.infoDialogBootstrap(info);
    }
  }
  /**
   * @param record - Composition to share
   * Prepare share object on server and display share dialog to share composition
   */
  async shareComposition(record: HsMapCompositionDescriptor): Promise<void> {
    let url: string;
    try {
      await this.hsCompositionsService
        .shareComposition(record, this.app)
        .then(async () => {
          url = await this.hsCompositionsService.getShareUrl(this.app);
          if (url !== undefined) {
            this.shareDialogBootstrap(record, url);
          } else {
            throw new Error('COMPOSITIONS.sharingUrlIsNotAvailable');
          }
        });
    } catch (e) {
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'COMPOSITIONS.errorWhileSharingOnSocialNetwork',
          undefined,
          this.app
        ),
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          e.message,
          {url: url},
          this.app
        ),
        {disableLocalization: true},
        this.app
      );
    }
  }
  /**
   * Show permissions dialog window for selected composition.
   * @param composition - Selected composition
   */
  async showPermissions(
    composition: HsMapCompositionDescriptor
  ): Promise<void> {
    this.hsDialogContainerService.create(
      HsSetPermissionsDialogComponent,
      {
        recordType: 'composition',
        selectedRecord: composition,
        app: this.app,
      },
      this.app
    );
  }

  /**
   * @param composition - Composition selected for deletion
   * Display delete dialog of composition
   */
  confirmDelete(composition: HsMapCompositionDescriptor): void {
    if (!composition.editable) {
      return;
    }
    this.deleteDialogBootstrap(composition);
  }
  /**
   * @param composition - Composition selected for deletion
   */
  deleteDialogBootstrap(composition): void {
    this.hsDialogContainerService.create(
      HsCompositionsDeleteDialogComponent,
      {
        compositionToDelete: composition,
      },
      this.app
    );
  }
  /**
   * @param record - Composition selected for sharing
   * @param url -
   */
  shareDialogBootstrap(record: HsMapCompositionDescriptor, url: string): void {
    this.hsDialogContainerService.create(
      HsCompositionsShareDialogComponent,
      {
        url,
        title:
          this.hsConfig.get(this.app).social_hashtag &&
          !record.title.includes(this.hsConfig.get(this.app).social_hashtag)
            ? record.title + ' ' + this.hsConfig.get(this.app).social_hashtag
            : record.title,
        abstract: record.abstract,
      },
      this.app
    );
  }

  /**
   * Display composition info dialog
   * @param info - Composition info
   */
  infoDialogBootstrap(info): void {
    this.hsDialogContainerService.create(
      HsCompositionsInfoDialogComponent,
      {
        info,
      },
      this.app
    );
  }

  /**
   * Get composition common id
   * @param composition - Composition item
   */
  getCommonId(composition: HsMapCompositionDescriptor): string {
    return this.hsCompositionsService.commonId(composition);
  }
}
