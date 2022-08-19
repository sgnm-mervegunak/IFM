import axios from "axios";

const url = process.env.REACT_APP_API_URL + "zone/";

interface JointSpaceInterface {
    name: string;
    code: string;
    tag: string[];
    m2: string;
    spaceType: string;
    status: string;
    jointStartDate: string;
    jointEndDate: string;
    nodeKeys: string[];
}

const findBuildingWithKey = async (key: string,realm: string) => {
    return axios.get(url + key + "/" + realm);
};

const createJointSpace = async (jointData: JointSpaceInterface) => {
    return axios.post(url, jointData);
};

const remove = async (key: string) => {
    return axios.delete(url + key);
};

const service = {
    findBuildingWithKey,
    createJointSpace,
    remove
};

export default service;
