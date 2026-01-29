import { BrowserRouter, Route, Routes } from "react-router-dom"

import ResponsivePlayground from "./components/ResponsivePlayground"
import StatePlayground from "./components/StatePlayground"
import DarkModePlayground from "./components/DarkModePlayground"
import ThemePlayground from "./components/ThemePlayground"
import CustomUtilityPlayground from "./components/CustomUtilityPlayground"
import DetectionPlayground from "./components/DetectionPlayground"
import DirectivesPlayground from "./components/DirectivesPlayground"

import Home from "./Home"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/state-playground" element={<StatePlayground />} />
        <Route path="/responsive-playground" element={<ResponsivePlayground />} />
        <Route path="/dark-mode-playground" element={<DarkModePlayground />} />
        <Route path="/theme-playground" element={<ThemePlayground />} />
        <Route path="/custom-utility-playground" element={<CustomUtilityPlayground />} />
        <Route path="/detection-playground" element={<DetectionPlayground />} />
        <Route path="/directives-playground" element={<DirectivesPlayground />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
