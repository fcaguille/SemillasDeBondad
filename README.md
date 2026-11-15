# 🌱 Semillas de Bondad — Plataforma PWA de Economía Circular (FCA-UNAM)

**Semillas de Bondad** es una Progressive Web App (PWA) que combina **economía conductual**, **trazabilidad mediante códigos QR** y **microfinanzas transparentes** para incentivar la creación de macetas 100% recicladas dentro de la Facultad de Contaduría y Administración de la UNAM.

---

## 🎯 Propósito e Impacto Social

El sistema transforma la participación ambiental voluntaria en una dinámica de cooperación cívica y competencia interdisciplinaria entre las licenciaturas de la FCA (**Contaduría**, **Administración**, **Informática** y **Negocios Internacionales**), aterrizando a escala universitaria los tres pilares del desarrollo sostenible (Ecológico, Social y Económico) y los ODS 11, 12, 13, 16 y 17 de la Agenda 2030:

* **Economía Circular Tangible:** Reutilización de residuos cotidianos del campus para construir macetas con sistemas propios de autorriego y drenaje.
* **Incentivo con Aversión a la Pérdida:** Los participantes activos aportan una garantía de entrada de **$16.00 MXN** vía Mercado Pago ($10.00 MXN netos van íntegros al fondo común en custodia y ~$6.00 MXN cubren comisiones de pasarela). El pozo acumulado se adjudica al cierre a la licenciatura ganadora.
* **Identidad Coleccionable:** Cada maceta física se vincula a un código QR que despliega una carta digital interactiva en 3D con uno de 5 arquetipos botánicos vectoriales.
* **Acceso Inclusivo en Dos Niveles:** Cualquier estudiante puede registrarse gratis para escanear códigos QR y calificar macetas (1 a 5 estrellas), mientras que la creación de macetas y emisión de reportes requiere garantía activa.

---

## 📐 Modelo Matemático y Reglas Anti-Trampa

Para evitar sesgos por tamaño de matrícula entre licenciaturas, el ranking se calcula en tiempo real mediante el **Índice Ecosustentable Proporcional ($IE_c$)**:

$$IE_c = \frac{\sum_{i=1}^{N_c} P_i}{M_c}$$

* **$P_i$**: Puntaje neto de cada maceta (repartido equitativamente entre equipos de hasta 3 integrantes).
* **$M_c$**: Matrícula oficial base de cada licenciatura.

### Candados de Integridad Implementados en Base de Datos (PostgreSQL RPC / RLS)
1. **Unicidad de Matrícula:** Validación 1 a 1 mediante Número de Cuenta UNAM de 9 dígitos.
2. **Bloqueo de Autovoto:** Los creadores de una maceta no pueden calificarla ni reportarla.
3. **Auditoría Pública de Calidad (5 Estrellas):** Cada evaluación registra públicamente quién votó, su licenciatura y la calificación otorgada.
4. **Consenso Anti-Spam (Umbral de 5 Reportes):** Las penalizaciones por anomalías físicas (`-10`, `-15` o `-25` pts) solo se activan cuando al menos 5 cuentas activas distintas reportan la misma maceta.
5. **Sanción en Cascada por Dolo:** La descalificación de un usuario anula retroactivamente los puntos de todas las creaciones en las que haya colaborado.

---

## 🛠️ Stack Tecnológico y Arquitectura

| Capa | Tecnología | Función en el Sistema |
| :--- | :--- | :--- |
| **Frontend PWA** | React + Vite + TypeScript | Interfaz responsiva *mobile-first* instalable en iOS, Android y escritorio. |
| **Estilos y Animación 3D** | Tailwind CSS + Motion + shadcn/ui | Carta coleccionable interactiva (`perspective`, `rotateX/Y`) y gráficas en vivo. |
| **Almacenamiento Local** | IndexedDB (`idb-keyval`) | **Arquitectura "Cero Imágenes en Servidor"**: las fotos reales se guardan solo en el dispositivo del creador. |
| **Base de Datos y Auth** | Supabase (PostgreSQL + RLS + RPC) | Integridad referencial, ejecución atómica de reglas anti-trampa y suscripciones Realtime. |
| **Pasarela de Pagos** | Mercado Pago Checkout Pro + Edge Functions | Generación de preferencias de cobro y activación automática vía Webhooks. |

---

## 📄 Documentación Legal y Auditoría
Consulta las reglas completas, el tabulador de sanciones y la fórmula oficial en:  
👉 **[Términos y Condiciones del Programa](https://github.com/fcaguille/SemillasDeBondad/blob/main/T%26C.md)**
