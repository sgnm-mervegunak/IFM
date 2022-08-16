import React, { useEffect, useState } from "react";
import { Image } from "primereact/image";
import FacilityStructureService from "../../../services/facilitystructure";
import FileItem from "../Forms/FileUpload/FileItem";
import ClassificationService from "../../../services/classifications";

interface Params {
  displayKey: string;
}

const DisplayNode = ({ displayKey }: Params) => {
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState<string>("");
  const [category, setCategory] = useState<string>();
  const [status, setStatus] = useState<string>();


  useEffect(() => {
    FacilityStructureService.nodeInfo(displayKey).then((res) => {
      setType(res.data.properties.nodeType);
      setData(res.data.properties);
      console.log(res.data.properties);
    })
    
  }, [displayKey]);

  return (
    <div>
      <h4>Name</h4>
      <p>{data?.name}</p>
      {data &&
        Object.keys(data).sort().map((key, index) => {
          if (data[key] != "" && key!="key" && key!="Key") {
            
            data[key].toString();
            if (key === "Tag" || key === "tag") {
              return (
                <div className="field" key={index}>
                  <h5 className="block">Tag</h5>
                  <p>{data[key].length === 0 ? "---" : ""}</p>
                  <p>{data[key].map((item: any, index: any) => {
                    return <b key={index}>#{item}</b>
                  })}</p>
                </div>
              );
            } else if (key === "Images" || key === "images") {
              return (
                <div className="card p-5" key={index}>
                  <h5>{key}</h5>
                  {data[key] &&
                    typeof data[key] === "string" &&
                    data[key].startsWith("[")
                    ? data[key] === ""
                      ? null
                      : JSON.parse(data[key]).map((item: any, index: string) => (
                        <FileItem
                          key={index}
                          name={item.name}
                          url={item.image_url}
                          displayDelete={false}
                          isImage
                        />
                      ))
                    : null}
                </div>
              );
            } else if (key === "Documents" || key === "documents") {
              return (
                <div className="card p-5" key={index}>
                  <h5>Documents</h5>
                  {data[key] &&
                    typeof data[key] === "string" &&
                    data[key].startsWith("[")
                    ? data[key] === ""
                      ? null
                      : JSON.parse(data[key]).map((item: any, index: string) => (
                        <FileItem
                          key={index}
                          name={item.name}
                          url={item.image_url}
                          displayDelete={false}
                        />
                      ))
                    : null}
                </div>
              );
            } else if (key === "category") {
              ClassificationService.nodeInfo(data[key]).then((res) => {
                setCategory(res.data.properties.name);
              })
              return (
                <div className="field" key={index}>
                  <h5 className="block">Category</h5>
                  <p>{category}</p>
                </div>
              );
            } else if (key === "status") {
              ClassificationService.nodeInfo(data[key]).then((res) => {
                setStatus(res.data.properties.name);
              })
              return (
                <div className="field" key={index}>
                  <h5 className="block">Status</h5>
                  <p>{status}</p>
                </div>
              );
            } else if (typeof data[key] === "string") {
              const parsed = key.replace(/([A-Z])/g, " $1"); //parse key value
              const title = parsed.charAt(0).toUpperCase() + parsed.slice(1); //toUpperCase
              return (
                <div className="field" key={index}>
                  <h5 className="block">  {title}</h5>
                  <p>{data[key] === "" ? "---" : data[key]}</p>
                </div>
              );
            }
          }
        })}
      {/* {type === "Building" && <div>
        </div>}
      {type === "Block" && <div>Block</div>}
      {type === "Floor" && <div>Floor</div>}
      {type === "Space" && <div>Space</div>} */}
      {/* <h1>{data.Name}</h1> */}
    </div>
  );
};

export default DisplayNode;
