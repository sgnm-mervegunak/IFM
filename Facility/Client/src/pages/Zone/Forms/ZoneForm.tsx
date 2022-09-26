import React, { useEffect, useState } from "react";
import { Chips } from "primereact/chips";
import { InputText } from "primereact/inputtext";
import { TreeSelect } from "primereact/treeselect";
import { TabPanel, TabView } from "primereact/tabview";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useForm, Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import axios from "axios";

import FacilityStructureService from "../../../services/facilitystructure";
import ClassificationsService from "../../../services/classifications";
import ZoneService from "../../../services/zone";
import { useAppSelector } from "../../../app/hook";
import DocumentUploadComponent from "../../FacilityStructure/Forms/FileUpload/DocumentUpload/DocumentUpload";
import ImageUploadComponent from "../../FacilityStructure/Forms/FileUpload/ImageUpload/ImageUpload";

interface Params {
    submitted: boolean;
    setSubmitted: any;
    selectedNodeKey: string;
    setSelectedNodeKey: React.Dispatch<React.SetStateAction<string[]>>;
    editDia: boolean;
    getZone: () => void;
    setAddDia: React.Dispatch<React.SetStateAction<boolean>>;
    setEditDia: React.Dispatch<React.SetStateAction<boolean>>;
    isUpdate: boolean;
    setIsUpdate: React.Dispatch<React.SetStateAction<boolean>>;
    zoneData: Node[];
    selectedSpaceKeys: string[];
    setSelectedSpaceKeys: React.Dispatch<React.SetStateAction<string[]>>,
    selectedSpaceNames: string[],
    setSelectedSpaceNames: React.Dispatch<React.SetStateAction<string[]>>
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
    };
    icon?: string;
    label?: string;
    labels?: string[]; // for form type
    parentId?: string;
    className?: string;
    Name?: string;
    selectable?: boolean;
    nodeType?: string;
    isBlocked?: boolean;
}


