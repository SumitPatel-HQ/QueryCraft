import { redirect } from "next/navigation";

export default async function DatabaseDetailPage({
  params,
}: {
  params: Promise<{ dbId: string }>;
}) {
  const { dbId } = await params;
  redirect(`/dashboard/databases/${dbId}/overview`);
}
