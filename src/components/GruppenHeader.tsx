import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconSearch, IconX } from "@tabler/icons-react";

interface GruppenHeaderProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch?: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}

export default function GruppenHeader({
  searchTerm,
  onSearchTermChange,
  onSearch,
  isLoading,
  placeholder = "Gruppen suchen...",
}: GruppenHeaderProps) {
  return (
    <Card>
      <CardContent>
        <div className='flex gap-2'>
          <Input
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
          {searchTerm && (
            <Button variant='outline' onClick={() => onSearchTermChange("")}>
              <IconX />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}