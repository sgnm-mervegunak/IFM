import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { Chips } from 'primereact/chips';
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";

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

    const [Name, setName] = useState<string>("");
    const [Tag, setTag] = useState<string[]>([]);
    const [Description, setDescription] = useState<string>("");
    const [ProjectName, setProjectName] = useState<string>("");
    const toast = React.useRef<any>(null);

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
                setName(res.data.properties.Name || "");
                setTag(res.data.properties.Tag || []);
                setDescription(res.data.properties.Description || "");
                setProjectName(res.data.properties.ProjectName || "");
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
                Name: Name,
                Tag: Tag,
                Description: Description,
                ProjectName: ProjectName,
                NodeType: selectedFacilityType,
            };

            FacilityStructureService.createStructure(selectedNodeKey, newNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: "Successful",
                        detail: "Structure Created",
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
                Name: Name,
                Tag: Tag,
                Description: Description,
                ProjectName: ProjectName,
                NodeType: selectedFacilityType,
            };

            FacilityStructureService.update(selectedNodeKey, updateNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: "Successful",
                        detail: "Structure Updated",
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
        <div>
            <Toast ref={toast} position="top-right" />
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
                <InputText
                    value={Name}
                    onChange={(event) => setName(event.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div className="field structureChips">
                <h5 style={{ marginBottom: "0.5em" }}>Tag</h5>
                <Chips
                    value={Tag}
                    onChange={(e) => setTag(e.value)}
                    style={{ width: "100%" }}
                />
            </div>
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Description</h5>
                <InputText
                    value={Description}
                    onChange={(event) => setDescription(event.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Project Name</h5>
                <InputText
                    value={ProjectName}
                    onChange={(event) => setProjectName(event.target.value)}
                    style={{ width: '100%' }}
                />
            </div>

        </div>
    );
};

export default FloorForm;
