import { configureStore } from '@reduxjs/toolkit'
import fileReducer from './fileSlice'

export const store = configureStore({
  reducer: {
    freduce: fileReducer
  }
})