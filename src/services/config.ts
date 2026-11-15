/** Set VITE_USE_MOCKS=false in .env once real adapters are wired. */
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";

/** Demo credentials hint shown on the login tab only while mocks are active. */
export const DEMO_LOGIN = USE_MOCKS
  ? { numero_cuenta: "319048291", hint: "Demo: 319048291 · cualquier contraseña (6+)" }
  : null;

const REPO =
  import.meta.env.VITE_GITHUB_REPO_URL ?? "https://github.com/semillas-de-bondad/reto-fca";

/** Public transparency links (rules, enrolment base, escrow contract). */
export const LINKS = {
  repo: REPO,
  contrato: `${REPO}/blob/main/CONTRATO.md`,
  reglas: `${REPO}/blob/main/REGLAS.md`,
};
