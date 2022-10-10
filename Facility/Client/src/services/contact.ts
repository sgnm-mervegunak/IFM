import axios from "axios";

const url = process.env.REACT_APP_API_FACILITY + "contact";

interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderByColumn?: string|undefined|null;
}

interface StructureInterface {
    key: string;
    parentId?: string;
    name: string;
    tag: string[];
    description?: string;
    labels?: string[];
    formTypeId?: string;
}

// const findAll = async (query: PaginationParams) => {
//     return axios.get(
//         url +
//         `?page=${query.page}&limit=${query.limit}&orderBy=${query.sortKind}&orderByColumn=${query.sortField}&class_name=${query.class_name}`
//     );
// };

// const findAll = async () => {
//     return axios.get(url);
// };

const findAll = async (query: PaginationParams) => {
    return axios.get(url + `?page=${query.page}&limit=${query.limit}&orderBy=${query.orderBy}&orderByColumn=${query.orderByColumn}`);
  };

const create = async (structure: StructureInterface) => {
    return axios.post(url, structure);
};

const update = async (id: string, structure: StructureInterface) => {
    return axios.patch(url + "/" + id, structure);
};

const remove = async (id: string) => {
    return axios.delete(url + '/' + id);
};

const relation = async (id1: string, id2: string) => {
    return axios.post(`${url}/relation/${id1}/${id2}`);
};

const nodeInfo = async (key: string) => {
    return axios.get(`${url}/${key}`);
};

const service = { findAll, create, update, remove, relation, nodeInfo };

export default service;
