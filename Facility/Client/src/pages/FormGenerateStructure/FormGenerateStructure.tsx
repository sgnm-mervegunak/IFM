import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { TreeSelect } from "primereact/treeselect";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";
import { TabView, TabPanel } from "primereact/tabview";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";

import FormTypeService from "../../services/formType";
import FormBuilderService from "../../services/formBuilder";
import StructureWinformDataService from "../../services/structureWinformData";
import FacilityTypePropertiesService from "../../services/facilitystructure";
import FileUploadComponent from "./FileUpload/FileUpload";
import TreeSelectComponent from "./TreeSelect/TreeSelect";
import { Chips } from "primereact/chips";

// import "./FormGenerate.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: any;
  onChange: any;
  type: any;
  uploadFiles: any;
  setUploadFiles: any;
  deleteFiles: any;
  setDeleteFiles: any;
  options?: any;
  label2: string;
  label: any;
}

interface Params {
  selectedFacilityType: string | undefined;
  submitted: boolean;
  setSubmitted: any;
  addItem: any;
  editItem: any;
  uploadFiles: any;
  setUploadFiles: any;
  deleteFiles: any;
  setDeleteFiles: any;
  realm: string;
  selectedNodeKey: string;
  editDia: boolean;
}

const Error: React.FC = ({ children }) => (
  <p style={{ color: "red" }}>{children}</p>
);
const Input = ({
  value,
  onChange,
  uploadFiles,
  setUploadFiles,
  deleteFiles,
  setDeleteFiles,
  type,
  ...rest
}: InputProps) => {
  const options2 = rest?.options?.map((item: any | null) => {
    return Object.values(item);
  });
  var merged: any = [].concat.apply([], options2);
  switch (type) {
    case "text":
      return (
        <InputText
          className="mt-1"
          placeholder={rest?.placeholder}
          onChange={onChange}
          value={value}
          style={{ width: "100%" }}
        />
      );
    case "textarea":
      return (
        <InputTextarea
          className="mt-1"
          placeholder={rest?.placeholder}
          onChange={onChange}
          value={value}
          style={{ width: "100%" }}
        />
      );
    case "radio":
    case "gender":
      return merged?.map((e: any, index: any) => {
        console.log(e, index);
        return (
          <span key={e} className={index === 0 ? "mt-3" : "mt-3 ml-3"}>
            <RadioButton
              className="mt-2"
              key={e}
              value={e}
              onChange={onChange}
              checked={value === e}
            />
            <label className="ml-2">{e}</label>
          </span>
        );
      });
    case "dropdown":
    case "cities":
      return (
        <div>
          <Dropdown
            className="mt-1"
            options={merged}
            onChange={onChange}
            value={value}
            placeholder={rest?.placeholder}
            style={{ width: "100%" }}
          />
        </div>
      );

    case "checkbox":
      return (
        <div>
          <label>{rest?.label2}</label>
          <Checkbox
            className="mt-1 ml-2"
            // label={rest?.label2}
            onChange={(e) => onChange(e.target.checked)}
            checked={value}
          />
        </div>
      );

    case "date":
      const date1 = new Date(value);
      return (
        <div>
          <Calendar
            className="mt-1"
            dateFormat="dd.mm.yy"
            onChange={(e) => {
              onChange(e.value?.toString());
              // onChange(moment(e.value?.toString()).format('DD.MM.YYYY'))
            }}
            value={date1}
            placeholder={rest?.placeholder}
            showIcon
            style={{ width: "100%" }}
          />
        </div>
      );
    case "imageupload":
      return (
        <div>
          <label>{rest?.label2}</label>
          <FileUploadComponent
            value={value}
            onChange={onChange}
            label={rest?.label}
            deleteFiles={deleteFiles}
            setDeleteFiles={setDeleteFiles}
            uploadFiles={uploadFiles}
            setUploadFiles={setUploadFiles}
            isImage
          />
        </div>
      );
    case "documentupload":
      return (
        <div>
          <label>{rest?.label2}</label>
          <FileUploadComponent
            isDocument
            label={rest?.label}
            value={value}
            onChange={onChange}
            deleteFiles={deleteFiles}
            setDeleteFiles={setDeleteFiles}
            uploadFiles={uploadFiles}
            setUploadFiles={setUploadFiles}
          />
        </div>
      );
    case "treeselect":
      return (
        <TreeSelectComponent
          selectedNode={value}
          setSelectedNode={onChange}
          placeholder={rest?.placeholder}
        />
      );
    case "textarray":
      return (
        <div>
          <Chips
            value={value}
            onChange={(e) => onChange(e.value)}
            style={{ width: "100%" }}
            className="structureChips"
          />
        </div>
      );
    default:
      return null;
  }
};

