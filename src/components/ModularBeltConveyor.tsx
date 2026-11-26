import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Layers3, LockKeyhole, Package, Ruler, Save, FolderOpen, Wrench, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Step = 'identificacion' | 'configuracion' | 'componentes' | 'revision';
type ComponentCategory = 'laser_sheet' | 'profile' | 'nylamid' | 'commercial' | 'machined' | 'pending';
type ComponentRule = { name: string; category: ComponentCategory };
type ManufacturingConfig = {
  sheetWidthIn: string;
  sheetLengthIn: string;
  profileLengthMm: string;
  laserGapMm: string;
  sheetEdgeMarginMm: string;
  laserKerfMm: string;
  profileKerfMm: string;
  profileEndTrimMm: string;
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
  components: [
    { name: 'Bastidor', category: 'laser_sheet' },
    { name: 'Cartabón soporte', category: 'laser_sheet' },
    { name: 'Base soporte', category: 'laser_sheet' },
    { name: 'Pierna soporte', category: 'laser_sheet' },
    { name: 'Sufridera superior', category: 'nylamid' },
    { name: 'Sufridera lateral', category: 'nylamid' },
    { name: 'Guías laterales', category: 'nylamid' },
    { name: 'Banda modular S1400', category: 'commercial' },
    { name: 'Sprocket S1400', category: 'commercial' },
    { name: 'Rodamiento MUCNFL206-20', category: 'commercial' },
    { name: 'Tornillería y fijaciones', category: 'commercial' },
    { name: 'Separador', category: 'pending' },
    { name: 'Placa separador', category: 'pending' },
    { name: 'Perno motriz', category: 'pending' },
    { name: 'Perno conducido', category: 'pending' },
    { name: 'Soporte carga', category: 'pending' },
    { name: 'Zapata soporte', category: 'pending' },
    { name: 'Esparrago', category: 'pending' },
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

function readConfig(value: unknown): ManufacturingConfig {
  if (!value || typeof value !== 'object') return defaultConfig;
  const raw = value as Partial<ManufacturingConfig>;
  return {
    ...defaultConfig,
    ...raw,
    components: Array.isArray(raw.components)
      ? raw.components.filter((item): item is ComponentRule => !!item && typeof item.name === 'string' && item.name.length > 0 && ['laser_sheet','profile','nylamid','commercial','machined','pending'].includes(item.category))
      : defaultConfig.components,
  };
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
 function updateSetting(key:Exclude<keyof ManufacturingConfig,'components'>, value:string) {
  setConfig(current=>({...current,[key]:value}));
 }

 return <div className="modular-builder">
  <div className="builder-intro"><div><small>CONFIGURADOR DE EQUIPOS · FAMILIA 01</small><h2>Conveyor de Banda Modular</h2><p>Reglas de despiece y fabricación basadas en el ensamble proporcionado. Las cantidades y dimensiones se validarán desde el CAD antes de calcular costos.</p></div><span className="equipment-tag">MODELO EN CONFIGURACIÓN</span></div>
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
   {step==='componentes'&&<><div className="builder-section-title"><Package/><div><h3>Clasificación preliminar de componentes</h3><p>Confirma el método de fabricación de cada elemento. Puedes cambiar cualquier clasificación.</p></div></div><div className="component-rules"><div className="component-rule-header"><span>Componente identificado</span><span>Tratamiento de cotización</span></div>{config.components.map((item,i)=><div className="component-rule" key={item.name}><b>{item.name}</b><select value={item.category} onChange={e=>updateComponent(i,e.target.value as ComponentCategory)}>{Object.entries(categoryLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div>)}</div><div className="builder-hint"><Info/><span>Las sufrideras y guías laterales están clasificadas como Nylamid; no entran al nesting láser. Base soporte y Pierna soporte se consideran chapa metálica y sí requieren desarrollo plano. Los componentes comerciales se costearán por precio unitario directo.</span></div><div className="builder-hint"><LockKeyhole/><span>Las piezas suprimidas se excluirán del despiece y de los costos. La lectura automática del estado de supresión y las cantidades exactas requiere importar el ensamble nativo de SolidWorks; el STEP por sí solo no se tomará como fuente suficiente para ese estado.</span></div></>}
   {step==='revision'&&<><div className="builder-section-title"><CheckCircle2/><div><h3>Revisión del proyecto</h3><p>Resumen de identificación y reglas de fabricación.</p></div></div><div className="review-list"><span>Equipo<b>Conveyor de Banda Modular</b></span><span>Proyecto<b>{name||'Sin nombre asignado'}</b></span><span>Clave<b>{code||'Sin clave'}</b></span><span>Descripción<b>{description||'Sin descripción'}</b></span><span>Lámina<b>{config.sheetWidthIn} × {config.sheetLengthIn} pulgadas</b></span><span>Tramo de perfil<b>{config.profileLengthMm} mm</b></span><span>Piezas láser<b>{config.components.filter(x=>x.category==='laser_sheet').length}</b></span><span>Piezas Nylamid<b>{config.components.filter(x=>x.category==='nylamid').length}</b></span><span>Componentes comerciales<b>{config.components.filter(x=>x.category==='commercial').length}</b></span><span>Por clasificar<b>{config.components.filter(x=>x.category==='pending').length}</b></span><span>Estado<b>{projectId?'Borrador guardado':'Sin guardar'}</b></span></div><div className="builder-hint"><LockKeyhole/><span>Esta etapa registra reglas y clasificación preliminar; no presenta cantidades, desarrollos ni costos hasta validar la información geométrica y comercial.</span></div></>}
   {message&&<div className={message.startsWith('No se pudo')?'error-message':'builder-hint'}>{message}</div>}
   <div className="builder-actions"><button type="button" className="secondary-action" disabled={index===0} onClick={()=>setStep(steps[Math.max(0,index-1)].id)}><ArrowLeft size={16}/> Anterior</button><div className="builder-action-right"><button type="button" className="secondary-action" onClick={()=>void saveProject()} disabled={saving||!name.trim()}><Save size={15}/>{saving?'Guardando…':'Guardar borrador'}</button>{index<steps.length-1&&<button type="button" className="primary" onClick={()=>setStep(steps[index+1].id)}>Continuar <ArrowRight size={16}/></button>}</div></div>
  </section><div className="calculation-lock"><LockKeyhole/><span><b>Motor de cotización en preparación</b><small>Primero validaremos el despiece, los desarrollos planos y las reglas de aprovechamiento.</small></span></div>
 </div>;
}
