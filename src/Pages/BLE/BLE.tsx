import React, { useEffect, useState } from 'react';
import { BluetoothDevice, BluetoothRemoteGATTCharacteristic, BluetoothRemoteGATTServer, IBleProps, IFormData, RequestDeviceOptions } from './BLE.types';
import { Space, Typography, Button, Modal, Form, Input, FormProps, Switch, Select, StatisticProps } from 'antd';
import { Layout } from 'antd';
import { cardio } from 'ldrs'
import './BLE.css'
import { LineChart } from '@mui/x-charts/LineChart';
import TextArea from 'antd/es/input/TextArea';
import { Statistic } from 'antd';
import CountUp from 'react-countup';
import html2canvas from 'html2canvas';


const formatter: StatisticProps['formatter'] = (value) => (
    <CountUp end={value as number} separator="," />
);

const { Option } = Select;

cardio.register()

const { Title } = Typography;
const { Content } = Layout;


const contentStyle: React.CSSProperties = {
    textAlign: 'center',
    width: '100%',
    backgroundColor: 'white'
};


const BLE: React.FC<IBleProps> = ({
    readServiceUUID,
    readCharUUID,
    writeServiceUUID,
    writeCharUUID,
    writeValue,
    message,
    token,
    baseUrl,
    env
}) => {

    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [characteristicValue, setCharacteristicValue] = useState<Uint8Array>();
    const [finalData, setFinalData] = useState<Uint8Array>(new Uint8Array(0));
    const [loader, setLoader] = useState<boolean>(false)
    const [seconds, setSeconds] = useState<number>(0)
    const [min, setMin] = React.useState<number>(0);
    const [sec, setSec] = React.useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);


    const [service, setService] = useState<BluetoothRemoteGATTServer | undefined>();

    const [writeChar, setWriteChar] = useState<BluetoothRemoteGATTCharacteristic>();

    const [readChar, setReadChar] = useState<BluetoothRemoteGATTCharacteristic>();
    const [timer, setTimer] = useState<NodeJS.Timer>()
    const [startTimestamp, setStartTimestamp] = useState<string>("")
    const [formData, setFormData] = useState<IFormData | null>(null)

    const [graphData, setGraphData] = useState<any>(null)
    const [bglData, setBglData] = useState<any>(null)

    const [form] = Form.useForm();



    const getBgl = async () => {
        const myHeaders = new Headers();
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);
        const requestOptions = {
            method: "GET",
            headers: myHeaders,
        };

        const response = await fetch(`${baseUrl}/api/v1/vsgt-data-service/getBloodGlucoseLevel?timestamp=${startTimestamp}`, requestOptions)
        if (!response.ok) {
            alert(`${(await response.json()).message} \nPlease try again!!`)
            throw new Error(`HTTP error! Message: ${(await response.json()).message} Status: ${response.status}`);
        }
        const bgl = await response.json()

        setBglData(bgl.payload)

        return response

    }

    const uploadFile = async (fileData: Uint8Array) => {

        const myHeaders = new Headers();
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Authorization", "Bearer " + token);

        const formdata = new FormData();
        formdata.append("binFile", new Blob([fileData]), "upload.bin");

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: formdata,
        };

        const deviceId = device?.name;



        try {
            const response = await fetch(
                `${baseUrl}/api/v2/vsgt-recording-service/uploadCo2BinFile?deviceId=${deviceId}&startTime=${startTimestamp}&subjectId=${formData?.subjectId}&age=${formData?.age}&height=${formData?.height}&weight=${formData?.weight}&gender=${formData?.gender}&diabetic=${formData?.diabetic}&latestWeight=${formData?.latestWeight}&comments=${formData?.comments}`,

                requestOptions
            );

            if (!response.ok) {
                alert(`${(await response.json()).message} \nPlease try again!!`)
                throw new Error(`HTTP error! Message: ${(await response.json()).message} Status: ${response.status}`);
            }

            const data = await response.json();
            await getBgl()
            setGraphData(data)
        } catch (error) {
            console.error("Error:", error);
        }

    }

    const makeTimeForm = (time: number): void => {
        if (time < 60) {
            setMin(0);
            setSec(time);
        } else {
            let min = Math.floor(time / 60);
            let sec = time - min * 60;
            setSec(sec);
            setMin(min);
        }
    };


    useEffect((): void => {
        makeTimeForm(seconds);
    }, [seconds]);



    const mergeArrays = (arrays: any) => {
        const totalLength = arrays.reduce((acc: any, arr: any) => acc + arr.length, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        arrays.forEach((arr: any) => {
            merged.set(arr, offset);
            offset += arr.length;
        });
        return merged;
    };



    useEffect(() => {
        if (characteristicValue) {
            const merged = mergeArrays([finalData, characteristicValue]);
            setFinalData(merged)
        }

    }, [characteristicValue]);

    const connectToDevice = async () => {
        try {
            const options: RequestDeviceOptions = {
                optionalServices: [readServiceUUID, writeServiceUUID],
                filters: [
                    {
                        namePrefix: "MB4"
                    },
                    {
                        namePrefix: "bBand"
                    },
                ]
            };
            const device = await (navigator as any).bluetooth.requestDevice(options);
            setDevice(device);

            const service = await device.gatt?.connect();
            setService(service);

            const readService = await service.getPrimaryService(readServiceUUID);
            const readChar = await readService.getCharacteristic(readCharUUID);
            setReadChar(readChar)

            const writeService = await service.getPrimaryService(writeServiceUUID);
            const writeChar = await writeService.getCharacteristic(writeCharUUID);
            setWriteChar(writeChar)

        } catch (error) {
            console.error('Failed to connect:', error);
        }
    };


    const writeCharacteristic = async (newValue: string) => {
        if (!device) {
            console.error('No device connected');
            alert("Please connect a device first")
            return;
        }
        try {
            if (service) {
                const uint8 = new Uint8Array(16);
                for (let index = 0; index < newValue.length; index++) {
                    uint8[index] = parseInt(newValue[index]);
                }
                await writeChar?.writeValue(uint8);
                console.log("Value Written successfully!!!");
            }

        } catch (error) {
            console.error('Failed to write characteristic:', error);
            alert("Device disconnected")
        }
    };



    const readCharacteristic = async () => {
        setFinalData(new Uint8Array(0));
        await writeCharacteristic(writeValue)
        if (!device) {
            console.error('No device connected');
            alert('Please connect a device first');
            return;
        }
        if (!formData) {
            console.error('Please enter subject details first');
            alert('Please enter subject details first');
            return;
        }
        try {
            if (service) {
                try {
                    setStartTimestamp("")
                    await readChar?.startNotifications();
                    startTimer()
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    const day = String(now.getDate()).padStart(2, '0');

                    const hours = String(now.getHours()).padStart(2, '0');
                    const minutes = String(now.getMinutes()).padStart(2, '0');
                    const seconds = String(now.getSeconds()).padStart(2, '0');
                    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

                    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;

                    setStartTimestamp(formattedDateTime)

                    readChar?.addEventListener('characteristicvaluechanged', (event) => {
                        const val = (event.target as BluetoothRemoteGATTCharacteristic).value?.buffer;
                        if (val) {
                            const data = new Uint8Array(val || new ArrayBuffer(0));
                            setCharacteristicValue(data)
                        }
                    });
                }
                catch (error) {
                    console.error('Failed to read data:', error);

                    alert("Device disconnected")
                }
            }

        } catch (error) {
            console.error('Failed to read characteristic:', error);
            alert("Device disconnected")
        }
    };



    const stopTimer = () => {
        device?.gatt?.disconnect();
        setDevice(null)
        setLoader(false)
        clearInterval(timer)
        uploadFile(finalData)
    }

    const startTimer = async () => {
        setSeconds(0)
        setLoader(true)
        const intervalId = setInterval(async () => {
            setSeconds(seconds => seconds + 1)
        }, 1000)
        setTimer(intervalId)
    }

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const onFinish: FormProps<IFormData>['onFinish'] = (values) => {
        if (!values.diabetic)
            values.diabetic = false
        if (!values.latestWeight)
            values.latestWeight = false
        setFormData(values)
        setIsModalOpen(false)
        localStorage.setItem('form', JSON.stringify(values));

    };

    const downloadFile = () => {
        const filename = `${startTimestamp}_${formData?.subjectId}.bin`
        setStartTimestamp("")
        const blob = new Blob([finalData], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    const saveGraph = () => {
        const chartContainer = document.getElementById('chart-container');
        if (chartContainer) {
            html2canvas(chartContainer).then(canvas => {
                const pngUrl = canvas.toDataURL('image/png');
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'chart.png';
                a.click();
            });
        }

    }

    const fillForm = () =>{
        const formdata = localStorage.getItem("form")
        if (formdata) {
            const values = JSON.parse(formdata)
            form.setFieldsValue(values)
            setFormData(values)
        }
        setIsModalOpen(true)
    }

    // const tp = () => {
    //     console.log(process.env, "----------------------> env");
    //     console.log(process.env.REACT_APP_BASE_URL, "----------------------> BASE_URL");
    //     console.log(process.env.REACT_APP_TOKEN, "----------------------> TOKEN");
    //     console.log(token, "-------------> token");
    //     console.log(baseUrl, "-------------> baseUrl");
    //     console.log(env, "-----------------> env");
    // }


    return (
        <>

            <Layout>
                <Content style={contentStyle}>
                    <Title>{message}</Title>
                    <Space wrap={true} size="large">
                        <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={connectToDevice}>Connect to Device</Button>
                        {/* <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={tp}>TP</Button> */}
                        {/* {true ? ( */}
                        {device != null ? (
                            <>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={fillForm}>Enter Details</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={readCharacteristic}>Start</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={stopTimer}>Stop</Button>
                                <br />

                            </>
                        ) : null}
                    </Space>
                    <br />
                    <br />
                    <Space wrap={true} size="large">
                        {device && <p>Connected to device: {device.name}</p>}

                    </Space>
                    {loader ? (
                        <div>
                            <l-cardio
                                size="200"
                                stroke="4"
                                speed="2"
                                color="#83BF8D"
                            ></l-cardio>
                            <br />
                            <h2>Reading your data from device!!</h2>
                            <h3>Keep Breathing ...</h3>
                        </div>
                    ) : null}

                    {device && (
                        <div className="timer-wrapper">
                            <div>
                                <span className="time">{min}</span>
                                <span className="unit">min</span>
                                <span className="time right">{sec}</span>
                                <span className="unit">sec</span>
                            </div>
                        </div>
                    )}

                    {graphData && (
                        <>
                            <Space wrap={true} size="large">
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={downloadFile}>Download File</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={saveGraph}>Save Graph</Button>
                            </Space>
                            <div id='chart-container'>
                                <Title level={3}>Timestamp : {startTimestamp}</Title>
                                <br /><br />
                                <Statistic title="Your Blood Glucose Level" value={(bglData["blood_glucose_level_method2"]).toFixed(2)} formatter={formatter} />
                                <br /> <br />

                                <LineChart
                                    xAxis={[{ data: graphData.payload.ticks, label: "Ticks" }]}
                                    series={[
                                        {
                                            data: graphData.payload.co2_percentage,
                                            showMark: false,
                                        },
                                    ]}
                                    height={600}
                                    width={900}
                                    margin={{ left: 30, right: 30, top: 30, bottom: 60 }}
                                    grid={{ vertical: true, horizontal: true }}
                                />
                            </div>

                        </>
                    )}

                </Content>
            </Layout>

            <Modal title="Enter Details" open={isModalOpen} footer={null} onCancel={handleCancel}>
                <Form
                    form={form}
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    autoComplete="on"
                >
                    <Form.Item
                        label="Subject ID"
                        name="subjectId"
                        rules={[{ required: true, message: 'Please input your name!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Age"
                        name="age"
                        rules={[{ required: true, message: 'Please input your age!' }]}
                    >
                        <Input type='number' />
                    </Form.Item>
                    <Form.Item
                        label="Height"
                        name="height"
                        rules={[{ required: true, message: 'Please input your height!' }]}
                    >
                        <Input type='number' />
                    </Form.Item>
                    <Form.Item
                        label="Weight"
                        name="weight"
                        rules={[{ required: true, message: 'Please input your weight!' }]}
                    >
                        <Input type='number' />
                    </Form.Item>

                    <Form.Item
                        name="gender"
                        label="Gender"
                        rules={[{ required: true, message: 'Please select gender!' }]}
                    >
                        <Select placeholder="select your gender">
                            <Option value="male">Male</Option>
                            <Option value="female">Female</Option>
                            <Option value="other">Other</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Diabetic" name={"diabetic"} valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item label="Latest Weight ?" name={"latestWeight"} valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item label="Comments" name={"comments"}>
                        <TextArea showCount maxLength={100} placeholder="Comments" />
                    </Form.Item>

                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>

    );
};

export default BLE;


