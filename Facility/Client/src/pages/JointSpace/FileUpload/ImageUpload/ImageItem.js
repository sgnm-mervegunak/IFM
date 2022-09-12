import React from "react";
import { Button } from "primereact/button";

const ImageItem = ({
  name,
  url,
  deleteFunc = () => {},
  displayDelete = true,
  main = false,
  setMain = () => {},
  isDisplay = false,
}) => {
  return (
    <div className="flex align-items-center flex-wrap my-4">
      <div className="flex align-items-center" style={{ width: "40%" }}>
        <img alt={name} role="presentation" src={url} width={100} />
        <span className="flex flex-column text-left ml-3">
          <a href={url}>{name}</a>
          {/* <small>{new Date().toLocaleDateString()}</small> */}
        </span>
      </div>
      {!isDisplay && (
        <Button
          type="button"
          disabled={main}
          icon="pi pi-bookmark-fill"
          className={
            "p-button-outlined p-button-rounded ml-auto" +
            (main ? " p-button-success" : "")
          }
          style={{main: true ? "color":"red"}}
          onClick={setMain}
        />
      )}
      {isDisplay && main && (
        <Button
          type="button"
          disabled={true}
          icon="pi pi-bookmark-fill"
          className="p-button-outlined p-button-rounded ml-auto p-button-success"
        />
      )}
      {!isDisplay && displayDelete && (
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={deleteFunc}
        />
      )}
    </div>
  );
};

export default ImageItem;
