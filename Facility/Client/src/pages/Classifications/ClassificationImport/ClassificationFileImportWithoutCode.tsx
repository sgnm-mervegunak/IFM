import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { ProgressSpinner } from 'primereact/progressspinner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";

import { useAppSelector } from "../../../app/hook";

const ClassificationFileImportWithoutCode: React.FC = () => {
    const { toast } = useAppSelector((state) => state.toast);
    const refUpload = useRef<any>(null);
    const auth = useAppSelector((state) => state.auth);
    const [token, setToken] = useState(auth.auth.token);
    const [spinner, setSpinner] = useState(false);
    const { t } = useTranslation(["common"]);
    const history = useNavigate();

    function backToClassification() {
        history('/classifications');
    }

    const uploadCSV = (e: any) => {
        const file = e.files[0];
        const url: any = process.env.REACT_APP_API_CLASSIFICATION_IMPORT_WITHOUT_CODE;
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
            backToClassification();
        })
            .catch(err => {
                toast.current.show({
                    severity: "error",
                    summary: t("Error"),
                    detail: err.response ? err.response.data.message : err.message,
                    life: 4000
                });
                setSpinner(false);
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
                        <>
                            <h5>{t("Classification File Import Without Code")}</h5>
                            <p
                                className="mt-4 cursor-pointer"
                                style={{ color: "blue" }}
                                onClick={() => {
                                    let URL: any = process.env.REACT_APP_API_CLASSIFICATION_SAMPLE_DATA_WITHOUT_CODE;
                                    window.location.href = URL;
                                }}
                            >
                                {t("Download to see a sample classification file")}
                            </p>
                            <FileUpload
                                name="upfile[]"
                                accept="csv/*"
                                maxFileSize={1000000}
                                chooseLabel={t("Select File")}
                                uploadLabel={t("Upload")}
                                cancelLabel={t("Cancel")}
                                customUpload={true}
                                uploadHandler={uploadCSV}
                                ref={refUpload}
                            />
                        </>
                    )}
            </div>
        </>
    )
};

export default ClassificationFileImportWithoutCode;