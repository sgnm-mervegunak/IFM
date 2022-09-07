import { GeciciInterface } from "./gecici.interface";
import { JointSpaceAndZoneInterface } from "./joint.space.zone.interface";

export interface ZoneInterface<T> extends JointSpaceAndZoneInterface<T> {

  changeNodeBranch(id: string, target_parent_id: string, realm:string, language:string): any;
  findChildrenByFacilityTypeNode(language: string, realm: string, typename: string): any;
  addZonesToBuilding(file: Express.Multer.File, realm: string,buildingKey: string,language: string)
 
}