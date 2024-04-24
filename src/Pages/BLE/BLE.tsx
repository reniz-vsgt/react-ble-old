import React, { useEffect, useState } from 'react';
import { BluetoothDevice, BluetoothRemoteGATTCharacteristic, BluetoothRemoteGATTServer, IBleProps, RequestDeviceOptions } from './BLE.types';
import { Space, Typography, Button, Modal, Form, Input, FormProps } from 'antd';
import { Layout } from 'antd';
import { cardio } from 'ldrs'
import './BLE.css'
import { LineChart } from '@mui/x-charts/LineChart';


cardio.register()


export interface IFormData {
    name: string
    age: number
    height: number
    weight: number
}

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
    message
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




    const baseUrl = "https://rnd-api.breathai.io"
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ2c2d0IjoieydfaWQnOiAnNjYyOGM0MDBkMDE1MzE4MzQyYmFiYTA1JywgJ3VzZXJuYW1lJzogJ3JlYWN0LWJsZScsICdlbWFpbCc6ICdyZW5pekBpbm5vc2NlbnQuaW4nLCAncGFzc3dvcmQnOiAnJDJiJDEyJFBKN21sN2VvcEx6TUpGcGZILndJOC5jb2hWSWFWNndsTEo2QXQ5MXVxd29qOTFnaWljQVcuJywgJ2Rpc3BsYXlOYW1lJzogJycsICdhZ2UnOiAnJywgJ2RhdGVPZkJpcnRoJzogJycsICdnZW5kZXInOiAnJywgJ2NvbnRhY3RJbmZvcm1hdGlvbic6ICcnLCAnbWVkaWNhbENvbmRpdGlvbnMnOiAnJywgJ21lZGljYXRpb25zJzogJycsICdmaXRuZXNzR29hbHMnOiAnJywgJ2ZpdG5lc3NQbGFuJzogJycsICdjaHJvbmljSGVhbHRoQ29uZGl0aW9ucyc6ICcnLCAnbWVkaWNhdGlvbkhpc3RvcnknOiAnJywgJ2RpZXRhcnlIYWJpdHMnOiAnJywgJ3NsZWVwUXVhbGl0eSc6ICcnLCAnbm90ZXNDb21tZW50cyc6ICcnLCAnY3JlYXRlZEF0JzogZGF0ZXRpbWUuZGF0ZXRpbWUoMjAyNCwgNCwgMTgsIDEyLCA0LCAzMCwgODQxMDAwKSwgJ2NyZWF0ZWRCeSc6ICdzeXN0ZW0nLCAndXBkYXRlZEF0JzogZGF0ZXRpbWUuZGF0ZXRpbWUoMjAyNCwgNCwgMTgsIDEyLCA0LCAzMCwgODQxMDAwKSwgJ3VwZGF0ZWRCeSc6ICdzeXN0ZW0nLCAnaXNBY3RpdmUnOiBUcnVlLCAnaXNEZWxldGVkJzogRmFsc2V9In0.PpKpLrRaaej98Ry6UuKme7lJfb7LaBf8dhqZpsMKT0g"


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
                `${baseUrl}/api/v2/vsgt-recording-service/uploadCo2BinFile?deviceId=${deviceId}&startTime=${startTimestamp}&name=${formData?.name}&age=${formData?.age}&height=${formData?.height}&weight=${formData?.weight}`,
                requestOptions
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            setGraphData(data)
            console.log(data);
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
                acceptAllDevices: true,
                optionalServices: [readServiceUUID, writeServiceUUID],
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
        // if (sensorCommand == "") {
        //     console.error('Please enter command for sensor first');
        //     alert("Please enter command for sensor first")
        //     return; 
        // }
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
                    await readChar?.startNotifications();
                    startTimer()
                    const today = (new Date().toISOString())
                    const timestamp = today.substring(0, today.length - 1);
                    setStartTimestamp(timestamp)

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
        setLoader(false)
        clearInterval(timer)
        // download(finalData, device?.name + ".bin")
        uploadFile(finalData)
        setFinalData(new Uint8Array(0));

    }

    const startTimer = async () => {
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
        setFormData(values)
        setIsModalOpen(false)
    };



    return (
        <>

            <Layout>
                <Content style={contentStyle}>
                    <Title>{message}</Title>
                    <Space wrap={true} size="large">
                        <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={connectToDevice}>Connect to Device</Button>
                        {device != null ? (
                            <>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={() => setIsModalOpen(true)}>Enter Details</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={readCharacteristic}>Subscribe</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={() => writeCharacteristic(writeValue)}>Write</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={stopTimer}>Stop Reading</Button>
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
                        <LineChart
                        xAxis={[{ data: graphData.payload.ticks }]}
                        series={[
                          {
                            data: graphData.payload.co2_percentage,
                            showMark: false,
                          },
                        ]}
                        height={600}
                        width={900}
                        margin={{ left: 30, right: 30, top: 30, bottom: 30 }}
                        grid={{ vertical: true, horizontal: true }}
                      />
                    )}

                </Content>
            </Layout>

            <Modal title="Enter Details" open={isModalOpen} footer={null} onCancel={handleCancel}>
                <Form
                    name="basic"
                    labelCol={{ span: 8 }}
                    wrapperCol={{ span: 16 }}
                    style={{ maxWidth: 600 }}
                    initialValues={{ remember: true }}
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Name"
                        name="name"
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


