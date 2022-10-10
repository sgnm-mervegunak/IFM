import React from "react";
import ToastProvider from "./toast";

export default function ContextProvider(props: any) {
  return (
    <>
      <ToastProvider>
        {props.children}
      </ToastProvider>
    </>
  );
}
