import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Chips } from 'primereact/chips';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useAppSelector } from "../../../app/hook";
import FacilityStructureService from "../../../services/facilitystructure";
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
    setSelectedFacilityType
}: Params) => {

    const [name, setName] = useState<string>("");
    const [tag, setTag] = useState<string[]>([]);
    const [description, setDescription] = useState<string>("");
    const [projectName, setProjectName] = useState<string>("");
    const [elevation, setElevation] = useState<string>("");
    const [height, setHeight] = useState<string>("");

    const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
        // defaultValues: {
        //     Name: "",
        //     Tag: null,
        //     Description: null,
        //     Elevation: null,
        //     Height: null,
        //     ProjectName:null
        // }
    }); //************************* */
    console.log("FORM ERRORS!!!", errors);

    const { toast } = useAppSelector(state => state.toast);

    // useEffect(() => {
    //     console.log(name);

    // }, [name]);


    useEffect(() => {
        if (submitted) {
            onSubmit();
        }
        setSubmitted(false);

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
                setName(res.data.properties.name || "");
                setTag(res.data.properties.tag || []);
                setDescription(res.data.properties.description || "");
                setProjectName(res.data.properties.projectName || "");
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


    const onSubmit = () => {

        if (editDia === false) {
            let newNode: any = {};

            newNode = {
                name: name,
                tag: tag,
                description: description,
                projectName: projectName,
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
                name: name,
                tag: tag,
                description: description,
                projectName: projectName,
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

    return (
        <form onSubmit={handleSubmit((data) => {
            console.log(data);
        })}>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
                <InputText
                    {...register("Name",
                        {
                            required: "This area is required.",
                            minLength: {
                                value: 2,
                                message: "Min length must be 2 characters long."
                            },

                            onChange: (event) => {
                                setName(event.target.value);
                            }
                        }
                    )}
                    style={{ width: '100%' }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.Name?.message}</p>


            <div className="field structureChips">
                <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
                <Controller
                    name="Tag"
                    control={control}
                    render={({ field }) => (
                        <Chips
                            value={field.value}
                            onChange={(e) => {
                                console.log("field value: ", e.value);
                                setTag(e.value);
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
                    {...register("Description",
                        {
                            onChange: (event) => {
                                setDescription(event.target.value);
                            }
                        }
                    )}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.Description?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Elevation (cm)</h5>
                <InputText
                    {...register("Elevation",
                        {
                            onChange: (event) => {
                                const value = event.target.value; //convert value from type string to number
                                console.log("------------", !isNaN(+value), "------"); //check if it is a number

                                if (!isNaN(+value)) {

                                    setElevation(event.target.value);
                                } else {
                                    alert("You can enter here only numerical values.")
                                }
                            }
                        }

                    )}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.Elevation?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Height (cm)</h5>
                <InputText
                    {...register("Height",
                        {
                            onChange: (event) => {
                                const value = event.target.value; //convert value from type string to number
                                console.log("------------", !isNaN(+value), "------"); //check if it is a number

                                if (!isNaN(+value)) {

                                    setHeight(value);
                                } else {
                                    alert("You can enter here only numerical values.")
                                }
                            }
                        }

                    )}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.Height?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Project Name</h5>
                <InputText
                    {...register("ProjectName",
                        {
                            required: "This area is required.",
                            onChange: (event) => {
                                setProjectName(event.target.value);
                            }
                        }

                    )}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.ProjectName?.message}</p>


            <input type={"submit"} />

        </form>
    );
};

export default FloorForm;
