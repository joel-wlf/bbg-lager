import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import {
  IconBuilding,
  IconBuildingWarehouse,
  IconLogout,
} from "@tabler/icons-react";
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
    if (pathname.startsWith("/items")) return "items";
    if (pathname.startsWith("/kisten")) return "kisten";
    if (pathname.startsWith("/requests")) return "requests";
    if (pathname.startsWith("/anfragen")) return "anfragen";
    return "items"; // fallback
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className='mx-auto p-4 pb-0 sm:p-0 max-w-4xl'>
      <div className='w-full border rounded-2xl p-4 bg-white shadow'>
        <div className='font-bold text-xl flex gap-2 items-center'>
          <IconBuildingWarehouse className='w-6 h-6' />
          <p className='translate-y-0.5'>K/J Lager Admin</p>
          <Button variant='ghost' className='ml-auto' onClick={handleLogout}>
            <IconLogout />
          </Button>
        </div>
      </div>
      <div className='flex w-full justify-between items-center flex-row pt-3'>
        <div>
          <Tabs
            value={getCurrentTab()}
            onValueChange={(value) => navigate(`/${value}`)}
          >
            <TabsList>
              <TabsTrigger value='items'>Gegenstände</TabsTrigger>
              <TabsTrigger value='kisten'>Kisten</TabsTrigger>
              <TabsTrigger value='requests'>Entnahmen</TabsTrigger>
              <TabsTrigger value='anfragen'>Anfragen</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
