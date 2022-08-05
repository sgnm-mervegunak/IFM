import axios from "axios";

const url = process.env.REACT_APP_API_URL + "classification";

// interface PaginationParams {
//   page?: number;
//   limit?: number;
//   sortField?: string;
//   sortKind?: string;
//   class_name?: string;
// }

interface ClassificationInterface {
  key: string;
  parentId?: string;
  name: string;
  code: string;
  tag: string[];
  description?: string;
  labels?: string[];
  formTypeId?: string;
}

interface ActiveInterface {
  realm: string;
  language: string;
}

interface ClassificationInterface2 {
  identity?: {
    low: string;
    high: string;
  };
  tag?: string[];

  name: string;
  code: string;
  key: string;
  hasParent?: boolean;
  labelclass?: string;
  selectable?: boolean;
  parent_id?: string;
  label: string;
}


// const findAll = async (query: PaginationParams) => {
//   return axios.get(
//     url +
//     `?page=${query.page}&limit=${query.limit}&orderBy=${query.sortKind}&orderByColumn=${query.sortField}&class_name=${query.class_name}`
//   );
// };

const findAll = async (params:ActiveInterface) => {
  params.language=params.language.toUpperCase();
  return axios.get(
    url + "/getClassificationsByLanguage/" + params.realm + "/" + params.language
  );
};

const findAllActive = async (params:ActiveInterface) => {
  params.language=params.language.toUpperCase();
  return axios.get(
    url + "/getClassificationByIsActiveStatus/" + params.realm + "/" + params.language
  );
};

const findOne = async (id: string) => {
  return axios.get(url + "/Classification/" + id);
};

const create = async (classification: ClassificationInterface) => {
  return axios.post(url, classification);
};

const update = async (id: string, classification: ClassificationInterface) => {
  return axios.patch(url + "/" + id, classification);
};

const remove = async (id: string) => {
  console.log(id);

  return axios.delete(url + '/' + id);
};

const relation = async (id1: string, id2: string) => {
  console.log(url + "/relation" + "/" + id1 + "/" + id2);

  return axios.post(url + "/relation" + "/" + id1 + "/" + id2);
};

const nodeInfo = async (key: string) => {
  return axios.get(url  + "/" + key);
};

const setActive = async (id: string) => {
  return axios.patch(url + "/setIsActiveTrueOfClassificationAndItsChild/" + id);
};

const setPassive = async (id: string) => {
  return axios.patch(url + "/setIsActiveFalseOfClassificationAndItsChild/" + id);
};

const service = { findAll, findAllActive, findOne, create, update, remove, relation, nodeInfo, setActive, setPassive };

export default service;
