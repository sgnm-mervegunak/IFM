import axios from "axios";

const url = process.env.REACT_APP_API_URL3 + "systems";

// interface PaginationParams {
//   page?: number;
//   limit?: number;
//   sortField?: string;
//   sortKind?: string;
//   class_name?: string;
// }

interface SystemInterface {
  
}

interface ActiveInterface {
  realm: string;
  language: string;
}


// const findAll = async (query: PaginationParams) => {
//   return axios.get(
//     url +
//     `?page=${query.page}&limit=${query.limit}&orderBy=${query.sortKind}&orderByColumn=${query.sortField}&class_name=${query.class_name}`
//   );
// };

// const findAll = async (key: string) => {
//   return axios.get(url + "/type/" + key);
// };

const findAll = async () => {
  return axios.get(url);
};

const findAllActive = async () => {
  return axios.get(
    url + "/getClassificationByIsActiveStatus/" + "active"
  );
};

const create = async (system: SystemInterface) => {
  return axios.post(url, system);
};

const update = async (id: string, system: SystemInterface) => {
  return axios.patch(url + "/" + id, system);
};

const remove = async (id: string) => {
  console.log(id);

  return axios.delete(url + '/' + id);
};

const nodeInfo = async (key: string) => {
  return axios.get(url + "/" + key);
};

const setActive = async (id: string) => {
  return axios.patch(url + "/setIsActiveTrueOfClassificationAndItsChild/" + id);
};

const setPassive = async (id: string) => {
  return axios.patch(url + "/setIsActiveFalseOfClassificationAndItsChild/" + id);
};

const service = { findAll, findAllActive, create, update, remove, nodeInfo, setActive, setPassive };

export default service;
