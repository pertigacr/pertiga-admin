import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

import { useState, useEffect, useRef } from "react";

// ── PALETTE (from Pértiga brand guidelines) ──────────────────────────────────
const C = {
  tinta:   "#1A1714",
  dorado:  "#C8A96E",
  musgo:   "#3D5A52",
  crema:   "#F5F0E8",
  piedra:  "#8A8278",
  blanco:  "#FDFCFA",
  rojo:    "#C0392B",
  verde:   "#27AE60",
  azul:    "#2980B9",
};

// ── INITIAL DATA ─────────────────────────────────────────────────────────────
const INIT_PROJECTS = [
  { id: 1, nombre: "TV Wall residencial – Los Yoses", cliente: "Andrea Mora", tipo: "Residencial", estado: "En fabricación", monto: 850000, adelanto: 425000, inicio: "2026-06-01", entrega: "2026-06-20", notas: "TVW 001 en laminado blanco mate" },
  { id: 2, nombre: "Mobiliario tienda Ropa · San Pedro", cliente: "Boutique Lena", tipo: "Comercial", estado: "Cotización", monto: 1200000, adelanto: 0, inicio: "2026-06-10", entrega: "2026-07-05", notas: "Mostrador + percheros + caja" },
  { id: 3, nombre: "Cocina a medida – Escazú", cliente: "Ricardo Salas", tipo: "Residencial", estado: "Diseño", monto: 1800000, adelanto: 900000, inicio: "2026-05-20", entrega: "2026-06-28", notas: "Madera de teca con tinte oscuro" },
];
const INIT_GASTOS = [
  { id: 1, fecha: "2026-06-01", desc: "Madera teca – proyecto cocina", categoria: "Materiales", monto: 210000, proyecto: "Cocina a medida – Escazú" },
  { id: 2, fecha: "2026-06-03", desc: "Laminado blanco mate – TV wall", categoria: "Materiales", monto: 95000, proyecto: "TV Wall residencial – Los Yoses" },
  { id: 3, fecha: "2026-06-05", desc: "Mantenimiento CNC", categoria: "Maquinaria", monto: 120000, proyecto: "" },
  { id: 4, fecha: "2026-06-10", desc: "Instagram Ads junio", categoria: "Marketing", monto: 25000, proyecto: "" },
];
const INIT_INGRESOS = [
  { id: 1, fecha: "2026-06-01", desc: "Adelanto cocina Escazú", monto: 900000, proyecto: "Cocina a medida – Escazú" },
  { id: 2, fecha: "2026-05-28", desc: "Saldo final closet Santa Ana", monto: 680000, proyecto: "Closet – Santa Ana" },
];
const INIT_PROVEEDORES = [
  { id: 1, nombre: "Maderas Tropicales CR", contacto: "Luis Jiménez", tel: "8888-1234", email: "ventas@maderastropicales.cr", materiales: "Maderas naturales, teca, laurel", condicion: "30 días", notas: "Proveedor principal madera maciza" },
  { id: 2, nombre: "Masisa Costa Rica", contacto: "Karla Rojas", tel: "2222-5678", email: "krojoas@masisa.com", materiales: "MDF, tablero melamínico, laminado", condicion: "Contado", notas: "Mejor precio en pedidos >10 tableros" },
  { id: 3, nombre: "Herrajes e Importaciones SA", contacto: "Mauricio Vega", tel: "6666-9012", email: "mvega@herrajes.cr", materiales: "Bisagras, rieles, manillas, tornillería", condicion: "Contado", notas: "" },
];
const INIT_OC = [
  { id: 1, fecha: "2026-06-08", proveedor: "Maderas Tropicales CR", items: "8 tablas teca 2m x 0.3m", monto: 210000, estado: "Recibida", proyecto: "Cocina a medida – Escazú" },
  { id: 2, fecha: "2026-06-09", proveedor: "Masisa Costa Rica", items: "4 tableros MDF 18mm + 2 laminado blanco", monto: 112000, estado: "Pendiente", proyecto: "TV Wall residencial – Los Yoses" },
];
const INIT_RECORDATORIOS = [
  { id: 1, texto: "Entregar TV Wall Los Yoses", fecha: "2026-06-20", tipo: "Entrega", hecho: false },
  { id: 2, texto: "Cotización Boutique Lena – enviar propuesta formal", fecha: "2026-06-17", tipo: "Ventas", hecho: false },
  { id: 3, texto: "Revisar lijadora calibradora", fecha: "2026-06-18", tipo: "Maquinaria", hecho: false },
  { id: 4, texto: "Pagar factura Masisa", fecha: "2026-06-19", tipo: "Pago", hecho: false },
];

// ── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => `₡${Number(n).toLocaleString("es-CR")}`;
const fmtDate = (d) => { if (!d) return ""; const [y,m,dd] = d.split("-"); return `${dd}/${m}/${y}`; };
const today = "2026-06-15";
const daysLeft = (d) => { const diff = (new Date(d) - new Date(today)) / 86400000; return Math.round(diff); };

const ESTADOS = ["Cotización","Diseño","En fabricación","Instalación","Entregado","Cancelado"];
const TIPOS_GASTO = ["Materiales","Maquinaria","Marketing","Operativo","Personal","Otro"];
const TIPOS_REC = ["Entrega","Ventas","Maquinaria","Pago","Reunión","Otro"];

