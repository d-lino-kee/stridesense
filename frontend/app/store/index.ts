import { configureStore } from '@reduxjs/toolkit'
import userReducer from './slices/userSlice'
import runsReducer from './slices/runsSlice'

export const store = configureStore({
    reducer: { user: userReducer, runs: runsReducer },
    devTools: process.env.NODE_ENV !== 'production'
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch