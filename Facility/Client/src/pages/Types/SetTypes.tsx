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
import TypeForm from "./Forms/TypeForm";

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

const SetTypes = () => {
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
        console.log(res.data);
        setTypes(res.data);
      })
      .catch((err) => {
        if (types.length === 0) {
          setTypes([])
        }
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

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h5 className="m-0">Types Editing</h5>
      {/* <span className="block mt-2 md:mt-0">
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
        <Button icon="pi pi-search" className="ml-1" />
      </span> */}
    </div>
  );


  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label="Add Type"
          icon="pi pi-plus"
          className="p-button-success mr-2"
          onClick={() => setAddDia(true)}
        />
      </React.Fragment>
    );
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

  const deleteType = () => {
    TypesService.remove(type.id)
      .then((response) => {
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Type Deleted",
          life: 3000,
        });
        setDelDia(false);
        setType(emptyType);
        getTypes(); //loadLazyData();
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
        setDelDia(false);
        setType(emptyType);
        getTypes(); //loadLazyData();
      });
  };

  const deleteTypeDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDelDia(false)}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        className="p-button-text"
        onClick={deleteType}
      />
    </React.Fragment>
  );

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

  return (
    <div className="grid crud-demo">
      <div className="col-12">
        <div className="card">
          <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

          <DataTable
            value={types}
            dataKey="id"
            paginator
            responsiveLayout="scroll"
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Types"
            rows={15}
            rowsPerPageOptions={[15, 25, 50]}
            header="Types"
            emptyMessage="Type not found"
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
            <Column
              body={actionBodyTemplate}
              exportable={false}
              style={{ minWidth: '8rem' }}
            />
          </DataTable>
        </div>

        <Dialog
          header={t("Add New Item")}
          visible={addDia}
          style={{ width: "80vw" }}
          footer={renderFooterAdd}
          className="dial"
          onHide={() => {
            setAddDia(false);
          }}
        >
          <TypeForm
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            selectedNodeId={selectedNodeId}
            editDia={editDia}
            getTypes={getTypes}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
          />
        </Dialog>

        <Dialog
          header={t("Edit Item")}
          visible={editDia}
          style={{ width: "80vw" }}
          footer={renderFooterEdit}
          onHide={() => {
            setEditDia(false);
          }}
        >
          <TypeForm
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            selectedNodeId={selectedNodeId}
            editDia={editDia}
            getTypes={getTypes}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
          />
        </Dialog>

        <Dialog
          visible={delDia}
          style={{ width: "450px" }}
          header="Confirm"
          modal
          footer={deleteTypeDialogFooter}
          onHide={() => setDelDia(false)}
        >
          <div className="confirmation-content">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {types && (
              <span>
                Are you sure you want to delete <b>{type.name}</b>?
              </span>
            )}
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default React.memo(SetTypes);
