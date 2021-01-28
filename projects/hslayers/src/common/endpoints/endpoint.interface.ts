import {HsAddDataLayerDescriptor} from '../../components/data/catalogue/add-data-layer-descriptor.interface';

export interface HsEndpoint {
  httpCall: any;
  type: string;
  title: string;
  url: string;
  download?: boolean;
  language?;
  listLoading?;
  layers?: HsAddDataLayerDescriptor[];
  liferayProtocol?;
  originalConfiguredUser?;
  user?;
  code_list_url?: string;
  code_lists?;
  version?: string;
  datasourcePaging?: {
    start?: number;
    limit: number;
    loaded?: boolean;
    matched?;
    next?;
  };
  compositions?: any;
  compositionsPaging?: {
    start?: number;
    limit: number;
    next?;
    matched?;
    loaded?: boolean;
  };
  paging?: {
    itemsPerPage: number;
  };
  getCurrentUserIfNeeded?(endpoint: HsEndpoint): Promise<void>;
}
