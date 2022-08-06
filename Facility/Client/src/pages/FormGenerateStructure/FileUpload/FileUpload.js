import React, { useRef } from "react";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import axios from "axios";
import FileItem from "./FileItem";

const FileUploadComponent = ({
  uploadedFiles,
  setUploadedFiles,
  isDocument = false,
  isImage = false,
}) => {
  const toast = useRef(null);
  const uploadRef = useRef(null);

  const Upload = (e) => {
    const file = e.files[0];
    const url = "http://localhost:3004/file-upload/single";
    const formData = new FormData();

    formData.append("file", file);
    formData.append("realmName", "ifm");
    formData.append("folderName", "test-123");
    axios
      .post(url, formData)
      .then((response) => {
        setTimeout(() => {
          let temp;
          delete response.data.message;

          if (isImage) {
            temp = [
              ...uploadedFiles,
              {
                ...response.data,
                main: uploadedFiles.length === 0 ? true : false,
              },
            ];
          } else {
            temp = [...uploadedFiles, { ...response.data }];
          }

          setUploadedFiles(temp);
        }, 500);
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

    uploadRef.current.clear();
  };

  const Delete = (index) => {
    let temp = uploadedFiles.filter((_, i) => i !== index)
    if(temp.length === 1 && isImage) {
      temp[0].main = true
    }
    setUploadedFiles(temp);
  };

  const SetMain = (index) => {
    setUploadedFiles(
      uploadedFiles.map((item, i) => {
        if (i === index) {
          item.main = true;
        } else {
          item.main = false;
        }
        return item;
      })
    );
  };

  return (
    <div className="p-5">
      <Toast ref={toast}></Toast>

      <div className="card">
        <FileUpload
          name="demo[]"
          mode="basic"
          customUpload={true}
          uploadHandler={Upload}
          accept={isImage ? "image/*" : "*"}
          maxFileSize={5000000}
          ref={uploadRef}
          emptyTemplate={
            <p className="m-0">Drag and drop files to here to upload.</p>
          }
        />
      </div>
      <div className="card p-5">
        {uploadedFiles &&
          uploadedFiles.map((item, index) => (
            <FileItem
              key={index}
              name={item.name}
              url={item.image_url}
              main={item.main}
              isDocument={isDocument}
              isImage={isImage}
              delete={() => Delete(index)}
              setMain={() => SetMain(index)}
            />
          ))}
      </div>
    </div>
  );
};

export default FileUploadComponent;
