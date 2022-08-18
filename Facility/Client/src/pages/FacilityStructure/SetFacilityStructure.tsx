import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { Chips } from "primereact/chips";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from "primereact/checkbox";
import { TreeSelect } from "primereact/treeselect";
import { Dropdown } from "primereact/dropdown";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import FacilityStructureService from "../../services/facilitystructure";
import ClassificationsService from "../../services/classifications";
import FormTypeService from "../../services/formType";
import StructureWinformService from "../../services/structureWinform";
import { useAppSelector } from "../../app/hook";
import FormGenerate from "../FormGenerate/FormGenerate";
import BuildingForm from "./Forms/BuildingForm";
import BlockForm from "./Forms/BlockForm";
import FloorForm from "./Forms/FloorForm";
import SpaceForm from "./Forms/SpaceForm";
import DisplayNode from "./Display/DisplayNode";
import FloorFileImport from "./ImportPages/FloorFileImport";
import BlockFileImport from "./ImportPages/BlockFileImport";
import SpaceFileImport from "./ImportPages/SpaceFileImport";

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
  code?: string;
  nodeType?: string;
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

const SetFacilityStructure = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>("");
  const [selectedNode, setSelectedNode] = useState<Node>({} as Node);
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
  const [blockImportDia, setBlockImportDia] = useState<boolean>(false);
  const [floorImportDia, setFloorImportDia] = useState<boolean>(false);
  const [spaceImportDia, setSpaceImportDia] = useState<boolean>(false);
  const cm: any = React.useRef(null);
  const navigate = useNavigate();
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
  const [docTypes, setDocTypes] = React.useState([]);
  const { toast } = useAppSelector((state) => state.toast);

  useEffect(() => {
    FacilityStructureService.getFacilityTypes("FacilityTypes_EN", realm)
      .then((res) => {
        setFacilityType(res.data.map((item: any) => item.name));
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
      });
    ClassificationsService.findAllActiveByLabel({
      realm: auth.auth.realm,
      label: "FacilityDocTypes",
      language: "en",
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodes(temp);
      temp[0].selectable = false;
      setDocTypes(temp);
    });
  }, []);

  const getForms = async () => {
    await FormTypeService.findOne("111").then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root] || []));
      const iconFormNodes = (nodes: FormNode[]) => {
        if (!nodes || nodes.length === 0) {
          return;
        }
        for (let i of nodes) {
          iconFormNodes(i.children);
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
        setSelectedFacilityType(res.data.properties.nodeType);
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

  const importFloor = () => {
    setFloorImportDia(true);
  }
  const importBlock = () => {
    setBlockImportDia(true);
  }
  const importSpace = () => {
    setSpaceImportDia(true);
  }

  const importInfoOfNode = {
    Building: [
      {
        label: "Import Block",
        icon: "pi pi-fw pi-upload",
        command: () => {
          importBlock()
        },
      },
      {
        label: "Import Floor",
        icon: "pi pi-fw pi-upload",
        command: () => {
          importFloor()
        },
      },
    ],
    Floor: [
      {
        label: "Import Space",
        icon: "pi pi-fw pi-upload",
        command: () => {
          importSpace()
        },
      },
    ],
    Block: [
      {
        label: "Import Floor",
        icon: "pi pi-fw pi-upload",
        command: () => {
          importFloor()
        },
      },
      {
        label: "Import Space",
        icon: "pi pi-fw pi-upload",
        command: () => {
          importSpace()
        },
      },
    ],
  };

  const [menu, setMenu] = useState([
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
        getNodeInfoAndEdit(selectedNodeKey);
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
    {
      label: "Display",
      icon: "pi pi-eye",
      command: () => {
        setDisplay(true);
        setDisplayKey(selectedNodeKey);
      },
    },
  ]);

  // React.useEffect(() => {
  //   setMenu(prev=>{
  //     prev.length = 4;
  //     if (selectedNode.nodeType === "Building") {
  //       for (let item of importInfoOfNode["Building"]) {
  //         prev.push(item);
  //       }
  //     } else if (selectedNode.nodeType === "Floor") {
  //       for (let item of importInfoOfNode["Floor"]) {
  //         prev.push(item);
  //       }
  //     }
  //     return prev
  //   })

  // }, [selectedNode.nodeType]);

  const getFacilityStructure = () => {
    FacilityStructureService.findOne(realm)
      .then((res) => {
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
            detail: "Facility Structure not found",
            life: 4000,
          });
          setTimeout(() => {
            navigate("/facility");
          }, 3000);
        }
      });
  };

  useEffect(() => {
    getFacilityStructure();
  }, []);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.icon = "pi pi-fw pi-building";
      i.label = i.name;
    }
  };

  const deleteItem = (key: string) => {
    FacilityStructureService.nodeInfo(key)
      .then((res) => {
        FacilityStructureService.remove(res.data.id)
          .then(() => {
            toast.current.show({
              severity: "success",
              summary: "Success",
              detail: "Structure Deleted",
              life: 4000,
            });
            getFacilityStructure();
          })
          .catch((err) => {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: err.response ? err.response.data.message : err.message,
              life: 4000,
            });
          });
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
          life: 4000,
        });
      });
  };

  const dragConfirm = (dragId: string, dropId: string) => {
    confirmDialog({
      message: "Are you sure you want to move?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        setLoading(true);
        dragDropUpdate(dragId, dropId);
      },
      reject: () => {
        setLoading(true);
        getFacilityStructure();
      },
    });
  };

  const showSuccess = (detail: string) => {
    toast.current.show({
      severity: "success",
      summary: "Success Message",
      detail: detail,
      life: 4000,
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
            // setFormTypeId(undefined);
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
            // setFormTypeId(undefined);
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
      <ContextMenu model={menu} ref={cm} />
      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message="Do you want to delete?"
        header="Delete Confirmation"
        icon="pi pi-exclamation-triangle"
        accept={() => deleteItem(selectedNodeKey)}
      />
      <Dialog
        header="Add New Item"
        visible={addDia}
        style={{ width: "40vw" }}
        footer={renderFooterAdd}
        onHide={() => {
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
            style={{ width: "100%" }}
          />
        </div>
        {selectedFacilityType === "Building" ? (
          <BuildingForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}
        {selectedFacilityType === "Block" ? (
          <BlockForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}
        {selectedFacilityType === "Floor" ? (
          <FloorForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}
        {selectedFacilityType === "Space" ? (
          <SpaceForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}

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
          setEditDia(false);
          setSelectedFacilityType(undefined);
        }}
      >
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Facility Type</h5>
          <Dropdown
            value={selectedFacilityType}
            options={[selectedFacilityType]}
            disabled
            style={{ width: "100%" }}
          />
        </div>
        {selectedFacilityType === "Building" ? (
          <BuildingForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}
        {selectedFacilityType === "Block" ? (
          <BlockForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}
        {selectedFacilityType === "Floor" ? (
          <FloorForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}
        {selectedFacilityType === "Space" ? (
          <SpaceForm
            selectedFacilityType={selectedFacilityType}
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            editDia={editDia}
            getFacilityStructure={getFacilityStructure}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            setSelectedFacilityType={setSelectedFacilityType}
          />
        ) : null}
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
        <FormGenerate
          nodeKey={generateNodeKey}
          formKey={generateFormTypeKey}
          nodeName={generateNodeName}
          setFormDia={setFormDia}
        />
      </Dialog>
      <Dialog
        header="Block Import"
        visible={blockImportDia}
        style={{ width: "25vw" }}
        // footer={renderFooterForm}
        onHide={() => {
          setBlockImportDia(false);
        }}
      >
        <BlockFileImport selectedNodeKey={selectedNodeKey} />
      </Dialog>
      <Dialog
        header="Floor Import"
        visible={floorImportDia}
        style={{ width: "25vw" }}
        // footer={renderFooterForm}
        onHide={() => {
          setFloorImportDia(false);
        }}
      >
        <FloorFileImport selectedNodeKey={selectedNodeKey}/>
      </Dialog>
      <Dialog
        header="Space Import"
        visible={spaceImportDia}
        style={{ width: "25vw" }}
        // footer={renderFooterForm}
        onHide={() => {
          setSpaceImportDia(false);
        }}
      >
        <SpaceFileImport selectedNodeKey={selectedNodeKey}/>
      </Dialog>
      <Dialog
        header="Structure Detail"
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
        <DisplayNode displayKey={displayKey} docTypes={docTypes} />
      </Dialog>
      <h1>Edit Facility Structure</h1>
      <div className="field">
        <Tree
          loading={loading}
          value={data}
          dragdropScope="-"
          contextMenuSelectionKey={selectedNodeKey ? selectedNodeKey : ""}
          onContextMenuSelectionChange={(event: any) =>
            setSelectedNodeKey(event.value)
          }
          onContextMenu={(event: any) => {
            setSelectedNode(event.node as Node);
            setMenu(prev => {
              prev.length = 4;
              if (event.node.nodeType === "Building") {
                for (let item of importInfoOfNode["Building"]) {
                  prev.push(item);
                }
              } else if (event.node.nodeType === "Floor") {
                for (let item of importInfoOfNode["Floor"]) {
                  prev.push(item);
                }
              }
              else if (event.node.nodeType === "Block") {
                for (let item of importInfoOfNode["Block"]) {
                  prev.push(item);
                }
              }
              return prev
            })
            cm.current.show(event.originalEvent);
          }}
          onDragDrop={(event: any) => {
            console.log(event);
            if (event.value.length > 1) {
              toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "You can't drag here.",
                life: 2000,
              });
              return;
            }
            dragConfirm(event.dragNode._id.low, event.dropNode._id.low);
          }}
          filter
          filterBy="label,name,description,tag"
          filterPlaceholder="Search"
          filterMode="strict"
          nodeTemplate={(data: Node, options) => (
            <span className="flex align-items-center font-bold">
              {data.code ? data.code + " / " : ""}
              {data.label}{" "}
              {
                <>
                  <span className="ml-4 ">
                    <Button
                      icon="pi pi-plus"
                      className="p-button-rounded p-button-secondary p-button-text"
                      aria-label="Add Item"
                      onClick={() => {
                        setSelectedNodeKey(data.key);
                        setAddDia(true);
                      }}
                      title="Add Item"
                    />
                    <Button
                      icon="pi pi-pencil"
                      className="p-button-rounded p-button-secondary p-button-text"
                      aria-label="Edit Item"
                      onClick={() => {
                        setSelectedNodeKey(data.key);
                        let dataKey: any = data.key;
                        setIsUpdate(true);
                        getNodeInfoAndEdit(dataKey);
                        setEditDia(true);
                      }}
                      title="Edit Item"
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-secondary p-button-text"
                      aria-label="Delete"
                      onClick={() => {
                        setSelectedNodeKey(data.key);
                        setDelDia(true);
                      }}
                      title="Delete Item"
                    />
                    {/* {
                  data.hasType &&  */}
                    <Button
                      icon="pi pi-book"
                      className="p-button-rounded p-button-secondary p-button-text"
                      aria-label="Edit Form"
                      // onClick={(e) => navigate(`/formgenerate/${data.key}?id=${data._id.low}`,
                      // {
                      //   state: {
                      //     data: data,
                      //     rootId: structure.root._id.low,
                      //   }
                      // }
                      // )}
                      // onClick={() => window.open(`http://localhost:3001/formgenerate/${data._id.low}?formType=${data.labels}?className=${data.className}`, '_blank')}
                      // onClick={(e) => navigate(`/formgenerate/${data._id.low}?typeKey=${data.formTypeId}`)}
                      onClick={() => {
                        console.log(data);
                        setGenerateNodeKey(data.key);
                        setGenerateFormTypeKey(data.formTypeId);
                        setGenerateNodeName(data.label);
                        setFormDia(true);
                      }}
                      title="Edit Form"
                    />
                    <Button
                      icon="pi pi-eye"
                      className="p-button-rounded p-button-secondary p-button-text"
                      aria-label="Display Item"
                      onClick={() => {
                        setSelectedNodeKey(data.key);
                        setDisplay(true);
                        setDisplayKey(data.key);
                      }}
                      title="View Data"
                    />
                    {/* <Button
                  icon="pi pi-book" className="p-button-rounded p-button-secondary p-button-text" aria-label="Edit Form"
                  // onClick={(e) => navigate(`/formgenerate/${data.key}?id=${data._id.low}`, 
                  // {
                  //   state: {
                  //     data: data,
                  //     rootId: structure.root._id.low,
                  //   }
                  // }
                  // )} 
                  onClick={(e) => console.log(data)}

                  title="Edit Form"
                /> */}
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

export default SetFacilityStructure;
