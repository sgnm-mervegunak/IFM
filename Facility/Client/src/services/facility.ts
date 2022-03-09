import axios from 'axios';

const url = process.env.REACT_APP_API_URL + 'facility';

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface Facility {
  _id?: string;
  facility_name: string;
  brand_name: string;
  type_of_facility: string;
  classification_of_facility: object | string;
  country: string;
  city: string;
  address: string;
  label: string[];
  uuid?: string;
  __v?: number;
}

const findAll = async (query: PaginationParams) => {
  return axios.get(url + `?page=${query.page}&limit=${query.limit}`);
};

const findOne = async (id: string) => {
  return axios.get(url + '/' + id);
};

const create = async (facility: Facility) => {
  return axios.post(url, facility);
};

const update = async (id: string, facility: Facility) => {
  console.log(facility);
  return axios.patch(url + '/' + id, facility);
};

const remove = async (id: string) => {
  return axios.delete(url + '/' + id);
};

const test = async () => {
  for (let i = 1; i < 31; i++) {
    await axios
      .post(url, {
        facility_name: 'facility' + i,
        brand_name: 'facility' + i,
        type_of_facility: 'facility' + i,
        classification_of_facility: {},
        label: ['facility'],
        country: 'facility' + i,
        city: 'facility',
        address: 'facility' + i,
      })
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
};

const service = { findAll, findOne, create, update, remove, test };

export default service;