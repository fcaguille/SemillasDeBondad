export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true";
export const DEMO_LOGIN = USE_MOCKS ? { numero_cuenta: "319048291", hint: "Cuenta de demostración local." } : null;
export const LINKS = { repo: "https://github.com/fcaguille/SemillasDeBondad", contrato: "https://github.com/fcaguille/SemillasDeBondad/blob/main/T%26C.md", reglas: "https://github.com/fcaguille/SemillasDeBondad/blob/main/T%26C.md" };
