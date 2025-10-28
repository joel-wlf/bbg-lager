import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface EntnahmenHeaderProps {
  onCreateEntnahme: () => void;
}

export function EntnahmenHeader({ onCreateEntnahme }: EntnahmenHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <Button onClick={onCreateEntnahme} className="flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Neue Entnahme
      </Button>
    </div>
  );
}