import { useState } from 'react'
import {
  Activity, Archive, ArrowRight, Bell, Boxes, Building2, Calculator,
  Check, ChevronDown, CircleHelp, ClipboardList, Cog, Factory, FilePlus2,
  LayoutDashboard, LogOut, Menu, Package, Plus, Search, Settings, ShieldCheck,
  Truck, UserRound, Users, X
} from 'lucide-react'

type Role = 'vendedor' | 'administrador'
type Section = 'inicio' | 'cotizador' | 'clientes' | 'usuarios' | 'materiales' | 'precios' | 'configuracion'

const navItems = [
  { id: 'inicio' as Section, label: 'Inicio', icon: LayoutDashboard },
  { id: 'cotizador' as Section, label: 'Cotizador', icon: Calculator },
  { id: 'clientes' as Section, label: 'Clientes', icon: Building2 }
]
const adminItems = [
  { id: 'usuarios' as Section, label: 'Usuarios', icon: Users },
  { id: 'materiales' as Section, label: 'Materiales', icon: Boxes },
  { id: 'precios' as Section, label: 'Precios', icon: Archive },
  { id: 'configuracion' as Section, label: 'Configuración', icon: Settings }
]

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState<Role>('vendedor')
  const [section, setSection] = useState<Section>('inicio')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [search, setSearch] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)

  const login = (event: React.FormEvent) => {
    event.preventDefault()
    setLoggedIn(true)
    setSection('inicio')
  }
  const title = [...navItems, ...adminItems].find(item => item.id === section)?.label ?? 'Inicio'

  if (!loggedIn) return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="brand-mark"><Truck size={31} strokeWidth={2.2} /></div>
        <div className="brand-copy"><span>CONVEYOR</span><b>QUOTE</b></div>
        <div className="brand-message">
          <span className="eyebrow">GESTIÓN DE PROYECTOS</span>
          <h1>Cotiza con precisión.<br /><em>Construye confianza.</em></h1>
          <p>Centraliza tus clientes, materiales y cotizaciones de sistemas transportadores en un solo lugar.</p>
        </div>
        <div className="brand-footer"><span>PLATAFORMA DE COTIZACIÓN</span><span>VERSIÓN 0.1</span></div>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={login}>
          <div className="mobile-brand"><div className="brand-mark"><Truck size={25}/></div><b>CONVEYOR<span>QUOTE</span></b></div>
          <span className="eyebrow">BIENVENIDO DE NUEVO</span>
          <h2>Iniciar sesión</h2>
          <p className="muted">Ingresa tus datos para continuar.</p>
          <label>Correo electrónico</label>
          <div className="field"><UserRound size={18}/><input type="email" placeholder="nombre@empresa.com" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
          <label>Contraseña</label>
          <div className="field"><ShieldCheck size={18}/><input type="password" placeholder="Ingresa tu contraseña" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          <div className="login-options"><label className="remember"><input type="checkbox"/> Recordarme</label><a href="#ayuda" onClick={e=>e.preventDefault()}>¿Olvidaste tu contraseña?</a></div>
          <button className="primary full" type="submit">Entrar <ArrowRight size={18}/></button>
          <div className="demo-note"><span className="demo-dot"/> Prototipo visual · acceso de demostración</div>
          <div className="role-demo"><span>Vista de demostración:</span><select value={role} onChange={e=>setRole(e.target.value as Role)}><option value="vendedor">Vendedor</option><option value="administrador">Administrador</option></select></div>
        </form>
        <span className="login-legal">© 2026 ConveyorQuote · Todos los derechos reservados</span>
      </section>
    </main>
  )

  const SidebarLink = ({item}: {item: typeof navItems[number]}) => {
    const Icon = item.icon
    return <button className={section===item.id?'nav-link active':'nav-link'} onClick={()=>{setSection(item.id);setMobileOpen(false)}}><Icon size={19}/><span>{item.label}</span>{section===item.id&&<span className="active-bar"/>}</button>
  }

  return (
    <div className="app-shell">
      {mobileOpen && <button className="scrim" onClick={()=>setMobileOpen(false)} aria-label="Cerrar menú"/>}
      <aside className={mobileOpen?'sidebar open':'sidebar'}>
        <div className="side-brand"><div className="brand-mark small"><Truck size={23}/></div><div><b>CONVEYOR<span>QUOTE</span></b><small>COTIZADOR DE EQUIPOS</small></div><button className="close-menu" onClick={()=>setMobileOpen(false)}><X/></button></div>
        <div className="workspace"><span className="workspace-icon"><Factory size={17}/></span><div><b>Área de trabajo</b><small>Conveyors</small></div><ChevronDown size={15}/></div>
        <div className="nav-caption">MENÚ PRINCIPAL</div>
        <nav>{navItems.map(item=><SidebarLink key={item.id} item={item}/>)}</nav>
        {role==='administrador'&&<><div className="nav-caption admin-caption">ADMINISTRACIÓN</div><nav>{adminItems.map(item=><SidebarLink key={item.id} item={item}/>)}</nav></>}
        <div className="sidebar-bottom"><div className="help-card"><CircleHelp size={19}/><div><b>¿Necesitas ayuda?</b><small>Consulta la guía de uso</small></div><ArrowRight size={15}/></div><div className="user-mini"><div className="avatar">{role==='administrador'?'AD':'VE'}</div><div><b>{role==='administrador'?'Administrador':'Vendedor Demo'}</b><small>{role==='administrador'?'Administrador':'Ventas'}</small></div><button onClick={()=>setLoggedIn(false)} title="Cerrar sesión"><LogOut size={18}/></button></div></div>
      </aside>
      <main className="main-area">
        <header className="topbar"><button className="menu-button" onClick={()=>setMobileOpen(true)}><Menu/></button><div className="breadcrumb">ConveyorQuote <span>/</span> <b>{title}</b></div><div className="top-actions"><span className="environment"><i/> Prototipo</span><button className="icon-button" aria-label="Notificaciones"><Bell size={19}/><i/></button><div className="top-avatar">{role==='administrador'?'AD':'VE'}</div></div></header>
        <div className="page-content">
          {section==='inicio'&&<><div className="page-heading"><div><span className="eyebrow">PANEL GENERAL</span><h1>¡Hola, {role==='administrador'?'Administrador':'bienvenido'}! <span>👋</span></h1><p className="muted">Aquí tienes un resumen de tu espacio de trabajo.</p></div><button className="primary" onClick={()=>setSection('cotizador')}><Plus size={18}/> Nueva cotización</button></div>
            <div className="stats-grid"><Stat icon={ClipboardList} label="Cotizaciones" value="—" note="Aún sin registros"/><Stat icon={Building2} label="Clientes" value="—" note="Aún sin registros"/><Stat icon={Package} label="Materiales" value="—" note="Catálogo pendiente"/><Stat icon={Activity} label="Actividad" value="—" note="Sin actividad reciente"/></div>
            <div className="content-grid"><section className="panel welcome-panel"><div className="welcome-icon"><Calculator size={25}/></div><span className="eyebrow">COMIENZA A TRABAJAR</span><h2>Prepara tu primera cotización</h2><p>Registra los datos de tu cliente y comienza a configurar un proyecto de conveyor.</p><button className="primary" onClick={()=>setSection('cotizador')}>Ir al cotizador <ArrowRight size={17}/></button><div className="welcome-art"><div className="belt"><span/><span/><span/><span/><span/><span/></div><div className="belt-legs"/></div></section>
            <section className="panel quick-panel"><div className="panel-heading"><div><h3>Accesos rápidos</h3><p className="muted">Atajos a tus herramientas</p></div><span className="subtle-icon"><LayoutDashboard size={18}/></span></div><QuickLink icon={FilePlus2} title="Nueva cotización" desc="Configurar un nuevo proyecto" onClick={()=>setSection('cotizador')}/><QuickLink icon={Building2} title="Agregar cliente" desc="Registrar un nuevo cliente" onClick={()=>{setSection('clientes');setShowNewClient(true)}}/><QuickLink icon={Boxes} title="Consultar materiales" desc="Ver catálogo de materiales" onClick={()=>setSection(role==='administrador'?'materiales':'cotizador')}/></section></div>
          </>}
          {section==='cotizador'&&<><PageTitle eyebrow="VENTAS" title="Cotizador" desc="Crea y administra cotizaciones de sistemas transportadores." action={<button className="primary" disabled><Plus size={18}/> Nueva cotización</button>}/><div className="empty-state panel"><div className="empty-icon"><Calculator size={28}/></div><h2>Módulo de cotización</h2><p>La interfaz está preparada. En la siguiente etapa conectaremos los modelos de conveyors y sus cálculos de costos.</p><span className="status-pill">En preparación</span></div></>}
          {section==='clientes'&&<><PageTitle eyebrow="DIRECTORIO" title="Clientes" desc="Administra la información de tus clientes." action={<button className="primary" onClick={()=>setShowNewClient(true)}><Plus size={18}/> Agregar cliente</button>}/><section className="panel table-panel"><div className="table-toolbar"><div className="search-field"><Search size={17}/><input placeholder="Buscar cliente..." value={search} onChange={e=>setSearch(e.target.value)}/></div><span className="muted small-text">0 clientes registrados</span></div><EmptyTable icon={Users} title="Todavía no hay clientes" desc="Agrega tu primer cliente para tener su información disponible al cotizar."/></section></>}
          {['usuarios','materiales','precios','configuracion'].includes(section)&&<><PageTitle eyebrow="ADMINISTRACIÓN" title={title} desc={section==='usuarios'?'Gestiona los accesos y roles de los usuarios.':section==='materiales'?'Administra el catálogo de materiales disponibles.':section==='precios'?'Define y actualiza los precios de compra.':'Configura las preferencias generales de la plataforma.'}/><div className="empty-state panel"><div className="empty-icon"><Cog size={28}/></div><h2>Módulo en preparación</h2><p>Esta sección forma parte de la estructura inicial. Su funcionalidad se desarrollará en una etapa posterior.</p><span className="status-pill">Interfaz inicial</span></div></>}
        </div>
        <footer className="footer"><span>CONVEYORQUOTE <b>·</b> Plataforma de cotización</span><span>Versión 0.1.0 <b>·</b> Prototipo visual</span></footer>
      </main>
      {showNewClient&&<div className="modal-backdrop" onClick={()=>setShowNewClient(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">DIRECTORIO</span><h2>Agregar cliente</h2></div><button className="icon-button" onClick={()=>setShowNewClient(false)}><X/></button></div><p className="muted">El formulario de registro se habilitará cuando conectemos el almacenamiento de clientes.</p><div className="notice"><ShieldCheck size={19}/> Los datos aún no se guardan en esta versión de demostración.</div><button className="primary full" onClick={()=>setShowNewClient(false)}>Entendido <Check size={17}/></button></div></div>}
    </div>
  )
}

function Stat({icon:Icon,label,value,note}:{icon:React.ElementType,label:string,value:string,note:string}){return <div className="stat-card"><div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={18}/></span></div><strong>{value}</strong><small>{note}</small></div>}
function QuickLink({icon:Icon,title,desc,onClick}:{icon:React.ElementType,title:string,desc:string,onClick:()=>void}){return <button className="quick-link" onClick={onClick}><span className="quick-icon"><Icon size={19}/></span><span><b>{title}</b><small>{desc}</small></span><ArrowRight size={17}/></button>}
function PageTitle({eyebrow,title,desc,action}:{eyebrow:string,title:string,desc:string,action?:React.ReactNode}){return <div className="page-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="muted">{desc}</p></div>{action}</div>}
function EmptyTable({icon:Icon,title,desc}:{icon:React.ElementType,title:string,desc:string}){return <div className="table-empty"><span><Icon size={25}/></span><b>{title}</b><p>{desc}</p></div>}

export default App