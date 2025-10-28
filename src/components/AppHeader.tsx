import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { IconLogout } from "@tabler/icons-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface AppHeaderProps {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export default function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  // Extract the current tab from the pathname
  const getCurrentTab = () => {
    const pathname = location.pathname;
    if (pathname.startsWith('/items')) return 'items';
    if (pathname.startsWith('/kisten')) return 'kisten';
    if (pathname.startsWith('/requests')) return 'requests';
    return 'items'; // fallback
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className='mx-auto p-4 sm:p-0 max-w-4xl'>
      <div className='flex w-full justify-between items-center flex-row py-3'>
        <div>
          <Tabs
            value={getCurrentTab()}
            onValueChange={(value) => navigate(`/${value}`)}
          >
            <TabsList>
              <TabsTrigger value='items'>Gegenstände</TabsTrigger>
              <TabsTrigger value='kisten'>Kisten</TabsTrigger>
              <TabsTrigger value='requests'>Entnahmen</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button variant='outline' className='ml-auto' onClick={handleLogout}>
          <IconLogout />
        </Button>
      </div>
    </div>
  );
}
