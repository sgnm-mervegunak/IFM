import { HttpException, HttpStatus } from "@nestjs/common";
import { CustomClassificationError } from "./custom.classification.enum";
import { I18NEnums } from "./i18n.enum";


  export function classification_import_error() {
    throw new HttpException({ key: I18NEnums.CLASSIFICATION_IMPORT_ERROR,code:CustomClassificationError.CLASSIFICATION_IMPORT_ERROR }, HttpStatus.BAD_REQUEST);
  }

  export function classification_already_exist() {
    throw new HttpException({ key: I18NEnums.CLASSIFICATION_ALREADY_EXIST ,code:CustomClassificationError.CLASSIFICATION_ALREADY_EXIST}, HttpStatus.BAD_REQUEST);
  }


  export function building_already_exist() {
    throw new HttpException({ key: I18NEnums.BUILDING_ALREADY_EXIST ,code:CustomClassificationError.BUILDING_ALREADY_EXIST}, HttpStatus.BAD_REQUEST);
  }

  export function floor_already_exist(name) {
    throw new HttpException({ key: I18NEnums.FLOOR_ALREADY_EXIST ,code:CustomClassificationError.FLOOR_ALREADY_EXIST,args:{name}}, HttpStatus.BAD_REQUEST);
  }
  export function space_already_exist(name) {
    throw new HttpException({ key: I18NEnums.SPACE_ALREADY_EXIST ,code:CustomClassificationError.SPACE_ALREADY_EXIST,args:{name}}, HttpStatus.BAD_REQUEST);
  }

  export function zone_already_exist(name) {
    throw new HttpException({ key: I18NEnums.ZONE_ALREADY_EXIST ,code:CustomClassificationError.ZONE_ALREADY_EXIST,args:{name}}, HttpStatus.BAD_REQUEST);
  }


  export function classification_import_error_object() {
    return {
      message: 'error',
      code: CustomClassificationError.CLASSIFICATION_IMPORT_ERROR,
    };
  }

  export function classification_already_exist_object() {
    return {
      message: 'error',
      code: CustomClassificationError.CLASSIFICATION_ALREADY_EXIST,
    };
  }


  export function floor_already_exist_object(name) {
    return {
      message: 'error',
      code: CustomClassificationError.FLOOR_ALREADY_EXIST,
      name
    };
  }

  export function building_already_exist_object() {
    return {
      message: 'error',
      code: CustomClassificationError.BUILDING_ALREADY_EXIST
    };
  }

  export function space_already_exist_object(name) {
    return {
      message: 'error',
      code: CustomClassificationError.SPACE_ALREADY_EXIST,
      name
    };
  }


  export function zone_already_exist_object(name) {
    return {
      message: 'error',
      code: CustomClassificationError.ZONE_ALREADY_EXIST,
      name
    };
  }