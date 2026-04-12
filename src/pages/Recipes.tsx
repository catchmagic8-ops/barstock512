import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, BookOpen, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

async function uploadRecipeImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("recipe-images").upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from("recipe-images").getPublicUrl(path);
  return data.publicUrl;
}

export default function Recipes() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("cocktail");
  const [ingredients, setIngredients] = useState("");
  const [instructions, setInstructions] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: recipes = [], isLoading } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addRecipe = useMutation({
    mutationFn: async () => {
      let image_url: string | null = null;
      if (imageFile) {
        image_url = await uploadRecipeImage(imageFile);
      }
      const { error } = await supabase
        .from("recipes")
        .insert({ name, category, ingredients, instructions, image_url });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      setOpen(false);
      setName("");
      setCategory("cocktail");
      setIngredients("");
      setInstructions("");
      setImageFile(null);
      setImagePreview(null);
      toast.success("Recipe added");
    },
    onError: () => toast.error("Failed to add recipe"),
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast.success("Recipe deleted");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/home">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-heading text-lg font-bold text-foreground">Recipes</h1>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Recipe
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-lg">No recipes yet</p>
            <p className="text-sm">Add your first cocktail recipe</p>
          </div>
        ) : (
          recipes.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={r.name}
                        className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <h3 className="font-heading font-bold text-foreground">{r.name}</h3>
                      <span className="text-xs text-primary capitalize">{r.category}</span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                </button>

                {isOpen && (
                  <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        alt={r.name}
                        className="w-full max-h-64 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Ingredients
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-line">{r.ingredients}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Instructions
                      </p>
                      <p className="text-sm text-foreground whitespace-pre-line">{r.instructions}</p>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive gap-1.5"
                        onClick={() => deleteRecipe.mutate(r.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Add Recipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Recipe name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary border-border"
            />
            <Input
              placeholder="Category (e.g. cocktail, mocktail, shot)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-secondary border-border"
            />
            <Textarea
              placeholder="Ingredients (one per line)"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={4}
              className="bg-secondary border-border"
            />
            <Textarea
              placeholder="Instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="bg-secondary border-border"
            />
            {/* Image upload */}
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full max-h-48 rounded-lg object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => { setImageFile(null); setImagePreview(null); }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full gap-2 border-dashed border-border text-muted-foreground"
                  onClick={() => fileRef.current?.click()}
                >
                  <ImagePlus className="h-4 w-4" /> Add Photo
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addRecipe.mutate()}
              disabled={!name || !ingredients || !instructions || addRecipe.isPending}
            >
              {addRecipe.isPending ? "Adding…" : "Add Recipe"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}