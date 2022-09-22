import axios from "axios";

const url = process.env.REACT_APP_API_URL3 + "component";

// interface PaginationParams {
//   page?: number;
//   limit?: number;
//   sortField?: string;
//   sortKind?: string;
//   class_name?: string;
// }

interface TypeInterface {
  accessibilityPerformance: string;
  assetType: string;
  canDelete: boolean;
  category: string;
  codePerformance: string;
  color: string;
  constituents: string;
  createdAt: string;
  description: string;
  documents: string;
  durationUnit: string;
  expectedLife: string;
  features: string;
  finish: string;
  id: string;
  images: string;
  isActive: boolean;
  isDeleted: boolean;
  key: string;
  material: string;
  modelNo: string;
  modelReference: string;
  name: string;
  nominalHeight: string;
  nominalLength: string;
  nominalWidth: string;
  replacementCost: number;
  shape: string;
  size: string;
  sustainabilityPerformance: string;
  tags: [],
  updatedAt: string;
  warranty: string;
  warrantyDurationLabor: number;
  warrantyDurationParts: number;
  warrantyDurationUnit: string;
  warrantyGuarantorLabor: string;
  warrantyGuarantorParts: string;
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

const create = async (type: TypeInterface) => {
  return axios.post(url, type);
};

const update = async (id: string, type: TypeInterface) => {
  return axios.patch(url + "/" + id, type);
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
