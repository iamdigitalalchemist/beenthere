import Image from "next/image";
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

  if (event.status === "draft") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0f1117] px-6 text-white">
        <section className="max-w-md rounded-3xl bg-white/8 p-8 text-center backdrop-blur-xl ring-1 ring-white/10">
          <Image alt="beenThere" className="mx-auto mb-6 brightness-0 invert" height={24} src="/logo.webp" width={96} />
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <p className="mt-3 text-white/50">
            This event isn&apos;t live yet. Check back once the host has opened the gallery.
          </p>
        </section>
      </main>
    );
  }

  redirect(`/e/${event.publicId}`);
}
