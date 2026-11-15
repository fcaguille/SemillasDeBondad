# Términos y Condiciones del Programa "Semillas de Bondad" (FCA-UNAM)

**Última actualización:** Noviembre de 2026  
**Repositorio oficial de auditoría:** `https://github.com/fcaguille/SemillasDeBondad`

---

## 1. Objeto y Naturaleza del Programa
**Semillas de Bondad** es una iniciativa estudiantil de economía circular, sostenibilidad ambiental e innovación tecnológica dirigida a la comunidad de la Facultad de Contaduría y Administración de la Universidad Nacional Autónoma de México (FCA-UNAM). El programa incentiva la recolección y transformación de residuos sólidos en macetas funcionales mediante un sistema de trazabilidad con códigos QR y competencia proporcional entre licenciaturas.

Este programa constituye una dinámica académica y comunitaria sin fines de lucro; los organizadores actúan únicamente como administradores técnicos y custodios temporales del fondo común (*escrow* comunitario).

---

## 2. Elegibilidad y Modalidades de Participación
Podrán participar estudiantes inscritos en cualquiera de las licenciaturas de la FCA-UNAM (**Contaduría**, **Administración**, **Informática** y **Negocios Internacionales**) mediante el registro de su **Número de Cuenta UNAM (9 dígitos)** único. Existen dos niveles de acceso:

1. **Modalidad Gratuita (Observador y Evaluador):**
   * No requiere aportación económica.
   * Permite escanear códigos QR de las macetas físicas en el campus y emitir calificaciones públicas de calidad (escala de 1 a 5 estrellas).
   * No permite registrar macetas propias, sumar puntos al índice de su licenciatura, emitir reportes de penalización ni reclamar parte del fondo acumulado.
2. **Modalidad Participante Activo (Garantía de Compromiso):**
   * Requiere el pago único de **$16.00 MXN** mediante la pasarela integrada (Mercado Pago).
   * Habilita el registro de macetas (individual o en equipo), la acumulación de puntos para su licenciatura, la facultad de auditar/reportar irregularidades y el derecho a participar en la adjudicación del fondo común si su licenciatura resulta ganadora.

---

## 3. Estructura Financiera, Custodia y Comisiones
Para garantizar la viabilidad operativa sin costo de infraestructura y asegurar la integridad del premio:

* **Monto total de entrada:** **$16.00 MXN** por cuenta única.
* **Desglose transparente:**
  * **$10.00 MXN** ingresan íntegramente al **Fondo Común en Custodia** (pozo acumulado visible en tiempo real en la aplicación).
  * **~$6.00 MXN** cubren exclusivamente las comisiones de procesamiento e impuestos retenidos por la pasarela de pagos (Mercado Pago Checkout Pro).
* **No reembolsabilidad:** La aportación de $10.00 MXN al fondo común constituye una garantía de compromiso competitivo; por su naturaleza de pozo compartido entre licenciaturas, no es reembolsable una vez acreditado el pago.

---

## 4. Requisitos Técnicos y Ambientales de las Creaciones
Toda maceta registrada en la plataforma deberá cumplir estrictamente con los siguientes criterios físicos:

1. **100% Materiales Reciclados o Reutilizados:** El cuerpo de la maceta deberá construirse a partir de residuos recuperados (botellas PET, latas, envases, cartón tratado, cuerdas, textiles o similares). Queda prohibido el uso de macetas comerciales nuevas.
2. **Sistema Funcional de Riego y Drenaje:** Debe contar con un mecanismo básico de retención o desagüe controlado que evite encharcamientos o daños en las instalaciones de la facultad.
3. **Mantenimiento y Limpieza:** La planta debe mantenerse viva, hidratada y libre de basura externa durante toda la vigencia del certamen.
4. **Equipos y Reparto Proporcional:** Cada maceta puede registrarse de forma individual o en equipos de **hasta 3 integrantes activos** (incluso de distintas licenciaturas). Tanto los puntos obtenidos como las penalizaciones aplicables se dividirán en partes iguales ($1/k$) entre las licenciaturas de los integrantes registrados.

