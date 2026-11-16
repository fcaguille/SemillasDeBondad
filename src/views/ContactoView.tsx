import { useState, type FormEvent } from "react";
import { Page, PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/services/supabaseClient";
import { useUsuarioActual } from "@/hooks/useSemillas";

export function ContactoView() {
 const {data:usuario}=useUsuarioActual();
 const [nombre,setNombre]=useState(usuario?.nickname ?? "");
 const [correo,setCorreo]=useState("");
 const [asunto,setAsunto]=useState("");
 const [mensaje,setMensaje]=useState("");
 const [enviando,setEnviando]=useState(false);
 const [estado,setEstado]=useState<string|null>(null);
 const enviar=async(e:FormEvent)=>{e.preventDefault();setEstado(null);if(!nombre.trim()||!correo.trim()||!asunto.trim()||mensaje.trim().length<10){setEstado("Completa todos los campos. El mensaje debe tener al menos 10 caracteres.");return;}setEnviando(true);const {error}=await supabase.from("mensajes_contacto").insert({user_id:usuario?.id??null,nombre_o_nickname:nombre.trim(),correo_contacto:correo.trim(),asunto:asunto.trim(),mensaje:mensaje.trim()});setEnviando(false);if(error)setEstado("No pudimos enviar tu mensaje. Inténtalo de nuevo más tarde.");else{setEstado("¡Gracias! Recibimos tu mensaje.");setAsunto("");setMensaje("");}};
 return <Page><PageHeader title="Contacto" eyebrow="Estamos para escucharte"/><section className="mt-5 max-w-2xl rounded-card border border-border bg-card p-5 shadow-card"><p className="text-sm leading-6 text-muted-foreground">¿Tienes dudas, comentarios o sugerencias sobre Semillas de Bondad? Escríbenos y nos pondremos en contacto contigo.</p><form onSubmit={enviar} className="mt-4 grid gap-4"><label className="grid gap-1 text-sm font-semibold">Nombre o nickname<Input required value={nombre} onChange={e=>setNombre(e.target.value)} maxLength={80}/></label><label className="grid gap-1 text-sm font-semibold">Correo de contacto<Input required type="email" value={correo} onChange={e=>setCorreo(e.target.value)} maxLength={254}/></label><label className="grid gap-1 text-sm font-semibold">Asunto<Input required value={asunto} onChange={e=>setAsunto(e.target.value)} maxLength={120}/></label><label className="grid gap-1 text-sm font-semibold">Mensaje<textarea required minLength={10} maxLength={5000} rows={6} value={mensaje} onChange={e=>setMensaje(e.target.value)} className="rounded-lg border border-input bg-background p-3 text-sm"/></label>{estado&&<p role="status" className="text-sm font-medium">{estado}</p>}<Button type="submit" disabled={enviando}>{enviando?"Enviando…":"Enviar mensaje"}</Button></form><div className="mt-5 border-t border-border pt-4"><a className="text-sm font-semibold text-primary underline underline-offset-4" href="mailto:jguiram@comunidad.unam.mx?subject=Semillas%20de%20Bondad">Abrir en mi aplicación de correo (jguiram@comunidad.unam.mx)</a></div></section></Page>;
}
