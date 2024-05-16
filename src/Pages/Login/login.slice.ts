import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { ILoginInitialState, ILoginResponse, ILoginState } from "./login.interface";
import { Login } from "./login.api";
import { RootState } from "../../store/store";

const initialState : ILoginInitialState = {
    messageToDisplay : "",
    status : "idle",
    token : ""
}

export const loginAsync = createAsyncThunk(
    "login",
    async (loginData: ILoginState) => {
      return await Login(loginData);
    }
  );

  export const loginSlice = createSlice({
    name: "login",
    initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
      setState: (state, payload) => {
        // Redux Toolkit allows us to write "mutating" logic in reducers. It
        // doesn't actually mutate the state because it uses the Immer library,
        // which detects changes to a "draft state" and produces a brand new
        // immutable state based off those changes
        const { key, value } = payload.payload;
        //@ts-ignore
        state[key as keyof ILoginState] = value;
      },
    },
    extraReducers : builder =>{
        builder
        .addCase(loginAsync.pending, (state, action) => {
            state.status = "loading";
            state.messageToDisplay = "Loading...";
        })
        .addCase(loginAsync.fulfilled, (state, action) => {
            state.status = "success";            
            state.messageToDisplay = action.payload.message;
            state.token = action.payload.payload.token
        })
        .addCase(loginAsync.rejected, (state,action:any)=>{
            state.status = "failed";
            state.messageToDisplay = action.payload.message;

        })
    }
})

export const { setState } = loginSlice.actions;

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state: RootState) => state.counter.value)`
export const selectLoginState = (state: RootState): ILoginInitialState => state.login;

export default loginSlice.reducer;
