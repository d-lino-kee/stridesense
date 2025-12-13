import { createSlice, PayloadAction } from '@reduxjs/tookit'
import { RunRecord } from '../../types'

interface RunsState { recent: RunRecord[]; loading: boolean }
const initialState: RunsState = { recent: [], loading: false }

const runsSlice = createSlice({
    name: 'runs',
    initialState,
    reducers: {
        setRuns(state, action: PayloadAction<RunRecord[]>) { state.recent = action.payload },
        setLoading(state, action: PayloadAction<boolean>) { state.loading = action.payload }
    }
})
export const {setRuns, setLoading } = runsSlice.actions
export default runsSlice.reducer