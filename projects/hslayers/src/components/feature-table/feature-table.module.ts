import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsFeatureFilterPipe} from './feature-filter.pipe';
import {HsFeatureTableComponent} from './feature-table.component';
import {HsLanguageModule} from '../language/language.module';
import {HsLayerFeaturesComponent} from './layer-features.component';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    HsFeatureTableComponent,
    HsLayerFeaturesComponent,
    HsFeatureFilterPipe,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HsPanelHelpersModule,
    HsLanguageModule,
    NgbDropdownModule,
  ],
  exports: [
    HsFeatureTableComponent,
    HsLayerFeaturesComponent,
    HsFeatureFilterPipe,
  ],
})
export class HsFeatureTableModule {}
