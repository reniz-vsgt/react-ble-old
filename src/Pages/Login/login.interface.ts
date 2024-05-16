
export interface ILoginState {
    username: string
    password: string
    baseUrl: string
}

export interface ILoginResponsePayload {
    token: string
}

export interface ILoginResponse {
    message: string
    payload: ILoginResponsePayload
    status: number
}

export interface ILoginInitialState {
    messageToDisplay: string;
    status: "idle" | "loading" | "failed" | "success";
    token : string
}

export interface ILoginProps{
    baseUrl : string
}