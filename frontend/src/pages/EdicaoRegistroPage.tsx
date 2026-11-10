import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResponsive } from '../hooks/useResponsive';

export default function EdicaoRegistroPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isMobile } = useResponsive();

  const [form, setForm] = useState({
    nome: 'Hotel Thermas Olímpia',
    categoria: 'Meio de hospedagem',
    descricao: 'Hotel com acesso a parque aquático e piscinas termais.',
    endereco: 'Rua das Flores, 150',
    bairro: 'Centro',
    lat: '-20.7382',
    lng: '-48.9103',
  });

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })); }

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '24px', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Registro #{id}</div>
          <h1 style={{ margin: 0, fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
            Edição de Registro
          </h1>
        </div>

        {/* Identificação */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            Identificação
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Nome do estabelecimento" value={form.nome} onChange={v => set('nome', v)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>Categoria</label>
              <select
                value={form.categoria}
                onChange={e => set('categoria', e.target.value)}
                style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', background: '#fff', outline: 'none' }}
              >
                <option>Meio de hospedagem</option>
                <option>Atrativo</option>
                <option>Alimentação</option>
                <option>Serviço turístico</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>Descrição</label>
              <textarea
                value={form.descricao}
                onChange={e => set('descricao', e.target.value)}
                rows={3}
                style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', outline: 'none', resize: 'vertical' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
              />
            </div>
          </div>
        </div>

        {/* Localização */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            Localização
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Field label="Endereço" value={form.endereco} onChange={v => set('endereco', v)} />
            <Field label="Bairro" value={form.bairro} onChange={v => set('bairro', v)} />
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <Field label="Latitude" value={form.lat} onChange={v => set('lat', v)} />
              <Field label="Longitude" value={form.lng} onChange={v => set('lng', v)} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => navigate('/secretaria/inventario')}
            style={{ background: '#fff', color: 'var(--navy-700)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, ...(isMobile ? { flex: 1 } : {}) }}
          >
            Cancelar
          </button>
          <button
            style={{ background: 'var(--navy-500)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, ...(isMobile ? { flex: 1 } : {}) }}
          >
            Salvar alterações
          </button>
        </div>
      </div>

      {/* Sidebar contextual */}
      <div style={{ width: isMobile ? '100%' : '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.06em' }}>METADADOS</div>
          {[
            { label: 'ID', value: `#${id}` },
            { label: 'Criado em', value: '12/03/2025' },
            { label: 'Atualizado', value: '08/09/2025' },
            { label: 'Situação', value: 'Ativo' },
          ].map(m => (
            <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--text-muted)' }}>{m.label}</span>
              <span style={{ fontWeight: 500, color: 'var(--navy-800)' }}>{m.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#FFF4D9', border: '1px solid #F9D8A0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-pending-fg)', marginBottom: '6px' }}>Manutenção</div>
          <div style={{ fontSize: '12px', color: 'var(--status-pending-fg)', lineHeight: 1.6 }}>
            Verificar coordenadas e atualizar descrição com informações do CADASTUR.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--navy-800)' }}>{label}</label>
      <input
        type="text" value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', outline: 'none' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'var(--cyan-700)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
      />
    </div>
  );
}
