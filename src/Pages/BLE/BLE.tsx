import React, { useEffect, useState } from 'react';
import { BluetoothDevice, IBleProps, RequestDeviceOptions } from './BLE.types';
import { Space, Typography, Button, Spin } from 'antd';
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
    readService,
    readChar,
    writeService,
    writeChar,
    speed,
    writeValue,
    message
}) => {

    const [device, setDevice] = useState<BluetoothDevice | null>(null);
    const [characteristicValue, setCharacteristicValue] = useState<Uint8Array>();
    const [finalData, setFinalData] = useState<Uint8Array>(new Uint8Array(0));
    const [intervalId, setIntervalId] = useState<NodeJS.Timer>()
    const [loader, setLoader] = useState<boolean>(false)
    const [seconds, setSeconds] = useState<number>(0)
    const [min, setMin] = React.useState<number>(0);
    const [sec, setSec] = React.useState<number>(0);




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
        makeTimeForm(Math.trunc(seconds));
    }, [seconds]);


    const mergeArrays = (arrays : any) => {
        const totalLength = arrays.reduce((acc:any, arr:any) => acc + arr.length, 0);
        const merged = new Uint8Array(totalLength);
        let offset = 0;
        arrays.forEach((arr:any) => {
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
                optionalServices: [readService, writeService],
            };
            const device = await (navigator as any).bluetooth.requestDevice(options);

            setDevice(device);
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
            const service = await device.gatt?.connect();

            if (service) {

                const Service = await service.getPrimaryService(writeService);
                const characteristic: any = await Service.getCharacteristic(writeChar);
                const uint8 = new Uint8Array(16);

                uint8[0] = 0;
                uint8[1] = 0;
                uint8[2] = 1;
                uint8[3] = 0;
                uint8[4] = 1;
                uint8[5] = 1;
                uint8[6] = 0;
                uint8[7] = 1;
                uint8[8] = 0;
                uint8[9] = 0;
                uint8[10] = 0;
                uint8[11] = 0;
                uint8[12] = 0;
                uint8[13] = 0;
                uint8[14] = 0;
                uint8[15] = 0;

                await characteristic?.writeValue(uint8);
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
            const service = await device.gatt?.connect();
            if (service) {
                const Service = await service.getPrimaryService(readService);
                const characteristic = await Service.getCharacteristic(readChar);
                try {
                    characteristic.startNotifications().then((val) => {
                        const data = new Uint8Array(val.value?.buffer || new ArrayBuffer(0));
                        // var string = new TextDecoder().decode(data);
                        // console.log(data, "-------------------> data");
                        // console.log(typeof data, "-------------------> typeof data");
                        setCharacteristicValue(data)

                    })
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
        clearInterval(intervalId)
        download(finalData, device?.name + ".bin")
        setFinalData(new Uint8Array(0));

    }

    const getData = async () => {
        setLoader(true)
        const intervalId = setInterval(async () => {
            setSeconds(seconds => seconds + 1 / speed)
            readCharacteristic()
        }, speed)
        setIntervalId(intervalId)
    }

    // const download = (data: string, fileName: string) => {
    //     let csvContent = "data:text/csv;charset=utf-8," + data;
    //     var encodedUri = encodeURI(csvContent);
    //     var link = document.createElement("a");
    //     link.setAttribute("href", encodedUri);
    //     link.setAttribute("download", fileName);
    //     document.body.appendChild(link);
    //     link.click();
    // };

    const download = (data: any, filename: string) => {
        // Function to handle writing data to a .bin file
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        // const encodedUri = URL.createObjectURL(blob);
        // var link = document.createElement("a");
        // link.setAttribute("href", encodedUri);
        // link.setAttribute("download", filename);
        // document.body.appendChild(link);
        // link.click();

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
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={getData}>Subscribe</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={() => writeCharacteristic(writeValue)}>Write</Button>
                                <Button style={{ backgroundColor: "#83BF8D" }} type="primary" size={'large'} onClick={stopTimer}>Stop Reading</Button>
                                <br />
                            </>
                        ) : null}
                    </Space>
                    <br />
                    <br />
                    <Space wrap={true} size="large">
                        {device &&
                            <>
                                <p>Connected to device: {device.name}</p>
                            </>

                        }

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


