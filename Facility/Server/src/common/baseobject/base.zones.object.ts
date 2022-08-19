import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

export class BaseZonesObject {
  key: string = generateUuid();
  isActive = true;
  isDeleted = false;
  canDelete = false;
  canDisplay = false;
  name = 'Zones';
}
function generateUuid() {
  return uuidv4();
}
