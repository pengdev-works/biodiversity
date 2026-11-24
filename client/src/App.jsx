import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import SystemSplashScreen from './components/SystemSplashScreen.jsx';
import HomePage from './pages/HomePage.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import SpeciesDetailPage from './pages/SpeciesDetailPage.jsx';
import LocationsPage from './pages/LocationsPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import MagazineReaderPage from './pages/MagazineReaderPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import SpeciesManagement from './pages/admin/SpeciesManagement.jsx';
import CategoryManagement from './pages/admin/CategoryManagement.jsx';
import PhotoLibrary from './pages/admin/PhotoLibrary.jsx';
import ModelManagement from './pages/admin/ModelManagement.jsx';
import MagazineBuilder from './pages/admin/MagazineBuilder.jsx';
import ContributorsManagement from './pages/admin/ContributorsManagement.jsx';

function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SystemSplashScreen />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/explore" element={<PublicLayout><ExplorePage /></PublicLayout>} />
          <Route path="/explore/:id" element={<PublicLayout><SpeciesDetailPage /></PublicLayout>} />
          <Route path="/locations" element={<PublicLayout><LocationsPage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/magazine" element={<MagazineReaderPage />} />

          {/* Hidden admin portal - NOT in public nav */}
          <Route path="/secure-admin-portal/login" element={<AdminLogin />} />
          <Route path="/secure-admin-portal" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="species" element={<SpeciesManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="photos" element={<PhotoLibrary />} />
            <Route path="models" element={<ModelManagement />} />
            <Route path="magazine" element={<MagazineBuilder />} />
            <Route path="contributors" element={<ContributorsManagement />} />
            <Route path="team" element={<ContributorsManagement />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
