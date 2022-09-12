import axios from 'axios';

const url = process.env.REACT_APP_API_URL + 'ExcelImportExport/';

interface ExportDto{
  buildingKeys: string[];
}

const exportSpaces = async (body: ExportDto) => {
  return axios.post(url + `exportSpaces`,body);
};

const exportZones = async (body: ExportDto) => {
  return axios.post(url + `exportZones`, body);
};

const exportJointSpaces = async (body: ExportDto) => {
  return axios.post(url + `exportJointSpaces`, body);
};

const importZones = async (buildingKey:string,formData:any) => {
  return axios.post(url + `addZoneswithCobie/${buildingKey}`, formData);
};

const service = { exportSpaces, exportZones,exportJointSpaces,importZones };

export default service;
