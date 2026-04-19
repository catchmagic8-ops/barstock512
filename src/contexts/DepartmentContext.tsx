import { createContext, useContext, useMemo } from "react";
import { DEPT_META, DEPT_TABLES, type Department, type DeptMeta, type DeptTables } from "@/lib/department";

interface DepartmentContextValue {
  department: Department;
  tables: DeptTables;
  meta: DeptMeta;
  basePath: string;
}

const DepartmentContext = createContext<DepartmentContextValue | null>(null);

export function DepartmentProvider({
  department,
  children,
}: {
  department: Department;
  children: React.ReactNode;
}) {
  const value = useMemo<DepartmentContextValue>(
    () => ({
      department,
      tables: DEPT_TABLES[department],
      meta: DEPT_META[department],
      basePath: DEPT_META[department].basePath,
    }),
    [department]
  );
  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
}

export function useDepartment(): DepartmentContextValue {
  const ctx = useContext(DepartmentContext);
  if (!ctx) throw new Error("useDepartment must be used inside <DepartmentProvider>");
  return ctx;
}
