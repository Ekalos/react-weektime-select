/*
 * @Autor: Ekalos
 * @Date: 2022-01-26 16:15:55
 * @LastEditors: Ekalos
 * @LastEditTime: 2022-02-11 17:58:20
 */
import MultiTimeSelect from "./component/multiTimeSelect";
// import "./App.css";
window.ref = null;
function App() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <MultiTimeSelect
        timeSlice={[]}
        ref={(el) => (window.ref = el)}
        style={{ width: "50vw" }}
      />
    </div>
  );
}

export default App;
