import React, { useRef } from "react";
import { FileUpload } from "primereact/fileupload";
import ImageItem from "./ImageItem";
import { confirmDialog } from "primereact/confirmdialog";
import { useAppSelector } from "../../../../app/hook";
import { Button } from "primereact/button";
import useToast from "../../../../hooks/useToast";

const ImageUploadComponent = ({
  value,
  onChange,
  uploadFiles,
  deleteFiles,
  setDeleteFiles,
  label,
  setUploadFiles,
}) => {
  const uploadRef = useRef(null);
  const { toast } = useToast()

  React.useEffect(() => {
    if (uploadRef.current) {
      if (uploadFiles[label]) {
        uploadRef.current.setState({ files: uploadFiles[label].map((item) => item.file) })
      }
    }
  }, []);

  const itemTemplate = (file, props) => {
    const item = uploadFiles[label]
      ? uploadFiles[label].find((f) => f.file.objectURL === file.objectURL)
      : null;
    return (
      <div className="flex align-items-center flex-wrap">
        <div className="flex align-items-center" style={{ width: "40%" }}>
          <img
            alt={file.name}
            role="presentation"
            src={file.objectURL}
            width={100}
          />
          <span className="flex flex-column text-left ml-3">{file.name}</span>
        </div>
        <Button
          type="button"
          disabled={item ? item.main : false}
          icon="pi pi-bookmark-fill"
          className={
            "p-button-outlined p-button-rounded ml-auto" +
            (item ? (item.main ? " p-button-success" : "") : "")
          }
          onClick={() => SetMain(file.objectURL)}
        />
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={() => props.onRemove()}
        />
      </div>
    );
  };

  const accept = (index) => {
    setDeleteFiles((prev) => [...prev, JSON.parse(value)[index]]);
    let temp = JSON.parse(value).filter((_, i) => i !== index);
    if (temp.length === 1) {
      temp[0].main = true;
    }
    onChange(JSON.stringify(temp));
    toast.current.show({
      severity: "success",
      summary: "Delete!",
      detail: "You have accepted",
      life: 3000,
    });
  };

  const Delete = (index) => {
    confirmDialog({
      message: "Are you sure you want to proceed?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => accept(index),
    });
  };

  const SetMain = (data) => {
    setUploadFiles((prev) => ({
      ...prev,
      [label]: prev[label]
        ? prev[label].map((item) => {
            if (item.file.objectURL === data) {
              item.main = true;
            } else {
              item.main = false;
            }
            return item;
          })
        : [],
    }));
    if (
      value &&
      typeof value === "string" &&
      value.startsWith("[") &&
      value.endsWith("]")
    ) {
      onChange(
        JSON.stringify(
          JSON.parse(value).map((item, i) => {
            if (i === data) {
              item.main = true;
            } else {
              item.main = false;
            }
            return item;
          })
        )
      );
    }
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
    // setUploadFiles((prev) => ({ ...prev, [label]: uploadRef.current.files }));
    setUploadFiles((prev) => {
      if (prev[label]) {
        return {
          ...prev,
          [label]: [
            ...prev[label],
            { file: e.files[0], main: false, isImage: true },
          ],
        };
      } else {
        return {
          ...prev,
          [label]: [{ file: e.files[0], main: false, isImage: true }],
        };
      }
    });
  };

  const onRemove = (e) => {
    setUploadFiles((prev) => ({
      ...prev,
      [label]: prev[label].filter((i) => i.file.objectURL !== e.file.objectURL),
    }));
  };

  const onClear = (e) => {
    setUploadFiles((prev) => ({ ...prev, [label]: [] }));
  };

  return (
    <div className="p-5">
      <div className="card">
        <FileUpload
          name="demo[]"
          headerTemplate={headerTemplate}
          customUpload={true}
          accept="image/*"
          itemTemplate={itemTemplate}
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
        {value && typeof value === "string" && value.startsWith("[")
          ? value === ""
            ? null
            : JSON.parse(value).map((item, index) => (
                <ImageItem
                  key={index}
                  name={item.name}
                  url={item.image_url}
                  main={item.main}
                  deleteFunc={() => Delete(index)}
                  setMain={() => SetMain(index)}
                />
              ))
          : null}
      </div>
    </div>
  );
};

export default ImageUploadComponent;
