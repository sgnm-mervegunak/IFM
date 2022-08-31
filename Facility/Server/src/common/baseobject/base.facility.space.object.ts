import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { BaseFacilityObject } from './base.facility.object ';

export class BaseFacilitySpaceObject extends BaseFacilityObject {
  isBlocked = false;
}

function generateUuid() {
  return uuidv4();
}