import { useEffect, useState, type ChangeEvent } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Layers3, LockKeyhole, Package, Ruler, Save, FolderOpen, Wrench, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Step = 'identificacion' | 'configuracion' | 'componentes' | 'revision';
type ComponentCategory = 'laser_sheet' | 'profile' | 'nylamid' | 'commercial' | 'machined' | 'pending';
type ComponentRule = { name: string; category: ComponentCategory; quantity: number; description?: string; cadEnvelopeMm?: string; flatPatternRequired?: boolean };
type ManufacturingConfig = {
  sheetWidthIn: string;
  sheetLengthIn: string;
  profileLengthMm: string;
  laserGapMm: string;
  sheetEdgeMarginMm: string;
  laserKerfMm: string;
  profileKerfMm: string;
  profileEndTrimMm: string;
  bomSource: 'step_export' | 'solidworks_csv';
  bomSourceFile?: string;
  components: ComponentRule[];
};
type Project = { id: string; project_name: string; project_code: string | null; description: string | null; updated_at: string; configuration?: Record<string, unknown> | null };

const steps: {id:Step;label:string;icon:any}[] = [{id:'identificacion',label:'Identificación',icon:ClipboardList},{id:'configuracion',label:'Configuración del equipo',icon:Ruler},{id:'componentes',label:'Despiece y fabricación',icon:Layers3},{id:'revision',label:'Revisión',icon:CheckCircle2}];

const defaultConfig: ManufacturingConfig = {
  sheetWidthIn: '48',
  sheetLengthIn: '120',
  profileLengthMm: '6000',
  laserGapMm: '',
  sheetEdgeMarginMm: '',
  laserKerfMm: '',
  profileKerfMm: '',
  profileEndTrimMm: '',
  bomSource: 'step_export',
  components: [
    { name: 'Bastidor', category: 'laser_sheet', quantity: 1, cadEnvelopeMm: '63.5 × 139.7 × 1900', flatPatternRequired: true },
    { name: 'Bastidor Simetria', category: 'laser_sheet', quantity: 1, cadEnvelopeMm: '63.5 × 139.7 × 1900', flatPatternRequired: true },
    { name: 'Base soporte', category: 'laser_sheet', quantity: 4, cadEnvelopeMm: '76.2 × 3.06 × 38.1', flatPatternRequired: true },
    { name: 'Pierna soporte', category: 'laser_sheet', quantity: 4, cadEnvelopeMm: '38.1 × 202.4 × 76.2', flatPatternRequired: true },
    { name: 'Cartabon soporte', category: 'laser_sheet', quantity: 4, cadEnvelopeMm: '38.1 × 101.6 × 152.4' },
    { name: 'Zapata soporte', category: 'laser_sheet', quantity: 4, cadEnvelopeMm: '101.6 × 6.35 × 101.6' },
    { name: 'Base soporte tab', category: 'pending', quantity: 2, cadEnvelopeMm: '392.7 × 118.9 × 152.4' },
    { name: 'Angulo sufridera_Predeterminado<Como mecanizada>', category: 'pending', quantity: 3 },
    { name: 'Placa separador', category: 'pending', quantity: 6, cadEnvelopeMm: '3.06 × 38.1 × 127' },
    { name: 'Soporte carga', category: 'pending', quantity: 3, cadEnvelopeMm: '50.8 × 28.46 × 664.26' },
    { name: 'Separador', category: 'machined', quantity: 4, cadEnvelopeMm: '326.57 × 15.88 × 15.88' },
    { name: 'separador soporte', category: 'pending', quantity: 2, cadEnvelopeMm: '364.36 × 25.4 × 50.8' },
    { name: 'Perno motriz', category: 'machined', quantity: 1, cadEnvelopeMm: '542.11 × 38.1 × 38.1' },
    { name: 'Perno conducido', category: 'machined', quantity: 1, cadEnvelopeMm: '415.11 × 38.1 × 38.1' },
    { name: 'Esparrago', category: 'pending', quantity: 4, cadEnvelopeMm: '15.45 × 17.84 × 141.18' },
    { name: 'Sufridera inferior', category: 'nylamid', quantity: 2, cadEnvelopeMm: '1625.6 × 6.35 × 50.8' },
    { name: 'Sufridera superior', category: 'nylamid', quantity: 3, cadEnvelopeMm: '588.06 × 12.7 × 50.8' },
    { name: 'Sufridera lateral', category: 'nylamid', quantity: 2, cadEnvelopeMm: '23 × 21 × 1646' },
    { name: 'Rodamiento snr_mucnfl206-20_0', category: 'commercial', quantity: 4, cadEnvelopeMm: '62 × 85.52 × 148' },
    { name: 'Sprocket s1400_16t_5-1inpd_1-5in_sq_split', category: 'commercial', quantity: 6, cadEnvelopeMm: '135.05 × 135.05 × 50.29' },
    { name: 'Banda modular s1400_ft_305mm', category: 'commercial', quantity: 152, cadEnvelopeMm: '38.11 × 12.71 × 304.81' },
    { name: 'Socket button head cap screw 0.375-24x1.5', category: 'commercial', quantity: 8 },
    { name: 'Flat washer type A wide 0.375', category: 'commercial', quantity: 6 },
    { name: 'Lock washer spring regular 0.375', category: 'commercial', quantity: 70 },
    { name: 'Hex nut 0.3750-16', category: 'commercial', quantity: 66 },
    { name: 'Hex bolt 0.3750-16x1.25', category: 'commercial', quantity: 50 },
    { name: 'Socket countersunk head cap screw 0.375-16x1.5', category: 'commercial', quantity: 16 },
    { name: 'Hex nut 0.6250-11', category: 'commercial', quantity: 12 },
  ],
};

