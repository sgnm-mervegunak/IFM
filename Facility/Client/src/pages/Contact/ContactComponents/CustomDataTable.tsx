import React, { useState, useEffect, useRef } from "react";
import { DataTable, DataTableRowEventParams } from "primereact/datatable";
import { Column, ColumnFilterApplyClickParams, ColumnFilterApplyType, ColumnFilterClearType, ColumnFilterMatchModeOptions, ColumnHeaderType } from "primereact/column";
import { MultiSelect } from 'primereact/multiselect';
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Menu } from "primereact/menu";
import PrimeReact, { FilterMatchMode, FilterOperator } from 'primereact/api';
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ContactService from "../../../services/contact";

interface IColumn {
    field: string;
    header: string;
}


interface DataTableProps<P>{
    props:P
}


export const CustomDataTable = (
  
    { ...props }
) => {

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


    const { t } = useTranslation(["common"]);
    const [selectedColumns, setSelectedColumns] = useState<IColumn[]>(columns);
    const [globalFilterValue, setGlobalFilterValue] = useState("");
    const [searchKey, setSearchKey] = useState("");
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

    const onGlobalFilterChange = async (e: any) => {
        const value = e.target.value;

        // let _filters = { ...filters };
        // _filters['global'].value = value;

        // setFilters(_filters);
        setGlobalFilterValue(value);


        if (e.target.value === "") {
            // getContactReset(); //----------------ekle
            setSearchKey("");
        };
    }

    const onColumnToggle = (event: any) => {
        let selectedColumns = event.value;
        let orderedSelectedColumns = columns.filter(col => selectedColumns.some((sCol: { field: string; }) => sCol.field === col.field));
        setSelectedColumns(orderedSelectedColumns);
    }




    const renderSearch = (title: string) => {
        return (
            <React.Fragment>
                <div className="flex justify-content-between align-items-center justify-content-center">
                    <div>
                        <h5 className="m-0">{title}</h5>
                    </div>
                    <div className="flex">
                        <div className="m-2">
                            <MultiSelect value={selectedColumns} options={columns} optionLabel="header" onChange={onColumnToggle} placeholder={t("Select Column")} style={{ width: '20em' }} />
                        </div>
                        <div className="m-2">
                            <span className="p-input-icon-left">
                                <i className="pi pi-search" />
                                <InputText value={globalFilterValue} onKeyDown={props.handleFind} onChange={onGlobalFilterChange} placeholder={t("Search")} />
                            </span>
                        </div>
                        <div className="m-2">
                            <Button type="button" icon="pi pi-filter-slash" label={t("Clear")} className="p-button-outlined" onClick={props.handleReset} />
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }

    const header = renderSearch("Contact Management");

    return (

        <DataTable
            value={props.value}
            ref={props.ref}
            dataKey="id"
            paginator
            onPage={props.onPage}
            onSort={props.onSort}
            first={props.first}
            responsiveLayout="scroll"
            paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
            currentPageReportTemplate={t("Showing {first} to {last} of {totalRecords} Contacts")}
            rows={props.rows}
            rowsPerPageOptions={[10, 25, 50]}
            lazy
            totalRecords={props.totalRecords}
            header={header}
            emptyMessage="Contact not found"
            sortField={props.sortField}
            sortOrder={props.sortOrder}
            filterDisplay="menu"
            showGridlines
            loading={props.loading}
            selectionMode="checkbox"
            selection={props.selection}
            onSelectionChange={props.onSelectionChange}


        // onFilter={onFilter}
        // filters={filters}
        >
            

            <Column
                selectionMode="multiple"
                headerStyle={{ width: '3em' }}>
            </Column>


            {props.children}
            <Column
                body={props.body}
                bodyStyle={{ textAlign: "right", overflow: "visible" }}
                exportable={false}
                style={{ minWidth: '8rem' }}
                filter={false}
            />

      


        </DataTable>

    )


}

type Props = {
    field: string;
    header: ColumnHeaderType;
    filter?: boolean | undefined;
    filterField: string | undefined;
    sortable?: true;
    filterMatchModeOptions?: ColumnFilterMatchModeOptions[] | undefined
    onFilterApplyClick?(e: ColumnFilterApplyClickParams): void
    onFilterClear?(): void
    showFilterOperator?: boolean | undefined
    filterPlaceholder?: string | undefined
    filterClear?: ColumnFilterClearType
    filterApply?: ColumnFilterApplyType
    showAddButton?: boolean | undefined
}



const TableColumn: React.FC<Props> =({

    field,
    header,
    filter,
    filterField,
    sortable,
    filterMatchModeOptions,
    onFilterApplyClick,
    onFilterClear,
    showFilterOperator,
    filterPlaceholder,
    filterClear,
    filterApply,
    showAddButton
}) => {
    const { t } = useTranslation(["common"]);


    return (

        <Column
            field={field}
            header={header}
            filter={filter}
            filterField={filterField}
            filterMatchModeOptions={filterMatchModeOptions}
            onFilterApplyClick={onFilterApplyClick}
            onFilterClear={onFilterClear}
            sortable={sortable}
            showFilterOperator={showFilterOperator}
            filterPlaceholder={filterPlaceholder}
            filterClear={filterClear}
            filterApply={filterApply}
            showAddButton={showAddButton}
        />
    );

}



export { DenemeParent, DenemeChild}

const DenemeChild = ({a}:{a?:boolean}) => {
    return (
        <Text style={{ color: a ? "red" : "green" }} >adfsdfsdf</Text> 
    )
}

const DenemeParent = ({...props}) => {
    return (
        <div >
            {props.children}
        </div>
    )
}

const Text = ({...props}) => {
    return (
        <h1>aaa</h1>
    )
}
CustomDataTable.Column = TableColumn;

export { TableColumn };

