import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LINKS } from "@/services/config";

export function IntroPrograma() {
  const [open,setOpen]=useState(false);
  useEffect(()=>{
    const key="semillas_intro_hardware_v1";
    if(!window.localStorage.getItem(key)){window.localStorage.setItem(key,"1");setOpen(true);}
    const reopen=()=>setOpen(true);
    window.addEventListener("semillas:ver-introduccion",reopen);
    return ()=>window.removeEventListener("semillas:ver-introduccion",reopen);
  },[]);
  if(!open)return null;
  return <div role="dialog" aria-modal="true" aria-labelledby="intro-title" className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4">
    <section className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl">
      <p className="text-xs font-bold uppercase tracking-widest text-primary">FCA · UNAM</p>
      <h2 id="intro-title" className="mt-2 text-2xl font-extrabold">Bienvenido a Semillas de Bondad</h2>
      <p className="mt-3 text-sm leading-6">Un reto ecológico, social y financiero para impulsar a tu carrera: reutiliza materiales, crea comunidad y ayuda a construir un entorno más sustentable.</p>
      <h3 className="mt-4 font-bold">Antes de participar</h3>
      <p className="mt-1 text-sm leading-6">La activación cuesta $10.00 MXN en un solo pago; $4.95 MXN se destinan al pozo común y $5.05 MXN corresponden a la comisión de Mercado Pago: 3.5% + $4.00 MXN fijos, más 16% de IVA sobre la comisión.</p>
      <p className="mt-1 text-sm leading-6">Puedes explorar y votar en Modo Gratuito. La garantía activa habilita la creación de macetas y la participación por el premio. Se aplican reglas contra trampas y manipulaciones. Las fotografías de evidencia se guardan únicamente en tu dispositivo, no se suben al servidor.</p>
      <a className="mt-2 inline-block text-sm font-semibold text-primary underline" href={LINKS.contrato} target="_blank" rel="noopener noreferrer">Consulta los Términos y Condiciones</a>
      <p className="mt-4 rounded-xl bg-secondary p-3 text-sm font-semibold leading-6">Tienes hasta el 30 de noviembre de 2027 para hacer crecer a tu carrera; el 11 de diciembre de 2027 se publican los resultados y se abre la convocatoria para recibir el premio.</p>
      <Button className="mt-5 w-full" onClick={()=>setOpen(false)}>Comenzar</Button>
    </section>
  </div>;
}
