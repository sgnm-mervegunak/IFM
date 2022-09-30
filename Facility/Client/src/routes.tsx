import { useRoutes, Navigate } from "react-router-dom";

//layouts
import AppLayout from "./layouts/App/App";

//pages
import Dashboard from "./layouts/App/components/Dashboard";
import Facility from "./pages/Facility";
import Classifications from "./pages/Classifications/Classifications";
import { NotFound } from "./layouts/App/pages/NotFound";
import SetClassificationAdmin from "./pages/Classifications/ClassificationAdmin/SetClassificationAdmin";
import SetClassificationAdminLazy from "./pages/Classifications/ClassificationAdmin/SetClassificationAdminLazy";
import FacilityStructure from "./pages/FacilityStructure/FacilityStructure";
import SetFacilityStructure from "./pages/FacilityStructure/SetFacilityStructure";
import FormGenerate from "./pages/FormGenerate/FormGenerate";
import Facility2 from "./pages/Facility2";
import Contact from "./pages/Contact/Contact";
import { useAppSelector } from "./app/hook";
import SetClassificationUser from "./pages/Classifications/ClassificationUser/SetClassificationUser";
import SetFacilityStructure2 from "./pages/FacilityStructure/SetFacilityStructure2";
import JointSpace from "./pages/JointSpace/JointSpace";
import Zone from "./pages/Zone/Zone";
import SetJointSpace from "./pages/JointSpace/SetJointSpace";
import SetZone from "./pages/Zone/SetZone";
import ClassificationFileImportWithoutCode from "./pages/Classifications/ClassificationImport/ClassificationFileImportWithoutCode";
import ClassificationFileImportWithCode from "./pages/Classifications/ClassificationImport/ClassificationFileImportWithCode";
import SetType from "./pages/Types/SetType";
import SetComponent from "./pages/Components/SetComponent";
import SetComponentsDetail from "./pages/Components/SetComponentsDetail";
import SetSystem from "./pages/Systems/SetSystem";
import StructureAsset from "./pages/StructureAsset/StructureAsset";
import EditAsset from "./pages/StructureAsset/EditAsset";

// import Main from './pages/Main';

export default function Router() {
  const auth = useAppSelector((state) => state.auth);

  return useRoutes([
    {
      path: "/",
      element: <AppLayout />,
      children: [
        { path: "", element: <Dashboard /> },
        // { path: "facility", element: <Facility /> },
        { path: "facility", element: <Facility2 /> },
        // { path: "classifications", element: <Classifications /> },
        { path: "classifications", element: auth.auth.type === "facility_client_role_admin" ? <SetClassificationAdminLazy /> : <SetClassificationUser /> },
        { path: "jointspace", element: <JointSpace /> },
        { path: "zone", element: <Zone /> },
        { path: "facilitystructure", element: <SetFacilityStructure /> },
        // { path: "formgenerate", element: <FormGenerate />},
        { path: "contact", element: <Contact /> },
        { path: "structure-asset", element: <StructureAsset /> },
        { path: "asset-types", element: <SetType /> },
        { path: "asset-components", element: <SetComponent /> },
        { path: "asset-systems", element: <SetSystem /> },
      ],
    },
    {
      path: "/classifications",
      element: <AppLayout />,
      children: [{ path: ":id", element: <SetClassificationAdmin /> }],
    },
    {
      path: "/facilitystructure",
      element: <AppLayout />,
      children: [{ path: ":id", element: <SetFacilityStructure /> }],
    },
    {
      path: "/classifications",
      element: <AppLayout />,
      children: [{ path: "fileimportwithcode", element: <ClassificationFileImportWithCode /> }],
    },
    {
      path: "/classifications",
      element: <AppLayout />,
      children: [{ path: "fileimportwithoutcode", element: <ClassificationFileImportWithoutCode /> }],
    },
    // {
    //   path: "/formgenerate",
    //   element: <AppLayout />,
    //   children: [{ path: ":id", element: <FormGenerate/> }],
    // },
    {
      path: "/structure-asset",
      element: <AppLayout />,
      children: [{ path: ":id", element: <EditAsset/> }],
    },
    {
      path: "/jointspace",
      element: <AppLayout />,
      children: [{ path: ":id", element: <SetJointSpace /> }],
    },
    {
      path: "/zone",
      element: <AppLayout />,
      children: [{ path: ":id", element: <SetZone /> }],
    },
    {
      path: "/asset-components",
      element: <AppLayout />,
      children: [{ path: ":id", element: <SetComponentsDetail /> }],
    },
    {
      path: "/404",
      element: <NotFound />,
    },
    { path: "*", element: <Navigate to="/404" replace /> },
  ]);
}
