import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Archive, ArrowRight, Bell, Boxes, Building2, Calculator, Layers3,
  Check, ChevronDown, CircleHelp, ClipboardList, Cog, Factory, FilePlus2,
  LayoutDashboard, LogOut, Menu, Package, Plus, Search, Settings,
  ShieldCheck, Truck, UserRound, Users, X
} from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import ModularBeltConveyor from './components/ModularBeltConveyor';
import { isSupabaseConfigured, supabase } from './lib/supabase';

type Role = 'vendedor' | 'administrador';
type Page = 'inicio' | 'cotizador' | 'clientes' | 'usuarios' | 'materiales' | 'precios' | 'configuracion' | 'banda-modular';
type Profile = { role: Role; full_name: string | null };
type UserRecord = { id: string; email: string | null; full_name: string | null; role: Role; created_at: string };
type Material = { id: string; name: string; category: string; sku: string | null; unit: string; supplier: string | null; unit_price: number; currency: 'MXN' | 'USD'; active: boolean; notes: string | null };
type Client = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  tax_id: string | null;
  created_at: string;
};

const base = [
  ['inicio', 'Inicio', LayoutDashboard],
  ['cotizador', 'Cotizador', Calculator],
  ['banda-modular', 'Banda modular', Layers3],
  ['clientes', 'Clientes', Building2],
] as const;
const admin = [
  ['usuarios', 'Usuarios', Users],
  ['materiales', 'Materiales', Boxes],
  ['precios', 'Precios', Archive],
  ['configuracion', 'Configuración', Settings],
] as const;

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [page, setPage] = useState<Page>('inicio');
  const [mobile, setMobile] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialModal, setMaterialModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialName, setMaterialName] = useState('');
  const [materialCategory, setMaterialCategory] = useState('Estructura');
  const [materialSku, setMaterialSku] = useState('');
  const [materialUnit, setMaterialUnit] = useState('pieza');
  const [materialSupplier, setMaterialSupplier] = useState('');
  const [materialPrice, setMaterialPrice] = useState('0');
  const [materialCurrency, setMaterialCurrency] = useState<'MXN' | 'USD'>('MXN');
  const [materialNotes, setMaterialNotes] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');

  const role = profile?.role;
  const title = [...base, ...(role === 'administrador' ? admin : [])].find(item => item[0] === page)?.[1] || 'Inicio';

  useEffect(() => {
    if (!supabase) {
      setProfileLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setSession(data.session);
    }).finally(() => setProfileLoading(false));

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setError('');
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!supabase || !session?.user) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();
      if (!active) return;
      if (profileError) {
        setProfile(null);
        setError('No se pudo cargar tu perfil. Verifica que ejecutaste la migración SQL en Supabase.');
      } else {
        setProfile(data as Profile);
        setError('');
      }
      setProfileLoading(false);
    }
    void loadProfile();
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    let active = true;
    async function loadClients() {
      if (!supabase || !session || !profile || (page !== 'clientes' && page !== 'inicio')) return;
      setClientsLoading(true);
      const { data, error: clientsError } = await supabase
        .from('clients')
        .select('id, company_name, contact_name, email, phone, tax_id, created_at')
        .order('company_name', { ascending: true });
      if (!active) return;
      if (clientsError) setError('No se pudieron cargar los clientes: ' + clientsError.message);
      else setClients(data as Client[]);
      setClientsLoading(false);
    }
    void loadClients();
    return () => { active = false; };
  }, [session, profile, page]);

  useEffect(() => {
    let active = true;
    async function loadMaterials() {
      if (!supabase || !session || !profile || !['materiales', 'precios'].includes(page)) return;
      setMaterialsLoading(true);
      const { data, error: materialsError } = await supabase.from('materials').select('id, name, category, sku, unit, supplier, unit_price, currency, active, notes').order('name');
      if (!active) return;
      if (materialsError) setError('No se pudo cargar el catálogo. Si aún no ejecutaste la migración de materiales, aplícala en Supabase. Detalle: ' + materialsError.message);
      else setMaterials((data || []) as Material[]);
      setMaterialsLoading(false);
    }
    void loadMaterials();
    return () => { active = false; };
  }, [session, profile, page]);

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      if (!supabase || !session || role !== 'administrador' || page !== 'usuarios') return;
      setUsersLoading(true);
      const { data, error: usersError } = await supabase.from('profiles').select('id, email, full_name, role, created_at').order('created_at', { ascending: false });
      if (!active) return;
      if (usersError) setError('No se pudieron cargar los usuarios: ' + usersError.message);
      else setUsers((data || []) as UserRecord[]);
      setUsersLoading(false);
    }
    void loadUsers();
    return () => { active = false; };
  }, [session, role, page]);

  const filteredMaterials = useMemo(() => {
    const term = materialSearch.trim().toLocaleLowerCase();
    return materials.filter(item => [item.name, item.category, item.sku, item.supplier].some(value => value?.toLocaleLowerCase().includes(term)));
  }, [materials, materialSearch]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return clients;
    return clients.filter(client =>
      [client.company_name, client.contact_name, client.email, client.phone, client.tax_id]
        .some(value => value?.toLocaleLowerCase().includes(term))
    );
  }, [clients, search]);

  function openMaterial(material?: Material) {
    setEditingMaterial(material || null);
    setMaterialName(material?.name || '');
    setMaterialCategory(material?.category || 'Estructura');
    setMaterialSku(material?.sku || '');
    setMaterialUnit(material?.unit || 'pieza');
    setMaterialSupplier(material?.supplier || '');
    setMaterialPrice(String(material?.unit_price ?? 0));
    setMaterialCurrency(material?.currency || 'MXN');
    setMaterialNotes(material?.notes || '');
    setMaterialModal(true);
  }

  async function handleSaveMaterial(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !session?.user || !materialName.trim()) return;
    const price = Number(materialPrice);
    if (!Number.isFinite(price) || price < 0) { setError('Ingresa un precio válido mayor o igual a cero.'); return; }
    setBusy(true); setError('');
    const values = { name: materialName.trim(), category: materialCategory, sku: materialSku.trim() || null, unit: materialUnit.trim(), supplier: materialSupplier.trim() || null, unit_price: price, currency: materialCurrency, notes: materialNotes.trim() || null };
    const query = editingMaterial
      ? supabase.from('materials').update(values).eq('id', editingMaterial.id)
      : supabase.from('materials').insert({ ...values, created_by: session.user.id });
    const { error: saveError } = await query;
    if (saveError) setError('No se pudo guardar el material: ' + saveError.message);
    else {
      const { data } = await supabase.from('materials').select('id, name, category, sku, unit, supplier, unit_price, currency, active, notes').order('name');
      if (data) setMaterials(data as Material[]);
      setMaterialModal(false);
    }
    setBusy(false);
  }

  async function handleUserRoleChange(user: UserRecord, nextRole: Role) {
    if (!supabase || role !== 'administrador' || user.id === session?.user.id || user.role === nextRole) return;
    setBusy(true); setError('');
    const { error: updateError } = await supabase.from('profiles').update({ role: nextRole }).eq('id', user.id);
    if (updateError) setError('No se pudo actualizar el rol: ' + updateError.message);
    else setUsers(current => current.map(item => item.id === user.id ? { ...item, role: nextRole } : item));
    setBusy(false);
  }

  async function toggleMaterial(material: Material) {
    if (!supabase) return;
    setBusy(true); setError('');
    const { error: updateError } = await supabase.from('materials').update({ active: !material.active }).eq('id', material.id);
    if (updateError) setError('No se pudo actualizar el estado: ' + updateError.message);
    else setMaterials(current => current.map(item => item.id === material.id ? { ...item, active: !item.active } : item));
    setBusy(false);
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError('');
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    setBusy(false);
  }

  async function handleLogout() {
    if (!supabase) return;
    setBusy(true);
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) setError(logoutError.message);
    setPage('inicio');
    setPassword('');
    setBusy(false);
  }

  async function handleCreateClient(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !session?.user) return;
    setBusy(true);
    setError('');
    const { data, error: insertError } = await supabase
      .from('clients')
      .insert({
        company_name: companyName.trim(),
        contact_name: contactName.trim() || null,
        email: clientEmail.trim() || null,
        phone: phone.trim() || null,
        tax_id: taxId.trim() || null,
        notes: notes.trim() || null,
        created_by: session.user.id,
      })
      .select('id, company_name, contact_name, email, phone, tax_id, created_at')
      .single();
    if (insertError) {
      setError('No se pudo guardar el cliente: ' + insertError.message);
    } else {
      setClients(current => [...current, data as Client].sort((a, b) => a.company_name.localeCompare(b.company_name)));
      setModal(false);
      setCompanyName('');
      setContactName('');
      setClientEmail('');
      setPhone('');
      setTaxId('');
      setNotes('');
    }
    setBusy(false);
  }

  if (profileLoading) return <main className="loading-screen"><div className="loading-mark"><Truck/> CONVEYOR<span>QUOTE</span></div><p>Conectando con tu espacio de trabajo…</p></main>;

  if (!session || !profile) {
    return (
      <main className="login">
        <section className="hero">
          <div className="logo"><Truck/><b>CONVEYOR<span>QUOTE</span></b></div>
          <div className="hero-copy">
            <small>GESTIÓN DE PROYECTOS</small>
            <h1>Cotiza con precisión.<br/><em>Construye confianza.</em></h1>
            <p>Centraliza tus clientes, materiales y cotizaciones de sistemas transportadores en un solo lugar.</p>
          </div>
          <footer>PLATAFORMA DE COTIZACIÓN <span>VERSIÓN 0.2</span></footer>
        </section>
        <section className="login-side">
          <form onSubmit={handleLogin}>
            <div className="mobile-logo"><Truck/><b>CONVEYOR<span>QUOTE</span></b></div>
            <small>ACCESO A LA PLATAFORMA</small>
            <h2>Iniciar sesión</h2>
            <p>Ingresa con el usuario que creaste en Supabase.</p>
            <label>Correo electrónico</label>
            <div className="field"><UserRound/><input type="email" autoComplete="username" placeholder="nombre@empresa.com" value={email} onChange={event => setEmail(event.target.value)} required/></div>
            <label>Contraseña</label>
            <div className="field"><ShieldCheck/><input type="password" autoComplete="current-password" placeholder="Ingresa tu contraseña" value={password} onChange={event => setPassword(event.target.value)} required/></div>
            <button className="primary" disabled={!isSupabaseConfigured || busy}>{busy ? 'Conectando…' : 'Entrar'} <ArrowRight/></button>
            {!isSupabaseConfigured && <div className="setup-message">Falta configurar .env.local con la URL y la clave pública de tu proyecto Supabase.</div>}
            {error && <div className="error-message">{error}</div>}
            <div className="demo">● Conexión segura · autenticación Supabase</div>
          </form>
          <footer>© 2026 ConveyorQuote · Plataforma de cotización</footer>
        </section>
      </main>
    );
  }

  const nav = (items: readonly (readonly [Page, string, any])[]) => items.map(([id, label, Icon]) => (
    <button className={page === id ? 'nav active' : 'nav'} key={id} onClick={() => { setPage(id); setMobile(false); setError(''); }}>
      <Icon size={18}/>{label}
    </button>
  ));

  const heading = (eyebrow: string, description: string, action?: ReactNode) => (
    <div className="heading"><div><small>{eyebrow}</small><h1>{title}</h1><p>{description}</p></div>{action}</div>
  );

  return (
    <div className="layout">
      {mobile && <button className="scrim" aria-label="Cerrar menú" onClick={() => setMobile(false)}/>}
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="side-logo"><Truck/><b>CONVEYOR<span>QUOTE</span></b><button className="close" onClick={() => setMobile(false)}><X/></button></div>
        <div className="workspace"><Factory/><span>Área de trabajo<small>Conveyors</small></span><ChevronDown/></div>
        <small className="caption">MENÚ PRINCIPAL</small>
        {nav(base)}
        {role === 'administrador' && <><small className="caption admin-caption">ADMINISTRACIÓN</small>{nav(admin)}</>}
        <div className="bottom">
          <div className="help"><CircleHelp/> ¿Necesitas ayuda?</div>
          <div className="profile">
            <span>{role === 'administrador' ? 'AD' : 'VE'}</span>
            <b>{profile.full_name || session.user.email}<small>{role === 'administrador' ? 'Administrador' : 'Vendedor'}</small></b>
            <button aria-label="Cerrar sesión" onClick={handleLogout} disabled={busy}><LogOut/></button>
          </div>
        </div>
      </aside>
      <main className="main">
        <header>
          <button className="hamb" aria-label="Abrir menú" onClick={() => setMobile(true)}><Menu/></button>
          <span>ConveyorQuote　/　<b>{title}</b></span>
          <div className="top"><small className="connected">● Conectado</small><Bell/><i>{role === 'administrador' ? 'AD' : 'VE'}</i></div>
        </header>
        <div className="content">
          {error && <div className="error-message page-error">{error}<button onClick={() => setError('')}><X size={15}/></button></div>}
          {page === 'inicio' && <>
            <div className="heading">
              <div><small>PANEL GENERAL</small><h1>¡Hola, {profile.full_name || (role === 'administrador' ? 'Administrador' : 'bienvenido')}! 👋</h1><p>Tu sesión está activa y conectada a Supabase.</p></div>
              <button className="primary" onClick={() => setPage('cotizador')}><Plus/> Nueva cotización</button>
            </div>
            <div className="stats">
              {[[ClipboardList, 'Cotizaciones'], [Building2, 'Clientes'], [Package, 'Materiales'], [Activity, 'Actividad']].map(([Icon, label]: any) => <div className="stat" key={label}><span>{label}<Icon/></span><b>{label === 'Clientes' ? clients.length : '—'}</b><small>{label === 'Clientes' ? 'Directorio disponible' : 'Siguiente etapa'}</small></div>)}
            </div>
            <div className="panels">
              <section className="panel welcome"><Calculator/><small>PRIMERA ETAPA FUNCIONAL</small><h2>Tu espacio de trabajo ya está conectado</h2><p>El acceso utiliza usuarios reales y los clientes se guardan en la base de datos. Seguiremos incorporando materiales y cálculos.</p><button className="primary" onClick={() => setPage('clientes')}>Abrir clientes <ArrowRight/></button></section>
              <section className="panel"><h3>Accesos rápidos</h3>
                <button className="quick" onClick={() => setPage('cotizador')}><FilePlus2/><span><b>Nueva cotización</b><small>El módulo se habilitará después</small></span><ArrowRight/></button>
                <button className="quick" onClick={() => setPage('clientes')}><Building2/><span><b>Consultar clientes</b><small>Ver y registrar clientes</small></span><ArrowRight/></button>
                <button className="quick" onClick={() => setPage(role === 'administrador' ? 'materiales' : 'cotizador')}><Boxes/><span><b>Materiales</b><small>Catálogo en preparación</small></span><ArrowRight/></button>
              </section>
            </div>
          </>}
          {page === 'cotizador' && <>{heading('VENTAS', 'Selecciona el tipo de equipo que necesitas configurar.')}<button className="equipment-choice" onClick={() => setPage('banda-modular')}><span><Layers3/></span><div><small>FAMILIA 01</small><h2>Conveyor de Banda Modular</h2><p>Configuración inicial del equipo y preparación de componentes.</p></div><ArrowRight/></button><Empty icon={Calculator} title="Más familias de conveyors" desc="Los siguientes modelos se agregarán conforme avancemos con sus especificaciones."/></>}{page === 'banda-modular' && <>{heading('CONFIGURACIÓN DE EQUIPO', 'Primera familia de conveyor del sistema.')}<ModularBeltConveyor/></>}
          {page === 'clientes' && <>
            {heading('DIRECTORIO', 'Los clientes se guardan en Supabase y se muestran según tus permisos.', <button className="primary" onClick={() => setModal(true)}><Plus/> Agregar cliente</button>)}
            <section className="panel table">
              <div className="search"><Search/><input placeholder="Buscar cliente..." value={search} onChange={event => setSearch(event.target.value)}/><small>{clients.length} clientes visibles</small></div>
              {clientsLoading ? <div className="table-empty">Cargando clientes…</div> : filteredClients.length === 0 ? <div className="table-empty"><Users/><b>{clients.length ? 'No hay coincidencias' : 'Todavía no hay clientes'}</b><span>{clients.length ? 'Prueba con otro término de búsqueda.' : 'Registra el primer cliente para probar el almacenamiento.'}</span></div> : (
                <div className="clients-table-wrap"><table className="clients-table"><thead><tr><th>Empresa</th><th>Contacto</th><th>Correo</th><th>Teléfono</th><th>RFC</th></tr></thead><tbody>
                  {filteredClients.map(client => <tr key={client.id}><td><b>{client.company_name}</b></td><td>{client.contact_name || '—'}</td><td>{client.email || '—'}</td><td>{client.phone || '—'}</td><td>{client.tax_id || '—'}</td></tr>)}
                </tbody></table></div>
              )}
            </section>
          </>}
          {(['materiales', 'precios'] as Page[]).includes(page) && <>
            {heading('ADMINISTRACIÓN', page === 'materiales' ? 'Administra perfiles, componentes y consumibles utilizados en tus conveyors.' : 'Consulta y actualiza los precios unitarios del catálogo.', page === 'materiales' ? <button className="primary" onClick={() => openMaterial()}><Plus/> Agregar material</button> : undefined)}
            <section className="panel table">
              <div className="search"><Search/><input placeholder="Buscar por nombre, categoría, código o proveedor..." value={materialSearch} onChange={event => setMaterialSearch(event.target.value)}/><small>{filteredMaterials.length} registros</small></div>
              {materialsLoading ? <div className="table-empty">Cargando catálogo…</div> : filteredMaterials.length === 0 ? <div className="table-empty"><Boxes/><b>{materials.length ? 'No hay coincidencias' : 'Catálogo vacío'}</b><span>{materials.length ? 'Prueba con otro término.' : 'Agrega los materiales y componentes que utilizas en tus conveyors.'}</span></div> : <div className="clients-table-wrap"><table className="clients-table"><thead><tr><th>Material</th><th>Categoría</th><th>Código</th><th>Unidad</th><th>Proveedor</th><th>Precio unitario</th><th>Estado</th>{page === 'materiales' && <th>Acciones</th>}</tr></thead><tbody>{filteredMaterials.map(item => <tr key={item.id}><td><b>{item.name}</b></td><td>{item.category}</td><td>{item.sku || '—'}</td><td>{item.unit}</td><td>{item.supplier || '—'}</td><td><b>{new Intl.NumberFormat('es-MX',{style:'currency',currency:item.currency}).format(item.unit_price)}</b></td><td><span className={item.active ? 'status-active' : 'status-inactive'}>{item.active ? 'Activo' : 'Inactivo'}</span></td>{page === 'materiales' && <td><button className="table-action" onClick={() => openMaterial(item)}>Editar</button><button className="table-action" onClick={() => toggleMaterial(item)} disabled={busy}>{item.active ? 'Desactivar' : 'Activar'}</button></td>}</tr>)}</tbody></table></div>}
            </section>
          </>}
          {page === 'usuarios' && role === 'administrador' && <>
            {heading('ADMINISTRACIÓN', 'Consulta los usuarios registrados y asigna permisos de vendedor o administrador.')}
            <section className="panel table">
              <div className="search"><Users/><span className="search-label">Usuarios registrados</span><small>{users.length} usuarios</small></div>
              {usersLoading ? <div className="table-empty">Cargando usuarios…</div> : users.length === 0 ? <div className="table-empty"><Users/><b>No hay usuarios registrados</b><span>Los usuarios creados en Supabase aparecerán aquí automáticamente.</span></div> : <div className="clients-table-wrap"><table className="clients-table"><thead><tr><th>Usuario</th><th>Correo electrónico</th><th>Rol</th><th>Registro</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><b>{user.full_name || 'Sin nombre'}</b>{user.id === session.user.id && <small className="you-label">Tú</small>}</td><td>{user.email || '—'}</td><td>{user.id === session.user.id ? <span className="status-active">Administrador actual</span> : <select className="role-select" aria-label={'Rol de ' + (user.email || user.id)} value={user.role} disabled={busy} onChange={event => void handleUserRoleChange(user, event.target.value as Role)}><option value="vendedor">Vendedor</option><option value="administrador">Administrador</option></select>}</td><td>{new Date(user.created_at).toLocaleDateString('es-MX')}</td></tr>)}</tbody></table></div>}
              <p className="users-note">Para crear o invitar usuarios, utiliza Authentication → Users en Supabase. Por seguridad, la aplicación no almacena contraseñas ni utiliza claves administrativas en el navegador.</p>
            </section>
          </>}
          {page === 'configuracion' && <>
            {heading('ADMINISTRACIÓN', 'Preferencias y datos generales de la plataforma.')}
            <Empty icon={Cog} title="Configuración general" desc="Las preferencias avanzadas se habilitarán en una siguiente etapa."/>
          </>}
        </div>
        <footer className="foot">CONVEYORQUOTE · Plataforma de cotización <span>Versión 0.2.0 · Supabase</span></footer>
      </main>
      {materialModal && <div className="overlay" onClick={() => !busy && setMaterialModal(false)}><form className="dialog client-form" onSubmit={handleSaveMaterial} onClick={event => event.stopPropagation()}><button type="button" className="close-dialog" onClick={() => setMaterialModal(false)}><X/></button><small>CATÁLOGO DE MATERIALES</small><h2>{editingMaterial ? 'Editar material' : 'Agregar material'}</h2><p>Registra el material y su precio de compra vigente. Los precios se podrán ajustar posteriormente.</p><label>Nombre *</label><input value={materialName} onChange={event => setMaterialName(event.target.value)} required maxLength={150} placeholder="Ej. PTR 2 x 2 cal. 14"/><div className="form-grid"><div><label>Categoría *</label><select value={materialCategory} onChange={event => setMaterialCategory(event.target.value)}><option>Estructura</option><option>Lámina</option><option>Rodillos</option><option>Rodamientos</option><option>Transmisión</option><option>Motorización</option><option>Eléctrico</option><option>Consumibles</option><option>Otros</option></select></div><div><label>Unidad *</label><select value={materialUnit} onChange={event => setMaterialUnit(event.target.value)}><option>pieza</option><option>metro</option><option>kg</option><option>m²</option><option>juego</option><option>litro</option><option>servicio</option></select></div></div><div className="form-grid"><div><label>Código / SKU</label><input value={materialSku} onChange={event => setMaterialSku(event.target.value)} maxLength={60}/></div><div><label>Proveedor</label><input value={materialSupplier} onChange={event => setMaterialSupplier(event.target.value)} maxLength={120}/></div></div><div className="form-grid"><div><label>Precio unitario *</label><input type="number" min="0" step="0.01" value={materialPrice} onChange={event => setMaterialPrice(event.target.value)} required/></div><div><label>Moneda</label><select value={materialCurrency} onChange={event => setMaterialCurrency(event.target.value as 'MXN' | 'USD')}><option value="MXN">MXN</option><option value="USD">USD</option></select></div></div><label>Notas</label><textarea rows={2} value={materialNotes} onChange={event => setMaterialNotes(event.target.value)} maxLength={1000}/><button className="primary" disabled={busy || !materialName.trim()}>{busy ? 'Guardando…' : 'Guardar material'} <Check/></button></form></div>}
      {modal && <div className="overlay" onClick={() => !busy && setModal(false)}>
        <form className="dialog client-form" onSubmit={handleCreateClient} onClick={event => event.stopPropagation()}>
          <button type="button" className="close-dialog" onClick={() => setModal(false)}><X/></button>
          <small>DIRECTORIO</small><h2>Agregar cliente</h2><p>Completa los datos disponibles. La empresa es el único campo obligatorio.</p>
          <label>Empresa / razón social *</label><input value={companyName} onChange={event => setCompanyName(event.target.value)} required maxLength={150} placeholder="Nombre de la empresa"/>
          <label>Nombre de contacto</label><input value={contactName} onChange={event => setContactName(event.target.value)} maxLength={120} placeholder="Nombre del contacto"/>
          <div className="form-grid"><div><label>Correo electrónico</label><input type="email" value={clientEmail} onChange={event => setClientEmail(event.target.value)} placeholder="contacto@empresa.com"/></div><div><label>Teléfono</label><input value={phone} onChange={event => setPhone(event.target.value)} maxLength={40} placeholder="Teléfono"/></div></div>
          <label>RFC</label><input value={taxId} onChange={event => setTaxId(event.target.value)} maxLength={20} placeholder="RFC"/>
          <label>Notas</label><textarea value={notes} onChange={event => setNotes(event.target.value)} rows={2} maxLength={1000} placeholder="Información adicional"/>
          <button className="primary" disabled={busy || !companyName.trim()}>{busy ? 'Guardando…' : 'Guardar cliente'} <Check/></button>
        </form>
      </div>}
    </div>
  );
}

function Empty({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return <div className="panel empty"><Icon/><h2>{title}</h2><p>{desc}</p><small>EN PREPARACIÓN</small></div>;
}
