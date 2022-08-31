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
import { TabView, TabPanel } from 'primereact/tabview';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useTranslation } from "react-i18next";

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

const schema = yup.object({
  name: yup.string().required("This area is required.").min(2, "This area accepts min 2 characters."),
  buildingStructure: yup.string().required("This area is required"),
  // status: yup.string().required("This area is required")

});


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

  const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
  const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const { toast } = useAppSelector((state) => state.toast);
  const { t } = useTranslation(["common"]);
  const [codeCategory, setCodeCategory] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const [codeLinearUnit, setCodeLinearUnit] = useState("");
  const [codeAreaUnit, setCodeAreaUnit] = useState("");
  const [codeVolumeUnit, setCodeVolumeUnit] = useState("");
  const [codeCurrencyUnit, setCodeCurrencyUnit] = useState("");

  const [data, setData] = useState<any>();
  const language = useAppSelector((state) => state.language.language);

  const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
    defaultValues: {
      ...data
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    watch((value, { name, type }) => console.log(value, name, type));
  }, [watch])

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
      language,
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
      language,
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

  useEffect(
    () => {
      console.log("dataaaa: ", data);

    }
    , [data])

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
        await ClassificationsService.findClassificationByCodeAndLanguage(realm, "OmniClass11", language, res.data.properties.category).then(clsf1 => {
          res.data.properties.category = clsf1.data.key
          temp = res.data.properties;
          // setData(res.data.properties);
        })
          .catch((err) => {
            setData(res.data.properties);
            toast.current.show({
              severity: "error",
              summary: t("Error"),
              detail: err.response ? err.response.data.message : err.message,
              life: 4000,
            });
          })

        await ClassificationsService.findClassificationByCodeAndLanguage(realm, "FacilityStatus", language, res.data.properties.status).then(async clsf2 => {
          console.log(clsf2.data);

          res.data.properties.status = await clsf2.data.key
          temp = res.data.properties;
          // setData(res.data.properties);
        })
          .catch((err) => {
            setData(res.data.properties);
            toast.current.show({
              severity: "error",
              summary: t("Error"),
              detail: err.response ? err.response.data.message : err.message,
              life: 4000,
            });
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
        name: data?.name,
        category: codeCategory,
        areaMeasurument: data?.areaMeasurument,
        address: data?.address,
        buildingStructure: data?.buildingStructure,
        images: data?.images,
        status: codeStatus,
        owner: data?.owner,
        operator: data?.operator,
        contractor: data?.contractor,
        handoverDate: data?.handoverDate,
        operationStartDate: data?.operationStartDate,
        warrantyExpireDate: data?.warrantyExpireDate,
        documents: data?.documents,
        tag: data?.tag,
        description: data?.description,
        projectName: data?.projectName,
        nodeType: selectedFacilityType,
        phase: data?.phase,
        linearUnit: data?.linearUnit,
        areaUnit: data?.areaUnit,
        volumeUnit: data?.volumeUnit,
        currencyUnit: data?.currencyUnit,
        projectDescription: data?.projectDescription,
        siteDescription: data?.siteDescription,
      };
      console.log(newNode);


      FacilityStructureService.createStructure(selectedNodeKey, newNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Building Created"),
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

      setTimeout(() => {
        setAddDia(false);
        setUploadFiles({});
        setSelectedFacilityType(undefined);
      }, 1000);
    } else {
      let updateNode: any = {};
      updateNode = {
        name: data?.name,
        category: codeCategory,
        areaMeasurument: data?.areaMeasurument,
        address: data?.address,
        buildingStructure: data?.buildingStructure,
        images: data?.images,
        status: codeStatus,
        owner: data?.owner,
        operator: data?.operator,
        contractor: data?.contractor,
        handoverDate: data?.handoverDate,
        operationStartDate: data?.operationStartDate,
        warrantyExpireDate: data?.warrantyExpireDate,
        documents: data?.documents,
        tag: data?.tag,
        description: data?.description,
        projectName: data?.projectName,
        nodeType: selectedFacilityType,
        phase: data?.phase,
        linearUnit: data?.linearUnit,
        areaUnit: data?.areaUnit,
        volumeUnit: data?.volumeUnit,
        currencyUnit: data?.currencyUnit,
        projectDescription: data?.projectDescription,
        siteDescription: data?.siteDescription,
      };

      FacilityStructureService.update(selectedNodeKey, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Building Updated"),
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
            summary: t("Error"),
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

  if (editDia && !data) {
    return null;
  }

  return (
    <form>

      {/* <div className="formgrid grid">
        <div className="field col-12 md:col-6">
          <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
          <InputText
            autoComplete="off"
            {...register("name")}
            style={{ width: '100%' }}
            defaultValue={data?.name || ""}
          />
          <p style={{ color: "red" }}>{errors.name?.message}</p>
        </div>

        <div className="field col-12 md:col-6">
          <h5 style={{ marginBottom: "0.5em" }}>Project Name</h5>
          <InputText
            autoComplete="off"
            {...register("projectName")}
            style={{ width: '100%' }}
            defaultValue={data?.projectName || ""}
          />
          <p style={{ color: "red" }}>{errors.projectName?.message}</p>
        </div>

        <div className="field col-12 md:col-6">
          <h5 style={{ marginBottom: "0.5em" }}>Category</h5>
          <Controller
            defaultValue={data?.category || []}
            name="category"
            control={control}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={classificationCategory}
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
          <h5 style={{ marginBottom: "0.5em" }}>Status</h5>
          <Controller
            defaultValue={data?.status || []}
            name="status"
            control={control}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={classificationStatus}
                onChange={(e) => {
                  ClassificationsService.nodeInfo(e.value as string)
                    .then((res) => {
                      console.log(res.data);

                      field.onChange(e.value)
                      setCodeStatus(res.data.properties.code || "");
                    })
                }}
                filter
                placeholder="Select Type"
                style={{ width: "100%" }}
              />
            )}
          />
          <p style={{ color: "red" }}>{errors.status?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Owner</h5>
          <InputText
            autoComplete="off"
            {...register("owner")}
            style={{ width: "100%" }}
            defaultValue={data?.owner || ""}
          />
          <p style={{ color: "red" }}>{errors.owner?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Operator</h5>
          <InputText
            autoComplete="off"
            {...register("operator")}
            style={{ width: "100%" }}
            defaultValue={data?.operator || ""}
          />
          <p style={{ color: "red" }}>{errors.owner?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Contractor</h5>
          <InputText
            autoComplete="off"
            {...register("contractor")}
            style={{ width: "100%" }}
            defaultValue={data?.contractor}
          />
          <p style={{ color: "red" }}>{errors.contractor?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Area Measurement</h5>
          <InputText
            autoComplete="off"
            {...register("areaMeasurement")}
            style={{ width: "100%" }}
            defaultValue={data?.areaMeasurement}
          />
          <p style={{ color: "red" }}>{errors.areaMeasurement?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Handover Date</h5>
          <Controller
            defaultValue={new Date(data?.handoverDate)}
            name="handoverDate"
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
          <p style={{ color: "red" }}>{errors.handoverDate?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Operation Start Date</h5>
          <Controller
            defaultValue={new Date(data?.operationStartDate)}
            name="operationStartDate"
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
          <p style={{ color: "red" }}>{errors.operationStartDate?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Warranty Expire Date</h5>
          <Controller
            defaultValue={new Date(data?.warrantyExpireDate)}
            name="warrantyExpireDate"
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
          <p style={{ color: "red" }}>{errors.warrantyExpireDate?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Phase</h5>
          <InputText
            autoComplete="off"
            {...register("phase")}
            style={{ width: "100%" }}
            defaultValue={data?.phase || ""}
          />
          <p style={{ color: "red" }}>{errors.phase?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Linear Units</h5>
          <Controller
            defaultValue={data?.linearUnit || []}
            name="linearUnit"
            control={control}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={classificationCategory}
                onChange={(e) => {
                  ClassificationsService.nodeInfo(e.value as string)
                    .then((res) => {
                      field.onChange(e.value)
                      setCodeLinearUnit(res.data.properties.code || "");
                    })
                }}
                filter
                placeholder="Select"
                style={{ width: "100%" }}
              />
            )}
          />
          <p style={{ color: "red" }}>{errors.linearUnit?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Area Units</h5>
          <Controller
            defaultValue={data?.areaUnit || []}
            name="areaUnit"
            control={control}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={classificationCategory}
                onChange={(e) => {
                  ClassificationsService.nodeInfo(e.value as string)
                    .then((res) => {
                      field.onChange(e.value)
                      setCodeAreaUnit(res.data.properties.code || "");
                    })
                }}
                filter
                placeholder="Select"
                style={{ width: "100%" }}
              />
            )}
          />
          <p style={{ color: "red" }}>{errors.areaUnit?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Volume Units</h5>
          <Controller
            defaultValue={data?.volumeUnit || []}
            name="volumeUnit"
            control={control}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={classificationCategory}
                onChange={(e) => {
                  ClassificationsService.nodeInfo(e.value as string)
                    .then((res) => {
                      field.onChange(e.value)
                      setCodeVolumeUnit(res.data.properties.code || "");
                    })
                }}
                filter
                placeholder="Select"
                style={{ width: "100%" }}
              />
            )}
          />
          <p style={{ color: "red" }}>{errors.volumeUnit?.message}</p>
        </div>

        <div className="field col-12 md:col-3">
          <h5 style={{ marginBottom: "0.5em" }}>Currency Unit</h5>
          <Controller
            defaultValue={data?.currencyUnit || []}
            name="currencyUnit"
            control={control}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={classificationCategory}
                onChange={(e) => {
                  ClassificationsService.nodeInfo(e.value as string)
                    .then((res) => {
                      field.onChange(e.value)
                      setCodeCurrencyUnit(res.data.properties.code || "");
                    })
                }}
                filter
                placeholder="Select"
                style={{ width: "100%" }}
              />
            )}
          />
          <p style={{ color: "red" }}>{errors.currencyUnit?.message}</p>
        </div>

        <div className="field col-12 md:col-6">
          <h5 style={{ marginBottom: "0.5em" }}>Address</h5>
          <InputText
            autoComplete="off"
            {...register("address")}
            style={{ width: '100%' }}
            defaultValue={data?.address || ""}
          />
          <p style={{ color: "red" }}>{errors.address?.message}</p>
        </div>

        <div className="field col-12 md:col-6 structureChips">
          <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
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
          <h5 style={{ marginBottom: "0.5em" }}>Description</h5>
          <InputText
            autoComplete="off"
            {...register("description")}
            style={{ width: '100%' }}
            defaultValue={data?.description || ""}
          />
          <p style={{ color: "red" }}>{errors.description?.message}</p>
        </div>

        <div className="field col-12 md:col-6">
          <h5 style={{ marginBottom: "0.5em" }}>Building Structure</h5>
          <Controller
            defaultValue={data?.buildingStructure || []}
            name="buildingStructure"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                options={buildingStructures}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Select Building Structure"
                style={{ width: "100%" }}
              />
            )}
          />
          <p style={{ color: "red" }}>{errors.buildingStructure?.message}</p>
        </div>

        <div className="field col-12 md:col-6">
          <h5 style={{ marginBottom: "0.5em" }}>Project Description</h5>
          <InputText
            autoComplete="off"
            {...register("projectDescription")}
            style={{ width: '100%' }}
            defaultValue={data?.projectDescription || ""}
          />
          <p style={{ color: "red" }}>{errors.projectDescription?.message}</p>
        </div>

        <div className="field col-12 md:col-6">
          <h5 style={{ marginBottom: "0.5em" }}>Site Description</h5>
          <InputText
            autoComplete="off"
            {...register("siteDescription")}
            style={{ width: '100%' }}
            defaultValue={data?.siteDescription || ""}
          />
          <p style={{ color: "red" }}>{errors.siteDescription?.message}</p>
        </div>

        <div className="field col-12">
          <h5 style={{ marginBottom: "0.5em" }}>Images</h5>
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

        <div className="field col-12">
          <h5 style={{ marginBottom: "0.5em" }}>Documents</h5>
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

      </div> */}

      <TabView className="tabview-header-icon">
        <TabPanel header="Form" leftIcon="pi pi-bars">
          <div className="formgrid grid">
            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
              <InputText
                autoComplete="off"
                {...register("name")}
                style={{ width: '100%' }}
                defaultValue={data?.name || ""}
              />
              <p style={{ color: "red" }}>{errors.name?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>Project Name</h5>
              <InputText
                autoComplete="off"
                {...register("projectName")}
                style={{ width: '100%' }}
                defaultValue={data?.projectName || ""}
              />
              <p style={{ color: "red" }}>{errors.projectName?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>Category</h5>
              <Controller
                defaultValue={data?.category || []}
                name="category"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationCategory}
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
              <h5 style={{ marginBottom: "0.5em" }}>Status</h5>
              <Controller
                defaultValue={data?.status || []}
                name="status"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationStatus}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          console.log(res.data);

                          field.onChange(e.value)
                          setCodeStatus(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder="Select Type"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.status?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Owner</h5>
              <InputText
                autoComplete="off"
                {...register("owner")}
                style={{ width: "100%" }}
                defaultValue={data?.owner || ""}
              />
              <p style={{ color: "red" }}>{errors.owner?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Operator</h5>
              <InputText
                autoComplete="off"
                {...register("operator")}
                style={{ width: "100%" }}
                defaultValue={data?.operator || ""}
              />
              <p style={{ color: "red" }}>{errors.owner?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Contractor</h5>
              <InputText
                autoComplete="off"
                {...register("contractor")}
                style={{ width: "100%" }}
                defaultValue={data?.contractor}
              />
              <p style={{ color: "red" }}>{errors.contractor?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Area Measurement</h5>
              <InputText
                autoComplete="off"
                {...register("areaMeasurement")}
                style={{ width: "100%" }}
                defaultValue={data?.areaMeasurement}
              />
              <p style={{ color: "red" }}>{errors.areaMeasurement?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Handover Date</h5>
              <Controller
                defaultValue={new Date(data?.handoverDate)}
                name="handoverDate"
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
              <p style={{ color: "red" }}>{errors.handoverDate?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Operation Start Date</h5>
              <Controller
                defaultValue={new Date(data?.operationStartDate)}
                name="operationStartDate"
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
              <p style={{ color: "red" }}>{errors.operationStartDate?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Warranty Expire Date</h5>
              <Controller
                defaultValue={new Date(data?.warrantyExpireDate)}
                name="warrantyExpireDate"
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
              <p style={{ color: "red" }}>{errors.warrantyExpireDate?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Phase</h5>
              <InputText
                autoComplete="off"
                {...register("phase")}
                style={{ width: "100%" }}
                defaultValue={data?.phase || ""}
              />
              <p style={{ color: "red" }}>{errors.phase?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Linear Units</h5>
              <Controller
                defaultValue={data?.linearUnit || []}
                name="linearUnit"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationCategory}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeLinearUnit(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder="Select"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.linearUnit?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Area Units</h5>
              <Controller
                defaultValue={data?.areaUnit || []}
                name="areaUnit"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationCategory}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeAreaUnit(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder="Select"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.areaUnit?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Volume Units</h5>
              <Controller
                defaultValue={data?.volumeUnit || []}
                name="volumeUnit"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationCategory}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeVolumeUnit(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder="Select"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.volumeUnit?.message}</p>
            </div>

            <div className="field col-12 md:col-3">
              <h5 style={{ marginBottom: "0.5em" }}>Currency Unit</h5>
              <Controller
                defaultValue={data?.currencyUnit || []}
                name="currencyUnit"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationCategory}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeCurrencyUnit(res.data.properties.code || "");
                        })
                    }}
                    filter
                    placeholder="Select"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.currencyUnit?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>Address</h5>
              <InputText
                autoComplete="off"
                {...register("address")}
                style={{ width: '100%' }}
                defaultValue={data?.address || ""}
              />
              <p style={{ color: "red" }}>{errors.address?.message}</p>
            </div>

            <div className="field col-12 md:col-6 structureChips">
              <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
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
              <h5 style={{ marginBottom: "0.5em" }}>Description</h5>
              <InputText
                autoComplete="off"
                {...register("description")}
                style={{ width: '100%' }}
                defaultValue={data?.description || ""}
              />
              <p style={{ color: "red" }}>{errors.description?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>Building Structure</h5>
              <Controller
                defaultValue={data?.buildingStructure || []}
                name="buildingStructure"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    options={buildingStructures}
                    onChange={(e) => field.onChange(e.value)}
                    placeholder="Select Building Structure"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.buildingStructure?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>Project Description</h5>
              <InputText
                autoComplete="off"
                {...register("projectDescription")}
                style={{ width: '100%' }}
                defaultValue={data?.projectDescription || ""}
              />
              <p style={{ color: "red" }}>{errors.projectDescription?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>Site Description</h5>
              <InputText
                autoComplete="off"
                {...register("siteDescription")}
                style={{ width: '100%' }}
                defaultValue={data?.siteDescription || ""}
              />
              <p style={{ color: "red" }}>{errors.siteDescription?.message}</p>
            </div>

          </div>

        </TabPanel>
        <TabPanel header="Images" headerClassName="ml-4" leftIcon="pi pi-images">
          <div className="formgrid grid">
            <div className="field col-12">
              <h5 style={{ marginBottom: "0.5em" }}>Images</h5>
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
        <TabPanel header="Documents" leftIcon="pi pi-file" >
          <div className="formgrid grid">
            <div className="field col-12">
              <h5 style={{ marginBottom: "0.5em" }}>Documents</h5>
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

      {/* <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
        <InputText
          autoComplete="off"
          {...register("name")}
          style={{ width: '100%' }}
          defaultValue={data?.name || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.name?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Category</h5>
        <Controller
          defaultValue={data?.category || []}
          name="category"
          control={control}
          render={({ field }) => (
            <TreeSelect
              value={field.value}
              options={classificationCategory}
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
      </div>
      <p style={{ color: "red" }}>{errors.category?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Area Measurument</h5>
        <InputText
          autoComplete="off"
          {...register("areaMeasurument")}
          style={{ width: '100%' }}
          defaultValue={data?.areaMeasurument || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.areaMeasurument?.message}</p>


      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Address</h5>
        <InputText
          autoComplete="off"
          {...register("address")}
          style={{ width: '100%' }}
          defaultValue={data?.address || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.address?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Building Structure</h5>
        <Controller

          defaultValue={data?.buildingStructure || []}
          name="buildingStructure"
          control={control}
          render={({ field }) => (
            <Dropdown
              value={field.value}
              options={buildingStructures}
              onChange={(e) => field.onChange(e.value)}
              placeholder="Select Building Structure"
              style={{ width: "100%" }}
            />
          )}
        />
      </div>
      <p style={{ color: "red" }}>{errors.buildingStructure?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Status</h5>
        <Controller
          defaultValue={data?.status || []}
          name="status"
          control={control}
          render={({ field }) => (
            <TreeSelect
              value={field.value}
              options={classificationStatus}
              onChange={(e) => {
                ClassificationsService.nodeInfo(e.value as string)
                  .then((res) => {
                    console.log(res.data);

                    field.onChange(e.value)
                    setCodeStatus(res.data.properties.code || "");
                  })
              }}
              filter
              placeholder="Select Type"
              style={{ width: "100%" }}
            />
          )}
        />
      </div>
      <p style={{ color: "red" }}>{errors.status?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Owner</h5>
        <InputText
          autoComplete="off"
          {...register("owner")}
          style={{ width: "100%" }}
          defaultValue={data?.owner || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.owner?.message}</p>


      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Operator</h5>
        <InputText
          autoComplete="off"
          {...register("operator")}
          style={{ width: "100%" }}
          defaultValue={data?.operator || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.operator?.message}</p>


      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Contractor</h5>
        <InputText
          autoComplete="off"
          {...register("contractor")}
          style={{ width: "100%" }}
          defaultValue={data?.contractor}
        />
      </div>
      <p style={{ color: "red" }}>{errors.contractor?.message}</p>


      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Handover Date</h5>
        <Controller
          defaultValue={new Date(data?.handoverDate)}
          name="handoverDate"
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
      </div>
      <p style={{ color: "red" }}>{errors.handoverDate?.message}</p>


      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Operation Start Date</h5>
        <Controller
          defaultValue={new Date(data?.operationStartDate)}
          name="operationStartDate"
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
      </div>
      <p style={{ color: "red" }}>{errors.operationStartDate?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Warranty Expire Date</h5>
        <Controller
          defaultValue={new Date(data?.warrantyExpireDate)}
          name="warrantyExpireDate"
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
      </div>
      <p style={{ color: "red" }}>{errors.warrantyExpireDate?.message}</p>

      <div className="field structureChips">
        <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
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
        <h5 style={{ marginBottom: "0.5em" }}>Description</h5>
        <InputText
          autoComplete="off"
          {...register("description")}
          style={{ width: '100%' }}
          defaultValue={data?.description || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.description?.message}</p>

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Project Name</h5>
        <InputText
          autoComplete="off"
          {...register("projectName")}
          style={{ width: '100%' }}
          defaultValue={data?.projectName || ""}
        />
      </div>
      <p style={{ color: "red" }}>{errors.projectName?.message}</p>


      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Images</h5>
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

      <div className="field">
        <h5 style={{ marginBottom: "0.5em" }}>Documents</h5>
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
      </div>
      <p style={{ color: "red" }}>{errors.documents?.message}</p> */}

    </form>
  );
};

export default BuildingForm;
