import axios from "axios";

const url = process.env.REACT_APP_API_URL + "structureAssetRelation/";

const findAll = async (key: string) => {
    return axios.get(url + key);
};


const remove = async (key: string) => {
    return axios.delete(url + key);
};

const service = { findAll, remove };

export default service;
