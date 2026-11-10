import { api } from './client';
import type { Usuario } from './client';

export interface Painel {
  registros_inventario: number;
  formularios: number;
  respostas_enviadas: number;
  importacoes: number;
}

export interface Formulario {
  id: number;
  titulo: string;
  referencia: string;
  prazo: string;
  /** 'pendente' = disponível, 'rascunho' = em andamento, 'enviado' = enviado */
  status?: 'pendente' | 'rascunho' | 'enviado';
}

export interface RegistroInventario {
  id: number;
  nome: string;
  descricao: string | null;
  endereco: string | null;
  bairro: string | null;
  latitude: number | null;
  longitude: number | null;
  categoria_id: number | null;
  situacao_conferencia: 'pendente' | 'parcial' | 'conferido' | 'rejeitado';
}

export const auth = {
  me: () => api.get<Usuario>('/me'),
};

export const secretaria = {
  painel: () => api.get<Painel>('/secretaria/painel'),
  formularios: () => api.get<Formulario[]>('/secretaria/formularios'),
  registros: (busca?: string, pagina = 0) =>
    api.get<RegistroInventario[]>(`/secretaria/inventario/registros?busca=${busca ?? ''}&pagina=${pagina}`),
};

export const hospedagem = {
  formularios: () => api.get<Formulario[]>('/formularios'),
};
