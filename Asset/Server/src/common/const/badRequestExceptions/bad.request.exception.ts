import { HttpException, HttpStatus } from '@nestjs/common';
import { I18NEnums } from '../i18n.enum';



export function WrongClassificationParentExceptions(node1, node2) {
  throw new HttpException({ key: I18NEnums.WRONG_CLASSIFICATION_PARENT, args: {node1:node1, node2:node2 } }, HttpStatus.BAD_REQUEST);
}

