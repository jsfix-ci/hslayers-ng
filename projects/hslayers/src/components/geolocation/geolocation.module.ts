import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsGeolocationComponent} from './geolocation.component';
import {HsLanguageModule} from '../language/language.module';
import {HsPanelHelpersModule} from '../layout/panels/panel-helpers.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [HsGeolocationComponent],
  imports: [FormsModule, CommonModule, HsPanelHelpersModule, HsLanguageModule],
  exports: [HsGeolocationComponent],
})
export class HsGeolocationModule {}
