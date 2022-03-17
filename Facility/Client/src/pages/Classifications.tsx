import React, { useState } from "react";
import { Tree } from "primereact/tree";
import { v4 as uuidv4 } from "uuid";
import { Button } from "primereact/button";
import { ContextMenu } from "primereact/contextmenu";
import { ConfirmDialog } from "primereact/confirmdialog";
import { Dialog } from "primereact/dialog";
import { Toast } from "primereact/toast";
import { useAppDispatch, useAppSelector } from "../app/hook";
import { save } from "../features/tree/treeSlice";
import { InputText } from "primereact/inputtext";

interface Node {
  key: string;
  label: string;
  name: string;
  code: string;
  selectable?: boolean | undefined;
  children?: Node[] | undefined;
}

const Classifications = () => {
  const [selectedNodeKey, setSelectedNodeKey] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [addDia, setAddDia] = useState(false);
  const [delDia, setDelDia] = useState<boolean>(false);
  const toast = React.useRef<any>(null);
  const cm: any = React.useRef(null);
  const menu = [
    {
      label: "Add Item",
      icon: "pi pi-plus",
      command: () => {
        setAddDia(true);
      },
    },
    {
      label: "Delete",
      icon: "pi pi-trash",
      command: () => {
        setDelDia(true);
      },
    },
  ];
  const dispatch = useAppDispatch();

  const tree = useAppSelector((state) => state.tree);

  const [data, setData] = useState<Node[]>(tree.classificationsOfFacility);

  const findNodeAndAddItem = (
    search: string,
    nodes: Node[]
  ): Node | undefined => {
    if (nodes.length === 0) return undefined;
    return nodes.map((node) => {
      if (node.key === search) {
        const newNode = {
          key: uuidv4(),
          label: code + " : " + name,
          name: name,
          code: code,
        };
        node.children = node.children ? [...node.children, newNode] : [newNode];
        return node;
      }
      return findNodeAndAddItem(search, node.children ? node.children : []);
    })[0];
  };

  const findNodeAndDelete = (
    search: string,
    nodes: Node[]
  ): Node | undefined => {
    if (nodes.length === 0) return undefined;
    return nodes.map((node) => {
      node.children = node.children
        ? node.children.filter((child) => child.key !== search)
        : undefined;
      findNodeAndDelete(search, node.children ? node.children : []);
      return node;
    })[0];
  };

  const fixNodes = (nodes: Node[]) => {
    return nodes.map((node) => {
      if (node.children === undefined || node.children.length === 0) {
        node.selectable = true;
      } else {
        fixNodes(node.children);
        node.selectable = false;
      }
      return node;
    });
  };

  const addItem = (key: string) => {
    if(selectedNodeKey === ""){
      const newNode = {
        key: uuidv4(),
        label: code + " : " + name,
        name: name,
        code: code,
      };
      setData(prev=>[...prev, newNode]);
    }
    else{
      const temp = JSON.parse(JSON.stringify(data));
      findNodeAndAddItem(key, temp);
      setData(temp);
    }
    setName("");
    setCode("");
    setAddDia(false);
  };

  const deleteItem = (key: string) => {
    var temp: Node[] = JSON.parse(JSON.stringify(data));
    temp = temp.filter((node) => node.key !== key);
    findNodeAndDelete(key, temp);
    setData(temp);
  };

  const saveTree = () => {
    const temp = JSON.parse(JSON.stringify(data));
    fixNodes(temp);
    dispatch(save(temp));
    showSuccess("Saved!");
  };

  const showSuccess = (detail: string) => {
    toast.current.show({
      severity: "success",
      summary: "Success Message",
      detail: detail,
      life: 3000,
    });
  };

  const renderFooter = () => {
    return (
      <div>
        <Button
          label="No"
          icon="pi pi-times"
          onClick={() => {
            setAddDia(false);
            setName("");
          }}
          className="p-button-text"
        />
        <Button
          label="Yes"
          icon="pi pi-check"
          onClick={() => addItem(selectedNodeKey)}
          autoFocus
        />
      </div>
    );
  };

  const footer = () => {
    return <div>
      <Button
        label="Add Root Item"
        icon="pi pi-plus"
        onClick={() => {
          setSelectedNodeKey("");
          setAddDia(true)
        }}
        autoFocus
      />
    </div>;
  };

  return (
    <div className="container">
      <Toast ref={toast} position="top-right" />
      <ContextMenu model={menu} ref={cm} />
      <ConfirmDialog
        visible={delDia}
        onHide={() => setDelDia(false)}
        message="Do you want to delete?"
        header="Delete Confirmation"
        icon="pi pi-exclamation-triangle"
        accept={() => deleteItem(selectedNodeKey)}
      />
      <Dialog
        header="Add New Node"
        visible={addDia}
        style={{ width: "40vw" }}
        footer={renderFooter}
        onHide={() => {
          setName("");
          setAddDia(false);
        }}
      >
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Code</h5>
          <InputText
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
        </div>
        <div className="field">
          <h5 style={{ marginBottom: "0.5em" }}>Name</h5>
          <InputText
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </div>
      </Dialog>
      <h1>Classifications</h1>
      <div className="field">
        <Tree
          value={data}
          dragdropScope="-"
          contextMenuSelectionKey={selectedNodeKey ? selectedNodeKey : ""}
          onContextMenuSelectionChange={(event: any) =>
            setSelectedNodeKey(event.value)
          }
          onContextMenu={(event) => cm.current.show(event.originalEvent)}
          onDragDrop={(event: any) => {
            setData(event.value);
          }}
          filter
          filterBy="name,code"
          filterPlaceholder="Search"
          footer={footer}
        />
      </div>
      <div className="field">
        <Button className="p-button-success" onClick={saveTree}>
          Save
        </Button>
      </div>
    </div>
  );
};

export default Classifications;
