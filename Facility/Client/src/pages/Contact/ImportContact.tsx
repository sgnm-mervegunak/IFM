import React, { useRef, useState } from 'react';
import { FileUpload } from 'primereact/fileupload';
import { ProgressSpinner } from 'primereact/progressspinner';
import axios from 'axios';
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../app/hook";
import useToast from '../../hooks/useToast';

interface Params {
    selectedNodeKey: string;
    setImportDia: React.Dispatch<React.SetStateAction<boolean>>;
    getContact: () => void;
}

const ImportContact = ({ setImportDia, getContact }: Params) => {
    const { toast } = useToast()
    const refUpload = useRef<any>(null);
    const auth = useAppSelector((state) => state.auth);
    const [token, setToken] = useState(auth.auth.token);
    const [spinner, setSpinner] = useState(false);
    const { t } = useTranslation(["common"]);

    const uploadCSV = (e: any) => {
        const file = e.files[0];
        const url = process.env.REACT_APP_API_FACILITY + 'ExcelImportExport/addContacts';
        const formData = new FormData();

        formData.append('file', file);
        formData.append('fileName', file.name);
        const config = {
            headers: {
                'content-type': 'multipart/form-data', Authorization: "Bearer " + token,
            },
        };
        setSpinner(true);
        axios.post(url, formData, config).then((response) => {
            setSpinner(false);
            toast.current.show({
                severity: "success",
                summary: t("Successful"),
                detail: t("File uploaded"),
                life: 4000
            });
            setImportDia(false);
            getContact();
        })
            .catch(err => {
                toast.current.show({
                    severity: "error",
                    summary: t("Error"),
                    detail: err.response ? err.response.data.message : err.message,
                    life: 4000
                });
                setImportDia(false);
                getContact();
            })

        refUpload.current.clear();

    }
    return (
        <>
            <div className="card">
                {spinner ? (
                    <ProgressSpinner />
                )
                    : (
                        <FileUpload
                            name="upfile[]"
                            accept="csv/*"
                            maxFileSize={10000000}
                            chooseLabel={t("Select File")}
                            uploadLabel={t("Upload")}
                            cancelLabel={t("Cancel")}
                            customUpload={true}
                            uploadHandler={uploadCSV}
                            ref={refUpload}
                        />)}
            </div>
        </>
    )
};

export default ImportContact;