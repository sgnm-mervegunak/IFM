import React from "react";
import { TreeSelect } from "primereact/treeselect";
import ClassificationsService from "../../../services/classifications";

const fixNodes = (nodes) => {
  if (!nodes || nodes.length === 0) {
    return;
  }
  for (let i of nodes) {
    fixNodes(i.children);
    i.label = i.name;
  }
};

const TreeSelectComponent = ({ selectedNode, setSelectedNode, placeholder }) => {
    const [nodes,setNodes] = React.useState([])
  React.useEffect(() => {
    ClassificationsService.findAllActive({ realm: "IFM", language: "en" }).then(
      (res) => {
        let temp = JSON.parse(JSON.stringify([res.data.root] || []));
        fixNodes(temp);
        setNodes(temp);
      }
    );
  }, []);
  return (
    <div>
      <TreeSelect
        className="mt-1"
        options={nodes || []}
        value={selectedNode}
        onChange={(e) => setSelectedNode(e.value)}
        placeholder={placeholder}
        style={{ width: "100%" }}
      />
    </div>
  );
};

export default TreeSelectComponent;
