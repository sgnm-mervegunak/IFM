import axios from "axios";

const url = process.env.REACT_APP_API_URL + "jointspace/";

interface JointSpaceInterface {
    ArchitecturalName: string;
    ArchitecturalCode: string;
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

const service = {
    findBuildingWithKey,
    createJointSpace
};

export default service;
