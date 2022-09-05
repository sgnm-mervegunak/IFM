import * as moment from 'moment';
import { BaseGraphObject } from 'src/common/baseobject/base.graph.object';

export class JointSpace extends BaseGraphObject {
  className: string = JointSpace.name;

  ArchitecturalName: string;

  ArchitecturalCode: string;

  name: string;

  code: string;

  m2?: string;

  spaceType: string;

  status: string;

  jointStartDate: string = moment().format('YYYY-MM-DD HH:mm:ss');

  jointEndDate: string;

  nodeKeys: [];

  nodeType: string = JointSpace.name;

  canDisplay = false;

  title: string;
}
