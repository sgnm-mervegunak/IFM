import React from "react";
import { Button } from "primereact/button";

const FileItem = ({name,url,isImage=false,deleteFunc = ()=>{},displayDelete=true,main=false}) => {
    return (
      <div className="flex align-items-center flex-wrap my-4">
        <div className="flex align-items-center" style={{ width: "40%" }}>
          {isImage && <img alt={name} role="presentation" src={url} width={100} />}
          <span className="flex flex-column text-left ml-3">
            <a href={url}>{name}</a>
            {/* <small>{new Date().toLocaleDateString()}</small> */}
          </span>
        </div>
        {/* {props.isImage && <Button
          type="button"
          disabled={props.main}
          icon="pi pi-bookmark-fill"
          className={
            "p-button-outlined p-button-rounded ml-auto" +
            (props.main ? " p-button-success" : "")
          }
          onClick={props.setMain}
        />} */}
        {displayDelete && <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={deleteFunc}
        />}
      </div>
    );
  };

export default FileItem