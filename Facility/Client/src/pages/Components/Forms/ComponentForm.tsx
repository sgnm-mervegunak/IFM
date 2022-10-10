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

import ComponentService from "../../../services/components";
import ClassificationsService from "../../../services/classifications";
import AssetClassificationsService from "../../../services/assetclassifications";
import ContactService from "../../../services/contact";
import FacilityStructureService from "../../../services/facilitystructure";
import FacilityStructureLazyService from "../../../services/facilitystructurelazy";
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
  getComponents: () => void;
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

const TypeForm = ({
  submitted,
  setSubmitted,
  selectedNodeKey,
  selectedNodeId,
  editDia,
  getComponents,
  setAddDia,
  setEditDia,
  isUpdate,
  setIsUpdate,
}: Params) => {

  const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
  const [classificationDurationUnit, setClassificationDurationUnit] = useState<Node[]>([]);
  const [spaces, setSpaces] = useState<Node[]>([]);
  const [spaceType, setSpaceType] = useState("");
  const [contact, setContact] = useState<any>([]);
  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const { toast } = useToast()
  const { t } = useTranslation(["common"]);
  const [codeWarrantyDurationUnit, setCodeWarrantyCodeDurationUnit] = useState("");
  const [expandedKeys, setExpandedKeys] = useState({});

  const [data, setData] = useState<any>();

  const schema = yup.object({
    name: yup.string().max(50, t("This area accepts max 50 characters.")),
    description: yup.string().required(t("This area is required.")).max(256, t("This area accepts max 256 characters.")),
    space: yup.string().required(t("This area is required.")),
    serialNo: yup.string().max(256, t("This area accepts max 256 characters.")),
    tagNumber: yup.string().max(256, t("This area accepts max 256 characters.")),
    barCode: yup.string().max(13, t("This area accepts max 13 characters.")),
    assetIdentifier: yup.string().max(50, t("This area accepts max 50 characters.")),
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
    await ClassificationsService.findAllActiveByLabel({
      label: "OmniClass11"
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodes(temp);
      setClassificationCategory(temp);
    });
  };

  const getSpaces = () => {
    FacilityStructureLazyService.findAll().then((res) => {
      let temp = JSON.parse(
        JSON.stringify([res.data] || [])
      );
      fixNodesSpaces(temp);
      setSpaces(temp);
    });

  };

  const loadOnExpand = (event: any) => {
    if (!event.node.children) {
      console.log(event);


      FacilityStructureLazyService.lazyLoadByKey(event.node.key)
        .then((res) => {

          event.node.children = res.data.children.map((child: any) => ({
            ...child,
            id: child.id,
            leaf: child.leaf,
          }));

          let temp = JSON.parse(
            JSON.stringify([...spaces] || [])
          );
          fixNodesSpaces(temp);
          setSpaces(temp);

        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
        });
    }
  };

  const getContact = async () => {
    ContactService.findAll({page:1,limit:1000,orderBy:"ASC",orderByColumn:"email"})
      .then((res) => {
        let temp = JSON.parse(JSON.stringify([res.data] || []));
        fixNodes(temp);
        setContact(temp);
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

  useEffect(() => {
    getClassificationCategory();
    getContact();
    getSpaces();
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
    ComponentService.nodeInfo(selectedNodeKey)
      .then(async (res) => {
        await AssetClassificationsService.findClassificationByCodeAndLanguage("DurationUnit", res.data.properties.warrantyDurationUnit).then(clsf3 => {
          setCodeWarrantyCodeDurationUnit(res.data.properties.warrantyDurationUnit);
          res.data.properties.warrantyDurationUnit = clsf3.data.key
        })
          .catch((err) => {
            setData(res.data.properties);
          })
        await FacilityStructureService.nodeInfo(res.data.properties.space)
          .then((res2) => {
            setSpaceType(res2.data.properties.nodeType);
          })

        await FacilityStructureLazyService.loadStructureWithPathByKey(res.data.properties.space)
          .then((res3) => {
            let temp = JSON.parse(
              JSON.stringify([res3.data] || [])
            );
            fixNodesSpaces(temp);
            setSpaces(temp);

          })

        // setData(temp);
        setData(res.data.properties);

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
        spaceType: spaceType,
        space: data?.space,
        tag: data?.tag,
        description: data?.description,
        createdBy: data?.createdBy,
        serialNo: data?.serialNo,
        installationDate: data?.installationDate,
        warrantyStartDate: data?.warrantyStartDate,
        tagNumber: data?.tagNumber,
        barCode: data?.barCode,
        assetIdentifier: data?.assetIdentifier,
        warrantyGuarantorParts: data?.warrantyGuarantorParts,
        warrantyDurationParts: data?.warrantyDurationParts,
        warrantyGuarantorLabor: data?.warrantyGuarantorLabor,
        warrantyDurationLabor: data?.warrantyDurationLabor,
        warrantyDurationUnit: codeWarrantyDurationUnit,
        images: data?.images || "",
        documents: data?.documents || "",
        parentKey: selectedNodeKey,
      };

      console.log(newNode);
      

      ComponentService.create(newNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Component Created"),
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


          await ComponentService.update(res.data.properties.id, {
            ...temp,
          });
          setUploadFiles({});
          getComponents();
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
        spaceType: spaceType,
        space: data?.space,
        tag: data?.tag,
        description: data?.description,
        createdBy: data?.createdBy,
        serialNo: data?.serialNo,
        installationDate: data?.installationDate,
        warrantyStartDate: data?.warrantyStartDate,
        tagNumber: data?.tagNumber,
        barCode: data?.barCode,
        assetIdentifier: data?.assetIdentifier,
        warrantyGuarantorParts: data?.warrantyGuarantorParts,
        warrantyDurationParts: data?.warrantyDurationParts,
        warrantyGuarantorLabor: data?.warrantyGuarantorLabor,
        warrantyDurationLabor: data?.warrantyDurationLabor,
        warrantyDurationUnit: codeWarrantyDurationUnit,
        images: data?.images || "",
        documents: data?.documents || "",
        parentKey: selectedNodeKey,
      };

      console.log(updateNode);
      

      ComponentService.update(selectedNodeId, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Component Updated"),
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
          ComponentService.update(selectedNodeId, {
            ...updateNode,
            ...temp,
          });

          setUploadFiles({});
          setDeleteFiles([]);
          getComponents();
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

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("name")}
                style={{ width: '100%' }}
                defaultValue={data?.name || ""}
              />
              <p style={{ color: "red" }}>{errors.name?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Space")}</h5>
              <Controller
                defaultValue={data?.space || ""}
                name="space"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={spaces}
                    onNodeExpand={loadOnExpand}
                    // expandedKeys={expandedKeys}
                    // onToggle={(e) => setExpandedKeys(e.value)}
                    onShow={() => { console.log('show') }}
                    onHide={() => { console.log('hide') }}
                    onChange={(e) => {
                      FacilityStructureService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setSpaceType(res.data.properties.nodeType);
                        })
                    }}
                    filter
                    placeholder=""
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.space?.message}</p>
            </div>

            <div className="field col-12 md:col-4 structureChips">
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

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
              <InputText
                autoComplete="off"
                {...register("description")}
                style={{ width: '100%' }}
                defaultValue={data?.description || ""}
              />
              <p style={{ color: "red" }}>{errors.description?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
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

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Serial No")}</h5>
              <InputText
                autoComplete="off"
                {...register("serialNo")}
                style={{ width: '100%' }}
                defaultValue={data?.serialNo || ""}
              />
              <p style={{ color: "red" }}>{errors.serialNo?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Installation Date")}</h5>
              <Controller
                defaultValue={data ? new Date(data?.installationDate) : ""}
                name="installationDate"
                control={control}
                render={({ field }) => (
                  <Calendar
                    dateFormat="dd/mm/yy"
                    value={field.value}
                    showIcon
                    style={{ width: "100%" }}
                    onChange={(e) => {
                      field.onChange(e.value)
                    }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.installationDate?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Warranty Start Date")}</h5>
              <Controller
                defaultValue={data ? new Date(data?.warrantyStartDate) : ""}
                name="warrantyStartDate"
                control={control}
                render={({ field }) => (
                  <Calendar
                    dateFormat="dd/mm/yy"
                    value={field.value}
                    showIcon
                    style={{ width: "100%" }}
                    onChange={(e) => {
                      field.onChange(e.value)
                    }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.warrantyStartDate?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Tag Number")}</h5>
              <InputText
                autoComplete="off"
                {...register("tagNumber")}
                style={{ width: '100%' }}
                defaultValue={data?.tagNumber || ""}
              />
              <p style={{ color: "red" }}>{errors.tagNumber?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Barcode")}</h5>
              <InputText
                autoComplete="off"
                {...register("barCode")}
                style={{ width: '100%' }}
                defaultValue={data?.barCode || ""}
              />
              <p style={{ color: "red" }}>{errors.barCode?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Asset Identifier")}</h5>
              <InputText
                autoComplete="off"
                {...register("assetIdentifier")}
                style={{ width: '100%' }}
                defaultValue={data?.assetIdentifier || ""}
              />
              <p style={{ color: "red" }}>{errors.assetIdentifier?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
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

            <div className="field col-12 md:col-4">
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

            <div className="field col-12 md:col-4">
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

            <div className="field col-12 md:col-4">
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

            <div className="field col-12 md:col-4">
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
