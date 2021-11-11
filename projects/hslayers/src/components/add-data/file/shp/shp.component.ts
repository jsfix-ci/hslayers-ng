import {Component, OnInit} from '@angular/core';

import {HsAddDataCommonFileService} from '../../common/common-file.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataFileBaseComponent} from '../file-base.component';
import {HsFileShpService} from './shp.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUploadedFiles} from '../../../../common/upload/upload.component';

@Component({
  selector: 'hs-file-shp',
  templateUrl: './shp.component.html',
})
export class HsFileShpComponent
  extends HsAddDataFileBaseComponent
  implements OnInit
{
  dataType = 'shp';

  constructor(
    public hsFileShpService: HsFileShpService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataCommonFileService: HsAddDataCommonFileService,
    public hsLayoutService: HsLayoutService
  ) {
    super(hsAddDataCommonService, hsAddDataCommonFileService, hsLayoutService);
  }

  ngOnInit(): void {
    this.acceptedFormats = '.shp, .shx, .dbf, .sbn';
    this.baseDataType = this.dataType;
    super.ngOnInit();
  }

  async handleFileUpload(evt: HsUploadedFiles): Promise<void> {
    await this.hsFileShpService.read(evt);
  }
}
