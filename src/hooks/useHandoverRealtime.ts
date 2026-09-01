import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subskrybuje zmiany w tablicy INFO / handover w czasie rzeczywistym
 * i odświeża zapytania listy oraz licznika na kafelce.
 */
export function useHandoverRealtime(department: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!department) return;

    const channel = supabase
      .channel(`handover-notes-${department}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "handover_notes" },
        () => {
          qc.invalidateQueries({ queryKey: ["handover-notes", department] });
          qc.invalidateQueries({ queryKey: ["handover-notes-count", department] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "handover_reactions" },
        () => {
          qc.invalidateQueries({ queryKey: ["handover-reactions", department] });
        }
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };
  }, [department, qc]);
}
