"""Integração dos novos módulos. Use SOMENTE API/banco descartáveis."""
import os, sys, json, uuid, urllib.request, urllib.error, io, zipfile
sys.path.insert(0, os.path.dirname(__file__))
from smoke_test import Client, BASE

def upload(client, name, data):
    boundary='oto'+uuid.uuid4().hex
    body=(f'--{boundary}\r\nContent-Disposition: form-data; name="arquivo"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
    req=urllib.request.Request(BASE+'/secretaria/importacoes/preparar',data=body,method='POST',headers={'Content-Type':f'multipart/form-data; boundary={boundary}',client.token['headerName']:client.token['token']})
    with client.opener.open(req) as res:return json.load(res)
def download(client,path):
    with client.opener.open(BASE+path) as res:return res.read()
def main():
    admin=Client();admin.login(os.environ['OTO_TEST_ADMIN'],os.environ['OTO_TEST_PASSWORD'])
    admin.call('GET','/secretaria/analises/resumo')
    admin.call('GET','/secretaria/analises/resumo?inicio=2026-12-01&fim=2026-01-01',expected=400)
    inventory=admin.call('POST','/secretaria/inventario/registros',{'nome':'=SUM(1,2) '+uuid.uuid4().hex,'descricao':'Descrição original','tipoCadastro':'estabelecimento'},expected=201)
    payload={'nome':inventory['nome'],'descricao':'Descrição revisada','razaoSocial':'Razão de teste','tipoCadastro':'estabelecimento','latitude':-20.75,'longitude':-48.9,'situacaoConferencia':'conferido'}
    saved=admin.call('PUT',f"/secretaria/inventario/registros/{inventory['id']}",payload)
    assert saved['descricao']=='Descrição revisada' and saved['situacao_conferencia']=='conferido'
    contact=admin.call('POST',f"/secretaria/inventario/registros/{inventory['id']}/canais",{'tipo':'email','valor':'teste@example.invalid','publico':False},expected=201)
    activity=admin.call('POST',f"/secretaria/inventario/registros/{inventory['id']}/atividades",{'cnae':'001234','descricao':'Atividade sintética'},expected=201)
    cadastur=admin.call('POST',f"/secretaria/inventario/registros/{inventory['id']}/cadastur",{'obrigatoriedade':1,'registrado':False,'numero':None},expected=201)
    complements=admin.call('GET',f"/secretaria/inventario/registros/{inventory['id']}/complementos")
    assert complements['atividades'][0]['cnae']=='001234' and complements['cadastur'][0]['registrado'] is False
    admin.call('DELETE',f"/secretaria/inventario/registros/{inventory['id']}/canais/{contact['id']}")
    assert admin.call('GET','/secretaria/inventario/registros?situacao=conferido')
    stage=upload(admin,'ocupacao.csv',b'mes_referencia;ocupacao_percentual;fluxo_pessoas;tipo_dado\n2026-11;65.5;120;consolidado\n2026-11;101;100;consolidado\n2026-12;;0;expectativa\n')
    mapping={k:k for k in ['mes_referencia','ocupacao_percentual','fluxo_pessoas','tipo_dado']}
    result=admin.call('POST',f"/secretaria/importacoes/previas/{stage['id']}/validar",{'tipo':'ocupacao','referencia':'2026-11','campos':mapping})
    assert result['validas']==2 and result['total']==3,result
    admin.call('POST',f"/secretaria/importacoes/previas/{stage['id']}/confirmar",{'somenteValidas':False},expected=400)
    batch=admin.call('POST',f"/secretaria/importacoes/previas/{stage['id']}/confirmar",{'somenteValidas':True})
    assert batch['linhas_validas']==2 and batch['linhas_pendentes']==1
    assert len(admin.call('GET',f"/secretaria/importacoes/{batch['id']}/erros"))==1
    admin.call('POST',f"/secretaria/importacoes/previas/{stage['id']}/confirmar",{'somenteValidas':True},expected=409)
    summary=admin.call('GET','/secretaria/analises/resumo?tipo=consolidado')
    assert any(float(row['ocupacao'])==65.5 and row['fluxo']==120 for row in summary['serie']),summary
    forecast=admin.call('GET','/secretaria/analises/resumo?tipo=expectativa')
    assert forecast['serie'][0]['fluxo']==0 and forecast['serie'][0]['ocupacao'] is None
    duplicate=upload(admin,'ocupacao.csv',b'mes_referencia;ocupacao_percentual;fluxo_pessoas;tipo_dado\n2026-11;65.5;120;consolidado\n2026-11;101;100;consolidado\n2026-12;;0;expectativa\n')
    admin.call('POST',f"/secretaria/importacoes/previas/{duplicate['id']}/validar",{'tipo':'ocupacao','referencia':'2026-11','campos':mapping})
    admin.call('POST',f"/secretaria/importacoes/previas/{duplicate['id']}/confirmar",{'somenteValidas':True},expected=409)
    for fmt,signature in [('csv',b'\xef\xbb\xbf'),('xlsx',b'PK'),('pdf',b'%PDF')]:
        raw=download(admin,f'/secretaria/relatorios/exportar?tipo=inventario&formato={fmt}')
        assert raw.startswith(signature),(fmt,raw[:30])
        if fmt=='csv':assert "'=SUM" in raw.decode('utf-8')
        if fmt=='xlsx':assert 'xl/workbook.xml' in zipfile.ZipFile(io.BytesIO(raw)).namelist()
    xlsx=download(admin,'/secretaria/relatorios/exportar?tipo=ocupacao&formato=xlsx')
    staged_xlsx=upload(admin,'export.xlsx',xlsx);assert 'mes_referencia' in staged_xlsx['colunas']
    for external in ['issqn','caged','veiculos','fretamento']:
        raw=f'mes_referencia;medida;valor;unidade;recorte\n2026-11;Teste {external};100;unidades;FICTICIO\n'.encode()
        preview=upload(admin,external+'.csv',raw)
        admin.call('POST',f"/secretaria/importacoes/previas/{preview['id']}/validar",{'tipo':external,'referencia':'2026-11','campos':{k:k for k in ['mes_referencia','medida','valor','unidade','recorte']}})
        external_batch=admin.call('POST',f"/secretaria/importacoes/previas/{preview['id']}/confirmar",{'somenteValidas':False})
        assert len(admin.call('GET',f"/secretaria/importacoes/{external_batch['id']}/linhas"))==1
        assert download(admin,f'/secretaria/relatorios/exportar?tipo={external}&formato=csv').startswith(b'\xef\xbb\xbf')
    assert len(admin.call('GET','/secretaria/analises/resumo')['externas'])==4
    indicator=admin.call('POST' ,'/secretaria/indicadores',{'nome':'Indicador teste','unidade':'pessoas','metodologia':'Contagem sintética para teste','ods':[8,11]},expected=201)
    admin.call('POST',f"/secretaria/indicadores/{indicator['id']}/observacoes",{'referencia':'2026-11','valor':0,'fonte':'Teste sintético'},expected=201)
    sustainability=admin.call('GET','/secretaria/analises/sustentabilidade')
    assert any(i['id']==indicator['id'] and i['valor']==0 for i in sustainability)
    records=admin.call('GET','/secretaria/analises/mapa');assert any(r['id']==inventory['id'] and float(r['latitude'])==-20.75 for r in records)
    login=uuid.uuid4().hex
    user=admin.call('POST','/secretaria/usuarios',{'nome':'Secretaria teste','identificador':login,'senha':'temporary-test-password','perfil':'SECRETARIA'},expected=201)
    second=Client();second.login(login,'temporary-test-password')
    admin.call('PUT',f"/secretaria/usuarios/{user['id']}/senha",{'novaSenha':'new-test-password-123'})
    second.call('GET','/me',expected=401)
    second.login(login,'new-test-password-123')
    admin.call('PUT',f"/secretaria/usuarios/{user['id']}/estado",{'ativo':False})
    second.call('GET','/me',expected=401)
    admin.call('PUT',f"/secretaria/usuarios/{user['id']}/estado",{'ativo':True})
    second.login(login,'new-test-password-123')
    second.call('PUT','/me/senha',{'senhaAtual':'incorreta','novaSenha':'another-test-password'},expected=400)
    second.call('PUT','/me/senha',{'senhaAtual':'new-test-password-123','novaSenha':'another-test-password'})
    second.call('GET','/me',expected=401)
    second.login(login,'another-test-password')
    assert admin.call('GET','/secretaria/auditoria')
    quality(admin)
    print('OK: QUAL-01 (nomes padronizados e duplicidades no PostgreSQL real), atualização do inventário, filtros, CSV/XLSX, validação, confirmação, duplicidade, origem analítica, CSV/XLSX/PDF, indicadores/ODS, mapa, usuários, senhas, sessões e auditoria.')
def quality(admin):
    """QUAL-01 no PostgreSQL real: a chave SQL precisa concordar com a chave Java."""
    tag=uuid.uuid4().hex[:8]
    segment=next(s['id'] for s in admin.call('GET','/secretaria/inventario/segmentos') if s['codigo']=='hospedagem')
    first=admin.call('POST','/secretaria/inventario/registros',{'nome':f'  Pousada   São João {tag} ','endereco':' Rua  das Flores ','tipoCadastro':'estabelecimento'},expected=201)
    assert first['nome']==f'Pousada São João {tag}' and first['endereco']=='Rua das Flores',first
    admin.call('PUT',f"/secretaria/inventario/registros/{first['id']}/segmentos/{segment}")
    admin.call('PUT',f"/secretaria/inventario/registros/{first['id']}/segmentos/{segment}")  # revincular o mesmo cadastro é permitido
    second=admin.call('POST','/secretaria/inventario/registros',{'nome':f'POUSADA SAO JOAO {tag.upper()}','tipoCadastro':'estabelecimento'},expected=201)
    admin.call('PUT',f"/secretaria/inventario/registros/{second['id']}/segmentos/{segment}",expected=409)
    other=admin.call('POST','/secretaria/inventario/registros',{'nome':f'Hotel Outro {tag}','tipoCadastro':'estabelecimento'},expected=201)
    admin.call('PUT',f"/secretaria/inventario/registros/{other['id']}/segmentos/{segment}")
    admin.call('PUT',f"/secretaria/inventario/registros/{other['id']}",{'nome':f'pousada são joão {tag}','tipoCadastro':'estabelecimento'},expected=409)
    csv=f'nome;segmento\nPOUSADA SÃO  JOÃO {tag};Hospedagem\nHotel Novo {tag};HOSPEDAGEM\nhotel novo {tag};hospedagem\n'.encode()
    stage=upload(admin,'inventario-qualidade.csv',csv)
    result=admin.call('POST',f"/secretaria/importacoes/previas/{stage['id']}/validar",{'tipo':'inventario','referencia':'QUAL-01','campos':{'nome':'nome','segmento':'segmento'}})
    assert [r['valida'] for r in result['linhas']]==[False,True,False],result
    assert f"cadastro {first['id']}" in result['linhas'][0]['erro'] and result['linhas'][2]['erro']=='Linha duplicada no arquivo',result
    header='mes_referencia;estabelecimento_id;ocupacao_percentual;tipo_dado\n'
    stage=upload(admin,'ocupacao-a.csv',f"{header}2099-03;{first['id']};70;consolidado\n".encode())
    admin.call('POST',f"/secretaria/importacoes/previas/{stage['id']}/validar",{'tipo':'ocupacao','referencia':'QUAL-01','campos':{k:k for k in ['mes_referencia','estabelecimento_id','ocupacao_percentual','tipo_dado']}})
    batch=admin.call('POST',f"/secretaria/importacoes/previas/{stage['id']}/confirmar",{'somenteValidas':False})
    again=upload(admin,'ocupacao-b.csv',f"{header}2099-03;{first['id']};72;CONSOLIDADO\n2099-03;{first['id']};40;expectativa\n".encode())
    result=admin.call('POST',f"/secretaria/importacoes/previas/{again['id']}/validar",{'tipo':'ocupacao','referencia':'QUAL-01','campos':{k:k for k in ['mes_referencia','estabelecimento_id','ocupacao_percentual','tipo_dado']}})
    assert [r['valida'] for r in result['linhas']]==[False,True],result
    assert f"lote {batch['id']}" in result['linhas'][0]['erro'],result
if __name__=='__main__':main()
