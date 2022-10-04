import axios from "axios";

const url = process.env.REACT_APP_API_FACILITY + "structure";
const url2 = process.env.REACT_APP_API_FACILITY + "structureAssetRelation/";
const url3 = process.env.REACT_APP_API_FACILITY + "structureWinformRelation/";

interface PaginationParams {
    page?: number;
    limit?: number;
    sortField?: string;
    sortKind?: string;
    class_name?: string;
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

interface AssetInterface {
    assetKey: string;
}

interface FormInterface {
    formKey: string;
}

// const findAll = async (query: PaginationParams) => {
//     return axios.get(
//         url +
//         `?page=${query.page}&limit=${query.limit}&orderBy=${query.sortKind}&orderByColumn=${query.sortField}&class_name=${query.class_name}`
//     );
// };

const findAll = async () => {
    return axios.get(url);
};

const findStuctureFirstLevel = async (realm: string) => {
    return axios.get(url + "/structurefirstlevel/nodes/FacilityStructure/");
};

const findAssets = async (key: string) => {
    return axios.get(url2 + key);
};

// Kullanılmıyor
const create = async (structure: StructureInterface) => {
    return axios.post(url, structure);
};

const createStructure = async (key: string, structure: any) => {

    return axios.post(url + "/" + key, structure);
};

const createAsset = async (key: string, asset: AssetInterface) => {

    return axios.post(url2 + key, asset);
};

const createForm = async (key: string, form: FormInterface) => {

    return axios.post(url3 + key, form);
};

const update = async (key: string, structure: any) => {
    return axios.patch(url + "/" + key, structure);
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

const getFacilityTypes = async (label: string) => {
    return axios.get(url + "/structuretypes/" + label);
};

const getFacilityTypeProperties = async (
    second_child_node_name: string,
) => {
    return axios.get(url + "/structuretypes/" + "properties/" + "all" + "/" + second_child_node_name);
};

const getOneByLabel = () => {
    return axios.get("http://localhost:3010/lazyLoading/FacilityStructure")
}

const getOneByKey = (key: string) => {
    return axios.get("http://localhost:3010/lazyLoading/" + key + '/Space')
}

const lazyLoadByKey = (key: string) => {
    return axios.get(url + "/lazyloading" + "/" + key + '/Space')
}

const service = {
    findAll,
    findAssets,
    create,
    createAsset,
    createForm,
    update,
    remove,
    relation,
    nodeInfo,
    getFacilityTypes,
    getFacilityTypeProperties,
    createStructure,
    findStuctureFirstLevel,
    getOneByLabel,
    getOneByKey,
    lazyLoadByKey
};

export default service;
