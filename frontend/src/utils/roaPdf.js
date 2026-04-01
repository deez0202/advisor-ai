import html2canvas from "html2canvas";
import jsPDF from "jspdf";

function rowInkScore(ctx, width, y, step = 6) {
  const row = ctx.getImageData(0, y, width, 1).data;
  let ink = 0;
  let total = 0;
  for (let x = 0; x < width; x += step) {
    const i = x * 4;
    const r = row[i];
    const g = row[i + 1];
    const b = row[i + 2];
    const a = row[i + 3];
    if (a < 10) continue;
    total += 1;
    // "Ink" means non-white pixels.
    if (r < 245 || g < 245 || b < 245) ink += 1;
  }
  return total ? ink / total : 0;
}

function findBestBreakY(ctx, width, minY, targetY, maxY) {
  let bestY = targetY;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let y = minY; y <= maxY; y += 2) {
    const score = rowInkScore(ctx, width, y);
    if (score < bestScore) {
      bestScore = score;
      bestY = y;
      // Good enough: almost-white row
      if (bestScore <= 0.01) break;
    }
  }
  return bestY;
}

export async function generatePDF() {
  const source = document.getElementById("roa-content");

  if (!source) {
    console.error("ROA preview not found");
    throw new Error("ROA preview not found");
  }

  const sandbox = document.createElement("div");
  sandbox.style.position = "fixed";
  sandbox.style.left = "0";
  sandbox.style.top = "0";
  sandbox.style.width = "794px";
  sandbox.style.background = "#ffffff";
  sandbox.style.zIndex = "-1";
  sandbox.style.pointerEvents = "none";
  sandbox.style.opacity = "1";
  sandbox.style.visibility = "visible";

  const element = source.cloneNode(true);
  element.id = "roa-content-clone";
  element.style.width = "794px";
  element.style.maxWidth = "794px";
  element.style.margin = "0";
  element.style.background = "#ffffff";
  element.style.overflow = "visible";
  element.style.boxShadow = "none";

  sandbox.appendChild(element);
  document.body.appendChild(sandbox);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    width: 794,
    windowWidth: 794,
    scrollX: 0,
    scrollY: 0,
    logging: false,
  });

  const pdf = new jsPDF("p", "mm", "a4");
  const margin = 10;
  const contentWidthMm = 190;
  const contentHeightMm = 277;
  const pxPerMm = canvas.width / contentWidthMm;
  const pageHeightPx = Math.floor(contentHeightMm * pxPerMm);
  const searchWindowPx = Math.floor(pageHeightPx * 0.18);
  const minSlicePx = Math.floor(pageHeightPx * 0.72);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    sandbox.remove();
    throw new Error("Could not create canvas context for PDF export.");
  }

  let pageIndex = 0;
  let sliceStartY = 0;
  while (sliceStartY < canvas.height) {
    if (pageIndex > 0) pdf.addPage();

    let sliceEndY;
    const idealEndY = sliceStartY + pageHeightPx;
    if (idealEndY >= canvas.height) {
      sliceEndY = canvas.height;
    } else {
      const minY = Math.max(sliceStartY + minSlicePx, idealEndY - searchWindowPx);
      const maxY = Math.min(canvas.height - 1, idealEndY + searchWindowPx);
      sliceEndY = findBestBreakY(ctx, canvas.width, minY, idealEndY, maxY);
    }

    const sliceHeightPx = Math.max(1, sliceEndY - sliceStartY);
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceHeightPx;

    const pageCtx = pageCanvas.getContext("2d");
    if (!pageCtx) {
      sandbox.remove();
      throw new Error("Could not create canvas context for PDF page.");
    }

    pageCtx.drawImage(
      canvas,
      0,
      sliceStartY,
      canvas.width,
      sliceHeightPx,
      0,
      0,
      canvas.width,
      sliceHeightPx
    );

    const pageImgData = pageCanvas.toDataURL("image/png");
    const renderHeightMm = sliceHeightPx / pxPerMm;
    pdf.addImage(pageImgData, "PNG", margin, margin, contentWidthMm, renderHeightMm);
    sliceStartY = sliceEndY;
    pageIndex += 1;
  }

  sandbox.remove();
  pdf.save("ROA.pdf");
}

export async function downloadRoaPdfDocument() {
  await generatePDF();
}
