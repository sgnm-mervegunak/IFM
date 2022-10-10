import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toolbar } from "primereact/toolbar";

import SystemService from "../../services/systems";
import { useAppSelector } from "../../app/hook";
import SystemForm from "./Forms/SystemForm";
import useToast from "../../hooks/useToast";

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
  email?: string;
  canDelete?: boolean;
  className?: string;
}

const SetSystem = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>("");
  const [selectedNodeId, setSelectedNodeId] = useState<any>("");
  const [nodeType, setNodeType] = useState<any>("")
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Node[]>([]);
  const [addDia, setAddDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const cm: any = React.useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast()
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const { t } = useTranslation(["common"]);
  const [importDia, setImportDia] = useState(false);

  const menu1 = [
    {
      label: t("Add Item"),
      icon: "pi pi-plus",
      command: () => {
        setAddDia(true);
      },
    },
  ];

  const menu2 = [
    {
      label: t("Edit Item"),
      icon: "pi pi-pencil",
      command: () => {
        setIsUpdate(true);
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
  ];

  const getSystems= () => {
    SystemService.findAll()
      .then((res) => {
        if (!res.data.root.children) {
          let temp = JSON.parse(
            JSON.stringify([res.data.root.properties] || [])
          );
          fixNodes(temp);
          setData(temp);
        } else if (res.data.root.children) {
          let temp = JSON.parse(JSON.stringify([res.data.root] || []));
          fixNodes(temp);
          setData(temp);
        }
        setLoading(false);
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

  useEffect(() => {
    getSystems();
  }, []);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.label = i.name;
    }
  };


  const deleteItem = (key: string) => {
    SystemService.nodeInfo(key)
      .then((res) => {
        SystemService.remove(res.data.identity.low)
          .then(() => {
            toast.current.show({
              severity: "success",
              summary: t("Successful"),
              detail: t("Component Deleted"),
              life: 2000,
            });
            getSystems();
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
        getSystems();
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

  return (
    <div className="container">
      {/* <Toolbar
        className="mb-4"
        right={() => (
          <>
            <Button
              label={t("Import Contacts")}
              icon="pi pi-upload"
              className="p-button"
              onClick={() => setImportDia(true)}
            />
          </>
        )}
      /> */}

      {(() => {
        if (canDelete === false) {
          return <ContextMenu model={menu1} ref={cm} />;
        } 
        else {
          return <ContextMenu model={menu2} ref={cm} />;
        }
      })()}

      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message={t("Do you want to delete?")}
        header={t("Delete Confirmation")}
        icon="pi pi-exclamation-triangle"
        accept={() => deleteItem(selectedNodeKey)}
      />
      <Dialog
        header={t("Add New Item")}
        visible={addDia}
        style={{ width: "40vw" }}
        footer={renderFooterAdd}
        className="dial"
        onHide={() => {
          setAddDia(false);
        }}
      >
        <SystemForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          selectedNodeId={selectedNodeId}
          editDia={editDia}
          getSystems={getSystems}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
        />
      </Dialog>
      <Dialog
        header={t("Edit Item")}
        visible={editDia}
        style={{ width: "40vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          setEditDia(false);
        }}
      >
        <SystemForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          selectedNodeId={selectedNodeId}
          editDia={editDia}
          getSystems={getSystems}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
        />
      </Dialog>

      <h1>{t("Manage Systems")}</h1>
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
            setCanDelete(event.node.canDelete); // for use import building control on context menu
            // setSelectedNodeId(event.node._id.low);
            setNodeType(event.node.className);
            console.log(event.node);
            
            cm.current.show(event.originalEvent);
            // if (event.node.canDelete === true) {
            //   cm.current.hide(event.originalEvent);
            // }
            
          }}
          filter
          filterBy="name,code"
          filterPlaceholder={t("Search")}
          nodeTemplate={(data: Node, options) => (
            <span className="flex align-items-center font-bold">
              {data.label}{" "}
              {
                <>
                  <span className="ml-4 ">

                    {
                      data.canDelete === false && (
                        <Button
                          icon="pi pi-plus"
                          className="p-button-rounded p-button-secondary p-button-text"
                          aria-label={t("Add Item")}
                          onClick={() => {
                            setSelectedNodeKey(data.key);
                            setAddDia(true);
                          }}
                          title={t("Add System")}
                        />
                      )
                    }

                    {
                      data.className === "System" && (
                        <>
                          <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-secondary p-button-text"
                            aria-label={t("Edit Item")}
                            onClick={() => {
                              setSelectedNodeKey(data.key);
                              setSelectedNodeId(data._id.low);
                              let dataKey: any = data.key;
                              setIsUpdate(true);
                              setEditDia(true);
                            }}
                            title={t("Edit Item")}
                          />
                          <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-secondary p-button-text"
                            aria-label={t("Delete")}
                            onClick={() => {
                              setSelectedNodeKey(data.key);
                              setDelDia(true);
                            }}
                            title={t("Delete Item")}
                          />
                        </>
                      )
                    }

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

export default SetSystem;