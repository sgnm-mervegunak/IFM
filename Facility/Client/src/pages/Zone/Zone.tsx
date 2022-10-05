import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { v4 as uuidv4 } from "uuid";
import { InputText } from "primereact/inputtext";
import React, { useEffect, useState, useRef } from "react";
// import { useAppDispatch, useAppSelector } from "../../app/hook";
// import { save } from "../../features/tree/treeSlice";
// import { Toolbar } from "primereact/toolbar";
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
  DragDropProvider,
  Grid, GroupingPanel, PagingPanel,
  Table, TableFilterRow, TableGroupRow,
  TableHeaderRow, TableSelection, Toolbar,
} from '@devexpress/dx-react-grid-material-ui';
import {
  FilteringState, GroupingState,
  IntegratedFiltering, IntegratedGrouping, IntegratedPaging, IntegratedSelection, IntegratedSorting,
  PagingState, SelectionState, SortingState, DataTypeProvider, DataTypeProviderProps,
} from '@devexpress/dx-react-grid';
import ZoneService from "../../services/zone";

const columns = [
  { name: "name", title: "Name" },
  { name: "description", title: "Description" },
  { name: "tag", title: "Tag" },
  {name:"buildingName", title:"Building"}
];
const rows: any = [

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
  const [row, setRow] = useState<Object[]>([]);
  const [column, setColumn] = useState<any>();

  const dt = useRef<any>();
  const { toast } = useAppSelector((state) => state.toast);
  const menu = useRef<any>(null);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const { t } = useTranslation(["common"]);
  const language = useAppSelector((state) => state.language.language);

  const [pageSizes] = React.useState<number[]>([10, 20]);

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
        let arr = response.data?.children;
        arr.map((index: any, key: any) => {
          console.log("index", index);
          console.log("key", key)

          // setRow([...row, row.push({ "name": index?.name, "description": index?.description, "tag": index?.tag })])

          ZoneService.findBuildingWithKey(index?.key)
            .then((res) => {
              console.log("resssss:", res?.data?.root)
              let building = res?.data?.root?.name;
              let arr2 = res?.data?.root?.children
              arr2.map((index: any, key: any) => {
                console.log("index2", index)

                let arr3 = index?.children;
                arr3.map((index2: any, key2: any) => {
                  console.log("22222222", index2)

                  setRow([...row, row.push({ "name": index2?.name, "description": index2?.description, "tag": index2?.tag, "buildingName": building })])
                  
                })
              })



            })

        })


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


  useEffect(() => {
    //  setRow([
    //   { name: 0, description: "DevExtreme", siteName: "DevExpress" },
    //   { name: 1, description: "DevExtreme Reactive", siteName: "DevExpress" },
    // ])
    console.log("????", data)
    data.map((index, key) => {
      console.log("index", index);
      console.log("key", key)

      setRow([...row, { "name": index?.name, "description": index?.description, "tag": index?.tag }])
    })
  }, data)

  useEffect(
    () => {
      console.log("roooow", row)
    }
    , [row]
  )


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
      <Grid rows={row} columns={columns}>
        <GroupingState
          defaultGrouping={[{ columnName: "buildingName" }]}
        />
        {/* <IntegratedGrouping/> */}
        <PagingState />
        <IntegratedPaging />
        <Table />
        <TableHeaderRow />
        <PagingPanel pageSizes={pageSizes} />
      </Grid>
    </Paper>
  );
};

export default Zone;
