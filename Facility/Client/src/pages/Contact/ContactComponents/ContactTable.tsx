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
import { CustomDataTable } from "./CustomDataTable";


export const ContactTable = (

    { value, rows, body }: {
        value: any, rows: any, body: any
    }
) => {
    const { t } = useTranslation(["common"]);

    return (
        <CustomDataTable
            value={value}
            rows={rows}
            body={body}

        >


            <CustomDataTable.Column
                field="email"
                header="Email"
                filterField="email"
            />
            <CustomDataTable.Column
                field="givenName"
                header="Name"
                filterField="givenName"
            />
            <CustomDataTable.Column
                field="familyName"
                header="Surname"
                filterField="familyName"
            />
            <CustomDataTable.Column
                field="phone"
                header="Phone"
                filterField="phone"
            />
            <CustomDataTable.Column
                field="company"
                header="Company"
                filterField="company"
            />

        </CustomDataTable>
    )
}