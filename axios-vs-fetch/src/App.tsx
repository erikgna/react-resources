import { FileTransferFetch } from "./components/FileTransferFetch";
import { FileTransferAxios } from "./components/FileTransferAxios";
import { AxiosExample } from "./components/AxiosExample";
import { FetchExample } from "./components/FetchExample";

export default function App() {
  return (
    <div style={{ padding: 40 }}>
      <h1>Fetch vs Axios POC</h1>

      {/* <FileTransferFetch />
      <FileTransferAxios /> */}

      {/* <AxiosExample /> */}
      <FetchExample />
    </div>
  );
}