import {
  CUSTOM_ELEMENTS_SCHEMA,
  NO_ERRORS_SCHEMA,
  NgModule,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HsMiniSidebarComponent} from './mini-sidebar.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {HsSidebarComponent} from './sidebar.component';
import {HsSidebarService} from './sidebar.service';
import {SortByPipe} from './sortBy.pipe';
import {TranslateModule} from '@ngx-translate/core';
@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
  declarations: [HsMiniSidebarComponent, HsSidebarComponent, SortByPipe],
  imports: [CommonModule, HsPanelHelpersModule, TranslateModule],
  exports: [HsMiniSidebarComponent, HsSidebarComponent],
  providers: [HsSidebarService],
  entryComponents: [HsMiniSidebarComponent, HsSidebarComponent],
})
export class HsSidebarModule {}