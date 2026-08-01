"use client";

import { FormEvent, useEffect, useState } from "react";

type User = { id: string; email: string };
type Step = "email" | "otp";
const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

const api = async <T,>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Ocurrio un error");
  return body;
};

export default function Home() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [visibleOtp, setVisibleOtp] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ user: User }>("/api/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => undefined)
      .finally(() => setCheckingSession(false));
  }, []);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<{ otp: string; expiresAt: string }>("/api/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setVisibleOtp(result.otp);
      setOtp(result.otp);
      setExpiresAt(result.expiresAt);
      setStep("otp");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos generar el codigo");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api<{ user: User }>("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      });
      setUser(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos verificar el codigo");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
    setStep("email");
    setOtp("");
    setVisibleOtp("");
    setLoading(false);
  };

  if (checkingSession) {
    return <main className="grid min-h-screen place-items-center text-sm text-slate-500">Cargando sesion...</main>;
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f5f7f4] px-5 py-8 text-slate-950 sm:px-8">
      <div className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-emerald-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-sky-200/50 blur-3xl" />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3 font-semibold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-slate-950 text-white">S</span>
          Shippear Juridico
        </div>
        <span className="rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-xs text-slate-600 shadow-sm backdrop-blur">Acceso seguro</span>
      </nav>

      <section className="relative mx-auto grid min-h-[calc(100vh-104px)] max-w-6xl items-center gap-12 py-12 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Plataforma legal</p>
          <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">Tu operacion juridica, simple y ordenada.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">Una base lista para construir expedientes, clientes y flujos de trabajo. Ingresa sin contrasena usando un codigo temporal.</p>
          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
            <span>✓ OTP de un solo uso</span><span>✓ Sesion protegida</span><span>✓ PostgreSQL</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_-24px_rgba(15,23,42,.22)] backdrop-blur-xl sm:p-9">
          {user ? (
            <div>
              <span className="grid size-14 place-items-center rounded-2xl bg-emerald-100 text-xl font-semibold text-emerald-800">{user.email.slice(0, 1).toUpperCase()}</span>
              <h2 className="mt-8 text-2xl font-semibold tracking-tight">Sesion iniciada</h2>
              <p className="mt-2 text-slate-600">Ya puedes acceder a la plataforma.</p>
              <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Usuario</p>
                <p className="mt-1 break-all font-medium">{user.email}</p>
              </div>
              <button className="button-secondary mt-6" disabled={loading} onClick={logout}>Cerrar sesion</button>
            </div>
          ) : step === "email" ? (
            <form onSubmit={requestCode}>
              <p className="text-sm font-medium text-emerald-700">Bienvenido</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">Ingresa a tu cuenta</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Te mostraremos un codigo temporal para continuar.</p>
              <label className="label" htmlFor="email">Correo electronico</label>
              <input className="input" id="email" type="email" placeholder="nombre@empresa.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
              {error && <p className="error">{error}</p>}
              <button className="button-primary" disabled={loading}>{loading ? "Generando..." : "Continuar"}</button>
            </form>
          ) : (
            <form onSubmit={verifyCode}>
              <button type="button" className="text-sm text-slate-500 hover:text-slate-900" onClick={() => setStep("email")}>← Cambiar correo</button>
              <h2 className="mt-6 text-3xl font-semibold tracking-tight">Confirma tu codigo</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">Codigo generado para <strong>{email}</strong>.</p>
              <div className="mt-6 rounded-2xl border border-dashed border-emerald-300 bg-emerald-50 p-5 text-center">
                <p className="text-xs font-semibold uppercase tracking-[.16em] text-emerald-700">OTP de desarrollo</p>
                <button type="button" className="mt-2 font-mono text-4xl font-semibold tracking-[.2em] text-emerald-950" onClick={() => setOtp(visibleOtp)} title="Usar este codigo">{visibleOtp}</button>
                <p className="mt-2 text-xs text-emerald-700">Vence a las {new Date(expiresAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <label className="label" htmlFor="otp">Codigo de 6 digitos</label>
              <input className="input text-center font-mono text-xl tracking-[.35em]" id="otp" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} required autoFocus />
              {error && <p className="error">{error}</p>}
              <button className="button-primary" disabled={loading || otp.length !== 6}>{loading ? "Verificando..." : "Ingresar"}</button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
