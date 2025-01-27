import {accessRightsModel} from '../../../components/add-data/common/access-rights.model';

export type GetLayersResponse = {
  access_rights: accessRightsModel;
  bounding_box: number[];
  name: string;
  title: string;
  updated_at: string;
  url: string;
  uuid: string;
  workspace: string;
};
