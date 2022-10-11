import React, { useRef, useState } from "react";
import { FileUpload } from "primereact/fileupload";
import { Tooltip } from "primereact/tooltip";
import { useAppSelector } from "../../../app/hook";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useToast from "../../../hooks/useToast";

interface Params {
  selectedNodeKey: string;
}

const BlockFileImport = ({ selectedNodeKey }: Params) => {
  const refUpload = useRef<any>(null);
  const auth = useAppSelector((state) => state.auth);
  const [token, setToken] = useState(auth.auth.token);
  const history = useNavigate();
  const { toast } = useToast()

  const uploadCSV = (e: any) => {
    const file = e.files[0];
    const url =
      process.env.REACT_APP_API_FACILITY +
      "classification/addAClassificationWithCodeFromExcel/IFM/EN";
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileName", file.name);
    const config = {
      headers: {
        "content-type": "multipart/form-data",
        Authorization: "Bearer " + token,
      },
    };
    axios
      .post(url, formData, config)
      .then((response) => {
        console.log(response.data);
        toast.current.show({
          severity: "success",
          summary: "File uploaded",
          life: 3000,
        });
      })
      .catch((error) => {
        toast.current.show({
          severity: "error",
          summary: "File not uploaded",
          life: 3000,
        });
      });

    refUpload.current.clear();
    function backToFacility() {
      history("/facilitystructure");
    }

    setTimeout(backToFacility, 1200);
  };
  return (
    <>
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
  );
};

export default BlockFileImport;
