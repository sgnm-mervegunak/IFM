import { HttpException, HttpStatus } from '@nestjs/common';
import { I18NEnums } from './const/i18n.enum';

export function WrongIdProvided() {
  throw new HttpException({ key: I18NEnums.WRONG_ID_PROVİDED, args: {} }, HttpStatus.BAD_REQUEST);
}

export function NodeNotFound() {
  throw new HttpException({ key: I18NEnums.NODE_NOT_FOUND, args: {} }, HttpStatus.BAD_REQUEST);
}
