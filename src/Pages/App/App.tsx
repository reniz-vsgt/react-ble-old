import BLE from '../BLE/BLE';
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';



function App() {

  const stream = {
    readService: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    readChar: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
    writeService: "dd8c1300-3ae2-5c42-b8be-96721cd710fe",
    writeChar: "dd8c1303-3ae2-5c42-b8be-96721cd710fe",
    writeValue: "0010110111110000",
    message: "Read data as stream"
  }

  // const router = createHashRouter([
  //   {
  //     path: '*',
  //     element: <Navigate to="/react-ble" />
  //   },
  //   {
  //     path: 'react-ble',
  //     element: <BLE
  //       readServiceUUID={stream.readService}
  //       readCharUUID={stream.readChar}
  //       writeServiceUUID={stream.writeService}
  //       writeCharUUID={stream.writeChar}
  //       writeValue={stream.writeValue}
  //       message={stream.message}
  //       token={process.env.REACT_APP_RND_TOKEN || ""}
  //       baseUrl={process.env.REACT_APP_RND_BASE_URL || ""}
  //       env={"RND"}
  //     />,
  //   },
  //   {
  //     path: 'dev',
  //     element: <BLE
  //       readServiceUUID={stream.readService}
  //       readCharUUID={stream.readChar}
  //       writeServiceUUID={stream.writeService}
  //       writeCharUUID={stream.writeChar}
  //       writeValue={stream.writeValue}
  //       message={stream.message}
  //       token={process.env.REACT_APP_DEV_TOKEN || ""}
  //       baseUrl={process.env.REACT_APP_DEV_BASE_URL || ""}
  //       env={"DEV"}
  //     />
  //   }
  // ]);

  return (
    <>

      <React.StrictMode>
        <Router>
          <Routes>
            <Route path="/" element={ <Navigate to="/react-ble" />}/>
            <Route path='/react-ble' element={
              <BLE
                readServiceUUID={stream.readService}
                readCharUUID={stream.readChar}
                writeServiceUUID={stream.writeService}
                writeCharUUID={stream.writeChar}
                writeValue={stream.writeValue}
                message={stream.message}
                token={process.env.REACT_APP_RND_TOKEN || ""}
                baseUrl={process.env.REACT_APP_RND_BASE_URL || ""}
                env={"RND"}
              />
            } />
            <Route path='/dev' element={
              <BLE
                readServiceUUID={stream.readService}
                readCharUUID={stream.readChar}
                writeServiceUUID={stream.writeService}
                writeCharUUID={stream.writeChar}
                writeValue={stream.writeValue}
                message={stream.message}
                token={process.env.REACT_APP_DEV_TOKEN || ""}
                baseUrl={process.env.REACT_APP_DEV_BASE_URL || ""}
                env={"DEV"}
              />
            } />
          </Routes>
        </Router>
        {/* <BLE
          readServiceUUID={stream.readService}
          readCharUUID={stream.readChar}
          writeServiceUUID={stream.writeService}
          writeCharUUID={stream.writeChar}
          writeValue={stream.writeValue}
          message={stream.message}
          token={process.env.REACT_APP_RND_TOKEN || ""}
          baseUrl={process.env.REACT_APP_RND_BASE_URL || ""}
          env={"RND"}
        /> */}
      </React.StrictMode>
    </>
  );
}

export default App;