---

## 5. Modelo Matemático de Evaluación Proporcional
Para garantizar equidad absoluta frente a las diferencias de población estudiantil entre las licenciaturas de la FCA-UNAM, la carrera ganadora se determinará mediante el **Índice Ecosustentable Proporcional ($IE_c$)**:

$$IE_c = \frac{\sum_{i=1}^{N_c} P_i}{M_c}$$

Donde:
* **$IE_c$**: Índice Ecosustentable de la licenciatura $c$ (redondeado a 4 decimales).
* **$N_c$**: Total de participaciones válidas vinculadas a estudiantes de la licenciatura $c$.
* **$P_i$**: Puntaje neto acumulado por la maceta $i$ (10 puntos base por creación válida + suma de estrellas recibidas en evaluaciones de calidad de 1 a 5 estrellas $-$ penalizaciones confirmadas), dividido equitativamente entre el número de co-creadores.
* **$M_c$**: Matrícula oficial base asignada a la licenciatura $c$ al inicio del certamen y publicada en la tabla `carreras` del sistema.

---

## 6. Reglas de Integridad, Auditoría Comunitaria y Sanciones
El sistema opera bajo cuatro candados técnicos y normativos de cumplimiento obligatorio:

1. **Sanción por Mala Fe y Efecto Cascada:** Cualquier acto comprobado de fraude, suplantación de identidad, registro de macetas inexistentes, manipulación de códigos QR o sabotaje deliberado conlleva la **descalificación inmediata**, la **pérdida de la garantía económica** (que permanecerá en el pozo común) y la **anulación retroactiva de todas las macetas** en las que el infractor haya participado, descontando esos puntos a sus respectivos equipos y licenciaturas.
2. **Prohibición de Autovoto:** El sistema bloquea técnicamente que los creadores de una maceta puedan calificarla o reportarla.
3. **Voto Único y Auditoría Pública:** Cada cuenta puede calificar una misma maceta una sola vez. Toda calificación emitida (nombre público del evaluador, carrera y estrellas otorgadas) es pública en la ficha de la maceta.
4. **Umbral de Consenso para Reportes (Anti-Spam):** Las cuentas activas pueden reportar anomalías físicas conforme al siguiente tabulador de penalización:
   * *Maceta sucia o con basura externa:* **-10 puntos**
   * *Planta seca o en abandono total:* **-15 puntos**
   * *Uso de materiales nuevos / no reciclables:* **-25 puntos**
   
   Para evitar ataques individuales por rencor, **ningún reporte restará puntos hasta que la maceta acumule al menos 5 reportes únicos de distintos estudiantes**, momento en el cual se aplicará la penalización acumulada.

---

## 7. Privacidad y Arquitectura "Cero Imágenes en Servidor"
* **Datos Privados:** El Número de Cuenta UNAM (`no_cuenta`) y el historial de transacciones de pago se almacenan cifrados y con acceso restringido exclusivamente para validación de unicidad y auditoría interna. Nunca se publican completos en la interfaz.
* **Datos Públicos:** El alias (`nickname`), la licenciatura, la biografía corta, las macetas creadas y las calificaciones emitidas son de carácter público para garantizar la transparencia del certamen.
* **Fotografías Locales:** Las fotografías reales capturadas al registrar una maceta **no se suben ni almacenan en servidores externos**; permanecen guardadas únicamente en el almacenamiento local (`IndexedDB`) del navegador del dispositivo donde fueron tomadas.

---

## 8. Cierre del Certamen y Adjudicación del Fondo
Al cumplirse la fecha y hora de cierre establecidas en la convocatoria oficial, el sistema suspenderá el registro de nuevas creaciones y votos. Se publicará el acta digital con el desglose de pagos verificados y el cálculo final de $IE_c$. El 100% del fondo neto acumulado ($10.00 MXN por cada participante activo) será entregado públicamente a la comunidad de la licenciatura que obtenga el mayor Índice Ecosustentable.
