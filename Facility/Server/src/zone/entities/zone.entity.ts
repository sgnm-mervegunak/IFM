import * as moment from 'moment';
import { BaseGraphObject } from 'src/common/baseobject/base.graph.object';

export class Zone extends BaseGraphObject {
  className: string = Zone.name;

  name: string;

  category: string;

  spaceNames: string[];

  code: string;

  description: string;

  tag: string[];

  createdOn: string = moment().format('YYYY-MM-DD HH:mm:ss');

  createdBy: string;

  externalSystem: string;

  externalObject: string;

  externalIdentifier: string;

  nodeKeys: [];

  nodeType: string = Zone.name;

  canDisplay=false

  images:string[];

  documents:string[];
}
