/**
 * Device-only evidence photo storage (IndexedDB). Photos are NEVER uploaded:
 * they prove the planter exists to its owner and save mobile data.
 */
import type { FotoLocal } from "@/types/domain";

const DB_NAME = "semillas-de-bondad";
const STORE = "fotos";

interface Row {
  id: string;
  planta_id: string;
  creada_en: string;
  tamano_bytes: number;
  blob: Blob;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const store = req.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("planta_id", "planta_id");
      store.createIndex("creada_en", "creada_en");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** Downscale to max 1600px JPEG to keep IndexedDB small. */
export async function compressImage(file: Blob, max = 1600, quality = 0.82): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise((r) => canvas.toBlob((b) => r(b ?? file), "image/jpeg", quality));
  } catch {
    return file;
  }
}

const urls = new Map<string, string>();
const toFoto = (r: Row): FotoLocal => {
  if (!urls.has(r.id)) urls.set(r.id, URL.createObjectURL(r.blob));
  return {
    id: r.id,
    planta_id: r.planta_id,
    creada_en: r.creada_en,
    tamano_bytes: r.tamano_bytes,
    url: urls.get(r.id)!,
    blob: r.blob,
  };
};

export const indexedDbPhotoStore = {
  async list(): Promise<FotoLocal[]> {
    if (typeof indexedDB === "undefined") return [];
    const rows = await tx<Row[]>("readonly", (s) => s.getAll());
    return rows.sort((a, b) => b.creada_en.localeCompare(a.creada_en)).map(toFoto);
  },
  async save(plantaId: string, file: Blob): Promise<FotoLocal> {
    const blob = await compressImage(file);
    const row: Row = {
      id: crypto.randomUUID(),
      planta_id: plantaId,
      creada_en: new Date().toISOString(),
      tamano_bytes: blob.size,
      blob,
    };
    await tx("readwrite", (s) => s.put(row));
    return toFoto(row);
  },
  async remove(id: string) {
    await tx("readwrite", (s) => s.delete(id));
    const u = urls.get(id);
    if (u) URL.revokeObjectURL(u);
    urls.delete(id);
  },
};
