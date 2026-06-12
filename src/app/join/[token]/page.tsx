import { notFound, redirect } from "next/navigation";
import { getEventByJoinToken } from "@/server/data";

type JoinPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const event = await getEventByJoinToken(token);

  if (!event) {
    notFound();
  }

  redirect(`/e/${event.publicId}`);
}
