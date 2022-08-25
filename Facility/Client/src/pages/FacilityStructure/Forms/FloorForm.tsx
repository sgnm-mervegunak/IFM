import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Chips } from 'primereact/chips';
import { TreeSelect } from "primereact/treeselect";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import FacilityStructureService from "../../../services/facilitystructure";
import ClassificationsService from "../../../services/classifications";
import { useAppSelector } from "../../../app/hook";

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

    elevation: yup.number().moreThan(-1).notRequired().nullable(),
    height: yup.number().moreThan(-1).notRequired().nullable(),
    name: yup.string().required("This area is required.").min(2, "This area accepts min 2 characters."),

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

    const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
    const auth = useAppSelector((state) => state.auth);
    const [realm, setRealm] = useState(auth.auth.realm);
    const [data, setData] = useState<any>();
    const { t } = useTranslation(["common"]);

    const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
        defaultValues: {
            elevation: null,
            height: null,
            ...data
        },
        resolver: yupResolver(schema)
    });

    const { toast } = useAppSelector(state => state.toast);

    const fixNodes = (nodes: Node[]) => {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (let i of nodes) {
            fixNodes(i.children);
            i.label = i.name;
        }
    };

    const getClassificationCategory = async () => {
        await ClassificationsService.findAllActiveByLabel({
            realm: realm,
            label: "FacilityFloorTypes",
            language: "en",
        }).then((res) => {
            let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
            fixNodes(temp);
            setClassificationCategory(temp);
        });
    };

    useEffect(() => {
        getClassificationCategory();
    }, []);

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
                setData(res.data.properties)
            })
            .catch((err) => {
                toast.current.show({
                    severity: "error",
                    summary: t("Error"),
                    detail: err.response ? err.response.data.message : err.message,
                    life: 4000,
                });
            });
    }

    const onSubmit = (data: any) => {
        if (editDia === false) {
            let newNode: any = {};

            newNode = {
                name: data?.name,
                tag: data?.tag,
                description: data?.description,
                nodeType: selectedFacilityType,
                elevation: data?.elevation || "",
                height: data?.height ||"",
                category: data?.category,
            };
            console.log(newNode);
            

            FacilityStructureService.createStructure(selectedNodeKey, newNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: t("Successful"),
                        detail: t("Floor Created"),
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
                        summary: t("Error"),
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
                name: data?.name,
                tag: data?.tag,
                description: data?.description,
                nodeType: selectedFacilityType,
                elevation: data?.elevation || "",
                height: data?.height || "",
                category: data?.category,
            };

            FacilityStructureService.update(selectedNodeKey, updateNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: t("Successful"),
                        detail: t("Floor Updated"),
                        life: 4000,
                    });
                    getFacilityStructure();
                })
                .catch((err) => {
                    toast.current.show({
                        severity: "error",
                        summary: t("Error"),
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
                <h5 style={{ marginBottom: "0.5em" }}>{t("Name")}</h5>
                <InputText
                    autoComplete="off"
                    {...register("name")}
                    style={{ width: '100%' }}
                    defaultValue={data?.name || ""}
                />
            </div>
            <p style={{ color: "red" }}>{errors.name?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>{t("Category")}</h5>
                <Controller

                    defaultValue={data?.category || []}
                    name="category"
                    control={control}
                    render={({ field }) => (
                        <TreeSelect
                            value={field.value}
                            options={classificationCategory}
                            onChange={(e) => {
                                field.onChange(e.value)
                            }}
                            filter
                            placeholder="Select Type"
                            style={{ width: "100%" }}
                        />
                    )}
                />
            </div>

            <div className="field structureChips">
                <h5 style={{ marginBottom: "0.5em" }}>{t("Tag")}</h5>
                <Controller

                    defaultValue={data?.tag || []}
                    name="tag"
                    control={control}
                    render={({ field }) => (
                        <Chips
                            value={field.value}
                            onChange={(e) => {
                                field.onChange(e.value)
                            }}
                            style={{ width: "100%" }}
                        />
                    )}
                />
            </div>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
                <InputText
                    autoComplete="off"
                    defaultValue={data?.description || ""}
                    {...register("description")}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.description?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>{t("Elevation")} (cm)</h5>
                <InputText
                    autoComplete={"off"}
                    defaultValue={data?.elevation || ""}
                    {...register("elevation")}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.elevation?.message}</p>

            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>{t("Height")} (cm)</h5>
                <InputText
                    autoComplete={"off"}
                    defaultValue={data?.height || ""}
                    {...register("height")}
                    style={{ width: "100%" }}
                    
                />
            </div>
            <p style={{ color: "red" }}>{errors.height?.message}</p>

        </form>
    );
};

export default FloorForm;
