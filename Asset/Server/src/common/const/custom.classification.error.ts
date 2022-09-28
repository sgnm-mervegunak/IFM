import { HttpException, HttpStatus } from "@nestjs/common";
import { CustomClassificationError } from "./custom.classification.enum";
import { I18NEnums } from "./i18n.enum";


  export function classification_import_error() {
    throw new HttpException({ key: I18NEnums.CLASSIFICATION_IMPORT_ERROR,code:CustomClassificationError.CLASSIFICATION_IMPORT_ERROR }, HttpStatus.BAD_REQUEST);
  }

  export function classification_already_exist() {
    throw new HttpException({ key: I18NEnums.CLASSIFICATION_ALREADY_EXIST ,code:CustomClassificationError.CLASSIFICATION_ALREADY_EXIST}, HttpStatus.BAD_REQUEST);
  }

  export function classification_already_exist_object() {
    return {
      message: 'error',
      code: CustomClassificationError.CLASSIFICATION_ALREADY_EXIST,
    };
  }

  export function classification_import_error_object() {
    return {
      message: 'error',
      code: CustomClassificationError.CLASSIFICATION_IMPORT_ERROR,
    };
  }

  export function default_error() {
    throw new HttpException({ key: I18NEnums.DEFAULT_ERROR}, HttpStatus.BAD_REQUEST);
  }