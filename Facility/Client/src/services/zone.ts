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

const remove = async (key: string) => {
    return axios.delete(url + key);
};

const service = {
    findBuildingWithKey,
    createZone,
    remove
};

export default service;
