import { IFormData } from "./BLE.types";

export const getBgl = async (token: string, baseUrl: string, startTimestamp: string) => {
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
    return bgl.payload
}

export const uploadAccFile = async (token: string, baseUrl: string, deviceId: string, startTimestamp: string, fileData: string[][]) => {
    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", "Bearer " + token);

    const formdata = new FormData();
    formdata.append("binFile", new Blob([fileData.join("\n")]), "upload.csv");

    const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: formdata
    };

    const response = await fetch(`${baseUrl}/api/v2/vsgt-recording-service/uploadBinFile?deviceId=${deviceId}&startTime=${startTimestamp}&fileType=acc&fileUploadType=single`, requestOptions)
    if (!response.ok) {
        alert(`${(await response.json()).message} \nPlease try again!!`)
        throw new Error(`HTTP error! Message: ${(await response.json()).message} Status: ${response.status}`);
    }
    const resData = await response.json()
    return resData

}

export const uploadCo2File = async (fileData: Uint8Array, baseUrl: string, token: string, deviceId: string, startTimestamp: string, formData: IFormData) => {

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

    try {
        const response = await fetch(
            `${baseUrl}/api/v2/vsgt-recording-service/uploadCo2BinFile?deviceId=${deviceId}&startTime=${startTimestamp}&subjectId=${formData?.subjectId}&age=${formData?.age}&height=${formData?.height}&weight=${formData?.weight}&gender=${formData?.gender}&diabetic=${formData?.diabetic}&latestWeight=${formData?.latestWeight}&comments=${formData?.comments}`,
            requestOptions
        );
        if (!response.ok) {
            alert(`${(await response.json()).message} \nPlease try again!!`)
            throw new Error(`HTTP error! Message: ${(await response.json()).message} Status: ${response.status}`);
        }

        const graphData = await response.json();
        const bglValues = await getBgl(token, baseUrl, startTimestamp)
        return { graphData, bglValues }
    } catch (error) {
        console.error("Error:", error);
        return { graphData: null, bglValues: null }
    }

}
