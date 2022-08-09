import React, { useEffect, useState } from "react";
import { Tree, TreeSelectionKeys } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { Chips } from 'primereact/chips';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from 'primereact/checkbox';
import { TreeSelect } from "primereact/treeselect";
import { Dropdown } from 'primereact/dropdown';
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import FacilityStructureService from "../../services/facilitystructure";
import FormTypeService from "../../services/formType";
import StructureWinformService from "../../services/structureWinform";
import { useAppSelector } from "../../app/hook";

import axios from "axios";
import FormGenerate from "../FormGenerate/FormGenerate";

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
  NodeType?: string;
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

const SpaceJoin = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>([]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Node[]>([]);
  const [name, setName] = useState("");
  const [formTypeId, setFormTypeId] = useState<any>(undefined);
  const [labels, setLabels] = useState<string[]>([]);
  const [tag, setTag] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [addDia, setAddDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const [formDia, setFormDia] = useState<boolean>(false);
  const toast = React.useRef<any>(null);
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

  const facilityTypes = ["Facility", "Building", "Block", "Floor", "Room", "Open Area", "Park Area", "Garden", "Other"];

  useEffect(() => {
    FacilityStructureService.getFacilityTypes("FacilityTypes_EN", realm)
      .then((res) => {
        setFacilityType(res.data.map((item: any) => item.name))
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
      });
  }, [])

  const getForms = async () => {
    await FormTypeService.findOne('111').then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root] || []));
      const iconFormNodes = (nodes: FormNode[]) => {
        if (!nodes || nodes.length === 0) {
          return;
        }
        for (let i of nodes) {
          iconFormNodes(i.children)
          if (i.hasType === true) {
            i.icon = "pi pi-fw pi-book";
            // i.selectable = true;
          }
          // else {
          //   i.selectable = false;
          // }
        }
      };
      iconFormNodes(temp);

      setFormData(temp);
    });
  };

  useEffect(() => {
    getForms();
  }, []);

  const getNodeInfoAndEdit = (selectedNodeKey: string) => {
    FacilityStructureService.nodeInfo(selectedNodeKey)
      .then((res) => {
        console.log(res.data);
        setSelectedFacilityType(res.data.properties.NodeType);

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

  const getFacilityStructure = () => {
    FacilityStructureService.findOne(realm).then((res) => {

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
          summary: "Error",
          detail: "Facility Structure not found",
          life: 3000,
        });
        setTimeout(() => {
          navigate("/facility")
        }, 3000)
      }
    })
  }

  useEffect(() => {
    getFacilityStructure();
  }, []);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children)
      i.icon = "pi pi-fw pi-building";
      i.label = i.name || i.Name;
      if (i.NodeType === "Space") {
        i.selectable = true;
      } else {
        i.selectable = false;
      }

    }
  };

  const addItem = (key: string) => {
    let newNode: any = {};
    FacilityStructureService.nodeInfo(key)
      .then((res) => {
        console.log(res.data);
        if (labels.length > 0) {
          newNode = {
            key: uuidv4(),
            parentId: res.data.id,
            name: name,
            tag: tag,
            description: "",
            // labels: optionalLabels[0]?.replace(/ /g, '').split(",") || [],
            labels: [labels[0]],
            formTypeId: formTypeId,
          };
        } else {
          newNode = {
            key: uuidv4(),
            parentId: res.data.id,
            name: name,
            tag: tag,
            description: "",
            formTypeId: formTypeId,
            // labels: optionalLabels[0]?.replace(/ /g, '').split(",") || [],
          };
        }

        FacilityStructureService.create(newNode)
          .then((res) => {
            toast.current.show({
              severity: "success",
              summary: "Successful",
              detail: "Structure Created",
              life: 3000,
            });
            let newForm: any = {};
            newForm = {
              referenceKey: formTypeId,
            };
            StructureWinformService.createForm(res.data.properties.key, newForm)
              .then((res) => {
              })
            getFacilityStructure();
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
    setTag([]);
    setFormTypeId(undefined);
    setAddDia(false);
    setLabels([]);
  };

  const editItem = (key: string) => {
    let updateNode: any = {};
    FacilityStructureService.nodeInfo(key)
      .then((responseStructure) => {
        if (labels.length > 0) {
          updateNode = {
            name: name,
            tag: tag,
            isActive: isActive,
            description: "",
            labels: [labels[0]],
            formTypeId: formTypeId,
          };
        } else {
          updateNode = {
            name: name,
            tag: tag,
            isActive: isActive,
            description: "",
            formTypeId: formTypeId,
          }
        }
        console.log(responseStructure.data);

        StructureWinformService.findForm(key)
          .then((res) => {
            StructureWinformService.removeForm(key, responseStructure.data.properties.formTypeId)
              .then((res) => {
              })
            let newForm: any = {};
            newForm = {
              referenceKey: formTypeId,
            };
            StructureWinformService.createForm(key, newForm)
              .then((res) => {
              })
          }
          )
          .catch((err) => {
            if (err.response.status === 404) {
              let newForm: any = {};
              newForm = {
                referenceKey: formTypeId,
              };
              StructureWinformService.createForm(key, newForm)
                .then((res) => {
                })
            }
          }
          )

        FacilityStructureService.update(responseStructure.data.id, updateNode)
          .then((res) => {
            toast.current.show({
              severity: "success",
              summary: "Successful",
              detail: "Structure Updated",
              life: 3000,
            });
            getFacilityStructure();
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
    setTag([]);
    setFormTypeId(undefined);
    setLabels([]);
    setEditDia(false);
  }

  const deleteItem = (key: string) => {
    FacilityStructureService.nodeInfo(key)
      .then((res) => {
        if (res.data.properties.hasParent === false) {
          FacilityStructureService.remove(res.data.id)
            .then(() => {
              toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Structure Deleted",
                life: 2000,
              });
              navigate("/facilitystructure")
            })
            .catch((err) => {
              toast.current.show({
                severity: "error",
                summary: "Error",
                detail: err.response ? err.response.data.message : err.message,
                life: 2000,
              });
            });
        } else {
          FacilityStructureService.remove(res.data.id)
            .then(() => {
              toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Structure Deleted",
                life: 2000,
              });
              getFacilityStructure();
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

  const dragDropUpdate = (dragId: string, dropId: string) => {
    FacilityStructureService.relation(dragId, dropId)
      .then((res) => {
        showSuccess("Structure Updated");
        getFacilityStructure();
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

  const dragConfirm = (dragId: string, dropId: string) => {
    confirmDialog({
      message: 'Are you sure you want to move?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => { setLoading(true); dragDropUpdate(dragId, dropId) },
      reject: () => { setLoading(true); getFacilityStructure() }
    });
  }

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
            setName("");
            setFormTypeId(undefined);
            setLabels([]);
            setTag([]);

            setSelectedFacilityType(undefined);
          }}
          className="p-button-text"
        />
        <Button
          label="Add"
          icon="pi pi-check"
          onClick={() => setSubmitted(true)}
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
            setName("");
            setTag([]);
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
      <Toast ref={toast} position="top-right" />
      <ContextMenu model={menu} ref={cm} />
      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message="Do you want to delete?"
        header="Delete Confirmation"
        icon="pi pi-exclamation-triangle"
      // accept={() => deleteItem(selectedNodeKey)}
      />
      <Dialog
        header="Add New Item"
        visible={addDia}
        style={{ width: "40vw" }}
        footer={renderFooterAdd}
        onHide={() => {
          setName("");
          setTag([]);
          setFormTypeId(undefined);
          setLabels([]);
          setAddDia(false);

          setSelectedFacilityType(undefined);
        }}
      >
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Facility Type</h5>
          <Dropdown
            value={selectedFacilityType}
            options={facilityType}
            onChange={(event) => setSelectedFacilityType(event.value)}
            style={{ width: '100%' }}
          />
        </div>


        {/* <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
          <InputText
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Facility Type</h5>
          <TreeSelect
            value={formTypeId}
            options={formData}
            onChange={(e) => {
              setFormTypeId(e.value);
              console.log(e);
              let nodeKey: any = e.value;
              FormTypeService.nodeInfo(nodeKey)
                .then((res) => {
                  console.log(res.data);
                  setLabels([res.data.properties.name])
                })
                .catch((err) => {
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: err.response ? err.response.data.message : err.message,
                    life: 2000,
                  });
                });
            }}
            filter
            placeholder="Select Type"
            style={{ width: '100%' }}
          />
        </div>
        <div className="field structureChips">
          <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
          <Chips value={tag} onChange={(e) => setTag(e.value)} style={{ width: "100%" }} />
        </div> */}
      </Dialog>
      <Dialog
        header="Edit Item"
        visible={editDia}
        style={{ width: "40vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          setName("");
          setTag([]);
          setFormTypeId(undefined);
          setLabels([]);
          setEditDia(false);

          setSelectedFacilityType(undefined);
        }}
      >

        {/* <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
          <InputText
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Facility Type</h5>
          <TreeSelect
            value={formTypeId}
            options={formData}
            onChange={(e) => {
              setFormTypeId(e.value);
              let nodeKey: any = e.value;
              FormTypeService.nodeInfo(nodeKey)
                .then((res) => {
                  console.log(res.data);
                  setLabels([res.data.properties.name])
                })
                .catch((err) => {
                  toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: err.response ? err.response.data.message : err.message,
                    life: 2000,
                  });
                });
            }}
            filter
            placeholder="Select Type"
            style={{ width: '100%' }}
          />
        </div>
        <div className="field structureChips">
          <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
          <Chips value={tag} onChange={(e) => setTag(e.value)} style={{ width: '100%' }} />
        </div>
        <div className="field flex">
          <h5 style={{ marginBottom: "0.5em" }}>Is Active</h5>
          <Checkbox className="ml-3" onChange={e => setIsActive(e.checked)} checked={isActive}></Checkbox>
        </div> */}
      </Dialog>

      <Dialog
        // header="Form"
        visible={formDia}
        style={{ width: "40vw" }}
        // footer={renderFooterForm}
        onHide={() => {

          setFormDia(false);
        }}
      >
        <FormGenerate nodeKey={generateNodeKey} formKey={generateFormTypeKey} nodeName={generateNodeName} setFormDia={setFormDia} />

      </Dialog>
      <h1>Space Join</h1>
      <div className="field">
        <Tree
          loading={loading}
          value={data}
          dragdropScope="-"
          onDragDrop={(event: any) => {
            console.log(event);
            if (event.value.length > 1) {
              toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "You can't drag here.",
                life: 1000,
              });
              return
            }
            dragConfirm(event.dragNode._id.low, event.dropNode._id.low)
          }}
          filter
          filterBy="name,code"
          filterPlaceholder="Search"
          selectionMode="checkbox"
          onSelectionChange={(event: any) => {
            setSelectedNodeKey(event.value);
            setSelectedKeys(Object.keys(event.value));
          }
          }
          selectionKeys={selectedNodeKey}
          propagateSelectionUp={false}
          className="font-bold"
        />
      </div>

      {/* <Button
          label="Click"
          onClick={() => console.log(selectedKeys)}
          autoFocus
        /> */}
    </div>
  );
};

export default SpaceJoin;