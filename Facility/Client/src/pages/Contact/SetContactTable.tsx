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
import { FilterMatchMode } from 'primereact/api';
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ContactService from "../../services/contact";
import ContactForm from "./Forms/ContactForm";
import ImportContact from "./ImportContact"
import { useAppSelector } from "../../app/hook";
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
  className?: string;
}

interface IColumn {
  field: string;
  header: string;
}

const SetContactTable = () => {
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
    { field: 'country', header: 'Country' },
    { field: 'department', header: 'Department' },
    { field: 'description', header: 'Description' },
    { field: 'organizationCode', header: 'Organization Code' },
    { field: 'postalBox', header: 'Postal Box' },
    { field: 'postalCode', header: 'Postal Code' },
    { field: 'stateRegion', header: 'State Region' },
    { field: 'street', header: 'Street' },
    { field: 'tag', header: 'Tag' },
    { field: 'town', header: 'Town' },
  ];

  const dtRef = useRef(null);
  const [data, setData] = useState<Node[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>("");
  const [selectedNodeId, setSelectedNodeId] = useState<any>("");
  const [loading, setLoading] = useState(false);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    orderBy: "ASC",
    orderByColumn: "email",
    sortField: null || undefined,
    sortOrder: null,
    filters: {
      company: { value: "", matchMode: "contains" }
    }
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
  const [isUpload, setIsUpload] = useState(false);
  const [count, setCount] = useState(0);
  const { t } = useTranslation(["common"]);
  const { toast } = useToast()
  const dt = useRef(null);
  const navigate = useNavigate();
  const menu = useRef(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [isSearchReset, setIsSearchReset] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<IColumn[]>();

  const params = useParams();
  const nodeKey: any = params.id;

  const getContact = () => {
    if (searchKey === "" || isSearchReset === true) {
      setLoading(true);
      ContactService.findAll({
        page: lazyParams.page + 1,
        limit: lazyParams.rows,
        orderBy: lazyParams.sortOrder === 1 ? "ASC" : "DESC",
        orderByColumn: lazyParams.sortField
      })
        .then((response) => {
          console.log(response.data);

          setData(response.data.children);
          setCountFacilities(response.data.totalCount);
          setLoading(false);
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 2000,
          });
          setLoading(false);
        });
    } else {
      ContactService.findSearch({
        page: lazyParams.page + 1,
        limit: lazyParams.rows,
        orderBy: lazyParams.sortOrder === 1 ? "ASC" : "DESC",
        orderByColumn: lazyParams.sortField,
        searchString: searchKey
      })
        .then((response) => {
          console.log(response.data);

          setData(response.data.children);
          setCountFacilities(response.data.totalCount);
          setLoading(false);
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 2000,
          });
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    getContact();
  }, [lazyParams]);

  const onPage = (event: any) => {
    setLazyParams(event)
  };

  const onSort = (event: any) => {
    setLazyParams((prev) => ({ ...prev, ...event }));
  };

  const onFilter = (event: any) => {
    setLazyParams(event);
  };

  const onColumnToggle = (event: any) => {
    let selectedColumns = event.value;
    let orderedSelectedColumns = columns.filter(col => selectedColumns.some((sCol: { field: string; }) => sCol.field === col.field));
    setSelectedColumns(orderedSelectedColumns);
  }

  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label="Add Contact"
          icon="pi pi-plus"
          className="p-button-success mr-2"
          onClick={() => setAddDia(true)}
        />
      </React.Fragment>
    );
  };

  const handleKeyDown = async (event: any) => {

    if (event.key === "Enter") {
      event.preventDefault()
      let _searchKey = await event.target.value;
      setSearchKey(_searchKey);

      ContactService.findSearch({
        page: lazyParams.page + 1,
        limit: lazyParams.rows,
        orderBy: lazyParams.sortOrder === 1 ? "ASC" : "DESC",
        orderByColumn: lazyParams.sortField,
        searchString: _searchKey
      })
        .then((response) => {
          console.log(response.data);

          setData(response.data.children);
          setCountFacilities(response.data.totalCount);
          setLoading(false);
          _searchKey = "";
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 2000,
          });
          setLoading(false);
        });
    }

  }

  const renderSearch = () => {
    return (
      <React.Fragment>
        <div className="flex justify-content-between">
          <h5 className="m-0">{t("Contact Management")}</h5>
          <MultiSelect value={selectedColumns} options={columns} optionLabel="header" onChange={onColumnToggle} placeholder="Select Column" style={{ width: '20em' }} />
          <span className="p-input-icon-left">
            <i className="pi pi-search" />
            <InputText value={globalFilterValue} onKeyDown={handleKeyDown} onChange={onGlobalFilterChange} placeholder="Keyword Search" />
          </span>
        </div>
      </React.Fragment>
    )
  }

  const [filters, setFilters] = useState({
    'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
    'email': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'givenName': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'familyName': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'phone': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'country': { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  });

  const onGlobalFilterChange = async (e: any) => {
    console.log(e);

    const value = e.target.value;
    console.log(value);

    let _filters = { ...filters };
    _filters['global'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);


    // if (value.length === 0) {
    //   setIsSearchReset(true);
    // };
    if (e.target.value === "") {
      setIsSearchReset(true);
      getContact();
    };
  }

  const columnComponents = selectedColumns?.map(col => {
    console.log(col);

    return <Column key={col.field} field={col.field} header={col.header} filter filterField={col.field} sortable />;
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
    console.log(component.id);

    ContactService.remove(component.id)
      .then((response) => {
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Contact Deleted",
          life: 3000,
        });
        setDelDia(false);
        setComponent(emptyComponent);
        getContact(); //loadLazyData();
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
        getContact(); //loadLazyData();
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
            value={data}
            ref={dtRef}
            dataKey="id"
            paginator
            onPage={onPage}
            onSort={onSort}
            first={lazyParams.first}
            responsiveLayout="scroll"
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Contacts"
            rows={lazyParams.rows}
            rowsPerPageOptions={[10, 25, 50]}
            lazy
            totalRecords={countFacilities}
            header={header}
            emptyMessage="Contact not found"
            sortField={lazyParams.sortField}
            sortOrder={lazyParams.sortOrder}
            filterDisplay="row"
            globalFilterFields={['email']}
            onFilter={onFilter}
            onValueChange={filteredData => console.log(filteredData)}
          >
            <Column
              field="email"
              header="Email"
              sortable
              filter
              filterField="email"
            />
            <Column
              field="givenName"
              header="Name"
              sortable
              filter
              filterField="givenName"
            />
            <Column
              field="familyName"
              header="Surname"
              sortable
              filter
              filterField="familyName"
            />
            <Column
              field="phone"
              header="Phone"
              sortable
              filter
              filterField="phone"
            />
            <Column
              field="company"
              header="Company"
              sortable
              filter
              filterField="company"
            />
            {columnComponents}
            <Column
              body={actionBodyTemplate}
              bodyStyle={{ textAlign: "right", overflow: "visible" }}
              exportable={false}
              style={{ minWidth: '8rem' }}
              filter={false}
            />

          </DataTable>
        </div>

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
          style={{ width: "60vw" }}
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
            {data && (
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

export default React.memo(SetContactTable);
