import React, { useEffect, useState } from "react";
import { Image } from "primereact/image";
import FacilityStructureService from "../../../services/facilitystructure";
import DocumentItem from "../Forms/FileUpload/DocumentUpload/DocumentItem";
import ImageItem from "../Forms/FileUpload/ImageUpload/ImageItem";
import ClassificationService from "../../../services/classifications";

interface Params {
  displayKey: string;
  docTypes?: any;
}

const DisplayNode = ({ displayKey, docTypes=[] }: Params) => {
  const [data, setData] = useState<any>(null);
  const [type, setType] = useState<string>("");
  const [category, setCategory] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [language, setLanguage] = useState<string>();

  useEffect(() => {
    FacilityStructureService.nodeInfo(displayKey).then((res) => {
      setType(res.data.properties.nodeType);
      setData(res.data.properties);
      console.log("*data", res.data.properties);

    });
  }, [displayKey]);

  return (
    <div>
      <h5 className="field">Name</h5>
      <p>{data?.name}</p>
      {data &&
        Object.keys(data)
          .sort()
          .map((key, index) => {
            if (data[key] != "" && key != "key" && key != "Key") {
              data[key].toString();
              if (key === "Tag" || key === "tag") {
                return (
                  <div className="field" key={index}>
                    <h5 className="block">Tag</h5>
                    <p>{data[key].length === 0 ? "---" : ""}</p>
                    <p>
                      {data[key].map((item: any, index: any) => {
                        return <b key={index}>#{item}</b>;
                      })}
                    </p>
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
                        : JSON.parse(data[key]).map(
                            (item: any, index: string) => (
                              <ImageItem
                              key={index}
                              name={item.name}
                              url={item.image_url}
                              main={item.main}
                              isDisplay
                            />
                            )
                          )
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
                        : JSON.parse(data[key]).map(
                            (item: any, index: string) => (
                              <DocumentItem
                              key={index}
                              name={item.name}
                              docTypes={docTypes}
                              url={item.image_url}
                              type={item.type}
                              isDisplay
                            />
                            )
                          )
                      : null}
                  </div>
                );
              } else if (key === "category") {
                ClassificationService.findClassificationByCode(data[key]).then((res) => { //will be refactor
                  setCategory(res.data[0]?._fields[0]?.properties?.name);
                });
                return (
                  <div className="field" key={index}>
                    <h5 className="block">Category</h5>
                    <p>{category}</p>
                  </div>
                );
              } else if (key === "status") {
                ClassificationService.findClassificationByCode(data[key]).then((res) => { //will be refactor
                  let x = res.data[0]?._fields[0]?.properties?.name;
                  setStatus(x);
                });
                return (
                  <div className="field" key={index}>
                    <h5 className="block">Status</h5>
                    <p>{status}</p>
                  </div>
                );
              } else if (typeof data[key] === "string" && key != "name") {
                const parsed = key.replace(/([A-Z])/g, " $1"); //parse key value
                const title = parsed.charAt(0).toUpperCase() + parsed.slice(1); //toUpperCase
                return (
                  <div className="field" key={index}>
                    <h5 className="block"> {title}</h5>
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
