import React, { useEffect } from "react";
import { Flex } from "antd";
import { Typography } from "antd";
import "./login.css";
import { Button, Checkbox, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { ILoginInitialState, ILoginProps } from "./login.interface";
import { loginAsync, selectLoginState } from "./login.slice";

type FieldType = {
    username?: string;
    password?: string;
    remember?: string;
};


const { Title } = Typography;

const Login: React.FC<ILoginProps> = ({baseUrl}) => {

    // const stream = {
    //     readService: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    //     readChar: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
    //     writeService: "dd8c1300-3ae2-5c42-b8be-96721cd710fe",
    //     writeChar: "dd8c1303-3ae2-5c42-b8be-96721cd710fe",
    //     writeValue: "0010110111110000",
    //     message: "Read data as stream"
    //   }

    const dispatch = useAppDispatch();

    const loginState = useAppSelector<ILoginInitialState>(selectLoginState);

    const [messageApi, contextHolder] = message.useMessage();

    const navigate = useNavigate();

    useEffect(() => {
        if (loginState.status == "success") {
            messageApi.success(loginState.messageToDisplay);
            console.log(loginState.token, "------------------> token");
            navigate("/dev");
        }
        else if (loginState.status == "failed"){
            messageApi.error(loginState.messageToDisplay);
        }
    }, [loginState])

    const onFinish = (values: any) => {
        dispatch(loginAsync({ "baseUrl": baseUrl, "username": values.username, "password": values.password }))

        // if (values.username === "admin" && values.password === "admin") {
        //     console.log("Success:", values);
        //     messageApi.success('Login Successfully!');
        //     localStorage.setItem('user', JSON.stringify(values));
        //     navigate("/dashboard");
        // } else {
        //     console.log("Fail: ", values);
        //     messageApi.error('Invalid Credentials!');
        // }
    };

    const onFinishFailed = (errorInfo: any) => {
        console.log("Failed:", errorInfo);
    };
    return (
        <div className="LoginFormContainer">
            <Flex vertical={false} align="center" justify="space-evenly">
                <div>
                    <Title>Welcome to Expense Tracker !!</Title>
                    <br />
                    <Form
                        name="basic"
                        // labelCol={{ span: 8 }}
                        // wrapperCol={{ span: 16 }}
                        initialValues={{ remember: true }}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        autoComplete="off"
                        size="large"
                    >
                        {contextHolder}
                        <Form.Item<FieldType>
                            label="Username"
                            name="username"
                            rules={[{ required: true, message: "Please input your username!" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item<FieldType>
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: "Please input your password!" }]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item<FieldType>
                            name="remember"
                            valuePropName="checked"
                            wrapperCol={{ offset: 8, span: 16 }}
                        >
                            <Checkbox>Remember me</Checkbox>
                        </Form.Item>

                        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                            <Button type="primary" htmlType="submit">
                                Submit
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

            </Flex>
        </div>
    );
};

export default Login;
