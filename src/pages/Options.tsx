import { ArrowLeft, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OptionsPasswordGate from "@/components/OptionsPasswordGate";
import StockManager from "@/components/StockManager";

export default function Options() {
  const handleReset = () => {
    if (window.confirm("Reset all inventory to default values?")) {
      localStorage.removeItem("bar-inventory");
      window.location.href = "/";
    }
  };

  return (
    <OptionsPasswordGate>
      <div className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-2xl font-bold text-foreground">Options</h1>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <StockManager />
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">Data Management</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Reset inventory to default sample data. This cannot be undone.
              </p>
              <Button variant="destructive" onClick={handleReset} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Reset Inventory
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground">
                Bar Inventory Tracker — a shift-ready tool for tracking stock, usage, and restocking. Data is stored in the cloud.
              </p>
            </div>
          </div>
        </div>
      </div>
    </OptionsPasswordGate>
  );
}
