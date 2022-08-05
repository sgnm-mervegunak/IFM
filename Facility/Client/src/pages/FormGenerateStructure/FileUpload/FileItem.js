import React from "react";
import { Button } from "primereact/button";

const FileItem = (props) => {
    return (
      <div className="flex align-items-center flex-wrap my-4">
        <div className="flex align-items-center" style={{ width: "40%" }}>
          {props.isImage && <img alt={props.name} role="presentation" src={props.url} width={100} />}
          <span className="flex flex-column text-left ml-3">
            {props.name}
            <small>{new Date().toLocaleDateString()}</small>
          </span>
        </div>
        {props.isImage && <Button
          type="button"
          disabled={props.main}
          icon="pi pi-bookmark-fill"
          className={
            "p-button-outlined p-button-rounded ml-auto" +
            (props.main ? " p-button-success" : "")
          }
          onClick={props.setMain}
        />}
        <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={props.delete}
        />
      </div>
    );
  };

export default FileItem