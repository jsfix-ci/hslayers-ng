import {CUSTOM_ELEMENTS_SCHEMA, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {TranslateModule} from '@ngx-translate/core';

import {HsAddDataCommonModule} from '../../common/addData-common.module';
import {HsAddDataFileShpComponent} from './addData-file-shp.component';
import {HsAddDataFileShpService} from './addData-file-shp.service';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    HsUiExtensionsModule,
    HsAddDataCommonModule,
  ],
  exports: [HsAddDataFileShpComponent],
  declarations: [HsAddDataFileShpComponent],
  providers: [HsAddDataFileShpService],
})
export class HsAddDataFileShpModule {}