import axios from "axios";

const url = process.env.REACT_APP_API_FACILITY + "lazyLoading";

const getClassificationRootAndChildrenByLanguageAndRealm = async () => {
  return axios.get(url + "/getClassificationRootAndChildrenByLanguageAndRealm");
};

const loadClassification = async (key: string) => {
  return axios.get(url + "/loadClassification/" + key);
};

const loadClassificationWithPath = async (path: string[]) => {
  return axios.post(url + "/loadClassificationWithPath/", { path });
};
const service = {
  getClassificationRootAndChildrenByLanguageAndRealm,
  loadClassification,
  loadClassificationWithPath,
};

export default service;
