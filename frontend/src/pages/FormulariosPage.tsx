import { useEffect, useState } from 'react';
import { hospedagem } from '../api/endpoints';
import type { Formulario } from '../api/endpoints';

export default function FormulariosPage() {
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    hospedagem.formularios()
      .then(setFormularios)
      .catch(() => setErro('Não foi possível carregar os formulários.'));
  }, []);

  if (erro) return <p style={{ color: '#c0392b' }}>{erro}</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Meus Formulários</h2>
      {formularios.length === 0 ? (
        <p style={{ color: '#777' }}>Nenhum formulário disponível no momento.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {formularios.map(f => (
            <li key={f.id} style={{ background: '#f7fafd', border: '1px solid #d0e3f4', borderRadius: '8px', padding: '1rem' }}>
              <strong>{f.titulo}</strong>
              <span style={{ marginLeft: '1rem', color: '#666', fontSize: '0.9rem' }}>Ref: {f.referencia} · Prazo: {f.prazo}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
