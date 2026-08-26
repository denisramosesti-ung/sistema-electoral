import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import ConsultarDatosPage from "./pages/ConsultarDatosPage.jsx";
import "./tailwind.css";   // ← IMPORTANTE

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/consultar-datos" element={<ConsultarDatosPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
