import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSettings, setSetting } from "@/lib/appSettings";
import { COUNTING_LOCATIONS } from "@/lib/inventory";

/** Rooms are shared per department, e.g. counting_locations_bar512 */
export function countingLocationsKey(dept: string) {
  return `counting_locations_${dept}`;
}

function parse(value?: string): string[] | null {
  if (!value) return null;
  try {
    const arr = JSON.parse(value);
    if (Array.isArray(arr) && arr.every((v) => typeof v === "string")) return arr;
  } catch {
    /* ignore malformed setting */
  }
  return null;
}

/** Reads the editable room list for a department, falling back to the built-in walking order. */
export function useCountingLocations(department: string) {
  const queryClient = useQueryClient();
  const key = countingLocationsKey(department);

  const { data: locations = [...COUNTING_LOCATIONS] as string[], isLoading } = useQuery({
    queryKey: ["counting-locations", department],
    queryFn: async () => {
      const settings = await getSettings([key]);
      return parse(settings[key]) ?? ([...COUNTING_LOCATIONS] as string[]);
    },
  });

  const save = useMutation({
    mutationFn: async (next: string[]) => {
      await setSetting(key, JSON.stringify(next));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["counting-locations", department] }),
  });

  return { locations, isLoading, save };
}
