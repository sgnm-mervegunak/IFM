import React from "react";
import { MultiSelect } from "primereact/multiselect";
import { useAppSelector } from "../../../app/hook";
import FacilityStructureService from "../../../services/facilitystructure";
import ExportService from "../../../services/export";
import DownloadExcel from "../../../utils/download-excel";

const Export = ({
  submitted,
  setSubmitted,
  setExportDia,
}: {
  submitted: boolean;
  setSubmitted: any;
  setExportDia: any;
}) => {
  const auth = useAppSelector((state) => state.auth);
  const { toast } = useAppSelector((state) => state.toast);
  const [buildings, setBuildings] = React.useState([]);
  const [selectedBuildings, setSelectedBuildings] = React.useState<any>([]);

  React.useEffect(() => {
    FacilityStructureService.findStuctureFirstLevel(auth.auth.realm)
      .then((response) => {
        setBuildings(response.data);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: err.response ? err.response.data.message : err.message,
          life: 2000,
        });
      });
  }, []);

  React.useEffect(() => {
    if (submitted && selectedBuildings.length > 0) {
      ExportService.exportSpaces({
        buildingKeys: selectedBuildings.map((item: any) => {
          if (item.key) {
            return item.key;
          }
        }),
        realm: auth.auth.realm,
      })
        .then(async(res) => {
          await DownloadExcel(res.data, "test", "deneme");
          setExportDia(false);
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 2000,
          });
        });
    }
    setSubmitted(false);
  }, [submitted]);

  return (
    <div>
      <h5>Select Buildings</h5>
      <MultiSelect
        style={{ width: "100%" }}
        value={selectedBuildings}
        options={buildings}
        onChange={(e) => setSelectedBuildings(e.value)}
        optionLabel="name"
        placeholder="Select a Building"
        display="chip"
      />
    </div>
  );
};

export default Export;
