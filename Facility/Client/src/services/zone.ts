import axios from "axios";

const url = process.env.REACT_APP_API_URL + "zone/";

interface ZoneInterface {
    name: string;
    category: string;
    spaceNames: string;
    code: string;
    description: string;
    credatedBy: string;
    createdOn: string;
    externalSystem: string;
    externalObject: string;
    tags: string[];
    nodeKeys: string[];
}

const findBuildingWithKey = async (key: string) => {
    return axios.get(url + "zones/" + key);
};

const createZone = async (createData: ZoneInterface) => {
    return axios.post(url, createData);
};

const update = async (key: string, body: any) => {
    return axios.patch(url + key, body);
};

const remove = async (key: string) => {
    return axios.delete(url + key);
};

const nodeInfo = async (key: string) => {
    return axios.get(`${url}${key}`);
};

const service = {
    findBuildingWithKey,
    createZone,
    update,
    remove,
    nodeInfo
};

export default service;
