import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Chips } from "primereact/chips";
import { TreeSelect } from "primereact/treeselect";
import { TabView, TabPanel } from 'primereact/tabview';
import axios from "axios";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import ClassificationsService from "../../../services/classifications";
import FacilityStructureService from "../../../services/facilitystructure";
import ImageUploadComponent from "./FileUpload/ImageUpload/ImageUpload";
import { useAppSelector } from "../../../app/hook";

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
  setSelectedFacilityType: React.Dispatch<React.SetStateAction<string | undefined>>;
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
  category: yup.string().required("This area is required."),
  usage: yup.string().required("This area is required."),
  status: yup.string().required("This area is required"),
  grossArea: yup
    .number()
    .typeError('Gross Area must be a number')
    .nullable().moreThan(-1, "Gross Area can not be negative")
    .transform((_, val) => (val !== "" ? Number(val) : null)),
  netArea: yup
    .number()
    .typeError('Net Area must be a number')
    .nullable()
    .moreThan(-1, "Net Area can not be negative")
    .transform((_, val) => (val !== "" ? Number(val) : null)),
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

  const [classificationSpaceCategory, setClassificationSpaceCategory] = useState<Node[]>([]);
  const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
  const [codeCategory, setCodeCategory] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const [codeUsage, setCodeUsage] = useState("");
  const auth = useAppSelector((state) => state.auth);
  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const { toast } = useAppSelector(state => state.toast);
  const [data, setData] = useState<any>();
  const { t } = useTranslation(["common"]);

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
      i.label = i.name;
    }
  };

  const getClassificationSpaceCategory = async () => {
    await ClassificationsService.findAllActiveByLabel({
      label: "OmniClass13"
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodes(temp);
      setClassificationSpaceCategory(temp);
    });
  };

  const getClassificationStatus = async () => {
    await ClassificationsService.findAllActiveByLabel({
      label: "FacilityStatus"
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
    getClassificationSpaceCategory();
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
      .then(async (res) => {
        let temp = {};
        await ClassificationsService.findClassificationByCodeAndLanguage("OmniClass13", res.data.properties.category).then(async clsf1 => {
          setCodeCategory(res.data.properties.category);
          res.data.properties.category = await clsf1.data.key
          temp = res.data.properties;
          // setData(res.data.properties);
        })
          .catch((err) => {
            setData(res.data.properties);
          })

        await ClassificationsService.findClassificationByCodeAndLanguage("FacilityStatus", res.data.properties.status).then(async clsf2 => {
          setCodeStatus(res.data.properties.status);
          res.data.properties.status = await clsf2.data.key
          temp = res.data.properties;
          // setData(res.data.properties);
        })
          .catch((err) => {
            setData(res.data.properties);
          })

        await ClassificationsService.findClassificationByCodeAndLanguage("OmniClass13", res.data.properties.usage).then(async clsf3 => {
          setCodeUsage(res.data.properties.usage);
          res.data.properties.usage = await clsf3.data.key
          temp = res.data.properties;
          // setData(res.data.properties);
        })
          .catch((err) => {
            setData(res.data.properties);
          })

        setData(temp);
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
        category: codeCategory,
        m2: data?.m2,
        usage: codeUsage,
        tag: data?.tag,
        images: data?.images,
        status: codeStatus,
        nodeType: selectedFacilityType,
        architecturalCode: data?.architecturalCode,
        description: data?.description,
        usableHeight: data?.usableHeight,
        grossArea: data?.grossArea,
        netArea: data?.netArea,
        operatorName: data?.operatorName,
        operatorCode: data?.operatorCode,
        roomTag: data?.roomTag,
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
            summary: t("Error"),
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
        });

        setAddDia(false);
        setSelectedFacilityType(undefined);
        setUploadFiles({});

    } else {
      let updateNode: any = {};
      updateNode = {
        code: data?.code,
        name: data?.name,
        architecturalName: data?.architecturalName,
        category: codeCategory,
        m2: data?.m2,
        usage: codeUsage,
        tag: data?.tag,
        images: data?.images,
        status: codeStatus,
        nodeType: selectedFacilityType,
        architecturalCode: data?.architecturalCode,
        description: data?.description,
        usableHeight: data?.usableHeight,
        grossArea: data?.grossArea,
        netArea: data?.netArea,
        operatorName: data?.operatorName,
        operatorCode: data?.operatorCode,
        roomTag: data?.roomTag,
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
      <TabView>
        <TabPanel header={t("Form")}>
          <div className="formgrid grid">

          <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("name")}
                style={{ width: '100%' }}
                defaultValue={data?.name || ""}
              />
              <p style={{ color: "red" }}>{errors.name?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Code")}</h5>
              <InputText
                autoComplete="off"
                {...register("code")}
                style={{ width: '100%' }}
                defaultValue={data?.code || ""}
              />
              <p style={{ color: "red" }}>{errors.code?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Architectural Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("architecturalName")}
                style={{ width: '100%' }}
                defaultValue={data?.architecturalName || ""}
              />
              <p style={{ color: "red" }}>{errors.architecturalName?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Architectural Code")}</h5>
              <InputText
                autoComplete="off"
                {...register("architecturalCode")}
                style={{ width: '100%' }}
                defaultValue={data?.architecturalCode || ""}
              />
              <p style={{ color: "red" }}>{errors.architecturalCode?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Operator Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("operatorName")}
                style={{ width: '100%' }}
                defaultValue={data?.operatorName || ""}
              />
              <p style={{ color: "red" }}>{errors.operatorName?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Operator Code")}</h5>
              <InputText
                autoComplete="off"
                {...register("operatorCode")}
                style={{ width: '100%' }}
                defaultValue={data?.operatorCode || ""}
              />
              <p style={{ color: "red" }}>{errors.operatorCode?.message}</p>
            </div>

            <div className="field col-12 md:col-6 structureChips">
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

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Category")}</h5>
              <Controller
                defaultValue={data?.category || ""}
                name="category"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationSpaceCategory}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeCategory(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder="Select Type"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.category?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Usage")}</h5>
              <Controller
                defaultValue={data?.usage || ""}
                name="usage"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationSpaceCategory}                  // Düzeltilecek
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeUsage(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder="Select Type"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.usage?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Status")}</h5>
              <Controller
                defaultValue={data?.status || ""}
                name="status"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationStatus}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeStatus(res.data.properties.code || "");   //Düzeltilecek
                        })
                    }}
                    filter
                    placeholder="Select Status"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.status?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
              <InputText
                autoComplete="off"
                {...register("description")}
                style={{ width: '100%' }}
                defaultValue={data?.description || ""}
              />
              <p style={{ color: "red" }}>{errors.description?.message}</p>
            </div>

            <div className="field col-12 md:col-6 structureChips">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Room Tag")}</h5>
              <Controller

                defaultValue={data?.roomTag || []}
                name="roomTag"
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
              <p style={{ color: "red" }}>{errors.roomTag?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Usable Height")}</h5>
              <InputText
                autoComplete="off"
                {...register("usableHeight")}
                style={{ width: '100%' }}
                defaultValue={data?.usableHeight || ""}
              />
              <p style={{ color: "red" }}>{errors.usableHeight?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Gross Area")}</h5>
              <InputText
                autoComplete="off"
                {...register("grossArea")}
                style={{ width: '100%' }}
                defaultValue={data?.grossArea || ""}
              />
              <p style={{ color: "red" }}>{errors.grossArea?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Net Area")}</h5>
              <InputText
                autoComplete="off"
                {...register("netArea")}
                style={{ width: '100%' }}
                defaultValue={data?.netArea || ""}
              />
              <p style={{ color: "red" }}>{errors.netArea?.message}</p>
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
                      console.log(e);

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
      </TabView>

    </form>
  );
};

export default SpaceForm;
