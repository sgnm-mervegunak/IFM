import axios from "axios";
import qs from "qs";

const url = process.env.REACT_APP_API_ASSET + "systemComponents/";

interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderByColumn?: string[] | undefined | null;
}

const remove = (parent_key: string, children_keys: string[]) => {

    return axios.delete(url  + parent_key , { data: children_keys });
};
const findComponentsIncludedBySystem = (key: string , pgparams: PaginationParams) => {
    return axios.get(url + "components/list/" + key + `?page=${pgparams.page}&limit=${pgparams.limit}&orderBy=${pgparams.orderBy}`,
        {
            params: {
                orderByColumn: pgparams.orderByColumn
            },
            paramsSerializer: params => {
                return qs.stringify(params)
            }
        } );
};


const service = {remove, findComponentsIncludedBySystem};

export default service;


