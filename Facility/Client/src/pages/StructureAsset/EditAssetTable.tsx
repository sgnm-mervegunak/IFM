import React, { useState, useEffect, useRef } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import StructureAssetService from "../../services/structureAsset";
import ComponentService from "../../services/components";
import FacilityStructureService from "../../services/facilitystructure";
import DefineFacility from "../../components/Facility/DefineFacility";
import { useAppSelector } from "../../app/hook";
import ComponentForm from "./Forms/ComponentForm";
import { log } from "console";

interface Params {
  selectedNodeKeySpace: string;
}

interface IComponents {
  name: string;
  space: string;
  createdBy: string;
  spaceType: string;
  parentKey: string;
  description: string;
  serialNo: string;
  tagNumber: string;
  barCode: string;
  assetIdentifier: string;
  warrantyGuarantorParts: string;
  warrantyDurationParts: number;
  warrantyGuarantorLabor: string;
  warrantyDurationLabor: number;
  warrantyDurationUnit: string;
  tag: string[];
  documents: string;
  images: string;
  id: string;
}

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
  _type?: string;
}

interface IColumn {
  field: string;
  header: string;
}

const SetTypes = ({ selectedNodeKeySpace }: Params) => {
  let emptyComponent = {
    name: "",
    space: "",
    createdBy: "",
    spaceType: "",
    parentKey: "",
    description: "",
    serialNo: "",
    tagNumber: "",
    barCode: "",
    assetIdentifier: "",
    warrantyGuarantorParts: "",
    warrantyDurationParts: "",
    warrantyGuarantorLabor: "",
    warrantyDurationLabor: "",
    warrantyDurationUnit: "",
    tag: [],
    documents: "",
    images: "",
    id: "",
  };

  const columns = [
    { field: 'barCode', header: 'Barcode' },
    { field: 'description', header: 'Description' },
    { field: 'serialNo', header: 'Serial No' },
    { field: 'space', header: 'Space' },
    { field: 'warrantyDurationLabor', header: 'Warranty Duration Labor' },
    { field: 'warrantyDurationParts', header: 'Warranty Duration Parts' },
    { field: 'warrantyDurationUnit', header: 'Warranty Duration Unit' },
    { field: 'warrantyGuarantorLabor', header: 'Warranty Guarantor Labor' },
    { field: 'warrantyGuarantorParts', header: 'Warranty Guarantor Parts' },
    { field: 'warrantyStartDate', header: 'Warranty Start Date' },
    { field: 'installationDate', header: 'Installation Date' },
    { field: 'documents', header: 'Documents' },
    { field: 'images', header: 'Images' },
  ];

  const [components, setComponents] = useState<IComponents[]>([]);
  const [allComponents, setAllComponents] = useState<Node[]>([]);
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
  const [component, setComponent] = useState(emptyComponent);
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
  const [spaceName, setSpaceName] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<IColumn[]>();




  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.label = i.name;
    }
  };

  const getComponents = () => {

    StructureAssetService.findAll(selectedNodeKeySpace)
      .then((res) => {
        console.log(res.data);

        setComponents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 3000,
        });
        setLoading(false);
      });
  };



  useEffect(() => {
    getComponents();
  }, [selectedNodeKeySpace]);

  useEffect(() => {
    FacilityStructureService.nodeInfo(selectedNodeKeySpace)
      .then(async (res) => {
        setSpaceName(res.data.properties.name);
        setLoading(false);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
        setLoading(false);
      });
  }, [selectedNodeKeySpace])

  const onColumnToggle = (event: any) => {
    let selectedColumns = event.value;
    let orderedSelectedColumns = columns.filter(col => selectedColumns.some((sCol: { field: string; }) => sCol.field === col.field));
    setSelectedColumns(orderedSelectedColumns);
  }

  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label="Add Component"
          icon="pi pi-plus"
          className="p-button-success mr-2"
          onClick={() => setAddDia(true)}
        />
      </React.Fragment>
    );
  };

  const renderSearch = () => {
    return (
      <React.Fragment>

        <div className="flex justify-content-between">
          <h5 className="m-0">Space Name : {spaceName}</h5>
          <MultiSelect value={selectedColumns} options={columns} optionLabel="header" onChange={onColumnToggle} placeholder="Select Column" style={{ width: '20em' }} />
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={globalFilter} onChange={(e) => { setGlobalFilter(e.target.value) }} placeholder="Search" />
          </span>
        </div>
      </React.Fragment>
    )
  }

  const columnComponents = selectedColumns?.map(col => {
    return <Column key={col.field} field={col.field} header={col.header} />;
  });

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
    StructureAssetService.remove(component.id)
      .then((response) => {
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Component Deleted",
          life: 3000,
        });
        setDelDia(false);
        setComponent(emptyComponent);
        getComponents(); //loadLazyData();
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
        setDelDia(false);
        setComponent(emptyComponent);
        getComponents(); //loadLazyData();
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
          setComponent(rowData);
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
          <Toolbar className="mb-4" left={leftToolbarTemplate}></Toolbar>

          <DataTable
            value={components}
            dataKey="id"
            paginator
            responsiveLayout="scroll"
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Components"
            rows={10}
            rowsPerPageOptions={[10, 25, 50]}
            header={header}
            emptyMessage="Component not found"
            globalFilter={globalFilter}
            style={{ height: '600px' }}
          >
            <Column
              field="name"
              header="Name"
              sortable
              // style={{ width: "20%" }}
            />
            <Column
              field="assetIdentifier"
              header="Asset Identifier"
              sortable
              // style={{ width: "20%" }}
            />
         
            {columnComponents}
            {/* <Column
              body={actionBodyTemplate}
              exportable={false}
              style={{ minWidth: '8rem' }}
            /> */}
          </DataTable>
        </div>

        <Dialog
          header={t("Add New Item")}
          visible={addDia}
          style={{ width: "30vw" }}
          footer={renderFooterAdd}
          className="dial"
          onHide={() => {
            setAddDia(false);
          }}
        >
          <ComponentForm
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            selectedNodeId={selectedNodeId}
            editDia={editDia}
            getComponents={getComponents}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            spaceKey={selectedNodeKeySpace}
          // parentKey={nodeKey}
          />
        </Dialog>

        <Dialog
          header={t("Edit Item")}
          visible={editDia}
          style={{ width: "60vw" }}
          footer={renderFooterEdit}
          onHide={() => {
            setEditDia(false);
          }}
        >
          <ComponentForm
            submitted={submitted}
            setSubmitted={setSubmitted}
            selectedNodeKey={selectedNodeKey}
            selectedNodeId={selectedNodeId}
            editDia={editDia}
            getComponents={getComponents}
            setAddDia={setAddDia}
            setEditDia={setEditDia}
            isUpdate={isUpdate}
            setIsUpdate={setIsUpdate}
            spaceKey={selectedNodeKeySpace}
          // parentKey={nodeKey}
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
            {components && (
              <span>
                Are you sure you want to delete <b>{component.name}</b>?
              </span>
            )}
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default React.memo(SetTypes);
