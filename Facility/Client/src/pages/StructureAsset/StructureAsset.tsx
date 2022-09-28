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

const StructureAsset = () => {
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

  return (
    <div className="container">
  
      <h1>{t("Structure Asset Management")}</h1>
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

                    {
                      data.nodeType === "Space" && (
                        <>
                          <Button
                            icon="pi pi-pencil"
                            className="p-button-rounded p-button-secondary p-button-text"
                            aria-label="Edit Item"
                            onClick={() => {
                              setSelectedNodeKey(data.key);
                              let dataKey: any = data.key;
                              navigate(`/structure-asset/${dataKey}`);
                            }}
                            title={t("Edit Assets")}
                          />

                          {/* <Button
                            icon="pi pi-eye"
                            className="p-button-rounded p-button-secondary p-button-text"
                            aria-label="Display Item"
                            onClick={() => {
                              setSelectedNodeKey(data.key);
                              setDisplay(true);
                              setDisplayKey(data.key);
                            }}
                            title={t("Show Assets")}
                          /> */}
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

export default StructureAsset;
