import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

export class BaseJointSpacesObject {
  key: string = generateUuid();
  isActive = true;
  isDeleted = false;
  canDelete = false;
  canDisplay = false;
  name = 'Joinet Space'
}
function generateUuid() {
  return uuidv4();
}