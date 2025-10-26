import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconSearch } from "@tabler/icons-react";

interface ItemsHeaderProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export default function ItemsHeader({
  searchTerm,
  onSearchTermChange,
  onSearch,
  isLoading,
}: ItemsHeaderProps) {
  return (
    <Card>
      <CardContent>
        <form onSubmit={onSearch} className='flex gap-2'>
          <Input
            placeholder='Gegenstände suchen...'
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
          <Button type='submit' disabled={isLoading}>
            <IconSearch />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}