import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ContextMenu } from "primereact/contextmenu";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import FacilityStructureService from "../../services/facilitystructure";
import JointSpaceService from "../../services/jointSpace";
import { useAppSelector } from "../../app/hook";
import DisplayNode from "../FacilityStructure/Display/DisplayNode";
import JointSpaceForm from "./Forms/JointSpaceForm";

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

const SetJointSpace = () => {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [selectedKeysName, setSelectedKeysName] = useState<string[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>([]);
  const [selectedNodeKeys, setSelectedNodeKeys] = useState<any>([]);
  const [deleteNodeKey, setDeleteNodeKey] = useState<any>("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>();
  const [formTypeId, setFormTypeId] = useState<any>(undefined);
  const [labels, setLabels] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [addDia, setAddDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const [formDia, setFormDia] = useState<boolean>(false);
  const { toast } = useAppSelector((state) => state.toast);
  const cm: any = React.useRef(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormNode[]>([]);
  const auth = useAppSelector((state) => state.auth);
  //onst [realm, setRealm] = useState(auth.auth.realm);
  const [generateNodeKey, setGenerateNodeKey] = useState("");
  const [generateFormTypeKey, setGenerateFormTypeKey] = useState<
    string | undefined
  >("");
  const [generateNodeName, setGenerateNodeName] = useState<string | undefined>(
    ""
  );
  const [facilityType, setFacilityType] = useState<string[]>([]);
  const [selectedFacilityType, setSelectedFacilityType] = useState<
    string | undefined
  >("");
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [display, setDisplay] = useState(false);
  const [displayKey, setDisplayKey] = useState("");
  const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
  const [uploadFiles, setUploadFiles] = useState<any>({});
  const params = useParams();
  const { t } = useTranslation(["common"]);
  //const [joint, setJoint] = useState<any>();

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
    JointSpaceService.findBuildingWithKey(key)
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
            summary: t("Error"),
            detail: "Joint Space not found",
            life: 3000,
          });
          setTimeout(() => {
            navigate("/jointspace");
          }, 3000);
        }
      });
  };

  useEffect(() => {
    getJointSpace();
  }, []);


  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.icon = "pi pi-fw pi-building";
      i.label = i.name || i.Name;
      if (
        (i.nodeType === "Space" || i.nodeType === "JointSpace") &&
        i.isBlocked !== true
      ) {
        i.selectable = true;
      } else {
        i.selectable = false;
      }

      if (i.name === "Joint Space") {
        i.icon = "pi pi-fw pi-star-fill";
      }
    }
  };

  const DeleteAnyFile = (realmName: string, fileName: string) => {
    const url = "http://localhost:3004/file-upload/removeOne";

    return axios.delete(url, { data: { fileName, realmName } });
  };


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
        setSelectedKeysName([]);
        setDisplay(false);
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
          onClick={() => {
            setSubmitted(true);
          }}
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
  //         onClick={() => {data?.operatorCode
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
        style={{ width: "60vw" }}
        footer={renderFooterAdd}
        onHide={() => {
          setAddDia(false);
        }}
      >
        <JointSpaceForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          setSelectedNodeKey={setSelectedNodeKey}
          selectedSpaceKeys={selectedKeys}
          selectedKeysName={selectedKeysName}
          setSelectedKeysName={setSelectedKeysName}
          editDia={editDia}
          getJointSpace={getJointSpace}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          setSelectedSpaceKeys={setSelectedKeys}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          jointSpaceData={data}
          setSelectedNodeKeys={setSelectedNodeKeys}
          selectedNodeKeys={selectedNodeKeys}
        />
      </Dialog>

      <div>

        <Dialog
          header="Edit Item"
          visible={editDia}
          style={{ width: "60vw" }}
          footer={renderFooterEdit}
          onHide={() => {
            setEditDia(false);
          }}
        >
          <JointSpaceForm
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            setSelectedNodeKey={setSelectedNodeKey}
            selectedSpaceKeys={selectedKeys}
            selectedKeysName={selectedKeysName}
            setSelectedKeysName={setSelectedKeysName}
            editDia={editDia}
            getJointSpace={getJointSpace}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            setSelectedSpaceKeys={setSelectedKeys}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            jointSpaceData={data}
            setSelectedNodeKeys={setSelectedNodeKeys}
            selectedNodeKeys={selectedNodeKeys}
          />
        </Dialog>
      </div>

      <h3>{t("Joint Space")}</h3>
      <div>
        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
          {t("Selected Spaces")}:
        </span>
        <span
          style={{ fontWeight: "bold", fontSize: "14px", color: "red" }}
        >{` ${selectedKeysName.toString().replaceAll(",", ", ")} `}</span>

        {selectedKeys.length > 1 && (
          <div className="mt-4">
            <Button
              label={t("Join")}
              icon="pi pi-check"
              className="ml-2"
              onClick={() => setAddDia(true)}
            />
          </div>
        )}
      </div>
      <div className="field mt-4">
        <Tree
          onContextMenu={(event: any) => {
            // setSelectedFacilityType(event.node.nodeType);
            cm.current.show(event.originalEvent);
            console.log("original", event.originalEvent)
          }}
          loading={loading}
          value={data}
          dragdropScope="-"
          filter
          filterBy="name,code"
          filterPlaceholder={t("Search")}
          selectionMode="checkbox"
          onSelect={(e: any) => {
            setSelectedKeysName((prev) => [...prev, e.node.name]);
          }}
          onUnselect={(e: any) => {
            setSelectedKeysName((prev) =>
              prev.filter((item) => item !== e.node.name)
            );
          }}
          onSelectionChange={(event: any) => {
            // setSelectedNodeKey(event.value);
            setSelectedNodeKeys(event.value);
            setSelectedKeys(Object.keys(event.value));
            // findKeyName(Object.keys(event.value));
          }}
          selectionKeys={selectedNodeKeys}
          propagateSelectionUp={false}
          className="font-bold"
          nodeTemplate={(data: Node, options) => (
            <span className="flex align-items-center font-bold">
              {data.label}{" "}
              {
                <>
                  <span className="ml-4 ">
                    {data.nodeType === "JointSpace" ? (
                      <div>
                        <Button
                          icon="pi pi-trash"
                          className="p-button-rounded p-button-secondary p-button-text"
                          aria-label="Delete"
                          onClick={() => {
                            setDeleteNodeKey(data.key);
                            setDelDia(true);
                          }}
                          title={t("Delete")}
                        />
                      </div>
                    ) : null}
                  </span>
                  <span>
                    {data.nodeType === "JointSpace" ? (
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
                  <span>
                    {data.nodeType === "JointSpace" ? (
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-secondary p-button-text"
                        aria-label="Edit Item"
                        onClick={() => {
                          console.log("data key", data.key)
                          setSelectedNodeKey(data.key);
                          // let dataKey: any = data.key;
                          setIsUpdate(true);
                          setEditDia(true);
                        }}
                        title={t("Edit Item")}
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

export default SetJointSpace;
