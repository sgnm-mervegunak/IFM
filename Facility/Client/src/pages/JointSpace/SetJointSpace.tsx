import React, { useEffect, useState } from "react";
import { Tree, TreeSelectionKeys } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { Chips } from 'primereact/chips';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from 'primereact/checkbox';
import { TreeSelect } from "primereact/treeselect";
import { Calendar } from "primereact/calendar";
import { Dropdown } from 'primereact/dropdown';
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import FacilityStructureService from "../../services/facilitystructure";
import ClassificationsService from "../../services/classifications";
import FormTypeService from "../../services/formType";
import StructureWinformService from "../../services/structureWinform";
import JointSpaceService from "../../services/jointSpace";
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

const SetJointSpace = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedKeysName, setSelectedKeysName] = useState<string[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>([]);
  const [deleteNodeKey, setDeleteNodeKey] = useState<any>("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Node[]>([]);
  const [ArchitecturalName, setArchitecturalName] = useState<string>("");
  const [ArchitecturalCode, setArchitecturalCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [tag, setTag] = useState<string[]>([]);
  const [m2, setM2] = useState<string>("");
  const [spaceType, setSpaceType] = useState<any>(undefined);
  const [status, setStatus] = useState<any>(undefined);
  const [jointStartDate, setJointStartDate] = useState<any>(undefined);
  const [jointEndDate, setJointEndDate] = useState<any>(undefined);
  const [nodeKeys, setNodeKeys] = useState<string[]>([]);
  const [classificationSpace, setClassificationSpace] = useState<Node[]>([]);
  const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
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
    await ClassificationsService.findAllActiveByLabel({ realm: realm, label: "OmniClass13", language: "en" }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodesClassification(temp);
      setClassificationSpace(temp);
    });
  };

  const getClassificationStatus = async () => {
    await ClassificationsService.findAllActiveByLabel({ realm: realm, label: "FacilityStatus", language: "en" }).then((res) => {
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
    JointSpaceService.findBuildingWithKey(key, realm).then((res) => {

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

  const addItem = () => {
    let newNode: any = {};

    newNode = {
      ArchitecturalName: ArchitecturalName,
      ArchitecturalCode: ArchitecturalCode,
      name: name,  //selectedKeysName.toString().replaceAll(",", "-"),
      code: code,
      tag: tag,
      m2: m2,
      spaceType: spaceType,
      status: status,
      jointStartDate: jointStartDate,
      jointEndDate: jointEndDate,
      nodeKeys: selectedKeys
    };
    console.log(newNode);


    JointSpaceService.createJointSpace(newNode)
      .then((res) => {
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Joint Space Created",
          life: 3000,
        });

        getJointSpace();
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

    setArchitecturalName("");
    setArchitecturalCode("");
    setName("");
    setCode("");
    setTag([]);
    setM2("");
    setSpaceType(undefined);
    setStatus(undefined);
    setJointStartDate("");
    setJointEndDate("");
    setAddDia(false);
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

        FacilityStructureService.update(responseStructure.data.id, updateNode)
          .then((res) => {
            toast.current.show({
              severity: "success",
              summary: "Successful",
              detail: "Structure Updated",
              life: 3000,
            });
            getJointSpace();
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
    JointSpaceService.remove(key)
      .then(() => {
        toast.current.show({
          severity: "success",
          summary: "Success",
          detail: "Joint Space Deleted",
          life: 2000,
        });
        getJointSpace();
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
      <ContextMenu model={menu} ref={cm} />
      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message="Do you want to delete?"
        header="Delete Confirmation"
        icon="pi pi-exclamation-triangle"
        accept={() => deleteItem(deleteNodeKey)}
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
          <h5 style={{ marginBottom: "0.5em" }}>ArchitecturalName</h5>
          <InputText
            value={ArchitecturalName}
            onChange={(event) => setArchitecturalName(event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>ArchitecturalCode</h5>
          <InputText
            value={ArchitecturalCode}
            onChange={(event) => setArchitecturalCode(event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
          <InputText
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Code</h5>
          <InputText
            value={code}
            onChange={(event) => setCode(event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field structureChips">
          <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
          <Chips
            value={tag}
            onChange={(e) => setTag(e.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>M2</h5>
          <InputText
            value={m2}
            onChange={(event) => setM2(event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Space Type</h5>
          <TreeSelect
            value={spaceType}
            options={classificationSpace}
            onChange={(e) => {
              setSpaceType(e.value);
            }}
            filter
            placeholder="Select Type"
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Status</h5>
          <TreeSelect
            value={status}
            options={classificationStatus}
            onChange={(e) => {
              setStatus(e.value);
            }}
            filter
            placeholder="Select Type"
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Joint Start Date</h5>
          <Calendar
            dateFormat="dd/mm/yy"
            value={jointStartDate}
            onChange={(e) => setJointStartDate(e.value?.toString())}
            showIcon
            style={{ width: '100%' }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Joint End Date</h5>
          <Calendar
            dateFormat="dd/mm/yy"
            value={jointEndDate}
            onChange={(e) => setJointEndDate(e.value?.toString())}
            showIcon
            style={{ width: '100%' }}
          />
        </div>
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
      <h3>Joint Space</h3>
      <div>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>Selected Spaces:</span>
        <span style={{ fontWeight: "bold", fontSize: "14px", color: "red" }}>{` ${selectedKeysName.toString().replaceAll(",", ", ")} `}</span>
        
        {selectedKeys.length > 1 &&
          <div className="mt-4">

            <Button label="Join" icon="pi pi-check" className="ml-2" onClick={() => setAddDia(true)} />

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
          filterPlaceholder="Search"
          selectionMode="checkbox"
          onSelectionChange={(event: any) => {

            console.log(event);

            setSelectedNodeKey(event.value);
            setSelectedKeys(Object.keys(event.value));
            findKeyName(Object.keys(event.value));
            // selectedKeys?.map((key) =>{findKeyName(key)});
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
                    title="Delete Item"
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