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
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ContactTable, CustomDataTable } from "./ContactComponents";
import ContactService from "../../services/contact";
import ContactForm from "./Forms/ContactForm";
import ImportContact from "./ImportContact"
import { useAppSelector } from "../../app/hook";
import useToast from "../../hooks/useToast";
// import { DenemeChild } from "./ContactComponents/CustomDataTable";


interface Node {
  id: string;
  company: string;
  country: boolean;
  department: boolean;
  description: string;
  email: string;
  familyName: string;
  tag: string[];
  givenName: string;
  name: string;
  organizationCode: string;
  phone: string;
  postalBox: string;
  postalCode: string;
  stateRegion: string;
  street: string;
  town: string;
  cantDeleted: boolean;
  isActive: boolean;
  isDeleted: boolean;
  key: string;
  realm: string;
  children: Node[];
}

interface IColumn {
  field: string;
  header: string;
}

const SetContactTable = () => {
  let emptyContact = {
    id: "",
    company: "",
    country: "",
    department: "",
    description: "",
    email: "",
    familyName: "",
    givenName: "",
    name: "",
    organizationCode: "",
    phone: "",
    postalBox: "",
    postalCode: "",
    stateRegion: "",
    street: "",
    tag: [],
    town: "",
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
  const dtRef = useRef<any>(null);
  const [data, setData] = useState<Node[]>([]);
  const [selectedNodeKey, setSelectedNodeKey] = useState<any>("");
  const [selectedNodeId, setSelectedNodeId] = useState<any>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    orderBy: "ASC",
    orderByColumn: "email",
    sortField: null || undefined,
    sortOrder: null,
    filters: {
    }
  });
  const [countContacts, setCountContacts] = useState(0);
  const [addDia, setAddDia] = useState<boolean>(false);

  const [editDia, setEditDia] = useState<boolean>(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const [delAllDia, setDelAllDia] = useState<boolean>(false);
  const [contact, setContact] = useState(emptyContact);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isUpdate, setIsUpdate] = useState<boolean>(false);
  const [isUpload, setIsUpload] = useState<boolean>(false);
  const { t } = useTranslation(["common"]);
  const { toast } = useToast()
  const navigate = useNavigate();
  const menu = useRef(null);
  const [globalFilterValue, setGlobalFilterValue] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<IColumn[]>(columns);
  const [importDia, setImportDia] = useState<boolean>(false);
  const language = useAppSelector((state) => state.language.language);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedDataKeys, setSelectedDataKeys] = useState([]);


  const getContact = () => {
    if (searchKey === "") {
      setLoading(true);
      ContactService.findAll({
        page: lazyParams.page + 1,
        limit: lazyParams.rows,
        orderBy: lazyParams.sortOrder === 1 ? "ASC" : "DESC",
        orderByColumn: lazyParams.sortField
      })
        .then((response) => {
          setData(response.data.children);
          setCountContacts(response.data.totalCount);
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
          setData(response.data.children);
          setCountContacts(response.data.totalCount);
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

  const getContactReset = async () => {
    if (dtRef.current !== null) {
      dtRef.current.reset();
    }
    setGlobalFilterValue("");
    setSearchKey(""); //-------------ekle
    setLoading(true);
    ContactService.findAll({
      page: lazyParams.page + 1,
      limit: lazyParams.rows,
      orderBy: lazyParams.sortOrder === 1 ? "ASC" : "DESC",
      orderByColumn: lazyParams.sortField
    })
      .then((response) => {
        setData(response.data.children);
        setCountContacts(response.data.totalCount);
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
  };

  useEffect(() => {
    getContact();
    setSelectedData(null);
    setSelectedDataKeys([]);
  }, [lazyParams]);

  useEffect(() => {
    console.log("selected columns:", selectedColumns)
    setSelectedColumns([]);
  }, []);

  const matchModes = [
    { label: t("Starts With"), value: FilterMatchMode.STARTS_WITH },
    { label: t("Contains"), value: FilterMatchMode.CONTAINS }
  ];

  const onPage = (event: any) => {
    console.log("-----onpage")
    setLazyParams(event)
  };

  useEffect(() => {
    console.log("lazy params----", lazyParams);
  },[lazyParams])
  const onSort = (event: any) => {
    console.log("-----onSort")
    setLazyParams((prev) => { console.log("prev", prev); console.log("event", event); return ({ ...prev, ...event })});
  };

  // const onFilter = (event: any) => {
  //   console.log(event.filters);
  //   setFilters(event.filters);
  //   setLazyParams(event);
  // };

  const onColumnToggle = (event: any) => {
    let selectedColumns = event.value;
    let orderedSelectedColumns = columns.filter(col => selectedColumns.some((sCol: { field: string; }) => sCol.field === col.field));
    setSelectedColumns(orderedSelectedColumns);
  }

  const leftToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label={t("Add Contact")}
          icon="pi pi-plus"
          className="p-button-success mr-2"
          onClick={() => setAddDia(true)}
        />

        {selectedDataKeys.length > 1 && (
          <Button
            label={t("Delete")}
            icon="pi pi-trash"
            className="p-button-danger mr-2"
            onClick={() => setDelAllDia(true)}
          />)}
      </React.Fragment>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <React.Fragment>
        <Button
          label={t("Import Contact")}
          icon="pi pi-upload"
          className="p-button"
          onClick={() => setImportDia(true)}
        />
      </React.Fragment>
    );
  };

  const filterClearTemplate = (options: any) => {
    return (
      <Button
        type="button"
        icon="pi pi-times"
        label={t("Clear")}
        onClick={() => options.filterClearCallback()}
        className="p-button-text"
      />
    );
  };

  const filterApplyTemplate = (options: any) => {
    return (
      <Button
        type="button"
        icon="pi pi-check"
        label={t("Apply")}
        onClick={options.filterApplyCallback}
        className="p-button-sm"
      />
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
          setData(response.data.children);
          setCountContacts(response.data.totalCount);
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
        <div className="flex justify-content-between align-items-center justify-content-center">
          <div>
            <h5 className="m-0">{t("Contact Management")}</h5>
          </div>
          <div className="flex">
            <div className="m-2">
              <MultiSelect value={selectedColumns} options={columns} optionLabel="header" /*onChange={onColumnToggle}*/ placeholder={t("Select Column")} style={{ width: '20em' }} />
            </div>
            <div className="m-2">
              <span className="p-input-icon-left">
                <i className="pi pi-search" />
                <InputText value={globalFilterValue} onKeyDown={handleKeyDown} onChange={onGlobalFilterChange} placeholder={t("Search")} />
              </span>
            </div>
            <div className="m-2">
              <Button type="button" icon="pi pi-filter-slash" label={t("Clear")} className="p-button-outlined" onClick={getContactReset} />
            </div>
          </div>
        </div>
      </React.Fragment>
    )
  }

  // const [filters, setFilters] = useState({
  //   'global': { value: null, matchMode: FilterMatchMode.CONTAINS },
  //   'email': { value: null, matchMode: FilterMatchMode.CONTAINS },
  //   'givenName': { value: null, matchMode: FilterMatchMode.CONTAINS },
  //   'familyName': { value: null, matchMode: FilterMatchMode.CONTAINS },
  //   'phone': { value: null, matchMode: FilterMatchMode.CONTAINS },
  //   'country': { value: null, matchMode: FilterMatchMode.CONTAINS }
  // });

  const onGlobalFilterChange = async (e: any) => { //eklendi
    const value = e.target.value;

    // let _filters = { ...filters };
    // _filters['global'].value = value;

    // setFilters(_filters);
    setGlobalFilterValue(value);


    if (e.target.value === "") {
      getContactReset();
      setSearchKey("");
    };
  }

  // const initFilters = () => {
  //   setFilters({
  //     'email': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }]  },
  //   });
  // }

  const onFilterApplyClick = (e: any) => {
    let _searchKey = e.constraints.constraints[0].value;

    setSearchKey(_searchKey);
    ContactService.findSearchByColumn({
      page: lazyParams.page + 1,
      limit: lazyParams.rows,
      orderBy: lazyParams.sortOrder === 1 ? "ASC" : "DESC",
      orderByColumn: lazyParams.sortField,
      searchColumn: e.field,
      searchString: _searchKey
    })
      .then((response) => {
        setData(response.data.children);
        setCountContacts(response.data.totalCount);
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

  const columnComponents = selectedColumns?.map(col => {
    return <Column
      key={col.field}
      field={col.field}
      header={col.header}
      filter
      filterField={col.field}
      sortable
      filterMatchModeOptions={matchModes}
      onFilterApplyClick={onFilterApplyClick}
      onFilterClear={getContactReset}
      showFilterOperator={false}
      filterPlaceholder={t("Search")}
      filterClear={filterClearTemplate}
      filterApply={filterApplyTemplate}
      showAddButton={false}
    />;
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

  const deleteContact = () => {
    ContactService.remove(contact.id)
      .then((response) => {
        toast.current.show({
          severity: "success",
          summary: "Successful",
          detail: "Contact Deleted",
          life: 3000,
        });
        setDelDia(false);
        setContact(emptyContact);
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
        setContact(emptyContact);
        getContact(); //loadLazyData();
      });
  };

  const deleteDialogFooter = (
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
        onClick={deleteContact}
      />
    </React.Fragment>
  );

  const deleteAllDialogFooter = (
    <React.Fragment>
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDelAllDia(false)}
      />
      <Button
        label="Yes"
        icon="pi pi-check"
        className="p-button-text"
        onClick={() => console.log("yes")}
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
          setContact(rowData);
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
          <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate}></Toolbar>
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
            currentPageReportTemplate={t("Showing {first} to {last} of {totalRecords} Contacts")}
            rows={lazyParams.rows}
            rowsPerPageOptions={[10, 25, 50]}
            lazy
            totalRecords={countContacts}
            header={header}
            emptyMessage="Contact not found"
            sortField={lazyParams.sortField}
            sortOrder={lazyParams.sortOrder}
            // filterDisplay="menu"
            // showGridlines
            loading={loading}
            selectionMode="checkbox"
            selection={selectedData}
            onSelectionChange={e => {
              setSelectedData(e.value);
              setSelectedDataKeys(e.value.map((item: any) => item.key));
            }}


          // onFilter={onFilter}
          // filters={filters}
          >



            <Column
              selectionMode="multiple"
              headerStyle={{ width: '3em' }}>
            </Column>

            <Column
              field="email"
              header="Email"
              sortable
              filter
              filterField="email"
              filterMatchModeOptions={matchModes}
              onFilterApplyClick={onFilterApplyClick}
              onFilterClear={getContactReset}
              showFilterOperator={false}
              filterPlaceholder={t("Search")}
              filterClear={filterClearTemplate}
              filterApply={filterApplyTemplate}
              showAddButton={false}
            />
            <Column
              field="givenName"
              header="Name"
              sortable
              filter
              filterField="givenName"
              filterMatchModeOptions={matchModes}
              onFilterApplyClick={onFilterApplyClick}
              onFilterClear={getContactReset}
              showFilterOperator={false}
              filterPlaceholder={t("Search")}
              filterClear={filterClearTemplate}
              filterApply={filterApplyTemplate}
              showAddButton={false}
            />
            <Column
              field="familyName"
              header="Surname"
              sortable
              filter
              filterField="familyName"
              filterMatchModeOptions={matchModes}
              onFilterApplyClick={onFilterApplyClick}
              onFilterClear={getContactReset}
              showFilterOperator={false}
              filterPlaceholder={t("Search")}
              filterClear={filterClearTemplate}
              filterApply={filterApplyTemplate}
              showAddButton={false}

            />
            <Column
              field="phone"
              header="Phone"
              sortable
              filter
              filterField="phone"
              filterMatchModeOptions={matchModes}
              onFilterApplyClick={onFilterApplyClick}
              onFilterClear={getContactReset}
              showFilterOperator={false}
              filterPlaceholder={t("Search")}
              filterClear={filterClearTemplate}
              filterApply={filterApplyTemplate}
              showAddButton={false}
            />
            <Column
              field="company"
              header="Company"
              sortable
              filter
              filterField="company"
              filterMatchModeOptions={matchModes}
              onFilterApplyClick={onFilterApplyClick}
              onFilterClear={getContactReset}
              showFilterOperator={false}
              filterPlaceholder={t("Search")}
              filterClear={filterClearTemplate}
              filterApply={filterApplyTemplate}
              showAddButton={false}
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

          {/* <ContactTable
            value={data}
            rows={lazyParams.rows}
            body={actionBodyTemplate}
            handleFind={handleKeyDown}
            handleReset={getContactReset}
            loading={loading}
            ref={dtRef}
            onSort={onSort}
            onPage={onPage}


            filterMatchModeOptions={matchModes}
            onFilterApplyClick={onFilterApplyClick}
            onFilterClear={getContactReset}
            filterClear={filterClearTemplate}
            filterApply={filterApplyTemplate}
          /> */}
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
          footer={deleteDialogFooter}
          onHide={() => setDelDia(false)}
        >
          <div className="confirmation-content">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {data && (
              <span>
                Are you sure you want to delete <b>{contact.email}</b>?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          visible={delAllDia}
          style={{ width: "450px" }}
          header="Confirm"
          modal
          footer={deleteAllDialogFooter}
          onHide={() => setDelAllDia(false)}
        >
          <div className="confirmation-content">
            <i
              className="pi pi-exclamation-triangle mr-3"
              style={{ fontSize: "2rem" }}
            />
            {data && (
              <span>
                Are you sure you want to delete selected contacts?
              </span>
            )}
          </div>
        </Dialog>

        <Dialog
          header={t("Import Contact")}
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
      </div>
    </div>
  );
};

export default React.memo(SetContactTable);
