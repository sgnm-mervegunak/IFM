import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";

interface LanguageState {
  language: string;
}

// Define the initial state using that type
const initialState: LanguageState = {
  language: localStorage.getItem("i18nextLng") || "EN"
};

export const languageSlice = createSlice({
  name: "language",
  // `createSlice` will infer the state type from the `initialState` argument
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<any>) => {
      state.language = action.payload;
    }
  },
});

export const { setLanguage } = languageSlice.actions;

// Other code such as selectors can use the imported `RootState` type
export const selectLanguage = (state: RootState) => state.language;

export default languageSlice.reducer;
