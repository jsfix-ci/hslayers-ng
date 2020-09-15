/* eslint-disable prefer-arrow-callback */
/* eslint-disable angular/di */
/* eslint-disable no-undef */
'use strict';
import '../core/core-ajs.mock';
import 'angular-mocks';
import * as angular from 'angular';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';
import {Vector as VectorSource} from 'ol/source';

import {HsConfig} from '../../config.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapComponent} from './map.component';
import {HsMapHostDirective} from './map.directive';
import {HsMapService} from './map.service';
import {HsUtilsService} from '../utils/utils.service';
import {HsUtilsServiceMock} from '../utils/utils.service.mock';

import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsShareUrlService} from '../permalink/share-url.service';

class emptyMock {
  constructor() {}
}

class HsConfigMock {
  constructor() {}
}

const mockHsShareUrlService = jasmine.createSpyObj('HsShareUrlService', [
  'getParamValue',
]);

describe('HsMapService', () => {
  let fixture: ComponentFixture<HsMapComponent>;
  let component: HsMapComponent;
  let service: HsMapService;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });
  beforeEach(() => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [CommonModule],
      declarations: [HsMapComponent, HsMapHostDirective],
      providers: [
        {provide: HsShareUrlService, useValue: mockHsShareUrlService},
        {provide: HsCoreService, useValue: new emptyMock()},
        HsMapService,
        {provide: HsLayoutService, useValue: new emptyMock()},
        HsEventBusService,
        {provide: HsUtilsService, useValue: new HsUtilsServiceMock()},
        {provide: HsConfig, useValue: new HsConfigMock()},
      ],
    }); //.compileComponents();
    fixture = TestBed.createComponent(HsMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    service = TestBed.inject(HsMapService);
  });

  it('Map component should be available', () => {
    expect(component).toBeTruthy();
  });

  it('should create map object', async function () {
    const map = await service.loaded();
    expect(map).toBeDefined();
  });

  it('should not add duplicate layers', async function () {
    await service.loaded();
    const layer1 = new VectorLayer({
      title: 'Bookmarks',
      source: new VectorSource({}),
    });
    service.map.addLayer(layer1);

    const layer2 = new VectorLayer({
      title: 'Bookmarks',
      source: new VectorSource({}),
    });
    const exists = service.layerAlreadyExists(layer2);
    expect(exists).toBe(true);
  });

  it('find layer for feature', async function () {
    await service.loaded();
    const featureLayer = new VectorLayer({
      title: 'Feature layer',
      source: new VectorSource({}),
    });
    service.map.addLayer(featureLayer);
    const feature = new Feature({geometry: new Point([0, 0]), name: 'test'});
    featureLayer.getSource().addFeatures([feature]);
    const foundLayer = service.getLayerForFeature(feature);
    expect(foundLayer).toBe(featureLayer);
  });
});
