import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { Chips } from "primereact/chips";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";

import ClassificationsService from "../../../services/assetclassifications";
import AssetLazyLoadingService from "../../../services/assetLazyLoading";
import { useAppSelector } from "../../../app/hook";
import useToast from "../../../hooks/useToast";

interface Node {
  cantDeleted: boolean;
  children: Node[];
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  key: string;
  name: string;
  code: string;
  realm: string;
  tag: string[];
  _id: {
    low: string;
    high: string;
  };
  formTypeId?: string;
  icon?: string;
  label?: string;
  labels?: string[]; // for form type
  parentId?: string;
}

const SetAssetClassificationUserLazy = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState("");
  const [loadedNode, setLoadedNode] = useState<any>({});
  const [expandedKeys, setExpandedKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Node[]>([]);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [tag, setTag] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [addDia, setAddDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const { toast } = useToast()
  const cm: any = React.useRef(null);
  const navigate = useNavigate();
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const [labels, setLabels] = useState<string[]>([]);
  const { t } = useTranslation(["common"]);

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
        ClassificationsService.nodeInfo(selectedNodeKey)
          .then((res) => {
            setName(res.data.properties.name || "");
            setCode(res.data.properties.code || "");
            setTag(res.data.properties.tag || []);
          })
          .catch((err) => {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: err.response ? err.response.data.message : err.message,
              life: 2000,
            });
          });
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

  const getClassification = () => {
    ClassificationsService.findAllActive()
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
        console.log(err.response);
        if (err.response.status === 404) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Classification not found",
            life: 3000,
          });
          setTimeout(() => {
            navigate("/");
          }, 3000);
        }
      });
  };
  const getClassificationRootAndChildren = () => {
    setLoadedNode({});
    AssetLazyLoadingService.getActiveClassificationRootAndChildrenByLanguageAndRealm()
      .then((res) => {
        // res.data.children = res.data.children.map((item: any) => {
        //   item.leaf = item.children.length === 0;
        //   delete item.children;
        //   return item;
        // });
        // setData([{ ...res.data, leaf: res.data.children.length === 0 }]);
        setData([res.data]);
        setExpandedKeys({ [res.data.key]: true });
        setLoading(false);
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

  const loadOnExpand = (event: any) => {
    if (!event.node.children) {
      setLoading(true);

      AssetLazyLoadingService.loadActiveClassification(event.node.key)
        .then((res) => {
          setLoadedNode((prev: any) => {
            for (const item of res.data.children) {
              prev[item.properties.key] = prev[event.node.key]
                ? [...prev[event.node.key], event.node.key]
                : [event.node.key];
            }

            return prev;
          });

          event.node.children = res.data.children.map((child: any) => ({
            ...child.properties,
            id: child.identity.low,
            leaf: child.leaf,
          }));
          setData([...data]);
          setExpandedKeys((prev) => ({ ...prev, [event.node.key]: true }));
          setLoading(false);
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: t("Error"),
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
        });
    }
  };

  const RollBack = async (key?: any, dragingNode?: any) => {
    setLoading(true);
    const temp = key
      ? loadedNode[key]
        ? [...loadedNode[key], key]
        : [key]
      : loadedNode[selectedNodeKey];

    AssetLazyLoadingService.loadActiveClassificationWithPath(temp)
      .then((res) => {
        setData([res.data]);
        if (key && dragingNode) {
          setLoadedNode((prev: any) => ({ ...prev, [dragingNode]: temp }));
        }
        setExpandedKeys((prev: any) => {
          prev = {
            [res.data.key]: true,
          };
          for (let item of temp) {
            prev[item] = true;
          }
          return prev;
        });
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);

        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
      });
  };
  useEffect(() => {
    // getClassification();
    getClassificationRootAndChildren();
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

  const addItem = (key: string) => {
    let newNode: any = {};
    ClassificationsService.nodeInfo(key)
      .then((res) => {
        if (labels.length > 0) {
          newNode = {
            key: uuidv4(),
            parentId: res.data.id,
            name: name,
            code: code,
            tag: tag,
            description: "",
            labels: [],
          };
        } else {
          newNode = {
            key: uuidv4(),
            parentId: res.data.id,
            name: name,
            code: code,
            tag: tag,
            description: "",
          };
        }

        ClassificationsService.create(newNode)
          .then((res) => {
            toast.current.show({
              severity: "success",
              summary: "Successful",
              detail: "Classification Created",
              life: 3000,
            });
            // getClassification();
            RollBack(key, res.data.properties.key);
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
    setCode("");
    setTag([]);
    setAddDia(false);
  };

  const editItem = (key: string) => {
    let updateNode: any = {};
    ClassificationsService.nodeInfo(key)
      .then((res) => {
        if (labels.length > 0) {
          updateNode = {
            key: uuidv4(),
            name: name,
            code: code,
            tag: tag,
            description: "",
            labels: labels,
            isActive: isActive,
          };
        } else {
          updateNode = {
            key: uuidv4(),
            name: name,
            code: code,
            tag: tag,
            description: "",
            isActive: isActive,
          };
        }

        ClassificationsService.update(res.data.id, updateNode)
          .then((res) => {
            toast.current.show({
              severity: "success",
              summary: "Successful",
              detail: "Classification Updated",
              life: 3000,
            });
            // getClassification();
            RollBack();
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
    setCode("");
    setTag([]);
    setEditDia(false);
  };

  const deleteItem = (key: string) => {
    ClassificationsService.nodeInfo(key)
      .then((res) => {
        ClassificationsService.remove(res.data.id)
          .then(() => {
            toast.current.show({
              severity: "success",
              summary: "Success",
              detail: "Classification Deleted",
              life: 2000,
            });
            // getClassification();
            RollBack();
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
  };

  const dragDropUpdate = (
    dragId: string,
    dropId: string,
    key: string,
    dragingNode: string
  ) => {
    ClassificationsService.relation(dragId, dropId)
      .then((res) => {
        showSuccess("Updated");
        // getClassification();
        RollBack(key, dragingNode);
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

  const dragConfirm = (
    dragId: string,
    dropId: string,
    key: string,
    dragingnode: string
  ) => {
    confirmDialog({
      message: "Are you sure you want to move?",
      header: "Confirmation",
      icon: "pi pi-exclamation-triangle",
      accept: () => {
        setLoading(true);
        dragDropUpdate(dragId, dropId, key, dragingnode);
      },
      reject: () => {
        // setLoading(true);
        // getClassification();
        // RollBack();
      },
    });
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
            setCode("");
            setTag([]);
          }}
          className="p-button-text"
        />
        <Button
          label="Add"
          icon="pi pi-check"
          onClick={() => addItem(selectedNodeKey)}
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
            setCode("");
            setTag([]);
          }}
          className="p-button-text"
        />
        <Button
          label="Save"
          icon="pi pi-check"
          onClick={() => editItem(selectedNodeKey)}
          autoFocus
        />
      </div>
    );
  };

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
        style={{ width: "25vw" }}
        footer={renderFooterAdd}
        onHide={() => {
          setName("");
          setCode("");
          setTag([]);
          setAddDia(false);
        }}
      >
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Code</h5>
          <InputText
            value={code}
            onChange={(event) => setCode(event.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
          <InputText
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ width: "100%" }}
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
      </Dialog>
      <Dialog
        header="Edit Item"
        visible={editDia}
        style={{ width: "25vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          setName("");
          setCode("");
          setTag([]);
          setEditDia(false);
        }}
      >
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Code</h5>
          <InputText
            value={code}
            onChange={(event) => setCode(event.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
          <InputText
            value={name}
            onChange={(event) => setName(event.target.value)}
            style={{ width: "100%" }}
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
      </Dialog>
      <h1>Edit Classification</h1>
      <div className="field">
        <Tree
          loading={loading}
          value={data}
          dragdropScope="-"
          expandedKeys={expandedKeys}
          onToggle={(e) => {
            setExpandedKeys(e.value);
          }}
          onExpand={loadOnExpand}
          contextMenuSelectionKey={selectedNodeKey ? selectedNodeKey : ""}
          onContextMenuSelectionChange={(event: any) =>
            setSelectedNodeKey(event.value)
          }
          onContextMenu={(event) => cm.current.show(event.originalEvent)}
          onDragDrop={(event: any) => {
            if (event.value.length > 1) {
              toast.current.show({
                severity: "error",
                summary: "Error",
                detail: "You can't drag here.",
                life: 1000,
              });
              return;
            }
            dragConfirm(
              event.dragNode.id,
              event.dropNode.id,
              event.dropNode.key,
              event.dragNode.key
            );
          }}
          filter
          filterBy="name,code,tag"
          filterPlaceholder="Search"
          className="font-bold"
          nodeTemplate={(data: Node, options) => (
            <span className="flex align-items-center font-bold">
              {data.name}{" "}
            </span>
          )}
        />
      </div>
      <div className="field"></div>
    </div>
  );
};

export default SetAssetClassificationUserLazy;