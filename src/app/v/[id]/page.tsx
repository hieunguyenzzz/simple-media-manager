import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

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

  const isVideo = media.type === "VIDEO";
  const isImage = media.type === "IMAGE";

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {isVideo && (
          <video
            src={media.url}
            controls
            autoPlay
            className="w-full max-h-[80vh] object-contain"
          >
            Your browser does not support the video tag.
          </video>
        )}
        {isImage && (
          <img
            src={media.url}
            alt={media.originalName}
            className="w-full max-h-[80vh] object-contain"
          />
        )}
        <div className="mt-4 text-center text-gray-400">
          <p className="text-lg">{media.originalName}</p>
          <p className="text-sm mt-1">
            {isVideo ? "Video" : "Image"} &bull;{" "}
            {(media.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
      </div>
    </div>
  );
}
