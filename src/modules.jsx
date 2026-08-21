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
    <input {...p} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:C.tinta,background:C.blanco,outline:"none",boxSizing:"border-box",...p.style}}/>
  </div>
);
const Sel=({label,children,...p})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:C.piedra,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>}
    <select {...p} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:C.tinta,background:C.blanco,outline:"none",boxSizing:"border-box"}}>{children}</select>
  </div>
);
const Txt=({label,...p})=>(
  <div style={{marginBottom:14}}>
    {label&&<div style={{fontSize:11,fontWeight:600,color:C.piedra,marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{label}</div>}
    <textarea {...p} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:C.tinta,background:C.blanco,outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:70}}/>
  </div>
);
const Btn=({children,variant="primary",...p})=>{
  const styles={
    primary:{background:C.tinta,color:C.dorado,border:"none"},
    ghost:{background:"transparent",color:C.tinta,border:"1.5px solid #D0C9C0"},
    danger:{background:"#2D0F0F",color:C.rojo,border:"none"},
    accent:{background:C.dorado,color:C.tinta,border:"none"},
    success:{background:"#0D2E1A",color:C.verde,border:"none"},
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
              <div key={estado} style={{background:"#21262D",borderRadius:10,padding:12}}>
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
const OPERARIOS = ["Javier","Bernal","Gabriel","Elías"];
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
          {stockBajo.length>0 && <span style={{background:"#2D1F00",color:"#B8860B",borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600}}>⚠ {stockBajo.length} items bajo mínimo</span>}
          {mantVencidos.length>0 && <span style={{background:"#2D0F0F",color:C.rojo,borderRadius:6,padding:"4px 10px",fontSize:11,fontWeight:600}}>🔧 {mantVencidos.length} mantenimientos urgentes</span>}
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
      <div style={{display:"flex",gap:6,marginBottom:16,background:"#21262D",borderRadius:8,padding:4,flexWrap:"wrap"}}>
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
                <div key={estado} style={{background:"#21262D",borderRadius:10,padding:12}}>
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
                          <button onClick={()=>iniciarTimer(t)} style={{background:"#0D2E1A",color:C.musgo,border:"none",borderRadius:4,padding:"3px 8px",fontSize:10,fontWeight:600,cursor:"pointer"}}>▶ Timer</button>
                        )}
                        <button onClick={()=>{ setForm({...t}); setModal("tarea"); }} style={{background:"#21262D",color:C.piedra,border:"none",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer"}}>✏ Editar</button>
                        {t.estado!=="Listo" && (
                          <button onClick={async()=>{ const next = ETAPAS_PROD[ETAPAS_PROD.indexOf(t.estado)+1]; if(next){ await supabase.from("tareas").update({estado:next}).eq("id",t.id); setTareas(tareas.map(x=>x.id===t.id?{...x,estado:next}:x)); } }} style={{background:"#0C2044",color:C.azul,border:"none",borderRadius:4,padding:"3px 8px",fontSize:10,fontWeight:600,cursor:"pointer"}}>→ Avanzar</button>
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
            <div style={{background:"#2D1F00",border:"1px solid #F0D080",borderRadius:8,padding:"10px 16px",marginBottom:12}}>
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

// ═══════════════════════════════════════════════════════
// RECURSO HUMANO
// ═══════════════════════════════════════════════════════
const TIPOS_DOC = ["Cédula","Contrato","CCSS","Otros"];
const ESTADOS_TRABAJADOR = ["Activo","Inactivo","Período de prueba"];

export function RecursoHumano({ supabase }) {
  const [trabajadores, setTrabajadores] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [subtab, setSubtab] = useState("equipo");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [selectedTrabajador, setSelectedTrabajador] = useState(null);
  const [loaded, setLoaded] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const fmt = n => `₡${Number(n).toLocaleString("es-CR")}`;
  const fmtDate = d => { if(!d) return ""; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };

  useState(() => {
    async function load() {
      const [t, p] = await Promise.all([
        supabase.from("trabajadores").select("*"),
        supabase.from("pagos_trabajador").select("*"),
      ]);
      setTrabajadores(t.data||[]);
      setPagos(p.data||[]);
      setLoaded(true);
    }
    load();
  }, []);

  // Horas del mes desde Supabase tiempos
  const [tiempos, setTiempos] = useState([]);
  useState(() => {
    supabase.from("tiempos").select("*").then(r => setTiempos(r.data||[]));
  }, []);

  const horasPorOperario = (nombre) => {
    const total = tiempos.filter(t => t.operario === nombre).reduce((s,t) => s+Number(t.minutos), 0);
    return Math.round(total / 60 * 10) / 10;
  };

  const pagosTrabajador = (id) => pagos.filter(p => p.trabajador_id === id);
  const totalPagado = (id) => pagosTrabajador(id).reduce((s,p) => s+Number(p.monto), 0);

  const saveTrabajador = async () => {
    if (!form.nombre) return;
    const data = {
      nombre: form.nombre, rol: form.rol||"Operario", estado: form.estado||"Activo",
      cedula: form.cedula||"", telefono: form.telefono||"", email: form.email||"",
      fecha_ingreso: form.fecha_ingreso||today, salario_base: Number(form.salario_base)||0,
      tipo_pago: form.tipo_pago||"Quincenal", banco: form.banco||"", cuenta: form.cuenta||"",
      ccss: form.ccss||"", notas: form.notas||""
    };
    if (form.id) {
      await supabase.from("trabajadores").update(data).eq("id", form.id);
      setTrabajadores(trabajadores.map(t => t.id===form.id ? {...data,id:form.id} : t));
    } else {
      const { data: newT } = await supabase.from("trabajadores").insert(data).select().single();
      setTrabajadores([...trabajadores, newT]);
    }
    setModal(null);
  };

  const savePago = async () => {
    if (!form.monto || !form.trabajador_id) return;
    const data = {
      trabajador_id: form.trabajador_id, fecha: form.fecha||today,
      monto: Number(form.monto), tipo: form.tipo||"Quincenal",
      horas_referencia: Number(form.horas_referencia)||0,
      descripcion: form.descripcion||"", periodo: form.periodo||""
    };
    if (form.id) {
      await supabase.from("pagos_trabajador").update(data).eq("id", form.id);
      setPagos(pagos.map(p => p.id===form.id ? {...data,id:form.id} : p));
    } else {
      const { data: newP } = await supabase.from("pagos_trabajador").insert(data).select().single();
      setPagos([...pagos, newP]);
    }
    setModal(null);
  };

  const SubTab = ({id,label,icon}) => (
    <button onClick={()=>setSubtab(id)} style={{padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",background:subtab===id?"#1A1714":"transparent",color:subtab===id?"#F5F0E8":"#8A8278",display:"flex",alignItems:"center",gap:5}}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );

  const totalNomina = trabajadores.filter(t=>t.estado==="Activo").reduce((s,t)=>s+Number(t.salario_base),0);
  const totalPagadoMes = pagos.filter(p=>{
    const d = new Date(p.fecha);
    const now = new Date();
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  }).reduce((s,p)=>s+Number(p.monto),0);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Georgia',serif",fontSize:20,fontWeight:700,color:"#E8E8E8"}}>Recurso Humano</div>
        <div style={{display:"flex",gap:8}}>
          {subtab==="equipo" && <button onClick={()=>{setForm({estado:"Activo",tipo_pago:"Quincenal",fecha_ingreso:today});setModal("trabajador");}} style={{background:"#21262D",color:"#C8A96E",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Trabajador</button>}
          {subtab==="pagos" && <button onClick={()=>{setForm({fecha:today,tipo:"Quincenal",trabajador_id:trabajadores[0]?.id||""});setModal("pago");}} style={{background:"#21262D",color:"#C8A96E",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Registrar pago</button>}
        </div>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[
          {l:"Equipo activo",v:trabajadores.filter(t=>t.estado==="Activo").length+" personas",c:"#1A1714"},
          {l:"Nómina base",v:fmt(totalNomina),c:"#3D5A52"},
          {l:"Pagado este mes",v:fmt(totalPagadoMes),c:"#C8A96E"},
          {l:"Horas registradas",v:tiempos.reduce((s,t)=>s+Number(t.minutos),0)/60|0+"h total",c:"#2980B9"},
        ].map(k=>(
          <div key={k.l} style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.4,fontWeight:600,marginBottom:3}}>{k.l}</div>
            <div style={{fontFamily:"'Georgia',serif",fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16,background:"#21262D",borderRadius:8,padding:4}}>
        <SubTab id="equipo" label="Equipo" icon="👤"/>
        <SubTab id="pagos" label="Pagos" icon="₡"/>
        <SubTab id="horas" label="Horas" icon="⏱"/>
      </div>

      {/* EQUIPO */}
      {subtab==="equipo" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {trabajadores.length===0 && <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:32,textAlign:"center",color:"#8B949E",fontSize:13}}>No hay trabajadores registrados</div>}
          {trabajadores.map(t => {
            const horas = horasPorOperario(t.nombre);
            const pagadoTotal = totalPagado(t.id);
            const estadoColor = t.estado==="Activo"?"#27AE60":t.estado==="Período de prueba"?"#E67E22":"#8A8278";
            return (
              <div key={t.id} style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:"16px 18px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:"#21262D",color:"#C8A96E",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700}}>
                        {t.nombre.charAt(0)}
                      </div>
                      <div>
                        <div style={{fontWeight:700,fontSize:14,color:"#E8E8E8"}}>{t.nombre}</div>
                        <div style={{fontSize:12,color:"#8B949E"}}>{t.rol}</div>
                      </div>
                      <span style={{background:t.estado==="Activo"?"#EAFAF1":t.estado==="Período de prueba"?"#FEF0E6":"#F5F0E8",color:estadoColor,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600}}>{t.estado}</span>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginTop:10}}>
                      <div style={{background:"#21262D",borderRadius:6,padding:"8px 12px"}}>
                        <div style={{fontSize:10,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.4,marginBottom:2}}>Salario base</div>
                        <div style={{fontWeight:700,color:"#E8E8E8",fontSize:13}}>{fmt(t.salario_base)}</div>
                        <div style={{fontSize:10,color:"#8B949E"}}>{t.tipo_pago}</div>
                      </div>
                      <div style={{background:"#21262D",borderRadius:6,padding:"8px 12px"}}>
                        <div style={{fontSize:10,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.4,marginBottom:2}}>Horas registradas</div>
                        <div style={{fontWeight:700,color:"#58A6FF",fontSize:13}}>{horas}h</div>
                        <div style={{fontSize:10,color:"#8B949E"}}>En el sistema</div>
                      </div>
                      <div style={{background:"#21262D",borderRadius:6,padding:"8px 12px"}}>
                        <div style={{fontSize:10,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.4,marginBottom:2}}>Total pagado</div>
                        <div style={{fontWeight:700,color:"#3D5A52",fontSize:13}}>{fmt(pagadoTotal)}</div>
                        <div style={{fontSize:10,color:"#8B949E"}}>{pagosTrabajador(t.id).length} pagos</div>
                      </div>
                    </div>
                    {t.telefono && <div style={{fontSize:11,color:"#8B949E",marginTop:8}}>📞 {t.telefono}{t.email && ` · ✉ ${t.email}`}</div>}
                    {t.fecha_ingreso && <div style={{fontSize:11,color:"#8B949E",marginTop:2}}>Ingreso: {fmtDate(t.fecha_ingreso)}{t.ccss && ` · CCSS: ${t.ccss}`}</div>}
                    {t.notas && <div style={{fontSize:11,color:"#8B949E",marginTop:4,fontStyle:"italic"}}>{t.notas}</div>}
                  </div>
                  <button onClick={()=>{setForm({...t});setModal("trabajador");}} style={{background:"none",border:"none",cursor:"pointer",color:"#8B949E",fontSize:14,marginLeft:12}}>✏</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGOS */}
      {subtab==="pagos" && (
        <div>
          <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,overflow:"hidden"}}>
            {pagos.length===0 && <div style={{padding:32,textAlign:"center",color:"#8B949E",fontSize:13}}>Sin pagos registrados</div>}
            {[...pagos].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((p,i)=>{
              const trab = trabajadores.find(t=>t.id===p.trabajador_id);
              return (
                <div key={p.id} onClick={()=>{setForm({...p});setModal("pago");}}
                  style={{padding:"12px 18px",borderBottom:i<pagos.length-1?"1px solid #F5F0E8":"none",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                  onMouseEnter={e=>e.currentTarget.style.background="#21262D"}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div>
                    <div style={{fontWeight:700,fontSize:13,color:"#E8E8E8"}}>{trab?.nombre||"—"}</div>
                    <div style={{fontSize:11,color:"#8B949E"}}>{fmtDate(p.fecha)} · {p.tipo}{p.periodo&&` · ${p.periodo}`}</div>
                    {p.horas_referencia>0 && <div style={{fontSize:11,color:"#58A6FF"}}>{p.horas_referencia}h de referencia</div>}
                    {p.descripcion && <div style={{fontSize:11,color:"#8B949E",fontStyle:"italic"}}>{p.descripcion}</div>}
                  </div>
                  <div style={{fontWeight:700,color:"#3D5A52",fontSize:15}}>{fmt(p.monto)}</div>
                </div>
              );
            })}
          </div>

          {/* Resumen por trabajador */}
          <div style={{marginTop:16,background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:16}}>
            <div style={{fontWeight:700,fontSize:13,color:"#E8E8E8",marginBottom:12}}>Resumen por trabajador</div>
            {trabajadores.map(t=>(
              <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid #21262D"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#E8E8E8"}}>{t.nombre}</div>
                  <div style={{fontSize:11,color:"#8B949E"}}>{pagosTrabajador(t.id).length} pagos registrados</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontWeight:700,color:"#3D5A52",fontSize:14}}>{fmt(totalPagado(t.id))}</div>
                  <div style={{fontSize:11,color:"#8B949E"}}>Base: {fmt(t.salario_base)}/{t.tipo_pago}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HORAS */}
      {subtab==="horas" && (
        <div>
          <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:"#E8E8E8",marginBottom:12}}>Horas por trabajador (acumulado)</div>
            {trabajadores.map(t=>{
              const horas = horasPorOperario(t.nombre);
              const registros = tiempos.filter(x=>x.operario===t.nombre);
              const maxH = Math.max(...trabajadores.map(x=>horasPorOperario(x.nombre)),1);
              return (
                <div key={t.id} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#E8E8E8"}}>{t.nombre}</span>
                    <span style={{fontSize:13,color:"#8B949E"}}>{horas}h · {registros.length} registros</span>
                  </div>
                  <div style={{background:"#30363D",borderRadius:4,height:8}}>
                    <div style={{background:"#C8A96E",width:`${Math.round(horas/maxH*100)}%`,height:"100%",borderRadius:4}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detalle de registros */}
          <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,overflow:"hidden"}}>
            <div style={{padding:"12px 18px",borderBottom:"1px solid #21262D",fontWeight:700,fontSize:13,color:"#E8E8E8"}}>Últimos registros de tiempo</div>
            {[...tiempos].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).slice(0,20).map((t,i)=>(
              <div key={t.id} style={{padding:"10px 18px",borderBottom:i<19?"1px solid #F5F0E8":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#E8E8E8"}}>{t.descripcion}</div>
                  <div style={{fontSize:11,color:"#8B949E"}}>{t.operario} · {fmtDate(t.fecha)}{t.proyecto&&` · ${t.proyecto}`}</div>
                </div>
                <div style={{fontFamily:"'Georgia',serif",fontSize:15,fontWeight:700,color:"#3D5A52"}}>{t.minutos}min</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal trabajador */}
      {modal==="trabajador" && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,23,20,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#161B22",borderRadius:12,width:"100%",maxWidth:540,maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px 14px",borderBottom:"1px solid #21262D"}}>
              <span style={{fontFamily:"'Georgia',serif",fontSize:17,fontWeight:600,color:"#E8E8E8"}}>{form.id?"Editar trabajador":"Nuevo trabajador"}</span>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#8B949E"}}>×</button>
            </div>
            <div style={{padding:"20px 24px 24px"}}>
              {[
                {l:"Nombre completo",k:"nombre",ph:"Ej: Carlos Vargas"},
                {l:"Cédula",k:"cedula",ph:"1-1234-5678"},
                {l:"Teléfono",k:"telefono",ph:"8888-1234"},
                {l:"Email",k:"email",ph:"correo@ejemplo.com"},
              ].map(f=>(
                <div key={f.k} style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{f.l}</div>
                  <input value={form[f.k]||""} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.ph} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              ))}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Rol</div>
                  <select value={form.rol||"Operario"} onChange={e=>setForm({...form,rol:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none"}}>
                    {["Operario","Ayudante","Laqueador","Instalador","Administrativo","Fundador"].map(r=><option key={r}>{r}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Estado</div>
                  <select value={form.estado||"Activo"} onChange={e=>setForm({...form,estado:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none"}}>
                    {ESTADOS_TRABAJADOR.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Salario base (₡)</div>
                  <input type="number" value={form.salario_base||""} onChange={e=>setForm({...form,salario_base:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Tipo de pago</div>
                  <select value={form.tipo_pago||"Quincenal"} onChange={e=>setForm({...form,tipo_pago:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none"}}>
                    {["Semanal","Quincenal","Mensual","Por hora","Por proyecto"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Fecha ingreso</div>
                  <input type="date" value={form.fecha_ingreso||today} onChange={e=>setForm({...form,fecha_ingreso:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>N° CCSS</div>
                  <input value={form.ccss||""} onChange={e=>setForm({...form,ccss:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Banco</div>
                  <input value={form.banco||""} onChange={e=>setForm({...form,banco:e.target.value})} placeholder="Banco Nacional, BCR..." style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>N° Cuenta</div>
                  <input value={form.cuenta||""} onChange={e=>setForm({...form,cuenta:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Notas</div>
                <textarea value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:60}}/>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                {form.id && <button onClick={async()=>{if(confirm("¿Eliminar trabajador?")){await supabase.from("trabajadores").delete().eq("id",form.id);setTrabajadores(trabajadores.filter(t=>t.id!==form.id));setModal(null);}}} style={{background:"#2D0F0F",color:"#F85149",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Eliminar</button>}
                <button onClick={()=>setModal(null)} style={{background:"transparent",color:"#E8E8E8",border:"1.5px solid #D0C9C0",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
                <button onClick={saveTrabajador} style={{background:"#21262D",color:"#C8A96E",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pago */}
      {modal==="pago" && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,23,20,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#161B22",borderRadius:12,width:"100%",maxWidth:480,maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px 14px",borderBottom:"1px solid #21262D"}}>
              <span style={{fontFamily:"'Georgia',serif",fontSize:17,fontWeight:600,color:"#E8E8E8"}}>{form.id?"Editar pago":"Registrar pago"}</span>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#8B949E"}}>×</button>
            </div>
            <div style={{padding:"20px 24px 24px"}}>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Trabajador</div>
                <select value={form.trabajador_id||""} onChange={e=>setForm({...form,trabajador_id:Number(e.target.value)})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none"}}>
                  <option value="">Seleccionar...</option>
                  {trabajadores.map(t=><option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Monto (₡)</div>
                  <input type="number" value={form.monto||""} onChange={e=>setForm({...form,monto:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Fecha</div>
                  <input type="date" value={form.fecha||today} onChange={e=>setForm({...form,fecha:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Tipo de pago</div>
                  <select value={form.tipo||"Quincenal"} onChange={e=>setForm({...form,tipo:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none"}}>
                    {["Semanal","Quincenal","Mensual","Por hora","Por proyecto","Adelanto","Liquidación"].map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Horas de referencia</div>
                  <input type="number" value={form.horas_referencia||""} onChange={e=>setForm({...form,horas_referencia:e.target.value})} placeholder="0" style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Período</div>
                <input value={form.periodo||""} onChange={e=>setForm({...form,periodo:e.target.value})} placeholder="Ej: 1-15 agosto 2026" style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Descripción</div>
                <textarea value={form.descripcion||""} onChange={e=>setForm({...form,descripcion:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:60}}/>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                {form.id && <button onClick={async()=>{if(confirm("¿Eliminar?")){await supabase.from("pagos_trabajador").delete().eq("id",form.id);setPagos(pagos.filter(p=>p.id!==form.id));setModal(null);}}} style={{background:"#2D0F0F",color:"#F85149",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Eliminar</button>}
                <button onClick={()=>setModal(null)} style={{background:"transparent",color:"#E8E8E8",border:"1.5px solid #D0C9C0",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
                <button onClick={savePago} style={{background:"#21262D",color:"#C8A96E",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MARKETING
// ═══════════════════════════════════════════════════════
const CANALES = ["Instagram","Facebook","WhatsApp","Google Ads","Referido","Feria/Evento","Web","Otro"];
const TIPOS_CAMPAÑA = ["Orgánico","Pauta pagada","Email","Evento","Contenido","Otro"];
const ESTADOS_CAMPAÑA = ["Planificada","Activa","Pausada","Finalizada"];

export function Marketing({ supabase, leads, gastos }) {
  const [campanas, setCampanas] = useState([]);
  const [subtab, setSubtab] = useState("campanas");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loaded, setLoaded] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const fmt = n => `₡${Number(n).toLocaleString("es-CR")}`;
  const fmtDate = d => { if(!d) return ""; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };

  useState(() => {
    supabase.from("campanas_marketing").select("*").then(r => {
      setCampanas(r.data||[]);
      setLoaded(true);
    });
  }, []);

  // Gastos de marketing desde contabilidad
  const gastosMarketing = gastos.filter(g => g.categoria === "Marketing");
  const totalGastosMkt = gastosMarketing.reduce((s,g) => s+Number(g.monto), 0);

  // Leads por fuente
  const leadsPorCanal = CANALES.map(canal => ({
    canal,
    total: leads.filter(l => l.fuente === canal).length,
    ganados: leads.filter(l => l.fuente === canal && l.estado === "Cerrado ganado").length,
    valor: leads.filter(l => l.fuente === canal && l.estado === "Cerrado ganado").reduce((s,l) => s+Number(l.monto_estimado||0), 0),
  })).filter(c => c.total > 0);

  const totalLeads = leads.length;
  const leadsGanados = leads.filter(l => l.estado === "Cerrado ganado").length;
  const valorGanado = leads.filter(l => l.estado === "Cerrado ganado").reduce((s,l) => s+Number(l.monto_estimado||0), 0);
  const tasaConversion = totalLeads > 0 ? Math.round(leadsGanados/totalLeads*100) : 0;
  const costoPorLead = totalLeads > 0 ? Math.round(totalGastosMkt/totalLeads) : 0;

  const saveCampana = async () => {
    if (!form.nombre) return;
    const data = {
      nombre: form.nombre, canal: form.canal||"Instagram", tipo: form.tipo||"Orgánico",
      estado: form.estado||"Planificada", objetivo: form.objetivo||"",
      presupuesto: Number(form.presupuesto)||0, gasto_real: Number(form.gasto_real)||0,
      fecha_inicio: form.fecha_inicio||today, fecha_fin: form.fecha_fin||"",
      leads_generados: Number(form.leads_generados)||0, ventas_atribuidas: Number(form.ventas_atribuidas)||0,
      notas: form.notas||""
    };
    if (form.id) {
      await supabase.from("campanas_marketing").update(data).eq("id", form.id);
      setCampanas(campanas.map(c => c.id===form.id ? {...data,id:form.id} : c));
    } else {
      const { data: newC } = await supabase.from("campanas_marketing").insert(data).select().single();
      setCampanas([...campanas, newC]);
    }
    setModal(null);
  };

  const SubTab = ({id,label,icon}) => (
    <button onClick={()=>setSubtab(id)} style={{padding:"7px 14px",borderRadius:6,fontSize:12,fontWeight:600,cursor:"pointer",border:"none",background:subtab===id?"#1A1714":"transparent",color:subtab===id?"#F5F0E8":"#8A8278",display:"flex",alignItems:"center",gap:5}}>
      <span>{icon}</span><span>{label}</span>
    </button>
  );

  const estadoColor = {
    "Activa":{"bg":"#EAFAF1","text":"#27AE60"},
    "Planificada":{"bg":"#EAF2FB","text":"#2980B9"},
    "Pausada":{"bg":"#FEF9EC","text":"#B8860B"},
    "Finalizada":{"bg":"#F5F0E8","text":"#8A8278"},
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontFamily:"'Georgia',serif",fontSize:20,fontWeight:700,color:"#E8E8E8"}}>Marketing</div>
        {subtab==="campanas" && <button onClick={()=>{setForm({estado:"Planificada",canal:"Instagram",tipo:"Orgánico",fecha_inicio:today});setModal("campana");}} style={{background:"#21262D",color:"#C8A96E",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>+ Nueva campaña</button>}
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:16}}>
        {[
          {l:"Gasto en marketing",v:fmt(totalGastosMkt),c:"#C0392B"},
          {l:"Total leads",v:totalLeads,c:"#2980B9"},
          {l:"Tasa conversión",v:tasaConversion+"%",c:"#3D5A52"},
          {l:"Costo por lead",v:costoPorLead>0?fmt(costoPorLead):"—",c:"#C8A96E"},
        ].map(k=>(
          <div key={k.l} style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.4,fontWeight:600,marginBottom:3}}>{k.l}</div>
            <div style={{fontFamily:"'Georgia',serif",fontSize:18,fontWeight:700,color:k.c}}>{k.v}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16,background:"#21262D",borderRadius:8,padding:4}}>
        <SubTab id="campanas" label="Campañas" icon="📣"/>
        <SubTab id="canales" label="Canales" icon="📊"/>
        <SubTab id="gastos" label="Gastos" icon="₡"/>
      </div>

      {/* CAMPAÑAS */}
      {subtab==="campanas" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {campanas.length===0 && <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:32,textAlign:"center",color:"#8B949E",fontSize:13}}>No hay campañas registradas</div>}
          {campanas.map(c => {
            const roi = c.gasto_real > 0 ? Math.round((c.ventas_atribuidas - c.gasto_real) / c.gasto_real * 100) : null;
            const sc = estadoColor[c.estado] || {bg:"#F5F0E8",text:"#8A8278"};
            return (
              <div key={c.id} style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:"14px 18px",cursor:"pointer"}}
                onClick={()=>{setForm({...c});setModal("campana");}}
                onMouseEnter={e=>e.currentTarget.style.borderColor="#C8A96E"}
                onMouseLeave={e=>e.currentTarget.style.borderColor="#E8E2D8"}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                  <div>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{fontWeight:700,fontSize:14,color:"#E8E8E8"}}>{c.nombre}</span>
                      <span style={{background:sc.bg,color:sc.text,borderRadius:4,padding:"2px 8px",fontSize:11,fontWeight:600}}>{c.estado}</span>
                    </div>
                    <div style={{fontSize:12,color:"#8B949E"}}>{c.canal} · {c.tipo}{c.fecha_inicio&&` · ${fmtDate(c.fecha_inicio)}`}{c.fecha_fin&&` → ${fmtDate(c.fecha_fin)}`}</div>
                    {c.objetivo && <div style={{fontSize:12,color:"#E8E8E8",marginTop:4,fontStyle:"italic"}}>{c.objetivo}</div>}
                  </div>
                  {roi !== null && (
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:10,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.4}}>ROI</div>
                      <div style={{fontFamily:"'Georgia',serif",fontSize:22,fontWeight:700,color:roi>=0?"#27AE60":"#C0392B"}}>{roi}%</div>
                    </div>
                  )}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
                  {[
                    {l:"Presupuesto",v:fmt(c.presupuesto)},
                    {l:"Gasto real",v:fmt(c.gasto_real)},
                    {l:"Leads",v:c.leads_generados},
                    {l:"Ventas atribuidas",v:fmt(c.ventas_atribuidas)},
                  ].map(k=>(
                    <div key={k.l} style={{background:"#21262D",borderRadius:6,padding:"6px 10px"}}>
                      <div style={{fontSize:9,color:"#8B949E",textTransform:"uppercase",letterSpacing:0.3,marginBottom:1}}>{k.l}</div>
                      <div style={{fontSize:13,fontWeight:700,color:"#E8E8E8"}}>{k.v}</div>
                    </div>
                  ))}
                </div>
                {c.notas && <div style={{fontSize:11,color:"#8B949E",marginTop:8,fontStyle:"italic"}}>{c.notas}</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* CANALES */}
      {subtab==="canales" && (
        <div>
          <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,padding:18,marginBottom:12}}>
            <div style={{fontWeight:700,fontSize:13,color:"#E8E8E8",marginBottom:14}}>Leads por canal de origen</div>
            {leadsPorCanal.length===0 && <div style={{color:"#8B949E",fontSize:13}}>No hay leads con canal registrado todavía</div>}
            {leadsPorCanal.sort((a,b)=>b.total-a.total).map(c => {
              const maxTotal = Math.max(...leadsPorCanal.map(x=>x.total),1);
              const convRate = c.total>0 ? Math.round(c.ganados/c.total*100) : 0;
              return (
                <div key={c.canal} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:13,fontWeight:600,color:"#E8E8E8"}}>{c.canal}</span>
                    <div style={{display:"flex",gap:16,fontSize:12,color:"#8B949E"}}>
                      <span>{c.total} leads</span>
                      <span style={{color:"#3FB950"}}>{c.ganados} ganados ({convRate}%)</span>
                      {c.valor>0 && <span style={{color:"#3D5A52",fontWeight:600}}>{fmt(c.valor)}</span>}
                    </div>
                  </div>
                  <div style={{background:"#30363D",borderRadius:4,height:8,position:"relative"}}>
                    <div style={{background:"#C8A96E",width:`${Math.round(c.total/maxTotal*100)}%`,height:"100%",borderRadius:4}}/>
                    <div style={{background:"#27AE60",width:`${Math.round(c.ganados/maxTotal*100)}%`,height:"100%",borderRadius:4,position:"absolute",top:0,opacity:0.6}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumen de conversión */}
          <div style={{background:"#21262D",borderRadius:10,padding:"16px 20px",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
            {[
              {l:"Pipeline total",v:fmt(leads.reduce((s,l)=>s+Number(l.monto_estimado||0),0)),c:"#F5F0E8"},
              {l:"Valor ganado",v:fmt(valorGanado),c:"#C8A96E"},
              {l:"Retorno sobre gasto",v:totalGastosMkt>0?`${Math.round(valorGanado/totalGastosMkt*100)}%`:"—",c:"#C8A96E"},
            ].map(k=>(
              <div key={k.l}>
                <div style={{fontSize:10,color:"rgba(245,240,232,0.4)",textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>{k.l}</div>
                <div style={{fontFamily:"'Georgia',serif",fontSize:20,fontWeight:700,color:k.c}}>{k.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GASTOS */}
      {subtab==="gastos" && (
        <div>
          <div style={{background:"#161B22",border:"1px solid #21262D",borderRadius:10,overflow:"hidden",marginBottom:12}}>
            <div style={{padding:"12px 18px",borderBottom:"1px solid #21262D",fontWeight:700,fontSize:13,color:"#E8E8E8"}}>
              Gastos de marketing — {fmt(totalGastosMkt)} total
            </div>
            {gastosMarketing.length===0 && <div style={{padding:24,color:"#8B949E",fontSize:13,textAlign:"center"}}>Sin gastos de marketing registrados. Agregálos desde el módulo de Contabilidad con categoría "Marketing".</div>}
            {[...gastosMarketing].sort((a,b)=>new Date(b.fecha)-new Date(a.fecha)).map((g,i)=>(
              <div key={g.id} style={{padding:"11px 18px",borderBottom:i<gastosMarketing.length-1?"1px solid #F5F0E8":"none",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"#E8E8E8"}}>{g.desc||g.descripcion}</div>
                  <div style={{fontSize:11,color:"#8B949E"}}>{fmtDate(g.fecha)}{g.proyecto&&` · ${g.proyecto}`}</div>
                </div>
                <div style={{fontWeight:700,color:"#F85149",fontSize:14}}>{fmt(g.monto)}</div>
              </div>
            ))}
          </div>
          <div style={{background:"#2D1F00",border:"1px solid #F0D080",borderRadius:8,padding:"10px 16px",fontSize:12,color:"#B8860B"}}>
            💡 Para agregar gastos de marketing, usá el botón <strong>+ Gasto</strong> en el módulo de Contabilidad y seleccioná la categoría <strong>Marketing</strong>.
          </div>
        </div>
      )}

      {/* Modal campaña */}
      {modal==="campana" && (
        <div style={{position:"fixed",inset:0,background:"rgba(26,23,20,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:"#161B22",borderRadius:12,width:"100%",maxWidth:540,maxHeight:"88vh",overflow:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.25)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px 14px",borderBottom:"1px solid #21262D"}}>
              <span style={{fontFamily:"'Georgia',serif",fontSize:17,fontWeight:600,color:"#E8E8E8"}}>{form.id?"Editar campaña":"Nueva campaña"}</span>
              <button onClick={()=>setModal(null)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#8B949E"}}>×</button>
            </div>
            <div style={{padding:"20px 24px 24px"}}>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Nombre de la campaña</div>
                <input value={form.nombre||""} onChange={e=>setForm({...form,nombre:e.target.value})} placeholder="Ej: Instagram Ads - Butaca julio" style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                {[
                  {l:"Canal",k:"canal",opts:CANALES},
                  {l:"Tipo",k:"tipo",opts:TIPOS_CAMPAÑA},
                  {l:"Estado",k:"estado",opts:ESTADOS_CAMPAÑA},
                ].map(f=>(
                  <div key={f.k} style={{marginBottom:14}}>
                    <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>{f.l}</div>
                    <select value={form[f.k]||f.opts[0]} onChange={e=>setForm({...form,[f.k]:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none"}}>
                      {f.opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Objetivo</div>
                <input value={form.objetivo||""} onChange={e=>setForm({...form,objetivo:e.target.value})} placeholder="Ej: Generar consultas para TV Walls" style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Fecha inicio</div>
                  <input type="date" value={form.fecha_inicio||today} onChange={e=>setForm({...form,fecha_inicio:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Fecha fin</div>
                  <input type="date" value={form.fecha_fin||""} onChange={e=>setForm({...form,fecha_fin:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Presupuesto (₡)</div>
                  <input type="number" value={form.presupuesto||""} onChange={e=>setForm({...form,presupuesto:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Gasto real (₡)</div>
                  <input type="number" value={form.gasto_real||""} onChange={e=>setForm({...form,gasto_real:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Leads generados</div>
                  <input type="number" value={form.leads_generados||""} onChange={e=>setForm({...form,leads_generados:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
                <div style={{marginBottom:14}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Ventas atribuidas (₡)</div>
                  <input type="number" value={form.ventas_atribuidas||""} onChange={e=>setForm({...form,ventas_atribuidas:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box"}}/>
                </div>
              </div>
              <div style={{marginBottom:14}}>
                <div style={{fontSize:11,fontWeight:600,color:"#8B949E",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5}}>Notas</div>
                <textarea value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})} style={{width:"100%",border:"1.5px solid #30363D",borderRadius:6,padding:"8px 10px",fontSize:13,color:"#E8E8E8",background:"#161B22",outline:"none",boxSizing:"border-box",resize:"vertical",minHeight:60}}/>
              </div>
              <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
                {form.id && <button onClick={async()=>{if(confirm("¿Eliminar?")){await supabase.from("campanas_marketing").delete().eq("id",form.id);setCampanas(campanas.filter(c=>c.id!==form.id));setModal(null);}}} style={{background:"#2D0F0F",color:"#F85149",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Eliminar</button>}
                <button onClick={()=>setModal(null)} style={{background:"transparent",color:"#E8E8E8",border:"1.5px solid #D0C9C0",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Cancelar</button>
                <button onClick={saveCampana} style={{background:"#21262D",color:"#C8A96E",border:"none",borderRadius:7,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MODO TALLER — Tablet timer simplificado
// ═══════════════════════════════════════════════════════
const PROCESOS = ["Corte CNC","Ensamble","Lijado","Laca","Instalación","Diseño","Medición","Otro"];
const OPERARIOS_TALLER = ["Javier","Bernal","Gabriel","Elías"];

export function ModoTaller({ supabase, projects }) {
  const [step, setStep] = useState("operario"); // operario → proceso → proyecto → timer
  const [operario, setOperario] = useState("");
  const [proceso, setProceso] = useState("");
  const [proyecto, setProyecto] = useState("");
  const [timerSeg, setTimerSeg] = useState(0);
  const [timerActivo, setTimerActivo] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [guardado, setGuardado] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const fmtTimer = s => `${String(Math.floor(s/3600)).padStart(2,"0")}:${String(Math.floor((s%3600)/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
  const proyectosActivos = projects.filter(p => !["Entregado","Cancelado"].includes(p.estado));

  const iniciar = () => {
    setTimerActivo(true);
    setGuardado(false);
    const id = setInterval(() => setTimerSeg(s => s+1), 1000);
    setIntervalId(id);
  };

  const detener = async () => {
    clearInterval(intervalId);
    setTimerActivo(false);
    const mins = Math.round(timerSeg/60);
    await supabase.from("tiempos").insert({
      operario, descripcion: proceso, proyecto, minutos: mins, fecha: today
    });
    setGuardado(true);
    setTimerSeg(0);
  };

  const reset = () => {
    setStep("operario");
    setOperario(""); setProceso(""); setProyecto("");
    setTimerSeg(0); setGuardado(false);
  };

  const BtnGrande = ({ label, onClick, color, icon }) => (
    <button onClick={onClick} style={{
      background: color||"#161B22", border:"2px solid #30363D", borderRadius:14,
      padding:"24px 16px", fontSize:16, fontWeight:700, color:"#E8E8E8",
      cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center",
      gap:8, transition:"all 0.15s", width:"100%"
    }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor="#C8A96E"; e.currentTarget.style.background="#21262D"; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor="#30363D"; e.currentTarget.style.background=color||"#161B22"; }}
    >
      {icon && <span style={{ fontSize:28 }}>{icon}</span>}
      {label}
    </button>
  );

  return (
    <div style={{ maxWidth:600, margin:"0 auto" }}>
      <div style={{ fontFamily:"'Georgia',serif", fontSize:20, fontWeight:700, color:"#E8E8E8", marginBottom:6 }}>⏱ Modo Taller</div>
      <div style={{ color:"#8B949E", fontSize:13, marginBottom:24 }}>Tablet dedicado para registrar tiempos</div>

      {/* Progress */}
      <div style={{ display:"flex", gap:8, marginBottom:24 }}>
        {["operario","proceso","proyecto","timer"].map((s,i) => (
          <div key={s} style={{ flex:1, height:4, borderRadius:2, background: ["operario","proceso","proyecto","timer"].indexOf(step) >= i ? "#C8A96E" : "#21262D" }} />
        ))}
      </div>

      {/* Step 1 — Operario */}
      {step==="operario" && (
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"#E8E8E8", marginBottom:20, textAlign:"center" }}>¿Quién sos?</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {OPERARIOS_TALLER.map(op => (
              <BtnGrande key={op} label={op} icon="👤" onClick={()=>{ setOperario(op); setStep("proceso"); }} />
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Proceso */}
      {step==="proceso" && (
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"#E8E8E8", marginBottom:4, textAlign:"center" }}>¿Qué tarea?</div>
          <div style={{ color:"#8B949E", fontSize:13, textAlign:"center", marginBottom:20 }}>{operario}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {PROCESOS.map(p => (
              <BtnGrande key={p} label={p} onClick={()=>{ setProceso(p); setStep("proyecto"); }} />
            ))}
          </div>
          <button onClick={()=>setStep("operario")} style={{ marginTop:16, background:"transparent", border:"1px solid #30363D", borderRadius:8, padding:"10px 20px", color:"#8B949E", cursor:"pointer", width:"100%" }}>← Volver</button>
        </div>
      )}

      {/* Step 3 — Proyecto */}
      {step==="proyecto" && (
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"#E8E8E8", marginBottom:4, textAlign:"center" }}>¿Para qué proyecto?</div>
          <div style={{ color:"#8B949E", fontSize:13, textAlign:"center", marginBottom:20 }}>{operario} · {proceso}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {proyectosActivos.map(p => (
              <button key={p.id} onClick={()=>{ setProyecto(p.nombre); setStep("timer"); }}
                style={{ background:"#161B22", border:"2px solid #30363D", borderRadius:12, padding:"16px 20px", fontSize:14, fontWeight:600, color:"#E8E8E8", cursor:"pointer", textAlign:"left" }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor="#C8A96E"; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor="#30363D"; }}>
                {p.nombre} <span style={{ color:"#8B949E", fontWeight:400, fontSize:12 }}>· {p.cliente}</span>
              </button>
            ))}
            <button onClick={()=>{ setProyecto("General"); setStep("timer"); }}
              style={{ background:"#21262D", border:"2px dashed #30363D", borderRadius:12, padding:"14px 20px", fontSize:14, color:"#8B949E", cursor:"pointer" }}>
              Sin proyecto específico
            </button>
          </div>
          <button onClick={()=>setStep("proceso")} style={{ marginTop:16, background:"transparent", border:"1px solid #30363D", borderRadius:8, padding:"10px 20px", color:"#8B949E", cursor:"pointer", width:"100%" }}>← Volver</button>
        </div>
      )}

      {/* Step 4 — Timer */}
      {step==="timer" && (
        <div style={{ textAlign:"center" }}>
          <div style={{ color:"#8B949E", fontSize:13, marginBottom:8 }}>{operario} · {proceso}</div>
          <div style={{ color:"#C8A96E", fontSize:12, marginBottom:24 }}>{proyecto}</div>

          <div style={{ fontFamily:"'Georgia',serif", fontSize:72, fontWeight:700, color:"#E8E8E8", letterSpacing:4, marginBottom:32 }}>
            {fmtTimer(timerSeg)}
          </div>

          {guardado && (
            <div style={{ background:"#0D2E1A", border:"1px solid #3FB950", borderRadius:8, padding:"12px 20px", marginBottom:20, color:"#3FB950", fontSize:14, fontWeight:600 }}>
              ✅ Guardado — {Math.round(timerSeg/60)} minutos registrados
            </div>
          )}

          {!timerActivo && !guardado && (
            <button onClick={iniciar} style={{ background:"#3FB950", border:"none", borderRadius:14, padding:"20px 60px", fontSize:20, fontWeight:700, color:"#0D1117", cursor:"pointer", width:"100%", marginBottom:12 }}>
              ▶ INICIAR
            </button>
          )}
          {timerActivo && (
            <button onClick={detener} style={{ background:"#F85149", border:"none", borderRadius:14, padding:"20px 60px", fontSize:20, fontWeight:700, color:"white", cursor:"pointer", width:"100%", marginBottom:12 }}>
              ■ DETENER Y GUARDAR
            </button>
          )}
          {guardado && (
            <div style={{ display:"flex", gap:12 }}>
              <button onClick={()=>{ setTimerSeg(0); setGuardado(false); iniciar(); }}
                style={{ flex:1, background:"#21262D", border:"1px solid #30363D", borderRadius:10, padding:"14px", fontSize:14, fontWeight:600, color:"#E8E8E8", cursor:"pointer" }}>
                ▶ Nueva tarea igual
              </button>
              <button onClick={reset}
                style={{ flex:1, background:"#C8A96E", border:"none", borderRadius:10, padding:"14px", fontSize:14, fontWeight:700, color:"#0D1117", cursor:"pointer" }}>
                ✓ Terminar
              </button>
            </div>
          )}
          {!timerActivo && !guardado && (
            <button onClick={()=>setStep("proyecto")} style={{ marginTop:12, background:"transparent", border:"1px solid #30363D", borderRadius:8, padding:"10px 20px", color:"#8B949E", cursor:"pointer", width:"100%" }}>← Volver</button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// BIBLIOTECA DE PROCEDIMIENTOS
// ═══════════════════════════════════════════════════════
const CATS_BIBLIOTECA = ["Manufactura","Operativo","Materiales y Acabados","Administrativo","Seguridad"];

export function Biblioteca({ supabase }) {
  const [docs, setDocs] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [filtro, setFiltro] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [detalle, setDetalle] = useState(null);

  useState(() => {
    supabase.from("biblioteca").select("*").then(r => setDocs(r.data||[]));
  }, []);

  const filtrados = docs.filter(d => {
    const matchCat = filtro==="Todos" || d.categoria===filtro;
    const matchBusq = !busqueda || d.titulo.toLowerCase().includes(busqueda.toLowerCase()) || (d.descripcion||"").toLowerCase().includes(busqueda.toLowerCase());
    return matchCat && matchBusq;
  }).sort((a,b) => a.titulo.localeCompare(b.titulo));

  const save = async () => {
    if (!form.titulo) return;
    const data = { titulo:form.titulo, categoria:form.categoria||"Manufactura", descripcion:form.descripcion||"", pasos:form.pasos||"", notas:form.notas||"", version:form.version||"1.0" };
    if (form.id) {
      await supabase.from("biblioteca").update(data).eq("id",form.id);
      setDocs(docs.map(d=>d.id===form.id?{...data,id:form.id}:d));
    } else {
      const { data: newD } = await supabase.from("biblioteca").insert(data).select().single();
      setDocs([...docs, newD]);
    }
    setModal(null);
  };

  const catColor = { "Manufactura":"#58A6FF","Operativo":"#C8A96E","Materiales y Acabados":"#3FB950","Administrativo":"#BC8CFF","Seguridad":"#F85149" };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontFamily:"'Georgia',serif", fontSize:20, fontWeight:700, color:"#E8E8E8" }}>📚 Biblioteca</div>
        <button onClick={()=>{ setForm({categoria:"Manufactura",version:"1.0"}); setModal("nuevo"); }}
          style={{ background:"#21262D", color:"#E8E8E8", border:"1px solid #30363D", borderRadius:7, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>
          + Nuevo procedimiento
        </button>
      </div>

      {/* Buscador */}
      <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar procedimiento..."
        style={{ width:"100%", background:"#161B22", border:"1px solid #30363D", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#E8E8E8", outline:"none", marginBottom:14, boxSizing:"border-box" }} />

      {/* Filtros por categoría */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" }}>
        {["Todos",...CATS_BIBLIOTECA].map(c=>(
          <button key={c} onClick={()=>setFiltro(c)} style={{ padding:"5px 12px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1.5px solid ${filtro===c?"#C8A96E":"#30363D"}`, background:filtro===c?"#2D1F00":"transparent", color:filtro===c?"#C8A96E":"#8B949E" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtrados.length===0 && (
        <div style={{ background:"#161B22", border:"1px solid #21262D", borderRadius:10, padding:40, textAlign:"center", color:"#8B949E" }}>
          {docs.length===0 ? "La biblioteca está vacía. Agregá el primer procedimiento." : "Sin resultados para esta búsqueda."}
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
        {filtrados.map(d=>(
          <div key={d.id} style={{ background:"#161B22", border:"1px solid #21262D", borderRadius:10, padding:"14px 16px", cursor:"pointer", borderLeft:`3px solid ${catColor[d.categoria]||"#30363D"}` }}
            onClick={()=>setDetalle(d)}
            onMouseEnter={e=>e.currentTarget.style.borderColor="#30363D"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="#21262D"}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
              <span style={{ fontWeight:700, fontSize:13, color:"#E8E8E8" }}>{d.titulo}</span>
              <button onClick={e=>{ e.stopPropagation(); setForm({...d}); setModal("nuevo"); }}
                style={{ background:"none", border:"none", cursor:"pointer", color:"#8B949E", fontSize:12 }}>✏</button>
            </div>
            <div style={{ fontSize:11, color:catColor[d.categoria]||"#8B949E", fontWeight:600, marginBottom:4 }}>{d.categoria}</div>
            {d.descripcion && <div style={{ fontSize:12, color:"#8B949E", lineHeight:1.4 }}>{d.descripcion.slice(0,80)}{d.descripcion.length>80?"...":""}</div>}
            {d.version && <div style={{ fontSize:10, color:"#30363D", marginTop:6 }}>v{d.version}</div>}
          </div>
        ))}
      </div>

      {/* Modal detalle */}
      {detalle && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:12, width:"100%", maxWidth:600, maxHeight:"88vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px 14px", borderBottom:"1px solid #21262D" }}>
              <div>
                <div style={{ fontFamily:"'Georgia',serif", fontSize:17, fontWeight:600, color:"#E8E8E8" }}>{detalle.titulo}</div>
                <div style={{ fontSize:11, color:catColor[detalle.categoria]||"#8B949E", fontWeight:600, marginTop:2 }}>{detalle.categoria} · v{detalle.version}</div>
              </div>
              <button onClick={()=>setDetalle(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#8B949E" }}>×</button>
            </div>
            <div style={{ padding:"20px 24px 24px" }}>
              {detalle.descripcion && <div style={{ color:"#E8E8E8", fontSize:13, lineHeight:1.6, marginBottom:16 }}>{detalle.descripcion}</div>}
              {detalle.pasos && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#8B949E", textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>Pasos</div>
                  {detalle.pasos.split("\n").filter(Boolean).map((paso,i)=>(
                    <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                      <span style={{ width:22, height:22, borderRadius:"50%", background:"#21262D", color:"#C8A96E", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</span>
                      <span style={{ fontSize:13, color:"#E8E8E8", lineHeight:1.5 }}>{paso}</span>
                    </div>
                  ))}
                </div>
              )}
              {detalle.notas && (
                <div style={{ background:"#21262D", borderRadius:8, padding:"12px 14px", borderLeft:"3px solid #C8A96E" }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#C8A96E", marginBottom:4 }}>NOTAS</div>
                  <div style={{ fontSize:12, color:"#8B949E" }}>{detalle.notas}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo/editar */}
      {modal==="nuevo" && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"#161B22", border:"1px solid #30363D", borderRadius:12, width:"100%", maxWidth:560, maxHeight:"88vh", overflow:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px 14px", borderBottom:"1px solid #21262D" }}>
              <span style={{ fontFamily:"'Georgia',serif", fontSize:17, fontWeight:600, color:"#E8E8E8" }}>{form.id?"Editar procedimiento":"Nuevo procedimiento"}</span>
              <button onClick={()=>setModal(null)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:20, color:"#8B949E" }}>×</button>
            </div>
            <div style={{ padding:"20px 24px 24px" }}>
              {[{l:"Título",k:"titulo",ph:"Ej: Proceso de lacado en MDF"}].map(f=>(
                <div key={f.k} style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:"#8B949E", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>{f.l}</div>
                  <input value={form[f.k]||""} onChange={e=>setForm({...form,[f.k]:e.target.value})} placeholder={f.ph}
                    style={{ width:"100%", border:"1.5px solid #30363D", borderRadius:6, padding:"8px 10px", fontSize:13, color:"#E8E8E8", background:"#21262D", outline:"none", boxSizing:"border-box" }}/>
                </div>
              ))}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"#8B949E", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>Categoría</div>
                  <select value={form.categoria||"Manufactura"} onChange={e=>setForm({...form,categoria:e.target.value})}
                    style={{ width:"100%", border:"1.5px solid #30363D", borderRadius:6, padding:"8px 10px", fontSize:13, color:"#E8E8E8", background:"#21262D", outline:"none" }}>
                    {CATS_BIBLIOTECA.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:600, color:"#8B949E", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>Versión</div>
                  <input value={form.version||"1.0"} onChange={e=>setForm({...form,version:e.target.value})}
                    style={{ width:"100%", border:"1.5px solid #30363D", borderRadius:6, padding:"8px 10px", fontSize:13, color:"#E8E8E8", background:"#21262D", outline:"none", boxSizing:"border-box" }}/>
                </div>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#8B949E", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>Descripción</div>
                <textarea value={form.descripcion||""} onChange={e=>setForm({...form,descripcion:e.target.value})} placeholder="¿Para qué sirve este procedimiento?"
                  style={{ width:"100%", border:"1.5px solid #30363D", borderRadius:6, padding:"8px 10px", fontSize:13, color:"#E8E8E8", background:"#21262D", outline:"none", boxSizing:"border-box", resize:"vertical", minHeight:70 }}/>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#8B949E", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>Pasos (uno por línea)</div>
                <textarea value={form.pasos||""} onChange={e=>setForm({...form,pasos:e.target.value})} placeholder={"Limpiar la superficie\nAplicar sellador\nLijar con lija 220\nAplicar primera mano de laca"}
                  style={{ width:"100%", border:"1.5px solid #30363D", borderRadius:6, padding:"8px 10px", fontSize:13, color:"#E8E8E8", background:"#21262D", outline:"none", boxSizing:"border-box", resize:"vertical", minHeight:120 }}/>
              </div>
              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"#8B949E", marginBottom:4, textTransform:"uppercase", letterSpacing:0.5 }}>Notas importantes</div>
                <textarea value={form.notas||""} onChange={e=>setForm({...form,notas:e.target.value})}
                  style={{ width:"100%", border:"1.5px solid #30363D", borderRadius:6, padding:"8px 10px", fontSize:13, color:"#E8E8E8", background:"#21262D", outline:"none", boxSizing:"border-box", resize:"vertical", minHeight:60 }}/>
              </div>
              <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
                {form.id && <button onClick={async()=>{ if(confirm("¿Eliminar?")){await supabase.from("biblioteca").delete().eq("id",form.id); setDocs(docs.filter(d=>d.id!==form.id)); setModal(null); } }}
                  style={{ background:"#2D0F0F", color:"#F85149", border:"none", borderRadius:7, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Eliminar</button>}
                <button onClick={()=>setModal(null)} style={{ background:"transparent", color:"#E8E8E8", border:"1.5px solid #30363D", borderRadius:7, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Cancelar</button>
                <button onClick={save} style={{ background:"#21262D", color:"#E8E8E8", border:"1px solid #30363D", borderRadius:7, padding:"9px 18px", fontSize:13, fontWeight:600, cursor:"pointer" }}>Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
