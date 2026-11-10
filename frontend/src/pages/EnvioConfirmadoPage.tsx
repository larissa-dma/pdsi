import { Link, useParams } from 'react-router-dom';

export default function EnvioConfirmadoPage() {
  const { id } = useParams();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
      <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Ícone de sucesso */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--status-sent-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px',
          }}>
            ✓
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--status-sent-bg)', color: 'var(--status-sent-fg)',
              borderRadius: '20px', padding: '4px 14px', fontSize: '12px', fontWeight: 600,
              marginBottom: '12px',
            }}>
              ✓ Pesquisa enviada com sucesso
            </div>
            <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 700, color: 'var(--navy-800)', textAlign: 'center' }}>
              Obrigado pela sua participação!
            </h1>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-mid)', textAlign: 'center', lineHeight: 1.6 }}>
              Suas respostas foram registradas e contribuirão para os indicadores do turismo de Olímpia.
            </p>
          </div>
        </div>

        {/* Resumo */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '12px', letterSpacing: '0.06em' }}>
            RESUMO DO ENVIO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Formulário', value: `Pesquisa de Ocupação #${id}` },
              { label: 'Data de envio', value: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) },
              { label: 'Status', value: 'Enviado' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span style={{ fontWeight: 500, color: 'var(--navy-800)' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Link
            to="/formularios"
            style={{
              background: 'var(--navy-500)', color: '#fff',
              borderRadius: '8px', padding: '12px 28px',
              fontSize: '14px', fontWeight: 600,
              display: 'inline-block',
            }}
          >
            Voltar para meus formulários
          </Link>
        </div>
      </div>
    </div>
  );
}
