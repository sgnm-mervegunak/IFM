import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { InputText } from "primereact/inputtext";
import { Chips } from "primereact/chips";
import { TreeSelect } from "primereact/treeselect";
import { TabView, TabPanel } from 'primereact/tabview';
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import axios from "axios";
import { useTranslation } from "react-i18next";

import TypesService from "../../../services/types";
import ClassificationsService from "../../../services/classifications";
import AssetClassificationsService from "../../../services/assetclassifications";
import ContactService from "../../../services/contact";
import { useAppSelector } from "../../../app/hook";
import ImageUploadComponent from "./FileUpload/ImageUpload/ImageUpload";
import DocumentUploadComponent from "./FileUpload/DocumentUpload/DocumentUpload";

interface Params {
  submitted: boolean;
  setSubmitted: any;
  selectedNodeKey: string;
  selectedNodeId: string;
  editDia: boolean;
  getTypes: () => void;
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
}

const TypeForm = ({
  submitted,
  setSubmitted,
  selectedNodeKey,
  selectedNodeId,
  editDia,
  getTypes,
  setAddDia,
  setEditDia,
  isUpdate,
  setIsUpdate,
}: Params) => {

  const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
  const [classificationDurationUnit, setClassificationDurationUnit] = useState<Node[]>([]);
  const [assetType, setAssetType] = useState<Node[]>([]);
  const [contact, setContact] = useState<any>([]);
  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const { toast } = useAppSelector((state) => state.toast);
  const { t } = useTranslation(["common"]);
  const [codeCategory, setCodeCategory] = useState("");
  const [codeAssetType, setCodeAssetType] = useState("");
  const [codeDurationUnit, setCodeDurationUnit] = useState("");
  const [codeWarrantyDurationUnit, setCodeWarrantyCodeDurationUnit] = useState("");

  const [data, setData] = useState<any>();

  const schema = yup.object({
    name: yup.string().max(50, t("This area accepts max 50 characters.")),
    description: yup.string().max(256, t("This area accepts max 256 characters.")),
    category: yup.string().required(t("This area is required.")),
    assetType: yup.string().required(t("This area is required.")),
    manufacturer: yup.string().required(t("This area is required.")),
    modelNo: yup.string().required(t("This area is required.")).max(50, t("This area accepts max 50 characters.")),
    warrantyGuarantorParts: yup.string().required(t("This area is required.")),
    warrantyDurationParts: yup.number()
      .required(t("This area is required."))
      .min(0, t("This area accepts min 0"))
      .max(20, t("This area accepts max 20"))
      .nullable()
      .transform((_, val) => (val !== "" ? Number(val) : null)),
    warrantyGuarantorLabor: yup.string().required(t("This area is required.")),
    warrantyDurationLabor: yup.number()
      .required(t("This area is required."))
      .min(0, t("This area accepts min 0"))
      .max(20, t("This area accepts max 20"))
      .nullable()
      .transform((_, val) => (val !== "" ? Number(val) : null)),
    warrantyDurationUnit: yup.string().required(t("This area is required.")),
    replacementCost: yup.number(),
    expectedLife: yup.number(),
    durationUnit: yup.string().required(t("This area is required.")),
    warranty: yup.string().max(256, t("This area accepts max 256 characters.")),
    nominalLength: yup.number().required(t("This area is required.")),
    nominalWidth: yup.number().required(t("This area is required.")),
    nominalHeight: yup.number().required(t("This area is required.")),
    modelReference: yup.string().required(t("This area is required")).max(250, t("This area accepts max 250 characters.")),
    shape: yup.string().max(256, t("This area accepts max 256 characters.")),
    size: yup.string().max(256, t("This area accepts max 256 characters.")),
    color: yup.string().max(256, t("This area accepts max 256 characters.")),
    finish: yup.string().max(256, t("This area accepts max 256 characters.")),
    material: yup.string().max(256, t("This area accepts max 256 characters.")),
    constituents: yup.string().max(256, t("This area accepts max 256 characters.")),
    features: yup.string().max(256, t("This area accepts max 256 characters.")),
    accessibilityPerformance: yup.string().max(256, t("This area accepts max 256 characters.")),
    codePerformance: yup.string().max(256, t("This area accepts max 256 characters.")),
    sustainabilityPerformance: yup.string().max(256, t("This area accepts max 256 characters.")),
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

  const getClassificationCategory = async () => {
    await AssetClassificationsService.findAllActiveByLabel({
      label: "OmniClass23"
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root] || []));
      fixNodes(temp);
      setClassificationCategory(temp);
    });
  };

  const getClassificationDurationUnit = async () => {
    await AssetClassificationsService.findAllActiveByLabel({
      label: "DurationUnit"
    }).then((res) => {

      let temp = JSON.parse(JSON.stringify([res.data.root] || []));
      fixNodes(temp);
      setClassificationDurationUnit(temp);
    });
  };

  const getAssetType = async () => {
    await AssetClassificationsService.findAllActiveByLabel({
      label: "AssetType"
    }).then((res) => {

      let temp = JSON.parse(JSON.stringify([res.data.root] || []));
      fixNodes(temp);
      setAssetType(temp);
    });
  };

  const getContact = async () => {
    ContactService.findAll()
      .then((res) => {
        let temp = JSON.parse(JSON.stringify([res.data.root] || []));
        fixNodes(temp);
        setContact(temp);
      });
  };

  useEffect(() => {
    getClassificationCategory();
    getAssetType();
    getContact();
    getClassificationDurationUnit();
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
    TypesService.nodeInfo(selectedNodeKey)
      .then(async (res) => {
        console.log(res.data);
        
        let temp = {};
        await AssetClassificationsService.findClassificationByCodeAndLanguage("OmniClass23", res.data.properties.category).then(clsf1 => {
          setCodeCategory(res.data.properties.category);
          res.data.properties.category = clsf1.data.key
          temp = res.data.properties;
        })
          .catch((err) => {
            setData(res.data.properties);
          })
        await AssetClassificationsService.findClassificationByCodeAndLanguage("AssetType", res.data.properties.assetType).then(clsf2 => {
          setCodeAssetType(res.data.properties.assetType);
          res.data.properties.assetType = clsf2.data.key
          temp = res.data.properties;
        })
          .catch((err) => {
            setData(res.data.properties);
          })

        await AssetClassificationsService.findClassificationByCodeAndLanguage("DurationUnit", res.data.properties.durationUnit).then(clsf3 => {
          setCodeDurationUnit(res.data.properties.durationUnit);
          res.data.properties.durationUnit = clsf3.data.key
          temp = res.data.properties;
        })
          .catch((err) => {
            setData(res.data.properties);
          })

        await AssetClassificationsService.findClassificationByCodeAndLanguage("DurationUnit", res.data.properties.warrantyDurationUnit).then(clsf3 => {
          setCodeWarrantyCodeDurationUnit(res.data.properties.warrantyDurationUnit);
          res.data.properties.warrantyDurationUnit = clsf3.data.key
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
        tag: data?.tag,
        description: data?.description,
        category: codeCategory, //Düzeltilecek
        assetType: codeAssetType,   //codeAssetType, //Düzeltilecek
        manufacturer: data?.manufacturer,
        modelNo: data?.modelNo,
        warrantyGuarantorParts: data?.warrantyGuarantorParts,
        warrantyDurationParts: Number(data?.warrantyDurationParts),
        warrantyGuarantorLabor: data?.warrantyGuarantorLabor,
        warrantyDurationLabor: Number(data?.warrantyDurationLabor),
        warrantyDurationUnit: codeWarrantyDurationUnit,
        replacementCost: Number(data?.replacementCost),
        expectedLife: Number(data?.expectedLife),
        durationUnit: codeDurationUnit, //Düzeltilecek
        warranty: data?.warranty,
        nominalLength: Number(data?.nominalLength),
        nominalWidth: Number(data?.nominalWidth),
        nominalHeight: Number(data?.nominalHeight),
        modelReference: data?.modelReference,
        shape: data?.shape,
        size: data?.size,
        color: data?.color,
        finish: data?.finish,
        material: data?.material,
        constituents: data?.constituents,
        features: data?.features,
        accessibilityPerformance: data?.accessibilityPerformance,
        codePerformance: data?.codePerformance,
        sustainabilityPerformance: data?.sustainabilityPerformance,
        createdBy: data?.createdBy,
        documents: data?.documents || "",
        images: data?.images || "",
      };

      console.log(newNode);


      TypesService.create(newNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Type Created"),
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
          await TypesService.update(res.data.properties.id, {
            ...temp,
          });
          setUploadFiles({});
          getTypes();
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
      setUploadFiles({});

    } else {
      let updateNode: any = {};
      updateNode = {
        name: data?.name,
        tag: data?.tag,
        description: data?.description,
        category: codeCategory, //Düzeltilecek
        assetType: codeAssetType,  //codeAssetType, //Düzeltilecek
        manufacturer: data?.manufacturer,
        modelNo: data?.modelNo,
        warrantyGuarantorParts: data?.warrantyGuarantorParts,
        warrantyDurationParts: Number(data?.warrantyDurationParts),
        warrantyGuarantorLabor: data?.warrantyGuarantorLabor,
        warrantyDurationLabor: Number(data?.warrantyDurationLabor),
        warrantyDurationUnit: codeWarrantyDurationUnit,
        replacementCost: Number(data?.replacementCost),
        expectedLife: Number(data?.expectedLife),
        durationUnit: codeDurationUnit, //Düzeltilecek
        warranty: data?.warranty,
        nominalLength: Number(data?.nominalLength),
        nominalWidth: Number(data?.nominalWidth),
        nominalHeight: Number(data?.nominalHeight),
        modelReference: data?.modelReference,
        shape: data?.shape,
        size: data?.size,
        color: data?.color,
        finish: data?.finish,
        material: data?.material,
        constituents: data?.constituents,
        features: data?.features,
        accessibilityPerformance: data?.accessibilityPerformance,
        codePerformance: data?.codePerformance,
        sustainabilityPerformance: data?.sustainabilityPerformance,
        createdBy: data?.createdBy,
        documents: data?.documents || "",
        images: data?.images || "",
      };

      console.log(updateNode);


      TypesService.update(selectedNodeId, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Type Updated"),
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
          TypesService.update(selectedNodeId, {
            ...updateNode,
            ...temp,
          });

          setUploadFiles({});
          setDeleteFiles([]);
          getTypes();
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

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("name")}
                style={{ width: '100%' }}
                defaultValue={data?.name || ""}
              />
              <p style={{ color: "red" }}>{errors.name?.message}</p>
            </div>

            <div className="field col-12 md:col-3 structureChips">
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

            <div className="field col-12 md:col-3">
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

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
              <InputText
                autoComplete="off"
                {...register("description")}
                style={{ width: '100%' }}
                defaultValue={data?.description || ""}
              />
              <p style={{ color: "red" }}>{errors.description?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Asset Type")}</h5>
              <Controller
                defaultValue={data?.assetType || ""}
                name="assetType"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={assetType}
                    onChange={(e) => {
                      AssetClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeAssetType(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder=""
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.assetType?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
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

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Manufacturer")}</h5>
              <Controller
                defaultValue={data?.manufacturer || ""}
                name="manufacturer"
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
              <p style={{ color: "red" }}>{errors.manufacturer?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Model Number")}</h5>
              <InputText
                autoComplete="off"
                {...register("modelNo")}
                style={{ width: "100%" }}
                defaultValue={data?.modelNo || ""}
              />
              <p style={{ color: "red" }}>{errors.modelNo?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Warranty Guarantor Parts")}</h5>
              <Controller
                defaultValue={data?.warrantyGuarantorParts || ""}
                name="warrantyGuarantorParts"
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
              <p style={{ color: "red" }}>{errors.warrantyGuarantorParts?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Warranty Duration Parts")}</h5>
              <InputText
                type="number"
                autoComplete="off"
                {...register("warrantyDurationParts")}
                style={{ width: "100%" }}
                defaultValue={data?.warrantyDurationParts || 0}
              />
              <p style={{ color: "red" }}>{errors.warrantyDurationParts?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Warranty Guarantor Labor")}</h5>
              <Controller
                defaultValue={data?.warrantyGuarantorLabor || ""}
                name="warrantyGuarantorLabor"
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
              <p style={{ color: "red" }}>{errors.warrantyGuarantorLabor?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Warranty Duration Labor")}</h5>
              <InputText
                type="number"
                autoComplete="off"
                {...register("warrantyDurationLabor")}
                style={{ width: "100%" }}
                defaultValue={data?.warrantyDurationLabor || 0}
              />
              <p style={{ color: "red" }}>{errors.warrantyDurationLabor?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Warranty Duration Unit")}</h5>
              <Controller
                defaultValue={data?.warrantyDurationUnit || ""}
                name="warrantyDurationUnit"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationDurationUnit}
                    onChange={(e) => {
                      AssetClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeWarrantyCodeDurationUnit(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder=""
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.warrantyDurationUnit?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Replacement Cost")}</h5>
              <InputText
                type="number"
                autoComplete="off"
                {...register("replacementCost")}
                style={{ width: "100%" }}
                defaultValue={data?.replacementCost || 0}
              />
              <p style={{ color: "red" }}>{errors.replacementCost?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Expected Life")}</h5>
              <InputText
                type="number"
                autoComplete="off"
                {...register("expectedLife")}
                style={{ width: "100%" }}
                defaultValue={data?.expectedLife || 0}
              />
              <p style={{ color: "red" }}>{errors.expectedLife?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Duration Unit")}</h5>
              <Controller
                defaultValue={data?.durationUnit || ""}
                name="durationUnit"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationDurationUnit}
                    onChange={(e) => {
                      AssetClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeDurationUnit(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder=""
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.durationUnit?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Warranty")}</h5>
              <InputText
                autoComplete="off"
                {...register("warranty")}
                style={{ width: '100%' }}
                defaultValue={data?.warranty || ""}
              />
              <p style={{ color: "red" }}>{errors.projectDescription?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Nominal Length")}</h5>
              <InputText
                type="number"
                autoComplete="off"
                {...register("nominalLength")}
                style={{ width: '100%' }}
                defaultValue={data?.nominalLength || 0}
              />
              <p style={{ color: "red" }}>{errors.nominalLength?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Nominal Width")}</h5>
              <InputText
                type="number"
                autoComplete="off"
                {...register("nominalWidth")}
                style={{ width: '100%' }}
                defaultValue={data?.nominalWidth || 0}
              />
              <p style={{ color: "red" }}>{errors.nominalWidth?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Nominal Height")}</h5>
              <InputText
                type="number"
                autoComplete="off"
                {...register("nominalHeight")}
                style={{ width: '100%' }}
                defaultValue={data?.nominalHeight || 0}
              />
              <p style={{ color: "red" }}>{errors.nominalHeight?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Model Reference")}</h5>
              <InputText
                autoComplete="off"
                {...register("modelReference")}
                style={{ width: "100%" }}
                defaultValue={data?.modelReference || ""}
              />
              <p style={{ color: "red" }}>{errors.modelReference?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Shape")}</h5>
              <InputText
                autoComplete="off"
                {...register("shape")}
                style={{ width: "100%" }}
                defaultValue={data?.shape || ""}
              />
              <p style={{ color: "red" }}>{errors.shape?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Size")}</h5>
              <InputText
                autoComplete="off"
                {...register("size")}
                style={{ width: "100%" }}
                defaultValue={data?.size || ""}
              />
              <p style={{ color: "red" }}>{errors.size?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Color")}</h5>
              <InputText
                autoComplete="off"
                {...register("color")}
                style={{ width: "100%" }}
                defaultValue={data?.color || ""}
              />
              <p style={{ color: "red" }}>{errors.color?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Finish")}</h5>
              <InputText
                autoComplete="off"
                {...register("finish")}
                style={{ width: "100%" }}
                defaultValue={data?.finish || ""}
              />
              <p style={{ color: "red" }}>{errors.finish?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Material")}</h5>
              <InputText
                autoComplete="off"
                {...register("material")}
                style={{ width: "100%" }}
                defaultValue={data?.material || ""}
              />
              <p style={{ color: "red" }}>{errors.material?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Constituents")}</h5>
              <InputText
                autoComplete="off"
                {...register("constituents")}
                style={{ width: "100%" }}
                defaultValue={data?.constituents || ""}
              />
              <p style={{ color: "red" }}>{errors.constituents?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Features")}</h5>
              <InputText
                autoComplete="off"
                {...register("features")}
                style={{ width: "100%" }}
                defaultValue={data?.features || ""}
              />
              <p style={{ color: "red" }}>{errors.features?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Accessibility Performance")}</h5>
              <InputText
                autoComplete="off"
                {...register("accessibilityPerformance")}
                style={{ width: "100%" }}
                defaultValue={data?.accessibilityPerformance || ""}
              />
              <p style={{ color: "red" }}>{errors.accessibilityPerformance?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Code Performance")}</h5>
              <InputText
                autoComplete="off"
                {...register("codePerformance")}
                style={{ width: "100%" }}
                defaultValue={data?.codePerformance || ""}
              />
              <p style={{ color: "red" }}>{errors.codePerformance?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Sustainability Performance")}</h5>
              <InputText
                autoComplete="off"
                {...register("sustainabilityPerformance")}
                style={{ width: "100%" }}
                defaultValue={data?.sustainabilityPerformance || ""}
              />
              <p style={{ color: "red" }}>{errors.sustainabilityPerformance?.message}</p>
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

export default TypeForm;
