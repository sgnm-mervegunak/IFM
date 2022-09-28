import { BaseAssetObject } from 'src/common/baseobject/base.asset.object';

export class System extends BaseAssetObject{
    className: string = System.name;
    name: string;   //required
    description: string; //optional
    images: string;  //optional
    documents: string;  //optional
   
  

}
