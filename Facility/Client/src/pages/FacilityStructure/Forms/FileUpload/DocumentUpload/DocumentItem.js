import React from "react";
import { Button } from "primereact/button";
import { TreeSelect } from "primereact/treeselect";

const DocumentItem = ({name,url,docTypes,deleteFunc = ()=>{},displayDelete=true,type=null,SetDocType=()=>{}}) => {
    return (
      <div className="flex align-items-center flex-wrap my-4">
        <div className="flex align-items-center" style={{ width: "40%" }}>
          <span className="flex flex-column text-left ml-3">
            <a href={url}>{name}</a>
            {/* <small>{new Date().toLocaleDateString()}</small> */}
          </span>
        </div>
        {/* <Button
          type="button"
          disabled={main}
          icon="pi pi-bookmark-fill"
          className={
            "p-button-outlined p-button-rounded ml-auto" +
            (main ? " p-button-success" : "")
          }
          onClick={setMain}
        /> */}
        <TreeSelect
          value={type}
          options={docTypes}
          onChange={(e) => SetDocType(e.value)}
        />
        {displayDelete && <Button
          type="button"
          icon="pi pi-times"
          className="p-button-outlined p-button-rounded p-button-danger ml-auto"
          onClick={deleteFunc}
        />}
      </div>
    );
  };

export default DocumentItem