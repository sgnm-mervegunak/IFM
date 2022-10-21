import axios from "axios";
import qs from "qs";

const url = process.env.REACT_APP_API_FACILITY + "contact";

interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderByColumn?: string[] | undefined | null;
}

interface SearchParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderByColumn?: string | undefined | null;
    searchString?: string;
}

interface SearchOrderParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderByColumn?: string | undefined | null;
    searchString?: string;
    searchedStringTotalCount?: number;
}

interface SearchCountParams {
    searchString?: string;
}

interface SearchColumnParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderByColumn?: string | undefined | null;
    searchColumn?: string;
    searchString?: string;
    searchType?: string;
}

interface SearchColumnOrderParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderByColumn?: string | undefined | null;
    searchColumn?: string;
    searchString?: string;
    searchType?: string;
    searchedStringTotalCount?: number;
}

interface SearchColumnCountParams {
    searchColumn?: string;
    searchString?: string;
    searchType?: string;
}

interface ContactInterface {
    key: string;
    parentId?: string;
    name: string;
    tag: string[];
    description?: string;
    labels?: string[];
    formTypeId?: string;
}

// const findAll = async (query: PaginationParams) => {
//     return axios.get(
//         url +
//         `?page=${query.page}&limit=${query.limit}&orderBy=${query.sortKind}&orderByColumn=${query.sortField}&class_name=${query.class_name}`
//     );
// };

// const findAll = async () => {
//     return axios.get(url);
// };

const findAll = async (query: PaginationParams) => {
    return axios.get(url + `?page=${query.page}&limit=${query.limit}&orderBy=${query.orderBy}`,
        {
            params: {
                orderByColumn: query.orderByColumn
            },
            paramsSerializer: params => {
                return qs.stringify(params)
            }
        }
    );
};

const getContactCounts = async () => {
    return axios.get(url + "/totalCount");
};

const create = async (contact: ContactInterface) => {
    return axios.post(url, contact);
};

const update = async (id: string, contact: ContactInterface) => {
    return axios.patch(url + "/" + id, contact);
};

const remove = async (id: string) => {
    return axios.delete(url + '/' + id);
};

const relation = async (id1: string, id2: string) => {
    return axios.post(`${url}/relation/${id1}/${id2}`);
};

const nodeInfo = async (key: string) => {
    return axios.get(`${url}/${key}`);
};

const findSearch = async (query: SearchParams) => {
    return axios.get(url + "/search/" + `?page=${query.page}&limit=${query.limit}&orderBy=${query.orderBy}&orderByColumn=${query.orderByColumn}&searchString=${query.searchString}`);
};

const findSearchOrder = async (query: SearchOrderParams) => {
    return axios.get(url + "/search/" + `?page=${query.page}&limit=${query.limit}&orderBy=${query.orderBy}&orderByColumn=${query.orderByColumn}&searchString=${query.searchString}&searchedStringTotalCount=${query.searchedStringTotalCount}`);
};

const getSearchContactCounts = async (query: SearchCountParams) => {
    return axios.get(url + "/search/totalCount" + `?searchString=${query.searchString}`);
};

const findSearchByColumn = async (query: SearchColumnParams) => {
    return axios.get(url + "/searchByColumn/" + `?page=${query.page}&limit=${query.limit}&orderBy=${query.orderBy}&orderByColumn=${query.orderByColumn}&searchColumn=${query.searchColumn}&searchString=${query.searchString}&searchType=${query.searchType}`);
};

const findSearchByColumnOrder = async (query: SearchColumnOrderParams) => {
    return axios.get(url + "/searchByColumn/" + `?page=${query.page}&limit=${query.limit}&orderBy=${query.orderBy}&orderByColumn=${query.orderByColumn}&searchColumn=${query.searchColumn}&searchString=${query.searchString}&searchType=${query.searchType}&searchedStringTotalCount=${query.searchedStringTotalCount}`);
};


const getSearchColumnContactCounts = async (query: SearchColumnCountParams) => {
    return axios.get(url + "/searchByColumn/totalCount" + `?searchColumn=${query.searchColumn}&searchString=${query.searchString}&searchType=${query.searchType}`);
};

const service = {
    findAll,
    getContactCounts,
    create,
    update,
    remove,
    relation,
    nodeInfo,
    findSearch,
    findSearchOrder,
    getSearchContactCounts,
    findSearchByColumn,
    findSearchByColumnOrder,
    getSearchColumnContactCounts
};

export default service;
