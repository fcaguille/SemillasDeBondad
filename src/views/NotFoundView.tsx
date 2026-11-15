import { Link } from "react-router";
import { Sprout } from "lucide-react";
import { EmptyState } from "@/components/common/States";
import { Button } from "@/components/ui/button";

export function NotFoundView() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm">
        <EmptyState
          icon={<Sprout />}
          title="Esta página no existe"
          description="Puede que el enlace esté incompleto."
          action={
            <Button asChild>
              <Link to="/impacto">Ir a Impacto</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
