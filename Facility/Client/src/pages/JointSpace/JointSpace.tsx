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
import { useTranslation } from "react-i18next";

import FacilityStructureService from "../../services/facilitystructure";
import { useAppSelector } from "../../app/hook";
import Export, { ExportType } from "../FacilityStructure/Export/Export";

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

const JointSpace = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Node[]>([]);
  // const [addDia, setAddDia] = useState(false);
  // const [code, setCode] = useState("");
  // const [name, setName] = useState("");
  // const [labelClass, setLabelClass] = useState("");
  // const [tag, setTag] = useState<string[]>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportDia, setExportDia] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const dt = useRef<any>();
  const { toast } = useAppSelector((state) => state.toast);
  const menu = useRef<any>(null);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const { t } = useTranslation(["common"]);

  useEffect(() => {
    loadLazyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLazyData = () => {
    FacilityStructureService.findStuctureFirstLevel(realm)
      .then((response) => {
        console.log(response.data);
        setData(response.data);
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

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h3 className="m-0">{/*t("Joint Space")*/}</h3>
      <span className="block mt-2 md:mt-0">
        <InputText
          type="search"
          onInput={(e: any) => setGlobalFilter(e.target.value)}
          placeholder={t("Search")}
        />
        <Button icon="pi pi-search" className="ml-1" />
      </span>
    </div>
  );

  return (
    <div className="card">
      <Toolbar
        className="mb-4"
        right={() => (
          <React.Fragment>
            <Button
              label={t("Export Joint Spaces")}
              icon="pi pi-download"
              className="p-button"
              onClick={() => setExportDia(true)}
            />
          </React.Fragment>
        )}
      ></Toolbar>

      <Dialog
        header={t("Export")}
        visible={exportDia}
        style={{ width: "40vw" }}
        footer={() => (
          <div>
            <Button
              label={t("Cancel")}
              icon="pi pi-times"
              onClick={() => {
                setExportDia(false);
              }}
              className="p-button-text"
            />
            <Button
              label={t("Export")}
              icon="pi pi-check"
              onClick={() => setSubmitted(true)}
              autoFocus
            />
          </div>
        )}
        onHide={() => {
          setExportDia(false);
        }}
      >
        <Export
          submitted={submitted}
          setSubmitted={setSubmitted}
          setExportDia={setExportDia}
          exportType={ExportType.JointSpace}
        />
      </Dialog>

      <DataTable
        ref={dt}
        value={data}
        dataKey="key"
        // rows={lazyParams.rows}
        loading={loading}
        className="datatable-responsive"
        // totalRecords={countClassifications}
        globalFilter={globalFilter}
        emptyMessage="Joint Space not found"
        header={header}
        style={{ fontWeight: "bold" }}
        selectionMode="single"
        onSelectionChange={(e) => {
          navigate("/jointspace/" + e.value.key);
          console.log(e.value);
        }}
        responsiveLayout="scroll"
      >
        <Column field="name" header={t("Name")} sortable></Column>
        <Column field="nodeType" header={t("Facility Type")} sortable></Column>
      </DataTable>
    </div>
  );
};

export default JointSpace;
