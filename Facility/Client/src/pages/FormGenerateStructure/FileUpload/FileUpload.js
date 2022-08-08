import React, { useRef } from "react";
import { Toast } from "primereact/toast";
import { FileUpload } from "primereact/fileupload";
import FileItem from "./FileItem";

const FileUploadComponent = ({
  value = [],
  onChange,
  uploadFiles,
  label,
  setUploadFiles,
  isDocument = false,
  isImage = false,
}) => {
  const toast = useRef(null);
  const uploadRef = useRef(null);


  const Delete = (index) => {
    let temp = value.filter((_, i) => i !== index);
    if (temp.length === 1 && isImage) {
      temp[0].main = true;
    }
    onChange(temp);
  };

  const SetMain = (index) => {
    onChange(
      value.map((item, i) => {
        if (i === index) {
          item.main = true;
        } else {
          item.main = false;
        }
        return item;
      })
    );
  };

  const headerTemplate = (options) => {
    const { className, chooseButton, cancelButton } = options;

    return (
      <div
        className={className}
        style={{
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
        }}
      >
        {chooseButton}
        {cancelButton}
      </div>
    );
  };

  const onSelect = (e) => {
    setUploadFiles((prev) => ({ ...prev, [label]: uploadRef.current.files }));
  };

  const onRemove = (e) => {
    setUploadFiles((prev) => ({
      ...prev,
      [label]: prev[label].filter((i) => i.objectURL !== e.file.objectURL),
    }));
  };

  const onClear = (e) => {
    setUploadFiles((prev) => ({ ...prev, [label]: [] }));
  };

  return (
    <div className="p-5">
      <Toast ref={toast}></Toast>
      <div className="card">
        <FileUpload
          name="demo[]"
          headerTemplate={headerTemplate}
          customUpload={true}
          accept={isImage ? "image/*" : "*"}
          maxFileSize={5000000}
          onRemove={onRemove}
          onClear={onClear}
          onSelect={onSelect}
          ref={uploadRef}
          emptyTemplate={
            <p className="m-0">Drag and drop files to here to upload.</p>
          }
        />
      </div>
      <div className="card p-5">
        {(value && typeof value === "string") ? value === "" ? null: JSON.parse(value).map((item, index) => (
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
          )):null}
        {value &&
          typeof value === "object" &&
          value.map((item, index) => (
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
