import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className='flex items-center justify-center min-h-screen bg-gray-50'>
      <Card className='w-full max-w-2xl'>
        <CardHeader className='text-center'>
          <CardTitle className='text-3xl'>KJ Lager Portal</CardTitle>
          <CardDescription className='text-lg'>
            Willkommen beim Portal für das Kinder- und Jugendlager der BBGBEW.
          </CardDescription>
        </CardHeader>
        <CardContent className='flex items-center justify-center flex-col space-y-4'>
          {user ? (
            <>
              <Link className='w-full' to={"/dashboard"}>
                <Button className='w-full' variant={"outline"}>
                  Lager durchsuchen
                </Button>
              </Link>
              <Button className='w-full' variant={"outline"}>
                Anfrage stellen
              </Button>
              <Link className='w-full' to={"/dashboard"}>
                <Button className='w-full'>Zum Management Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Button className='w-full' variant={"outline"} disabled>
                Lager durchsuchen (Login erforderlich)
              </Button>
              <Button className='w-full' variant={"outline"} disabled>
                Anfrage stellen (Login erforderlich)
              </Button>
              <Link className='w-full' to={"/login"}>
                <Button className='w-full'>Zum Login</Button>
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
