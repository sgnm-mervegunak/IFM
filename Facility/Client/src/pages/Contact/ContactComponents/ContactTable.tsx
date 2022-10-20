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
import { getInitialProps, useTranslation } from "react-i18next";
import { CustomDataTable, DenemeChild, DenemeParent } from "./CustomDataTable";

export const ContactTable = (

    { value, rows, body, handleFind, handleReset, loading, ref,onPage,onSort,
        filterMatchModeOptions,
        onFilterApplyClick,
        onFilterClear,
        filterClear,
        filterApply }:
        {
            value: any, rows: any, body: any, handleFind: any, handleReset: any, loading: boolean, ref: any,onPage:any, onSort:any
            filterMatchModeOptions: any,
            onFilterApplyClick: any,
            onFilterClear: any,
            filterClear: any,
            filterApply: any
        }
) => {
    const { t } = useTranslation(["common"]);

    return (
        <div>

            <CustomDataTable
                value={value}
                rows={rows}
                body={body}
                handleFind={handleFind}
                handleReset={handleReset}
                loading={loading}
                ref={ref}
                onPage={onPage}
                onSort={onSort}



            >
               

                <CustomDataTable.Column
                    field="givenName"
                    header="Name"
                    filterField="givenName"

                    sortable
                    filter
                    showFilterOperator={false}
                    filterPlaceholder={t("Search")}
                    showAddButton={false}
                    filterMatchModeOptions={filterMatchModeOptions}
                    onFilterApplyClick={onFilterApplyClick}
                    onFilterClear={onFilterClear}
                    filterClear={filterClear}
                    filterApply={filterApply}
                />
                <CustomDataTable.Column
                    field="familyName"
                    header="Surname"
                    filterField="familyName"

                    sortable
                    filter
                    showFilterOperator={false}
                    filterPlaceholder={t("Search")}
                    showAddButton={false}
                    filterMatchModeOptions={filterMatchModeOptions}
                    onFilterApplyClick={onFilterApplyClick}
                    onFilterClear={onFilterClear}
                    filterClear={filterClear}
                    filterApply={filterApply}
                />

                <CustomDataTable.Column
                    field="phone"
                    header="Phone"
                    filterField="phone"

                    sortable
                    filter
                    showFilterOperator={false}
                    filterPlaceholder={t("Search")}
                    showAddButton={false}
                    filterMatchModeOptions={filterMatchModeOptions}
                    onFilterApplyClick={onFilterApplyClick}
                    onFilterClear={onFilterClear}
                    filterClear={filterClear}
                    filterApply={filterApply}

                />
                <CustomDataTable.Column
                    field="company"
                    header="Company"
                    filterField="company"

                    sortable
                    filter
                    showFilterOperator={false}
                    filterPlaceholder={t("Search")}
                    showAddButton={false}
                    filterMatchModeOptions={filterMatchModeOptions}
                    onFilterApplyClick={onFilterApplyClick}
                    onFilterClear={onFilterClear}
                    filterClear={filterClear}
                    filterApply={filterApply}
                />

            </CustomDataTable>


        </div>
    )
}
