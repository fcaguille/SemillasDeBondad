import type { FotoLocal } from "@/types/domain";
import { indexedDbPhotoStore } from "@/lib/photoStore";
import { FOTOS_DEMO } from "@/mocks/mockData";
import { USE_MOCKS } from "./config";

export interface PhotoRepository {
  list(): Promise<FotoLocal[]>;
  save(plantaId: string, file: Blob): Promise<FotoLocal>;
  remove(id: string): Promise<void>;
}

const HIDDEN_KEY = "sdb.demo.fotosOcultas";
const hiddenDemo = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_KEY) ?? "[]");
  } catch {
    return [];
  }
};

/** Real IndexedDB store; in demo mode, sample photos are appended so the grid isn't empty. */
export const photos: PhotoRepository = {
  async list() {
    const local = await indexedDbPhotoStore.list().catch(() => []);
    if (!USE_MOCKS) return local;
    const hidden = hiddenDemo();
    return [...local, ...FOTOS_DEMO.filter((f) => !hidden.includes(f.id))];
  },
  save: (plantaId, file) => indexedDbPhotoStore.save(plantaId, file),
  async remove(id) {
    if (USE_MOCKS && FOTOS_DEMO.some((f) => f.id === id)) {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenDemo(), id]));
      return;
    }
    await indexedDbPhotoStore.remove(id);
  },
};
