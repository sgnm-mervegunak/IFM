import React, { useEffect, useState, useRef } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { useNavigate, useParams } from "react-router-dom";
import { Chips } from 'primereact/chips';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Checkbox } from 'primereact/checkbox';
import { Toolbar } from "primereact/toolbar";
import { Menu } from 'primereact/menu';
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";

import ClassificationsService from "../../../services/assetclassifications";
import { useAppSelector } from "../../../app/hook";
import ClassificationForm from "./Forms/ClassificationForm";
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
  },
  formTypeId?: string;
  icon?: string;
  label?: string;
  labels?: string[]; // for form type
  parentId?: string;
}

const SetClassificationAdmin = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState("");
  const [expandedKeys, setExpandedKeys] = useState({});
  const [expandedKey, setExpandedKey] = useState({});
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
  const [codeShow, setCodeShow] = useState(false);
  const menuImport = useRef({ current: { toggle: () => { } } } as any);
  const { t } = useTranslation(["common"]);
  const language = useAppSelector((state) => state.language.language);
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);

  const menu = [
    {
      label: t("Add Item"),
      icon: "pi pi-plus",
      command: () => {
        setAddDia(true);
      },
    },
    {
      label: t("Edit Item"),
      icon: "pi pi-pencil",
      command: () => {
        // ClassificationsService.nodeInfo(selectedNodeKey)
        //   .then((res) => {
        //     if (res.data.properties.code !== undefined) {
        //       setCodeShow(true);
        //     }
        //     setName(res.data.properties.name || "");
        //     setCode(res.data.properties.code || "");
        //     setTag(res.data.properties.tag || []);
        //     setIsActive(res.data.properties.isActive);
        //   })
        //   .catch((err) => {
        //     toast.current.show({
        //       severity: "error",
        //       summary: t("Error"),
        //       detail: err.response ? err.response.data.message : err.message,
        //       life: 4000,
        //     });
        //     getClassification();
        //     setEditDia(false);
        //   });
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

  const getClassification = () => {
    ClassificationsService.findAll().then((res) => {
    console.log("ress", res);
      if (!res.data.root.children) {
        setData([res.data.root.properties] || []);
        let temp = JSON.parse(JSON.stringify([res.data.root.properties] || []));
        fixNodes(temp)
        setData(temp)
        console.log("temp1", temp);
      }
      else if (res.data.root.children) {
        let _expandedKey: { [key: string]: boolean } = {};
        let rootKey: string = res.data.root.key;
        _expandedKey[rootKey] = true;
        Object.assign(_expandedKey, expandedKey);
        setExpandedKeys(_expandedKey);

        setData([res.data.root] || []);
        let temp = JSON.parse(JSON.stringify([res.data.root] || []));
        fixNodes(temp)
        setData(temp)
        console.log("temp2", temp);
      }
      setLoading(false);
    }).catch(err => {
      console.log(err.response);
      if (err.response.status === 404) {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: t("Classification not found"),
          life: 3000,
        });
        setTimeout(() => {
          navigate("/")
        }, 3000)
      }
    })
  }

  useEffect(() => {
    getClassification();
  }, [language]);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children)
      i.label = i.name;
    }
  };

  const addItem = (key: string) => {
    let newNode: any = {};
    ClassificationsService.nodeInfo(key)
      .then((res) => {
        if (res.data.labels[0] === "Classification") {

          newNode = {
            key: uuidv4(),
            parentId: res.data.id,
            name: name,
            code: code,
            tag: tag,
            description: "",
            labels: [`${name}_${language}`],
            realm: realm,
            isRoot: true,
          }
        } else {
          newNode = {
            key: uuidv4(),
            parentId: res.data.id,
            name: name,
            code: code,
            tag: tag,
            description: "",
          }
        }

        ClassificationsService.create(newNode)
          .then((res) => {
            toast.current.show({
              severity: "success",
              summary: t("Successful"),
              detail: t("Classification Created"),
              life: 4000,
            });
            getClassification();
          })
          .catch((err) => {
            toast.current.show({
              severity: "error",
              summary: t("Error"),
              detail: err.response ? err.response.data.message : err.message,
              life: 4000,
            });
            getClassification();
          });
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
        getClassification();
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
        updateNode = {
          name: name,
          tag: tag,
          description: "",
          isActive: isActive,
          labels: [`${name}_${language}`],
        };

        ClassificationsService.update(res.data.id, updateNode)
          .then(async (res) => {
            toast.current.show({
              severity: "success",
              summary: t("Successful"),
              detail: t("Classification Updated"),
              life: 4000,
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
              life: 4000,
            });
            getClassification();
          });

      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
        getClassification();
      });

    setName("");
    setCode("");
    setTag([]);
    setEditDia(false);
  }

  const deleteItem = (key: string) => {
    ClassificationsService.nodeInfo(key)
      .then((res) => {
        ClassificationsService.remove(res.data.id)
          .then(() => {
            toast.current.show({
              severity: "success",
              summary: t("Successful"),
              detail: t("Classification Deleted"),
              life: 4000,
            });
            getClassification();
          })
          .catch((err) => {
            toast.current.show({
              severity: "error",
              summary: t("Error"),
              detail: err.response ? err.response.data.message : err.message,
              life: 4000,
            });
            getClassification();
          });

      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
        getClassification();
      });
  };

  const dragDropUpdate = (dragId: string, dropId: string) => {
    ClassificationsService.relation(dragId, dropId)
      .then((res) => {
        showSuccess(t("Classification Updated"));
        getClassification();
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
        getClassification();
        setLoading(false);
      });
  };

  const dragConfirm = (dragId: string, dropId: string) => {
    confirmDialog({
      message: t("Are you sure you want to move?"),
      header: t("Move Confirmation"),
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: t("Yes"),
      rejectLabel: t("No"),
      accept: () => { setLoading(true); dragDropUpdate(dragId, dropId) },
      reject: () => { setLoading(true); getClassification() }
    });
  }

  const showSuccess = (detail: string) => {
    toast.current.show({
      severity: "success",
      summary: t("Successful"),
      detail: detail,
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
            setName("");
            setCode("");
            setTag([]);
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
            setName("");
            setCode("");
            setTag([]);
            setCodeShow(false);
          }}
          className="p-button-text"
        />
        <Button
          label={t("Save")}
          icon="pi pi-check"
          onClick={() => {
            setSubmitted(true)
            setCodeShow(false);
          }}
          autoFocus
        />
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Menu model={items} popup ref={menuImport} id="popup_menu" />
        <Button className="mr-2" label={t("Import")} icon="pi pi-upload" onClick={(event) => menuImport.current.toggle(event)} aria-controls="popup_menu" aria-haspopup />
      </React.Fragment>
    );
  };

  const items = [
    {
      label: t("Upload File With Code"),
      icon: 'pi pi-upload',
      command: () => {
        navigate("/classifications/fileimportwithcode");
      }
    },
    {
      label: t("Upload File Without Code"),
      icon: 'pi pi-upload',
      command: () => {
        navigate("/classifications/fileimportwithoutcode");
      }
    }
  ];

  return (
    <div className="container">
      <Toolbar className="mb-4"
        right={rightToolbarTemplate}
      ></Toolbar>
      <ContextMenu model={menu} ref={cm} />
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
      <Dialog
        header={t("Add New Item")}
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
        <ClassificationForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          editDia={editDia}
          getClassification={getClassification}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          contactData={data}
        />
      </Dialog>
      <Dialog
        header={t("Edit Item")}
        visible={editDia}
        style={{ width: "25vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          setName("");
          setCode("");
          setTag([]);
          setEditDia(false);
          setCodeShow(false);
        }}
      >
        <ClassificationForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          editDia={editDia}
          getClassification={getClassification}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          contactData={data}
        />

      </Dialog>
      <h1>{t("Classification Management")}</h1>
      <div className="field">
        <Tree

          loading={loading}
          value={data}
          expandedKeys={expandedKeys}
          onToggle={e => {
            setExpandedKeys(e.value);
            setExpandedKey(e.value);
          }}
          dragdropScope="-"
          contextMenuSelectionKey={selectedNodeKey ? selectedNodeKey : ""}
          onContextMenuSelectionChange={(event: any) =>
            setSelectedNodeKey(event.value)
          }
          onContextMenu={(event) => cm.current.show(event.originalEvent)}
          onDragDrop={(event: any) => {
            if (event.value.length > 1) {
              toast.current.show({
                severity: "error",
                summary: t("Error"),
                detail: t("You can't drag here"),
                life: 3000,
              });
              return
            }
            console.log(event);

            dragConfirm(event.dragNode._id.low, event.dropNode._id.low)
          }}
          filter
          filterBy="name,code"
          filterPlaceholder={t("Search")}
          className="font-bold"

          nodeTemplate={(data: Node, options) => <span className="flex align-items-center font-bold">{data.code ? data.code + " / " : ""}{data.label} {
            <>
              <span className="ml-4 ">

                {
                  data.isActive === true ?

                    <span style={{ backgroundColor: "green" }} className="green-400 text-white font-bold border-round m-3">{t("Active")}</span>
                    :
                    <span style={{ backgroundColor: "red" }} className="red-400 text-white font-bold border-round m-3">{t("Passive")}</span>
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

export default SetClassificationAdmin;