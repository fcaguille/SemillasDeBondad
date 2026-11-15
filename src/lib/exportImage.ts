import { toPng } from "html-to-image";

/** Rasterises a DOM node to PNG. Uses Web Share (files) on mobile, falls back to download. */
export async function exportNodeToPng(
  node: HTMLElement,
  filename: string,
  { pixelRatio = 2, share = true } = {},
) {
  const dataUrl = await toPng(node, { pixelRatio, cacheBust: true });
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: "image/png" });
  if (share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "Semillas de Bondad" });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}
