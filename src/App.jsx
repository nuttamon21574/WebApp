import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyAccount from "./pages/MyAccount";
import BNPL from "./pages/BNPL";
import Dashboard from "./pages/Dashboard";
import Recommendations from "./pages/Recommendatios";
import Login from "./pages/Login";
import Register from "./pages/Register";

export default function App() {
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
