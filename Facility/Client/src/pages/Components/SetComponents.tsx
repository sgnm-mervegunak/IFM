import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TypesService from "../../services/types";
import FacilityService from "../../services/facility";
import DefineFacility from "../../components/Facility/DefineFacility";
import { useAppSelector } from "../../app/hook";
import ComponentForm from "./Forms/ComponentForm";

interface ITypes {
  accessibilityPerformance: string;
  assetType: string;
  canDelete: boolean;
  category: string;
  codePerformance: string;
  color: string;
  constituents: string;
  createdAt: string;
  description: string;
  documents: string;
  durationUnit: string;
  expectedLife: string;
  features: string;
  finish: string;
  id: string;
  images: string;
  isActive: boolean;
  isDeleted: boolean;
  key: string;
  material: string;
  modelNo: string;
  modelReference: string;
  name: string;
  nominalHeight: string;
  nominalLength: string;
  nominalWidth: string;
  replacementCost: number;
  shape: string;
  size: string;
  sustainabilityPerformance: string;
  tags: [],
  updatedAt: string;
  warranty: string;
  warrantyDurationLabor: number;
  warrantyDurationParts: number;
  warrantyDurationUnit: string;
  warrantyGuarantorLabor: string;
  warrantyGuarantorParts: string;

}

const SetComponents = () => {
  let emptyType = {
    accessibilityPerformance: "",
    assetType: "",
    canDelete: "",
    category: "",
    codePerformance: "",
    color: "",
    constituents: "",
    createdAt: "",
    description: "",
    documents: "",
    durationUnit: "",
    expectedLife: "",
    features: "",
    finish: "",
    id: "",
    images: "",
    isActive: "",
    isDeleted: "",
    key: "",
    material: "",
    modelNo: "",
    modelReference: "",
    name: "",
    nominalHeight: "",
    nominalLength: "",
    nominalWidth: "",
    replacementCost: "",
    shape: "",
    size: "",
    sustainabilityPerformance: "",
    tags: [],
    updatedAt: "",
    warranty: "",
    warrantyDurationLabor: "",
    warrantyDurationParts: "",
    warrantyDurationUnit: "",
    warrantyGuarantorLabor: "",
    warrantyGuarantorParts: "",
  };

  const [types, setTypes] = useState<ITypes[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>("");
  const [selectedNodeId, setSelectedNodeId] = useState<any>("");
  const [loading, setLoading] = useState(false);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
  });
  const [deleteTypeDialog, setDeleteTypeDialog] = useState(false);
  const [typeDialog, setTypeDialog] = useState(false);
  const [countFacilities, setCountFacilities] = useState(0);
  const [addDia, setAddDia] = useState(false);
  const [editDia, setEditDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const [type, setType] = useState(emptyType);
  const [submitted, setSubmitted] = useState(false);
  const [isUpdate, setIsUpdate] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isUpload, setIsUpload] = useState(false);
  const [count, setCount] = useState(0);
  const { t } = useTranslation(["common"]);
  const { toast } = useAppSelector((state) => state.toast);
  const dt = useRef(null);
  const navigate = useNavigate();
  const menu = useRef(null);

  const getTypes = () => {
    TypesService.findAll()
      .then((res) => {
        setTypes(res.data);
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
    getTypes();
  }, []);

  const renderSearch = () => {
    return (
      <React.Fragment>
        <div className="flex justify-content-between">
          <h5 className="m-0">Types</h5>
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={globalFilter} onChange={(e) => { setGlobalFilter(e.target.value) }} placeholder="Search" />
          </span>
        </div>
      </React.Fragment>
    )
  }

  const actionBodyTemplate = (rowData: any) => {
    return (
      <React.Fragment>
        <Button icon="pi pi-pencil" className="p-button-rounded p-button-success mr-2" onClick={() => {
          setIsUpdate(true);
          setEditDia(true);
          setSelectedNodeKey(rowData.key);
          setSelectedNodeId(rowData.id);
        }} />
        <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => {
          setType(rowData);
          setDelDia(true)
        }} />
      </React.Fragment>
    );
  }

  const header = renderSearch();

  return (
    <div className="grid crud-demo">
      <div className="col-12">
        <div className="card">

          <DataTable
            value={types}
            dataKey="id"
            paginator
            responsiveLayout="scroll"
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Types"
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            header={header}
            emptyMessage="Type not found"
            globalFilter={globalFilter}
            selectionMode="single"
            onSelectionChange={(e) => {
              navigate("/asset-components/" + e.value.key);
            }}
          >
            <Column
              field="name"
              header="Name"
              sortable
              style={{ width: "20%" }}
            />
            <Column
              field="assetType"
              header="Asset Type"
              sortable
              style={{ width: "20%" }}
            />
            <Column
              field="category"
              header="Category"
              sortable
              style={{ width: "20%" }}
            />
            <Column
              field="modelNo"
              header="Model No"
              sortable
              style={{ width: "20%" }}
            />
          </DataTable>
        </div>

      </div>
    </div>
  );
};

export default React.memo(SetComponents);