const categoryLabels: Record<ComponentCategory, string> = {
  laser_sheet: 'Chapa · corte láser',
  profile: 'Perfil · tramo comercial',
  nylamid: 'Nylamid · maquinado',
  commercial: 'Comercial · precio directo',
  machined: 'Fabricación · maquinado',
  pending: 'Por clasificar',
};

function normalizeBomText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function parseDelimitedText(source: string): string[][] {
  const text = source.replace(/^\uFEFF/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] || '';
  const delimiters = [',', ';', '\t'];
  const delimiter = delimiters
    .map(char => ({ char, count: firstLine.split(char).length - 1 }))
    .sort((a, b) => b.count - a.count)[0].char;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(value => value.length > 0)) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some(value => value.length > 0)) rows.push(row);
  return rows;
}

function parseSolidWorksBomCsv(source: string, existing: ComponentRule[]): ComponentRule[] {
  const rows = parseDelimitedText(source);
  const headerIndex = rows.findIndex(row => {
    const headers = row.map(normalizeBomText);
    return headers.some(h => ['qty', 'quantity', 'cantidad', 'cant'].includes(h))
      && headers.some(h => ['part number', 'part no', 'part name', 'component name', 'file name', 'filename', 'description', 'descripcion', 'name', 'nombre', 'numero de pieza'].includes(h));
  });
  if (headerIndex < 0) throw new Error('No encontré columnas de componente y cantidad. Exporta el BOM con columnas Part Number o Description y QTY.');
  const headers = rows[headerIndex].map(normalizeBomText);
  const quantityIndex = headers.findIndex(h => ['qty', 'quantity', 'cantidad', 'cant'].includes(h));
  const partNumberIndex = headers.findIndex(h => ['part number', 'part no', 'numero de pieza'].includes(h));
  const descriptionIndex = headers.findIndex(h => ['description', 'descripcion', 'part name', 'component name', 'file name', 'filename', 'name', 'nombre'].includes(h));
  const nameIndex = partNumberIndex >= 0 ? partNumberIndex : descriptionIndex;
  if (nameIndex < 0 || quantityIndex < 0) throw new Error('El BOM debe incluir el identificador de pieza y la cantidad.');
  const normalize = (name: string) => normalizeBomText(name);
  const grouped = new Map<string, ComponentRule>();
  for (const row of rows.slice(headerIndex + 1)) {
    const name = (row[nameIndex] || '').trim();
    const description = descriptionIndex >= 0 && descriptionIndex !== nameIndex ? (row[descriptionIndex] || '').trim() : '';
    const quantityText = (row[quantityIndex] || '').replace(/,/g, '.').trim();
    const quantity = Number(quantityText);
    if (!name || !Number.isFinite(quantity) || quantity <= 0) continue;
    const key = normalize(name);
    const prior = existing.find(item => normalize(item.name) === key || (!!description && normalize(item.name) === normalize(description)));
    const current = grouped.get(key);
    if (current) current.quantity += quantity;
    else grouped.set(key, {
      name,
      description: description || undefined,
      quantity,
      category: prior?.category || 'pending',
      cadEnvelopeMm: prior?.cadEnvelopeMm,
      flatPatternRequired: prior?.flatPatternRequired,
    });
  }
  const result = Array.from(grouped.values());
  if (!result.length) throw new Error('No encontré renglones válidos con cantidad en el archivo.');
  return result;
}

