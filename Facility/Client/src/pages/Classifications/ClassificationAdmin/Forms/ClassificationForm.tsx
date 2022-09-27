import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Chips } from "primereact/chips";
import { TreeSelect } from "primereact/treeselect";
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from "primereact/checkbox";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import ClassificationsService from "../../../../services/classifications";
import { useAppSelector } from "../../../../app/hook";

interface Params {
  submitted: boolean;
  setSubmitted: any;
  selectedNodeKey: string;
  editDia: boolean;
  getClassification: () => void;
  setAddDia: React.Dispatch<React.SetStateAction<boolean>>;
  setEditDia: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdate: boolean;
  setIsUpdate: React.Dispatch<React.SetStateAction<boolean>>;
  contactData: Node[];
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

const ClassificationForm = ({
  submitted,
  setSubmitted,
  selectedNodeKey,
  editDia,
  getClassification,
  setAddDia,
  setEditDia,
  isUpdate,
  setIsUpdate,
  contactData,
}: Params) => {

  const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const { toast } = useAppSelector((state) => state.toast);
  const { t } = useTranslation(["common"]);
  const [codeCategory, setCodeCategory] = useState("");
  const [createdByNodeId, setCreatedByNodeId] = useState<string>("");
  const [categoryNodeId, setCategoryNodeId] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const language = useAppSelector((state) => state.language.language);
  const [codeShow, setCodeShow] = useState(true);

  const [data, setData] = useState<any>();

  const schema = yup.object({
    code: yup.string().when( {
      is: () => codeShow,
      then: yup.string().required(t("This area is required.")),
      otherwise: yup.string().notRequired()
    }),
    name: yup.string().required(t("This area is required.")),
  });

  const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
    defaultValues: {
      siteName: realm,
      ...data
    },
    resolver: yupResolver(schema)
  });


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
    ClassificationsService.nodeInfo(selectedNodeKey)
      .then(async (res) => {
        console.log(res.data);
        if (res.data.properties.code !== undefined) {
          setCodeShow(true);
        } else {
          setCodeShow(false);
        }
        setData(res.data.properties);
        setIsActive(res.data.properties.isActive);
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


  const onSubmit = (data: any) => {
    if (editDia === false) {
      let newNode: any = {};
      ClassificationsService.nodeInfo(selectedNodeKey)
        .then((res) => {
          console.log(res.data);
          if (res.data.labels[0] === "Classification") {
            newNode = {
              parentId: res.data.id,
              name: data?.name,
              code: data?.code,
              tag: data?.tag,
              description: data?.description,
              labels: [`${data?.name}_${language}`],
              realm: realm,
              isRoot: true,
            }
          } else {
            newNode = {
              parentId: res.data.id,
              name: data?.name,
              code: data?.code,
              tag: data?.tag,
              description: data?.description,
              labels: [res.data.labels[0]]
            }
          }

          ClassificationsService.create(newNode)
            .then((res) => {
              toast.current.show({
                severity: "success",
                summary: t("Successful"),
                detail: t("Classification Created"),
                life: 3000,
              });
              getClassification();
            })
            .catch((err) => {
              toast.current.show({
                severity: "error",
                summary: t("Error"),
                detail: err.response ? err.response.data.message : err.message,
                life: 2000,
              });
            });
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
            detail: err.response ? err.response.data.message : err.message,
            life: 2000,
          });
        });
      setAddDia(false);

    } else {
      let updateNode: any = {};
      ClassificationsService.nodeInfo(selectedNodeKey)
        .then((res) => {          
          if (res.data.properties.isRoot===true) {
            updateNode = {
              name: data?.name,
              code: data?.code || data?.name+"0",
              tag: data?.tag,
              description: data?.description,
              labels: [`${data?.name}_${language}`],
              realm: realm,
              isRoot: true,
              isActive: isActive,
            }
          } else {
            updateNode = {
              name: data?.name,
              code: data?.code || "",
              tag: data?.tag,
              description: data?.description,
              labels: [res.data.labels[0]],
              isActive: isActive,
            }
          }

          ClassificationsService.update(res.data.id, updateNode)
            .then(async (res) => {
              toast.current.show({
                severity: "success",
                summary: t("Successful"),
                detail: t("Classification Updated"),
                life: 3000,
              });
              if (res.data.properties.isActive === true) {
                await ClassificationsService.setActive(res.data.id)
              } else {
                await ClassificationsService.setPassive(res.data.id)
              }
              getClassification();
            })
            .catch((err) => {
              toast.current.show({
                severity: "error",
                summary: t("Error"),
                detail: err.response ? err.response.data.message : err.message,
                life: 2000,
              });
            });
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
            detail: err.response ? err.response.data.message : err.message,
            life: 2000,
          });
        });
      setEditDia(false);
    }
  };

  if (editDia && !data) {
    return null;
  }

  return (
    <form>

      <div className="formgrid grid">

        {/* {
          codeShow && (
            
          )
        } */}

        {codeShow===true ? (
          <div className="field col-12 md:col-12">
          <h5 style={{ marginBottom: "0.5em" }}>{t("Code")}</h5>
          <InputText
            autoComplete="off"
            {...register("code")}
            style={{ width: '100%' }}
            defaultValue={data?.code || ""}
          />
          <p style={{ color: "red" }}>{errors.code?.message}</p>
        </div>
        ): null}

        {/* <div className="field col-12 md:col-12">
          <h5 style={{ marginBottom: "0.5em" }}>{t("Code")}</h5>
          <InputText
            autoComplete="off"
            {...register("code")}
            style={{ width: '100%' }}
            defaultValue={data?.code || ""}
          />
          <p style={{ color: "red" }}>{errors.code?.message}</p>
        </div> */}

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
          <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
          <InputText
            autoComplete="off"
            {...register("description")}
            style={{ width: '100%' }}
            defaultValue={data?.description || ""}
          />
          <p style={{ color: "red" }}>{errors.description?.message}</p>
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

        {
          editDia === true &&
          <div className="field col-12 md:col-12">
            <h5 style={{ marginBottom: "0.5em" }}>{t("Is Active")}</h5>
            <Checkbox
              {...register("isActive")}
              style={{ width: '100%' }}
              checked={isActive}
              onChange={(e: any) => setIsActive(e.checked)}
            />
            <p style={{ color: "red" }}>{errors.isActive?.message}</p>
          </div>
        }

      </div>

    </form>
  );
};

export default ClassificationForm;
