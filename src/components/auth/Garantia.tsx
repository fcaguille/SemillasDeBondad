import { useId, useState, type ReactNode } from "react";
import { Lock, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { activarGarantia } from "@/lib/pagos";
import { tieneGarantia, type Usuario } from "@/types/domain";

export function ActivarGarantiaButton({ children, className, size = "lg", ...props }: Omit<ButtonProps,"onClick"|"variant">) {
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const iniciar=async()=>{setError(null);setPending(true);try{await activarGarantia();}catch(e){setError(e instanceof Error?e.message:"No pudimos iniciar el pago.");setPending(false);}};
 return <div className="w-full">
  <Button {...props} disabled={pending||props.disabled} variant="mp" size={size} className={cn("gap-[6px] tracking-[-0.01em]",className)} onClick={iniciar}>
   {pending?<Loader2 size={16} className="animate-spin" aria-hidden/>:<Lock size={16} strokeWidth={2.4} aria-hidden/>}{pending?"Conectando con Mercado Pago…":children}
  </Button>
  {error&&<p role="alert" className="mt-2 text-sm font-medium text-crimson">{error}</p>}
 </div>;
}

export function EstadoCuentaBadge({usuario,className}:{usuario:Pick<Usuario,"estado">;className?:string}) {
 if(usuario.estado==="suspendida") return <Badge variant="destructive" className={className}>Cuenta suspendida</Badge>;
 return tieneGarantia(usuario)?<Badge variant="success" className={className}><ShieldCheck size={13}/> Cuenta Activa · Participando por el Pozo</Badge>:<Badge variant="info" className={className}><Sparkles size={13}/> Modo Gratuito · Solo Votación</Badge>;
}
export const COPY_MODO_GRATUITO="Modo Gratuito: puedes explorar, escanear códigos QR y votar macetas. Activa tu garantía para crear macetas y participar por el premio.";
export function ModoGratuitoCard({className,title="Crear macetas está bloqueado",cta="Activar Garantía ($16.00 MXN)",extra}:{className?:string;title?:string;cta?:string;extra?:ReactNode}) {
 const titleId=useId();
 return <section aria-labelledby={titleId} className={cn("relative overflow-hidden rounded-card border border-[#BDE5F7] bg-gradient-to-br from-[#F2FAFE] to-card p-5 shadow-card md:p-6",className)}>
  <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#E6F5FC] text-[#00669A]"><Lock size={20}/></span><div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#00669A]">Modo Gratuito</p><h2 id={titleId} className="mt-[2px] text-[18px] font-extrabold">{title}</h2></div></div>
  <p className="mt-3 text-[14px] leading-[20px] text-muted-foreground">{COPY_MODO_GRATUITO}</p>{extra}
  <ActivarGarantiaButton className="mt-4 w-full text-[15px] md:w-auto md:px-6">{cta}</ActivarGarantiaButton>
  <p className="mt-2 text-[11px] font-medium text-muted-foreground">Pago único de $16.00 MXN procesado de forma segura por Mercado Pago.</p>
 </section>;
}