const FormGenerateStructure = ({
  selectedFacilityType,
  realm,
  submitted,
  setSubmitted,
  addItem,
  editItem,
  uploadFiles,
  setUploadFiles,
  deleteFiles,
  setDeleteFiles,
  selectedNodeKey,
  editDia,
}: Params) => {
  const [items, setItems] = useState<any[]>([]);
  const [hasForm, setHasForm] = useState(true);
  const [hasFormData, setHasFormData] = useState(false);
  const [nodeType, setNodeType] = useState("");
  const toast = React.useRef<any>(null);

  const history = useNavigate();

  useEffect(() => {
    (async () => {
      let formData = await FacilityTypePropertiesService.nodeInfo(
        selectedNodeKey
      );

      let nodetype = formData.data.properties.nodeType;

      setNodeType(nodetype);
      FacilityTypePropertiesService.getFacilityTypeProperties(
        realm,
        selectedFacilityType || nodetype
      )
        .then(async (responsegetProperties) => {
          if (editDia === true) {
            const responsegetData =
              await FacilityTypePropertiesService.nodeInfo(selectedNodeKey);
            console.log(responsegetData);

            const convertedData = responsegetProperties.data.map(function (
              item: any
            ) {
              // console.log(formData[`'${item.label}'`]);
              // console.log(responsegetData.data[item.label.replaceAll(" ", "")]);
              // console.log([responsegetData.data].length);
              console.log(item);

              return {
                ...item,
                defaultValue:
                  [responsegetData.data].length > 0
                    ? responsegetData.data.properties[
                        item.label.replaceAll(" ", "")
                      ]
                      ? responsegetData.data.properties[
                          item.label.replaceAll(" ", "")
                        ]
                      : item.defaultValue
                    : item.defaultValue,
                label: item.label,
                rules: { required: item.rules[0] },
                options: item.options.map(function (option: any) {
                  return { optionsName: option };
                }),
              };
            });
            setItems(convertedData);
          } else {
            console.log("noFormData");
            const convertedData = responsegetProperties.data.map(function (
              item: any
            ) {
              // console.log(formData[`'${item.label}'`]);

              return {
                ...item,
                label: item.label,
                rules: { required: item.rules[0] },
                options: item.options.map(function (option: any) {
                  return { optionsName: option };
                }),
              };
            });
            setItems(convertedData);
          }
        })
        .catch((err) => {
          // return setHasForm(false);
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.responsegetProperties
              ? err.responsegetProperties.data.message
              : err.message,
            life: 2000,
          });
        });
    })();
  }, [selectedFacilityType]);

  const {
    handleSubmit,
    control,
    // watch,
    unregister,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (submitted) {
      handleSubmit(onSubmit)();
    }
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const onSubmit = (data: any) => {
    const key = uuidv4();

    // const formData = {
    //   nodeKey: nodeKey,
    //   data: data,
    // };
    if (editDia === false) {
      data.nodeType = selectedFacilityType;
      addItem(data);
    } else {
      data.nodeType = nodeType;
      editItem(data);
    }
  };

  return (
    <div className="tabview-demo">
      <div>
        <Toast ref={toast} position="top-right" />

        {hasForm ? (
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* <h4 className="flex justify-content-center"> Extra Form</h4> */}
            {items &&
              Object.keys(items).map((e: any) => {
                const { rules, defaultValue, label }: any = items[e];
                return (
                  <div className="field" key={e}>
                    <h5 style={{ marginBottom: "0.5em" }}>{label}</h5>
                    <Controller
                      name={label.replaceAll(" ", "")}
                      // name={label}
                      control={control}
                      rules={rules}
                      defaultValue={defaultValue}
                      render={({ field }) => (
                        <div>
                          <Input
                            value={field.value || ""}
                            onChange={field.onChange}
                            uploadFiles={uploadFiles}
                            deleteFiles={deleteFiles}
                            setDeleteFiles={setDeleteFiles}
                            setUploadFiles={setUploadFiles}
                            {...(items[e] as any)}
                          />
                        </div>
                      )}
                    />
                  </div>
                );
              })}
          </form>
        ) : (
          <div>
            <h4>There is no extra form for this structure.</h4>
            {/* <Button className="" onClick={() => backPage()}>
                  Back
                </Button> */}
          </div>
        )}
      </div>
    </div>
  );
};

export default FormGenerateStructure;
