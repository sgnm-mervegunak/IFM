import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { Chips } from "primereact/chips";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { TreeSelect } from "primereact/treeselect";
import { useNavigate, useParams } from "react-router-dom";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";

import FacilityStructureService from "../../services/facilitystructure";
import ClassificationsService from "../../services/classifications";
import ZoneService from "../../services/zone";
import { useAppSelector } from "../../app/hook";
import FormGenerate from "../FormGenerate/FormGenerate";
import { useTranslation } from "react-i18next";
import Export, { ExportType } from "../FacilityStructure/Export/Export";
import ExportService from "../../services/export";
import DownloadExcel from "../../utils/download-excel";
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
  };
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

interface ZoneInterface {
  name: string;
  category: string;
  spaceNames: string;
  code: string;
  description: string;
  credatedBy: string;
  createdOn: string;
  externalSystem: string;
  externalObject: string;
  tags: string[];
  nodeKeys: string[];
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
  };
  self_id: {
    low: string;
    high: string;
  };
  labelclass: string;
  icon?: string;
}

const schema = yup.object({
  name: yup.string().required("This area is required."),
  code: yup.string().required("This area is required."),


});

const SetZone = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedKeysName, setSelectedKeysName] = useState<string[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>([]);
  const [deleteNodeKey, setDeleteNodeKey] = useState<any>("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Node[]>([]);
  const [createZone, setCreateZone] = useState<ZoneInterface>({} as ZoneInterface)
  const [ArchitecturalName, setArchitecturalName] = useState<string>("");
  const [ArchitecturalCode, setArchitecturalCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  // const [tag, setTag] = useState<string[]>([]);
  const [m2, setM2] = useState<string>("");
  const [spaceType, setSpaceType] = useState<any>(undefined);
  const [status, setStatus] = useState<any>(undefined);
  const [jointStartDate, setJointStartDate] = useState<any>(undefined);
  const [jointEndDate, setJointEndDate] = useState<any>(undefined);
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
  const [display, setDisplay] = useState(false);
  const [displayKey, setDisplayKey] = useState("");
  const [exportDia, setExportDia] = useState(false);
  const { toast } = useAppSelector((state) => state.toast);
  const { t } = useTranslation(["common"]);
  const language = useAppSelector((state) => state.language.language);
  const cm: any = React.useRef(null);
  const navigate = useNavigate();
  // const [formData, setFormData] = useState<FormNode[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const [generateNodeKey, setGenerateNodeKey] = useState("");
  const [generateFormTypeKey, setGenerateFormTypeKey] = useState<
    string | undefined
  >("");
  const [generateNodeName, setGenerateNodeName] = useState<string | undefined>(
    ""
  );
  const [facilityType, setFacilityType] = useState<string[]>([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState<string | undefined>("");
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);


  const params = useParams();

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
    await ClassificationsService.findAllActiveByLabel({
      label: "OmniClass13"
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodesClassification(temp);
      setClassificationSpace(temp);
    });
  };

  const getClassificationStatus = async () => {
    await ClassificationsService.findAllActiveByLabel({
      label: "FacilityZoneTypes"
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodesClassification(temp);
      temp[0].selectable = false
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
  };

  // const menuBuilding = [
  //   {
  //     label: t("Export Zones"),
  //     icon: "pi pi-download",
  //     command: () => {
  //       console.log("in here, export zones");

  //       let key = selectedNodeKey;
  //       console.log("node key", key);
  //       ExportService.exportZones({
  //         buildingKeys: key.map((item: any) => {
  //           if (item.key) {
  //             return item.key;
  //           }
  //         }),
  //         realm: auth.auth.realm,
  //       })
  //         .then(async (res) => {
  //           await DownloadExcel(res.data, "test", "zones-deneme");
  //           setExportDia(false);
  //         })
  //         .catch((err) => {
  //           toast.current.show({
  //             severity: "error",
  //             summary: "Error",
  //             detail: err.response ? err.response.data.message : err.message,
  //             life: 2000,
  //           });
  //         });

  //     },
  //   },
  // ];

  const getZone = () => {
    const key = params.id || "";
    ZoneService.findBuildingWithKey(key)
      .then((res) => {
        console.log(res.data);
        if (!res.data.root.children) {
          setData([res.data.root.properties] || []);
          let temp = JSON.parse(
            JSON.stringify([res.data.root.properties] || [])
          );
          fixNodes(temp);
          setData(temp);
        } else if (res.data.root.children) {
          setData([res.data.root] || []);
          let temp = JSON.parse(JSON.stringify([res.data.root] || []));
          fixNodes(temp);
          setData(temp);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (err.response.status === 500) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Zone not found",
            life: 3000,
          });
          setTimeout(() => {
            navigate("/zone");
          }, 3000);
        }
      });
  };

  useEffect(() => {
    getZone();
  }, []);

  const [formData, setFormData] = useState<any>();

  const { register, handleSubmit, watch, formState: { errors }, control, reset, formState, formState: { isSubmitSuccessful } } = useForm<ZoneInterface>({
    resolver: yupResolver(schema)
  })

  useEffect(() => {
    watch((value, { name, type }) => console.log(value, name, type));
  }, [watch])


  useEffect(() => {
    if (formState.isSubmitSuccessful) {
      reset({ ...createZone });
    } else {

    }
  }, [formState, createZone, reset]);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.icon = "pi pi-fw pi-building";
      i.label = i.name || i.Name;
      if (i.nodeType === "Space") {
        i.selectable = true;
      } else {
        i.selectable = false;
      }
    }
  };

  const addItem = (createZone: any) => {
    let newNode: any = {};
    newNode = {
      ...createZone,
      category:codeCategory,
      spaceNames: `${selectedKeysName.toString().replaceAll(",", ", ")}` || "",
      nodeKeys: selectedKeys || [],
      credatedBy: "",
      createdOn: ""
    };
    console.log(newNode)

    ZoneService.createZone(newNode)
      .then((res) => {
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Zone Created",
          life: 3000,
        });

        setSelectedNodeKey([]);
        setCreateZone({} as ZoneInterface)
        setSelectedKeys([]);
        setAddDia(false);
        getZone();
        setSelectedKeysName([])
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
      });
  };

  const editItem = (key: string) => {
    let updateNode: any = {};
    FacilityStructureService.nodeInfo(key)
      .then((responseStructure) => {
        if (labels.length > 0) {
          updateNode = {
            ...createZone,
            isActive: isActive,
            description: "",
            labels: [labels[0]],
            formTypeId: formTypeId,
          };
        } else {
          updateNode = {
            ...createZone,
            isActive: isActive,
            description: "",
            formTypeId: formTypeId,
          };
        }

        FacilityStructureService.update(responseStructure.data.id, updateNode)
          .then((res) => {
            toast.current.show({
              severity: "success",
              summary: "Successful",
              detail: "Structure Updated",
              life: 3000,
            });
            getZone();
          })
          .catch((err) => {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: err.response ? err.response.data.message : err.message,
              life: 2000,
            });
          });
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
      });
    setName("");
    // setTag([]);
    setFormTypeId(undefined);
    setLabels([]);
    setEditDia(false);
  };

  const onChange = (e: any) => {
    try {

      setCreateZone(prev => ({
        ...prev,
        [e.target?.name]: e.target.value
      }))
    } catch (e) {
      alert(e);
    }
  }

  const deleteItem = (key: string) => {
    ZoneService.remove(key)
      .then(() => {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Zone Deleted",
          life: 2000,
        });
        getZone();
        setSelectedNodeKey([]);
        setSelectedKeys([]);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
      });
  };

  const findKeyName = (data: any) => {
    setSelectedKeysName([]);

    if (data.length > 0) {
      data.map((key: any) => {
        FacilityStructureService.nodeInfo(key).then((res) => {
          setSelectedKeysName((prev) => [...prev, res.data.properties.name]);
        });
      });
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
          label="Cancel"
          icon="pi pi-times"
          onClick={() => {
            setAddDia(false);
            // setName("");
            // setFormTypeId(undefined);
            // setCreateZone({} as ZoneInterface)
            // setLabels([]);
            // setTag([]);

            setSelectedFacilityType(undefined);

            reset({}) // reset form values after canceling the create zone operation
          }}
          className="p-button-text"
        />
        <Button
          label="Add"
          icon="pi pi-check"
          // onClick={() => addItem()}
          onClick={() => handleSubmit(addItem)()}
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
            // setName("");
            // setTag([]);
            setLabels([]);
            setFormTypeId(undefined);

            setSelectedFacilityType(undefined);
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

      {/* {
        (() => {
          if(selectedFacilityType==="Building")
          return(
            <ContextMenu id={"001" } model={menuBuilding} ref={cm} />
          )
        })()
     } */}
      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message="Do you want to delete?"
        header="Delete Confirmation"
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
        header="Add New Item"
        visible={addDia}
        style={{ width: "40vw" }}
        footer={renderFooterAdd}
        onHide={() => {
          // setName("");
          // setTag([]);
          setFormTypeId(undefined);
          setLabels([]);
          // setCreateZone({} as ZoneInterface)
          setAddDia(false);
          setCreateZone({} as ZoneInterface);

          setSelectedFacilityType(undefined);
          reset({ ...createZone })
        }}
      >
        <form>

          <div className="field">
            <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
            <InputText
              autoComplete="off"
              {...register("name")}
              style={{ width: '100%' }}
            />
          </div>
          <p style={{ color: "red" }}>{errors.name?.message}</p>


          {/* Type Ayarlanamalı */}
          <div className="field">
            <h5 style={{ marginBottom: "0.5em" }}>Category</h5>
            <Controller
              defaultValue={createZone?.category}
              name="category"
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
          </div>


          <div className="field">
            <h5 style={{ marginBottom: "0.5em" }}>Code</h5>
            <InputText
              autoComplete="off"
              {...register("code")}
              style={{ width: '100%' }}
              defaultValue={createZone?.code || ""}
            />
          </div>
          <p style={{ color: "red" }}>{errors.code?.message}</p>


          <div className="field">
            <h5 style={{ marginBottom: "0.5em" }}>Description</h5>
            <InputText
              autoComplete="off"
              {...register("description")}
              style={{ width: '100%' }}
              defaultValue={createZone?.description || ""}
            />
          </div>


          <div className="field structureChips">
            <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
            <Controller

              defaultValue={formData?.tags || []}
              name="tags"
              control={control}
              render={({ field }) => (
                <Chips
                  value={field.value}
                  onChange={(e) => {
                    field.onChange({ target: { name: "tags", value: e.value } })
                  }}
                  style={{ width: "100%" }}
                />
              )}
            />

          </div>


          <div className="field">
            <h5 style={{ marginBottom: "0.5em" }}>External System</h5>
            <InputText
              autoComplete="off"
              {...register("externalSystem")}
              style={{ width: '100%' }}
              defaultValue={formData?.externalSystem || ""}
            />
          </div>


          <div className="field">
            <h5 style={{ marginBottom: "0.5em" }}>External Object</h5>
            <InputText
              autoComplete="off"
              {...register("externalObject")}
              style={{ width: '100%' }}
              defaultValue={formData?.externalObject || ""}
            />
          </div>

        </form>
      </Dialog>

      <Dialog
        header="Edit Item"
        visible={editDia}
        style={{ width: "40vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          // setName("");
          // setTag([]);
          setFormTypeId(undefined);
          setLabels([]);
          setEditDia(false);

          setSelectedFacilityType(undefined);
        }}
      ></Dialog>

      <Dialog
        // header="Form"
        visible={formDia}
        style={{ width: "40vw" }}
        // footer={renderFooterForm}
        onHide={() => {
          setFormDia(false);
        }}
      >
        <FormGenerate
          nodeKey={generateNodeKey}
          formKey={generateFormTypeKey}
          nodeName={generateNodeName}
          setFormDia={setFormDia}
        />
      </Dialog>
      <h3>Zone</h3>
      <div>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
          Selected Spaces:
        </span>
        <span
          style={{ fontWeight: "bold", fontSize: "14px", color: "red" }}
        >{` ${selectedKeysName.toString().replaceAll(",", ", ")} `}</span>

        {selectedKeys.length > 1 && (
          <div className="mt-4">
            <Button
              label="Create a Zone"
              icon="pi pi-check"
              className="ml-2"
              onClick={() => {
                setAddDia(true)
                // setCreateZone({} as ZoneInterface)
              }}
            />
          </div>
        )}
      </div>
      <div className="field mt-4">
        <Tree
          onContextMenu={(event: any) => {
            setSelectedFacilityType(event.node.nodeType);
            cm.current.show(event.originalEvent);
          }}
          loading={loading}
          value={data}
          dragdropScope="-"
          filter
          filterBy="name,code"
          filterPlaceholder="Search"
          selectionMode="checkbox"
          onSelect={(e: any) => {
            setSelectedKeysName(prev => ([...prev, e.node.name]))

          }}
          onUnselect={(e: any) => {
            setSelectedKeysName(prev => prev.filter(item => item !== e.node.name))

          }}
          onSelectionChange={(event: any) => {
            console.log(event);

            setSelectedNodeKey(event.value);
            setSelectedKeys(Object.keys(event.value));
            // findKeyName(Object.keys(event.value));
            // selectedKeys?.map((key) =>{findKeyName(key)});
          }}
          selectionKeys={selectedNodeKey}
          propagateSelectionUp={false}
          className="font-bold"
          nodeTemplate={(data: Node, options) => (
            <span className="flex align-items-center font-bold">
              {data.label}{" "}
              {
                <>
                  <span className="ml-4 ">
                    {data.nodeType === "Zone" ? (
                      <Button
                        icon="pi pi-trash"
                        className="p-button-rounded p-button-secondary p-button-text"
                        aria-label="Delete"
                        onClick={() => {
                          setDeleteNodeKey(data.key);
                          setDelDia(true);
                        }}
                        title="Delete Item"
                      />
                    ) : null}
                  </span>
                  <span>
                    {data.nodeType === "Zone" ? (
                      <Button
                        icon="pi pi-eye"
                        className="p-button-rounded p-button-secondary p-button-text"
                        aria-label="Display"
                        onClick={() => {
                          setDisplay(true);
                          setDisplayKey(data.key);
                        }}
                        title={t("Display")}
                      />
                    ) : null}
                  </span>
                </>
              }
            </span>
          )}
        />
      </div>
    </div>
  );
};

export default SetZone;
