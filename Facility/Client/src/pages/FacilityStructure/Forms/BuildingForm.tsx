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
import axios from "axios";

import ClassificationsService from "../../../services/classifications";
import FacilityStructureService from "../../../services/facilitystructure";
import { useAppSelector } from "../../../app/hook";
import FileUploadComponent from "./FileUpload/FileUpload";
import ImageUploadComponent from "./FileUpload/ImageUpload/ImageUpload";
import DocumentUploadComponent from "./FileUpload/DocumentUpload/DocumentUpload";

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

const BuildingForm = ({
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
  const [name, setName] = useState<string>("");
  const [category, setCategory] = useState<any>(undefined);
  const [address, setAddress] = useState<string>("");
  const [buildingStructure, setBuildingStructure] = useState("");
  const [images, setImages] = useState("");
  const [status, setStatus] = useState<any>(undefined);
  const [owner, setOwner] = useState<string>("");
  const [operator, setOperator] = useState<string>("");
  const [contractor, setContractor] = useState<string>("");
  const [handoverDate, setHandoverDate] = useState<any>(undefined);
  const [operationStartDate, setOperationStartDate] = useState<any>(undefined);
  const [warrantyExpireDate, setWarrantyExpireDate] = useState<any>(undefined);
  const [documents, setDocuments] = useState("");
  const [tag, setTag] = useState<string[]>([]);
  const [description, setDescription] = useState<string>("");
  const [projectName, setProjectName] = useState<string>("");
  const [classificationCategory, setClassificationCategory] = useState<Node[]>(
    []
  );
  const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);

  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const { toast } = useAppSelector((state) => state.toast);

  const buildingStructures = [
    "Building-Floor-Block",
    "Building-Block-Floor",
    "Building-Floor",
  ];

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.label = i.name;
    }
  };

  const getClassificationCategory = async () => {
    await ClassificationsService.findAllActiveByLabel({
      realm: realm,
      label: "OmniClass11",
      language: "en",
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodes(temp);
      setClassificationCategory(temp);
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
    getClassificationCategory();
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
        console.log(res.data);
        
        setName(res.data.properties.name || "");
        setCategory(res.data.properties.category);
        setAddress(res.data.properties.address || "");
        setBuildingStructure(res.data.properties.buildingStructure || "");
        setImages(res.data.properties.images || "");
        setStatus(res.data.properties.status);
        setOwner(res.data.properties.owner || "");
        setOperator(res.data.properties.operator || "");
        setContractor(res.data.properties.contractor || "");
        setHandoverDate(new Date(res.data.properties.handoverDate) || "");
        setOperationStartDate(
          new Date(res.data.properties.operationStartDate) || ""
        );
        setWarrantyExpireDate(
          new Date(res.data.properties.warrantyExpireDate) || ""
        );
        setDocuments(res.data.properties.documents || "");
        setTag(res.data.properties.tag || []);
        setDescription(res.data.properties.description || "");
        setProjectName(res.data.properties.projectName || "");
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
        name: name,
        category: category,
        address: address,
        buildingStructure: buildingStructure,
        images: images,
        status: status,
        owner: owner,
        operator: operator,
        contractor: contractor,
        handoverDate: handoverDate,
        operationStartDate: operationStartDate,
        warrantyExpireDate: warrantyExpireDate,
        documents: documents,
        tag: tag,
        description: description,
        projectName: projectName,
        nodeType: selectedFacilityType,
      };
      console.log(newNode);
      

      FacilityStructureService.createStructure(selectedNodeKey, newNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: "Successful",
            detail: "Building Created",
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
        name: name,
        category: category,
        address: address,
        buildingStructure: buildingStructure,
        images: images,
        status: status,
        owner: owner,
        operator: operator,
        contractor: contractor,
        handoverDate: handoverDate,
        operationStartDate: operationStartDate,
        warrantyExpireDate: warrantyExpireDate,
        documents: documents,
        tag: tag,
        description: description,
        projectName: projectName,
        nodeType: selectedFacilityType,
      };

      FacilityStructureService.update(selectedNodeKey, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: "Successful",
            detail: "Building Updated",
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
                temp[item].push({...resFile.data, type: file.type});
              }
            }
          }
          for (let item in temp) {
            try {
              temp[item] = [...JSON.parse(updateNode[item]), ...temp[item]];
            } catch (err) {}
            temp[item] = JSON.stringify(temp[item]);
          }

          // delete files
          for (let item of deleteFiles) {
            let temp = item.image_url.split("/");
            let urlIndex = temp.findIndex(
              (item: any) => item === "172.30.99.120:9000"
            );
            let temp2 = temp.slice(urlIndex + 1);

            await DeleteAnyFile(temp2[0], temp2.slice(1).join("/"));
          }

          // update node
          FacilityStructureService.update(res.data.properties.key, {
            ...updateNode,
            ...temp,
          });
          getFacilityStructure();
          setUploadFiles({});
          setDeleteFiles([]);
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
        setDeleteFiles([]);
      }, 1000);
    }
  };

  return (
    <div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
        <InputText
          value={name}
          onChange={(event) => setName(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Category</h5>
        <TreeSelect
          value={category}
          options={classificationCategory}
          onChange={(e) => {
            setCategory(e.value);
          }}
          filter
          placeholder="Select Type"
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Address</h5>
        <InputText
          value={address}
          onChange={(event) => setAddress(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Building Structure</h5>
        <Dropdown
          value={buildingStructure}
          options={buildingStructures}
          onChange={(e) => setBuildingStructure(e.value)}
          placeholder="Select Building Structure"
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
        <h5 style={{ marginBottom: "0.5em" }}>Owner</h5>
        <InputText
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Operator</h5>
        <InputText
          value={operator}
          onChange={(event) => setOperator(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Contractor</h5>
        <InputText
          value={contractor}
          onChange={(event) => setContractor(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Handover Date</h5>
        <Calendar
          dateFormat="dd/mm/yy"
          value={handoverDate}
          onChange={(e) => setHandoverDate(e.value?.toString())}
          showIcon
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Operation Start Date</h5>
        <Calendar
          dateFormat="dd/mm/yy"
          value={operationStartDate}
          onChange={(e) => setOperationStartDate(e.value?.toString())}
          showIcon
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Warranty Expire Date</h5>
        <Calendar
          dateFormat="dd/mm/yy"
          value={warrantyExpireDate}
          onChange={(e) => setWarrantyExpireDate(e.value?.toString())}
          showIcon
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
        <h5 style={{ marginBottom: "0.5em" }}>Description</h5>
        <InputText
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Project Name</h5>
        <InputText
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          style={{ width: "100%" }}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Images</h5>
        <ImageUploadComponent
          label={"images"}
          value={images}
          onChange={setImages}
          deleteFiles={deleteFiles}
          setDeleteFiles={setDeleteFiles}
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
        />
      </div>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Documents</h5>
        <DocumentUploadComponent
          label={"documents"}
          value={documents}
          onChange={setDocuments}
          deleteFiles={deleteFiles}
          setDeleteFiles={setDeleteFiles}
          uploadFiles={uploadFiles}
          setUploadFiles={setUploadFiles}
        />
      </div>
    </div>
  );
};

export default BuildingForm;
