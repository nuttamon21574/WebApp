import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyAccount from "./pages/MyAccount";
import BNPL from "./pages/BNPL";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendations";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {

  // 👇 เพิ่มตรงนี้
  useEffect(() => {
    const currentVersion = __APP_VERSION__;
    const savedVersion = localStorage.getItem("app_version");

    if (savedVersion && savedVersion !== currentVersion) {
      console.log("🔄 New version detected → reload");
      localStorage.setItem("app_version", currentVersion);
      window.location.reload();
    } else {
      localStorage.setItem("app_version", currentVersion);
    }
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Recommendations" element={<Recommendations />} />
        <Route path="/my-account" element={<MyAccount />} />
        <Route path="/bnpl" element={<BNPL />} />
      </Routes>
    </BrowserRouter>
  );
}