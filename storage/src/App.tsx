import { Cookie } from "./Cookie";
import { IndexedDB } from "./IndexedDB";
import { Storage } from "./Storage";

function App() {
  return (
    <>
      <Storage />
      <Cookie />
      <IndexedDB />
    </>
  );
}

export default App;
