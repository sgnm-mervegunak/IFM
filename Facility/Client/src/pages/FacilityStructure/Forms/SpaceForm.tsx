import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { useForm, Controller } from "react-hook-form";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import { RadioButton } from "primereact/radiobutton";
import { Button } from "primereact/button";
import { Calendar } from "primereact/calendar";
import { Chips } from 'primereact/chips';
import { TreeSelect } from "primereact/treeselect";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Toast } from "primereact/toast";

import ClassificationsService from "../../../services/classifications";
import FacilityStructureService from "../../../services/facilitystructure";
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

const SpaceForm = ({
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

    const [Code, setCode] = useState<string>("");
    const [Name, setName] = useState<string>("");
    const [ArchitecturalName, setArchitecturalName] = useState<string>("");
    const [SpaceType, setSpaceType] = useState<any>(undefined);
    const [M2, setM2] = useState<string>("");
    const [Usage, setUsage] = useState<string>("");
    const [Tag, setTag] = useState<string[]>([]);
    const [Images, setImages] = useState("");
    const [Status, setStatus] = useState<any>(undefined);
    const [classificationSpace, setClassificationSpace] = useState<Node[]>([]);
    const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
    const auth = useAppSelector((state) => state.auth);
    const [realm, setRealm] = useState(auth.auth.realm);
    const toast = React.useRef<any>(null);

    const fixNodes = (nodes: Node[]) => {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (let i of nodes) {
            fixNodes(i.children);
            i.label = i.name;
        }
    };

    const getClassificationSpace = async () => {
        await ClassificationsService.findAllActiveByLabel({ realm: realm, label: "OmniClass11", language: "en" }).then((res) => {
            let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
            fixNodes(temp);
            setClassificationSpace(temp);
        });
    };

    const getClassificationStatus = async () => {
        await ClassificationsService.findAllActiveByLabel({ realm: realm, label: "FacilityStatus", language: "en" }).then((res) => {
            let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
            fixNodes(temp);
            setclassificationStatus(temp);
        });
    };

    useEffect(() => {
        getClassificationSpace();
        getClassificationStatus();
    }, []);

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
                setCode(res.data.properties.Code || "");
                setName(res.data.properties.Name || "");
                setArchitecturalName(res.data.properties.ArchitecturalName || "");
                setSpaceType(res.data.properties.Category);
                setM2(res.data.properties.M2 || "");
                setUsage(res.data.properties.Usage);
                setTag(res.data.properties.Tag || []);
                setImages(res.data.properties.Images || "");
                setStatus(res.data.properties.Status);
            })
            .catch((err) => {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: err.response ? err.response.data.message : err.message,
                    life: 2000,
                });
            });
    }

    const onSubmit = () => {

        if (editDia === false) {
            let newNode: any = {};

            newNode = {
                Code: Code,
                Name: Name,
                ArchitecturalName: ArchitecturalName,
                SpaceType: SpaceType,
                M2: M2,
                Usage: Usage,
                Tag: Tag,
                Images: Images,
                Status: Status,
                NodeType: selectedFacilityType,
            };

            FacilityStructureService.createStructure(selectedNodeKey, newNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: "Successful",
                        detail: "Structure Created",
                        life: 3000,
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
                        life: 2000,
                    });

                });

            setTimeout(() => {
                setAddDia(false);
                setSelectedFacilityType(undefined);
            }, 1000);


        } else {

            let updateNode: any = {};
            updateNode = {
                Code: Code,
                Name: Name,
                ArchitecturalName: ArchitecturalName,
                SpaceType: SpaceType,
                M2: M2,
                Usage: Usage,
                Tag: Tag,
                Images: Images,
                Status: Status,
                NodeType: selectedFacilityType,
            };

            FacilityStructureService.update(selectedNodeKey, updateNode)
                .then((res) => {
                    toast.current.show({
                        severity: "success",
                        summary: "Successful",
                        detail: "Structure Updated",
                        life: 3000,
                    });
                    getFacilityStructure();
                })
                .catch((err) => {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: err.response ? err.response.data.message : err.message,
                        life: 2000,
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
                <h5 style={{ marginBottom: "0.5em" }}>Code</h5>
                <InputText
                    value={Code}
                    onChange={(event) => setCode(event.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
                <InputText
                    value={Name}
                    onChange={(event) => setName(event.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Architectural Name</h5>
                <InputText
                    value={ArchitecturalName}
                    onChange={(event) => setArchitecturalName(event.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Space Type</h5>
                <TreeSelect
                    value={SpaceType}
                    options={classificationSpace}
                    onChange={(e) => {
                        setSpaceType(e.value);
                    }}
                    filter
                    placeholder="Select Type"
                    style={{ width: '100%' }}
                />
            </div>
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>M2</h5>
                <InputText
                    value={M2}
                    onChange={(event) => setM2(event.target.value)}
                    style={{ width: '100%' }}
                />
            </div>
            <div className="field">
                <h5 style={{ marginBottom: "0.5em" }}>Usage</h5>
                <InputText
                    value={Usage}
                    onChange={(event) => setUsage(event.target.value)}
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
                <h5 style={{ marginBottom: "0.5em" }}>Status</h5>
                <TreeSelect
                    value={Status}
                    options={classificationStatus}
                    onChange={(e) => {
                        setStatus(e.value);
                    }}
                    filter
                    placeholder="Select Type"
                    style={{ width: '100%' }}
                />
            </div>


        </div>
    );
};

export default SpaceForm;