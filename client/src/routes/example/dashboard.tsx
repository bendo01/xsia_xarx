import { clientOnly } from "@solidjs/start";

const DashboardClient = clientOnly(() => import("~/components/example/DashboardClient"));

export default function Dashboard() {
    return <DashboardClient />;
}
