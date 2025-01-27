import {Component, OnInit} from '@angular/core';

import {HsCoreService} from '../core/core.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsShareAppData, HsShareService} from './share.service';
import {HsShareUrlService} from './share-url.service';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-share',
  templateUrl: './partials/share.component.html',
})
export class HsShareComponent extends HsPanelBaseComponent implements OnInit {
  new_share = false;
  name = 'permalink';
  appRef: HsShareAppData;

  constructor(
    public HsShareService: HsShareService,
    public HsShareUrlService: HsShareUrlService,
    public HsCore: HsCoreService,
    HsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService
  ) {
    super(HsLayoutService);
  }

  /**
   * @returns {string} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
   * @description Create Iframe tag for embedded map
   */
  updateEmbedCode(): string {
    return this.HsShareService.getEmbedCode(this.data.app);
  }

  /**
   * @returns {string} Right share Url
   * @description Select right share Url based on shareLink property (either Permalink Url or PureMap url)
   */
  getShareUrl(): string {
    return this.HsShareService.getShareUrl(this.data.app);
  }

  /**
   * @description Set share Url state invalid
   */
  invalidateShareUrl(): void {
    this.HsShareService.invalidateShareUrl(this.data.app);
  }

  /**
   * @description Create share post on selected social network
   */
  shareOnSocial(): void {
    this.HsShareService.shareOnSocial(this.new_share, this.data.app);
  }

  ngOnInit() {
    this.hsSidebarService.addButton(
      {
        panel: 'permalink',
        module: 'hs.permalink',
        order: 11,
        fits: true,
        title: 'PANEL_HEADER.PERMALINK',
        description: 'SIDEBAR.descriptions.PERMALINK',
        icon: 'icon-share-alt',
      },
      this.data.app
    );

    this.HsShareUrlService.init(this.data.app);
    this.HsShareService.init(this.data.app);
    this.appRef = this.HsShareService.get(this.data.app);
  }
}
