import axios from 'axios';

const url = process.env.REACT_APP_API_URL + 'ExcelExport/';

interface ExportDto{
  realm: string;
  buildingKeys: string[];
}

const exportSpaces = async (body: ExportDto) => {
  return axios.post(url + `exportSpaces`,body);
};

const service = { exportSpaces };

export default service;
