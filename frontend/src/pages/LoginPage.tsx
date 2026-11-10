import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

export default function LoginPage() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const [identificador, setIdentificador] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      await entrar(identificador, senha);
      navigate('/');
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f4f8' }}>
      <form
        onSubmit={handleSubmit}
        style={{ background: '#fff', padding: '2.5rem', borderRadius: '8px', boxShadow: '0 2px 12px #0001', width: '340px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <h1 style={{ margin: 0, fontSize: '1.3rem', color: '#1a4a7a' }}>OTO</h1>
        <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>Observatório de Turismo de Olímpia</p>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
          Identificador (e-mail)
          <input
            type="text"
            value={identificador}
            onChange={e => setIdentificador(e.target.value)}
            required
            autoComplete="username"
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.9rem' }}>
          Senha
          <input
            type="password"
            value={senha}
            onChange={e => setSenha(e.target.value)}
            required
            autoComplete="current-password"
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </label>

        {erro && <p style={{ color: '#c0392b', margin: 0, fontSize: '0.9rem' }}>{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          style={{ background: '#1a4a7a', color: '#fff', border: 'none', borderRadius: '4px', padding: '10px', cursor: 'pointer', fontSize: '1rem' }}
        >
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
