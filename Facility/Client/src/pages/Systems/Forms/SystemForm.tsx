import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { InputText } from "primereact/inputtext";
import { Chips } from "primereact/chips";
import { TreeSelect } from "primereact/treeselect";
import { Calendar } from "primereact/calendar";
import { TabView, TabPanel } from 'primereact/tabview';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import axios from "axios";
import { useTranslation } from "react-i18next";

import SystemService from "../../../services/systems";
import AssetClassificationsService from "../../../services/assetclassifications";
import ContactService from "../../../services/contact";
import FacilityStructureService from "../../../services/facilitystructure";
import { useAppSelector } from "../../../app/hook";
import ImageUploadComponent from "./FileUpload/ImageUpload/ImageUpload";
import DocumentUploadComponent from "./FileUpload/DocumentUpload/DocumentUpload";
import useToast from "../../../hooks/useToast";

interface Params {
  submitted: boolean;
  setSubmitted: any;
  selectedNodeKey: string;
  selectedNodeId: string;
  editDia: boolean;
  getSystems: () => void;
  setAddDia: React.Dispatch<React.SetStateAction<boolean>>;
  setEditDia: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdate: boolean;
  setIsUpdate: React.Dispatch<React.SetStateAction<boolean>>;
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
  email?: string;
  selectable?: boolean;
  nodeType?: string;
}

