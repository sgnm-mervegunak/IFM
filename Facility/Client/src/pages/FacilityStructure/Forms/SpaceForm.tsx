import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Chips } from "primereact/chips";
import { TreeSelect } from "primereact/treeselect";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../app/hook";
import axios from "axios";

import ClassificationsService from "../../../services/classifications";
import FacilityStructureService from "../../../services/facilitystructure";
import ImageUploadComponent from "./FileUpload/ImageUpload/ImageUpload";

interface Params {
  selectedFacilityType: string | undefined;
  submitted: boolean;
  setSubmitted: any;
  selectedNodeKey: string;
  editDia: boolean;
  getFacilityStructure: () => void;
  setAddDia: React.Dispatch<React.SetStateAction<boolean>>;
  setEditDia: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdate: boolean;
  setIsUpdate: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedFacilityType: React.Dispatch<
    React.SetStateAction<string | undefined>
  >;
}

interface Node {
  cantDeleted: boolean;
  children: Node[];
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  key: string;
  name: string;
  realm: string;
  tag: string[];
  formTypeId?: string;
  _id: {
    low: string;
    high: string;
  };
  icon?: string;
  label?: string;
  labels?: string[]; // for form type
  parentId?: string;
  className?: string;
}

const SpaceForm = ({
  selectedFacilityType,
  submitted,
  setSubmitted,
  selectedNodeKey,
  editDia,
  getFacilityStructure,
  setAddDia,
  setEditDia,
  isUpdate,
  setIsUpdate,
  setSelectedFacilityType,
}: Params) => {
  const [code, setCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [architecturalName, setArchitecturalName] = useState<string>("");
  const [spaceType, setSpaceType] = useState<any>(undefined);
  const [m2, setM2] = useState<string>("");
  const [usage, setUsage] = useState<string>("");
  const [tag, setTag] = useState<string[]>([]);
  const [images, setImages] = useState("");
  const [status, setStatus] = useState<any>(undefined);
  const [classificationSpace, setClassificationSpace] = useState<Node[]>([]);
  const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);

  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});

  const {toast} = useAppSelector(state => state.toast);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.label = i.name;
    }
  };

  const getClassificationSpace = async () => {
    await ClassificationsService.findAllActiveByLabel({
      realm: realm,
      label: "OmniClass13",
      language: "en",
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodes(temp);
      setClassificationSpace(temp);
    });
  };

  const getClassificationStatus = async () => {
    await ClassificationsService.findAllActiveByLabel({
      realm: realm,
      label: "FacilityStatus",
      language: "en",
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodes(temp);
      temp[0].selectable = false
      setclassificationStatus(temp);
    });
  };

  useEffect(() => {
    getClassificationSpace();
    getClassificationStatus();
  }, []);

  useEffect(() => {
    if (submitted) {
      onSubmit();
    }
    setSubmitted(false);
  }, [submitted]);

  useEffect(() => {
    if (isUpdate) {
      getNodeInfoForUpdate(selectedNodeKey);
    }
    setIsUpdate(false);
  }, [isUpdate]);

  const getNodeInfoForUpdate = (selectedNodeKey: string) => {
    FacilityStructureService.nodeInfo(selectedNodeKey)
      .then((res) => {
        setCode(res.data.properties.code || "");
        setName(res.data.properties.name || "");
        setArchitecturalName(res.data.properties.architecturalName || "");
        setSpaceType(res.data.properties.category);
        setM2(res.data.properties.m2 || "");
        setUsage(res.data.properties.usage);
        setTag(res.data.properties.tag || []);
        setImages(res.data.properties.images || "");
        setStatus(res.data.properties.status);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
      });
  };

  const UploadAnyFile = (folderName: string, file: any) => {
    const url = "http://localhost:3004/file-upload/single";
    const formData = new FormData();

    formData.append("file", file);
    formData.append("realmName", "ifm");
    formData.append("folderName", folderName);
    return axios.post(url, formData);
  };

  const DeleteAnyFile = (realmName: string, fileName: string) => {
    const url = "http://localhost:3004/file-upload/removeOne";

    return axios.delete(url, { data: { fileName, realmName } });
  };

  const onSubmit = () => {
    if (editDia === false) {
      let newNode: any = {};

      newNode = {
        code: code,
        name: name,
        architecturalName: architecturalName,
        spaceType: spaceType,
        m2: m2,
        usage: usage,
        tag: tag,
        images: images,
        status: status,
        nodeType: selectedFacilityType,
      };

      FacilityStructureService.createStructure(selectedNodeKey, newNode)
        .then(async(res) => {
          toast.current.show({
            severity: "success",
            summary: "Successful",
            detail: "Space Created",
            life: 4000,
          });
          // let newForm: any = {};
          // newForm = {
          //     referenceKey: formTypeId,
          // };
          // StructureWinformService.createForm(res.data.properties.key, newForm)
          //     .then((res) => {
          //     })
          let temp = {} as any;
          for (let item in uploadFiles) {
            temp[item] = [];
            for (let file of uploadFiles[item]) {
              if (file.isImage) {
                let resFile = await UploadAnyFile(
                  res.data.properties.key + "/" + item,
                  file.file
                );
                delete resFile.data.message;
                temp[item].push({ ...resFile.data, main: file.main });
              } else {
                let resFile = await UploadAnyFile(
                  res.data.properties.key + "/" + item,
                  file.file
                );
                delete resFile.data.message;
                temp[item].push({...resFile.data, type: file.type});
              }
            }
          }
          for (let item in temp) {
            temp[item] = JSON.stringify(temp[item]);
          }
          FacilityStructureService.update(res.data.properties.key, {
            ...newNode,
            ...temp,
          });
          setUploadFiles({});
          getFacilityStructure();
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
        });

      setTimeout(() => {
        setAddDia(false);
        setUploadFiles({});
        setSelectedFacilityType(undefined);
      }, 1000);
    } else {
      let updateNode: any = {};
      updateNode = {
        code: code,
        name: name,
        architecturalName: architecturalName,
        spaceType: spaceType,
        m2: m2,
        usage: usage,
        tag: tag,
        images: images,
        status: status,
        nodeType: selectedFacilityType,
      };

      FacilityStructureService.update(selectedNodeKey, updateNode)
        .then(async(res) => {
          toast.current.show({
            severity: "success",
            summary: "Successful",
            detail: "Space Updated",
            life: 4000,
          });
          // upload files
          let temp = {} as any;
          for (let item in uploadFiles) {
            temp[item] = [];
            for (let file of uploadFiles[item]) {
              if (file.isImage) {
                let resFile = await UploadAnyFile(
                  res.data.properties.key + "/" + item,
                  file.file
                );
                delete resFile.data.message;
                temp[item].push({ ...resFile.data, main: file.main });
              } else {
                let resFile = await UploadAnyFile(
                  res.data.properties.key + "/" + item,
                  file.file
                );
                delete resFile.data.message;
                console.log(resFile)
                temp[item].push({...resFile.data, type: file.type});
              }
            }
          }
          for(let item in temp){
            try {
              temp[item] = [...JSON.parse(updateNode[item]),...temp[item]]
            }
            catch(err) {
            }
            temp[item] = JSON.stringify(temp[item])
          }

          // delete files
          for(let item of deleteFiles) {
            let temp = item.image_url.split("/")
            let urlIndex = temp.findIndex((item:any) => item === "172.30.99.120:9000")
            let temp2 = temp.slice(urlIndex+1)

            await DeleteAnyFile(temp2[0],temp2.slice(1).join("/"))
          }

          // update node
          FacilityStructureService.update(res.data.properties.key, {...updateNode,...temp})
          getFacilityStructure();
          setUploadFiles({})
          setDeleteFiles([])
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
        });
      setTimeout(() => {
        setEditDia(false);
        setUploadFiles({});
        setDeleteFiles([])
      }, 1000);
    }
  };

  return (
    <div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Code</h5>
        <InputText
          value={code}
          onChange={(event) => setCode(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
        <InputText
          value={name}
          onChange={(event) => setName(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Architectural Name</h5>
        <InputText
          value={architecturalName}
          onChange={(event) => setArchitecturalName(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Space Type</h5>
        <TreeSelect
          value={spaceType}
          options={classificationSpace}
          onChange={(e) => {
            setSpaceType(e.value);
          }}
          filter
          placeholder="Select Type"
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>M2</h5>
        <InputText
          value={m2}
          onChange={(event) => setM2(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Usage</h5>
        <InputText
          value={usage}
          onChange={(event) => setUsage(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field structureChips">
        <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
        <Chips
          value={tag}
          onChange={(e) => setTag(e.value)}
          style={{ width: "100%" }}
        />
      </div>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Status</h5>
        <TreeSelect
          value={status}
          options={classificationStatus}
          onChange={(e) => {
            setStatus(e.value);
          }}
          filter
          placeholder="Select Type"
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Images</h5>
        <ImageUploadComponent
          label={"Images"}
          value={images}
          onChange={setImages}
          deleteFiles={deleteFiles}
          setDeleteFiles={setDeleteFiles}
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
        />
      </div>
    </div>
  );
};

export default SpaceForm;
