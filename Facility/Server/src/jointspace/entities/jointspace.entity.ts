import * as moment from 'moment';
import { BaseGraphObject } from 'src/common/baseobject/base.graph.object';

export class JointSpace extends BaseGraphObject {
  className: string = JointSpace.name;

  // architecturalName: string;

  // architecturalCode: string;

  // name: string;

  // code: string;

  // operatorName: string;

  // operatorCode: string;

  // category: string;

  // usage: string;

  // status: string;

  // roomTag: string[];

  // images: string;

  // usableHeight: number;

  // grossArea: number;

  // netArea: number;

  jointStartDate: string = moment().format('YYYY-MM-DD HH:mm:ss');

  jointEndDate?: string = moment().format('YYYY-MM-DD HH:mm:ss');

  // nodeKeys: [];

  nodeType: string = JointSpace.name;

  canDisplay = false;

  title: string;
}
