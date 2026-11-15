import { Page, PageHeader } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/common/States";
import { IecChart } from "@/components/ranking/IecChart";
import { PrizePoolCard } from "@/components/ranking/PrizePoolCard";
import { TransparencyCard } from "@/components/ranking/TransparencyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { usePozo, useRankingCarreras, useUsuarioActual } from "@/hooks/useSemillas";

export function RankingView() {
  const pozo = usePozo();
  const ranking = useRankingCarreras();
  const { data: usuario } = useUsuarioActual();

  return (
    <Page>
      <PageHeader eyebrow="Marcador en vivo" title="Ranking" />
      <div className="mt-4 grid gap-4 md:mt-6 md:grid-cols-5">
        <div className="min-w-0 md:col-span-2">
          {pozo.data ? (
            <PrizePoolCard pozo={pozo.data} />
          ) : pozo.error ? (
            <ErrorState error={pozo.error} onRetry={pozo.refetch} />
          ) : (
            <Skeleton className="h-[188px] rounded-card md:h-full" />
          )}
        </div>
        <div className="min-w-0 md:col-span-3">
          {ranking.data ? (
            <IecChart data={ranking.data} miCarrera={usuario?.carrera} />
          ) : ranking.error ? (
            <ErrorState error={ranking.error} onRetry={ranking.refetch} />
          ) : (
            <Skeleton className="h-[360px] rounded-card" />
          )}
        </div>
        <div className="min-w-0 md:col-span-5">
          <TransparencyCard />
        </div>
      </div>
    </Page>
  );
}
