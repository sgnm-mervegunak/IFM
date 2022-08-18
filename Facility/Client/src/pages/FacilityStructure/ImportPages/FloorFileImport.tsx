import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { Tooltip } from 'primereact/tooltip';
import { useAppSelector } from "../../../app/hook";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FloorFileImport: React.FC = () => {
    const toast = useRef<any>();
    const refUpload = useRef<any>(null);
    const auth = useAppSelector((state) => state.auth);
    const [token, setToken] = useState(auth.auth.token);
    const history = useNavigate();

    const uploadCSV = (e:any) => {
        const file = e.files[0];
        const url = 'http://localhost:3010/classification/addAClassificationWithCodeFromExcel/IFM/EN';
        const formData = new FormData();

        formData.append('file', file);
        formData.append('fileName', file.name);
        const config = {
            headers: {
                'content-type': 'multipart/form-data', Authorization: "Bearer " + token,
            },
        };
        axios.post(url, formData, config).then((response) => {
            console.log(response.data);
            toast.current.show({ severity: 'success', summary: 'File uploaded', life: 3000 });
        })
            .catch(error => {
                toast.current.show({ severity: 'error', summary: 'File not uploaded', life: 3000 });
            })

        refUpload.current.clear();
        function backToFacility() {
            history('/facilitystructure');
          }
          
          setTimeout(backToFacility, 1200);
        
    }
    return (
        <>
            <Toast ref={toast}></Toast>

            <div className="card">
                <FileUpload
                    name="upfile[]"
                    accept="csv/*"
                    maxFileSize={1000000}
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