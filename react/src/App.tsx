import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Home } from "@/pages/Home"
import { PatientDetails } from "@/pages/PatientDetails"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/patient/:patientId" element={<PatientDetails />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App