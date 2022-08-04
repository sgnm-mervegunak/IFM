import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";
import { TabView, TabPanel } from "primereact/tabview";
import { v4 as uuidv4 } from "uuid";

import FormTypeService from "../../services/formType";
import FormBuilderService from "../../services/formBuilder";
import StructureWinformDataService from "../../services/structureWinformData";
import FacilityTypePropertiesService from "../../services/facilitystructure";
// import "./FormGenerate.css";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  value: any;
  onChange: any;
  type: any;
  options?: any;
  label2: string;
  label: any;
}

interface Params {
  selectedFacilityType: string;
  submitted:boolean;
  setSubmitted:any;
  addItem:any;
  realm: string;
  // setFormDia: React.Dispatch<React.SetStateAction<boolean>>;
}

const Error: React.FC = ({ children }) => <p style={{ color: "red" }}>{children}</p>;
const Input = ({ value, onChange, type, ...rest }: InputProps) => {
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
      console.log(value);
      const date1 = new Date(value);
      return (
        <div>
          <Calendar
            className="mt-1"
            dateFormat="dd/mm/yy"
            onChange={onChange}
            value={date1}
            placeholder={rest?.placeholder}
            showIcon
            style={{ width: "100%" }}
          />
        </div>
      );

    default:
      return null;
  }
};


