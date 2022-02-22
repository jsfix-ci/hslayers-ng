import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HS_PRMS} from '../permalink/get-params';
import {HsConfig} from '../../config.service';
import {HsCoreService} from './../core/core.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsSidebarService} from './sidebar.service';

@Component({
  selector: 'hs-sidebar',
  templateUrl: './partials/sidebar.html',
})
export class HsSidebarComponent implements OnInit, OnDestroy {
  configChangesSubscription: Subscription;
  @Input() app = 'default';
  constructor(
    public HsLayoutService: HsLayoutService,
    public HsCoreService: HsCoreService,
    public HsSidebarService: HsSidebarService,
    public HsPermalinkUrlService: HsShareUrlService,
    public HsConfig: HsConfig
  ) {}
  ngOnDestroy(): void {
    this.configChangesSubscription.unsubscribe();
  }
  ngOnInit(): void {
    const panel = this.HsPermalinkUrlService.getParamValue(HS_PRMS.panel);
    if (panel) {
      if (!this.HsLayoutService.get(this.app).minisidebar) {
        this.HsLayoutService.setMainPanel(panel, this.app);
      }
    }
    this.HsSidebarService.setPanelState(
      this.HsSidebarService.get(this.app).buttons,
      this.app
    );
    this.configChangesSubscription = this.HsConfig.configChanges.subscribe(
      (_) => {
        this.HsSidebarService.setPanelState(
          this.HsSidebarService.get(this.app).buttons,
          this.app
        );
      }
    );
    this.HsSidebarService.sidebarLoad.next(this.app);
  }

  /**
   * Seat whether to show all sidebar buttons or just a
   * subset of important ones
   */
  toggleUnimportant(): void {
    this.HsSidebarService.get(this.app).showUnimportant =
      !this.HsSidebarService.get(this.app).showUnimportant;
  }
  /**
   * Toggle sidebar mode between expanded and narrow
   */
  toggleSidebar(): void {
    this.HsLayoutService.get(this.app).sidebarExpanded =
      !this.HsLayoutService.get(this.app).sidebarExpanded;
    setTimeout(() => {
      this.HsCoreService.updateMapSize(this.app);
    }, 110);
  }
}
