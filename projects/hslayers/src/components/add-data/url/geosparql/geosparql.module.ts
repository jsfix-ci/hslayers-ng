import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsLanguageModule} from '../../../language/language.module';
import {HsUrlGeoSparqlComponent} from './geosparql.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLanguageModule,
  ],
  exports: [HsUrlGeoSparqlComponent],
  declarations: [HsUrlGeoSparqlComponent],
})
export class HsUrlGeoSparqlModule {}
