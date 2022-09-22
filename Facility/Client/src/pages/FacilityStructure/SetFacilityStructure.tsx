import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { Toolbar } from "primereact/toolbar";
import { Dropdown } from "primereact/dropdown";
import { useParams, useNavigate, useLocation, useSearchParams, } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
import BuildingFileImport from "./ImportPages/BuildingFileImport";
import FloorFileImport from "./ImportPages/FloorFileImport";
import BlockFileImport from "./ImportPages/BlockFileImport";
import SpaceFileImport from "./ImportPages/SpaceFileImport";
import Export, { ExportType } from "./Export/Export";
import AddPlan from "./Plan/AddPlan";

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
  hasPlan?: boolean;
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
  const [formTypeId, setFormTypeId] = useState<any>(undefined);
  const [labels, setLabels] = useState<string[]>([]);
  const [canDelete, setCanDelete] = useState<boolean>(true);
  const [addDia, setAddDia] = useState(false);
  const [exportDia, setExportDia] = useState(false);
  const [planDia, setPlanDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const [formDia, setFormDia] = useState<boolean>(false);
  const [buildingImportDia, setBuildingImportDia] = useState<boolean>(false);
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
  const [facilityType, setFacilityType] = useState<{ name: string; code: string }[]>([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState<string | undefined>("");
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [display, setDisplay] = useState(false);
  const [displayKey, setDisplayKey] = useState("");
  const [docTypes, setDocTypes] = React.useState([]);
  const [search, setSearch] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useAppSelector((state) => state.toast);
  const { t } = useTranslation(["common"]);
  const language = useAppSelector((state) => state.language.language);

  useEffect(() => {
    FacilityStructureService.getFacilityTypes("FacilityTypes")
      .then((res) => {
        setFacilityType(
          res.data.map((item: any) => ({
            name: t(item.name),
            code: item.name,
          }))
        );
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
      label: "FacilityDocTypes",
    }).then((res) => {
      let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
      fixNodes(temp);
      temp[0].selectable = false;
      setDocTypes(temp);
    });
  }, [language]);

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
    // getForms();
  }, []);

  useEffect(() => {
    if (searchParams.get("search")) {
      setSearch(searchParams.get("search") as string);
    }
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

  const importBuilding = () => {
    setBuildingImportDia(true);
  };
  const importFloor = () => {
    setFloorImportDia(true);
  };
  const importBlock = () => {
    setBlockImportDia(true);
  };
  const importSpace = () => {
    setSpaceImportDia(true);
  };

  const menu = [
    {
      label: t("Add Item"),
      icon: "pi pi-plus",
      command: () => {
        setSelectedFacilityType(undefined);
        setAddDia(true);
      },
    },
    {
      label: t("Edit Item"),
      icon: "pi pi-pencil",
      command: () => {
        let key = selectedNodeKey;
        console.log(key);
        console.log("test");

        setIsUpdate(true);
        getNodeInfoAndEdit(selectedNodeKey);
        setEditDia(true);
      },
    },
    {
      label: t("Delete"),
      icon: "pi pi-trash",
      command: () => {
        setDelDia(true);
      },
    },
    {
      label: t("View Data"),
      icon: "pi pi-eye",
      command: () => {
        setDisplay(true);
        setDisplayKey(selectedNodeKey);
      },
    },
  ];

  const menuRoot = [
    {
      label: t("Add Item"),
      icon: "pi pi-plus",
      command: () => {
        setSelectedFacilityType(undefined);
        setAddDia(true);
      },
    },
    {
      label: t("Edit Item"),
      icon: "pi pi-pencil",
      command: () => {
        let key = selectedNodeKey;
        console.log(key);
        console.log("test");

        setIsUpdate(true);
        getNodeInfoAndEdit(selectedNodeKey);
        setEditDia(true);
      },
    },
    {
      label: t("Delete"),
      icon: "pi pi-trash",
      command: () => {
        setDelDia(true);
      },
    },
    {
      label: t("View Data"),
      icon: "pi pi-eye",
      command: () => {
        setDisplay(true);
        setDisplayKey(selectedNodeKey);
      },
    },
    {
      label: t("Import Building"),
      icon: "pi pi-fw pi-upload",
      command: () => {
        importBuilding();
      },
    },
  ];

  const menuBuilding = [
    {
      label: t("Add Item"),
      icon: "pi pi-plus",
      command: () => {
        setSelectedFacilityType(undefined);
        setAddDia(true);
      },
    },
    {
      label: t("Edit Item"),
      icon: "pi pi-pencil",
      command: () => {
        let key = selectedNodeKey;
        console.log(key);
        console.log("test");

        setIsUpdate(true);
        getNodeInfoAndEdit(selectedNodeKey);
        setEditDia(true);
      },
    },
    {
      label: t("Delete"),
      icon: "pi pi-trash",
      command: () => {
        setDelDia(true);
      },
    },
    {
      label: t("View Data"),
      icon: "pi pi-eye",
      command: () => {
        setDisplay(true);
        setDisplayKey(selectedNodeKey);
      },
    },
    {
      label: t("Import Floor"),
      icon: "pi pi-fw pi-upload",
      command: () => {
        importFloor();
      },
    },
    {
      label: t("Import Space"),
      icon: "pi pi-fw pi-upload",
      command: () => {
        importSpace();
      },
    },
  ];

  const menuBlock = [
    {
      label: t("Add Item"),
      icon: "pi pi-plus",
      command: () => {
        setSelectedFacilityType(undefined);
        setAddDia(true);
      },
    },
    {
      label: t("Edit Item"),
      icon: "pi pi-pencil",
      command: () => {
        let key = selectedNodeKey;
        console.log(key);
        console.log("test");

        setIsUpdate(true);
        getNodeInfoAndEdit(selectedNodeKey);
        setEditDia(true);
      },
    },
    {
      label: t("Delete"),
      icon: "pi pi-trash",
      command: () => {
        setDelDia(true);
      },
    },
    {
      label: t("View Data"),
      icon: "pi pi-eye",
      command: () => {
        setDisplay(true);
        setDisplayKey(selectedNodeKey);
      },
    },
    {
      label: t("Import Floor"),
      icon: "pi pi-fw pi-upload",
      command: () => {
        importFloor();
      },
    },
  ];

  const menuFloor = [
    {
      label: t("Add Item"),
      icon: "pi pi-plus",
      command: () => {
        setSelectedFacilityType(undefined);
        setAddDia(true);
      },
    },
    {
      label: t("Edit Item"),
      icon: "pi pi-pencil",
      command: () => {
        let key = selectedNodeKey;
        console.log(key);
        console.log("test");

        setIsUpdate(true);
        getNodeInfoAndEdit(selectedNodeKey);
        setEditDia(true);
      },
    },
    {
      label: t("Delete"),
      icon: "pi pi-trash",
      command: () => {
        setDelDia(true);
      },
    },
    {
      label: t("View Data"),
      icon: "pi pi-eye",
      command: () => {
        setDisplay(true);
        setDisplayKey(selectedNodeKey);
      },
    },
  ];

  const getFacilityStructure = () => {
    FacilityStructureService.findAll()
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
        if (err.response.status === 404) {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
            detail: t("Facility Structure not found"),
            life: 4000,
          });
          setTimeout(() => {
            navigate("/");
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
        console.log(res.data);

        FacilityStructureService.remove(res.data.id)
          .then(() => {
            toast.current.show({
              severity: "success",
              summary: t("Successful"),
              detail: t(`${res.data.properties.nodeType} Deleted`),
              life: 4000,
            });
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

  const dragDropUpdate = (dragId: string, dropId: string) => {
    FacilityStructureService.relation(dragId, dropId)
      .then((res) => {
        showSuccess("Structure Updated");
        getFacilityStructure();
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
        getFacilityStructure();
      });
  };

  const dragConfirm = (dragId: string, dropId: string) => {
    confirmDialog({
      message: t("Are you sure you want to move?"),
      header: t("Move Confirmation"),
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
      summary: t("Successful"),
      detail: t(detail),
      life: 4000,
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
            // setFormTypeId(undefined);
            setSelectedFacilityType(undefined);
          }}
          className="p-button-text"
        />
        <Button
          label={t("Add")}
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
          label={t("Cancel")}
          icon="pi pi-times"
          onClick={() => {
            setEditDia(false);
            // setFormTypeId(undefined);
            setSelectedFacilityType(undefined);
          }}
          className="p-button-text"
        />
        <Button
          label={t("Save")}
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
      {(() => {
        if (canDelete === false) {
          return <ContextMenu model={menuRoot} ref={cm} />;
        } else if (selectedFacilityType === "Building") {
          return <ContextMenu model={menuBuilding} ref={cm} />;
        } else if (selectedFacilityType === "Block") {
          return <ContextMenu model={menuBlock} ref={cm} />;
        } else if (selectedFacilityType === "Floor") {
          return <ContextMenu model={menuFloor} ref={cm} />;
        } else {
          return <ContextMenu model={menu} ref={cm} />;
        }
      })()}

      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message={t("Do you want to delete?")}
        header={t("Delete Confirmation")}
        icon="pi pi-exclamation-triangle"
        acceptLabel={t("Yes")}
        rejectLabel={t("No")}
        accept={() => deleteItem(selectedNodeKey)}
      />

      <Toolbar
        className="mb-4"
        right={() => (
          <React.Fragment>
            <Button
              label={t("Export")}
              icon="pi pi-download"
              className="p-button"
              onClick={() => setExportDia(true)}
            />
          </React.Fragment>
        )}
      ></Toolbar>

      <Dialog
        header={t("Add Plan To Floor")}
        visible={planDia}
        style={{ width: "40vw" }}
        footer={() => (
          <div>
            <Button
              label={t("Cancel")}
              icon="pi pi-times"
              onClick={() => {
                setPlanDia(false);
              }}
              className="p-button-text"
            />
            <Button
              label={t("Add")}
              icon="pi pi-check"
              onClick={() => setSubmitted(true)}
              autoFocus
            />
          </div>
        )}
        onHide={() => {
          setPlanDia(false);
        }}
      >
        <AddPlan
          submitted={submitted}
          setSubmitted={setSubmitted}
          setPlanDia={setPlanDia}
          selectedNodeKey={selectedNodeKey}
          getFacilityStructure={getFacilityStructure}
        />
      </Dialog>

      <Dialog
        header={t("Export")}
        visible={exportDia}
        style={{ width: "40vw" }}
        footer={() => (
          <div>
            <Button
              label={t("Cancel")}
              icon="pi pi-times"
              onClick={() => {
                setExportDia(false);
              }}
              className="p-button-text"
            />
            <Button
              label={t("Export")}
              icon="pi pi-check"
              onClick={() => setSubmitted(true)}
              autoFocus
            />
          </div>
        )}
        onHide={() => {
          setExportDia(false);
        }}
      >
        <Export
          submitted={submitted}
          setSubmitted={setSubmitted}
          setExportDia={setExportDia}
          exportType={ExportType.Space}
        />
      </Dialog>

      <Dialog
        header={t("Add New Item")}
        visible={addDia}
        style={{
          width: (() => {
            if (
              selectedFacilityType === "Building" ||
              selectedFacilityType === "Bina"
            ) {
              return "60vw";
            } else if (
              selectedFacilityType === "Block" ||
              selectedFacilityType === "Blok"
            ) {
              return "40vw";
            } else if (
              selectedFacilityType === "Floor" ||
              selectedFacilityType === "Kat"
            ) {
              return "40vw";
            } else if (
              selectedFacilityType === "Space" ||
              selectedFacilityType === "Alan"
            ) {
              return "60vw";
            } else {
              return "40vw";
            }
          })(),
        }}
        footer={renderFooterAdd}
        onHide={() => {
          setAddDia(false);
          setSelectedFacilityType(undefined);
        }}
      >
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>{t("Facility Type")}</h5>
          <Dropdown
            value={selectedFacilityType}
            options={facilityType}
            optionValue="code"
            optionLabel="name"
            onChange={(event) => setSelectedFacilityType(event.value)}
            style={{ width: "100%" }}
          />
        </div>
        {selectedFacilityType === "Building" ||
          selectedFacilityType === "Bina" ? (
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
        {selectedFacilityType === "Block" || selectedFacilityType === "Blok" ? (
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
        {selectedFacilityType === "Floor" || selectedFacilityType === "Kat" ? (
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
        {selectedFacilityType === "Space" || selectedFacilityType === "Alan" ? (
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
        header={t("Edit Item")}
        visible={editDia}
        style={{
          width: (() => {
            if (
              selectedFacilityType === "Building" ||
              selectedFacilityType === "Bina"
            ) {
              return "60vw";
            } else if (
              selectedFacilityType === "Block" ||
              selectedFacilityType === "Blok"
            ) {
              return "40vw";
            } else if (
              selectedFacilityType === "Floor" ||
              selectedFacilityType === "Kat"
            ) {
              return "40vw";
            } else if (
              selectedFacilityType === "Space" ||
              selectedFacilityType === "Alan"
            ) {
              return "60vw";
            }
          })(),
        }}
        footer={renderFooterEdit}
        onHide={() => {
          setEditDia(false);
          setSelectedFacilityType(undefined);
        }}
      >
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>{t("Facility Type")}</h5>
          <Dropdown
            value={selectedFacilityType}
            options={facilityType}
            optionValue="code"
            optionLabel="name"
            disabled
            style={{ width: "100%" }}
          />
        </div>
        {selectedFacilityType === "Building" ||
          selectedFacilityType === "Bina" ? (
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
        {selectedFacilityType === "Block" || selectedFacilityType === "Blok" ? (
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
        {selectedFacilityType === "Floor" || selectedFacilityType === "Kat" ? (
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
        {selectedFacilityType === "Space" || selectedFacilityType === "Alan" ? (
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
        header={t("Import Building")}
        visible={buildingImportDia}
        style={{ width: "25vw" }}
        // footer={renderFooterForm}
        onHide={() => {
          setBuildingImportDia(false);
        }}
      >
        <BuildingFileImport
          selectedNodeKey={selectedNodeKey}
          setBuildingImportDia={setBuildingImportDia}
          getFacilityStructure={getFacilityStructure}
        />
      </Dialog>
      <Dialog
        header={t("Import Block")}
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
        header={t("Import Floor")}
        visible={floorImportDia}
        style={{ width: "25vw" }}
        // footer={renderFooterForm}
        onHide={() => {
          setFloorImportDia(false);
        }}
      >
        <FloorFileImport
          selectedNodeKey={selectedNodeKey}
          setFloorImportDia={setFloorImportDia}
          getFacilityStructure={getFacilityStructure}
        />
      </Dialog>
      <Dialog
        header={t("Import Space")}
        visible={spaceImportDia}
        style={{ width: "25vw" }}
        // footer={renderFooterForm}
        onHide={() => {
          setSpaceImportDia(false);
        }}
      >
        <SpaceFileImport
          selectedNodeKey={selectedNodeKey}
          setSpaceImportDia={setSpaceImportDia}
          getFacilityStructure={getFacilityStructure}
        />
      </Dialog>
      <Dialog
        header={t("Structure Detail")}
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
      <h1>{t("Facility Structure Editing")}</h1>
      <div className="field">
        <Tree
          loading={loading}
          value={data}
          dragdropScope="-"
          contextMenuSelectionKey={selectedNodeKey ? selectedNodeKey : ""}
          onContextMenuSelectionChange={(event: any) => {
            setSelectedNodeKey(event.value);
          }}
          onContextMenu={(event: any) => {
            setCanDelete(event.node.canDelete); // for use import building control on context menu
            setSelectedFacilityType(event.node._type);
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
          filterBy="label,name,description,tag,key"
          filterPlaceholder={t("Search")}
          filterMode="strict"
          filterValue={search}
          onFilterValueChange={(e) => {
            setSearchParams({ search: e.value });
            setSearch(e.value);
          }}
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
                      title={t("Add Item")}
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
                      title={t("Edit Item")}
                    />
                    <Button
                      icon="pi pi-trash"
                      className="p-button-rounded p-button-secondary p-button-text"
                      aria-label="Delete"
                      onClick={() => {
                        setSelectedNodeKey(data.key);
                        setDelDia(true);
                      }}
                      title={t("Delete")}
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
                      title={t("Edit Form")}
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
                      title={t("View Data")}
                    />
                    {process.env.REACT_APP_API_PLANNER_CLIENT_URL &&
                      data.nodeType === "Floor" &&
                      (data.hasPlan ? (
                        <a
                          href={
                            process.env.REACT_APP_API_PLANNER_CLIENT_URL +
                            "?key=" +
                            data.key
                          }
                        >
                          <Button
                            icon="pi pi-map"
                            className="p-button-rounded p-button-info p-button-outlined"
                            aria-label="Go Plan"
                            title={"Go Plan"}
                          />
                        </a>
                      ) : (
                        <Button
                          icon="pi pi-map"
                          className="p-button-rounded p-button-help p-button-outlined"
                          aria-label="Add Plan"
                          title={"Add Plan"}
                          onClick={() => {
                            setSelectedNodeKey(data.key);
                            setPlanDia(true);
                          }}
                        />
                      ))}

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
