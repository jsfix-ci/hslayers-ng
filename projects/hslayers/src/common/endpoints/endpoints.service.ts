import {Injectable} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

import {EndpointErrorHandling, HsEndpoint} from './endpoint.interface';
import {HsCommonLaymanService} from '../layman/layman.service';
import {HsConfig} from '../../config.service';
import {HsUtilsService} from '../../components/utils/utils.service';

@Injectable({providedIn: 'root'})
export class HsCommonEndpointsService {
  endpointsFilled: BehaviorSubject<any> = new BehaviorSubject(null);
  endpoints: HsEndpoint[];

  constructor(
    public hsConfig: HsConfig,
    public hsCommonLaymanService: HsCommonLaymanService,
    public hsUtilsService: HsUtilsService
  ) {}

  init(app: string): void {
    this.fillEndpoints(app);
    this.hsConfig.configChanges.subscribe(() => this.fillEndpoints(app));
  }

  private fillEndpoints(app: string) {
    this.endpoints = [
      ...(this.hsConfig.get(app).status_manager_url
        ? [
            {
              type: 'statusmanager',
              title: 'Status manager',
              url: this.hsConfig.get(app).status_manager_url,
              onError: {compositionLoad: EndpointErrorHandling.ignore},
            },
          ]
        : []),
      ...(this.hsConfig.get(app).datasources || []).map((ds) => {
        const tmp = {
          url: ds.url,
          id: this.hsUtilsService.generateUuid(),
          type: ds.type,
          title: ds.title,
          onError: ds.onError,
          datasourcePaging: {
            start: 0,
            limit: this.getItemsPerPageConfig(ds),
            loaded: false,
          },
          compositionsPaging: {
            start: 0,
            limit: this.getItemsPerPageConfig(ds),
            loaded: false,
          },
          paging: {
            itemsPerPage: this.getItemsPerPageConfig(ds),
          },
          user: ds.user,
          originalConfiguredUser: ds.user,
          getCurrentUserIfNeeded: async () =>
            await this.hsCommonLaymanService.getCurrentUserIfNeeded(tmp),
        };
        return tmp;
      }),
    ]
      /**
       * Sort endpoints in order to give layman's
       * layers priority in duplicate filtering.
       */
      .sort((a, b) => a.type.localeCompare(b.type));

    if (this.endpoints) {
      this.endpointsFilled.next(this.endpoints);
    }
  }
  getItemsPerPageConfig(endpoint): number {
    return endpoint.paging !== undefined &&
      endpoint.paging.itemsPerPage !== undefined
      ? endpoint.paging.itemsPerPage
      : 10;
  }
}
