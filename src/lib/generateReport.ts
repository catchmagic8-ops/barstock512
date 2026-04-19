import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InventoryItem } from "./inventory";

export function generateReport(items: InventoryItem[]) {
  const now = new Date().toLocaleString();
  const flagged = items.filter((i) => i.needsRestock);
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(215, 76, 90);
  doc.text("INVENTORY RESTOCK REPORT", 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${now}`, 14, 30);
  doc.text(`Total items: ${items.length}  |  Flagged for restock: ${flagged.length}`, 14, 36);

  let y = 44;

  // Flagged items
  if (flagged.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor(215, 76, 90);
    doc.text("ITEMS NEEDING RESTOCK", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Item", "Category", "Unit", "Note", "Flagged"]],
      body: flagged.map((i) => [
        i.name,
        i.category,
        i.unit,
        i.restockNote || "—",
        i.flaggedAt ? new Date(i.flaggedAt).toLocaleString() : "—",
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
    doc.text("No items currently flagged for restock.", 14, y);
    y += 10;
  }

  // Full inventory by category
  const categories = [...new Set(items.map((i) => i.category))];
  categories.forEach((cat) => {
    const catItems = items.filter((i) => i.category === cat);

    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(13);
    doc.setTextColor(50, 50, 50);
    doc.text(cat.toUpperCase().replace("-", " "), 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Item", "Subcategory", "Unit", "Status"]],
      body: catItems.map((i) => [
        i.name,
        i.subcategory || "—",
        i.unit,
        i.needsRestock ? "⚠ NEEDS RESTOCK" : "OK",
      ]),
      theme: "grid",
      headStyles: { fillColor: [40, 44, 58], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 3) {
          if (typeof data.cell.raw === "string" && data.cell.raw.includes("NEEDS")) {
            data.cell.styles.textColor = [215, 76, 90];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`inventory-report-${Date.now()}.pdf`);
}
