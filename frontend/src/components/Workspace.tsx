import { useEffect, useState } from "react";
import type { ReactNode } from "react";
export type Row = Record<string, any>;
export function useData<T>(
  loader: () => Promise<T>,
  dependencies: unknown[] = [],
) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setData(null);
    setError("");
    loader()
      .then((v) => {
        if (current) setData(v);
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [...dependencies, revision]);
  return {
    data,
    error,
    loading,
    reload: () => setRevision((v) => v + 1),
    setData,
  };
}
export function Page({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="workspace">
      <header className="page-heading">
        <div>
          <p className="eyebrow">OBSERVATÓRIO DE TURISMO DE OLÍMPIA</p>
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
        <div className="actions">{actions}</div>
      </header>
      {children}
    </div>
  );
}
export function Card({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <section className="work-card">
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Message({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return error ? (
    <div role="alert" className="notice error">
      {error}
    </div>
  ) : success ? (
    <div role="status" className="notice success">
      {success}
    </div>
  ) : null;
}
export function State({
  loading,
  error,
  empty,
}: {
  loading?: boolean;
  error?: string;
  empty?: boolean;
}) {
  return loading ? (
    <p role="status">Carregando dados…</p>
  ) : error ? (
    <Message error={error} />
  ) : empty ? (
    <p className="empty">Nenhum dado disponível para este recorte.</p>
  ) : null;
}
export function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
export function Table({
  rows,
  columns,
}: {
  rows: Row[];
  columns: { key: string; label: string; render?: (row: Row) => ReactNode }[];
}) {
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!rows.length ? (
            <tr>
              <td colSpan={columns.length} className="empty">
                Nenhum registro encontrado.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={row.id ?? i}>
                {columns.map((c) => (
                  <td key={c.key}>
                    {c.render ? c.render(row) : display(row[c.key])}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="work-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Pagination({
  page,
  setPage,
  more,
}: {
  page: number;
  setPage: (v: number) => void;
  more: boolean;
}) {
  return (
    <div className="actions pagination">
      <button
        className="button secondary"
        disabled={page === 0}
        onClick={() => setPage(page - 1)}
      >
        Anterior
      </button>
      <span>Página {page + 1}</span>
      <button
        className="button secondary"
        disabled={!more}
        onClick={() => setPage(page + 1)}
      >
        Próxima
      </button>
    </div>
  );
}
export function today() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}
export function Period({
  inicio,
  fim,
  setInicio,
  setFim,
}: {
  inicio: string;
  fim: string;
  setInicio: (v: string) => void;
  setFim: (v: string) => void;
}) {
  return (
    <div className="actions">
      <Field label="De">
        <input
          type="date"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
      </Field>
      <Field label="Até">
        <input
          type="date"
          value={fim}
          onChange={(e) => setFim(e.target.value)}
        />
      </Field>
    </div>
  );
}
export function periodQuery(inicio: string, fim: string) {
  const p = new URLSearchParams();
  if (inicio) p.set("inicio", inicio);
  if (fim) p.set("fim", fim);
  return p;
}
