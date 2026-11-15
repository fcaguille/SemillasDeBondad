import { forwardRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { BrandMark } from "@/components/brand/BrandMark";
import { CollectiblePlantCard, type CollectiblePlanta } from "@/components/CollectiblePlantCard";
import { plantaUrl } from "@/lib/utils";

/**
 * 1080×1920 Instagram Stories composition. Rendered off-screen and rasterised
 * with html-to-image (pixelRatio 1 → exact story size).
 */
export const StoryExport = forwardRef<HTMLDivElement, { planta: CollectiblePlanta }>(
  function StoryExport({ planta }, ref) {
    return (
      <div
        ref={ref}
        className="relative flex flex-col items-center overflow-hidden text-white"
        style={{
          width: 1080,
          height: 1920,
          background: "radial-gradient(120% 70% at 50% 35%, #1A9248 0%, #14532D 55%, #0B2E1A 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div className="mt-[120px] flex items-center gap-6">
          <BrandMark size={96} />
          <div>
            <p className="text-[54px] font-extrabold leading-none tracking-[-0.02em]">
              Semillas de Bondad
            </p>
            <p className="mt-2 text-[30px] font-medium text-white/75">
              FCA · UNAM — Reto Ecosustentable
            </p>
          </div>
        </div>
        <div
          className="mt-[90px]"
          style={{ transform: "scale(2.35)", transformOrigin: "top center", height: 460 * 2.35 }}
        >
          <CollectiblePlantCard planta={planta} interactive={false} idle={false} />
        </div>
        <div className="mt-auto mb-[110px] flex items-center gap-8 rounded-[36px] bg-white/10 px-10 py-8 backdrop-blur">
          <div className="rounded-[20px] bg-white p-4">
            <QRCodeSVG value={plantaUrl(planta.id)} size={150} fgColor="#0F172A" marginSize={0} />
          </div>
          <div>
            <p className="text-[40px] font-extrabold leading-tight">¡Califica mi maceta!</p>
            <p className="mt-2 font-mono text-[30px] text-[#BBF7D0]">#{planta.id}</p>
          </div>
        </div>
      </div>
    );
  },
);
