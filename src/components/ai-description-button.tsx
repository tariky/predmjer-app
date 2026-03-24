import { useState } from "react";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Dialog, DialogContent,
} from "./ui/dialog";
import { Sparkles, Loader2, Check, RefreshCw, ArrowRight, Wand2 } from "lucide-react";
import { cn } from "../lib/utils";

type Props = {
  onResult: (data: { name: string; description: string }) => void;
};

export function AiDescriptionButton({ onResult }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ name: string; description: string } | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await api.post<{ name: string; description: string }>("/api/ai/generate-item", { prompt });
      setResult(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (result) onResult(result);
    setOpen(false);
    setPrompt("");
    setResult(null);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setPrompt("");
      setResult(null);
      setLoading(false);
    }
    setOpen(isOpen);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="w-3.5 h-3.5" />
        Pametni opis
      </Button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden border-primary/20">
          {/* Gradient header */}
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                <Wand2 className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">AI Asistent</h2>
                <p className="text-xs text-muted-foreground">Opisi stavku kratko — AI generise profesionalan naziv i opis</p>
              </div>
            </div>
          </div>

          {/* Input */}
          <div className="px-6 py-4">
            <div className="relative">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='npr. "beton temelja mb30 debljine 50cm" ili "gletovanje zidova 2 sloja"'
                className="min-h-[72px] resize-none pr-12 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !loading) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
              />
              <Button
                size="icon"
                className={cn(
                  "absolute bottom-2 right-2 h-8 w-8 rounded-lg transition-all",
                  prompt.trim() ? "opacity-100" : "opacity-40"
                )}
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Loading state */}
          {loading && !result && (
            <div className="px-6 pb-5">
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 bg-muted rounded-full w-2/3 animate-pulse" />
                    <div className="h-3 bg-muted rounded-full w-full animate-pulse" />
                    <div className="h-3 bg-muted rounded-full w-4/5 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="px-6 pb-5 space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/[0.03] overflow-hidden">
                {/* Name */}
                <div className="px-4 py-3 border-b border-primary/10">
                  <div className="text-[10px] uppercase tracking-wider text-primary/60 mb-1">Naziv</div>
                  <div className="text-sm font-semibold">{result.name}</div>
                </div>
                {/* Description */}
                <div className="px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wider text-primary/60 mb-1">Opis</div>
                  <div className="text-sm leading-relaxed text-muted-foreground">{result.description}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button onClick={handleAccept} className="flex-1 gap-2">
                  <Check className="w-4 h-4" />
                  Koristi rezultat
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={handleGenerate}
                  title="Generiši ponovo"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
