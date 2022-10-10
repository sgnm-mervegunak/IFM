import React, { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { Dialog } from "primereact/dialog";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Button } from "primereact/button";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import FacilityStructureService from "../../services/facilitystructure";
import ZoneService from "../../services/zone";
import { useAppSelector } from "../../app/hook";
import DisplayNode from "../FacilityStructure/Display/DisplayNode";
import DocumentUploadComponent from "../FacilityStructure/Forms/FileUpload/DocumentUpload/DocumentUpload";
import ImageUploadComponent from "../FacilityStructure/Forms/FileUpload/ImageUpload/ImageUpload";
import ZoneForm from "./Forms/ZoneForm";
import ClassificationsService from "../../services/classifications"


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

interface Params{
  selectedBuildingKey: any,
  setSelectedBuildingKey: React.Dispatch<React.SetStateAction<any>>
}

const SetZoneComponent = ({ selectedBuildingKey, setSelectedBuildingKey }: Params) => {
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [spaceNames, setSpaceNames] = useState<string>("");
  const [selectedKeysName, setSelectedKeysName] = useState<string[]>([]);
  const [display, setDisplay] = useState(false);
  const [displayKey, setDisplayKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Node[]>([]);
  const [formTypeId, setFormTypeId] = useState<any>(undefined);
  const [formDia, setFormDia] = useState<boolean>(false);
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
  const [generateNodeKey, setGenerateNodeKey] = useState("");
  const [generateFormTypeKey, setGenerateFormTypeKey] = useState<string | undefined>("");
  const [generateNodeName, setGenerateNodeName] = useState<string | undefined>("");
  const [selectedFacilityType, setSelectedFacilityType] = useState<string | undefined>("");
  const [deleteNodeKey, setDeleteNodeKey] = useState<any>("");
  const [codeCategory, setCodeCategory] = useState("");

  const { t } = useTranslation(["common"]);

  const params = useParams();




  const getZone = () => {
    // const key = params.id || "";
    const key = selectedBuildingKey || "";

    ZoneService.findBuildingWithKey(key)
      .then((res) => {
        // console.log(res.data);
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
  }, [selectedBuildingKey])

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

      if (i.name === "Zones") {
        i.icon = "pi pi-fw pi-star-fill";
      }
    }
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

  const deleteItem = (key: string) => {
    ZoneService.remove(key)
      .then(() => {
        toast.current.show({
          severity: "success",
          summary: t("Successful"),
          detail: t("Zone Deleted"),
          life: 2000,
        });
        getZone();
        setSelectedNodeKey([]);
        setSelectedKeys([]);
        setDisplay(false);
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


  const renderFooterAdd = () => {
    return (
      <div>
        <Button
          label={t("Cancel")}
          icon="pi pi-times"
          onClick={() => {
            setAddDia(false);
            // reset({ ...createZone, tag: [], category: "" }); // reset form values after canceling the create zone operation
          }}
          className="p-button-text"
        />
        <Button
          label={t("Add")}
          icon="pi pi-check"
          onClick={() => {
            setSubmitted(true);
          }
          }
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
            // setLabels([]);
            // setFormTypeId(undefined);

            // setSelectedFacilityType(undefined);
            // reset({
            //   ...createZone,
            // });
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
      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message="Do you want to delete?"
        header="Delete Confirmation"
        icon="pi pi-exclamation-triangle"
        accept={() => {
          deleteItem(deleteNodeKey)
        }
        }
      />
      <Dialog
        header={t("Zone Detail")}
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
        style={{ width: "40vw" }}
        footer={renderFooterAdd}
        onHide={() => {
          // setFormTypeId(undefined); 
          // setLabels([]); 
          setAddDia(false);
          // setSelectedFacilityType(undefined);
          // reset({ ...createZone });
        }}
      >

        <ZoneForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          setSelectedNodeKey={setSelectedNodeKey}
          editDia={editDia}
          getZone={getZone}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          zoneData={data}
          selectedSpaceKeys={selectedKeys}
          setSelectedSpaceKeys={setSelectedKeys}
          selectedSpaceNames={selectedKeysName}
          setSelectedSpaceNames={setSelectedKeysName}
        />
      </Dialog>

      <Dialog
        header={t("Edit Item")}
        visible={editDia}
        style={{ width: "40vw" }}
        footer={renderFooterEdit}
        onHide={() => {
          // setFormTypeId(undefined); 
          // setLabels([]);
          // setAddDia(false);
          // setSelectedFacilityType(undefined);
          // reset({ ...createZone });

          setEditDia(false);
        }}
      >

        <ZoneForm
          submitted={submitted}
          setSubmitted={setSubmitted}
          selectedNodeKey={selectedNodeKey}
          setSelectedNodeKey={setSelectedNodeKey}
          editDia={editDia}
          getZone={getZone}
          setAddDia={setAddDia}
          setEditDia={setEditDia}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          zoneData={data}
          selectedSpaceKeys={selectedKeys}
          setSelectedSpaceKeys={setSelectedKeys}
          selectedSpaceNames={selectedKeysName}
          setSelectedSpaceNames={setSelectedKeysName}
        />
      </Dialog>

      {/* <h3>Zone</h3> */}
      <div>
        <h4>
          Selected Spaces:
        </h4>
        <span
          style={{ fontWeight: "bold", fontSize: "14px", color: "red" }}
        >{` ${selectedKeysName.toString().replaceAll(",", ", ")} `}</span>

        {selectedKeys.length > 1 && (
          <div className="mt-4">
            <Button
              label="Create Zone"
              icon="pi pi-check"
              className="ml-2"
              onClick={() => {
                setAddDia(true);
              }}
            />
          </div>
        )}
      </div>

      <div className="field mt-4">
        <Tree
          onContextMenu={(event: any) => {
            // setSelectedFacilityType(event.node.nodeType);
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
            setSelectedKeysName((prev) => [...prev, e.node.name]);
          }}
          onUnselect={(e: any) => {
            setSelectedKeysName((prev) =>
              prev.filter((item) => item !== e.node.name)
            );
          }}
          onSelectionChange={(event: any) => {
            // console.log(event);

            setSelectedNodeKey(event.value);
            setSelectedKeys(Object.keys(event.value));
            findKeyName(Object.keys(event.value));
            selectedKeys?.map((key) => { findKeyName(key) });

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
                  <span>
                    {data.nodeType === "Zone" ? (
                      <Button
                        icon="pi pi-pencil"
                        className="p-button-rounded p-button-secondary p-button-text"
                        aria-label="Edit Item"
                        onClick={() => {
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
  )
}

export default SetZoneComponent;