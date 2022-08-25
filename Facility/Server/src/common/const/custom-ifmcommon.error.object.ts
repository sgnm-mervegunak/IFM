
import { bussinesErrorObject } from '../interface/errorMessage.interface';
import { CustomIfmCommonError } from './custom-ifmcommon.error.enum';


export const example1_error: bussinesErrorObject = {
  message: 'Example1 Example1 Exampl1 Example1',
  code: CustomIfmCommonError.EXAMPLE1,
  params:{}
};
export const example2_error: bussinesErrorObject = {
  message: 'Example2 Example2 Exampl2 Example2',
  code: CustomIfmCommonError.EXAMPLE2,
  params:{}
};
