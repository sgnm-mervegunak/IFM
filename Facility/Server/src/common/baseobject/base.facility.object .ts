import * as moment from 'moment';
import { v4 as uuidv4 } from 'uuid';

export class BaseFacilityObject {
  key: string = generateUuid();
  createdBy: string = 'Atamer Atalay'; //kullanıcı session dan alınacak 
  createdOn = moment().format('YYYY-MM-DD HH:mm:ss');
  siteName = 'IFM';  //realm adı sessiondan alınacak
  isActive = true;
  isDeleted = false;
  canDelete = true;
  canDisplay = true;
}

function generateUuid() {
  return uuidv4();
}