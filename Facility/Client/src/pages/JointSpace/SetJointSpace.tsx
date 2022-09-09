import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { Chips } from 'primereact/chips';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { TreeSelect } from "primereact/treeselect";
import { Calendar } from "primereact/calendar";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";

import FacilityStructureService from "../../services/facilitystructure";
import ClassificationsService from "../../services/classifications";
import FormTypeService from "../../services/formType";
import StructureWinformService from "../../services/structureWinform";
import JointSpaceService from "../../services/jointSpace";
import { useAppSelector } from "../../app/hook";
import FormGenerate from "../FormGenerate/FormGenerate";
import DisplayNode from "../FacilityStructure/Display/DisplayNode";

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
  },
  icon?: string;
  label?: string;
  labels?: string[]; // for form type
  parentId?: string;
  className?: string;
  Name?: string;
  selectable?: boolean;
  nodeType?: string;
  isBlocked?: boolean;
}

interface FormNode {
  code: string;
  name: string;
  tag: string[];
  key: string;
  hasParent?: boolean;
  hasType?: boolean;
  isActive?: boolean;
  isDeleted?: boolean;
  label: string;
  children: FormNode[];
  _type?: string;
  formTypeId?: string;
  selectable?: boolean;
  _id: {
    low: string;
    high: string;
  },
  self_id: {
    low: string;
    high: string;
  },
  labelclass: string;
  icon?: string;
}

const schema = yup.object({
  name: yup.string().required("This area is required.").min(2, "This area accepts min 2 characters."),
  // buildingStructure: yup.string().required("This area is required"),
  // status: yup.string().required("This area is required")

});

