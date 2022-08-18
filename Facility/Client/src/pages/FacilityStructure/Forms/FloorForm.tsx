import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Chips } from 'primereact/chips';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../app/hook";
import FacilityStructureService from "../../../services/facilitystructure";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";

interface Params {
    selectedFacilityType: string | undefined;
    submitted: boolean;
    setSubmitted: any;
    selectedNodeKey: string;
    editDia: boolean;
    getFacilityStructure: () => void;
    setAddDia: React.Dispatch<React.SetStateAction<boolean>>;
    setEditDia: React.Dispatch<React.SetStateAction<boolean>>;
    isUpdate: boolean;
    setIsUpdate: React.Dispatch<React.SetStateAction<boolean>>;
    setSelectedFacilityType: React.Dispatch<React.SetStateAction<string | undefined>>;
}

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
    },
    icon?: string;
    label?: string;
    labels?: string[]; // for form type
    parentId?: string;
    className?: string;

}

const schema = yup.object({
    
    elevation: yup.number().moreThan(-1).notRequired(),
    height: yup.number().moreThan(-1).notRequired(),
    name: yup.string().required("This area is required.").min(2, "This area is accept min 2 characters."),
    projectName: yup.string().required()

});


const FloorForm = ({
    selectedFacilityType,
    submitted,
    setSubmitted,
    selectedNodeKey,
    editDia,
    getFacilityStructure,
    setAddDia,
    setEditDia,
    isUpdate,
    setIsUpdate,
    setSelectedFacilityType,

    
}: Params) => {

    const [name, setName] = useState<string>("");
    const [tag, setTag] = useState<string[]>([]);
    const [description, setDescription] = useState<string>("");
    const [projectName, setProjectName] = useState<string>("");
    const [elevation, setElevation] = useState<string>("");
    const [height, setHeight] = useState<string>("");

    const [data, setData] = useState<any>();

    const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
        defaultValues: {
            elevation: 0,
            height: 0,
            ...data
        },
        resolver: yupResolver(schema)
    }); //************************* */
    console.log("FORM ERRORS!!!", errors);

    const { toast } = useAppSelector(state => state.toast);

    useEffect(() => {
        if (submitted) {
            handleSubmit(onSubmit)();
        }
        setSubmitted(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [submitted]);

    useEffect(() => {
        if (isUpdate) {
            getNodeInfoForUpdate(selectedNodeKey);
        }
        setIsUpdate(false);
    }, [isUpdate]);

    const getNodeInfoForUpdate = (selectedNodeKey: string) => {
        FacilityStructureService.nodeInfo(selectedNodeKey)
            .then((res) => {
                // setName(res.data.properties.name || "");
                // setTag(res.data.properties.tag || []);
                // setDescription(res.data.properties.description || "");
                // setProjectName(res.data.properties.projectName || "");
                setData(res.data.properties)
            })
            .catch((err) => {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: err.response ? err.response.data.message : err.message,
                    life: 4000,
                });
            });
    }

    const onError = (errors: any, e: any) => console.log(errors, e);

    const onSubmit = (data: any) => {
        console.log("dataAAA: ", data);
        if (editDia === false) {
            let newNode: any = {};

            newNode = {
                // // name: name,
                // // tag: tag,
                // // description:description,
                // // projectName:projectName,
                // // nodeType: selectedFacilityType,
                name: data?.name,
                tag: data?.tag,
                description: data?.description,
                projectName: data?.projectName,
                nodeType: selectedFacilityType,

            };

            FacilityStructureService.createStructure(selectedNodeKey, newNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: "Successful",
                        detail: "Floor Created",
                        life: 4000,
                    });
                    // let newForm: any = {};
                    // newForm = {
                    //     referenceKey: formTypeId,
                    // };
                    // StructureWinformService.createForm(res.data.properties.key, newForm)
                    //     .then((res) => {
                    //     })
                    getFacilityStructure();

                })
                .catch((err) => {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: err.response ? err.response.data.message : err.message,
                        life: 4000,
                    });

                });

            setTimeout(() => {
                setAddDia(false);
                setSelectedFacilityType(undefined);
            }, 1000);


        } else {

            let updateNode: any = {};
            updateNode = {
                // name: name,
                // tag: tag,
                // description: description,
                // projectName: projectName,
                // nodeType: selectedFacilityType,
                name: data?.name,
                tag: data?.tag,
                description: data?.description,
                projectName: data?.projectName,
                nodeType: selectedFacilityType,

            };

            FacilityStructureService.update(selectedNodeKey, updateNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: "Successful",
                        detail: "Floor Updated",
                        life: 4000,
                    });
                    getFacilityStructure();
                })
                .catch((err) => {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: err.response ? err.response.data.message : err.message,
                        life: 4000,
                    });
                });
            setTimeout(() => {
                setEditDia(false);
            }, 1000);
        }

    };

    if (editDia && !data) {
        return null;
    }

    return (
        <form
        >

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
                <InputText
                    autoComplete="off"
                    {...register("name")}
                    style={{ width: '100%' }}
                    defaultValue={data?.name || ""}
                />
            </div>
            <p style={{ color: "red" }}>{errors.name?.message}</p>


            <div className="field structureChips">
                <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
                <Controller
                    
                    defaultValue={data?.tag || []}
                    name="tag"
                    control={control}
                    render={({ field }) => (
                        <Chips
                            value={field.value}
                            onChange={(e) => {
                                console.log("field value: ", e.value);
                                field.onChange(e.value)
                            }}
                            style={{ width: "100%" }}
                        />
                    )}
                />
            </div>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Description</h5>
                <InputText
                    autoComplete="off"
                    defaultValue={data?.description || ""}
                    {...register("description")}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.description?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Elevation (cm)</h5>
                <InputText
                    defaultValue={data?.elevation || ""}
                    {...register("elevation")}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.elevation?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Height (cm)</h5>
                <InputText
                    defaultValue={data?.height || ""}
                    {...register("height")}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.height?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Project Name</h5>
                <InputText
                    autoComplete="off"
                    defaultValue={data?.projectName || ""}
                    {...register("projectName",
                        {
                            required: "This area is required."
                        }
                    )}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.projectName?.message}</p>



        </form>
    );
};

export default FloorForm;
