import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import MediaViewer from "./MediaViewer";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function VideoPage({ params }: PageProps) {
  const { id } = await params;

  const media = await prisma.media.findUnique({
    where: { id },
  });

  if (!media) {
    notFound();
  }

  return (
    <MediaViewer
      url={media.url}
      originalName={media.originalName}
      type={media.type}
      size={media.size}
    />
  );
}
