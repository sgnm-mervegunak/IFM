import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface ToastState {
  toast: any
}

// Define the initial state using that type
const initialState: ToastState = {
  toast: null
};

export const toastSlice = createSlice({
  name: "toast",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setToast: (state, action: PayloadAction<any>) => {
      state.toast = action.payload;
    }
  },
});

export const { setToast } = toastSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectToast = (state: RootState) => state.toast;

export default toastSlice.reducer;
