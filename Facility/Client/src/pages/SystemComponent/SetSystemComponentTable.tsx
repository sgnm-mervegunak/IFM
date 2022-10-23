import React, {useEffect, useRef, useState} from "react";
import {useTranslation} from "react-i18next";
import SystemsService from "../../services/systems";
import SystemComponentService from "../../services/systemComponent"
import useToast from "../../hooks/useToast";
import {Dropdown} from 'primereact/dropdown';
import {Column} from "primereact/column";
import {DataTable} from "primereact/datatable";
import {MultiSelect} from "primereact/multiselect";
import {FilterMatchMode} from "primereact/api";
import {Button} from "primereact/button";
import {Dialog} from "primereact/dialog";
import { Toolbar } from "primereact/toolbar";
import {usePrevious} from "primereact";
import ContactService from "../../services/contact";

interface IColumn {
    field: string;
    header: string;
}
const SetSystemComponentTable = () => {

    const columns = [
        {field: 'serialNo', header: 'Serial Number'},
        {field: 'updatedAt', header: 'Updated At'}
    ];


    const {t} = useTranslation(["common"]);
    const {toast} = useToast();
    const [data, setData] = useState();
    const [selectedSystem, setSelectedSystem] = useState({key: ""});
    const [components, setComponents] = useState([""]);
    const [component, setComponent] = useState<string[]>([]);
    const [selectedData, setSelectedData] = useState(null);
    const [selectedDataKeys, setSelectedDataKeys] = useState([]);
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const dtRef = useRef<any>(null);
    const [delDia, setDelDia] = useState<boolean>(false);
    const [delAllDia, setDelAllDia] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchKey, setSearchKey] = useState("");
    const [lazyParams, setLazyParams] = useState({
        first: 0,
        rows: 10,
        page: 0,
        orderBy: "ASC",
        orderByColumn: ["name"],
        sortField: null || undefined,
        sortOrder: null,
        filters: {
        }
    });
    const [countComponents, setCountComponents] = useState(0);
    const [selectedColumns, setSelectedColumns] = useState<IColumn[]>(columns);
    const [filters, setFilters] = useState({
        'name': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    });

    useEffect(() => {
        //getSystems();
        if (selectedSystem.key !== ""){
            getComponentsBySystem();
        }
        setSelectedData(null);
        setSelectedDataKeys([]);
    }, [lazyParams]);
    useEffect(() => {
        setSelectedColumns([]);
        getSystems();
    }, [])

    useEffect(() => {
        console.log("selected system ", selectedSystem)
        console.log("selecdted system key", selectedSystem.key)
        if (selectedSystem.key) {
            getComponentsBySystem();
        }
    }, [selectedSystem])

    const getSystems = () => {
        SystemsService.findOne()
            .then((res) => {
                console.log(res)
                setData(res.data.root.children);
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
    const matchModes = [
        { label: t("Starts With"), value: FilterMatchMode.STARTS_WITH },
        { label: t("Contains"), value: FilterMatchMode.CONTAINS }
    ];
    const getComponentsBySystem = () => {
        SystemComponentService.findComponentsIncludedBySystem(selectedSystem.key, {
            page: lazyParams.page + 1,
            limit: lazyParams.rows,
            orderBy: lazyParams.sortOrder === 1 ? "ASC" : "DESC",
            orderByColumn: lazyParams.sortField ? [lazyParams.sortField] : [],
        })
            .then((res) => {
                setComponents([...res.data.properties])
                setCountComponents(res.data.totalCount.totalCount)
                setLoading(false);
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
    const columnComponents = selectedColumns?.map(col => {
        return <Column
            key={col.field}
            field={col.field}
            header={col.header}
            filter
            filterField={col.field}
            sortable
            // filterMatchModeOptions={matchModes}
            // onFilterApplyClick={onFilterApplyClick}
            // onFilterClear={getContactReset}
            // showFilterOperator={false}
            // filterPlaceholder={t("Search")}
            // filterClear={filterClearTemplate}
            // filterApply={filterApplyTemplate}
            showAddButton={false}
        />;
    });

    const onColumnToggle = (e: any) => {
        setSelectedColumns(e.value)
    }

    const renderSearch = () => {
        return (
            <React.Fragment>
                <div className="flex justify-content-between">
                    <h5 className="m-0">{t("System Component Management")}</h5>
                    {/*TODO: dil desteği ekle*/}
                    <MultiSelect value={selectedColumns} options={columns}
                                 optionLabel="header"
                                 onChange={onColumnToggle} placeholder="Select Column" style={{width: '20em'}}/>
                    {/*          <span className="p-input-icon-left">*/}
                    {/*  <i className="pi pi-search"/>*/}
                    {/*  <InputText value={globalFilterValue} onKeyDown={handleKeyDown} onChange={onGlobalFilterChange}*/}
                    {/*             placeholder="Keyword Search"/>*/}
                    {/*</span>*/}
                </div>
            </React.Fragment>
        )
    }
    const onSort = (event: any) => {
        setLazyParams((prev) => ({...prev, ...event}));
    };
    const onPage = (event: any) => {
        setLazyParams(event)
    };

    const deleteAllComponent = () => {
        SystemComponentService.remove(selectedSystem.key.toString(), selectedDataKeys)
            .then((response) => {
                toast.current.show({
                    severity: "success",
                    summary: "Successful",
                    detail: "Components Deleted",
                    life: 3000,
                });
                setDelAllDia(false);
                setSelectedDataKeys([]);
                getComponentsBySystem();

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
    const deleteComponent = () => {
        SystemComponentService.remove(selectedSystem.key.toString(), component)
            .then((response) => {
                console.log(component, "///selected data keyss//")
                toast.current.show({
                    severity: "success",
                    summary: "Successful",
                    detail: "Component Deleted",
                    life: 3000,
                });
                 setDelDia(false);
                getComponentsBySystem();
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
                onClick={deleteAllComponent}
            />
        </React.Fragment>
    );
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
                onClick={deleteComponent}
            />
        </React.Fragment>
    );
    const actionBodyTemplate = (rowData: any) => {
        return (
            <React.Fragment>
                <Button icon="pi pi-trash" className="p-button-rounded p-button-warning" onClick={() => {
                    // setComponent(
                    //     (prevState)=>[...prevState,rowData.key]
                    // );
                    setComponent([rowData.key]);
                    setDelDia(true)
                }} />
            </React.Fragment>
        );
    }

    const leftToolbarTemplate = () => {
        return (
            <React.Fragment>
                <Dropdown
                    optionLabel="name"
                    value={selectedSystem}
                    options={data}
                    onChange={(e: any) => setSelectedSystem(e.value)}
                    placeholder="Select Systems"
                />

                {selectedDataKeys.length > 1 && (
                    <div style={{ marginLeft: '8px' }}>
                        <Button
                            label={t("Delete")}
                            icon="pi pi-trash"
                            className="p-button-danger mr-2"
                            onClick={() => {setDelAllDia(true)}
                            }
                        />
                    </div>
                    )}
            </React.Fragment>
        );
    };

    return (
        <div className="grid crud-demo">
            <div className="col-12">
                <div className="card">
                    <Toolbar className="mb-4" left={leftToolbarTemplate} ></Toolbar>


            <DataTable
                value={components}
                dataKey="id" //TODO
                ref={dtRef}
                paginator
                onPage={onPage}
                onSort={onSort}
                first={lazyParams.first}
                responsiveLayout="scroll"
                paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} Components"
                rows={lazyParams.rows}
                rowsPerPageOptions={[10, 25, 50]}
                lazy
                totalRecords={countComponents}
                header={renderSearch}
                emptyMessage="Component not found"
                sortField={lazyParams.sortField}
                sortOrder={lazyParams.sortOrder}
                filterDisplay="menu"
                showGridlines
                loading={loading}
                selectionMode="checkbox"
                selection={selectedData}
                onSelectionChange={e => {
                    setSelectedData(e.value);
                    setSelectedDataKeys(e.value.map((item: any) => item.key));
                }}
                // filters={filters}
            >
                <Column
                    selectionMode="multiple"
                    headerStyle={{ width: '3em' }}>
                </Column>
                <Column
                    field="name"
                    header="Name"
                    sortable
                    filter
                    filterField="name"
                    filterMatchModeOptions={matchModes}
                    filterPlaceholder={t("Search")}
                    showFilterOperator={false}
                    showAddButton={false}
                    // onFilterApplyClick={onFilterApplyClick}
                    // onFilterClear={getContactReset}
                    // filterClear={filterClearTemplate}
                    // filterApply={filterApplyTemplate}

                />
                <Column
                    field="description"
                    header="Description"
                    sortable
                    filter
                    filterField="description"
                    filterMatchModeOptions={matchModes}
                    filterPlaceholder={t("Search")}
                    showFilterOperator={false}
                    showAddButton={false}
                    // onFilterApplyClick={onFilterApplyClick}
                    // onFilterClear={getContactReset}
                    // filterClear={filterClearTemplate}
                    // filterApply={filterApplyTemplate}

                />
                <Column
                    field="createdAt"
                    header="Created At"
                    sortable
                    filter
                    filterField="createdAt"
                    filterMatchModeOptions={matchModes}
                    filterPlaceholder={t("Search")}
                    showFilterOperator={false}
                    showAddButton={false}
                    // onFilterApplyClick={onFilterApplyClick}
                    // onFilterClear={getContactReset}
                    // filterClear={filterClearTemplate}
                    // filterApply={filterApplyTemplate}

                />
                <Column
                    field="barCode"
                    header="Barcode"
                    sortable
                    filter
                    filterField="barCode"
                    filterMatchModeOptions={matchModes}
                    filterPlaceholder={t("Search")}
                    showFilterOperator={false}
                    showAddButton={false}
                    // onFilterApplyClick={onFilterApplyClick}
                    // onFilterClear={getContactReset}
                    // filterClear={filterClearTemplate}
                    // filterApply={filterApplyTemplate}

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
                Are you sure you want to delete ?
              </span>
                        )}
                    </div>
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
                Are you sure you want to delete ?
              </span>
                    )}
                </div>
            </Dialog>
            </div>
        </div>

    );
};

export default SetSystemComponentTable;
