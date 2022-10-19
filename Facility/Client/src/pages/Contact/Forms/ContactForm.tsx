import React, { useState, useEffect, InputHTMLAttributes } from "react";
import { InputText } from "primereact/inputtext";
import { Calendar } from "primereact/calendar";
import { Chips } from "primereact/chips";
import { TreeSelect } from "primereact/treeselect";
import { TabView, TabPanel } from 'primereact/tabview';
import { Checkbox } from "primereact/checkbox";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { useTranslation } from "react-i18next";

import ClassificationsService from "../../../services/classifications";
import ContactService from "../../../services/contact";
import { useAppSelector } from "../../../app/hook";
import useToast from "../../../hooks/useToast";

interface Params {
  submitted: boolean;
  setSubmitted: any;
  selectedNodeKey: string;
  editDia: boolean;
  getContact: () => void;
  setAddDia: React.Dispatch<React.SetStateAction<boolean>>;
  setEditDia: React.Dispatch<React.SetStateAction<boolean>>;
  isUpdate: boolean;
  setIsUpdate: React.Dispatch<React.SetStateAction<boolean>>;
  contactData: Node[];
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
  _id?: {
    low: string;
    high: string;
  };
  icon?: string;
  label?: string;
  labels?: string[]; // for form type
  parentId?: string;
  className?: string;
}

