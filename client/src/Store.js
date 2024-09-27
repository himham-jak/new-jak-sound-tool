import { configureStore } from '@reduxjs/toolkit'
import fileReducer from './fileSlice'

export const store = configureStore({
  reducer: {
    freduce: fileReducer
  },

  // put these here to suppress 2 non-serialized error
  // because redux is unhappy with how I manage files
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Suppress warnings for non-serializable values in these specific actions
        ignoredActions: ['file/addFile'], // serializableStateInvariantMiddleware.ts:197
        // Suppress warnings for non-serializable values in these state paths
        ignoredPaths: ['freduce.filelist'], // serializableStateInvariantMiddleware.ts:212
      },
    }),
})