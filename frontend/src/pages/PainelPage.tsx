import { useEffect, useState } from 'react';
import { secretaria } from '../api/endpoints';
import type { Painel } from '../api/endpoints';

export default function PainelPage() {
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    secretaria.painel()
      .then(setPainel)
      .catch(() => setErro('Não foi possível carregar o painel.'));
  }, []);

  if (erro) return <p style={{ color: '#c0392b' }}>{erro}</p>;
  if (!painel) return <p>Carregando…</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Painel</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        <Card titulo="Registros no inventário" valor={painel.registros_inventario} />
        <Card titulo="Formulários" valor={painel.formularios} />
        <Card titulo="Respostas enviadas" valor={painel.respostas_enviadas} />
        <Card titulo="Importações" valor={painel.importacoes} />
      </div>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div style={{ background: '#f7fafd', border: '1px solid #d0e3f4', borderRadius: '8px', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <span style={{ fontSize: '0.85rem', color: '#555' }}>{titulo}</span>
      <span style={{ fontSize: '2rem', fontWeight: 700, color: '#1a4a7a' }}>{valor}</span>
    </div>
  );
}
