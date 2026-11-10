import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './api/AuthContext';
import AppLayout from './layouts/AppLayout';
import RotaProtegida from './components/RotaProtegida';
import HomeRedirect from './pages/HomeRedirect';
import LoginPage from './pages/LoginPage';
import PainelPage from './pages/PainelPage';
import FormulariosPage from './pages/FormulariosPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            element={
              <RotaProtegida>
                <AppLayout />
              </RotaProtegida>
            }
          >
            <Route index element={<HomeRedirect />} />

            <Route
              path="/secretaria/painel"
              element={
                <RotaProtegida perfil="SECRETARIA">
                  <PainelPage />
                </RotaProtegida>
              }
            />

            <Route
              path="/formularios"
              element={
                <RotaProtegida perfil="HOSPEDAGEM">
                  <FormulariosPage />
                </RotaProtegida>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
