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


export const CustomDataTable = (
    // { value, ref, onPage, onSort, first, rows, totalRecords, header, sortField, sortOrder, loading, selection, onSelectionChange, children, matchModes, onFilterApplyClick, onFilterClear, filterClear, filterApply, body }:
    // {
    //     value: any, ref: any, onPage: any, onSort: any, first: number, rows: any, totalRecords: any, header: any, sortField: any, sortOrder: any, loading: any, selection: any, onSelectionChange: any, children: any, matchModes?: any, onFilterApplyClick?: any, onFilterClear?: any, filterClear?: any, filterApply?: any, body?: any
    //     }
    { ...props }
) => {
    const { t } = useTranslation(["common"]);

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
            header={props.header}
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
                selectionMode="single"
                headerStyle={{ width: '3em' }}>
            </Column>
            {/* 
                <TableColumn
                    field="email"
                    header="Email"
                filterField="email"
                
                />
              <TableColumn
                    field="givenName"
                    header="Name"
                    filterField="givenName"
                />
                <TableColumn
                    field="familyName"
                    header="Surname"
                    filterField="familyName"
                />
                <TableColumn
                    field="phone"
                    header="Phone"
                    filterField="phone"
                   />
                <TableColumn
                    field="company"
                    header="Company"
                filterField="company"

                /> */}

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

const TableColumn = (props: any) => {
    const { t } = useTranslation(["common"]);

    return (

        <Column
            field={props.field}
            header={props.header}
            sortable
            filter
            filterField={props.filterField}
            filterMatchModeOptions={props.matchModes}
            onFilterApplyClick={props.onFilterApplyClick}
            onFilterClear={props.onFilterClear}
            showFilterOperator={false}
            filterPlaceholder={t("Search")}
            filterClear={props.filterClear}
            filterApply={props.filterApply}
            showAddButton={false}
            selectionMode="multiple"
            headerStyle={{ width: '3em' }}
        />
    );
}
CustomDataTable.Column = TableColumn;