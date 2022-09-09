import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Tooltip } from 'primereact/tooltip';
import { useAppSelector } from "../../../app/hook";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Params {
    selectedNodeKey: string;
    setFloorImportDia: React.Dispatch<React.SetStateAction<boolean>>;
    getFacilityStructure: () => void;
}

const FloorFileImport = ({ selectedNodeKey, setFloorImportDia, getFacilityStructure }: Params) => {
    const { toast } = useAppSelector((state) => state.toast);
    const refUpload = useRef<any>(null);
    const auth = useAppSelector((state) => state.auth);
    const [token, setToken] = useState(auth.auth.token);
    const history = useNavigate();

    const uploadCSV = (e: any) => {
        const file = e.files[0];
        const url = `http://localhost:3010/ExcelImportExport/addFloorwithCobie/${selectedNodeKey}`;
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
            setFloorImportDia(false);
            getFacilityStructure();
        })
            .catch(error => {
                toast.current.show({ severity: 'error', summary: 'File not uploaded', life: 3000 });
                setFloorImportDia(false);
                getFacilityStructure();
            })

        refUpload.current.clear();

    }
    return (
        <>
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

export default FloorFileImport;