import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsAddDataCommonModule} from '../../common/common.module';
import {HsCommonUrlModule} from '../../common/url/url.module';
import {HsFileRasterComponent} from './raster.component';
import {HsLanguageModule} from '../../../language/language.module';
import {HsUploadModule} from '../../../../common/upload/upload.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HsAddDataCommonModule,
    HsCommonUrlModule,
    HsLanguageModule,
    HsUploadModule,
  ],
  exports: [HsFileRasterComponent],
  declarations: [HsFileRasterComponent],
  providers: [],
})
export class HsFileRasterModule {}
