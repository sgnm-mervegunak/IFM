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


export const CustomDataTable = ({ value, ref, onPage, onSort, first, rows, totalRecords, header, sortField, sortOrder, loading, selection, onSelectionChange, children, matchModes, onFilterApplyClick, onFilterClear, filterClear, filterApply, body }:
    {
        value: any, ref: any, onPage: any, onSort: any, first: number, rows: any, totalRecords: any, header: any, sortField: any, sortOrder: any, loading: any, selection: any, onSelectionChange: any, children: any, matchModes?: any, onFilterApplyClick?: any, onFilterClear?: any, filterClear?: any, filterApply?: any, body?: any
    }) => {

    const { t } = useTranslation(["common"]);

    const TableColumn = ({field, header, filterField }: {field:any, header:any,filterField:any}) => {
        const { t } = useTranslation(["common"]);

        return (
            <div>
                <Column
                    field={field}
                    header={header}
                    sortable
                    filter
                    filterField={filterField}
                    filterMatchModeOptions={matchModes}
                    onFilterApplyClick={onFilterApplyClick}
                    onFilterClear={onFilterClear}
                    showFilterOperator={false}
                    filterPlaceholder={t("Search")}
                    filterClear={filterClear}
                    filterApply={filterApply}
                    showAddButton={false}
                    selectionMode="multiple"
                    headerStyle={{ width: '3em' }}
                />
            </div>)
    }

    return (
        <div>
            <DataTable
                value={value}
                ref={ref}
                dataKey="id"
                paginator
                onPage={onPage}
                onSort={onSort}
                first={first}
                responsiveLayout="scroll"
                paginatorTemplate="CurrentPageReport FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                currentPageReportTemplate={t("Showing {first} to {last} of {totalRecords} Contacts")}
                rows={rows}
                rowsPerPageOptions={[10, 25, 50]}
                lazy
                totalRecords={totalRecords}
                header={header}
                emptyMessage="Contact not found"
                sortField={sortField}
                sortOrder={sortOrder}
                filterDisplay="menu"
                showGridlines
                loading={loading}
                selectionMode="checkbox"
                selection={selection}
                onSelectionChange={onSelectionChange}
                
            // onFilter={onFilter}
            // filters={filters}
            >

                <Column
                    selectionMode="multiple"
                    headerStyle={{ width: '3em' }}>
                </Column>

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
                />

                <Column
                    body={body}
                    bodyStyle={{ textAlign: "right", overflow: "visible" }}
                    exportable={false}
                    style={{ minWidth: '8rem' }}
                    filter={false}
                />
                {children}
            </DataTable>
        </div>
    )
}