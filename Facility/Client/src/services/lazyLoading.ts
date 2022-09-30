import axios from "axios";

const url = process.env.REACT_APP_API_FACILITY + "lazyLoading";

const getClassificationRootAndChildrenByLanguageAndRealm = async () => {
  return axios.get(url + "/getClassificationRootAndChildrenByLanguageAndRealm");
};

const loadClassification = async (key: string) => {
  return axios.get(url + "/loadClassification/" + key);
};
const service = {getClassificationRootAndChildrenByLanguageAndRealm,loadClassification};

export default service;
