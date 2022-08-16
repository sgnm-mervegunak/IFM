import React, { useState, useEffect, useRef } from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Chart } from "primereact/chart";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Menu } from "primereact/menu";

import FacilityStructureService from "../../../services/facilitystructure";
import { useAppSelector } from "../../../app/hook";

const revenueChart = {
  labels: ["Blocks", "Floors", "Spaces"],
  datasets: [
    {
      data: [40, 35, 25],
      backgroundColor: ["#7986CB", "#4DB6AC","#5FD0E1"],
    },
  ],
};


const Dashboard = () => {
  const [data, setData] = useState([]);
  const [buildingCounts, setBuildingCounts] = useState(0);
  const [blockCounts, setBlockCounts] = useState(0);
  const [floorCounts, setFloorCounts] = useState(0);
  const [spaceCounts, setSpaceCounts] = useState(0);
  const [buildingNames, setBuildingNames] = useState([]);
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

  const getFacilityStructure = () => {
    FacilityStructureService.findOne(realm)
      .then((res) => {
        setData([res.data.root] || []);
        let temp = JSON.parse(JSON.stringify([res.data.root] || []));
        fixNodes(temp);
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

  useEffect(() => {
    setBuildingCounts(0);
    setBlockCounts(0);
    setFloorCounts(0);
    setSpaceCounts(0);
    setBuildingNames([]);
    getFacilityStructure();
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
                <div className="overview-number">{buildingCounts}</div>
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
