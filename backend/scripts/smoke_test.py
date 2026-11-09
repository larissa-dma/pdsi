"""Teste de integração opcional (Python padrão). Cria dados; use banco descartável."""
import os, json, urllib.request, urllib.error, urllib.parse, http.cookiejar, uuid
from datetime import date, timedelta
BASE = os.environ.get('OTO_TEST_URL', 'http://localhost:18089/api')
class Client:
    def __init__(self):
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
        self.token = None
    def call(self, method, path, payload=None, form=False, expected=200, csrf=True):
        headers = {}
        body = None
        if payload is not None:
            body = (urllib.parse.urlencode(payload) if form else json.dumps(payload)).encode()
            headers['Content-Type'] = 'application/x-www-form-urlencoded' if form else 'application/json'
        if self.token and csrf and method != 'GET':
            headers[self.token['headerName']] = self.token['token']
        req = urllib.request.Request(BASE + path, data=body, headers=headers, method=method)
        try:
            with self.opener.open(req) as response:
                status, raw = response.status, response.read()
        except urllib.error.HTTPError as response:
            status, raw = response.code, response.read()
        assert status == expected, (method, path, status, expected, raw[:500])
        return json.loads(raw) if raw else None
    def login(self, identifier, password):
        self.token = self.call('GET', '/csrf')
        self.call('POST', '/login', {'identificador': identifier, 'password': password}, form=True, expected=204)
        self.token = self.call('GET', '/csrf')

if __name__ == '__main__':
    anonymous = Client()
    anonymous.call('GET', '/me', expected=401)
    admin = Client()
    admin.login(os.environ['OTO_TEST_ADMIN'], os.environ['OTO_TEST_PASSWORD'])
    segments = admin.call('GET', '/secretaria/inventario/segmentos')
    assert len(segments) == 9
    segment = next(s['id'] for s in segments if s['codigo'] == 'hospedagem')
    clients = []
    catalog = admin.call('GET', f'/secretaria/inventario/campos?segmentoId={segment}')
    integer_field = next(c['id'] for c in catalog if c['tipo_logico'] == 'inteiro')
    for index in range(2):
        record = admin.call('POST', '/secretaria/inventario/registros', {'nome': 'Teste ' + uuid.uuid4().hex, 'tipoCadastro': 'estabelecimento'}, expected=201)
        link = admin.call('PUT', f"/secretaria/inventario/registros/{record['id']}/segmentos/{segment}")
        value_path = f"/secretaria/inventario/vinculos/{link['id']}/respostas/{integer_field}"
        admin.call('PUT', value_path, {'valorInteiro': 20})
        values = admin.call('GET', f"/secretaria/inventario/registros/{record['id']}/respostas")
        assert next(v for v in values if v['campo_id'] == integer_field)['valor_inteiro'] == 20
        admin.call('PUT', value_path, {'valorTexto': 'tipo incorreto'}, expected=400)
        identifier = uuid.uuid4().hex
        admin.call('POST', '/secretaria/usuarios', {'nome': 'Teste', 'identificador': identifier, 'senha': 'temporary-test-password', 'perfil': 'HOSPEDAGEM', 'estabelecimentoId': record['id']}, expected=201)
        client = Client()
        client.login(identifier, 'temporary-test-password')
        client.call('GET', '/secretaria/painel', expected=403)
        clients.append(client)
    form = admin.call('POST', '/secretaria/formularios', {'titulo': 'Teste automático', 'referencia': 'teste', 'prazo': str(date.today()+timedelta(days=2)), 'perguntas': [{'chave': 'ocupacao', 'titulo': 'Ocupação', 'tipo': 'percentual', 'obrigatoria': True}]}, expected=201)
    path = f"/formularios/{form['id']}"
    first, second = clients
    first.call('PUT', path+'/resposta', {'respostas': {}}, csrf=False, expected=403)
    first.call('PUT', path+'/resposta', {'respostas': {}})
    first.call('POST', path+'/enviar', expected=400)
    first.call('PUT', path+'/resposta', {'respostas': {'ocupacao': 101}}, expected=400)
    first.call('PUT', path+'/resposta', {'respostas': {'ocupacao': 0}})
    second.call('PUT', path+'/resposta', {'respostas': {'ocupacao': 75}})
    assert first.call('GET', path)['minhaResposta'][0]['respostas']['ocupacao'] == 0
    assert second.call('GET', path)['minhaResposta'][0]['respostas']['ocupacao'] == 75
    first.call('POST', path+'/enviar')
    first.call('PUT', path+'/resposta', {'respostas': {'ocupacao': 50}}, expected=409)
    first.call('POST', path+'/enviar', expected=409)
    submitted = admin.call('GET', f"/secretaria/formularios/{form['id']}/respostas")
    assert len(submitted) == 2
    first.call('POST', '/logout', expected=204)
    first.call('GET', '/me', expected=401)
    print('OK: login, CSRF, perfis, catálogo, formulários, isolamento e bloqueio após envio.')
