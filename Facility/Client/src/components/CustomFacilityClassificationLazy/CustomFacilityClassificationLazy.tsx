import React, { useEffect, useState } from "react";
import { Dropdown } from "primereact/dropdown";
import { TreeSelect } from "primereact/treeselect";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";

import ClassificationsService from "../../services/classifications";
import LazyLoadingService from "../../services/lazyLoading";
import { Node } from "../../interfaces/node";
import { useAppSelector } from "../../app/hook";


interface Params {
  fieldLabel: string;
  name: string;
  placeholder: string;
  setCode: React.Dispatch<React.SetStateAction<string>>;
  control: any;
  errors: any;
  data: any;
  classificationLabel: string;
}

const CustomFacilityClassificationLazy = ({ fieldLabel, name, placeholder, setCode, control, errors, data, classificationLabel }: Params) => {

  const [classifationData, setClassificationData] = useState<Node[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const { t } = useTranslation(["common"]);

  const fixNodes = (nodes: Node[]) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      i.label = i.name;
    }
  };

  const getClassification = async () => {
    await ClassificationsService.findAllActiveByLabel({
      label: classificationLabel,
    }).then((res) => {
      console.log(res.data);
      
      let temp = JSON.parse(
        JSON.stringify([res.data.root] || [])
      );
      fixNodes(temp);
      setClassificationData(temp);
    });
  };

  useEffect(() => {
    getClassification();
  }, []);

  return (
    <>

        <h5 className="required" style={{ marginBottom: "0.5em" }}>{t(fieldLabel)}</h5>
        <Controller
          defaultValue={data || ""}
          name={name}
          control={control}
          render={({ field }) => (
            <TreeSelect
              value={field.value}
              options={classifationData}
              // optionLabel="name"
              // optionValue="key"
              onChange={(e) => {
                ClassificationsService.nodeInfo(e.value as string)
                  .then((res) => {
                    field.onChange(e.value)
                    setCode(res.data.properties.code || "");
                  })
              }}
              placeholder={placeholder}
              style={{ width: "100%" }}
            />
          )}
        />
        <p style={{ color: "red" }}>{errors.name?.message}</p>

    </>
  );
};

export default CustomFacilityClassificationLazy;
