import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

import { Toaster } from 'react-hot-toast';

import Home from './pages/camera/Home'; 
import Login from './pages/Login';
import Register from './pages/Register';

import DashboardHome from './pages/DashboardHome';
import Profile from './pages/Profile';
// Dihapus impor NotifikasiAlarm yang general karena ada duplikasi route
import AnalisisLaporan from './pages/AnalisisLaporan';

import LaporanAdmin from './pages/admin/LaporanAdmin';
import ManajemenUser from './pages/admin/ManajemenUser';
import ManajemenData from './pages/admin/ManajemenData';
import NotifikasiAlarmAdmin from './pages/admin/NotifikasiAlarmAdmin';
import JaringanWifi from './pages/admin/JaringanWifi'; // <-- IMPORT BARU

import LaporanDinas from './pages/dinas/LaporanDinas';
import NotifikasiAlarmDinas from './pages/dinas/NotifikasiAlarmDinas';

// Komponen untuk menyembunyikan Navbar publik di halaman admin/dinas
function LayoutPublik({ children }) {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/dinas');
  
  return (
    <>
      {!isDashboard && <Navbar />}
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <CssBaseline /> 
      <LayoutPublik>
        <Toaster position="top-center" reverseOrder={false} 
        toastOptions={{
          success: {
            duration: 2000,
          },
          error: {
            duration: 3000,
          },
        }}/>
        <Routes>
          {/* Rute Publik */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Rute Khusus Admin */}
          <Route path="/admin" element={<Sidebar />}>
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="laporan" element={<LaporanAdmin />} />
            <Route path="notif" element={<NotifikasiAlarmAdmin />} />
            <Route path="analisis" element={<AnalisisLaporan />} />
            <Route path="manajemen-user" element={<ManajemenUser />} />
            <Route path="manajemen-data" element={<ManajemenData />} />
            <Route path="jaringan-wifi" element={<JaringanWifi />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Rute Khusus Dinas */}
          <Route path="/dinas" element={<Sidebar />}>
            <Route path="dashboard" element={<DashboardHome />} />
            <Route path="laporan" element={<LaporanDinas />} />
            <Route path="notif" element={<NotifikasiAlarmDinas />} /> 
            {/* Hapus duplikasi Route notif yang tadinya mengarah ke NotifikasiAlarm */}
            <Route path="analisis" element={<AnalisisLaporan />} />
            <Route path="profile" element={<Profile />} />
          </Route>

        </Routes>
      </LayoutPublik>
    </Router>
  );
}

export default App;