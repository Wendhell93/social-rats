import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";

interface ScoreTooltipProps {
  score: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  views?: number;
  className?: string;
}

export function ScoreTooltip({ score, likes = 0, comments = 0, shares = 0, saves = 0, views = 0, className }: ScoreTooltipProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className={`inline-flex items-center gap-1 cursor-help ${className || ""}`}>
          <span className="text-xl font-bold gradient-text">{score.toFixed(0)}</span>
          <span className="text-[10px] text-muted-foreground">pts</span>
          <Info className="w-3 h-3 text-muted-foreground/50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 text-xs bg-card border-border" side="left" align="start">
        <p className="font-semibold text-sm mb-2">Como o score foi calculado</p>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between">
            <span>Curtidas ({likes.toLocaleString()})</span>
            <span>x peso</span>
          </div>
          <div className="flex justify-between">
            <span>Comentários ({comments.toLocaleString()})</span>
            <span>x peso</span>
          </div>
          <div className="flex justify-between">
            <span>Compartilh. ({shares.toLocaleString()})</span>
            <span>x peso</span>
          </div>
          <div className="flex justify-between">
            <span>Salvamentos ({saves.toLocaleString()})</span>
            <span>x peso</span>
          </div>
          {views > 0 && (
            <div className="flex justify-between">
              <span>Bônus engajamento</span>
              <span>baseado em views</span>
            </div>
          )}
          <div className="border-t border-border pt-1.5 flex justify-between font-semibold text-foreground">
            <span>Score final</span>
            <span>{score.toFixed(0)} pts</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-2">
          Score = (base + bônus) x tipo conteúdo x tipo mídia
        </p>
      </PopoverContent>
    </Popover>
  );
}
