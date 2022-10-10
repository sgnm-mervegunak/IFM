import React from "react";
import { Toast } from "primereact/toast";

export const ToastContext = React.createContext({} as any);

export default function ContextProvider(props:any) {
  const toast = React.useRef(null);

  return (
    <ToastContext.Provider value={{ toast }}>
      <Toast ref={toast} position="top-right" baseZIndex={99999} />
      {props.children}
    </ToastContext.Provider>
  );
}
