import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Home from "./pages/Home.tsx";
import Events from "./pages/Events.tsx";
import Recipes from "./pages/Recipes.tsx";
import Telephone from "./pages/Telephone.tsx";
import Admin from "./pages/Admin.tsx";
import Departments from "./pages/Departments.tsx";
import NotFound from "./pages/NotFound.tsx";
import ALaCarte from "./pages/ALaCarte.tsx";
import Reservations from "./pages/Reservations.tsx";
import AuthGate from "./components/AuthGate";
import RequireAdmin from "./components/RequireAdmin";
import PageTransition from "./components/PageTransition";
import { AuthProvider } from "@/contexts/AuthContext";
import { DepartmentProvider } from "@/contexts/DepartmentContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import type { Department } from "@/lib/department";

const queryClient = new QueryClient();

function DeptRoutes({ department }: { department: Department }) {
  return (
    <DepartmentProvider department={department}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="inventory" element={<Index />} />
        <Route path="events" element={<Events />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="telephone" element={<Telephone />} />
        <Route path="admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        <Route path="a-la-carte" element={<ALaCarte />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </DepartmentProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AuthGate>
          <BrowserRouter>
          <PageTransition>
            <Routes>
            {/* Top-level departments landing */}
            <Route path="/" element={<Departments />} />

            {/* Bar 512 — keeps original flat routes */}
            <Route
              path="/home"
              element={<DepartmentProvider department="bar512"><Home /></DepartmentProvider>}
            />
            <Route
              path="/inventory"
              element={<DepartmentProvider department="bar512"><Index /></DepartmentProvider>}
            />
            <Route
              path="/events"
              element={<DepartmentProvider department="bar512"><Events /></DepartmentProvider>}
            />
            <Route
              path="/recipes"
              element={<DepartmentProvider department="bar512"><Recipes /></DepartmentProvider>}
            />
            <Route
              path="/telephone"
              element={<DepartmentProvider department="bar512"><Telephone /></DepartmentProvider>}
            />
            <Route
              path="/admin"
              element={<DepartmentProvider department="bar512"><RequireAdmin><Admin /></RequireAdmin></DepartmentProvider>}
            />
            <Route
              path="/a-la-carte"
              element={<DepartmentProvider department="bar512"><ALaCarte /></DepartmentProvider>}
            />

            {/* Konferencje */}
            <Route path="/konferencje/*" element={<DeptRoutes department="konferencje" />} />

            {/* Polskie Smaki */}
            <Route path="/polskie-smaki/*" element={<DeptRoutes department="polskie_smaki" />} />

            <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
          </BrowserRouter>
        </AuthGate>
      </AuthProvider>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
