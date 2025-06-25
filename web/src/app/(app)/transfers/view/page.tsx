
"use client";
import { TransferList } from "@/components/transfers/TransferList";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowRightLeft } from "lucide-react";
import { useSearchParams } from 'next/navigation';

export default function ViewTransfersPage() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') as "all" | "incoming" | "outgoing" | "pending" | "completed" | null;

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="font-headline text-3xl flex items-center gap-2">
            <ArrowRightLeft className="h-8 w-8 text-primary"/> Ver Transferencias
          </CardTitle>
          <CardDescription>
            Revisa todas tus transferencias entrantes, salientes, pendientes y completadas.
          </CardDescription>
        </CardHeader>
      </Card>
      <TransferList initialFilter={filter || "all"} />
    </div>
  );
}
