import { configureStore } from '@reduxjs/toolkit'
import authReducer from "../features/auth/authSlice"
import toastReducer from "../features/toast/toastSlice"

const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export default store