import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './api/AuthContext';
import HospedagemLayout from './layouts/HospedagemLayout';
import SecretariaLayout from './layouts/SecretariaLayout';
import RotaProtegida from './components/RotaProtegida';
import HomeRedirect from './pages/HomeRedirect';
import LoginPage from './pages/LoginPage';

// HOSPEDAGEM
import FormulariosPage from './pages/FormulariosPage';
import PreencherFormularioPage from './pages/PreencherFormularioPage';
import EnvioConfirmadoPage from './pages/EnvioConfirmadoPage';

// SECRETARIA
import PainelPage from './pages/PainelPage';
import InventarioPage from './pages/InventarioPage';
import EdicaoRegistroPage from './pages/EdicaoRegistroPage';
import ImportacaoPage from './pages/ImportacaoPage';
import OcupacaoPage from './pages/OcupacaoPage';
import AdminDadosPage from './pages/AdminDadosPage';
import MapaPage from './pages/MapaPage';
import SustentabilidadePage from './pages/SustentabilidadePage';
import RelatoriosPage from './pages/RelatoriosPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas HOSPEDAGEM */}
          <Route
            element={
              <RotaProtegida perfil="HOSPEDAGEM">
                <HospedagemLayout />
              </RotaProtegida>
            }
          >
            <Route path="/formularios" element={<FormulariosPage />} />
            <Route path="/formularios/:id/preencher" element={<PreencherFormularioPage />} />
            <Route path="/formularios/:id/confirmacao" element={<EnvioConfirmadoPage />} />
          </Route>

          {/* Rotas SECRETARIA */}
          <Route
            element={
              <RotaProtegida perfil="SECRETARIA">
                <SecretariaLayout />
              </RotaProtegida>
            }
          >
            <Route path="/secretaria/painel" element={<PainelPage />} />
            <Route path="/secretaria/inventario" element={<InventarioPage />} />
            <Route path="/secretaria/inventario/:id/editar" element={<EdicaoRegistroPage />} />
            <Route path="/secretaria/importacao" element={<ImportacaoPage />} />
            <Route path="/secretaria/ocupacao" element={<OcupacaoPage />} />
            <Route path="/secretaria/pesquisas" element={<AdminDadosPage />} />
            <Route path="/secretaria/mapa" element={<MapaPage />} />
            <Route path="/secretaria/sustentabilidade" element={<SustentabilidadePage />} />
            <Route path="/secretaria/relatorios" element={<RelatoriosPage />} />
          </Route>

          {/* Redirect raiz */}
          <Route
            index
            element={
              <RotaProtegida>
                <HomeRedirect />
              </RotaProtegida>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
