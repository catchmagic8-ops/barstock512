import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { InventoryItem } from "./inventory";

export function generateReport(items: InventoryItem[]) {
  const now = new Date().toLocaleString();
  const lowStock = items.filter((i) => i.quantity <= i.minStock);
  const doc = new jsPDF();

  // Title
  doc.setFontSize(20);
  doc.setTextColor(215, 76, 90); // primary #d74c5a
  doc.text("BAR INVENTORY REPORT", 14, 22);

  // Subtitle
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated: ${now}`, 14, 30);
  doc.text(`Total items: ${items.length}  |  Low stock: ${lowStock.length}`, 14, 36);

  let y = 44;

  // Low stock alerts
  if (lowStock.length > 0) {
    doc.setFontSize(13);
    doc.setTextColor(215, 76, 90);
    doc.text("LOW STOCK ALERTS", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["Item", "Current", "Min", "Unit"]],
      body: lowStock.map((i) => [i.name, String(i.quantity), String(i.minStock), i.unit]),
      theme: "grid",
      headStyles: { fillColor: [215, 76, 90], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Category tables
  const categories = [...new Set(items.map((i) => i.category))];
  categories.forEach((cat) => {
    const catItems = items.filter((i) => i.category === cat);

    // Page break if not enough space
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
      head: [["Item", "Qty", "Unit", "Min Stock", "Used This Shift", "Status"]],
      body: catItems.map((i) => [
        i.name,
        String(i.quantity),
        i.unit,
        String(i.minStock),
        String(i.usedThisShift || 0),
        i.quantity <= i.minStock ? "⚠ LOW" : "OK",
      ]),
      theme: "grid",
      headStyles: { fillColor: [40, 44, 58], textColor: 255 },
      styles: { fontSize: 9 },
      margin: { left: 14 },
      didParseCell: (data: any) => {
        if (data.section === "body" && data.column.index === 5) {
          if (data.cell.raw === "⚠ LOW") {
            data.cell.styles.textColor = [215, 76, 90];
            data.cell.styles.fontStyle = "bold";
          }
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  });

  doc.save(`bar-inventory-${Date.now()}.pdf`);
}
