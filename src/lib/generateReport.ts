import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InventoryItem } from "./inventory";

export type ReportScope = "full" | "low";
export type ReportSort = "storehouse" | "category" | "name" | "qty-left";

export interface ReportOptions {
  scope: ReportScope;
  sortBy: ReportSort;
  deptLabel?: string;
}

// jsPDF's built-in fonts can't render Polish diacritics or symbols like ⚠ —
// normalize to plain ASCII so the PDF always generates cleanly.
function sanitize(value: unknown): string {
  const s = String(value ?? "");
  const map: Record<string, string> = {
    ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
    Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z",
  };
  return s
    .replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (c) => map[c] ?? c)
    .replace(/[^\x00-\xFF]/g, "");
}

export function sortFlagged(flagged: InventoryItem[], sortBy: ReportSort): InventoryItem[] {
  const arr = [...flagged];
  const house = (i: InventoryItem) => (i.storehouse || "zzz").toLowerCase();
  switch (sortBy) {
    case "storehouse":
      arr.sort((a, b) => house(a).localeCompare(house(b)) || a.name.localeCompare(b.name));
      break;
    case "category":
      arr.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
      break;
    case "qty-left":
      arr.sort(
        (a, b) => (a.qtyLeft ?? Number.POSITIVE_INFINITY) - (b.qtyLeft ?? Number.POSITIVE_INFINITY) ||
          a.name.localeCompare(b.name)
      );
      break;
    default:
      arr.sort((a, b) => a.name.localeCompare(b.name));
  }
  return arr;
}

export function buildReport(items: InventoryItem[], opts: ReportOptions): jsPDF {
  const { scope, sortBy, deptLabel } = opts;
  const now = new Date().toLocaleString();
  const flagged = sortFlagged(items.filter((i) => i.needsRestock), sortBy);
  const doc = new jsPDF();

  const dept = deptLabel ? `${sanitize(deptLabel.toUpperCase())} — ` : "";

  // Title
  doc.setFontSize(20);
  doc.setTextColor(215, 76, 90);
  doc.text(sanitize(`${dept}${scope === "low" ? "RAPORT NISKICH STANOW" : "RAPORT UZUPELNIEN MAGAZYNU"}`), 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(sanitize(`Wygenerowano: ${now}`), 14, 30);
  doc.text(sanitize(`Liczba pozycji: ${items.length}  |  Zgloszone do uzupelnienia: ${flagged.length}`), 14, 36);

  let y = 44;

  // Flagged items
  if (flagged.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor(215, 76, 90);
    doc.text(sanitize(`POZYCJE DO UZUPELNIENIA (sortowanie: ${sortBy.replace("-", " ")})`), 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Pozycja", "Kategoria", "Magazyn", "Pozostalo", "Do zamowienia", "Notatka"]],
      body: flagged.map((i) => [
        sanitize(i.name),
        sanitize(i.category.replace("-", " ")),
        sanitize(i.storehouse || "—"),
        i.qtyLeft != null ? String(i.qtyLeft) : "—",
        i.qtyToOrder != null ? String(i.qtyToOrder) : "—",
        sanitize(i.restockNote || "—"),
      ]),
      theme: "grid",
      headStyles: { fillColor: [215, 76, 90], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text("Brak pozycji zgloszonych do uzupelnienia.", 14, y);
    y += 10;
  }

  // Full inventory by category (only for full reports)
  if (scope === "full") {
    const categories = [...new Set(items.map((i) => i.category))];
    categories.forEach((cat) => {
      const catItems = items.filter((i) => i.category === cat);

      if (y > 250) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(13);
      doc.setTextColor(50, 50, 50);
      doc.text(sanitize(String(cat).toUpperCase().replace(/-/g, " ")), 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [["Pozycja", "Podkategoria", "Jednostka", "Magazyn", "Status"]],
        body: catItems.map((i) => [
          sanitize(i.name),
          sanitize(i.subcategory || "—"),
          sanitize(i.unit),
          sanitize(i.storehouse || "—"),
          i.needsRestock ? "DO UZUPELNIENIA" : "OK",
        ]),
        theme: "grid",
        headStyles: { fillColor: [40, 44, 58], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 14 },
        didParseCell: (data: any) => {
          if (data.section === "body" && data.column.index === 4) {
            if (typeof data.cell.raw === "string" && data.cell.raw.includes("UZUPELNIENIA")) {
              data.cell.styles.textColor = [215, 76, 90];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    });
  }

  return doc;
}

export function generateReport(items: InventoryItem[]) {
  buildReport(items, { scope: "full", sortBy: "category" }).save(`inventory-report-${Date.now()}.pdf`);
}

/**
 * Generates a blank physical-count sheet for hand-checking inventory.
 * Lists every item grouped by category/subcategory with empty Quantity & Notes
 * columns for staff to fill in by hand, then save/print.
 */
export function generateBlankCountSheet(items: InventoryItem[], deptLabel = "INVENTORY") {
  const now = new Date().toLocaleDateString();
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.setTextColor(215, 76, 90);
  doc.text(sanitize(`${deptLabel.toUpperCase()} — ARKUSZ INWENTARYZACJI`), 14, 20);

  // Meta header lines (date / counted by / shift)
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Data: ${now}`, 14, 28);
  doc.text("Policzyl: ____________________________", 70, 28);
  doc.text("Zmiana / Notatki: ____________________________", 14, 34);

  let y = 42;

  // Group by category, then subcategory
  const categories = [...new Set(items.map((i) => i.category))].sort();

  categories.forEach((cat) => {
    const catItems = items
      .filter((i) => i.category === cat)
      .sort((a, b) => {
        const sa = a.subcategory || "";
        const sb = b.subcategory || "";
        if (sa !== sb) return sa.localeCompare(sb);
        return a.name.localeCompare(b.name);
      });

    if (catItems.length === 0) return;

    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.setTextColor(50, 50, 50);
    doc.text(sanitize(String(cat).toUpperCase().replace(/-/g, " ")), 14, y);
    y += 4;

    // Two-column layout per category to save paper
    const half = Math.ceil(catItems.length / 2);
    const left = catItems.slice(0, half);
    const right = catItems.slice(half);
    const rows: string[][] = [];
    for (let i = 0; i < half; i++) {
      rows.push([
        sanitize(left[i]?.name ?? ""),
        "",
        sanitize(right[i]?.name ?? ""),
        "",
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["Pozycja", "Ilosc", "Pozycja", "Ilosc"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [40, 44, 58], textColor: 255, fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 1.2, minCellHeight: 5.5 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 22 },
        2: { cellWidth: 70 },
        3: { cellWidth: 22 },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 5;
  });

  doc.save(`count-sheet-${Date.now()}.pdf`);
}
