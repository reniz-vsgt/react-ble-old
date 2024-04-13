import BLE from '../BLE/BLE';
const stream = {
  readService: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  readChar: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
  writeService: "dd8c1300-3ae2-5c42-b8be-96721cd710fe",
  writeChar: "dd8c1303-3ae2-5c42-b8be-96721cd710fe",
  speed: 20,
  writeValue: "0010110100000000",
  message: "Read data as stream"
}

function App() {
  return (
    <>
      <BLE
        readServiceUUID={stream.readService}
        readCharUUID={stream.readChar}
        writeServiceUUID={stream.writeService}
        writeCharUUID={stream.writeChar}
        speed={stream.speed}
        writeValue={stream.writeValue}
        message={stream.message}
      />
    </>
  );
}

export default App;
