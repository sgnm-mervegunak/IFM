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

const findBuildingWithKey = async (key: string) => {
    return axios.get(url + "children/" + key);
};

const createJointSpace = async (jointData: JointSpaceInterface) => {
    return axios.post(url, jointData);
};

const update = async (key: string, body: any) => {
    return axios.patch(url + key, body);
};

const remove = async (key: string) => {
    return axios.delete(url + key);
};

const service = {
    findBuildingWithKey,
    createJointSpace,
    remove,
    update
};

export default service;
