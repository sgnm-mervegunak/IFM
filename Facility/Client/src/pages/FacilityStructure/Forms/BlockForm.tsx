import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Chips } from 'primereact/chips';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import FacilityStructureService from "../../../services/facilitystructure";
import { useAppSelector } from '../../../app/hook';

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
    name: yup.string().required("This area is required.").min(2, "This area accepts min 2 characters."),
});

const BlockForm = ({
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

    const [data, setData] = useState<any>();
    const { t } = useTranslation(["common"]);
    const { toast } = useAppSelector(state => state.toast);  

    const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
        defaultValues: {
            ...data,
        },
        resolver: yupResolver(schema)
    });

    useEffect(() => {
        if (submitted) {
            handleSubmit(onSubmit)();            
        }
        setSubmitted(false);

    }, [submitted]);

    useEffect(() => {
        if (isUpdate) {
            getNodeInfoForUpdate(selectedNodeKey);
        }
        setIsUpdate(false);
    }, [isUpdate]);

    useEffect(
        () => {
            console.log("useEffect'ten gelen data: ", data);
        }
        , [data])

    const getNodeInfoForUpdate = (selectedNodeKey: string) => {
        FacilityStructureService.nodeInfo(selectedNodeKey)
            .then((res) => {
                setData(res.data.properties);
                console.log("getNodeIndfo'dan gelen data:", res.data.properties);
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
        console.log("onSubmit'ten gelen data", data);
        if (editDia === false) {
            let newNode: any = {};

            newNode = {
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
                        summary: t("Successful"),
                        detail: t("Block Created"),
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
                projectName: data?.projectName,
                nodeType: selectedFacilityType,
            };

            FacilityStructureService.update(selectedNodeKey, updateNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: t("Successful"),
                        detail: t("Block Updated"),
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
        <form>
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
                <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
                <InputText
                    autoComplete="off"
                    defaultValue={data?.description || ""}
                    {...register("description")}
                    style={{ width: "100%" }}
                />
            </div>
            <p style={{ color: "red" }}>{errors.description?.message}</p>

            <div className="field structureChips">
                <h5 style={{ marginBottom: "0.5em" }}>{t("Tag")}</h5>
                <Controller
                    defaultValue={data?.tag}
                    name="tag"
                    control={control}
                    render={({ field }) => (
                        <Chips
                            value={field.value}
                            onChange={(e) => {
                                console.log("field value: ", e.value);
                                console.log("data tag:", data?.tag);
                                field.onChange(e.value)
                            }}
                            style={{ width: "100%" }}
                        />
                    )}
                />
            </div>
            <p style={{ color: "red" }}>{errors.tag?.message}</p>

        </form>
    );
};

export default BlockForm;
