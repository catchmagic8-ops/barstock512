import type { InventoryItem } from "./inventory";

export function generateReport(items: InventoryItem[]) {
  const now = new Date().toLocaleString();
  const lowStock = items.filter((i) => i.quantity <= i.minStock);

  let text = `BAR INVENTORY REPORT\n${"=".repeat(40)}\nGenerated: ${now}\n\n`;
  text += `Total items: ${items.length}\n`;
  text += `Low stock items: ${lowStock.length}\n\n`;

  if (lowStock.length > 0) {
    text += `LOW STOCK ALERTS\n${"-".repeat(30)}\n`;
    lowStock.forEach((i) => {
      text += `⚠ ${i.name}: ${i.quantity} ${i.unit} (min: ${i.minStock})\n`;
    });
    text += "\n";
  }

  const categories = [...new Set(items.map((i) => i.category))];
  categories.forEach((cat) => {
    text += `\n${cat.toUpperCase()}\n${"-".repeat(30)}\n`;
    items
      .filter((i) => i.category === cat)
      .forEach((i) => {
        const flag = i.quantity <= i.minStock ? " ⚠" : "";
        text += `${i.name}: ${i.quantity} ${i.unit}${flag}`;
        if (i.usedThisShift) text += ` (used this shift: ${i.usedThisShift})`;
        text += "\n";
      });
  });

  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bar-inventory-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
