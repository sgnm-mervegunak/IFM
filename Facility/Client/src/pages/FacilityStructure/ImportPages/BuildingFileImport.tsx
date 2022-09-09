import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Tooltip } from 'primereact/tooltip';
import { useAppSelector } from "../../../app/hook";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Params {
    selectedNodeKey: string;
    setBuildingImportDia: React.Dispatch<React.SetStateAction<boolean>>;
}

const BuildingFileImport = ({ setBuildingImportDia }: Params) => {
    const toast = useRef<any>();
    const refUpload = useRef<any>(null);
    const auth = useAppSelector((state) => state.auth);
    const [token, setToken] = useState(auth.auth.token);
    const history = useNavigate();

    const uploadCSV = (e: any) => {
        const file = e.files[0];
        const url = 'http://localhost:3010/ExcelImportExport/addBuildingwithCobie';
        const formData = new FormData();

        formData.append('file', file);
        formData.append('fileName', file.name);
        const config = {
            headers: {
                'content-type': 'multipart/form-data', Authorization: "Bearer " + token,
            },
        };
        axios.post(url, formData, config).then((response) => {
            toast.current.show({ severity: 'success', summary: 'File uploaded', life: 3000 });
            setBuildingImportDia(false);
            history('/FacilityStructure');
        })
            .catch(error => {
                toast.current.show({ severity: 'error', summary: 'File not uploaded', life: 3000 });
                setBuildingImportDia(false);
                history('/FacilityStructure');
            })

        refUpload.current.clear();

    }
    return (
        <>
            <Toast ref={toast}></Toast>

            <div className="card">
                <FileUpload
                    name="upfile[]"
                    accept="csv/*"
                    maxFileSize={10000000}
                    chooseLabel="Select File"
                    customUpload={true}
                    uploadHandler={uploadCSV}
                    ref={refUpload}
                />
            </div>
        </>
    )
};

export default BuildingFileImport;