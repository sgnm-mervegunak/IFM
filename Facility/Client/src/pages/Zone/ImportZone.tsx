import React from "react";
import { MultiSelect } from "primereact/multiselect";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../app/hook";
import FacilityStructureService from "../../services/facilitystructure";
import ExportService from "../../services/export";
import DownloadExcel from "../../utils/download-excel";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import { ProgressSpinner } from "primereact/progressspinner";

const ImportZone = ({ setImportDia }: { setImportDia: any }) => {
  const auth = useAppSelector((state) => state.auth);
  const { toast } = useAppSelector((state) => state.toast);
  const [buildings, setBuildings] = React.useState([]);
  const refUpload = React.useRef<any>(null);
  const [selectedBuilding, setSelectedBuilding] = React.useState<any>(null);
  const { t } = useTranslation(["common"]);
  const [loading, setLoading] = React.useState(false);

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

  const uploadCSV = (e: any) => {
    if (selectedBuilding) {
      setLoading(true);
      const file = e.files[0];

      const formData = new FormData();

      formData.append("file", file);
      ExportService.importZones(selectedBuilding.key, formData)
        .then((res) => {
        console.log("ok");
        console.log(res.data);
        setLoading(false);
        setImportDia(false);

          toast.current.show({
            severity: 'success',
            summary: 'Successful',
            detail: 'Zones Imported',
            life: 3000,
          });
        })
        .catch((e) => {
          setLoading(false);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: e.toString(),
            life: 2000,
          });
        });
    } else {
      toast.current.show({
        severity: "error",
        summary: "Error",
        detail: "Please select building",
        life: 2000,
      });
    }
  };

  return (
    <div>
      <h5>{t("Select Buildings")}</h5>
      {loading ? <ProgressSpinner/>:<div>
        <div className="field">
          <Dropdown
            style={{ width: "100%" }}
            value={selectedBuilding}
            options={buildings}
            onChange={(e) => setSelectedBuilding(e.value)}
            optionLabel="name"
            placeholder=""
          />
        </div>
        <div className="field">
          <FileUpload
            name="upfile[]"
            accept="csv/*"
            maxFileSize={10000000}
            chooseLabel="Select File"
            customUpload={true}
            uploadHandler={uploadCSV}
            ref={refUpload}
            disabled={loading}
          />
        </div>
      </div>}
    </div>
  );
};

export default ImportZone;
