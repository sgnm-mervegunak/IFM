import React from "react";
import { Dropdown } from "primereact/dropdown";
import { useTranslation } from "react-i18next";
import { Message } from "primereact/message";

import { useAppSelector } from "../../../app/hook";
import axios from "axios";

const AddPlan = ({
  submitted,
  setSubmitted,
  setPlanDia,
  selectedNodeKey,
  getFacilityStructure,
}: {
  submitted: boolean;
  setSubmitted: any;
  setPlanDia: any;
  selectedNodeKey: string;
  getFacilityStructure: any;
}) => {
  const { toast } = useAppSelector((state) => state.toast);
  const { t } = useTranslation(["common"]);
  const emptyPlan = "empty";
  const [options, setOptions] = React.useState<any>([
    { label: emptyPlan, value: emptyPlan },
  ]);
  const [selectedOption, setSelectedOption] = React.useState<any>(emptyPlan);

  React.useEffect(() => {
    if (submitted) {
      const url = process.env.REACT_APP_API_URL + "structure";
      axios
        .post("http://localhost:9001/plan/", { key: selectedNodeKey })
        .then((res) => {
          axios
            .patch(url + "/addPlanToFloor/" + selectedNodeKey)
            .then((res) => {
              getFacilityStructure();
              setPlanDia(false);
              toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Plan added successfully",
                life: 3000,
              });
            })
            .catch((err) => {
              console.log(err.response);
              axios.delete("http://localhost:9001/plan/" + selectedNodeKey);
            });
        })
        .catch((err) => {
          if (err.response.data.message === "Plan already exist") {
            axios
            .patch(url + "/addPlanToFloor/" + selectedNodeKey)
            .then((res) => {
              getFacilityStructure();
              setPlanDia(false);
              toast.current.show({
                severity: "success",
                summary: "Success",
                detail: "Plan added successfully",
                life: 3000,
              });
            })
          } else {
            toast.current.show({
              severity: "error",
              summary: "Error",
              detail: err.message,
              life: 3000,
            });
          }
        });
    }
    setSubmitted(false);
  }, [submitted]);

  return (
    <div>
      <Dropdown
        style={{ width: "100%" }}
        value={selectedOption}
        options={options}
        onChange={(e) => {
          console.log(e.value);

          setSelectedOption(e);
        }}
        placeholder={t("Select Floor")}
      />
      <div className="mt-3">
        <Message severity="info" text="Clone floor plan or Create empty plan" />
      </div>
    </div>
  );
};

export default AddPlan;
