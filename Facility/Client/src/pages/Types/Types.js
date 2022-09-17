import React, { useState, useEffect, useRef } from "react";
// import { classNames } from 'primereact/utils';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Toast } from "primereact/toast";
import { Button } from "primereact/button";
import { FileUpload } from "primereact/fileupload";
// import { Rating } from 'primereact/rating';
import { Toolbar } from "primereact/toolbar";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import axios from "axios";
import { Menu } from "primereact/menu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import TypesService from "../../services/types";
import FacilityService from "../../services/facility";
import DefineFacility from "../../components/Facility/DefineFacility";



const Types = () => {
  let emptyFacility = {
    _id: "",
    facility_name: "",
    brand_name: "",
    type_of_facility: "",
    address: [],
    classifications: [
      {
        classificationId: "",
        rootKey: "",
        leafKey: "",
      },
    ],
    label: [],
    __v: 0,
  };

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: null,
    sortOrder: null,
  });
  const [countFacilities, setCountFacilities] = useState(0);
  const [facilityDialog, setFacilityDialog] = useState(false);
  const [deleteFacilityDialog, setDeleteFacilityDialog] = useState(false);
  const [facility, setFacility] = useState(emptyFacility);
  const [submitted, setSubmitted] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isUpload, setIsUpload] = useState(false);
  const [count,setCount]=useState(data.length);
  const { t } = useTranslation(["common"]);
  const toast = useRef(null);
  const dt = useRef(null);
  const navigate = useNavigate();
  const menu = useRef(null);

  const getTypes = () => {
    TypesService.findAll()
      .then((res) => {
        res.data.map((type) => {
          console.log(type._fields[1].properties);
          setData((prevData) => [
            ...prevData,
            {
              id: type._fields[0].low,
              name: type._fields[1].properties.name,
              accessibilityPerformance:
                type._fields[1].properties.accessibilityPerformance,
              assetType: type._fields[1].properties.assetType,
              category: type._fields[1].properties.category,
              codePerformance: type._fields[1].properties.codePerformance,
              color: type._fields[1].properties.color,
              constituents: type._fields[1].properties.constituents,
              documents: type._fields[1].properties.documents,
              durationUnit: type._fields[1].properties.durationUnit,
              expectedLife: type._fields[1].properties.expectedLife,
              features: type._fields[1].properties.features,
              finish: type._fields[1].properties.finish,
              images: type._fields[1].properties.images,
              material: type._fields[1].properties.material,
              modelNo: type._fields[1].properties.modelNo,
              modelReference: type._fields[1].properties.modelReference,
              nominalHeight: type._fields[1].properties.nominalHeight,
              nominalLength: type._fields[1].properties.nominalLength,
              nominalWidth: type._fields[1].properties.nominalWidth,
              replacementCost: type._fields[1].properties.replacementCost,
              shape: type._fields[1].properties.shape,
              size: type._fields[1].properties.size,
              sustainabilityPerformance:
                type._fields[1].properties.sustainabilityPerformance,
              tag: type._fields[1].properties.tag,
              warranty: type._fields[1].properties.warranty,
              warrantyDurationLabor:
                type._fields[1].properties.warrantyDurationLabor,
              warrantyDurationParts:
                type._fields[1].properties.warrantyDurationParts,
              warrantyDurationUnit:
                type._fields[1].properties.warrantyDurationUnit,
              warrantyGuarantorLabor:
                type._fields[1].properties.warrantyGuarantorLabor,
              warrantyGuarantorParts:
                type._fields[1].properties.warrantyGuarantorParts,
            },
          ]);
        });
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

  useEffect(() => {
    getTypes();
  }, []);

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
      <h5 className="m-0">Types Editing</h5>
      {/* <span className="block mt-2 md:mt-0">
        <InputText
          type="search"
          onInput={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
        />
        <Button icon="pi pi-search" className="ml-1" />
      </span> */}
    </div>
  );


  return (
    <div className="grid crud-demo">
      <div className="col-12">
        <div className="card">
          <Toast ref={toast} />

          <DataTable
            ref={dt}
            value={data}
            dataKey="id"
            // onPage={onPage}
            first={lazyParams.first}
            paginator
            rows={lazyParams.rows}
            loading={loading}
            lazy
            rowsPerPageOptions={[10, 15, 25]}
            className="datatable-responsive"
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {count} facilities"
            totalRecords={countFacilities}
            globalFilter={globalFilter}
            emptyMessage="No types found."
            header={header}
            responsiveLayout="scroll"
            // onSort={onSort}
            sortField={lazyParams.sortField}
            sortOrder={lazyParams.sortOrder}
            exportFilename={`Types-` + new Date().toJSON().slice(0, 10)}
          >
            <Column field="name" header="Name" />
            <Column field="category" header="Category" />
            <Column field="material" header="Model No" />
          </DataTable>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Types);
