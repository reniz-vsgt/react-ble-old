import axios from "axios";

import { ILoginResponse, ILoginState } from "./login.interface";

export async function Login(loginData: ILoginState): Promise<ILoginResponse> {
    try {
        const url = `${loginData.baseUrl}/api/v1/vsgt-service/login`

        let payload = JSON.stringify({
            "username": loginData.username,
            "password": loginData.password
        });

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: url,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            data: payload
        };

        const data = await axios.request(config)

        
        return data.data;
    } catch (err) {
        console.log(`Login Error : ${err}`);
        return { message: "Login failed", status: 409, payload: { token: "" } };
    }
}