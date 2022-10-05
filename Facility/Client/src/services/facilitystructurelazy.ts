import axios from "axios";

const url = process.env.REACT_APP_API_FACILITY + "structures";

const findAll = async () => {
    return axios.get(url);
};

const lazyLoadByKey = (key: string) => {
    return axios.get(url + "/lazyloading" + "/" + key + '/Space')
}

const loadStructureWithPath = async (path: string[]) => {
    return axios.post(url + "/lazyloading/path", { path });
};

const loadStructureWithPathByKey = async (path: string[]) => {
    return axios.post(url + "/lazyloading/pathByKey", { path,label:"" });
};

const service = {
    findAll,
    lazyLoadByKey,
    loadStructureWithPath,
    loadStructureWithPathByKey
};

export default service;

