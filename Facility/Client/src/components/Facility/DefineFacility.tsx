import React, { useEffect, useState } from "react";
// eslint-disable-next-line import/named
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Chips } from "primereact/chips";
// import { TreeSelect } from 'primereact/treeselect';
import { Dropdown } from "primereact/dropdown";
import FacilityService from "../../services/facility";
import Addresses from "../Address/Addresses";
import { TreeSelect } from "primereact/treeselect";
import ClassificationsService from "../../services/classifications";

interface Node {
  _id?: string;
  key: string;
  label: string;
  name: string;
  code: string;
  selectable: boolean;
  children: Node[];
  __v?: number;
}

interface Params {
  submitted: boolean;
  setSubmitted: React.Dispatch<React.SetStateAction<boolean>>;
  hideDialog: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toast: React.MutableRefObject<any>;
  loadLazyData: () => void;
  facility: Facility;
}

interface Address {
  title: string;
  country: string;
  city: string;
  address: string;
}
interface Facility {
  _id: string;
  facility_name: string;
  brand_name: string;
  type_of_facility: string;
  classifications: object;
  pathtoChosenNodeClassification: {
    node:Node,
    result: Array<any>
  };
  address: Address[];
  label: string[];
  __v: number;
}

type Inputs = {
  facility_name: string;
  brand_name: string;
  type_of_facility: { name: string };
  address?: Address[];
  classifications: string;
  label: string[];
};

const typesOfFacility = [
  { name: "Mall" },
  { name: "Campus" },
  { name: "University" },
];

const facility_classfication = process.env.REACT_APP_FACILITY_CLASSIFICATION || "";

const DefineFacility = ({
  submitted,
  setSubmitted,
  hideDialog,
  toast,
  loadLazyData,
  facility,
}: Params) => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const [classifications, setClassifications] = useState<Node[]>([]);
  const [addresses, setAddresses] = useState<Address[]>(facility.address);

  useEffect(() => {
    ClassificationsService.findOne(facility_classfication)
      .then((res) => {
        setClassifications([res.data.detail.root]);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: "Error",
          detail: "Facility Classification not found",
          life: 4000,
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (submitted) {
      handleSubmit(onSubmit)();
    }
    setSubmitted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  const findNode = (
    search: string,
    data: Node[],
    result: Node[] = []
  ): { node: Node; result: Node[] } | undefined => {
    for (let node of data) {
      var _result = [...result, node];
      if (node.key === search) {
        return { node: node, result: _result };
      }
      const found = findNode(search, node.children, _result);
      if (found) {
        return { node: found.node, result: found.result };
      }
    }
  };

  const onSubmit: SubmitHandler<Inputs> = (data) => {
    var node = findNode(data.classifications, classifications);


    if (facility._id === "") {
      FacilityService.create({
        ...data,
        address: addresses,
        type_of_facility: data.type_of_facility.name,
        classifications: [facility_classfication],
        pathtoChosenNodeClassification: node || {
          node: {},
          result: [],
        },
      })
        .then((res) => {
          loadLazyData();
          toast.current.show({
            severity: "success",
            summary: "Successful",
            detail: "Facility Created",
            life: 2000,
          });
          hideDialog();
        })
        .catch((err) => {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
          hideDialog();
        });
    } else {
      FacilityService.update(facility._id, {
        ...data,
        address: addresses,
        type_of_facility: data.type_of_facility.name,
        classifications: [facility_classfication],
        pathtoChosenNodeClassification: node || {
          node: {},
          result: [],
        },
      })
        .then((res) => {
          loadLazyData();
          toast.current.show({
            severity: "success",
            summary: "Successful",
            detail: "Facility Updated",
            life: 2000,
          });
          hideDialog();
        })
        .catch((err) => {
          console.log("dsa")
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: err.response ? err.response.data.message : err.message,
            life: 4000,
          });
          hideDialog();
        });
    }
  };

  return (
    <div className="container">
      <form>
        <div className="field">
          <label>Facility Name</label>
          <InputText
            defaultValue={facility.facility_name}
            className={errors.facility_name && "p-invalid"}
            {...register("facility_name", { required: true })}
          />
          {errors.facility_name && (
            <small className="p-error block">This field is required.</small>
          )}
        </div>
        <div className="field">
          <label>Brand Name</label>
          <InputText
            defaultValue={facility.brand_name}
            className={errors.brand_name && "p-invalid"}
            {...register("brand_name", { required: true })}
          />
          {errors.brand_name && (
            <small className="p-error block">This field is required.</small>
          )}
        </div>
        <div className="field">
          <label>Type Of Facility</label>
          <Controller
            name="type_of_facility"
            rules={{ required: "Type Of Facility is required." }}
            control={control}
            defaultValue={
              facility.type_of_facility !== ""
                ? { name: facility.type_of_facility }
                : undefined
            }
            render={({ field }) => (
              <Dropdown
                filter
                optionLabel="name"
                value={field.value}
                options={typesOfFacility}
                className={errors.type_of_facility && "p-invalid"}
                onChange={(e) => field.onChange(e.value)}
                placeholder="Select a Type of Facility"
              />
            )}
          />
          {errors.type_of_facility && (
            <small className="p-error block">This field is required.</small>
          )}
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Classification of Facility</h5>
          <Controller
            name="classifications"
            rules={{ required: "Classification of Facility is required." }}
            control={control}
            defaultValue={facility.pathtoChosenNodeClassification ? facility.pathtoChosenNodeClassification.node.key : ""}
            render={({ field }) => (
              <TreeSelect
                value={field.value}
                options={classifications}
                className={errors.classifications && "p-invalid"}
                onChange={(e) => field.onChange(e.value)}
                filter
                filterBy="name,code"
                placeholder="Select Classification of Facility"
              ></TreeSelect>
            )}
          />
          {errors.classifications && (
            <small className="p-error block">This field is required.</small>
          )}
        </div>
        <div className="field">
          <label>Hashtag</label>
          <Controller
            name="label"
            control={control}
            defaultValue={facility.label}
            render={({ field }) => (
              <Chips
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
              />
            )}
          />
        </div>
        <Addresses addresses={addresses} setAddresses={setAddresses} />
      </form>
    </div>
  );
};

export default DefineFacility;