// ── BADGE ─────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  const colors = {
    "En fabricación": { bg: "#EAF4F0", text: C.musgo },
    "Diseño":         { bg: "#FEF9EC", text: "#B8860B" },
    "Cotización":     { bg: "#EAF2FB", text: C.azul },
    "Instalación":    { bg: "#F0EAF8", text: "#7D3C98" },
    "Entregado":      { bg: "#EAFAF1", text: C.verde },
    "Cancelado":      { bg: "#FDECEA", text: C.rojo },
    "Recibida":       { bg: "#EAFAF1", text: C.verde },
    "Pendiente":      { bg: "#FEF9EC", text: "#B8860B" },
  };
  const s = colors[label] || { bg: "#F0F0F0", text: C.piedra };
  return (
    <span style={{ background: s.bg, color: s.text, borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 600, letterSpacing: 0.3 }}>
      {label}
    </span>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,23,20,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: C.blanco, borderRadius: 12, width: "100%", maxWidth: 520, maxHeight: "85vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px 14px", borderBottom: `1px solid ${C.crema}` }}>
          <span style={{ fontFamily: "'Georgia', serif", fontSize: 17, fontWeight: 600, color: C.tinta }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: C.piedra }}>×</button>
        </div>
        <div style={{ padding: "20px 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ── INPUT ─────────────────────────────────────────────────────────────────────
const Inp = ({ label, ...p }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 600, color: C.piedra, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>}
    <input {...p} style={{ width: "100%", border: `1.5px solid #E2DDD6`, borderRadius: 6, padding: "8px 10px", fontSize: 13, color: C.tinta, background: C.blanco, outline: "none", boxSizing: "border-box", ...p.style }} />
  </div>
);
const Sel = ({ label, children, ...p }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 600, color: C.piedra, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>}
    <select {...p} style={{ width: "100%", border: `1.5px solid #E2DDD6`, borderRadius: 6, padding: "8px 10px", fontSize: 13, color: C.tinta, background: C.blanco, outline: "none", boxSizing: "border-box" }}>
      {children}
    </select>
  </div>
);
const Txt = ({ label, ...p }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <div style={{ fontSize: 11, fontWeight: 600, color: C.piedra, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>}
    <textarea {...p} style={{ width: "100%", border: `1.5px solid #E2DDD6`, borderRadius: 6, padding: "8px 10px", fontSize: 13, color: C.tinta, background: C.blanco, outline: "none", boxSizing: "border-box", resize: "vertical", minHeight: 70 }} />
  </div>
);
const Btn = ({ children, variant = "primary", ...p }) => {
  const styles = {
    primary: { background: C.tinta, color: C.dorado, border: "none" },
    ghost:   { background: "transparent", color: C.tinta, border: `1.5px solid #D0C9C0` },
    danger:  { background: "#FDECEA", color: C.rojo, border: "none" },
    accent:  { background: C.dorado, color: C.tinta, border: "none" },
  };
  return (
    <button {...p} style={{ ...styles[variant], borderRadius: 7, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", ...p.style }}>
      {children}
    </button>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function Dashboard({ projects, ingresos, gastos, recordatorios, setTab }) {
  const totalIngresos = ingresos.reduce((s, i) => s + Number(i.monto), 0);
  const totalGastos   = gastos.reduce((s, g) => s + Number(g.monto), 0);
  const pendientesCobrar = projects.reduce((s, p) => {
    if (p.estado !== "Entregado" && p.estado !== "Cancelado") return s + (Number(p.monto) - Number(p.adelanto));
    return s;
  }, 0);
  const activos = projects.filter(p => !["Entregado","Cancelado"].includes(p.estado));
  const urgentes = recordatorios.filter(r => !r.hecho && daysLeft(r.fecha) <= 5).sort((a,b) => new Date(a.fecha)-new Date(b.fecha));
  const proxEntregas = projects.filter(p => !["Entregado","Cancelado"].includes(p.estado)).sort((a,b) => new Date(a.entrega)-new Date(b.entrega)).slice(0,3);

  const KPI = ({ label, value, sub, color }) => (
    <div style={{ background: C.blanco, border: `1px solid #E8E2D8`, borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: C.piedra, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || C.tinta, fontFamily: "'Georgia',serif" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: C.piedra, marginTop: 3 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: "'Georgia',serif", fontSize: 26, fontWeight: 700, color: C.tinta }}>Buenos días, Javier</div>
        <div style={{ color: C.piedra, fontSize: 13, marginTop: 2 }}>Lunes 15 de junio, 2026 · Pértiga Mobiliario</div>
      </div>

      {/* KPIs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <KPI label="Ingresos del mes" value={fmt(totalIngresos)} sub="Junio 2026" color={C.musgo} />
        <KPI label="Gastos del mes" value={fmt(totalGastos)} sub="Junio 2026" color={C.rojo} />
        <KPI label="Margen neto" value={fmt(totalIngresos - totalGastos)} sub={`${Math.round((totalIngresos - totalGastos)/totalIngresos*100)}% del ingreso`} color={C.dorado} />
        <KPI label="Por cobrar" value={fmt(pendientesCobrar)} sub={`${activos.length} proyectos activos`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Urgentes */}
        <div style={{ background: C.blanco, border: `1px solid #E8E2D8`, borderRadius: 10, padding: 18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: C.tinta, fontSize: 13 }}>⚡ Urgente esta semana</span>
            <span onClick={() => setTab("recordatorios")} style={{ fontSize: 11, color: C.dorado, cursor: "pointer", fontWeight: 600 }}>Ver todos →</span>
          </div>
          {urgentes.length === 0 && <div style={{ color: C.piedra, fontSize: 12 }}>Sin pendientes urgentes 🎉</div>}
          {urgentes.map(r => (
            <div key={r.id} style={{ display:"flex", alignItems:"center", gap: 8, padding: "7px 0", borderBottom: `1px solid ${C.crema}` }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: daysLeft(r.fecha) < 0 ? C.rojo : daysLeft(r.fecha) <= 2 ? "#E67E22" : C.dorado, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.tinta }}>{r.texto}</div>
                <div style={{ fontSize: 11, color: C.piedra }}>{fmtDate(r.fecha)} · {daysLeft(r.fecha) < 0 ? `${Math.abs(daysLeft(r.fecha))} días vencido` : daysLeft(r.fecha) === 0 ? "Hoy" : `En ${daysLeft(r.fecha)} días`}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Próximas entregas */}
        <div style={{ background: C.blanco, border: `1px solid #E8E2D8`, borderRadius: 10, padding: 18 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 12 }}>
            <span style={{ fontWeight: 700, color: C.tinta, fontSize: 13 }}>📦 Próximas entregas</span>
            <span onClick={() => setTab("proyectos")} style={{ fontSize: 11, color: C.dorado, cursor: "pointer", fontWeight: 600 }}>Ver todos →</span>
          </div>
          {proxEntregas.map(p => {
            const d = daysLeft(p.entrega);
            return (
              <div key={p.id} style={{ padding: "8px 0", borderBottom: `1px solid ${C.crema}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.tinta }}>{p.nombre}</div>
                  <Badge label={p.estado} />
                </div>
                <div style={{ fontSize: 11, color: d < 0 ? C.rojo : d <= 3 ? "#E67E22" : C.piedra, marginTop: 2 }}>
                  {fmtDate(p.entrega)} · {d < 0 ? `${Math.abs(d)} días de retraso` : d === 0 ? "Hoy" : `En ${d} días`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meta facturación */}
      <div style={{ background: C.tinta, borderRadius: 10, padding: "18px 22px", marginTop: 16, display:"flex", alignItems:"center", gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ color: C.dorado, fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform:"uppercase", marginBottom: 4 }}>Meta mensual · Junio 2026</div>
          <div style={{ color: C.crema, fontSize: 13, marginBottom: 8 }}>₡2,500,000 meta · {fmt(totalIngresos)} facturado</div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ background: C.dorado, width: `${Math.min(100, Math.round(totalIngresos/2500000*100))}%`, height: "100%", borderRadius: 4, transition: "width 0.8s" }} />
          </div>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize: 28, fontWeight: 700, color: C.dorado }}>{Math.round(totalIngresos/2500000*100)}%</div>
          <div style={{ color: C.piedra, fontSize: 11 }}>completado</div>
        </div>
      </div>
    </div>
  );
}

// ── PROYECTOS ─────────────────────────────────────────────────────────────────
function Proyectos({ projects, setProjects }) {
  const [modal, setModal] = useState(null); // null | "new" | project
  const [filtro, setFiltro] = useState("Todos");
  const empty = { nombre:"", cliente:"", tipo:"Residencial", estado:"Cotización", monto:"", adelanto:"", inicio:"", entrega:"", notas:"" };
  const [form, setForm] = useState(empty);

  const filtrados = filtro === "Todos" ? projects : projects.filter(p => p.tipo === filtro || p.estado === filtro);

  const save = async () => {
    if (!form.nombre || !form.cliente) return;
    const data = { ...form, monto: Number(form.monto), adelanto: Number(form.adelanto) };
    delete data.id;
    if (form.id) {
      await supabase.from("proyectos").update(data).eq("id", form.id);
      setProjects(projects.map(p => p.id === form.id ? { ...data, id: form.id } : p));
    } else {
      const { data: newP } = await supabase.from("proyectos").insert(data).select().single();
      setProjects([...projects, newP]);
    }
    setModal(null); setForm(empty);
  };

  const del = async (id) => { 
    if (confirm("¿Eliminar proyecto?")) { 
      await supabase.from("proyectos").delete().eq("id", id);
      setProjects(projects.filter(p => p.id !== id)); 
    }
    setModal(null); 
  };

  const openEdit = (p) => { setForm({ ...p }); setModal("edit"); };

  const saldo = (p) => Number(p.monto) - Number(p.adelanto);
  const pct = (p) => Number(p.monto) > 0 ? Math.round(Number(p.adelanto)/Number(p.monto)*100) : 0;

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize: 20, fontWeight: 700, color: C.tinta }}>Proyectos</div>
        <Btn onClick={() => { setForm(empty); setModal("new"); }}>+ Nuevo proyecto</Btn>
      </div>

      {/* Filtros */}
      <div style={{ display:"flex", gap: 8, marginBottom: 16, flexWrap:"wrap" }}>
        {["Todos","Residencial","Comercial","En fabricación","Cotización","Entregado"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding:"5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor:"pointer", border: `1.5px solid ${filtro===f ? C.tinta : "#D0C9C0"}`, background: filtro===f ? C.tinta : "transparent", color: filtro===f ? C.crema : C.piedra }}>
            {f}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ background: C.blanco, border:`1px solid #E8E2D8`, borderRadius: 10, overflow:"hidden" }}>
        {filtrados.length === 0 && <div style={{ padding: 32, textAlign:"center", color: C.piedra, fontSize: 13 }}>No hay proyectos en este filtro</div>}
        {filtrados.map((p, i) => (
          <div key={p.id} onClick={() => openEdit(p)} style={{ padding:"14px 18px", borderBottom: i < filtrados.length-1 ? `1px solid ${C.crema}` : "none", cursor:"pointer", display:"grid", gridTemplateColumns:"1fr auto", gap: 12, alignItems:"center" }}
            onMouseEnter={e => e.currentTarget.style.background = C.crema}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <div>
              <div style={{ display:"flex", alignItems:"center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: C.tinta }}>{p.nombre}</span>
                <Badge label={p.estado} />
                <span style={{ fontSize: 11, color: C.piedra }}>{p.tipo}</span>
              </div>
              <div style={{ fontSize: 12, color: C.piedra }}>
                {p.cliente} · Entrega: {fmtDate(p.entrega)}
                {!["Entregado","Cancelado"].includes(p.estado) && (() => { const d = daysLeft(p.entrega); return <span style={{ color: d < 0 ? C.rojo : d <= 3 ? "#E67E22" : C.piedra }}> · {d < 0 ? `${Math.abs(d)}d retraso` : d === 0 ? "Hoy" : `${d}d`}</span>; })()}
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontWeight: 700, color: C.tinta, fontSize: 14 }}>{fmt(p.monto)}</div>
              <div style={{ fontSize: 11, color: C.piedra }}>
                Saldo: <span style={{ color: saldo(p) > 0 ? C.musgo : C.piedra }}>{fmt(saldo(p))}</span>
              </div>
              <div style={{ marginTop: 4, background: "#E8E2D8", borderRadius: 3, height: 4, width: 80 }}>
                <div style={{ background: C.dorado, width: `${pct(p)}%`, height:"100%", borderRadius: 3 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen total */}
      <div style={{ display:"flex", gap: 12, marginTop: 12 }}>
        {[
          { l: "Total contratado", v: fmt(filtrados.reduce((s,p) => s+Number(p.monto),0)) },
          { l: "Cobrado", v: fmt(filtrados.reduce((s,p) => s+Number(p.adelanto),0)) },
          { l: "Por cobrar", v: fmt(filtrados.filter(p => !["Entregado","Cancelado"].includes(p.estado)).reduce((s,p) => s+(Number(p.monto)-Number(p.adelanto)),0)) },
        ].map(k => (
          <div key={k.l} style={{ background: C.blanco, border:`1px solid #E8E2D8`, borderRadius: 8, padding:"10px 14px", flex:1 }}>
            <div style={{ fontSize:10, color: C.piedra, textTransform:"uppercase", letterSpacing:0.4, fontWeight:600 }}>{k.l}</div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:18, fontWeight:700, color:C.tinta, marginTop:2 }}>{k.v}</div>
          </div>
        ))}
      </div>

      {(modal === "new" || modal === "edit") && (
        <Modal title={modal === "new" ? "Nuevo proyecto" : "Editar proyecto"} onClose={() => setModal(null)}>
          <Inp label="Nombre del proyecto" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="TV Wall residencial – Los Yoses" />
          <Inp label="Cliente" value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
            <Sel label="Tipo" value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})}>
              {["Residencial","Comercial","Colección"].map(t => <option key={t}>{t}</option>)}
            </Sel>
            <Sel label="Estado" value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
              {ESTADOS.map(s => <option key={s}>{s}</option>)}
            </Sel>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
            <Inp label="Monto total (₡)" type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} />
            <Inp label="Adelanto recibido (₡)" type="number" value={form.adelanto} onChange={e => setForm({...form, adelanto: e.target.value})} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }}>
            <Inp label="Inicio" type="date" value={form.inicio} onChange={e => setForm({...form, inicio: e.target.value})} />
            <Inp label="Entrega estimada" type="date" value={form.entrega} onChange={e => setForm({...form, entrega: e.target.value})} />
          </div>
          <Txt label="Notas" value={form.notas} onChange={e => setForm({...form, notas: e.target.value})} />
          <div style={{ display:"flex", gap: 10, justifyContent:"flex-end" }}>
            {modal === "edit" && <Btn variant="danger" onClick={() => del(form.id)}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── CONTABILIDAD ──────────────────────────────────────────────────────────────
function Contabilidad({ ingresos, setIngresos, gastos, setGastos, projects }) {
  const [tab, setTab] = useState("resumen");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [tipo, setTipo] = useState("gasto"); // para modal

  const totalI = ingresos.reduce((s,i) => s+Number(i.monto), 0);
  const totalG = gastos.reduce((s,g) => s+Number(g.monto), 0);
  const margen = totalI - totalG;
  const pctMargen = totalI > 0 ? Math.round(margen/totalI*100) : 0;

  // Gastos por categoría
  const porCat = TIPOS_GASTO.map(cat => ({
    cat, total: gastos.filter(g => g.categoria === cat).reduce((s,g) => s+Number(g.monto), 0)
  })).filter(c => c.total > 0).sort((a,b) => b.total - a.total);
  const maxCat = Math.max(...porCat.map(c => c.total), 1);

  const saveIngreso = async () => {
    if (!form.desc || !form.monto) return;
    const data = { fecha: form.fecha, descripcion: form.desc, monto: Number(form.monto), proyecto: form.proyecto };
    if (form.id) {
      await supabase.from("ingresos").update(data).eq("id", form.id);
      setIngresos(ingresos.map(i => i.id === form.id ? {...form, monto: Number(form.monto)} : i));
    } else {
      const { data: newI } = await supabase.from("ingresos").insert(data).select().single();
      setIngresos([...ingresos, {...newI, desc: newI.descripcion}]);
    }
    setModal(null);
  };
  const saveGasto = async () => {
    if (!form.desc || !form.monto) return;
    const data = { fecha: form.fecha, descripcion: form.desc, categoria: form.categoria, monto: Number(form.monto), proyecto: form.proyecto };
    if (form.id) {
      await supabase.from("gastos").update(data).eq("id", form.id);
      setGastos(gastos.map(g => g.id === form.id ? {...form, monto: Number(form.monto)} : g));
    } else {
      const { data: newG } = await supabase.from("gastos").insert(data).select().single();
      setGastos([...gastos, {...newG, desc: newG.descripcion}]);
    }
    setModal(null);
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{ padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background: tab===id ? C.tinta : "transparent", color: tab===id ? C.crema : C.piedra }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom: 16 }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize: 20, fontWeight: 700, color: C.tinta }}>Contabilidad</div>
        <div style={{ display:"flex", gap: 8 }}>
          <Btn variant="ghost" style={{ fontSize:12 }} onClick={() => { setTipo("ingreso"); setForm({ fecha: today, desc:"", monto:"", proyecto:"" }); setModal("new"); }}>+ Ingreso</Btn>
          <Btn style={{ fontSize:12 }} onClick={() => { setTipo("gasto"); setForm({ fecha: today, desc:"", categoria:"Materiales", monto:"", proyecto:"" }); setModal("new"); }}>+ Gasto</Btn>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
        {[
          { l:"Ingresos", v: fmt(totalI), c: C.musgo },
          { l:"Gastos", v: fmt(totalG), c: C.rojo },
          { l:`Margen ${pctMargen}%`, v: fmt(margen), c: margen >= 0 ? C.dorado : C.rojo },
        ].map(k => (
          <div key={k.l} style={{ background: C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ fontSize:10, color: C.piedra, textTransform:"uppercase", letterSpacing:0.4, fontWeight:600, marginBottom:4 }}>{k.l}</div>
            <div style={{ fontFamily:"'Georgia',serif", fontSize:22, fontWeight:700, color:k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", gap: 8, marginBottom: 14, background:"#F0EAE0", borderRadius:8, padding:4 }}>
        <TabBtn id="resumen" label="Resumen" />
        <TabBtn id="ingresos" label={`Ingresos (${ingresos.length})`} />
        <TabBtn id="gastos" label={`Gastos (${gastos.length})`} />
      </div>

      {tab === "resumen" && (
        <div style={{ background: C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:13, color:C.tinta, marginBottom:14 }}>Gastos por categoría</div>
          {porCat.map(c => (
            <div key={c.cat} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                <span style={{ fontSize:12, color:C.tinta, fontWeight:600 }}>{c.cat}</span>
                <span style={{ fontSize:12, color:C.piedra }}>{fmt(c.total)}</span>
              </div>
              <div style={{ background:"#E8E2D8", borderRadius:3, height:6 }}>
                <div style={{ background: C.dorado, width:`${Math.round(c.total/maxCat*100)}%`, height:"100%", borderRadius:3 }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop:18, paddingTop:14, borderTop:`1px solid ${C.crema}` }}>
            <div style={{ fontWeight:700, fontSize:13, color:C.tinta, marginBottom:10 }}>Meta mensual (Junio 2026)</div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.piedra, marginBottom:4 }}>
              <span>₡2,500,000 meta</span><span>{fmt(totalI)} facturado</span>
            </div>
            <div style={{ background:"#E8E2D8", borderRadius:4, height:10 }}>
              <div style={{ background: C.musgo, width:`${Math.min(100,Math.round(totalI/2500000*100))}%`, height:"100%", borderRadius:4 }} />
            </div>
            <div style={{ fontSize:11, color:C.piedra, marginTop:4 }}>
              Faltan {fmt(Math.max(0, 2500000-totalI))} para la meta
            </div>
          </div>
        </div>
      )}

      {tab === "ingresos" && (
        <div style={{ background: C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, overflow:"hidden" }}>
          {ingresos.sort((a,b) => new Date(b.fecha)-new Date(a.fecha)).map((ing, i) => (
            <div key={ing.id} onClick={() => { setTipo("ingreso"); setForm({...ing}); setModal("edit"); }}
              style={{ padding:"12px 18px", borderBottom: i<ingresos.length-1 ? `1px solid ${C.crema}` : "none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
              onMouseEnter={e => e.currentTarget.style.background=C.crema}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <div>
                <div style={{ fontSize:13, fontWeight:600, color:C.tinta }}>{ing.desc}</div>
                <div style={{ fontSize:11, color:C.piedra }}>{fmtDate(ing.fecha)}{ing.proyecto && ` · ${ing.proyecto}`}</div>
              </div>
              <div style={{ fontWeight:700, color:C.musgo, fontSize:15 }}>+{fmt(ing.monto)}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "gastos" && (
        <div style={{ background: C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, overflow:"hidden" }}>
          {gastos.sort((a,b) => new Date(b.fecha)-new Date(a.fecha)).map((g, i) => (
            <div key={g.id} onClick={() => { setTipo("gasto"); setForm({...g}); setModal("edit"); }}
              style={{ padding:"12px 18px", borderBottom: i<gastos.length-1 ? `1px solid ${C.crema}` : "none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center" }}
              onMouseEnter={e => e.currentTarget.style.background=C.crema}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:13, fontWeight:600, color:C.tinta }}>{g.desc}</span>
                  <span style={{ background:"#F0EAE0", color:C.piedra, borderRadius:4, padding:"1px 7px", fontSize:10, fontWeight:600 }}>{g.categoria}</span>
                </div>
                <div style={{ fontSize:11, color:C.piedra }}>{fmtDate(g.fecha)}{g.proyecto && ` · ${g.proyecto}`}</div>
              </div>
              <div style={{ fontWeight:700, color:C.rojo, fontSize:15 }}>-{fmt(g.monto)}</div>
            </div>
          ))}
        </div>
      )}

      {(modal === "new" || modal === "edit") && tipo === "ingreso" && (
        <Modal title={modal==="new" ? "Nuevo ingreso" : "Editar ingreso"} onClose={() => setModal(null)}>
          <Inp label="Descripción" value={form.desc||""} onChange={e => setForm({...form,desc:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Inp label="Monto (₡)" type="number" value={form.monto||""} onChange={e => setForm({...form,monto:e.target.value})} />
            <Inp label="Fecha" type="date" value={form.fecha||today} onChange={e => setForm({...form,fecha:e.target.value})} />
          </div>
          <Inp label="Proyecto relacionado" value={form.proyecto||""} onChange={e => setForm({...form,proyecto:e.target.value})} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            {modal==="edit" && <Btn variant="danger" onClick={() => { setIngresos(ingresos.filter(i => i.id !== form.id)); setModal(null); }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveIngreso}>Guardar</Btn>
          </div>
        </Modal>
      )}
      {(modal === "new" || modal === "edit") && tipo === "gasto" && (
        <Modal title={modal==="new" ? "Nuevo gasto" : "Editar gasto"} onClose={() => setModal(null)}>
          <Inp label="Descripción" value={form.desc||""} onChange={e => setForm({...form,desc:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Inp label="Monto (₡)" type="number" value={form.monto||""} onChange={e => setForm({...form,monto:e.target.value})} />
            <Inp label="Fecha" type="date" value={form.fecha||today} onChange={e => setForm({...form,fecha:e.target.value})} />
          </div>
          <Sel label="Categoría" value={form.categoria||"Materiales"} onChange={e => setForm({...form,categoria:e.target.value})}>
            {TIPOS_GASTO.map(t => <option key={t}>{t}</option>)}
          </Sel>
          <Inp label="Proyecto relacionado" value={form.proyecto||""} onChange={e => setForm({...form,proyecto:e.target.value})} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            {modal==="edit" && <Btn variant="danger" onClick={() => { setGastos(gastos.filter(g => g.id !== form.id)); setModal(null); }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveGasto}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── PROVEEDORES + OC ──────────────────────────────────────────────────────────
function Proveedores({ proveedores, setProveedores, ocs, setOcs }) {
  const [tab, setTab] = useState("proveedores");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [tipo, setTipo] = useState("proveedor");
  const emptyProv = { nombre:"", contacto:"", tel:"", email:"", materiales:"", condicion:"Contado", notas:"" };
  const emptyOC   = { fecha:today, proveedor:"", items:"", monto:"", estado:"Pendiente", proyecto:"" };

  const saveProv = async () => {
    if (!form.nombre) return;
    const data = { nombre:form.nombre, contacto:form.contacto, tel:form.tel, email:form.email, materiales:form.materiales, condicion:form.condicion, notas:form.notas };
    if (form.id) {
      await supabase.from("proveedores").update(data).eq("id", form.id);
      setProveedores(proveedores.map(p => p.id===form.id ? {...form} : p));
    } else {
      const { data: newP } = await supabase.from("proveedores").insert(data).select().single();
      setProveedores([...proveedores, newP]);
    }
    setModal(null);
  };
  const saveOC = async () => {
    if (!form.proveedor || !form.items) return;
    const data = { fecha:form.fecha, proveedor:form.proveedor, items:form.items, monto:Number(form.monto), estado:form.estado, proyecto:form.proyecto };
    if (form.id) {
      await supabase.from("ordenes_compra").update(data).eq("id", form.id);
      setOcs(ocs.map(o => o.id===form.id ? {...form,monto:Number(form.monto)} : o));
    } else {
      const { data: newO } = await supabase.from("ordenes_compra").insert(data).select().single();
      setOcs([...ocs, newO]);
    }
    setModal(null);
  };

  const TabBtn = ({ id, label }) => (
    <button onClick={() => setTab(id)} style={{ padding:"7px 16px", borderRadius:6, fontSize:12, fontWeight:600, cursor:"pointer", border:"none", background:tab===id ? C.tinta:"transparent", color:tab===id ? C.crema:C.piedra }}>
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:20, fontWeight:700, color:C.tinta }}>Proveedores</div>
        <div style={{ display:"flex", gap:8 }}>
          {tab==="proveedores" && <Btn onClick={() => { setTipo("proveedor"); setForm(emptyProv); setModal("new"); }}>+ Proveedor</Btn>}
          {tab==="oc" && <Btn onClick={() => { setTipo("oc"); setForm(emptyOC); setModal("new"); }}>+ Orden de compra</Btn>}
        </div>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14, background:"#F0EAE0", borderRadius:8, padding:4 }}>
        <TabBtn id="proveedores" label={`Proveedores (${proveedores.length})`} />
        <TabBtn id="oc" label={`Órdenes de compra (${ocs.length})`} />
      </div>

      {tab === "proveedores" && (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {proveedores.map(p => (
            <div key={p.id} onClick={() => { setTipo("proveedor"); setForm({...p}); setModal("edit"); }}
              style={{ background:C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, padding:"14px 18px", cursor:"pointer" }}
              onMouseEnter={e => e.currentTarget.style.borderColor=C.dorado}
              onMouseLeave={e => e.currentTarget.style.borderColor="#E8E2D8"}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:C.tinta }}>{p.nombre}</div>
                  <div style={{ fontSize:12, color:C.piedra, marginTop:2 }}>{p.contacto} · {p.tel}</div>
                  <div style={{ fontSize:11, color:C.piedra, marginTop:2 }}>{p.materiales}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, background:"#F0EAE0", color:C.piedra, padding:"3px 8px", borderRadius:4, fontWeight:600 }}>{p.condicion}</div>
                  {p.email && <div style={{ fontSize:11, color:C.azul, marginTop:4 }}>{p.email}</div>}
                </div>
              </div>
              {p.notas && <div style={{ fontSize:11, color:C.piedra, marginTop:8, fontStyle:"italic" }}>{p.notas}</div>}
            </div>
          ))}
        </div>
      )}

      {tab === "oc" && (
        <div style={{ background:C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, overflow:"hidden" }}>
          {ocs.sort((a,b) => new Date(b.fecha)-new Date(a.fecha)).map((oc, i) => (
            <div key={oc.id} onClick={() => { setTipo("oc"); setForm({...oc}); setModal("edit"); }}
              style={{ padding:"13px 18px", borderBottom:i<ocs.length-1?`1px solid ${C.crema}`:"none", cursor:"pointer", display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"center" }}
              onMouseEnter={e => e.currentTarget.style.background=C.crema}
              onMouseLeave={e => e.currentTarget.style.background="transparent"}
            >
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:C.tinta }}>OC #{oc.id}</span>
                  <Badge label={oc.estado} />
                </div>
                <div style={{ fontSize:12, color:C.piedra }}>{oc.proveedor} · {fmtDate(oc.fecha)}</div>
                <div style={{ fontSize:12, color:C.tinta, marginTop:2 }}>{oc.items}</div>
                {oc.proyecto && <div style={{ fontSize:11, color:C.piedra }}>Proyecto: {oc.proyecto}</div>}
              </div>
              <div style={{ fontWeight:700, color:C.tinta, fontSize:15 }}>{fmt(oc.monto)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Modal proveedor */}
      {(modal==="new"||modal==="edit") && tipo==="proveedor" && (
        <Modal title={modal==="new"?"Nuevo proveedor":"Editar proveedor"} onClose={() => setModal(null)}>
          <Inp label="Nombre" value={form.nombre||""} onChange={e => setForm({...form,nombre:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Inp label="Contacto" value={form.contacto||""} onChange={e => setForm({...form,contacto:e.target.value})} />
            <Inp label="Teléfono" value={form.tel||""} onChange={e => setForm({...form,tel:e.target.value})} />
          </div>
          <Inp label="Email" type="email" value={form.email||""} onChange={e => setForm({...form,email:e.target.value})} />
          <Inp label="Materiales que provee" value={form.materiales||""} onChange={e => setForm({...form,materiales:e.target.value})} />
          <Sel label="Condición de pago" value={form.condicion||"Contado"} onChange={e => setForm({...form,condicion:e.target.value})}>
            {["Contado","7 días","15 días","30 días","45 días"].map(c => <option key={c}>{c}</option>)}
          </Sel>
          <Txt label="Notas" value={form.notas||""} onChange={e => setForm({...form,notas:e.target.value})} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            {modal==="edit" && <Btn variant="danger" onClick={() => { if(confirm("¿Eliminar?")) { setProveedores(proveedores.filter(p=>p.id!==form.id)); setModal(null); } }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveProv}>Guardar</Btn>
          </div>
        </Modal>
      )}
      {/* Modal OC */}
      {(modal==="new"||modal==="edit") && tipo==="oc" && (
        <Modal title={modal==="new"?"Nueva orden de compra":"Editar OC"} onClose={() => setModal(null)}>
          <Sel label="Proveedor" value={form.proveedor||""} onChange={e => setForm({...form,proveedor:e.target.value})}>
            <option value="">Seleccionar...</option>
            {proveedores.map(p => <option key={p.id}>{p.nombre}</option>)}
          </Sel>
          <Txt label="Ítems / descripción" value={form.items||""} onChange={e => setForm({...form,items:e.target.value})} />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Inp label="Monto (₡)" type="number" value={form.monto||""} onChange={e => setForm({...form,monto:e.target.value})} />
            <Inp label="Fecha" type="date" value={form.fecha||today} onChange={e => setForm({...form,fecha:e.target.value})} />
          </div>
          <Sel label="Estado" value={form.estado||"Pendiente"} onChange={e => setForm({...form,estado:e.target.value})}>
            {["Pendiente","Recibida","Cancelada"].map(s => <option key={s}>{s}</option>)}
          </Sel>
          <Inp label="Proyecto relacionado" value={form.proyecto||""} onChange={e => setForm({...form,proyecto:e.target.value})} />
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            {modal==="edit" && <Btn variant="danger" onClick={() => { if(confirm("¿Eliminar?")) { setOcs(ocs.filter(o=>o.id!==form.id)); setModal(null); } }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveOC}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── RECORDATORIOS ─────────────────────────────────────────────────────────────
function Recordatorios({ recordatorios, setRecordatorios }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const empty = { texto:"", fecha:"", tipo:"Otro", hecho:false };
  const [filtro, setFiltro] = useState("Pendientes");

  const lista = recordatorios
    .filter(r => filtro==="Todos" ? true : filtro==="Pendientes" ? !r.hecho : r.hecho)
    .sort((a,b) => new Date(a.fecha)-new Date(b.fecha));

  const save = async () => {
    if (!form.texto) return;
    const data = { texto: form.texto, fecha: form.fecha, tipo: form.tipo, hecho: form.hecho || false };
    if (form.id) {
      await supabase.from("recordatorios").update(data).eq("id", form.id);
      setRecordatorios(recordatorios.map(r => r.id===form.id ? {...form} : r));
    } else {
      const { data: newR } = await supabase.from("recordatorios").insert(data).select().single();
      setRecordatorios([...recordatorios, newR]);
    }
    setModal(null);
  };

  const toggle = async (id) => {
    const rec = recordatorios.find(r => r.id===id);
    await supabase.from("recordatorios").update({ hecho: !rec.hecho }).eq("id", id);
    setRecordatorios(recordatorios.map(r => r.id===id ? {...r, hecho:!r.hecho} : r));
  };

  const urgencyColor = (r) => {
    if (r.hecho) return C.verde;
    const d = daysLeft(r.fecha);
    if (d < 0) return C.rojo;
    if (d <= 2) return "#E67E22";
    return C.musgo;
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:20, fontWeight:700, color:C.tinta }}>Recordatorios</div>
        <Btn onClick={() => { setForm(empty); setModal("new"); }}>+ Nuevo</Btn>
      </div>

      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        {["Pendientes","Todos","Completados"].map(f => (
          <button key={f} onClick={() => setFiltro(f)} style={{ padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1.5px solid ${filtro===f?C.tinta:"#D0C9C0"}`, background:filtro===f?C.tinta:"transparent", color:filtro===f?C.crema:C.piedra }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {lista.length===0 && <div style={{ textAlign:"center", color:C.piedra, fontSize:13, padding:32 }}>Sin recordatorios en esta categoría</div>}
        {lista.map(r => {
          const d = daysLeft(r.fecha);
          return (
            <div key={r.id} style={{ background:C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:12, borderLeft:`4px solid ${urgencyColor(r)}` }}>
              <button onClick={() => toggle(r.id)} style={{ width:22, height:22, borderRadius:5, border:`2px solid ${urgencyColor(r)}`, background:r.hecho?urgencyColor(r):"transparent", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {r.hecho && <span style={{ color:"white", fontSize:12 }}>✓</span>}
              </button>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, fontSize:13, color:r.hecho?C.piedra:C.tinta, textDecoration:r.hecho?"line-through":"none" }}>{r.texto}</div>
                <div style={{ fontSize:11, color:C.piedra, marginTop:2, display:"flex", gap:10 }}>
                  <span>{fmtDate(r.fecha)}</span>
                  <span style={{ background:"#F0EAE0", padding:"1px 6px", borderRadius:3, fontWeight:600 }}>{r.tipo}</span>
                  {!r.hecho && r.fecha && <span style={{ color:urgencyColor(r), fontWeight:600 }}>
                    {d<0 ? `${Math.abs(d)}d vencido` : d===0 ? "Hoy" : `En ${d}d`}
                  </span>}
                </div>
              </div>
              <button onClick={() => { setForm({...r}); setModal("edit"); }} style={{ background:"none", border:"none", cursor:"pointer", color:C.piedra, fontSize:14 }}>✏</button>
            </div>
          );
        })}
      </div>

      {(modal==="new"||modal==="edit") && (
        <Modal title={modal==="new"?"Nuevo recordatorio":"Editar recordatorio"} onClose={() => setModal(null)}>
          <Inp label="Tarea / recordatorio" value={form.texto||""} onChange={e => setForm({...form,texto:e.target.value})} placeholder="Ej: Entregar propuesta a cliente" />
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <Sel label="Tipo" value={form.tipo||"Otro"} onChange={e => setForm({...form,tipo:e.target.value})}>
              {TIPOS_REC.map(t => <option key={t}>{t}</option>)}
            </Sel>
            <Inp label="Fecha límite" type="date" value={form.fecha||""} onChange={e => setForm({...form,fecha:e.target.value})} />
          </div>
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            {modal==="edit" && <Btn variant="danger" onClick={() => { if(confirm("¿Eliminar?")) { setRecordatorios(recordatorios.filter(r=>r.id!==form.id)); setModal(null); } }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── ASISTENTE IA ──────────────────────────────────────────────────────────────
function AsistenteIA({ projects, ingresos, gastos, recordatorios, proveedores, ocs }) {
  const [msgs, setMsgs] = useState([
    { role:"assistant", text:"Hola Javier 👋 Soy el asistente de Pértiga. Puedo analizar tus proyectos, contabilidad, proveedores y recordatorios. ¿En qué te ayudo hoy?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const context = `
Eres el asistente virtual de Pértiga Mobiliario, taller costarricense de muebles a la medida fundado por Javier.
Hablas en español, sos directo, técnico y conciso. No uses listas con bullets para todo, varía el formato.
Moneda: colones costarricenses (₡). Hoy es ${today}.

PROYECTOS ACTIVOS:
${projects.map(p => `- ${p.nombre} | ${p.cliente} | ${p.estado} | ₡${p.monto} | Entrega: ${p.entrega} | Saldo: ₡${Number(p.monto)-Number(p.adelanto)}`).join("\n")}

INGRESOS DEL MES: ₡${ingresos.reduce((s,i)=>s+Number(i.monto),0).toLocaleString()}
GASTOS DEL MES: ₡${gastos.reduce((s,g)=>s+Number(g.monto),0).toLocaleString()}
MARGEN: ₡${(ingresos.reduce((s,i)=>s+Number(i.monto),0)-gastos.reduce((s,g)=>s+Number(g.monto),0)).toLocaleString()}

RECORDATORIOS PENDIENTES:
${recordatorios.filter(r=>!r.hecho).map(r => `- ${r.texto} | ${r.fecha} | ${r.tipo}`).join("\n")}

PROVEEDORES: ${proveedores.map(p=>p.nombre).join(", ")}
ÓRDENES PENDIENTES: ${ocs.filter(o=>o.estado==="Pendiente").map(o=>`${o.proveedor}: ${o.items} (₡${o.monto})`).join(", ")||"ninguna"}

META MENSUAL JUNIO: ₡2,500,000
`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(m => [...m, { role:"user", text:userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-6",
          max_tokens:1000,
          system: context,
          messages: [...msgs.filter(m=>m.role!=="assistant"||msgs.indexOf(m)>0).map(m => ({ role:m.role, content:m.text })), { role:"user", content:userMsg }]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "No pude procesar la respuesta.";
      setMsgs(m => [...m, { role:"assistant", text:reply }]);
    } catch {
      setMsgs(m => [...m, { role:"assistant", text:"Error de conexión. Intentá de nuevo." }]);
    }
    setLoading(false);
  };

  const SUGERENCIAS = [
    "¿Qué proyectos vencen esta semana?",
    "¿Cuánto me falta para la meta del mes?",
    "¿Qué órdenes de compra están pendientes?",
    "Resumime el estado del negocio",
  ];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:520 }}>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:20, fontWeight:700, color:C.tinta, marginBottom:14 }}>Asistente Pértiga</div>
      
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, paddingRight:4, marginBottom:12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
            <div style={{ maxWidth:"78%", background:m.role==="user"?C.tinta:C.blanco, color:m.role==="user"?C.crema:C.tinta, borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px", padding:"10px 14px", fontSize:13, lineHeight:1.6, border:m.role==="assistant"?`1px solid #E8E2D8`:"none", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:"flex" }}>
            <div style={{ background:C.blanco, border:`1px solid #E8E2D8`, borderRadius:14, padding:"10px 16px", fontSize:13, color:C.piedra }}>
              <span style={{ animation:"pulse 1.5s infinite" }}>Analizando...</span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Sugerencias */}
      {msgs.length <= 2 && (
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
          {SUGERENCIAS.map(s => (
            <button key={s} onClick={() => { setInput(s); }} style={{ background:"#F0EAE0", border:"none", borderRadius:20, padding:"5px 12px", fontSize:11, color:C.tinta, cursor:"pointer", fontWeight:500 }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && send()}
          placeholder="Preguntá sobre proyectos, contabilidad, proveedores..."
          style={{ flex:1, border:`1.5px solid #D0C9C0`, borderRadius:8, padding:"10px 14px", fontSize:13, color:C.tinta, background:C.blanco, outline:"none" }}
        />
        <Btn onClick={send} style={{ padding:"10px 20px" }} disabled={loading}>→</Btn>
      </div>
    </div>
  );
}

// ── INTEGRACIONES ─────────────────────────────────────────────────────────────
function Integraciones() {
  const items = [
    { nombre:"Zoho CRM", desc:"Gestión de clientes y pipeline de ventas", estado:"Pendiente", pasos:["Ir a zoho.com → Developer Console","Crear OAuth app → copiar Client ID y Secret","En Pértiga Admin → pegar credenciales","Autorizar acceso a contactos y proyectos"], color:"#E74C3C", icon:"Z" },
    { nombre:"Zoho Books", desc:"Facturación, gastos y contabilidad", estado:"Pendiente", pasos:["En Zoho Books → Configuración → API","Generar API key","Conectar en Pértiga Admin","Sincronizar facturas y gastos existentes"], color:"#E67E22", icon:"B" },
    { nombre:"GTI (Hacienda CR)", desc:"Facturación electrónica Costa Rica", estado:"No iniciado", pasos:["Registrarte en portal.comprobanteselectronicos.go.cr","Obtener certificado digital","Configurar en sistema de facturación","Conectar via API de GTI"], color:"#2980B9", icon:"G" },
    { nombre:"WhatsApp Business API", desc:"Canal principal de comunicación y asistente", estado:"No iniciado", pasos:["Cuenta Meta Business verificada","Solicitar acceso a WhatsApp Business API","Usar servicio como Twilio o 360dialog","Conectar webhook con asistente Pértiga"], color:"#27AE60", icon:"W" },
    { nombre:"Gmail / Google Workspace", desc:"Lectura de correos y notificaciones", estado:"No iniciado", pasos:["Crear proyecto en console.cloud.google.com","Habilitar Gmail API","Configurar OAuth consent screen","Autorizar acceso de solo lectura"], color:"#C0392B", icon:"@" },
    { nombre:"Instagram / Meta", desc:"DMs y mensajes de redes sociales", estado:"No iniciado", pasos:["Cuenta Meta Business Suite","Habilitar Instagram Graph API","Configurar webhook para mensajes","Conectar con asistente Pértiga"], color:"#8E44AD", icon:"IG" },
  ];

  const colors = { "Pendiente":"#FEF9EC", "No iniciado":"#F5F0E8", "Conectado":"#EAFAF1" };
  const textColors = { "Pendiente":"#B8860B", "No iniciado":C.piedra, "Conectado":C.verde };

  return (
    <div>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:20, fontWeight:700, color:C.tinta, marginBottom:6 }}>Integraciones</div>
      <div style={{ color:C.piedra, fontSize:13, marginBottom:18 }}>Conectá Pértiga con tus otras herramientas. Seguí los pasos de cada integración.</div>
      
      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
        {items.map(it => (
          <div key={it.nombre} style={{ background:C.blanco, border:`1px solid #E8E2D8`, borderRadius:10, padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}>
              <div style={{ width:38, height:38, borderRadius:9, background:it.color, display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontWeight:800, fontSize:13, flexShrink:0 }}>{it.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:14, color:C.tinta }}>{it.nombre}</div>
                <div style={{ fontSize:12, color:C.piedra }}>{it.desc}</div>
              </div>
              <span style={{ background:colors[it.estado], color:textColors[it.estado], borderRadius:4, padding:"3px 10px", fontSize:11, fontWeight:600 }}>{it.estado}</span>
            </div>
            <div style={{ borderTop:`1px solid ${C.crema}`, paddingTop:10 }}>
              <div style={{ fontSize:11, fontWeight:600, color:C.piedra, marginBottom:6, textTransform:"uppercase", letterSpacing:0.4 }}>Pasos para conectar</div>
              {it.pasos.map((paso, i) => (
                <div key={i} style={{ display:"flex", gap:8, marginBottom:4, alignItems:"flex-start" }}>
                  <span style={{ width:18, height:18, borderRadius:"50%", background:"#F0EAE0", color:C.piedra, fontSize:10, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>{i+1}</span>
                  <span style={{ fontSize:12, color:C.tinta }}>{paso}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [projects, setProjects]       = useState([]);
  const [ingresos, setIngresos]       = useState([]);
  const [gastos, setGastos]           = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ocs, setOcs]                 = useState([]);
  const [recordatorios, setRecordatorios] = useState([]);

  // Load all data from Supabase on mount
  useEffect(() => {
    async function loadData() {
      const [p, i, g, prov, oc, rec] = await Promise.all([
        supabase.from("proyectos").select("*"),
        supabase.from("ingresos").select("*"),
        supabase.from("gastos").select("*"),
        supabase.from("proveedores").select("*"),
        supabase.from("ordenes_compra").select("*"),
        supabase.from("recordatorios").select("*"),
      ]);
      setProjects(p.data || []);
      setIngresos((i.data || []).map(r => ({...r, desc: r.descripcion})));
      setGastos((g.data || []).map(r => ({...r, desc: r.descripcion})));
      setProveedores(prov.data || []);
      setOcs(oc.data || []);
      setRecordatorios(rec.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const pendientes = recordatorios.filter(r => !r.hecho && daysLeft(r.fecha) <= 3).length;
  const TABS = [
    { id:"dashboard",     label:"Inicio",       icon:"⌂" },
    { id:"asistente",     label:"Asistente IA", icon:"✦" },
    { id:"proyectos",     label:"Proyectos",    icon:"◈" },
    { id:"contabilidad",  label:"Contabilidad", icon:"₡" },
    { id:"proveedores",   label:"Proveedores",  icon:"⊞" },
    { id:"recordatorios", label:"Recordatorios",icon:"◷", badge: pendientes },
    { id:"integraciones", label:"Integraciones",icon:"⊙" },
  ];

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:C.crema, flexDirection:"column", gap:16 }}>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:28, fontWeight:700, color:C.tinta }}>PÉRTIGA</div>
      <div style={{ color:C.piedra, fontSize:13 }}>Cargando tu panel...</div>
    </div>
  );

  return (
    <div style={{ fontFamily:"'DM Sans', system-ui, sans-serif", background:C.crema, minHeight:"100vh", display:"flex" }}>
      {/* SIDEBAR */}
      <div style={{ width:200, background:C.tinta, flexShrink:0, display:"flex", flexDirection:"column", minHeight:"100vh" }}>
        {/* Logo */}
        <div style={{ padding:"24px 20px 20px" }}>
          <div style={{ fontFamily:"'Georgia',serif", fontSize:22, fontWeight:700, color:C.dorado, letterSpacing:1 }}>PÉRTIGA</div>
          <div style={{ fontSize:10, color:"rgba(245,240,232,0.4)", letterSpacing:1.5, textTransform:"uppercase", marginTop:2 }}>Panel administrativo</div>
        </div>
        <div style={{ height:1, background:"rgba(255,255,255,0.08)", margin:"0 16px" }} />
        {/* Nav */}
        <nav style={{ padding:"12px 10px", flex:1 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"9px 12px", borderRadius:8, border:"none", cursor:"pointer", marginBottom:2, background:tab===t.id?"rgba(200,169,110,0.15)":"transparent", color:tab===t.id?C.dorado:"rgba(245,240,232,0.6)", fontWeight:tab===t.id?700:400, fontSize:13, textAlign:"left", position:"relative" }}>
              <span style={{ fontSize:15 }}>{t.icon}</span>
              <span>{t.label}</span>
              {t.badge > 0 && <span style={{ position:"absolute", right:10, background:C.rojo, color:"white", borderRadius:10, fontSize:10, fontWeight:700, padding:"1px 6px", minWidth:16, textAlign:"center" }}>{t.badge}</span>}
            </button>
          ))}
        </nav>
        {/* Bottom */}
        <div style={{ padding:"14px 18px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize:11, color:"rgba(245,240,232,0.3)", lineHeight:1.4 }}>
            <div style={{ fontWeight:600, color:"rgba(245,240,232,0.5)", marginBottom:2 }}>Javier · Fundador</div>
            v1.0 · Jun 2026
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex:1, overflow:"auto" }}>
        <div style={{ maxWidth:900, margin:"0 auto", padding:"28px 24px" }}>
          {tab === "dashboard"     && <Dashboard projects={projects} ingresos={ingresos} gastos={gastos} recordatorios={recordatorios} setTab={setTab} />}
          {tab === "asistente"     && <AsistenteIA projects={projects} ingresos={ingresos} gastos={gastos} recordatorios={recordatorios} proveedores={proveedores} ocs={ocs} />}
          {tab === "proyectos"     && <Proyectos projects={projects} setProjects={setProjects} />}
          {tab === "contabilidad"  && <Contabilidad ingresos={ingresos} setIngresos={setIngresos} gastos={gastos} setGastos={setGastos} projects={projects} />}
          {tab === "proveedores"   && <Proveedores proveedores={proveedores} setProveedores={setProveedores} ocs={ocs} setOcs={setOcs} />}
          {tab === "recordatorios" && <Recordatorios recordatorios={recordatorios} setRecordatorios={setRecordatorios} />}
          {tab === "integraciones" && <Integraciones />}
        </div>
      </div>
    </div>
  );
}
