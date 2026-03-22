import LogistasFeature from "@/presentation/features/logista";
import { Card, Typography } from "antd";

export default function LogistasPage() {
    return (
        <div className="space-y-8 px-4 py-6 sm:px-6 lg:px-8 xl:px-10" data-oid="z7k-xqo">
            <div
                className="rounded-[18px] border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 sm:py-8"
                data-oid="elop5yj"
            >
                <h1 className="text-3xl font-bold tracking-tight text-slate-950" data-oid=":n:ayd-">
                    Gerencie os logistas cadastrados no sistema
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Consulte a base, filtre rapidamente e execute as ações operacionais com mais conforto visual.
                </p>
            </div>

            <Card
                className="w-full rounded-[18px] border-slate-200 shadow-sm"
                title="Lista de Logistas"
                styles={{
                    header: {
                        padding: "22px 28px 18px",
                    },
                    body: {
                        padding: "0 28px 28px",
                    },
                }}
                data-oid="m7kc9vb"
            >
                <Typography className="mb-5 block text-sm text-muted-foreground" data-oid="wyez2pf">
                    Visualize, busque e gerencie todos os logistas cadastrados
                </Typography>
                <LogistasFeature data-oid="u6nusvc" />
            </Card>
        </div>
    )
}
