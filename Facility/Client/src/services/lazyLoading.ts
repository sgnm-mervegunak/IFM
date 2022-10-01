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

const getActiveClassificationRootAndChildrenByLanguageAndRealm = async () => {
  return axios.get(
    url + "/getActiveClassificationRootAndChildrenByLanguageAndRealm"
  );
};

const loadActiveClassification = async (key: string) => {
  return axios.get(url + "/loadActiveClassification/" + key);
};

const loadActiveClassificationWithPath = async (path: string[]) => {
  return axios.post(url + "/loadActiveClassificationWithPath/", { path });
};

const service = {
  getClassificationRootAndChildrenByLanguageAndRealm,
  loadClassification,
  loadClassificationWithPath,
  getActiveClassificationRootAndChildrenByLanguageAndRealm,
  loadActiveClassification,
  loadActiveClassificationWithPath,
};

export default service;
