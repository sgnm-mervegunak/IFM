import { GeciciInterface } from "./gecici.interface";

export interface ZoneInterface<T> extends GeciciInterface<T> {

    addZonesToBuilding(file: Express.Multer.File, realm: string,buildingKey: string,language: string)
 
}