import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { v4 as uuidv4 } from "uuid";
import { InputText } from "primereact/inputtext";
import React, { useEffect, useState, useRef } from "react";
// import { useAppDispatch, useAppSelector } from "../../app/hook";
// import { save } from "../../features/tree/treeSlice";
import { Toolbar } from "primereact/toolbar";
import { useNavigate } from "react-router-dom";
import { Menu } from "primereact/menu";
import { Chips } from "primereact/chips";

import FacilityStructureService from "../../services/facilitystructure";
import { useAppSelector } from "../../app/hook";
import { useTranslation } from "react-i18next";
import Export, { ExportType } from "../FacilityStructure/Export/Export";
import ImportZone from "./ImportZone";

import Paper from "@mui/material/Paper";
import {
  Grid,
  Table,
  TableHeaderRow,
} from "@devexpress/dx-react-grid-material-ui";

const columns = [
  { name: "name", title: "Name" },
  { name: "description", title: "Description" },
  { name: "siteName", title: "SiteName" },
];
const rows = [
  { id: 0, product: "DevExtreme", owner: "DevExpress" },
  { id: 1, product: "DevExtreme Reactive", owner: "DevExpress" },
];
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
  Name?: string;
}

const Zone = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Node[]>([]);
  const [addDia, setAddDia] = useState(false);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [labelClass, setLabelClass] = useState("");
  const [tag, setTag] = useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportDia, setExportDia] = useState(false);
  const [importDia, setImportDia] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [row, setRow] = useState<any>();
  const [column, setColumn] = useState<any>();

  const dt = useRef<any>();
  const { toast } = useAppSelector((state) => state.toast);
  const menu = useRef<any>(null);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const { t } = useTranslation(["common"]);
  const language = useAppSelector((state) => state.language.language);

  useEffect(() => {
    loadLazyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log("dataaaaaa:", data);
  }, data);
  const loadLazyData = () => {
    // FacilityStructureService.findStuctureFirstLevel(realm)
    //   .then((response) => {
    //     console.log("-----------------------",response.data);
    //     setData(response.data);
    //   })
    //   .catch((err) => {
    //     toast.current.show({
    //       severity: "error",
    //       summary: "Error",
    //       // detail: err?.response ? err?.response?.data?.message : err.message,
    //       life: 2000,
    //     });
    //   });
    FacilityStructureService.findAll()
      .then((response) => {
        console.log("-----------------------", response.data.children);
        setData(response.data?.children);

      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err?.response ? err?.response?.data?.message : err.message,
          life: 2000,
        });
      });
  };



  // const addItem = () => {
  //   // const _classification: Node = {
  //   //   name: name,
  //   //   key: uuidv4(),
  //   //   tag: tag,
  //   //   description:"",
  //   //   labels: [],
  //   // };

  //   // FacilityStructureService.create(_classification)
  //   //   .then((res) => {
  //   //     toast.current.show({
  //   //       severity: "success",
  //   //       summary: "Successful",
  //   //       detail: "Classification Created",
  //   //       life: 3000,
  //   //     });
  //   //     loadLazyData();
  //   //   })
  //   //   .catch((err) => {
  //   //     toast.current.show({
  //   //       severity: "error",
  //   //       summary: "Error",
  //   //       detail: err.response ? err.response.data.message : err.message,
  //   //       life: 20000,
  //   //     });
  //   //   });

  //   setAddDia(false);
  //   setName("");
  //   setCode("");
  //   setLabelClass("");
  //   setTag([]);
  // };

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h3 className="m-0">{/*Zone*/}</h3>
      <span className="block mt-2 md:mt-0">
        <InputText
          type="search"
          onInput={(e: any) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
        <Button icon="pi pi-search" className="ml-1" />
      </span>
    </div>
  );

  // const renderFooter = () => {
  //   return (
  //     <div>
  //       <Button
  //         label="Cancel"
  //         icon="pi pi-times"
  //         onClick={() => {
  //           setAddDia(false);
  //           setName("");
  //         }}
  //         className="p-button-text"
  //       />
  //       <Button
  //         label="Add"
  //         icon="pi pi-check"
  //         onClick={() => addItem()}
  //         autoFocus
  //       />
  //     </div>
  //   );
  // };

  return (
    <Paper>
      <Grid rows={rows} columns={columns}>
        <Table />
        <TableHeaderRow />
      </Grid>
    </Paper>
  );
};

export default Zone;
