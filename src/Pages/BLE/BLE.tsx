import React, { useEffect, useState } from 'react';
import { BluetoothDevice, BluetoothRemoteGATTCharacteristic, BluetoothRemoteGATTServer, IBleProps, RequestDeviceOptions } from './BLE.types';
import { Space, Typography, Button } from 'antd';
import { Layout } from 'antd';
import { cardio } from 'ldrs'
import './BLE.css'

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
    message
}) => {

    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [characteristicValue, setCharacteristicValue] = useState<Uint8Array>();
    const [finalData, setFinalData] = useState<Uint8Array>(new Uint8Array(0));
    const [loader, setLoader] = useState<boolean>(false)
    const [seconds, setSeconds] = useState<number>(0)
    const [min, setMin] = React.useState<number>(0);
    const [sec, setSec] = React.useState<number>(0);

    const [service, setService] = useState<BluetoothRemoteGATTServer | undefined>();

    const [writeChar, setWriteChar] = useState<BluetoothRemoteGATTCharacteristic>();

    const [readChar, setReadChar] = useState<BluetoothRemoteGATTCharacteristic>();
    const [timer, setTimer] = useState<NodeJS.Timer>()


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
        try {
            if (service) {

                try {
                    await readChar?.startNotifications();
                    startTimer()
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
        download(finalData, device?.name + ".bin")
        setFinalData(new Uint8Array(0));

    }

    const download = (data: any, filename: string) => {
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    };
    const startTimer = async () => {
        setLoader(true)
        const intervalId = setInterval(async () => {
            setSeconds(seconds => seconds + 1)
        }, 1000)
        setTimer(intervalId)
    }

    return (
        <>

            <Layout>
                <Content style={contentStyle}>
                    <Title>{message}</Title>
                    <Space wrap={true} size="large">
                        <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={connectToDevice}>Connect to Device</Button>
                        {device != null ? (
                            <>
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

                </Content>
            </Layout>

        </>

    );
};

export default BLE;


