import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {NgModule} from '@angular/core';

import {HsCatalogueMetadataComponent} from './catalogue-metadata.component';
import {HsLanguageModule} from '../../../language/language.module';
import {HsUiExtensionsModule} from '../../../../common/widgets/ui-extensions.module';

@NgModule({
  imports: [CommonModule, FormsModule, HsLanguageModule, HsUiExtensionsModule],
  exports: [HsCatalogueMetadataComponent],
  declarations: [HsCatalogueMetadataComponent],
  providers: [],
})
export class HsCatalogueMetadataModule {}
