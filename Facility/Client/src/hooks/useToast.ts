import React from "react";
import { ToastContext } from "../context/toast";

export default function useToast() {
  const { toast } = React.useContext(ToastContext);
  return { toast };
}