const FormGenerateStructure = ({ selectedFacilityType, realm,submitted,setSubmitted,addItem }: Params) => {
  const [items, setItems] = useState([]);
  const [passiveItems, setPassiveItems] = useState([]);
  const [hasForm, setHasForm] = useState(true);
  const [hasFormData, setHasFormData] = useState(false);
  const toast = React.useRef<any>(null);
  console.log(selectedFacilityType);
  

  // const location = useLocation();
  // const params = useParams();
  // const searchParameters = new URLSearchParams(location.search);

  // const typeKey = searchParameters.get("typeKey");

  // console.log(nodeKey, formKey);

  const history = useNavigate();

  useEffect(() => {
    // if (formKey === "undefined" || formKey === null || formKey === "") {
    //   return setHasForm(false);
    // }
    // const responsegetData = StructureWinformDataService.getFormData(nodeKey);
    // console.log(responsegetData);
    (async () => {

      FacilityTypePropertiesService.getFacilityTypeProperties(realm, selectedFacilityType)
        .then(async (responsegetProperties) => {
          console.log(responsegetProperties.data);
          let isFormData;
          // await StructureWinformDataService.getFormData(nodeKey)
          //   .then((res) => {
          //     console.log("testttttt");
          //     console.log(res.data);
          //     if (res.data.isActive) {
          //       isFormData = true;
          //       setHasFormData(true);
          //     } else {
          //       isFormData = false;
          //       setHasFormData(false);
          //     }
          //   })
          //   .catch((err) => {
          //   });

          if (isFormData === true) {
            console.log("hasFormData");

            // const responsegetData = await StructureWinformDataService.getFormData(nodeKey); 
            // console.log(responsegetData);
            const convertedData = responsegetProperties.data.map(function (item: any) {
              // console.log(formData[`'${item.label}'`]);
              // console.log(responsegetData.data[item.label.replaceAll(" ", "")]);
              // console.log([responsegetData.data].length);

              return {
                ...item,
                // defaultValue:
                //   [responsegetData.data].length > 0
                //     ? responsegetData.data[item.label.replaceAll(" ", "")]
                //       ? responsegetData.data[item.label.replaceAll(" ", "")]
                //       : item.defaultValue
                //     : item.defaultValue,
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
            const convertedData = responsegetProperties.data.map(function (item: any) {
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
          console.log("ana catch");

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

  // useEffect(() => {
  //   (async () => {
  //     FormBuilderService.getPassivePropertiesWithKey(formKey)
  //       .then(async (responsegetPropertiesPassive) => {
  //         let isFormData;
  //         await StructureWinformDataService.getFormData(nodeKey)
  //           .then((res) => {
  //             if (res.data.isActive) {
  //               isFormData = true;
  //             } else {
  //               isFormData = false;
  //             }
  //           })
  //           .catch((err) => {
  //           });

  //         if (isFormData === true) {
  //           console.log("11");


  //           const responsegetData = await StructureWinformDataService.getFormData(nodeKey);
  //           console.log(responsegetData);
  //           console.log(responsegetPropertiesPassive);

  //           const convertedData = responsegetPropertiesPassive.data?.map(function (item: any) {

  //             console.log(responsegetData.data[item.label.replaceAll(" ", "")]);
  //             console.log([responsegetData.data].length);

  //             return {
  //               ...item,
  //               defaultValue:
  //                 [responsegetData.data].length > 0
  //                   ? responsegetData.data[item.label.replaceAll(" ", "")]
  //                     ? responsegetData.data[item.label.replaceAll(" ", "")]
  //                     : item.defaultValue
  //                   : item.defaultValue,
  //               rules: { required: item.rules[0] },
  //               options: item.options.map(function (option: any) {
  //                 return { optionsName: option };
  //               }),
  //             };
  //           });
  //           setPassiveItems(convertedData);
  //         }

  //       })
  //       .catch((err) => {
  //         console.log(err);
  //         return;
  //         toast.current.show({
  //           severity: "error",
  //           summary: "Error",
  //           detail: err.responsegetPropertiesPassive
  //             ? err.responsegetPropertiesPassive.data.message
  //             : err.message,
  //           life: 2000,
  //         });
  //       });
  //   })();
  // }, [])

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
    // console.log(data);
    const key = uuidv4();
    data.key = key;
    // const formData = {
    //   nodeKey: nodeKey,
    //   data: data,
    // };
    addItem(data);
    console.log(data);
    // console.log(formData);
    // console.log(formData);

    // if (hasFormData === false) {
    //   StructureWinformDataService.createFormData(nodeKey, data)
    //     .then((res) => {
    //       toast.current.show({
    //         severity: "success",
    //         summary: "Successful",
    //         detail: "Form Data Created",
    //         life: 3000,
    //       });
    //       setTimeout(() => {
    //         setFormDia(false);
    //       }, 1000);
    //     })
    //     .catch((err) => {
    //       toast.current.show({
    //         severity: "error",
    //         summary: "Error",
    //         detail: err.response ? err.response.data.message : err.message,
    //         life: 2000,
    //       });
    //     });
    // } else {
    //   StructureWinformDataService.updateFormData(nodeKey, data)
    //     .then((res) => {
    //       toast.current.show({
    //         severity: "success",
    //         summary: "Successful",
    //         detail: "Form Data Updated",
    //         life: 3000,
    //       });
    //       setTimeout(() => {
    //         setFormDia(false);
    //       }, 1000);
    //     })
    //     .catch((err) => {
    //       toast.current.show({
    //         severity: "error",
    //         summary: "Error",
    //         detail: err.response ? err.response.data.message : err.message,
    //         life: 2000,
    //       });
    //     });
    // }
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
                console.log(items[e]);
                const { rules, defaultValue, label }: any = items[e];
                return (
                  <section key={e}>
                    {/* <label className="mb-4">{label}</label> */}
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
                            {...items[e] as any}
                          />
                        </div>
                      )}
                    />
                    {errors[label.replaceAll(" ", "")] && (
                      <Error>This field is required</Error>
                    )}
                  </section>
                );
              })}
            <div>
              {items.length > 0 && (
                <>
                  <div className="mt-4 ml-3 flex">
                    <Button className="p-button-success" type="submit">
                      Save
                    </Button>
                    <Button
                      className="ml-4 p-button-danger"
                      onClick={(e) => {
                        e.preventDefault();
                        // setFormDia(false);
                      }
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
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
