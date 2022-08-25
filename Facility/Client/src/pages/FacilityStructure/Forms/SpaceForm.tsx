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
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useTranslation } from "react-i18next";

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

const schema = yup.object({
  name: yup.string().required("This area is required."),
  code: yup.string().required("This area is required."),
  usage: yup.string().required("This area is required."),
  status: yup.string().required("This area is required")

});


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

  const { toast } = useAppSelector(state => state.toast);

  const [data, setData] = useState<any>();
  const { t } = useTranslation(["common"]);

  const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
    defaultValues: {
      status: "In used",
      ...data
    },
    resolver: yupResolver(schema)
  });

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

  useEffect(
    () => {
      console.log("dataaaa: ", data);

    }
    , [data])

  useEffect(() => {
    getClassificationSpace();
    getClassificationStatus();
  }, []);

  useEffect(() => {
    if (submitted) {
      handleSubmit(onSubmit)();
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
        setData(res.data.properties);

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

  const onSubmit = (data: any) => {
    if (editDia === false) {
      let newNode: any = {};

      newNode = {
        code: data?.code,
        name: data?.name,
        architecturalName: data?.architecturalName,
        spaceType: data?.spaceType,
        m2: data?.m2,
        usage: data?.usage,
        tag: data?.tag,
        images: data?.images,
        status: data?.status,
        nodeType: selectedFacilityType,
      };

      FacilityStructureService.createStructure(selectedNodeKey, newNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Space Created"),
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
                temp[item].push({ ...resFile.data, type: file.type });
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
            summary:  t("Error"),
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
        code: data?.code,
        name: data?.name,
        architecturalName: data?.architecturalName,
        spaceType: data?.spaceType,
        m2: data?.m2,
        usage: data?.usage,
        tag: data?.tag,
        images: data?.images,
        status: data?.status,
        nodeType: selectedFacilityType,
      };

      FacilityStructureService.update(selectedNodeKey, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Space Updated"),
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
                temp[item].push({ ...resFile.data, type: file.type });
              }
            }
          }
          for (let item in temp) {
            try {
              temp[item] = [...JSON.parse(updateNode[item]), ...temp[item]]
            }
            catch (err) {
            }
            temp[item] = JSON.stringify(temp[item])
          }

          // delete files
          for (let item of deleteFiles) {
            let temp = item.image_url.split("/")
            let urlIndex = temp.findIndex((item: any) => item === "172.30.99.120:9000")
            let temp2 = temp.slice(urlIndex + 1)

            await DeleteAnyFile(temp2[0], temp2.slice(1).join("/"))
          }

          // update node
          FacilityStructureService.update(res.data.properties.key, { ...updateNode, ...temp })
          getFacilityStructure();
          setUploadFiles({})
          setDeleteFiles([])
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
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

  if (editDia && !data) {
    return null;
  }


  return (
    <form>
      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Code")}</h5>
        <InputText
          autoComplete="off"
          {...register("code")}
          style={{ width: '100%' }}
          defaultValue={data?.code || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.code?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Name")}</h5>
        <InputText
          autoComplete="off"
          {...register("name")}
          style={{ width: '100%' }}
          defaultValue={data?.name || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.name?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Architectural Name")}</h5>
        <InputText
          autoComplete="off"
          {...register("architecturalName")}
          style={{ width: '100%' }}
          defaultValue={data?.architecturalName || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.architecturalName?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Space Type")}</h5>
        <Controller
          defaultValue={data?.spaceType || []}
          name="spaceType"
          control={control}
          render={({ field }) => (
            <TreeSelect
              value={field.value}
              options={classificationSpace}
              onChange={(e) => {
                field.onChange(e.value)
              }}
              filter
              placeholder="Select Type"
              style={{ width: "100%" }}
            />
          )}
        />
      </div>
      <p style={{ color: "red" }}>{errors.spaceType?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>M2</h5>
        <InputText
          autoComplete="off"
          {...register("m2")}
          style={{ width: '100%' }}
          defaultValue={data?.m2 || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.m2?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Usage")}</h5>
        <InputText
          autoComplete="off"
          {...register("usage")}
          style={{ width: '100%' }}
          defaultValue={data?.usage || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.usage?.message}</p>

      <div className="field structureChips">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Tag")}</h5>
        <Controller

          defaultValue={data?.tag || []}
          name="tag"
          control={control}
          render={({ field }) => (
            <Chips
              value={field.value}
              onChange={(e) => {
                field.onChange(e.value)
              }}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>
      <p style={{ color: "red" }}>{errors.tag?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Status")}</h5>
        <Controller
          defaultValue={data?.status || "In used"}
          name="status"
          control={control}
          render={({ field }) => (
            <TreeSelect
              value={field.value}
              options={classificationStatus}
              onChange={(e) => {
                field.onChange(e.value)
              }}
              placeholder={"Select Type"}
              style={{ width: "100%" }}
            />
          )}
        />
      </div>
      <p style={{ color: "red" }}>{errors.status?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>{t("Images")}</h5>
        <Controller
          defaultValue={data?.images || []}
          name="images"
          control={control}
          render={({ field }) => (
            <ImageUploadComponent
              label={"images"}
              value={field.value}
              onChange={(e: any) => {
                field.onChange(e)
              }}
              deleteFiles={deleteFiles}
              setDeleteFiles={setDeleteFiles}
              uploadFiles={uploadFiles}
              setUploadFiles={setUploadFiles}

            />
          )}
        />
      </div>
      <p style={{ color: "red" }}>{errors.images?.message}</p>

    </form>
  );
};

export default SpaceForm;
