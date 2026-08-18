import { useState } from "react";

const C = {
  tinta:"#1A1714", dorado:"#C8A96E", musgo:"#3D5A52",
  crema:"#F5F0E8", piedra:"#8A8278", blanco:"#FDFCFA",
  rojo:"#C0392B", verde:"#27AE60", azul:"#2980B9",
};
const fmt = n => `₡${Number(n).toLocaleString("es-CR")}`;
const fmtDate = d => { if(!d) return ""; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };
const today = new Date().toISOString().split("T")[0];
const daysLeft = d => Math.round((new Date(d)-new Date(today))/86400000);

function Badge({label}){
  const colors={
    "Nuevo":{ bg:"#EAF2FB", text:C.azul },
    "Contactado":{ bg:"#FEF9EC", text:"#B8860B" },
    "Cotización enviada":{ bg:"#F0EAF8", text:"#7D3C98" },
    "Negociando":{ bg:"#FEF0E6", text:"#E67E22" },
    "Cerrado ganado":{ bg:"#EAFAF1", text:C.verde },
    "Cerrado perdido":{ bg:"#FDECEA", text:C.rojo },
    "En cola":{ bg:"#F5F0E8", text:C.piedra },
    "En proceso":{ bg:"#EAF4F0", text:C.musgo },
    "Control de calidad":{ bg:"#F0EAF8", text:"#7D3C98" },
    "Listo":{ bg:"#EAFAF1", text:C.verde },
    "Pendiente":{ bg:"#FEF9EC", text:"#B8860B" },
    "Completado":{ bg:"#EAFAF1", text:C.verde },
    "Vencido":{ bg:"#FDECEA", text:C.rojo },
  };
  const s=colors[label]||{bg:"#F0F0F0",text:C.piedra};
  return <span style={{background:s.bg,color:s.text,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600}}>{label}</span>;
}
function Modal({title,onClose,children}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(26,23,20,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:C.blanco,borderRadius:12,width:"100%",maxWidth:540,maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px 14px",borderBottom:`1px solid ${C.crema}`}}>
          <span style={{fontFamily:"'Georgia',serif",fontSize:17,fontWeight:600,color:C.tinta}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:C.piedra}}>×</button>
        </div>
        <div style={{padding:"20px 24px 24px"}}>{children}</div>
      </div>
    </div>
  );
}
const Inp=({label,...p})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:C.piedra,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>}
    <input {...p} style={{width:"100%",border:"1.5px solid #E2DDD6",borderRadius:6,padding:"8px 10px",fontSize:13,color:C.tinta,background:C.blanco,outline:"none",boxSizing:"border-box",...p.style}}/>
  </div>
);
const Sel=({label,children,...p})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:C.piedra,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>}
    <select {...p} style={{width:"100%",border:"1.5px solid #E2DDD6",borderRadius:6,padding:"8px 10px",fontSize:13,color:C.tinta,background:C.blanco,outline:"none",boxSizing:"border-box"}}>{children}</select>
  </div>
);
const Txt=({label,...p})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:C.piedra,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>}
    <textarea {...p} style={{width:"100%",border:"1.5px solid #E2DDD6",borderRadius:6,padding:"8px 10px",fontSize:13,color:C.tinta,background:C.blanco,outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:70}}/>
  </div>
);
const Btn=({children,variant="primary",...p})=>{
  const styles={
    primary:{background:C.tinta,color:C.dorado,border:"none"},
    ghost:{background:"transparent",color:C.tinta,border:"1.5px solid #D0C9C0"},
    danger:{background:"#FDECEA",color:C.rojo,border:"none"},
    accent:{background:C.dorado,color:C.tinta,border:"none"},
    success:{background:"#EAFAF1",color:C.verde,border:"none"},
  };
  return <button {...p} style={{...styles[variant],borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",...p.style}}>{children}</button>;
};

// ═══════════════════════════════════════════════════════
// LEAD TRACKER
// ═══════════════════════════════════════════════════════
const LEAD_ESTADOS = ["Nuevo","Contactado","Cotización enviada","Negociando","Cerrado ganado","Cerrado perdido"];
const LEAD_FUENTES = ["Instagram","WhatsApp","Referido","Facebook","Visita directa","Arquitecto/Interiorista","Otro"];
const LEAD_TIPOS   = ["Residencial","Comercial","Colección"];

export function LeadTracker({ leads, setLeads, supabase }) {
  const [modal, setModal] = useState(null);
  const [filtro, setFiltro] = useState("Activos");
  const empty = { nombre:"", contacto:"", tel:"", email:"", tipo:"Residencial", fuente:"WhatsApp", estado:"Nuevo", monto_estimado:"", fecha_contacto:today, fecha_limite:"", descripcion:"", proxima_accion:"", notas:"" };
  const [form, setForm] = useState(empty);

  const activos = ["Nuevo","Contactado","Cotización enviada","Negociando"];
  const lista = filtro === "Activos" ? leads.filter(l => activos.includes(l.estado))
    : filtro === "Ganados" ? leads.filter(l => l.estado === "Cerrado ganado")
    : filtro === "Perdidos" ? leads.filter(l => l.estado === "Cerrado perdido")
    : leads;

  const save = async () => {
    if (!form.nombre) return;
    const data = { ...form, monto_estimado: Number(form.monto_estimado)||0 };
    if (form.id) {
      const { id, created_at, ...rest } = data;
      await supabase.from("leads").update(rest).eq("id", form.id);
      setLeads(leads.map(l => l.id === form.id ? data : l));
    } else {
      const { id, ...insertData } = data;
      const { data: newL } = await supabase.from("leads").insert(insertData).select().single();
      setLeads([...leads, newL]);
    }
    setModal(null);
  };

  const del = async (id) => {
    if (confirm("¿Eliminar lead?")) {
      await supabase.from("leads").delete().eq("id", id);
      setLeads(leads.filter(l => l.id !== id));
    }
    setModal(null);
  };

  const cambiarEstado = async (lead, nuevoEstado) => {
    await supabase.from("leads").update({ estado: nuevoEstado }).eq("id", lead.id);
    setLeads(leads.map(l => l.id === lead.id ? { ...l, estado: nuevoEstado } : l));
  };

  const totalEstimado = lista.filter(l => activos.includes(l.estado)).reduce((s,l) => s + Number(l.monto_estimado||0), 0);
  const ganados = leads.filter(l => l.estado === "Cerrado ganado").reduce((s,l) => s + Number(l.monto_estimado||0), 0);

  const urgColor = (l) => {
    if (!l.fecha_limite) return C.piedra;
    const d = daysLeft(l.fecha_limite);
    if (d < 0) return C.rojo;
    if (d <= 2) return "#E67E22";
    return C.musgo;
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Georgia',serif",fontSize:20,fontWeight:700,color:C.tinta}}>Lead Tracker</div>
        <Btn onClick={() => { setForm(empty); setModal("new"); }}>+ Nuevo lead</Btn>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[
          { l:"Pipeline activo", v:fmt(totalEstimado), c:C.azul },
          { l:"Leads activos", v:leads.filter(l=>activos.includes(l.estado)).length, c:C.tinta },
          { l:"Cerrados ganados", v:leads.filter(l=>l.estado==="Cerrado ganado").length, c:C.verde },
          { l:"Valor ganado", v:fmt(ganados), c:C.musgo },
        ].map(k=>(
          <div key={k.l} style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:C.piedra,textTransform:"uppercase",letterSpacing:0.4,fontWeight:600,marginBottom:3}}>{k.l}</div>
            <div style={{fontFamily:"'Georgia',serif",fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {["Activos","Ganados","Perdidos","Todos"].map(f=>(
          <button key={f} onClick={()=>setFiltro(f)} style={{padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${filtro===f?C.tinta:"#D0C9C0"}`,background:filtro===f?C.tinta:"transparent",color:filtro===f?C.crema:C.piedra}}>
            {f} {f==="Activos"?`(${leads.filter(l=>activos.includes(l.estado)).length})`:""}
          </button>
        ))}
      </div>

      {/* Pipeline por estado */}
      {filtro === "Activos" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
          {activos.map(estado => {
            const group = leads.filter(l => l.estado === estado);
            return (
              <div key={estado} style={{background:"#F5F0E8",borderRadius:10,padding:12}}>
                <div style={{fontSize:11,fontWeight:700,color:C.piedra,textTransform:"uppercase",letterSpacing:0.4,marginBottom:8}}>
                  {estado} <span style={{color:C.dorado}}>({group.length})</span>
                </div>
                {group.map(l => (
                  <div key={l.id} onClick={()=>{ setForm({...l}); setModal("edit"); }}
                    style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:8,padding:"10px 12px",marginBottom:8,cursor:"pointer",borderLeft:`3px solid ${urgColor(l)}`}}>
                    <div style={{fontSize:12,fontWeight:700,color:C.tinta,marginBottom:3}}>{l.nombre}</div>
                    {l.monto_estimado > 0 && <div style={{fontSize:11,color:C.musgo,fontWeight:600}}>{fmt(l.monto_estimado)}</div>}
                    <div style={{fontSize:11,color:C.piedra,marginTop:2}}>{l.tipo} · {l.fuente}</div>
                    {l.fecha_limite && (
                      <div style={{fontSize:10,color:urgColor(l),fontWeight:600,marginTop:3}}>
                        {daysLeft(l.fecha_limite)<0 ? `${Math.abs(daysLeft(l.fecha_limite))}d vencido` : daysLeft(l.fecha_limite)===0 ? "Hoy" : `${daysLeft(l.fecha_limite)}d`}
                      </div>
                    )}
                    {l.proxima_accion && <div style={{fontSize:10,color:C.azul,marginTop:3,fontStyle:"italic"}}>{l.proxima_accion}</div>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Lista para otros filtros */}
      {filtro !== "Activos" && (
        <div style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:10,overflow:"hidden"}}>
          {lista.length===0 && <div style={{padding:32,textAlign:"center",color:C.piedra,fontSize:13}}>Sin leads en esta categoría</div>}
          {lista.map((l,i)=>(
            <div key={l.id} onClick={()=>{ setForm({...l}); setModal("edit"); }}
              style={{padding:"13px 18px",borderBottom:i<lista.length-1?`1px solid ${C.crema}`:"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
              onMouseEnter={e=>e.currentTarget.style.background=C.crema}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{fontWeight:700,fontSize:13,color:C.tinta}}>{l.nombre}</span>
                  <Badge label={l.estado}/>
                </div>
                <div style={{fontSize:12,color:C.piedra}}>{l.tipo} · {l.fuente} · {fmtDate(l.fecha_contacto)}</div>
              </div>
              <div style={{fontWeight:700,color:C.tinta}}>{fmt(l.monto_estimado)}</div>
            </div>
          ))}
        </div>
      )}

      {(modal==="new"||modal==="edit") && (
        <Modal title={modal==="new"?"Nuevo lead":"Editar lead"} onClose={()=>setModal(null)}>
          <Inp label="Nombre del prospecto / empresa" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} />
          <Inp label="Contacto" value={form.contacto||""} onChange={e=>setForm({...form,contacto:e.target.value})} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp label="Teléfono" value={form.tel||""} onChange={e=>setForm({...form,tel:e.target.value})} />
            <Inp label="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Tipo" value={form.tipo||"Residencial"} onChange={e=>setForm({...form,tipo:e.target.value})}>
              {LEAD_TIPOS.map(t=><option key={t}>{t}</option>)}
            </Sel>
            <Sel label="Fuente" value={form.fuente||"WhatsApp"} onChange={e=>setForm({...form,fuente:e.target.value})}>
              {LEAD_FUENTES.map(f=><option key={f}>{f}</option>)}
            </Sel>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Estado" value={form.estado||"Nuevo"} onChange={e=>setForm({...form,estado:e.target.value})}>
              {LEAD_ESTADOS.map(s=><option key={s}>{s}</option>)}
            </Sel>
            <Inp label="Monto estimado (₡)" type="number" value={form.monto_estimado||""} onChange={e=>setForm({...form,monto_estimado:e.target.value})} />
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp label="Fecha contacto" type="date" value={form.fecha_contacto||today} onChange={e=>setForm({...form,fecha_contacto:e.target.value})} />
            <Inp label="Fecha límite cotización" type="date" value={form.fecha_limite||""} onChange={e=>setForm({...form,fecha_limite:e.target.value})} />
          </div>
          <Txt label="Descripción del proyecto" value={form.descripcion||""} onChange={e=>setForm({...form,descripcion:e.target.value})} />
          <Inp label="Próxima acción" value={form.proxima_accion||""} onChange={e=>setForm({...form,proxima_accion:e.target.value})} placeholder="Ej: Enviar cotización, Llamar para seguimiento..." />
          <Txt label="Notas" value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} />
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            {modal==="edit" && <Btn variant="danger" onClick={()=>del(form.id)}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={save}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TALLER
// ═══════════════════════════════════════════════════════
const OPERARIOS = ["Javier","Operario 1","Ayudante","Laqueador"];
const ETAPAS_PROD = ["En cola","En proceso","Control de calidad","Listo"];
const TIPO_MANT = ["Maquinaria","Camión","Herramienta","Instalación","Otro"];
const MAQUINAS = ["Router CNC","Lijadora calibradora","Sierra de mesa","Sierra circular","Compresor","Pistola de laca","Taladro","Fresadora","Otro"];

export function Taller({ supabase, projects }) {
  const [subtab, setSubtab] = useState("produccion");
  const [tareas, setTareas] = useState([]);
  const [tiempos, setTiempos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [mantenimientos, setMantenimientos] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [timerActivo, setTimerActivo] = useState(null);
  const [timerSeg, setTimerSeg] = useState(0);

  useState(() => {
    async function load() {
      const [t, ti, inv, mant] = await Promise.all([
        supabase.from("tareas").select("*"),
        supabase.from("tiempos").select("*"),
        supabase.from("inventario").select("*"),
        supabase.from("mantenimientos").select("*"),
      ]);
      setTareas(t.data||[]);
      setTiempos(ti.data||[]);
      setInventario(inv.data||[]);
      setMantenimientos(mant.data||[]);
      setLoaded(true);
    }
    load();
  }, []);

  // Timer
  const iniciarTimer = (tarea) => {
    setTimerActivo(tarea);
    setTimerSeg(0);
    const interval = setInterval(() => setTimerSeg(s => s+1), 1000);
    setTimerActivo({...tarea, interval});
  };
  const detenerTimer = async () => {
    if (!timerActivo) return;
    clearInterval(timerActivo.interval);
    const mins = Math.round(timerSeg/60);
    const data = { tarea_id: timerActivo.id, proyecto: timerActivo.proyecto, operario: timerActivo.operario, descripcion: timerActivo.nombre, minutos: mins, fecha: today };
    const { data: newT } = await supabase.from("tiempos").insert(data).select().single();
    setTiempos([...tiempos, newT]);
    setTimerActivo(null);
    setTimerSeg(0);
  };
  const fmtTimer = s => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const saveTarea = async () => {
    if (!form.nombre) return;
    const data = { nombre:form.nombre, proyecto:form.proyecto||"", operario:form.operario||"Javier", estado:form.estado||"En cola", prioridad:form.prioridad||"Normal", fecha_inicio:form.fecha_inicio||today, fecha_limite:form.fecha_limite||"", notas:form.notas||"" };
    if (form.id) {
      await supabase.from("tareas").update(data).eq("id",form.id);
      setTareas(tareas.map(t=>t.id===form.id?{...form,...data}:t));
    } else {
      const { data: newT } = await supabase.from("tareas").insert(data).select().single();
      setTareas([...tareas, newT]);
    }
    setModal(null);
  };

  const saveInventario = async () => {
    if (!form.nombre) return;
    const data = { nombre:form.nombre, categoria:form.categoria||"Madera", cantidad:Number(form.cantidad)||0, unidad:form.unidad||"unidades", minimo:Number(form.minimo)||0, ubicacion:form.ubicacion||"", notas:form.notas||"" };
    if (form.id) {
      await supabase.from("inventario").update(data).eq("id",form.id);
      setInventario(inventario.map(i=>i.id===form.id?{...form,...data}:i));
    } else {
      const { data: newI } = await supabase.from("inventario").insert(data).select().single();
      setInventario([...inventario, newI]);
    }
    setModal(null);
  };

  const saveMant = async () => {
    if (!form.equipo) return;
    const data = { equipo:form.equipo, tipo:form.tipo||"Maquinaria", descripcion:form.descripcion||"", fecha_ultimo:form.fecha_ultimo||today, frecuencia_dias:Number(form.frecuencia_dias)||30, proximo:form.proximo||"", costo:Number(form.costo)||0, estado:form.estado||"Pendiente", notas:form.notas||"" };
    if (form.id) {
      await supabase.from("mantenimientos").update(data).eq("id",form.id);
      setMantenimientos(mantenimientos.map(m=>m.id===form.id?{...form,...data}:m));
    } else {
      const { data: newM } = await supabase.from("mantenimientos").insert(data).select().single();
      setMantenimientos([...mantenimientos, newM]);
    }
    setModal(null);
  };

  const SubTab = ({id,label,icon}) => (
    <button onClick={()=>setSubtab(id)} style={{padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",background:subtab===id?C.tinta:"transparent",color:subtab===id?C.crema:C.piedra,display:"flex",alignItems:"center",gap:5}}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );

  const stockBajo = inventario.filter(i => Number(i.cantidad) <= Number(i.minimo));
  const mantVencidos = mantenimientos.filter(m => m.proximo && daysLeft(m.proximo) <= 3);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Georgia',serif",fontSize:20,fontWeight:700,color:C.tinta}}>Taller</div>
        <div style={{display:"flex",gap:8}}>
          {stockBajo.length>0 && <span style={{background:"#FEF9EC",color:"#B8860B",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600}}>⚠ {stockBajo.length} items bajo mínimo</span>}
          {mantVencidos.length>0 && <span style={{background:"#FDECEA",color:C.rojo,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600}}>🔧 {mantVencidos.length} mantenimientos urgentes</span>}
        </div>
      </div>

      {/* Timer activo */}
      {timerActivo && (
        <div style={{background:C.tinta,borderRadius:10,padding:"14px 20px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:C.dorado,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5}}>Timer activo</div>
            <div style={{color:C.crema,fontSize:13,marginTop:2}}>{timerActivo.nombre} · {timerActivo.operario}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontFamily:"'Georgia',serif",fontSize:28,fontWeight:700,color:C.dorado}}>{fmtTimer(timerSeg)}</div>
            <Btn variant="accent" onClick={detenerTimer}>Detener y guardar</Btn>
          </div>
        </div>
      )}

      {/* Subtabs */}
      <div style={{display:"flex",gap:6,marginBottom:16,background:"#F0EAE0",borderRadius:8,padding:4,flexWrap:"wrap"}}>
        <SubTab id="produccion" label="Producción" icon="⚙" />
        <SubTab id="tiempos" label="Tiempos" icon="⏱" />
        <SubTab id="inventario" label="Inventario" icon="📦" />
        <SubTab id="mantenimiento" label="Mantenimiento" icon="🔧" />
      </div>

      {/* PRODUCCIÓN */}
      {subtab==="produccion" && (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn onClick={()=>{ setForm({nombre:"",proyecto:"",operario:"Javier",estado:"En cola",prioridad:"Normal",fecha_inicio:today,fecha_limite:"",notas:""}); setModal("tarea"); }}>+ Nueva tarea</Btn>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {ETAPAS_PROD.map(estado => {
              const group = tareas.filter(t=>t.estado===estado);
              const colors = {"En cola":C.piedra,"En proceso":C.azul,"Control de calidad":"#7D3C98","Listo":C.verde};
              return (
                <div key={estado} style={{background:"#F5F0E8",borderRadius:10,padding:12}}>
                  <div style={{fontSize:11,fontWeight:700,color:colors[estado],textTransform:"uppercase",letterSpacing:0.4,marginBottom:8,display:"flex",justifyContent:"space-between"}}>
                    <span>{estado}</span><span>({group.length})</span>
                  </div>
                  {group.map(t=>(
                    <div key={t.id} style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:8,padding:"10px 12px",marginBottom:8}}>
                      <div style={{fontSize:12,fontWeight:700,color:C.tinta,marginBottom:3}}>{t.nombre}</div>
                      {t.proyecto && <div style={{fontSize:11,color:C.piedra,marginBottom:3}}>📋 {t.proyecto}</div>}
                      <div style={{fontSize:11,color:C.piedra,marginBottom:6}}>👤 {t.operario}</div>
                      {t.fecha_limite && (
                        <div style={{fontSize:10,fontWeight:600,color:daysLeft(t.fecha_limite)<0?C.rojo:daysLeft(t.fecha_limite)<=2?"#E67E22":C.musgo,marginBottom:6}}>
                          {daysLeft(t.fecha_limite)<0?`${Math.abs(daysLeft(t.fecha_limite))}d vencido`:daysLeft(t.fecha_limite)===0?"Hoy":`${daysLeft(t.fecha_limite)}d`}
                        </div>
                      )}
                      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                        {t.estado!=="Listo" && !timerActivo && (
                          <button onClick={()=>iniciarTimer(t)} style={{background:"#EAF4F0",color:C.musgo,border:"none",borderRadius:4,padding:"3px 8px",fontSize:10,fontWeight:600,cursor:"pointer"}}>▶ Timer</button>
                        )}
                        <button onClick={()=>{ setForm({...t}); setModal("tarea"); }} style={{background:"#F0EAE0",color:C.piedra,border:"none",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer"}}>✏ Editar</button>
                        {t.estado!=="Listo" && (
                          <button onClick={async()=>{ const next = ETAPAS_PROD[ETAPAS_PROD.indexOf(t.estado)+1]; if(next){ await supabase.from("tareas").update({estado:next}).eq("id",t.id); setTareas(tareas.map(x=>x.id===t.id?{...x,estado:next}:x)); } }} style={{background:"#EAF2FB",color:C.azul,border:"none",borderRadius:4,padding:"3px 8px",fontSize:10,fontWeight:600,cursor:"pointer"}}>→ Avanzar</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TIEMPOS */}
      {subtab==="tiempos" && (
        <div>
          <div style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:10,overflow:"hidden",marginBottom:16}}>
            <div style={{padding:"12px 18px",borderBottom:`1px solid ${C.crema}`,fontWeight:700,fontSize:13,color:C.tinta}}>Registro de tiempos</div>
            {tiempos.length===0 && <div style={{padding:32,textAlign:"center",color:C.piedra,fontSize:13}}>Sin registros aún — usá el timer en Producción</div>}
            {[...tiempos].reverse().map((t,i)=>(
              <div key={t.id} style={{padding:"11px 18px",borderBottom:i<tiempos.length-1?`1px solid ${C.crema}`:"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:C.tinta}}>{t.descripcion}</div>
                  <div style={{fontSize:11,color:C.piedra}}>{t.operario} · {fmtDate(t.fecha)}{t.proyecto&&` · ${t.proyecto}`}</div>
                </div>
                <div style={{fontFamily:"'Georgia',serif",fontSize:16,fontWeight:700,color:C.musgo}}>{t.minutos} min</div>
              </div>
            ))}
          </div>
          {/* Resumen por operario */}
          <div style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:10,padding:16}}>
            <div style={{fontWeight:700,fontSize:13,color:C.tinta,marginBottom:12}}>Resumen por operario</div>
            {OPERARIOS.map(op => {
              const total = tiempos.filter(t=>t.operario===op).reduce((s,t)=>s+Number(t.minutos),0);
              if(!total) return null;
              return (
                <div key={op} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.crema}`}}>
                  <span style={{fontSize:13,color:C.tinta}}>{op}</span>
                  <span style={{fontWeight:700,color:C.musgo}}>{Math.floor(total/60)}h {total%60}min</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INVENTARIO */}
      {subtab==="inventario" && (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn onClick={()=>{ setForm({nombre:"",categoria:"Madera",cantidad:"",unidad:"unidades",minimo:"",ubicacion:"",notas:""}); setModal("inventario"); }}>+ Agregar ítem</Btn>
          </div>
          {stockBajo.length>0 && (
            <div style={{background:"#FEF9EC",border:"1px solid #F0D080",borderRadius:8,padding:"10px 16px",marginBottom:12}}>
              <div style={{fontWeight:700,fontSize:12,color:"#B8860B",marginBottom:4}}>⚠ Stock bajo mínimo</div>
              {stockBajo.map(i=><div key={i.id} style={{fontSize:12,color:C.tinta}}>{i.nombre} — {i.cantidad} {i.unidad} (mínimo: {i.minimo})</div>)}
            </div>
          )}
          <div style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:10,overflow:"hidden"}}>
            {inventario.length===0 && <div style={{padding:32,textAlign:"center",color:C.piedra,fontSize:13}}>Sin ítems en inventario todavía</div>}
            {inventario.map((item,i)=>(
              <div key={item.id} onClick={()=>{ setForm({...item}); setModal("inventario"); }}
                style={{padding:"12px 18px",borderBottom:i<inventario.length-1?`1px solid ${C.crema}`:"none",cursor:"pointer",display:"grid",gridTemplateColumns:"1fr auto",alignItems:"center",gap:12,borderLeft:`3px solid ${Number(item.cantidad)<=Number(item.minimo)?C.rojo:C.verde}`}}
                onMouseEnter={e=>e.currentTarget.style.background=C.crema}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <div>
                  <div style={{fontWeight:700,fontSize:13,color:C.tinta}}>{item.nombre}</div>
                  <div style={{fontSize:11,color:C.piedra}}>{item.categoria}{item.ubicacion&&` · ${item.ubicacion}`}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontFamily:"'Georgia',serif",fontSize:18,fontWeight:700,color:Number(item.cantidad)<=Number(item.minimo)?C.rojo:C.tinta}}>{item.cantidad}</div>
                  <div style={{fontSize:10,color:C.piedra}}>{item.unidad} · mín {item.minimo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MANTENIMIENTO */}
      {subtab==="mantenimiento" && (
        <div>
          <div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}>
            <Btn onClick={()=>{ setForm({equipo:"",tipo:"Maquinaria",descripcion:"",fecha_ultimo:today,frecuencia_dias:30,proximo:"",costo:"",estado:"Pendiente",notas:""}); setModal("mantenimiento"); }}>+ Agregar equipo</Btn>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {mantenimientos.length===0 && <div style={{background:C.blanco,border:`1px solid #E8E2D8`,borderRadius:10,padding:32,textAlign:"center",color:C.piedra,fontSize:13}}>Sin equipos registrados</div>}
            {mantenimientos.map(m=>{
              const d = m.proximo ? daysLeft(m.proximo) : null;
              const urgente = d !== null && d <= 3;
              return (
                <div key={m.id} onClick={()=>{ setForm({...m}); setModal("mantenimiento"); }}
                  style={{background:C.blanco,border:`1px solid ${urgente?"#F0D080":"#E8E2D8"}`,borderRadius:10,padding:"14px 18px",cursor:"pointer",borderLeft:`4px solid ${d===null?C.piedra:d<0?C.rojo:d<=3?"#E67E22":C.verde}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                    <div>
                      <div style={{fontWeight:700,fontSize:14,color:C.tinta}}>{m.equipo}</div>
                      <div style={{fontSize:12,color:C.piedra,marginTop:2}}>{m.tipo} · {m.descripcion}</div>
                      <div style={{fontSize:11,color:C.piedra,marginTop:4}}>Último: {fmtDate(m.fecha_ultimo)} · Cada {m.frecuencia_dias} días</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <Badge label={m.estado}/>
                      {m.proximo && (
                        <div style={{fontSize:11,fontWeight:600,color:d<0?C.rojo:d<=3?"#E67E22":C.musgo,marginTop:6}}>
                          Próximo: {fmtDate(m.proximo)}<br/>
                          {d<0?`${Math.abs(d)}d vencido`:d===0?"Hoy":`En ${d}d`}
                        </div>
                      )}
                      {m.costo>0 && <div style={{fontSize:11,color:C.piedra,marginTop:4}}>{fmt(m.costo)}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal tarea */}
      {modal==="tarea" && (
        <Modal title={form.id?"Editar tarea":"Nueva tarea de producción"} onClose={()=>setModal(null)}>
          <Inp label="Nombre de la tarea" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Corte CNC patas butaca"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Operario" value={form.operario||"Javier"} onChange={e=>setForm({...form,operario:e.target.value})}>
              {OPERARIOS.map(o=><option key={o}>{o}</option>)}
            </Sel>
            <Sel label="Estado" value={form.estado||"En cola"} onChange={e=>setForm({...form,estado:e.target.value})}>
              {ETAPAS_PROD.map(s=><option key={s}>{s}</option>)}
            </Sel>
          </div>
          <Inp label="Proyecto relacionado" value={form.proyecto||""} onChange={e=>setForm({...form,proyecto:e.target.value})} placeholder="Ej: TV Wall Los Yoses"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Inp label="Fecha inicio" type="date" value={form.fecha_inicio||today} onChange={e=>setForm({...form,fecha_inicio:e.target.value})}/>
            <Inp label="Fecha límite" type="date" value={form.fecha_limite||""} onChange={e=>setForm({...form,fecha_limite:e.target.value})}/>
          </div>
          <Txt label="Notas" value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            {form.id && <Btn variant="danger" onClick={async()=>{ if(confirm("¿Eliminar?")){await supabase.from("tareas").delete().eq("id",form.id); setTareas(tareas.filter(t=>t.id!==form.id)); setModal(null);} }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveTarea}>Guardar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal inventario */}
      {modal==="inventario" && (
        <Modal title={form.id?"Editar ítem":"Nuevo ítem de inventario"} onClose={()=>setModal(null)}>
          <Inp label="Nombre del material / herramienta" value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Tableros MDF 18mm"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Categoría" value={form.categoria||"Madera"} onChange={e=>setForm({...form,categoria:e.target.value})}>
              {["Madera","Tableros","Herrajes","Pintura/Laca","Herramienta","Otro"].map(c=><option key={c}>{c}</option>)}
            </Sel>
            <Inp label="Ubicación en bodega" value={form.ubicacion||""} onChange={e=>setForm({...form,ubicacion:e.target.value})} placeholder="Ej: Estante A"/>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <Inp label="Cantidad" type="number" value={form.cantidad||""} onChange={e=>setForm({...form,cantidad:e.target.value})}/>
            <Inp label="Unidad" value={form.unidad||"unidades"} onChange={e=>setForm({...form,unidad:e.target.value})} placeholder="tableros, litros..."/>
            <Inp label="Mínimo" type="number" value={form.minimo||""} onChange={e=>setForm({...form,minimo:e.target.value})}/>
          </div>
          <Txt label="Notas" value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            {form.id && <Btn variant="danger" onClick={async()=>{ if(confirm("¿Eliminar?")){await supabase.from("inventario").delete().eq("id",form.id); setInventario(inventario.filter(i=>i.id!==form.id)); setModal(null);} }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveInventario}>Guardar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal mantenimiento */}
      {modal==="mantenimiento" && (
        <Modal title={form.id?"Editar mantenimiento":"Nuevo equipo / mantenimiento"} onClose={()=>setModal(null)}>
          <Inp label="Equipo / herramienta" value={form.equipo||""} onChange={e=>setForm({...form,equipo:e.target.value})} placeholder="Ej: Router CNC, Camión, Sierra de mesa"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Sel label="Tipo" value={form.tipo||"Maquinaria"} onChange={e=>setForm({...form,tipo:e.target.value})}>
              {TIPO_MANT.map(t=><option key={t}>{t}</option>)}
            </Sel>
            <Sel label="Estado" value={form.estado||"Pendiente"} onChange={e=>setForm({...form,estado:e.target.value})}>
              {["Pendiente","Completado","En reparación"].map(s=><option key={s}>{s}</option>)}
            </Sel>
          </div>
          <Inp label="Descripción del mantenimiento" value={form.descripcion||""} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="Ej: Cambio de aceite, afilado, calibración"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            <Inp label="Último mantenimiento" type="date" value={form.fecha_ultimo||today} onChange={e=>setForm({...form,fecha_ultimo:e.target.value})}/>
            <Inp label="Cada (días)" type="number" value={form.frecuencia_dias||30} onChange={e=>setForm({...form,frecuencia_dias:e.target.value})}/>
            <Inp label="Próximo" type="date" value={form.proximo||""} onChange={e=>setForm({...form,proximo:e.target.value})}/>
          </div>
          <Inp label="Costo estimado (₡)" type="number" value={form.costo||""} onChange={e=>setForm({...form,costo:e.target.value})}/>
          <Txt label="Notas" value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})}/>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            {form.id && <Btn variant="danger" onClick={async()=>{ if(confirm("¿Eliminar?")){await supabase.from("mantenimientos").delete().eq("id",form.id); setMantenimientos(mantenimientos.filter(m=>m.id!==form.id)); setModal(null);} }}>Eliminar</Btn>}
            <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
            <Btn onClick={saveMant}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
