import React, { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { ProgressSpinner } from 'primereact/progressspinner';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { useAppSelector } from "../../../app/hook";
import useToast from '../../../hooks/useToast';

const ClassificationFileImportCheck: React.FC = () => {
  const { toast } = useToast()
  const refUpload = useRef<any>(null);
  const auth = useAppSelector((state) => state.auth);
  const [token, setToken] = useState(auth.auth.token);
  const [spinner, setSpinner] = useState(false);
  const { t } = useTranslation(["common"]);
  const history = useNavigate();

  function backToClassification() {
    history("/classifications");
  }

      const checkFile = (e: any) => {
        const file = e.files[0];
        const url: any =
          process.env.REACT_APP_API_FACILITY + "classification/checkExcelFile";
        const formData = new FormData();

        formData.append("file", file);
        formData.append("fileName", file.name);
        const config = {
          headers: {
            "content-type": "multipart/form-data",
            Authorization: "Bearer " + token,
          },
        };
        setSpinner(true);
        axios
          .post(url, formData, config)
          .then((response) => {
            setSpinner(false);
            toast.current.show({
              severity: "success",
              summary: t("Successful"),
              detail: t("File is correct format"),
              life: 4000,
            });
            backToClassification();
          })

          .catch((err) => {
            toast.current.show({
              severity: "error",
              summary: t("Error"),
              detail: t("File is incorrect format"),
              life: 4000,
            });
            setSpinner(false);
          });

        refUpload.current.clear();
      };

  return (
    <>
      <div className="card">
        {spinner ? (
          <ProgressSpinner />
        ) : (
          <>
            <h5>{t("Check the file format before upload")}</h5>

            <FileUpload
              name="upfile[]"
              accept="/*"
              className="mt-4"
              maxFileSize={10000000}
              chooseLabel={t("Select File")}
              uploadLabel={t("Check")}
              cancelLabel={t("Cancel")}
              customUpload={true}
              uploadHandler={checkFile}
              ref={refUpload}
            />
          </>
        )}
      </div>
    </>
  );
};

export default ClassificationFileImportCheck;