const SetJointSpace = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedKeysName, setSelectedKeysName] = useState<string[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>([]);
  const [deleteNodeKey, setDeleteNodeKey] = useState<any>("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>();
  const [nodeKeys, setNodeKeys] = useState<string[]>([]);
  const [classificationSpace, setClassificationSpace] = useState<Node[]>([]);
  const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
  const [codeCategory, setCodeCategory] = useState("");
  const [codeStatus, setCodeStatus] = useState("");
  const [formTypeId, setFormTypeId] = useState<any>(undefined);
  const [labels, setLabels] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [addDia, setAddDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const [formDia, setFormDia] = useState<boolean>(false);
  const { toast } = useAppSelector((state) => state.toast);
  const cm: any = React.useRef(null);
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormNode[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const [generateNodeKey, setGenerateNodeKey] = useState("");
  const [generateFormTypeKey, setGenerateFormTypeKey] = useState<string | undefined>("");
  const [generateNodeName, setGenerateNodeName] = useState<string | undefined>("");
  const [facilityType, setFacilityType] = useState<string[]>([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState<string | undefined>("");
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [display, setDisplay] = useState(false);
  const [displayKey, setDisplayKey] = useState("");
  const params = useParams();
  const { t } = useTranslation(["common"]);

  const { register, handleSubmit, watch, reset, formState: { errors }, control } = useForm({
    defaultValues: {
      ...data
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    watch((value, { name, type }) => console.log(value, name, type));
  }, [watch])

  const fixNodesClassification = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodesClassification(i.children);
      i.label = i.name;
      i.selectable = true;
    }
  };

  const getClassificationSpace = async () => {
    await ClassificationsService.findAllActiveByLabel({ label: "OmniClass13"}).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodesClassification(temp);
      setClassificationSpace(temp);
    });
  };

  const getClassificationStatus = async () => {
    await ClassificationsService.findAllActiveByLabel({ label: "FacilityStatus"}).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodesClassification(temp);
      setclassificationStatus(temp);
    });
  };

  useEffect(() => {
    getClassificationSpace();
    getClassificationStatus();
  }, []);

  const getNodeInfoAndEdit = (selectedNodeKey: string) => {
    FacilityStructureService.nodeInfo(selectedNodeKey)
      .then((res) => {
        console.log(res.data);
        setSelectedFacilityType(res.data.properties.nodeType);

        // setName(res.data.properties.name || "");
        // setTag(res.data.properties.tag || []);
        // setIsActive(res.data.properties.isActive);
        // setFormTypeId(res.data.properties.formTypeId);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
      });
  }

  const menu = [
    {
      label: "Add Item",
      icon: "pi pi-plus",
      command: () => {
        setAddDia(true);
      },
    },
    {
      label: "Edit Item",
      icon: "pi pi-pencil",
      command: () => {
        setIsUpdate(true);
        // getNodeInfoAndEdit(selectedNodeKey);
        setEditDia(true);
      },
    },
    {
      label: "Delete",
      icon: "pi pi-trash",
      command: () => {
        setDelDia(true);
      },
    },
  ];

  const getJointSpace = () => {
    const key = params.id || "";
    JointSpaceService.findBuildingWithKey(key).then((res) => {

      if (!res.data.root.children) {
        setData([res.data.root.properties] || []);
        let temp = JSON.parse(JSON.stringify([res.data.root.properties] || []));
        fixNodes(temp)
        setData(temp)
      }
      else if (res.data.root.children) {
        setData([res.data.root] || []);
        let temp = JSON.parse(JSON.stringify([res.data.root] || []));
        fixNodes(temp)
        setData(temp)
      }
      setLoading(false);
    }).catch(err => {
      if (err.response.status === 500) {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: "Joint Space not found",
          life: 3000,
        });
        setTimeout(() => {
          navigate("/jointspace")
        }, 3000)
      }
    })
  }

  useEffect(() => {
    getJointSpace();
  }, []);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children)
      i.icon = "pi pi-fw pi-building";
      i.label = i.name || i.Name;
      if ((i.nodeType === "Space" || i.nodeType === "JointSpace") && i.isBlocked !== true) {
        i.selectable = true;
      } else {
        i.selectable = false;
      }

    }
  };

  const addItem = handleSubmit((data) => {
    let newNode: any = {};

    newNode = {
      ArchitecturalName: data?.ArchitecturalName,
      ArchitecturalCode: data?.ArchitecturalCode,
      name: data?.name,  //selectedKeysName.toString().replaceAll(",", "-"),
      code: data?.code,
      tag: data?.tag,
      m2: data?.m2,
      spaceType: codeCategory,
      status: codeStatus,
      jointStartDate: data?.jointStartDate,
      jointEndDate: data?.jointEndDate,
      nodeKeys: selectedKeys
    };
    console.log(newNode);

    JointSpaceService.createJointSpace(newNode)
      .then((res) => {
        toast.current.show({
          severity: "success",
          summary: t("Successful"),
          detail: t("Joint Space Created"),
          life: 3000,
        });

        getJointSpace();
        setSelectedNodeKey([]);
        setSelectedKeys([]);

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
  });

  // const editItem = (key: string) => {
  //   let updateNode: any = {};
  //   FacilityStructureService.nodeInfo(key)
  //     .then((responseStructure) => {
  //       if (labels.length > 0) {
  //         updateNode = {
  //           name: name,
  //           tag: tag,
  //           isActive: isActive,
  //           description: "",
  //           labels: [labels[0]],
  //           formTypeId: formTypeId,
  //         };
  //       } else {
  //         updateNode = {
  //           name: name,
  //           tag: tag,
  //           isActive: isActive,
  //           description: "",
  //           formTypeId: formTypeId,
  //         }
  //       }

  //       FacilityStructureService.update(responseStructure.data.id, updateNode)
  //         .then((res) => {
  //           toast.current.show({
  //             severity: "success",
  //             summary: "Successful",
  //             detail: "Structure Updated",
  //             life: 3000,
  //           });
  //           getJointSpace();
  //         })
  //         .catch((err) => {
  //           toast.current.show({
  //             severity: "error",
  //             summary: "Error",
  //             detail: err.response ? err.response.data.message : err.message,
  //             life: 2000,
  //           });
  //         });
  //     })
  //     .catch((err) => {
  //       toast.current.show({
  //         severity: "error",
  //         summary: "Error",
  //         detail: err.response ? err.response.data.message : err.message,
  //         life: 2000,
  //       });
  //     });

  //   setEditDia(false);
  // }

  const deleteItem = (key: string) => {
    JointSpaceService.remove(key)
      .then(() => {
        toast.current.show({
          severity: "success",
          summary: t("Successful"),
          detail: t("Joint Space Deleted"),
          life: 2000,
        });
        getJointSpace();
        setSelectedNodeKey([]);
        setSelectedKeys([]);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
      });
  };

  const findKeyName = (data: any) => {

    setSelectedKeysName([])

    if (data.length > 0) {
      data.map((key: any) => {
        FacilityStructureService.nodeInfo(key)
          .then((res) => {
            setSelectedKeysName(prev => [...prev, res.data.properties.name]);
          })
      }
      )
    }
  };

  const showSuccess = (detail: string) => {
    toast.current.show({
      severity: "success",
      summary: "Success Message",
      detail: detail,
      life: 3000,
    });
  };

  const renderFooterAdd = () => {
    return (
      <div>
        <Button
          label={t("Cancel")}
          icon="pi pi-times"
          onClick={() => {
            setAddDia(false);
            reset({
              name: "",
              code: "",
              ArchitecturalCode: "",
              ArchitecturalName: "",
              tag: "",
              m2: "",
              spaceType: "",
              status: "",
              jointStartDate: "",
              jointEndDate: ""
            });
          }}
          className="p-button-text"
        />
        <Button
          label={t("Add")}
          icon="pi pi-check"
          onClick={() => addItem()}
          autoFocus
        />
      </div>
    );
  };

  const renderFooterEdit = () => {
    return (
      <div>
        <Button
          label="Cancel"
          icon="pi pi-times"
          onClick={() => {
            setEditDia(false);
          }}
          className="p-button-text"
        />
        <Button
          label="Save"
          icon="pi pi-check"
          onClick={() => setSubmitted(true)}
          autoFocus
        />
      </div>
    );
  };

  // const renderFooterForm = () => {
  //   return (
  //     <div>
  //       <Button
  //         label="Cancel"
  //         icon="pi pi-times"
  //         onClick={() => {
  //           setFormDia(false);
  //         }}
  //         className="p-button-text"
  //       />
  //     </div>
  //   );
  // };

  return (
    <div className="container">
      <ContextMenu model={menu} ref={cm} />
      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message={t("Do you want to delete?")}
        header={t("Delete Confirmation")}
        icon="pi pi-exclamation-triangle"
        accept={() => deleteItem(deleteNodeKey)}
      />
      <Dialog
        header={t("Joint Space Detail")}
        visible={display}
        position={"right"}
        modal={false}
        style={{ width: "30vw" }}
        onHide={() => {
          setDisplay(false);
          setDisplayKey("");
        }}
        resizable
      >
        <DisplayNode displayKey={displayKey} />
      </Dialog>
      <Dialog
        header={t("Add New Item")}
        visible={addDia}
        style={{ width: "40vw" }}
        footer={renderFooterAdd}
        onHide={() => {
          setAddDia(false);
        }}
      >

        <form>
          <div className="formgrid grid">

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
              <h5 style={{ marginBottom: "0.5em" }}>{t("Architectural Code")}</h5>
              <InputText
                autoComplete="off"
                {...register("ArchitecturalCode")}
                style={{ width: '100%' }}
                defaultValue={data?.ArchitecturalCode || ""}
              />
              <p style={{ color: "red" }}>{errors.ArchitecturalCode?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Architectural Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("ArchitecturalName")}
                style={{ width: '100%' }}
                defaultValue={data?.ArchitecturalName || ""}
              />
              <p style={{ color: "red" }}>{errors.ArchitecturalName?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Category")}</h5>
              <Controller
                defaultValue={data?.spaceType || []}
                name="spaceType"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationSpace}
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
              <p style={{ color: "red" }}>{errors.spaceType?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Status")}</h5>
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
                          field.onChange(e.value)
                          setCodeStatus(res.data.properties.code || "");
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
              <h5 style={{ marginBottom: "0.5em" }}>{t("M2")}</h5>
              <InputText
                autoComplete="off"
                {...register("m2")}
                style={{ width: '100%' }}
                defaultValue={data?.m2 || ""}
              />
              <p style={{ color: "red" }}>{errors.m2?.message}</p>
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
              <h5 style={{ marginBottom: "0.5em" }}>{t("Joint Start Date")}</h5>
              <Controller
                defaultValue={new Date(data?.jointStartDate)}
                name="jointStartDate"
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
              <p style={{ color: "red" }}>{errors.jointStartDate?.message}</p>
            </div>

            <div className="field col-12 md:col-6">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Joint End Date")}</h5>
              <Controller
                defaultValue={new Date(data?.jointEndDate)}
                name="jointEndDate"
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
              <p style={{ color: "red" }}>{errors.jointEndDate?.message}</p>
            </div>

          </div>
        </form>

      </Dialog>

      <Dialog
        header="Edit Item"
        visible={editDia}
        style={{ width: "40vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          setEditDia(false);
        }}
      >
      </Dialog>


      <h3>{t("Joint Space")}</h3>
      <div>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>{t("Selected Spaces")}:</span>
        <span style={{ fontWeight: "bold", fontSize: "14px", color: "red" }}>{` ${selectedKeysName.toString().replaceAll(",", ", ")} `}</span>

        {selectedKeys.length > 1 &&
          <div className="mt-4">

            <Button label={t("Join")} icon="pi pi-check" className="ml-2" onClick={() => setAddDia(true)} />

          </div>
        }

      </div>
      <div className="field mt-4">
        <Tree
          loading={loading}
          value={data}
          dragdropScope="-"
          filter
          filterBy="name,code"
          filterPlaceholder={t("Search")}
          selectionMode="checkbox"
          onSelect={(e:any)=>{
            setSelectedKeysName(prev=>([...prev,e.node.name]))
            
          }}
          onUnselect={(e:any)=>{
            setSelectedKeysName(prev=>prev.filter(item=>item!==e.node.name))
            
          }}
          onSelectionChange={(event: any) => {

            console.log(event);

            setSelectedNodeKey(event.value);
            setSelectedKeys(Object.keys(event.value));
            // findKeyName(Object.keys(event.value));
          }
          }
          selectionKeys={selectedNodeKey}
          propagateSelectionUp={false}
          className="font-bold"
          nodeTemplate={(data: Node, options) => <span className="flex align-items-center font-bold">{data.label} {
            <>
              <span className="ml-4 ">
                {
                  data.nodeType === "JointSpace" ? <Button
                    icon="pi pi-trash" className="p-button-rounded p-button-secondary p-button-text" aria-label="Delete"
                    onClick={() => {
                      setDeleteNodeKey(data.key);
                      setDelDia(true)
                    }}
                    title={t("Delete")}
                  />
                    : null
                }
              </span>
              <span>
                {
                  data.nodeType === "JointSpace" ? <Button
                    icon="pi pi-eye" className="p-button-rounded p-button-secondary p-button-text" aria-label="Display"
                    onClick={() => {
                      setDisplay(true);
                      setDisplayKey(data.key);
                      
                    }}
                    title={t("Display")}
                  />
                    : null
                }
              </span>
            </>
          }
          </span>}
        />
      </div>

    </div>
  );
};

export default SetJointSpace;