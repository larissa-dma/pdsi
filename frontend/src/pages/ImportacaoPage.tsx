import { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';

type Fonte = 'arquivo' | 'url';

const INCONSISTENCIAS = [
  { tipo: 'Coordenadas ausentes', qtd: 8, cor: 'var(--status-pending-fg)', bg: 'var(--status-pending-bg)' },
  { tipo: 'Categoria inválida', qtd: 3, cor: '#5B21B6', bg: '#EDE9FE' },
  { tipo: 'Nome duplicado', qtd: 2, cor: 'var(--status-available-fg)', bg: 'var(--status-available-bg)' },
  { tipo: 'CEP não encontrado', qtd: 5, cor: '#B91C1C', bg: '#FEF2F2' },
];

const PREVIEW = [
  { nome: 'Hotel Star', categoria: 'Meio de hospedagem', endereco: 'Rua A, 10', status: 'ok' },
  { nome: 'Pousada Sol', categoria: 'Meio de hospedagem', endereco: 'Av. B, 200', status: 'warn' },
  { nome: '', categoria: 'Atrativo', endereco: 'Rua C', status: 'erro' },
];

export default function ImportacaoPage() {
  const { isMobile } = useResponsive();
  const [fonte, setFonte] = useState<Fonte>('arquivo');
  const [etapa, setEtapa] = useState<'upload' | 'mapeamento' | 'validacao'>('upload');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ margin: '0 0 4px', fontSize: isMobile ? '18px' : '20px', fontWeight: 700, color: 'var(--navy-800)' }}>
          Importação e Validação de Dados
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
          Carregue e valide dados do CADASTUR ou planilhas externas
        </p>
      </div>

      {/* Seletor de fonte */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)', marginBottom: '16px' }}>Fonte dos dados</div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {(['arquivo', 'url'] as Fonte[]).map(f => (
            <button
              key={f}
              onClick={() => setFonte(f)}
              style={{
                padding: '10px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                border: fonte === f ? 'none' : '1.5px solid var(--border)',
                background: fonte === f ? 'var(--navy-700)' : '#fff',
                color: fonte === f ? '#fff' : 'var(--text-mid)',
              }}
            >
              {f === 'arquivo' ? '📁 Arquivo local' : '🔗 URL / API'}
            </button>
          ))}
        </div>
        {etapa === 'upload' && (
          <div style={{ marginTop: '16px' }}>
            {fonte === 'arquivo' ? (
              <div style={{
                border: '2px dashed var(--border)', borderRadius: '10px', padding: isMobile ? '24px' : '36px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                background: 'var(--bg-stripe)', cursor: 'pointer',
              }}>
                <span style={{ fontSize: '24px' }}>⬆</span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--navy-700)', textAlign: 'center' }}>
                  Arraste o arquivo ou clique para selecionar
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CSV, XLSX — máx. 10 MB</span>
              </div>
            ) : (
              <input
                type="url"
                placeholder="https://api.cadastur.turismo.gov.br/..."
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '13px', outline: 'none', marginTop: '8px' }}
              />
            )}
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEtapa('mapeamento')}
                style={{ background: 'var(--navy-500)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, ...(isMobile ? { width: '100%' } : {}) }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mapeamento de campos */}
      {etapa !== 'upload' && (
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>
            Mapeamento de campos
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
              <thead>
                <tr style={{ background: '#F5F9FC' }}>
                  {['Coluna no arquivo', 'Campo OTO', 'Exemplo'].map(col => (
                    <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { col: 'nome_estabelecimento', campo: 'Nome', ex: 'Hotel Star' },
                  { col: 'tipo', campo: 'Categoria', ex: 'Meio de hospedagem' },
                  { col: 'logradouro', campo: 'Endereço', ex: 'Rua A, 10' },
                ].map((r, i) => (
                  <tr key={r.col} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontFamily: 'monospace', color: 'var(--navy-800)' }}>{r.col}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select style={{ padding: '6px 12px', border: '1.5px solid var(--border)', borderRadius: '7px', fontSize: '12px', background: '#fff' }}>
                        <option>{r.campo}</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{r.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {etapa === 'mapeamento' && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setEtapa('validacao')}
                style={{ background: 'var(--navy-500)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 24px', fontSize: '13px', fontWeight: 600, ...(isMobile ? { width: '100%' } : {}) }}
              >
                Validar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Validação */}
      {etapa === 'validacao' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '14px' }}>
            {INCONSISTENCIAS.map(inc => (
              <div key={inc.tipo} style={{ background: '#fff', border: `1px solid ${inc.bg}`, borderRadius: '10px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: inc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: inc.cor, fontSize: '16px', flexShrink: 0 }}>
                  {inc.qtd}
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy-800)' }}>{inc.tipo}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{inc.qtd} registro(s)</div>
                </div>
              </div>
            ))}
          </div>

          {/* Preview */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '14px', color: 'var(--navy-800)' }}>
              Pré-visualização dos registros
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                <thead>
                  <tr style={{ background: '#F5F9FC' }}>
                    {['Nome', 'Categoria', 'Endereço', 'Status'].map(col => (
                      <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PREVIEW.map((r, i) => (
                    <tr key={i} style={{ borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: r.nome ? 'var(--navy-800)' : 'var(--text-muted)' }}>{r.nome || '(sem nome)'}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{r.categoria}</td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-mid)' }}>{r.endereco}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: r.status === 'ok' ? 'var(--status-sent-bg)' : r.status === 'warn' ? 'var(--status-pending-bg)' : '#FEF2F2',
                          color: r.status === 'ok' ? 'var(--status-sent-fg)' : r.status === 'warn' ? 'var(--status-pending-fg)' : '#B91C1C',
                          borderRadius: '20px', padding: '3px 10px', fontSize: '11px', fontWeight: 500,
                        }}>
                          {r.status === 'ok' ? 'Válido' : r.status === 'warn' ? 'Alerta' : 'Inválido'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Banner de decisão */}
          <div style={{
            background: 'var(--status-pending-bg)', border: '1px solid #F9D8A0',
            borderRadius: '12px', padding: '16px 20px',
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between', gap: '16px',
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--status-pending-fg)' }}>18 inconsistências encontradas</div>
              <div style={{ fontSize: '13px', color: 'var(--status-pending-fg)', opacity: 0.8 }}>Como deseja prosseguir?</div>
            </div>
            <div style={{ display: 'flex', gap: '10px', ...(isMobile ? { width: '100%' } : {}) }}>
              <button style={{ background: '#fff', color: 'var(--navy-700)', border: '1.5px solid var(--border)', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, ...(isMobile ? { flex: 1 } : {}) }}>
                Ajustar
              </button>
              <button style={{ background: 'var(--navy-500)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 20px', fontSize: '13px', fontWeight: 600, ...(isMobile ? { flex: 1 } : {}) }}>
                Ignorar inconsistências
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
