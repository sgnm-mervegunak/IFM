import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseAssetObject {
  key: string = generateUuid();
  createdOn = moment().format('YYYY-MM-DD HH:mm:ss');
  updatedOn = moment().format('YYYY-MM-DD HH:mm:ss');
  isActive = true;
  isDeleted = false;
  canDelete=true;

  tag: string[] = [];
  externalSystem: string = '';
  externalObject: string = '';
  externalIdentifier: string = '';
}

function generateUuid() {
  return uuidv4();
}