const SystemForm = ({
  submitted,
  setSubmitted,
  selectedNodeKey,
  selectedNodeId,
  editDia,
  getSystems,
  setAddDia,
  setEditDia,
  isUpdate,
  setIsUpdate,
}: Params) => {

  const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
  const [spaces, setSpaces] = useState<Node[]>([]);
  const [spaceType, setSpaceType] = useState("");
  const [contact, setContact] = useState<any>([]);
  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const { toast } = useToast()
  const { t } = useTranslation(["common"]);
  const [codeCategory, setCodeCategory] = useState("");
  const [codeDurationUnit, setCodeDurationUnit] = useState("");

  const [data, setData] = useState<any>();

  const schema = yup.object({
    name: yup.string().required(t("This area is required.")).max(50, t("This area accepts max 50 characters.")),
    category: yup.string().required(t("This area is required.")),
    createdBy: yup.string().required(t("This area is required.")),
  });

  const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
    defaultValues: {
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
      i.label = i.name || i.email;
    }
  };

  const fixNodesSpaces = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodesSpaces(i.children);
      i.label = i.name;
      if (i.nodeType === "Space") {
        i.selectable = true;
      } else {
        i.selectable = false;
      }
    }
  };

  const getClassificationCategory = async () => {
    await AssetClassificationsService.findAllActiveByLabel({
      label: "OmniClass21"
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root] || []));
      fixNodes(temp);
      setClassificationCategory(temp);
    });
  };

  const getSpaces = () => {
    FacilityStructureService.findAll()
      .then((res) => {
        if (!res.data.root.children) {
          let temp = JSON.parse(
            JSON.stringify([res.data.root.properties] || [])
          );
          fixNodesSpaces(temp);
          setSpaces(temp);
        } else if (res.data.root.children) {
          let temp = JSON.parse(JSON.stringify([res.data.root] || []));
          fixNodesSpaces(temp);
          setSpaces(temp);
        }
      })
  };

  const getContact = async () => {
    ContactService.findAll({page:1,limit:1000,orderBy:"ASC",orderByColumn:"email"})
      .then((res) => {
        let temp = JSON.parse(JSON.stringify([res.data] || []));
        fixNodes(temp);
        setContact(temp);
      });
  };

  useEffect(() => {
    getClassificationCategory();
    getContact();
    getSpaces();
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
    SystemService.nodeInfo(selectedNodeKey)
      .then(async (res) => {
        console.log(res.data);
        
        let temp = {};
        await AssetClassificationsService.findClassificationByCodeAndLanguage("OmniClass21", res.data.properties.category).then(clsf1 => {
          setCodeCategory(res.data.properties.category);
          res.data.properties.category = clsf1.data.key
          temp = res.data.properties;
        })
          .catch((err) => {
            setData(res.data.properties);
          })
        setData(temp);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
      });
  };

  const UploadAnyFile = (folderName: string, file: any) => {
    const url = process.env.REACT_APP_API_MINIO + "file-upload/single";
    const formData = new FormData();

    formData.append("file", file);
    formData.append("realmName", "ifm");
    formData.append("folderName", folderName);
    return axios.post(url, formData);
  };

  const DeleteAnyFile = (realmName: string, fileName: string) => {
    const url = process.env.REACT_APP_API_MINIO + "file-upload/removeOne";

    return axios.delete(url, { data: { fileName, realmName } });
  };

  const onSubmit = (data: any) => {
    if (editDia === false) {
      let newNode: any = {};

      newNode = {
        name: data?.name,
        category: codeCategory,
        tag: data?.tag,
        description: data?.description,
        createdBy: data?.createdBy,
        images: data?.images || "",
        documents: data?.documents || "",
      };
      console.log(newNode);


      SystemService.create(newNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("System Created"),
            life: 4000,
          });
          console.log(res.data);
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


          await SystemService.update(res.data.properties.id, {
            ...newNode,
            ...temp,
          });
          setUploadFiles({});
          getSystems();
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
        });

      setUploadFiles({});
      setAddDia(false);

    } else {
      let updateNode: any = {};
      updateNode = {
        name: data?.name,
        category: codeCategory,
        tag: data?.tag,
        description: data?.description,
        createdBy: data?.createdBy,
        images: data?.images || "",
        documents: data?.documents || "",
      };

      console.log(updateNode);


      SystemService.update(selectedNodeId, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("System Updated"),
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
                temp[item].push({ ...resFile.data, type: file.type });
              }
            }
          }
          for (let item in temp) {
            try {
              temp[item] = [...JSON.parse(updateNode[item]), ...temp[item]];
            } catch (err) { }
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
          SystemService.update(selectedNodeId, {
            ...updateNode,
            ...temp,
          });

          setUploadFiles({});
          setDeleteFiles([]);
          getSystems();
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
        });
      setUploadFiles({});
      setDeleteFiles([]);
      setEditDia(false);
    }
  };

  if (editDia && !data) {
    return null;
  }

  return (
    <form>

      <TabView>
        <TabPanel header={t("Form")}>
          <div className="formgrid grid">

            <div className="field col-12 md:col-12">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("name")}
                style={{ width: '100%' }}
                defaultValue={data?.name || ""}
              />
              <p style={{ color: "red" }}>{errors.name?.message}</p>
            </div>

            <div className="field col-12 md:col-12">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Category")}</h5>
              <Controller
                defaultValue={data?.category || ""}
                name="category"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationCategory}
                    onChange={(e) => {
                      AssetClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeCategory(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder=""
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.category?.message}</p>
            </div>

            <div className="field col-12 md:col-12 structureChips">
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
              <p style={{ color: "red" }}>{errors.tag?.message}</p>
            </div>

            <div className="field col-12 md:col-12">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
              <InputText
                autoComplete="off"
                {...register("description")}
                style={{ width: '100%' }}
                defaultValue={data?.description || ""}
              />
              <p style={{ color: "red" }}>{errors.description?.message}</p>
            </div>

            <div className="field col-12 md:col-12">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Created By")}</h5>
              <Controller
                defaultValue={data?.createdBy || ""}
                name="createdBy"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={contact}
                    onChange={(e) => {
                      field.onChange(e.value)
                    }}
                    filter
                    placeholder=""
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.createdBy?.message}</p>
            </div>

          </div>

        </TabPanel>
        <TabPanel header={t("Images")}>
          <div className="formgrid grid">
            <div className="field col-12">
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
              <p style={{ color: "red" }}>{errors.images?.message}</p>
            </div>
          </div>
        </TabPanel>
        <TabPanel header={t("Documents")}>
          <div className="formgrid grid">
            <div className="field col-12">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Documents")}</h5>
              <Controller
                defaultValue={data?.documents || []}
                name="documents"
                control={control}
                render={({ field }) => (
                  <DocumentUploadComponent
                    label={"documents"}
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
              <p style={{ color: "red" }}>{errors.documents?.message}</p>
            </div>
          </div>
        </TabPanel>
      </TabView>

    </form>
  );
};

export default SystemForm;
