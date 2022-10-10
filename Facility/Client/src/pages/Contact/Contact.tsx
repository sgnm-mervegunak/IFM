import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Toolbar } from "primereact/toolbar";

import ContactService from "../../services/contact";
import FormTypeService from "../../services/formType";
import { useAppSelector } from "../../app/hook";
import ContactForm from "./Forms/ContactForm";
import ImportContact from "./ImportContact"

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

const Contact = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Node[]>([]);
  const [formTypeId, setFormTypeId] = useState<any>(undefined);
  const [addDia, setAddDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const cm: any = React.useRef(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormNode[]>([]);
  const [classification, setClassification] = useState<Node[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const { toast } = useAppSelector((state) => state.toast);
  const [realm, setRealm] = useState(auth.auth.realm);
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [canDelete, setCanDelete] = useState<boolean>(false);
  const { t } = useTranslation(["common"]);
  const [importDia, setImportDia] = useState(false);

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

  const getContact = () => {
    // ContactService.findAll()
    //   .then((res) => {
    //     if (!res.data.root.children) {
    //       setData([res.data.root.properties] || []);
    //       let temp = JSON.parse(
    //         JSON.stringify([res.data.root.properties] || [])
    //       );
    //       fixNodes(temp);
    //       setData(temp);
    //     } else if (res.data.root.children) {
    //       setData([res.data.root] || []);
    //       let temp = JSON.parse(JSON.stringify([res.data.root] || []));
    //       fixNodes(temp);
    //       setData(temp);
    //     }
    //     setLoading(false);
    //   })
    //   .catch((err) => {
    //     if (err.response.status === 500) {
    //       toast.current.show({
    //         severity: "error",
    //         summary: t("Error"),
    //         detail: t("Contact not found"),
    //         life: 3000,
    //       });
    //       setTimeout(() => {
    //         navigate("/");
    //       }, 3000);
    //     }
    //   });
  };

  useEffect(() => {
    getContact();
  }, []);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.label = i.name || i.email;
    }
  };


  const deleteItem = (key: string) => {
    ContactService.nodeInfo(key)
      .then((res) => {
        ContactService.remove(res.data.id)
          .then(() => {
            toast.current.show({
              severity: "success",
              summary: t("Successful"),
              detail: t("Contact Deleted"),
              life: 2000,
            });
            getContact();
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
        getContact();
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
      <Toolbar
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
      />
      <Dialog
        header={t("Import Contacts")}
        visible={importDia}
        style={{ width: "40vw" }}
        onHide={() => {
          setImportDia(false);
        }}
      >
        <ImportContact
          selectedNodeKey={selectedNodeKey}
          setImportDia={setImportDia}
          getContact={getContact}
        />
      </Dialog>

      {(() => {
        if (canDelete === false) {
          return <ContextMenu model={menu1} ref={cm} />;
        } else {
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
        style={{ width: "60vw" }}
        footer={renderFooterAdd}
        className="dial"
        onHide={() => {
          setAddDia(false);
        }}
      >
        <ContactForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          editDia={editDia}
          getContact={getContact}
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
        style={{ width: "55vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          setEditDia(false);
        }}
      >
        <ContactForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          editDia={editDia}
          getContact={getContact}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          contactData={data}
        />
      </Dialog>

      <h1>{t("Contact Management")}</h1>
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
            cm.current.show(event.originalEvent);
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
                          title={t("Add Item")}
                        />
                      )
                    }

                    {
                      data.canDelete === true && (
                        <>
                          <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-secondary p-button-text"
                            aria-label={t("Edit Item")}
                            onClick={() => {
                              setSelectedNodeKey(data.key);
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

                    {/* {
                      <Button
                        icon="pi pi-book"
                        className="p-button-rounded p-button-secondary p-button-text"
                        aria-label={t("Edit Form")}
                        // onClick={(e) => navigate(`/formgenerate/${data.key}?id=${data._id.low}`,
                        // {
                        //   state: {
                        //     data: data,
                        //     rootId: structure.root._id.low,
                        //   }
                        // }
                        // )}
                        onClick={(e) =>
                          navigate(
                            `/formgenerate/${data.self_id.low}?formTypeId=${data.formTypeId}`
                          )
                        }
                        title={t("Edit Form")}
                      />
                    } */}

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

export default Contact;