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
export function FacilityStructureCanNotDeleteExceptions(node1) {
  throw new HttpException({ key: I18NEnums.WRONG_FACILITY_STRUCTURE_CAN_NOT_DELETE, args: { node1: node1} }, HttpStatus.BAD_REQUEST);
}
export function WrongFacilityStructurePropsRulesExceptions(prop, rule) {
  throw new HttpException({ key: I18NEnums.WRONG_FACILITY_STRUCTURE_PROPS_RULES, args: { prop: prop, rule: rule} }, HttpStatus.BAD_REQUEST);
}
export function WrongClassificationParentExceptions(node1, node2) {
  throw new HttpException({ key: I18NEnums.WRONG_CLASSIFICATION_PARENT, args: {node1:node1, node2:node2 } }, HttpStatus.BAD_REQUEST);
}
export function FacilityNodeNotFoundException() {
  throw new HttpException({ key: I18NEnums.NODE_NOT_FOUND, args: {} }, HttpStatus.NOT_FOUND);
}
  export function ValueNotNullException(val) {
    throw new HttpException({key: I18NEnums.NULL_VALUE, args: {val:val} }, HttpStatus.BAD_REQUEST);  
  
}
export function NotUniqueException(val) {
  throw new HttpException({key: I18NEnums.NOT_UNIQUE, args: {val:val} }, HttpStatus.BAD_REQUEST);  

}