import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

import { useAppSelector } from "../../app/hook";

const ClassificationFileImportWithCode: React.FC = () => {
    const toast = useRef<any>();
    const refUpload = useRef<any>(null);
    const auth = useAppSelector((state) => state.auth);
    const [realm, setRealm] = useState(auth.auth.realm);
    const [token, setToken] = useState(auth.auth.token);
    const language = useAppSelector((state) => state.language.language);
    const { t } = useTranslation(["common"]);
    const history = useNavigate();

    const uploadCSV = (e: any) => {
        const file = e.files[0];
        const url = `http://localhost:3010/classification/addAClassificationWithCodeFromExcel/${realm}/${language}`;
        const formData = new FormData();

        formData.append('file', file);
        formData.append('fileName', file.name);
        const config = {
            headers: {
                'content-type': 'multipart/form-data', Authorization: "Bearer " + token,
            },
        };
        axios.post(url, formData, config).then((response) => {
            toast.current.show({
                severity: "success",
                summary: t("Successful"),
                detail: t("File uploaded"),
                life: 4000
            });
            setTimeout(backToClassification, 1000);
        })

            .catch(err => {
                toast.current.show({
                    severity: "error",
                    summary: t("Error"),
                    detail: err.response ? err.response.data.message : err.message,
                    life: 4000
                });
            })

        refUpload.current.clear();
        function backToClassification() {
            history('/classifications');
        }



    }
    return (
        <>
            <Toast ref={toast}></Toast>

            <div className="card">
                <h5>{t("Classification File Import With Code")}</h5>
                <p
                    className="mt-4 cursor-pointer"
                    style={{ color: "red" }}
                    onClick={() => window.location.href = "http://localhost:3000/documents/classification-sample-data-without-code.xlsx"}
                >
                    {t("Click to download sample classification file")}
                </p>
                <FileUpload
                    name="upfile[]"
                    accept="/*"
                    className="mt-4"
                    maxFileSize={1000000}
                    chooseLabel={t("Select File")}
                    uploadLabel={t("Upload")}
                    cancelLabel={t("Cancel")}
                    customUpload={true}
                    uploadHandler={uploadCSV}
                    ref={refUpload}

                />
            </div>
        </>
    )
};

export default ClassificationFileImportWithCode;