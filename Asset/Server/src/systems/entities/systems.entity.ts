import { BaseAssetObject } from 'src/common/baseobject/base.asset.object';

export class System extends BaseAssetObject{
    name: string;   //required
    description: string; //optional
    images: File[];  //optional
    documents: Object[];  //optional
   
  

}
