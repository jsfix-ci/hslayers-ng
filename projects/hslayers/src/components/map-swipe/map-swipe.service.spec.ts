import {TestBed} from '@angular/core/testing';

import {HsConfig} from '../../config.service';
import {HsConfigMock} from '../../config.service.mock';
import {HsEventBusService} from '../core/event-bus.service';
import {HsEventBusServiceMock} from '../core/event-bus.service.mock';
import {HsLayerManagerService} from '../layermanager/layermanager.service';
import {HsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service';
import {HsMapService} from '../map/map.service';
import {HsMapServiceMock} from '../map/map.service.mock';
import {HsMapSwipeService} from './map-swipe.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsToastService} from '../layout/toast/toast.service';
import {mockHsLayerShiftingService} from '../../common/layer-shifting/layer-shifting.service.mock';

class HsToastServiceMock {
  constructor() {}
  createToastPopupMessage() {
    return true;
  }
}

const HsLayerManagerServiceMock = {
  ...jasmine.createSpyObj('HsLayerManagerService', ['sortLayersByZ']),
};

describe('HsMapSwipeService', () => {
  let service: HsMapSwipeService;
  let hsConfig: HsConfig;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {provide: HsConfig, useValue: new HsConfigMock()},
        {provide: HsMapService, useValue: new HsMapServiceMock()},
        {provide: HsToastService, useValue: new HsToastServiceMock()},
        {
          provide: HsLayerShiftingService,
          useValue: mockHsLayerShiftingService(),
        },
        {
          provide: HsShareUrlService,
          useValue: {
            getParamValue: () => undefined,
            updateCustomParams: () => undefined,
          },
        },
        {provide: HsEventBusService, useValue: new HsEventBusServiceMock()},
        {
          provide: HsLayerManagerService,
          useValue: HsLayerManagerServiceMock,
        },
      ],
    });
    service = TestBed.inject(HsMapSwipeService);
    hsConfig = TestBed.inject(HsConfig);
    hsConfig.get('default').componentsEnabled = {
      mapSwipe: true,
    };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
