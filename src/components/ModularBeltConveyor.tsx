import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Layers3, LockKeyhole, Package, Ruler, Save, FolderOpen, Wrench } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Step = 'identificacion' | 'configuracion' | 'componentes' | 'revision';
type Project = { id: string; project_name: string; project_code: string | null; description: string | null; updated_at: string };
const steps: {id:Step;label:string;icon:any}[] = [{id:'identificacion',label:'Identificación',icon:ClipboardList},{id:'configuracion',label:'Configuración del equipo',icon:Ruler},{id:'componentes',label:'Componentes',icon:Layers3},{id:'revision',label:'Revisión',icon:CheckCircle2}];

export default function ModularBeltConveyor({ userId }: { userId: string }) {
 const [step,setStep]=useState<Step>('identificacion');
 const [name,setName]=useState(''); const [code,setCode]=useState(''); const [description,setDescription]=useState('');
 const [projectId,setProjectId]=useState<string|null>(null);
 const [projects,setProjects]=useState<Project[]>([]);
 const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [message,setMessage]=useState('');
 const index=steps.findIndex(s=>s.id===step);

 async function loadProjects() {
  if (!supabase) return;
  setLoading(true);
  const {data,error}=await supabase.from('conveyor_projects').select('id, project_name, project_code, description, updated_at').eq('created_by',userId).eq('equipment_family','modular_belt').order('updated_at',{ascending:false});
  if(error) setMessage('No se pudieron consultar los borradores. Verifica que se haya aplicado la migración de proyectos.');
  else setProjects((data||[]) as Project[]);
  setLoading(false);
 }
 useEffect(()=>{void loadProjects();},[userId]);

 async function saveProject() {
  if(!supabase || !name.trim()) {setMessage('Escribe el nombre del proyecto antes de guardar.');return;}
  setSaving(true);setMessage('');
  const values={project_name:name.trim(),project_code:code.trim()||null,description:description.trim()||null,equipment_family:'modular_belt',status:'draft',configuration:{schema_version:1,technical_data:{},components:[]},created_by:userId};
  const query=projectId
   ? supabase.from('conveyor_projects').update({...values,created_by:userId}).eq('id',projectId).select('id').single()
   : supabase.from('conveyor_projects').insert(values).select('id').single();
  const {data,error}=await query;
  if(error) setMessage('No se pudo guardar. Si aparece que la tabla no existe, falta ejecutar la nueva migración SQL en Supabase.');
  else {setProjectId(data.id);setMessage('Borrador guardado correctamente.');await loadProjects();}
  setSaving(false);
 }
 function openProject(project:Project) {
  setProjectId(project.id);setName(project.project_name);setCode(project.project_code||'');setDescription(project.description||'');setStep('identificacion');setMessage('Borrador cargado.');
 }

 return <div className="modular-builder">
  <div className="builder-intro"><div><small>CONFIGURADOR DE EQUIPOS · FAMILIA 01</small><h2>Conveyor de Banda Modular</h2><p>Base de configuración del primer modelo. Los datos técnicos y cálculos se definirán con tus especificaciones.</p></div><span className="equipment-tag">MODELO EN CONFIGURACIÓN</span></div>
  <section className="builder-card project-drafts">
   <div className="builder-section-title"><FolderOpen/><div><h3>Mis proyectos</h3><p>Guarda avances y continúa después desde tu cuenta.</p></div><button type="button" className="secondary-action" onClick={()=>{setProjectId(null);setName('');setCode('');setDescription('');setStep('identificacion');setMessage('Nuevo proyecto.');}}>Nuevo</button></div>
   {loading?<p className="draft-empty">Cargando proyectos…</p>:projects.length===0?<p className="draft-empty">Aún no tienes borradores guardados.</p>:<div className="draft-list">{projects.map(project=><button type="button" className={projectId===project.id?'draft-item selected':'draft-item'} key={project.id} onClick={()=>openProject(project)}><span><b>{project.project_name}</b><small>{project.project_code||'Sin clave'} · Actualizado {new Date(project.updated_at).toLocaleDateString('es-MX')}</small></span><ArrowRight size={16}/></button>)}</div>}
  </section>
  <div className="builder-progress">{steps.map((s,i)=>{const Icon=s.icon;return <button type="button" key={s.id} className={step===s.id?'builder-step current':i<index?'builder-step completed':'builder-step'} onClick={()=>setStep(s.id)}><Icon size={17}/><span><small>ETAPA {i+1}</small><b>{s.label}</b></span></button>})}</div>
  <section className="builder-card">
   {step==='identificacion'&&<><div className="builder-section-title"><ClipboardList/><div><h3>Identificación del proyecto</h3><p>Datos generales para organizar la cotización.</p></div></div><div className="builder-fields"><label>Nombre del proyecto<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. Línea de empaque · Conveyor 01" maxLength={150}/></label><label>Clave o número de proyecto<input value={code} onChange={e=>setCode(e.target.value)} placeholder="Clave interna (opcional)" maxLength={60}/></label><label className="field-full">Descripción / requerimiento del cliente<textarea rows={4} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe brevemente la necesidad del cliente." maxLength={2000}/></label></div><div className="builder-hint"><CheckCircle2/><span>La identificación se puede guardar como borrador. Los datos técnicos y cálculos aún no están habilitados.</span></div></>}
   {step==='configuracion'&&<><div className="builder-section-title"><Ruler/><div><h3>Configuración del equipo</h3><p>Se habilitarán los campos técnicos después de recibir tus datos.</p></div></div><div className="definition-panel"><Wrench/><div><b>Parámetros técnicos pendientes de especificación</b><p>No se supondrán dimensiones, geometrías, velocidades, capacidades ni condiciones de operación. Esperaremos tu lista de datos para cotizar este Conveyor de Banda Modular.</p></div></div><div className="definition-grid"><span><b>Equipo</b><small>Conveyor de Banda Modular</small></span><span><b>Unidades</b><small>Por definir</small></span><span><b>Modelo de cálculo</b><small>Pendiente</small></span></div></>}
   {step==='componentes'&&<><div className="builder-section-title"><Package/><div><h3>Componentes y materiales</h3><p>Estructura preparada para desglosar los elementos del equipo.</p></div></div><div className="empty-components"><Layers3/><b>Catálogo de componentes del conveyor</b><p>Aquí se organizarán componentes, cantidades, materiales y precios según la información que nos proporciones.</p><small>ESPERANDO ESPECIFICACIÓN</small></div></>}
   {step==='revision'&&<><div className="builder-section-title"><CheckCircle2/><div><h3>Revisión del proyecto</h3><p>Resumen de identificación capturada.</p></div></div><div className="review-list"><span>Equipo<b>Conveyor de Banda Modular</b></span><span>Proyecto<b>{name||'Sin nombre asignado'}</b></span><span>Clave<b>{code||'Sin clave'}</b></span><span>Descripción<b>{description||'Sin descripción'}</b></span><span>Estado<b>{projectId?'Borrador guardado':'Sin guardar'}</b></span></div><div className="builder-hint"><LockKeyhole/><span>El motor de cálculo y el precio permanecerán deshabilitados hasta validar contigo los datos y reglas.</span></div></>}
   {message&&<div className={message.startsWith('No se pudo')?'error-message':'builder-hint'}>{message}</div>}
   <div className="builder-actions"><button type="button" className="secondary-action" disabled={index===0} onClick={()=>setStep(steps[Math.max(0,index-1)].id)}><ArrowLeft size={16}/> Anterior</button><div className="builder-action-right"><button type="button" className="secondary-action" onClick={()=>void saveProject()} disabled={saving||!name.trim()}><Save size={15}/>{saving?'Guardando…':'Guardar borrador'}</button>{index<steps.length-1&&<button type="button" className="primary" onClick={()=>setStep(steps[index+1].id)}>Continuar <ArrowRight size={16}/></button>}</div></div>
  </section><div className="calculation-lock"><LockKeyhole/><span><b>Motor de cotización pendiente</b><small>Se activará después de documentar y validar los datos técnicos, componentes y reglas de cálculo.</small></span></div>
 </div>;
}
