import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Menu } from "primereact/menu";

import FacilityStructureService from "../../../services/facilitystructure";
import JointSpaceService from "../../../services/jointSpace";
import { useAppSelector } from "../../../app/hook";

let data2=[33,33,34];

const revenueChart = {
  labels: ["Blocks", "Floors", "Spaces"],
  datasets: [
    {
      data: data2,
      backgroundColor: ["#7986CB", "#4DB6AC","#5FD0E1"],
    },
  ],
};


const Dashboard = () => {
  const [data, setData] = useState([]);
  const [data2, setData2] = useState([]);
  const [buildingCounts, setBuildingCounts] = useState(0);
  const [blockCounts, setBlockCounts] = useState(0);
  const [floorCounts, setFloorCounts] = useState(0);
  const [spaceCounts, setSpaceCounts] = useState(0);
  const [blockCounts2, setBlockCounts2] = useState(0);
  const [floorCounts2, setFloorCounts2] = useState(0);
  const [spaceCounts2, setSpaceCounts2] = useState(0);
  const [buildingNames, setBuildingNames] = useState([]);
  const [buildingKeys, setBuildingKeys]= useState([]);
  const [counts,setCounts]=useState([]);
  const auth = useAppSelector((state) => state.auth);
  const { toast } = useAppSelector((state) => state.toast);
  const [realm, setRealm] = useState(auth.auth.realm);

  const fixNodes = (nodes) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes(i.children);
      if (i.nodeType === "Building") {
        setBuildingCounts((prev) => prev + 1);
        setBuildingNames((prev) => [...prev, i.name]);
        setBuildingKeys((prev) => [...prev, i.key]);
      }
      if (i.nodeType === "Block") {
        setBlockCounts((prev) => prev + 1);
      }
      if (i.nodeType === "Floor") {
        setFloorCounts((prev) => prev + 1);
      }
      if (i.nodeType === "Space") {
        setSpaceCounts((prev) => prev + 1);
      }
    }
  };

  const fixNodes2 = (nodes) => {
    if (!nodes || nodes.length === 0) {
      return;
    }
    for (let i of nodes) {
      fixNodes2(i.children);
      if (i.nodeType === "Block") {
        setBlockCounts2((prev) => prev + 1);

        console.log(i);

      }
      if (i.nodeType === "Floor") {
        setFloorCounts2((prev) => prev + 1);
      }
      if (i.nodeType === "Space") {
        setSpaceCounts2((prev) => prev + 1);
      }
    }
  };

  const getFacilityStructure = async() => {
    await FacilityStructureService.findOne(realm)
      .then(async(res) => {
        setData([res.data.root] || []);
        let temp = JSON.parse(JSON.stringify([res.data.root] || []));
       await fixNodes(temp);
        setData(temp);
      })
      .catch((err) => {
        if (err.response.status === 500) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Facility Structure not found",
            life: 4000,
          });
        }
      });
  };

  const getBuildings = () => {
     buildingKeys.map(async(key) => {
      await JointSpaceService.findBuildingWithKey(key, realm)
      .then((res) => {
        setData2([res.data.root] || []);
        console.log(res.data.root);
        let temp = JSON.parse(JSON.stringify([res.data.root] || []));
        fixNodes2(temp);
        setData2(temp);
      })
      .catch((err) => {
        if (err.response.status === 500) {
          toast.current.show({
            severity: "error",
            summary: "Error",
            detail: "Facility Structure not found",
            life: 4000,
          });
        }
      });
    }
    )
  };

  useEffect(() => {
    setBuildingCounts(0);
    setBlockCounts(0);
    setFloorCounts(0);
    setSpaceCounts(0);
    setBlockCounts2(0);
    setFloorCounts2(0);
    setSpaceCounts2(0);
    setBuildingNames([]);
    setBuildingKeys([]);
    getFacilityStructure();
    getBuildings();
  }, []);

  return (
    <div className="layout-dashboard">
      <div className="grid">
        <div className="col-12 md:col-6 xl:col-3">
          <div className="card grid-nogutter widget-overview-box widget-overview-box-1">
            <span className="overview-icon">
              <i className="pi pi-building"></i>
            </span>
            <span className="overview-title">Buildings</span>
            <div className="grid overview-detail">
              <div className="col-12">
                <div className="overview-number">{buildingCounts}</div>
                <div className="overview-subtext">Buildings</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6 xl:col-3">
          <div className="card grid-nogutter widget-overview-box widget-overview-box-2">
            <span className="overview-icon">
              <i className="pi pi-building"></i>
            </span>
            <span className="overview-title">Blocks</span>
            <div className="grid overview-detail">
              <div className="col-12">
                <div className="overview-number">{blockCounts}</div>
                <div className="overview-subtext">Blocks</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6 xl:col-3">
          <div className="card grid-nogutter widget-overview-box widget-overview-box-3">
            <span className="overview-icon">
              <i className="pi pi-building"></i>
            </span>
            <span className="overview-title">Floors</span>
            <div className="grid overview-detail">
              <div className="col-12">
                <div className="overview-number">{floorCounts}</div>
                <div className="overview-subtext">Floors</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 md:col-6 xl:col-3">
          <div className="card grid-nogutter widget-overview-box widget-overview-box-4">
            <span className="overview-icon">
              <i className="pi pi-building"></i>
            </span>
            <span className="overview-title">Spaces</span>
            <div className="grid overview-detail">
              <div className="col-12">
                <div className="overview-number">{spaceCounts}</div>
                <div className="overview-subtext">Spaces</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid flex">
          {buildingNames?.map((building,index) => (
            
            <div key={index} className="col-12 lg:col-6">
              <div className="card revenue">
                <h4>{building}</h4>
                <p>Comparison of your revenue sources.</p>
                <div className="revenue-chart-container">
                  <div className="flex justify-content-center">
                    <Chart
                      style={{ position: "relative", width: "50%" }}
                      type="pie"
                      id="revenue-chart"
                      data={revenueChart}
                    ></Chart>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);
