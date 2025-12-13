import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState { displayName?: string; email?: string; token?: string|null }
const initialState: UserState = { token: null }

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUser(state, action: PayloadAction<UserState>) { Object.assign(state, action.payload) },
        signOut(state){ state.displayName = undefined; state.email = undefined; state.token = null }
    }
})
export const { setUser, signOut } = userSlice.actions
export default userSlice.reducer