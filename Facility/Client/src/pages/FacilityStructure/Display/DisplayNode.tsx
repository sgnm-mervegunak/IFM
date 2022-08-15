import React, { useEffect, useState } from "react";
import { Image } from "primereact/image";
import FacilityStructureService from "../../../services/facilitystructure";
import FileItem from "../Forms/FileUpload/FileItem";

interface Params {
  displayKey: string;
}

const DisplayNode = ({ displayKey }: Params) => {
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState<string>("");
  useEffect(() => {
    FacilityStructureService.nodeInfo(displayKey).then((res) => {
      setType(res.data.properties.nodeType);
      setData(res.data.properties);
      console.log(res.data.properties);
    });
  }, [displayKey]);
  return (
    <div>
      {data &&
        Object.keys(data).map((key, index) => {
          if (key === "Tag") {
            return (
              <div className="field" key={index}>
                <h5 className="block">{key}</h5>
                <p>{data[key].length === 0 ? "---" : ""}</p>
                <p>{data[key].map((item:any,index:any)=>{
                    return <b key={index}>#{item}</b>
                })}</p>
              </div>
            );
          } else if (key === "Images") {
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
          } else if (key === "Documents") {
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
                        />
                      ))
                  : null}
              </div>
            );
          } else if (typeof data[key] === "string") {
            return (
              <div className="field" key={index}>
                <h5 className="block">{key}</h5>
                <p>{data[key] === "" ? "---" : data[key]}</p>
              </div>
            );
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
