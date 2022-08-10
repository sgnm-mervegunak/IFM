import axios from "axios";

const url = process.env.REACT_APP_API_URL + "jointspace/";

const findBuildingWithKey = async (key: string,realm: string) => {
    return axios.get(url + key + "/" + realm);
};

const service = {
    findBuildingWithKey
};

export default service;
