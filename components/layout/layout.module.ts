import {BootstrapComponent} from '../../bootstrap.component';
import {CommonModule} from '@angular/common';
import {HsCesiumModule} from '../hscesium';
import {HsCompositionsModule} from '../compositions';
import {HsConfirmModule} from './../../common/confirm/confirm.module';
import {HsDatasourcesModule} from '../datasource-selector';
import {HsDialogContainerComponent} from './dialogs/dialog-container.component';
import {HsDialogContainerService} from './dialogs/dialog-container.service';
import {HsDialogHostDirective} from './dialogs/dialog-host.directive';
import {HsDrawModule} from '../draw';
import {HsFeatureTableModule} from '../feature-table';
import {HsGeolocationModule} from '../geolocation';
import {HsInfoModule} from '../info';
import {HsLanguageModule} from '../language';
import {HsLayerManagerModule} from '../layermanager';
import {HsLayoutComponent} from './layout.component';
import {HsLayoutService} from './layout.service';
import {HsLegendModule} from '../legend';
import {HsMapModule} from '../map';
import {HsMeasureModule} from '../measure';
import {HsPanelHelpersModule} from './panels/panel-helpers.module';
import {HsPrintModule} from '../print';
import {HsQueryModule} from '../query';
import {HsSaveMapModule} from '../save-map';
import {HsSearchModule} from '../search';
import {HsShareModule} from '../permalink';
import {HsSidebarModule} from '../sidebar';
import {HsStylerModule} from '../styles';
import {HsToolbarModule} from '../toolbar';
import {HsTripPlannerModule} from '../trip_planner';
import {NgModule} from '@angular/core';
import {TranslateModule, TranslateStore} from '@ngx-translate/core';

@NgModule({
  declarations: [
    BootstrapComponent,
    HsDialogContainerComponent,
    HsDialogHostDirective,
    HsLayoutComponent,
  ],
  imports: [
    CommonModule,
    TranslateModule,
    HsConfirmModule,
    HsMapModule,
    HsCesiumModule,
    HsLayerManagerModule,
    HsGeolocationModule,
    HsToolbarModule,
    HsInfoModule,
    HsSidebarModule,
    HsLegendModule,
    HsDatasourcesModule,
    HsCompositionsModule,
    HsMeasureModule,
    HsPrintModule,
    HsShareModule,
    HsStylerModule,
    HsQueryModule,
    HsSaveMapModule,
    HsLanguageModule,
    HsFeatureTableModule,
    HsSearchModule,
    HsTripPlannerModule,
    HsDrawModule,
    HsPanelHelpersModule,
  ],
  providers: [HsLayoutService, HsDialogContainerService, TranslateStore],
  entryComponents: [
    BootstrapComponent,
    HsDialogContainerComponent,
    HsLayoutComponent,
  ],
  exports: [BootstrapComponent, HsDialogContainerComponent, HsLayoutComponent],
})
export class HsLayoutModule {
  ngDoBootstrap(): void {}
}
