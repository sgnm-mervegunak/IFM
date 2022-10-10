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
import ContactService from "../../../services/contact";
import FacilityStructureService from "../../../services/facilitystructure";
import { useAppSelector } from "../../../app/hook";
import useToast from "../../../hooks/useToast";

interface Params {
  submitted: boolean;
  setSubmitted: any;
  selectedNodeKey: string;
  selectedNodeId: string;
  spaceKey: string;
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
  spaceKey,
  editDia,
  getComponents,
  setAddDia,
  setEditDia,
  isUpdate,
  setIsUpdate,
}: Params) => {

  const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
  const [allComponents, setAllComponents] = useState<Node[]>([]);
  const [spaces, setSpaces] = useState<Node[]>([]);
  const [spaceType, setSpaceType] = useState("");
  const [contact, setContact] = useState<any>([]);
  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const { toast } = useToast()
  const { t } = useTranslation(["common"]);
  const [codeDurationUnit, setCodeDurationUnit] = useState("");
  const [componentId, setComponentId] = useState("");

  const [data, setData] = useState<any>();

  const schema = yup.object({
    component: yup.string().required(t("This area is required.")),
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

  const getComponentsAll = () => {
    ComponentService.findAll()
      .then((res) => {
        if (!res.data.root.children) {
          let temp = JSON.parse(
            JSON.stringify([res.data.root.properties] || [])
          );
          fixNodes(temp);
          setAllComponents(temp);
        } else if (res.data.root.children) {
          let temp = JSON.parse(JSON.stringify([res.data.root] || []));
          fixNodes(temp);
          setAllComponents(temp);
        }
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 3000,
        });
      });
  };

  const getNodeType = (spaceKey: string) => {
    FacilityStructureService.nodeInfo(spaceKey)
      .then(async (res) => {
        console.log(res.data);

        setSpaceType(res.data.properties.nodeType);
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

  useEffect(() => {
    getComponentsAll();
    getNodeType(spaceKey);
  }, []);

  useEffect(() => {
    if (submitted) {
      handleSubmit(onSubmit)();
    }
    setSubmitted(false);
  }, [submitted]);


  const onSubmit = async (data: any) => {
    if (editDia === false) {
      let updateNode: any = {};
      updateNode = {
        spaceType: spaceType,
        space: spaceKey,
      };

      console.log(componentId);
      console.log(updateNode);

      ComponentService.update(componentId, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Component Updated"),
            life: 4000,
          });

          setTimeout(() => {
            getComponents();
          }, 500);
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

    } else {
      let updateNode: any = {};
      updateNode = {
        spaceType: spaceType,
        space: data?.space,
      };


      ComponentService.update(selectedNodeId, updateNode)
        .then(async (res) => {
          toast.current.show({
            severity: "success",
            summary: t("Successful"),
            detail: t("Component Updated"),
            life: 4000,
          });

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

      setEditDia(false);
    }
  };

  if (editDia && !data) {
    return null;
  }

  return (
    <form>

      <div className="formgrid grid">

        <div className="field col-12 md:col-12">
          <h5 style={{ marginBottom: "0.5em" }}>{t("Component")}</h5>
          <Controller
            defaultValue={data?.component || ""}
            name="component"
            control={control}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={allComponents}
                onChange={(e) => {
                  ComponentService.nodeInfo(e.value as string)
                    .then((res) => {
                      field.onChange(e.value)
                      setComponentId(res.data.identity.low);
                    })
                }}
                filter
                placeholder="Select Space"
                style={{ width: "100%" }}
              />
            )}
          />
          <p style={{ color: "red" }}>{errors.component?.message}</p>
        </div>

      </div>

    </form>
  );
};

export default TypeForm;
