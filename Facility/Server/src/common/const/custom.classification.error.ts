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
 
  export function space_has_already_relation() {
    throw new HttpException({ key: I18NEnums.SPACE_HAS_ALREADY_RELATION ,code:CustomClassificationError.SPACE_HAS_ALREADY_RELATION}, HttpStatus.BAD_REQUEST);
  }

  export function contact_already_exist(name) {
    throw new HttpException({ key: I18NEnums.CONTACT_ALREADY_EXIST ,code:CustomClassificationError.CONTACT_ALREADY_EXIST,args:{name}}, HttpStatus.BAD_REQUEST);
  }

  export function default_error() {
    throw new HttpException({ key: I18NEnums.DEFAULT_ERROR,code:CustomClassificationError.DEFAULT_ERROR}, HttpStatus.BAD_REQUEST);
  }

  export function there_are_no_spaces() {
    throw new HttpException({ key: I18NEnums.THERE_ARE_NO_SPACES,code:CustomClassificationError.THERE_ARE_NO_SPACES}, HttpStatus.NOT_FOUND);
  }

  export function there_are_no_jointSpaces() {
    throw new HttpException({ key: I18NEnums.THERE_ARE_NO_JOINTSPACES,code:CustomClassificationError.THERE_ARE_NO_JOINTSPACES}, HttpStatus.NOT_FOUND);
  }

  export function there_are_no_zones() {
    throw new HttpException({ key: I18NEnums.THERE_ARE_NO_ZONES,code:CustomClassificationError.THERE_ARE_NO_ZONES}, HttpStatus.NOT_FOUND);
  }

  export function type_already_exists(name) {
    throw new HttpException({ key: I18NEnums.TYPE_ALREADY_EXISTS,code:CustomClassificationError.TYPE_ALREADY_EXISTS,args:{name}}, HttpStatus.NOT_FOUND);
  }

  export function component_already_exists(name) {
    throw new HttpException({ key: I18NEnums.COMPONENT_ALREADY_EXISTS,code:CustomClassificationError.COMPONENT_ALREADY_EXISTS,args:{name}}, HttpStatus.NOT_FOUND);
  }

  export function component_already_exist_inside_a_system(name) {
    throw new HttpException({ key: I18NEnums.COMPONENT_ALREADY_EXIST_INSIDE_A_SYSTEM,code:CustomClassificationError.COMPONENT_ALREADY_EXIST_INSIDE_A_SYSTEM,args:{name}}, HttpStatus.NOT_FOUND);
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
  export function space_has_already_relation_object() {
    return {
      message: 'error',
      code: CustomClassificationError.SPACE_HAS_ALREADY_RELATION,
    };
  }

  export function  contact_already_exist_object(name) {
    return {
      message: 'error',
      code: CustomClassificationError.CONTACT_ALREADY_EXIST,
      name
    };
  }

  export function  there_are_no_spaces_object() {
    return {
      message: 'error',
      code: CustomClassificationError.THERE_ARE_NO_SPACES,
    };
  }

  export function  there_are_no_jointSpaces_object() {
    return {
      message: 'error',
      code: CustomClassificationError.THERE_ARE_NO_JOINTSPACES,
    };
  }

  export function  there_are_no_zones_object() {
    return {
      message: 'error',
      code: CustomClassificationError.THERE_ARE_NO_ZONES,
    };
  }

  export function  type_already_exists_object(name) {
    return {
      message: 'error',
      code: CustomClassificationError.TYPE_ALREADY_EXISTS,
      name
    };
  }

  export function  component_already_exists_object(name) {
    return {
      message: 'error',
      code: CustomClassificationError.COMPONENT_ALREADY_EXISTS,
      name
    };
  }


  export function  component_already_exist_inside_a_system_object(name) {
    return {
      message: 'error',
      code: CustomClassificationError.COMPONENT_ALREADY_EXIST_INSIDE_A_SYSTEM,
      name
    };
  }
