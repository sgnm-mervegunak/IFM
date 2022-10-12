import axios from "axios";

const url = process.env.REACT_APP_API_FACILITY + "zones/";

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



const findByKeyAndLeaf = async (key: string, leafType:string) => {
    return axios.get(url +"lazyLoading/"+key+"/"+leafType);
};

const loadStructureWithPath = async (path: string[]) => {
  return axios.post(url + "/lazyloading/path", { path });
};
const service = {
  findByKeyAndLeaf,
  loadStructureWithPath

};

export default service;