const ZoneForm = ({
    submitted,
    setSubmitted,
    selectedNodeKey,
    setSelectedNodeKey,
    editDia,
    getZone,
    setAddDia,
    setEditDia,
    isUpdate,
    setIsUpdate,
    zoneData,
    selectedSpaceKeys,
    setSelectedSpaceKeys,
    selectedSpaceNames,
    setSelectedSpaceNames
}: Params) => {

    const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
    const [classificationSpace, setClassificationSpace] = useState<Node[]>([]);
    const [classificationStatus, setclassificationStatus] = useState<Node[]>([]);
    const auth = useAppSelector((state) => state.auth);
    const [realm, setRealm] = useState(auth.auth.realm);
    const { toast } = useAppSelector((state) => state.toast);
    const { t } = useTranslation(["common"]);
    const [codeCategory, setCodeCategory] = useState("");
    const [createdByNodeId, setCreatedByNodeId] = useState<string>("");
    const [categoryNodeId, setCategoryNodeId] = useState<string>("");
    const [isActive, setIsActive] = useState<boolean>(true);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    // const [selectedKeysName, setSelectedKeysName] = useState<string[]>([]);
    const [uploadFiles, setUploadFiles] = useState<any>({});
    const [deleteFiles, setDeleteFiles] = useState<any[]>([]);
    const [formData, setFormData] = useState<any>();

    const [data, setData] = useState<any>();


    const schema = yup.object({
        name: yup.string().required(t("This area is required.")).max(50, t("This area accepts max 50 characters.")),
        category: yup.string().required(t("This area is required.")),
    });

    const { register, handleSubmit, watch, formState: { errors }, control, reset, formState, formState: { isSubmitSuccessful }, } = useForm({
        defaultValues: {
            siteName: realm,
            ...data
        },
        resolver: yupResolver(schema),
    });

    const fixNodes = (nodes: Node[]) => {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (let i of nodes) {
            fixNodes(i.children);
            i.icon = "pi pi-fw pi-building";
            i.label = i.name || i.Name;
            if (i.nodeType === "Space") {
                i.selectable = true;
            } else {
                i.selectable = false;
            }

            if (i.name === "Zones") {
                i.icon = "pi pi-fw pi-star-fill";
            }
        }
    };


    const fixNodesClassification = (nodes: Node[]) => {
        if (!nodes || nodes.length === 0) {
            return;
        }
        for (let i of nodes) {
            fixNodesClassification(i.children);
            i.label = i.name;
            i.selectable = true;
        }
    };

    const getClassificationSpace = async () => {
        await ClassificationsService.findAllActiveByLabel({
            label: "FacilityZoneTypes",
        }).then((res) => {
            let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
            fixNodesClassification(temp);
            setClassificationSpace(temp);
        });
    };

    const getClassificationStatus = async () => {
        await ClassificationsService.findAllActiveByLabel({
            label: "FacilityZoneTypes",
        }).then((res) => {
            let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
            fixNodesClassification(temp);
            temp[0].selectable = false;
            setclassificationStatus(temp);
        });
    };

    const getClassificationCategory = async () => {
        await ClassificationsService.findAllActiveByLabel({
            label: "OmniClass34"
        }).then((res) => {
            let temp = JSON.parse(JSON.stringify([res.data.root.children[0]] || []));
            fixNodes(temp);
            setClassificationCategory(temp);
        });
    };

    useEffect(() => {
        getClassificationCategory();
        getClassificationSpace();
        getClassificationStatus();
    }, []);

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

    useEffect(() => {
        watch((value, { name, type }) => console.log(value, name, type));
    }, [watch]);

    const getNodeInfoForUpdate = (selectedNodeKey: string) => {
        FacilityStructureService.nodeInfo(selectedNodeKey)
            .then(async(res) => {
                // setSelectedFacilityType(res.data.properties.nodeType);
                // res.data.properties.category = res.data.properties.classificationKey;
                // res.data.properties.createdBy = res.data.properties.createdByKey;
                await ClassificationsService.findClassificationByCode(res.data.properties?.category)
                    .then(
                        (clsf) => {
                            res.data.properties.category = clsf.data[1]?._fields[0]?.properties?.key;
                        }
                    )
                    .catch((err) => {
                        console.log("err", err);
                    })

                setData(res.data.properties);
            })
            .catch((err) => {
                toast.current.show({
                    severity: "error",
                    summary: "Error",
                    detail: err.response ? err.response.data.message : err.message,
                    life: 2000,
                });
            });
    };

    const UploadAnyFile = (folderName: string, file: any) => {
        const url = process.env.REACT_APP_API_MINIO_URL + "/file-upload/single";
        const formData = new FormData();

        formData.append("file", file);
        formData.append("realmName", realm);
        formData.append("folderName", folderName);

        return axios.post(url, formData);
    };

    const onSubmit = (data: any) => {
        if (editDia === false) {

            let newNode: any = {};
            newNode = {
                name: data?.name,
                code: data?.code,
                tag: data?.tag,
                description: data?.description,
                category: codeCategory,
                spaceNames: `${selectedSpaceNames.toString().replaceAll(",", ", ")}` || "",
                nodeKeys: selectedSpaceKeys || [],
                credatedBy: data?.credatedBy,
                createdOn: data?.createdOn,
                externalSystem: data?.externalSystem,
                externalObject: data?.externalObject,
                images: data?.images || "",
                documents: data?.documents || "",
            };
            ZoneService.createZone(newNode)
                .then(async (res) => {
                    toast.current.show({
                        severity: "success",
                        summary: "Successful",
                        detail: "Zone Created",
                        life: 3000,
                    });
                    // upload files

                    let temp = {} as any;
                    for (let item in uploadFiles) {
                        temp[item] = [];
                        for (let file of uploadFiles[item]) {

                            if (file.isImage) {

                                let resFile = await UploadAnyFile(
                                    res.data.key + "/" + item,
                                    file.file
                                    );
                                delete resFile.data.message;
                                temp[item].push({ ...resFile.data, main: file.main });
                            } else {

                                let resFile = await UploadAnyFile(
                                    res.data.key + "/" + item,
                                    file.file
                                );
                                delete resFile.data.message;
                                temp[item].push({ ...resFile.data, type: file.type });
                            }
                        }
                    }


                    for (let item in temp) {

                        temp[item] = JSON.stringify(temp[item]);
                    }
                   

                    await ZoneService.update(res.data.id, { ...newNode, ...temp })

                    // reset({ name: "", code: "", description: "", tag: [], category: "" });

                    setSelectedNodeKey([]);
                    // setCreateZone({} as Node);
                    // setSelectedKeys([]);
                    setSelectedSpaceKeys([]);
                    setAddDia(false);
                    getZone();
                    // setSelectedKeysName([]);
                    setSelectedSpaceNames([]);
                })
                .catch((err) => {
                    toast.current.show({
                        severity: "error",
                        summary: "Error",
                        detail: err.response ? err.response.data.message : err.message,
                        life: 2000,
                    });
                });

        } else {
            let updateNode: any = {};
            FacilityStructureService.nodeInfo(selectedNodeKey)
                .then((res) => {
                    updateNode = {
                        name: data?.name,
                        code: data?.code,
                        tag: data?.tag,
                        description: data?.description,
                        // category: codeCategory,
                        category: codeCategory,
                        // spaceNames: `${selectedSpaceNames.toString().replaceAll(",", ", ")}` || "",
                        spaceNames: res.data?.properties?.spaceNames || "",
                        nodeKeys: res.data?.properties?.nodeKeys || [],
                        createdBy: res.data?.properties?.createdBy || "",
                        createdOn: res.data?.properties?.createdOn || "",
                        externalSystem: res.data?.properties?.externalSystem || "",
                        externalObject: res.data?.properties?.externalObject || "",
                        images: data?.images || "",
                        documents: data?.documents || "",
                    };

                    console.log("update zone node: ", updateNode)
                    FacilityStructureService.update(res.data.id, updateNode)
                        .then((res) => {
                            toast.current.show({
                                severity: "success",
                                summary: t("Successful"),
                                detail: t("Contact Updated"),
                                life: 3000,
                            });
                            getZone();
                        })
                        .catch((err) => {
                            toast.current.show({
                                severity: "error",
                                summary: t("Error"),
                                detail: err.response ? err.response.data.message : err.message,
                                life: 2000,
                            });
                        });
                })
                .catch((err) => {
                    toast.current.show({
                        severity: "error",
                        summary: t("Error"),
                        detail: err.response ? err.response.data.message : err.message,
                        life: 2000,
                    });
                });
            setEditDia(false);
        }
    };


    if (editDia && !data) {
        return null;
    }

    return (
        <form>
            <TabView>
                <TabPanel header={t("Form")}>
                    <div className="field">
                        <h5 style={{ marginBottom: "0.5em" }}>{t("Name")}</h5>
                        <InputText
                            autoComplete="off"
                            {...register("name")}
                            style={{ width: "100%" }}
                            defaultValue={data?.name || ""}
                        />
                    </div>
                    <p style={{ color: "red" }}>{errors.name?.message}</p>

                    <div className="field">
                        <h5 style={{ marginBottom: "0.5em" }}>{t("Code")}</h5>
                        <InputText
                            autoComplete="off"
                            {...register("code")}
                            style={{ width: "100%" }}
                            defaultValue={data?.code || ""}
                        />
                        <p style={{ color: "red" }}>{errors.code?.message}</p>
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
                                        field.onChange({
                                            target: { name: "tag", value: e.value },
                                        });
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
                            {...register("description")}
                            style={{ width: "100%" }}
                            defaultValue={data?.description || ""}
                        />
                    </div>

                    <div className="field">
                        <h5 style={{ marginBottom: "0.5em" }}>{t("Category")}</h5>
                        <Controller
                            defaultValue={data?.category}
                            name="category"
                            control={control}
                            render={({ field }) => (
                                <TreeSelect
                                    value={field.value}
                                    options={classificationSpace}
                                    onChange={(e) => {
                                        ClassificationsService.nodeInfo(e.value as string).then(
                                            (res) => {
                                                field.onChange(e.value);
                                                setCodeCategory(res.data.properties.code || "");
                                            }
                                        );
                                    }}
                                    filter
                                    placeholder="Select Type"
                                    style={{ width: "100%" }}
                                />
                            )}
                        />
                    </div>
                    <p style={{ color: "red" }}>{errors.category?.message}</p>

                </TabPanel>
                <TabPanel header={t("Images")}>
                    <div className="formgrid grid">
                        <div className="field col-12">
                            <h5 style={{ marginBottom: "0.5em" }}>{t("Images")}</h5>
                            <Controller
                                name="images"
                                defaultValue={data?.images || []}
                                control={control}
                                render={({ field }) => (
                                    <ImageUploadComponent
                                        label={"images"}
                                        value={field.value}
                                        onChange={(e: any) => {
                                            field.onChange(e);
                                        }}
                                        deleteFiles={deleteFiles}
                                        setDeleteFiles={setDeleteFiles}
                                        uploadFiles={uploadFiles}
                                        setUploadFiles={setUploadFiles}
                                    />
                                )}
                            />
                            <p style={{ color: "red" }}>{errors.images?.message}</p>
                        </div>
                    </div>
                </TabPanel>
                <TabPanel header={t("Documents")}>
                    <div className="formgrid grid">
                        <div className="field col-12">
                            <h5 style={{ marginBottom: "0.5em" }}>{t("Documents")}</h5>
                            <Controller
                                name="documents"
                                defaultValue={data?.documents || []}
                                control={control}
                                render={({ field }) => (
                                    <DocumentUploadComponent
                                        label={"documents"}
                                        value={field.value}
                                        onChange={(e: any) => {
                                            field.onChange(e);
                                        }}
                                        deleteFiles={deleteFiles}
                                        setDeleteFiles={setDeleteFiles}
                                        uploadFiles={uploadFiles}
                                        setUploadFiles={setUploadFiles}
                                    />
                                )}
                            />
                            <p style={{ color: "red" }}>{errors.documents?.message}</p>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </form>
    );

}

export default ZoneForm;
