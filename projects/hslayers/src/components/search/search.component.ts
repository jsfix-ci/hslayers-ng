import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subscription} from 'rxjs';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';

@Component({
  selector: 'hs-search',
  templateUrl: './partials/search.component.html',
})
export class HsSearchComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy {
  replace = false;
  clearVisible = false;
  searchInputVisible: boolean;
  searchResultsReceivedSubscription: Subscription;
  name = 'search';

  constructor(
    private hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
    this.searchResultsReceivedSubscription =
      this.hsEventBusService.searchResultsReceived.subscribe(() => {
        this.clearVisible = true;
      });
  }
  ngOnDestroy(): void {
    this.searchResultsReceivedSubscription.unsubscribe();
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton(
      {
        panel: 'search',
        module: 'hs.search',
        order: 15,
        fits: true,
        title: 'PANEL_HEADER.SEARCH',
        description: 'SIDEBAR.descriptions.SEARCH',
        icon: 'icon-search',
      },
      this.data.app
    );
    window.innerWidth < 767
      ? (this.searchInputVisible = false)
      : (this.searchInputVisible = true);
  }
}
