import { Button } from "./ui/button";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { IconLogout } from "@tabler/icons-react";
import { pb } from "@/lib/pocketbase";
import { useNavigate } from "react-router-dom";

interface AppHeaderProps {
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export default function AppHeader() {
  const logout = () => pb.authStore.clear();

  const navigate = useNavigate();

  return (
    <div className='mx-auto p-4 sm:p-0 max-w-4xl'>
      <div className='flex w-full justify-between items-center flex-row py-3'>
        <div>
          <Tabs
            defaultValue={"items"}
            onValueChange={(value) => navigate(`/${value}`)}
          >
            <TabsList>
              <TabsTrigger value='items'>Gegenstände</TabsTrigger>
              <TabsTrigger value='gruppen'>Gruppen</TabsTrigger>
              <TabsTrigger value='requests'>Anfragen</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <Button variant='outline' className='ml-auto' onClick={logout}>
          <IconLogout />
        </Button>
      </div>
    </div>
  );
}
