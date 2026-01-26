import LogistasFeature from "@/presentation/features/logista";
import { Card, Typography } from "antd";

export default function LogistasPage() {
    return (
        <div className="py-6 space-y-6" data-oid="z7k-xqo">
            <div className="flex flex-col gap-2 py-5 px-7" data-oid="elop5yj">
                <h1 className="text-3xl font-bold tracking-tight" data-oid=":n:ayd-">
                    Gerencie os logistas cadastrados no sistema
                </h1>
            </div>

            <Card
                className="w-full "
                title="Lista de Logistas"
                data-oid="m7kc9vb"
            >
                <Typography className="text-sm text-muted-foreground " data-oid="wyez2pf">
                    Visualize, busque e gerencie todos os logistas cadastrados
                </Typography>
                <LogistasFeature data-oid="u6nusvc" />
            </Card>
        </div>
    )
}