const ContactForm = ({
  submitted,
  setSubmitted,
  selectedNodeKey,
  editDia,
  getContact,
  setAddDia,
  setEditDia,
  isUpdate,
  setIsUpdate,
  contactData,
}: Params) => {

  const [classificationCategory, setClassificationCategory] = useState<Node[]>([]);
  const auth = useAppSelector((state) => state.auth);
  const [realm, setRealm] = useState(auth.auth.realm);
  const { toast } = useToast()
  const { t } = useTranslation(["common"]);
  const [codeCategory, setCodeCategory] = useState("");
  const [createdByNodeId, setCreatedByNodeId] = useState<string>("");
  const [categoryNodeId, setCategoryNodeId] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  const [data, setData] = useState<any>();

  const schema = yup.object({
    email: yup.string().required(t("This area is required.")),
    category: yup.string().required(t("This area is required.")),
    company: yup.string().required(t("This area is required.")),
    phone: yup.string().required(t("This area is required.")),
  });

  const { register, handleSubmit, watch, formState: { errors }, control } = useForm({
    defaultValues: {
      siteName: realm,
      ...data
    },
    resolver: yupResolver(schema)
  });

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
      label: "OmniClass34"
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
  }, [submitted]);

  useEffect(() => {
    if (isUpdate) {
      getNodeInfoForUpdate(selectedNodeKey);
    }
    setIsUpdate(false);
  }, [isUpdate]);

  const getNodeInfoForUpdate = (selectedNodeKey: string) => {
    ContactService.nodeInfo(selectedNodeKey)
      .then(async (res) => {
        res.data.properties.category=res.data.properties.classificationKey;
        res.data.properties.createdBy=res.data.properties.createdByKey;
        setData(res.data.properties);
      })
      .catch((err) => {
        toast.current.show({
          severity: "error",
          summary: t("Error"),
          detail: err.response ? err.response.data.message : err.message,
          life: 4000,
        });
      });
  };


  const onSubmit = (data: any) => {
    if (editDia === false) {
      let newNode: any = {};
     
          newNode = {
            name: data?.email,
            email: data?.email,
            category: codeCategory,
            company: data?.company,
            phone: data?.phone,
            formTypeId: "",
            department: data?.department,
            organizationCode: data?.organizationCode,
            givenName: data?.givenName,
            familyName: data?.familyName,
            street: data?.street,
            postalBox: data?.postalBox,
            town: data?.town,
            stateRegion: data?.stateRegion,
            postalCode: data?.postalCode,
            country: data?.country,
            tag: data?.tag,
            description: data?.description,
            createdById: createdByNodeId,
            classificationId: categoryNodeId,
          };

          console.log(newNode);
          

          ContactService.create(newNode)
            .then((res) => {
              toast.current.show({
                severity: "success",
                summary: t("Successful"),
                detail: t("Contact Created"),
                life: 3000,
              });
              getContact();
            })
            .catch((err) => {
              toast.current.show({
                severity: "error",
                summary: t("Error"),
                detail: err.response ? err.response.data.message : err.message,
                life: 2000,
              });
            });
        
      
      setAddDia(false);

    } else {
      let updateNode: any = {};
      ContactService.nodeInfo(selectedNodeKey)
        .then((res) => {
          updateNode = {
            name: data?.email,
            email: data?.email,
            category: codeCategory,
            company: data?.company,
            phone: data?.phone,
            formTypeId: "",
            department: data?.department,
            organizationCode: data?.organizationCode,
            givenName: data?.givenName,
            familyName: data?.familyName,
            street: data?.street,
            postalBox: data?.postalBox,
            town: data?.town,
            stateRegion: data?.stateRegion,
            postalCode: data?.postalCode,
            country: data?.country,
            tag: data?.tag,
            description: data?.description,
            createdById: createdByNodeId,
            classificationId: categoryNodeId,
            isActive: isActive,
          };

          ContactService.update(res.data.id, updateNode)
            .then((res) => {
              toast.current.show({
                severity: "success",
                summary: t("Successful"),
                detail: t("Contact Updated"),
                life: 3000,
              });
              getContact();
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
          <div className="formgrid grid">

            <div className="field col-12 md:col-4">
              <h5 className="required" style={{ marginBottom: "0.5em" }}>{t("Email")}</h5>
              <InputText
                autoComplete="off"
                {...register("email")}
                style={{ width: '100%' }}
                defaultValue={data?.email || ""}
              />
              <p style={{ color: "red" }}>{errors.email?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 className="required" style={{ marginBottom: "0.5em" }}>{t("Category")}</h5>
              <Controller
                defaultValue={data?.category}
                name="category"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={classificationCategory}
                    onChange={(e) => {
                      ClassificationsService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCodeCategory(res.data.properties.code || "");
                          setCategoryNodeId(res.data.id)
                        })
                    }}
                    filter
                    placeholder="Select Type"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.category?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 className="required" style={{ marginBottom: "0.5em" }}>{t("Company")}</h5>
              <InputText
                autoComplete="off"
                {...register("company")}
                style={{ width: '100%' }}
                defaultValue={data?.company || ""}
              />
              <p style={{ color: "red" }}>{errors.company?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 className="required" style={{ marginBottom: "0.5em" }}>{t("Phone")}</h5>
              <InputText
                autoComplete="off"
                {...register("phone")}
                style={{ width: '100%' }}
                defaultValue={data?.phone || ""}
              />
              <p style={{ color: "red" }}>{errors.phone?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Department")}</h5>
              <InputText
                autoComplete="off"
                {...register("department")}
                style={{ width: '100%' }}
                defaultValue={data?.department || ""}
              />
              <p style={{ color: "red" }}>{errors.department?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Organization Code")}</h5>
              <InputText
                autoComplete="off"
                {...register("organizationCode")}
                style={{ width: '100%' }}
                defaultValue={data?.organizationCode || ""}
              />
              <p style={{ color: "red" }}>{errors.organizationCode?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Given Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("givenName")}
                style={{ width: '100%' }}
                defaultValue={data?.givenName || ""}
              />
              <p style={{ color: "red" }}>{errors.givenName?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Family Name")}</h5>
              <InputText
                autoComplete="off"
                {...register("familyName")}
                style={{ width: '100%' }}
                defaultValue={data?.familyName || ""}
              />
              <p style={{ color: "red" }}>{errors.familyName?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Street")}</h5>
              <InputText
                autoComplete="off"
                {...register("street")}
                style={{ width: '100%' }}
                defaultValue={data?.street || ""}
              />
              <p style={{ color: "red" }}>{errors.street?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Postal Box")}</h5>
              <InputText
                autoComplete="off"
                {...register("postalBox")}
                style={{ width: '100%' }}
                defaultValue={data?.postalBox || ""}
              />
              <p style={{ color: "red" }}>{errors.postalBox?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Town")}</h5>
              <InputText
                autoComplete="off"
                {...register("town")}
                style={{ width: '100%' }}
                defaultValue={data?.town || ""}
              />
              <p style={{ color: "red" }}>{errors.town?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("State Region")}</h5>
              <InputText
                autoComplete="off"
                {...register("stateRegion")}
                style={{ width: '100%' }}
                defaultValue={data?.stateRegion || ""}
              />
              <p style={{ color: "red" }}>{errors.stateRegion?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Postal Code")}</h5>
              <InputText
                autoComplete="off"
                {...register("postalCode")}
                style={{ width: '100%' }}
                defaultValue={data?.postalCode || ""}
              />
              <p style={{ color: "red" }}>{errors.postalCode?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Country")}</h5>
              <InputText
                autoComplete="off"
                {...register("country")}
                style={{ width: '100%' }}
                defaultValue={data?.country || ""}
              />
              <p style={{ color: "red" }}>{errors.country?.message}</p>
            </div>

            <div className="field col-12 md:col-4 structureChips">
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
              <p style={{ color: "red" }}>{errors.tag?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Description")}</h5>
              <InputText
                autoComplete="off"
                {...register("description")}
                style={{ width: '100%' }}
                defaultValue={data?.description || ""}
              />
              <p style={{ color: "red" }}>{errors.description?.message}</p>
            </div>

            <div className="field col-12 md:col-4">
              <h5 style={{ marginBottom: "0.5em" }}>{t("Created By")}</h5>
              <Controller
                defaultValue={data?.createdBy || []}
                name="createdBy"
                control={control}
                render={({ field }) => (
                  <TreeSelect
                    value={field.value}
                    options={contactData}
                    onChange={(e) => {
                      ContactService.nodeInfo(e.value as string)
                        .then((res) => {
                          field.onChange(e.value)
                          setCreatedByNodeId(res.data.id);
                        })
                    }}
                    filter
                    placeholder="Select Type"
                    style={{ width: "100%" }}
                  />
                )}
              />
              <p style={{ color: "red" }}>{errors.createdBy?.message}</p>
            </div>

            {/* {
              editDia === true &&
              <div className="field col-12 md:col-4">
                <h5 style={{ marginBottom: "0.5em" }}>{t("Is Active")}</h5>
                <Checkbox
                  {...register("isActive")}
                  style={{ width: '100%' }}
                  checked={isActive}
                  onChange={(e: any) => setIsActive(e.checked)}
                />
                <p style={{ color: "red" }}>{errors.isActive?.message}</p>
              </div>
            } */}

          </div>

        </TabPanel>
      </TabView>

    </form>
  );
};

export default ContactForm;
