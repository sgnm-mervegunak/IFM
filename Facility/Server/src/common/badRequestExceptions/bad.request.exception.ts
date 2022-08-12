import { HttpException, HttpStatus } from '@nestjs/common';
import { I18NEnums } from '../const/i18n.enum';

export function WrongFacilityStructureExceptions(node1,node2) {
  throw new HttpException({ key: I18NEnums.WRONG_FACILITY_STRUCTURE, args: { node1: node1, node2: node2 } }, HttpStatus.NOT_FOUND);
}
export function WrongFacilityStructurePropsExceptions(node1) {
  throw new HttpException({ key: I18NEnums.WRONG_FACILITY_STRUCTURE_PROPS, args: { node1: node1} }, HttpStatus.NOT_FOUND);
}
export function FacilityStructureDeleteExceptions(node1) {
  throw new HttpException({ key: I18NEnums.WRONG_FACILITY_STRUCTURE_DELETE, args: { node1: node1} }, HttpStatus.NOT_FOUND);
}