function readConfig(value: unknown): ManufacturingConfig {
  if (!value || typeof value !== 'object') return defaultConfig;
  const raw = value as Partial<ManufacturingConfig>;
  const saved = Array.isArray(raw.components) ? raw.components : [];
  const validCategory = (category: unknown): category is ComponentCategory =>
    typeof category === 'string' && ['laser_sheet','profile','nylamid','commercial','machined','pending'].includes(category);
  const normalize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const components = defaultConfig.components.map(base => {
    const prior = saved.find(item => item && typeof item.name === 'string' && normalize(item.name) === normalize(base.name));
    return prior && validCategory(prior.category) ? { ...base, category: prior.category } : base;
  });
  return { ...defaultConfig, ...raw, components };
}

export default function ModularBeltConveyor({ userId }: { userId: string }) {
 const [step,setStep]=useState<Step>('identificacion');
 const [name,setName]=useState(''); const [code,setCode]=useState(''); const [description,setDescription]=useState('');
 const [projectId,setProjectId]=useState<string|null>(null);
 const [projects,setProjects]=useState<Project[]>([]);
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
 const [config,setConfig]=useState<ManufacturingConfig>(defaultConfig);
 const index=steps.findIndex(s=>s.id===step);

 async function loadProjects() {
  if (!supabase) return;
  setLoading(true);
  const {data,error}=await supabase.from('conveyor_projects').select('id, project_name, project_code, description, updated_at, configuration').eq('created_by',userId).eq('equipment_family','modular_belt').order('updated_at',{ascending:false});
  if(error) setMessage('No se pudieron consultar los borradores. Verifica que se haya aplicado la migración de proyectos.');
  else setProjects((data||[]) as Project[]);
  setLoading(false);
 }
 useEffect(()=>{void loadProjects();},[userId]);

 async function saveProject() {
  if(!supabase || !name.trim()) {setMessage('Escribe el nombre del proyecto antes de guardar.');return;}
  setSaving(true);setMessage('');
  const values={project_name:name.trim(),project_code:code.trim()||null,description:description.trim()||null,equipment_family:'modular_belt',status:'draft',configuration:{schema_version:2,technical_data:{},manufacturing:config},created_by:userId};
  const query=projectId
   ? supabase.from('conveyor_projects').update({...values,created_by:userId}).eq('id',projectId).select('id').single()
   : supabase.from('conveyor_projects').insert(values).select('id').single();
  const {data,error}=await query;
  if(error) setMessage('No se pudo guardar. Detalle: '+error.message);
  else {setProjectId(data.id);setMessage('Borrador guardado correctamente.');await loadProjects();}
  setSaving(false);
 }
 function openProject(project:Project) {
  const saved = project.configuration?.manufacturing;
  setProjectId(project.id);setName(project.project_name);setCode(project.project_code||'');setDescription(project.description||'');setConfig(readConfig(saved));setStep('identificacion');setMessage('Borrador cargado.');
 }
 function newProject() {
  setProjectId(null);setName('');setCode('');setDescription('');setConfig(defaultConfig);setStep('identificacion');setMessage('Nuevo proyecto.');
 }
 function updateComponent(index:number, category:ComponentCategory) {
  setConfig(current=>({...current,components:current.components.map((item,i)=>i===index?{...item,category}:item)}));
 }
 async function importSolidWorksBom(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0];
  if (!file) return;
  setMessage('');
  try {
   const text = await file.text();
   const components = parseSolidWorksBomCsv(text, config.components);
   setConfig(current => ({ ...current, components, bomSource: 'solidworks_csv', bomSourceFile: file.name }));
   setMessage(`BOM de SolidWorks importada: ${components.length} referencias y ${components.reduce((sum,item)=>sum+item.quantity,0)} piezas. Se reemplazó el conteo preliminar del STEP.`);
  } catch (error) {
   setMessage('No se pudo importar el BOM: ' + (error instanceof Error ? error.message : 'formato no reconocido.'));
  } finally {
   event.target.value = '';
  }
 }
 function updateSetting(key:Exclude<keyof ManufacturingConfig,'components'>, value:string) {
  setConfig(current=>({...current,[key]:value}));
 }

 return <div className="modular-builder">
  <div className="builder-intro"><div><small>CONFIGURADOR DE EQUIPOS · FAMILIA 01</small><h2>Conveyor de Banda Modular</h2><p>Reglas de fabricación y despiece inicial extraído del STEP de SolidWorks. Las envolventes son referencias geométricas, no dimensiones de fabricación.</p></div><span className="equipment-tag">MODELO EN CONFIGURACIÓN</span></div>
  <section className="builder-card project-drafts">
   <div className="builder-section-title"><FolderOpen/><div><h3>Mis proyectos</h3><p>Guarda avances y continúa después desde tu cuenta.</p></div><button type="button" className="secondary-action" onClick={newProject}>Nuevo</button></div>
   {loading?<p className="draft-empty">Cargando proyectos…</p>:projects.length===0?<p className="draft-empty">Aún no tienes borradores guardados.</p>:<div className="draft-list">{projects.map(project=><button type="button" className={projectId===project.id?'draft-item selected':'draft-item'} key={project.id} onClick={()=>openProject(project)}><span><b>{project.project_name}</b><small>{project.project_code||'Sin clave'} · Actualizado {new Date(project.updated_at).toLocaleDateString('es-MX')}</small></span><ArrowRight size={16}/></button>)}</div>}
  </section>
  <div className="builder-progress">{steps.map((s,i)=>{const Icon=s.icon;return <button type="button" key={s.id} className={step===s.id?'builder-step current':i<index?'builder-step completed':'builder-step'} onClick={()=>setStep(s.id)}><Icon size={17}/><span><small>ETAPA {i+1}</small><b>{s.label}</b></span></button>})}</div>
  <section className="builder-card">
   {step==='identificacion'&&<><div className="builder-section-title"><ClipboardList/><div><h3>Identificación del proyecto</h3><p>Datos generales para organizar la cotización.</p></div></div><div className="builder-fields"><label>Nombre del proyecto<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Línea de empaque · Conveyor 01" maxLength={150}/></label><label>Clave o número de proyecto<input value={code} onChange={e=>setCode(e.target.value)} placeholder="Clave interna (opcional)" maxLength={60}/></label><label className="field-full">Descripción / requerimiento del cliente<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe brevemente la necesidad del cliente." maxLength={2000}/></label></div><div className="builder-hint"><CheckCircle2/><span>La identificación se puede guardar como borrador. Los datos técnicos y cálculos se definirán con tus especificaciones.</span></div></>}
   {step==='configuracion'&&<><div className="builder-section-title"><Ruler/><div><h3>Reglas generales de fabricación</h3><p>Medidas comerciales definidas para este proyecto.</p></div></div><div className="manufacturing-settings">
    <div className="manufacturing-setting"><b>Lámina para corte láser</b><label>Ancho (pulgadas)<input type="number" min="0" step="0.01" value={config.sheetWidthIn} onChange={e=>updateSetting('sheetWidthIn',e.target.value)}/></label><label>Largo (pulgadas)<input type="number" min="0" step="0.01" value={config.sheetLengthIn} onChange={e=>updateSetting('sheetLengthIn',e.target.value)}/></label></div>
    <div className="manufacturing-setting"><b>Perfiles comerciales</b><label>Longitud del tramo (mm)<input type="number" min="0" step="1" value={config.profileLengthMm} onChange={e=>updateSetting('profileLengthMm',e.target.value)}/></label></div>
    <div className="manufacturing-setting"><b>Parámetros de proceso por definir</b><label>Separación entre piezas láser (mm)<input type="number" min="0" step="0.1" placeholder="Pendiente" value={config.laserGapMm} onChange={e=>updateSetting('laserGapMm',e.target.value)}/></label><label>Margen de borde de lámina (mm)<input type="number" min="0" step="0.1" placeholder="Pendiente" value={config.sheetEdgeMarginMm} onChange={e=>updateSetting('sheetEdgeMarginMm',e.target.value)}/></label><label>Kerf láser (mm)<input type="number" min="0" step="0.1" placeholder="Pendiente" value={config.laserKerfMm} onChange={e=>updateSetting('laserKerfMm',e.target.value)}/></label><label>Kerf de sierra (mm)<input type="number" min="0" step="0.1" placeholder="Pendiente" value={config.profileKerfMm} onChange={e=>updateSetting('profileKerfMm',e.target.value)}/></label><label>Recorte de extremos de perfil (mm)<input type="number" min="0" step="0.1" placeholder="Pendiente" value={config.profileEndTrimMm} onChange={e=>updateSetting('profileEndTrimMm',e.target.value)}/></label></div>
   </div><div className="builder-hint"><Info/><span>Las láminas se anidan por material y espesor. Los perfiles se optimizan por material y sección. Los parámetros de corte que aún no has definido se mantienen vacíos; no se usan valores supuestos.</span></div></>}
   {step==='componentes'&&<><div className="builder-section-title"><Package/><div><h3>Despiece del ensamble</h3><p>{config.components.reduce((sum,item)=>sum+item.quantity,0)} piezas · {config.components.length} referencias únicas · Fuente: {config.bomSource==='solidworks_csv'?'BOM nativo de SolidWorks':'STEP exportado'}.</p></div></div><div className="bom-import-panel"><label>Importar lista de materiales de SolidWorks (CSV)<input type="file" accept=".csv,text/csv,.txt,text/plain" onChange={e=>void importSolidWorksBom(e)}/></label><small>Usa una BOM de tipo “Solo piezas” de la configuración activa, con columnas Part Number o Description y QTY. Al importarla reemplazará el conteo preliminar del STEP.</small>{config.bomSourceFile&&<small>Archivo importado: {config.bomSourceFile}</small>}</div><div className="component-rules"><div className="component-rule-header component-rule-bom-header"><span>Componente</span><span>Cantidad</span><span>Tratamiento</span></div>{config.components.map((item,i)=><div className="component-rule component-bom-row" key={item.name}><span className="component-bom-name"><b>{item.name}</b>{item.description&&<small>{item.description}</small>}{item.cadEnvelopeMm&&config.bomSource==='step_export'&&<small>Envolvente 3D CAD: {item.cadEnvelopeMm} mm</small>}{item.flatPatternRequired&&<small className="flat-pattern-flag">Requiere desarrollo plano</small>}</span><strong className="component-quantity">{item.quantity}</strong><select value={item.category} onChange={e=>updateComponent(i,e.target.value as ComponentCategory)}>{Object.entries(categoryLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div>)}</div><div className="builder-hint"><Info/><span>Las envolventes 3D son referencias geométricas del STEP, no dimensiones de fabricación ni desarrollos planos. Las sufrideras son Nylamid. Base soporte y Pierna soporte requieren desarrollo de chapa. Los componentes comerciales se cotizarán con precio unitario directo.</span></div><div className="builder-hint"><LockKeyhole/><span>{config.bomSource==='solidworks_csv'?'El conteo proviene de la BOM nativa importada. Genera el BOM en la configuración correcta y como Solo piezas para excluir los componentes suprimidos.':'El conteo procede de las ocurrencias visibles en el STEP. Para garantizar que los componentes suprimidos queden excluidos, importa la BOM nativa de SolidWorks; el STEP no conserva por sí mismo el estado de supresión.'}</span></div></>}
   {step==='revision'&&<><div className="builder-section-title"><CheckCircle2/><div><h3>Revisión del proyecto</h3><p>Resumen de identificación y reglas de fabricación.</p></div></div><div className="review-list"><span>Equipo<b>Conveyor de Banda Modular</b></span><span>Proyecto<b>{name||'Sin nombre asignado'}</b></span><span>Clave<b>{code||'Sin clave'}</b></span><span>Descripción<b>{description||'Sin descripción'}</b></span><span>Lámina<b>{config.sheetWidthIn} × {config.sheetLengthIn} pulgadas</b></span><span>Tramo de perfil<b>{config.profileLengthMm} mm</b></span><span>Ocurrencias en despiece<b>{config.components.reduce((sum,item)=>sum+item.quantity,0)}</b></span><span>Ocurrencias chapa láser<b>{config.components.filter(x=>x.category==='laser_sheet').reduce((sum,item)=>sum+item.quantity,0)}</b></span><span>Ocurrencias Nylamid<b>{config.components.filter(x=>x.category==='nylamid').reduce((sum,item)=>sum+item.quantity,0)}</b></span><span>Ocurrencias comerciales<b>{config.components.filter(x=>x.category==='commercial').reduce((sum,item)=>sum+item.quantity,0)}</b></span><span>Ocurrencias por clasificar<b>{config.components.filter(x=>x.category==='pending').reduce((sum,item)=>sum+item.quantity,0)}</b></span><span>Estado<b>{projectId?'Borrador guardado':'Sin guardar'}</b></span></div><div className="builder-hint"><LockKeyhole/><span>Esta etapa registra reglas y clasificación preliminar; no presenta cantidades, desarrollos ni costos hasta validar la información geométrica y comercial.</span></div></>}
   {message&&<div className={message.startsWith('No se pudo')?'error-message':'builder-hint'}>{message}</div>}
   <div className="builder-actions"><button type="button" className="secondary-action" disabled={index===0} onClick={()=>setStep(steps[Math.max(0,index-1)].id)}><ArrowLeft size={16}/> Anterior</button><div className="builder-action-right"><button type="button" className="secondary-action" onClick={()=>void saveProject()} disabled={saving||!name.trim()}><Save size={15}/>{saving?'Guardando…':'Guardar borrador'}</button>{index<steps.length-1&&<button type="button" className="primary" onClick={()=>setStep(steps[index+1].id)}>Continuar <ArrowRight size={16}/></button>}</div></div>
  </section><div className="calculation-lock"><LockKeyhole/><span><b>Motor de cotización en preparación</b><small>Primero validaremos el despiece, los desarrollos planos y las reglas de aprovechamiento.</small></span></div>
 </div>;
}
