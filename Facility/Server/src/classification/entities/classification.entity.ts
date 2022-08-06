import { BaseGraphObject } from 'src/common/baseobject/base.graph.object';

export class Classification extends BaseGraphObject {
  labels?: string[];
  realm?: string;
  isRoot?: boolean;
  code: string;
  className: string = Classification.name;
}
