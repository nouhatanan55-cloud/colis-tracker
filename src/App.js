import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import FormulaireRegister from "./pages/FormulaireRegister";

import AdminLayout from "./components/AdminLayout";
import CreerColis from "./pages/CreerColis";
import ListeColis from "./pages/ListeColis";
import DashboardAdmin from "./pages/DashboardAdmin";
import Statistiques from "./pages/Statistiques";
import Livreurs from "./pages/Livreurs";
import Abonnement from "./pages/Abonnement";
import Parametres from "./pages/Parametres";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection vers Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Pages sans Sidebar */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<FormulaireRegister />} />

        {/* Pages avec Sidebar */}
        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<DashboardAdmin />} />
          <Route path="/colis" element={<ListeColis />} />
          <Route path="/colis/nouveau" element={<CreerColis />} />
          <Route path="/statistiques" element={<Statistiques />} />
          <Route path="/livreurs" element={<Livreurs />} />
          <Route path="/abonnement" element={<Abonnement />} />
          <Route path="/parametres" element={<Parametres />} />
        </Route>

        {/* Route inconnue */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}

export default App;