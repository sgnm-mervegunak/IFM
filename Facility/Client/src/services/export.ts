import axios from 'axios';

const url = process.env.REACT_APP_API_URL + 'ExcelExport/';

interface ExportDto{
  buildingKeys: string[];
}

const exportSpaces = async (body: ExportDto) => {
  return axios.post(url + `exportSpaces`,body);
};

const exportZones = async (body: ExportDto) => {
  return axios.post(url + `exportZones`, body);
};

const service = { exportSpaces, exportZones };

export default service;
