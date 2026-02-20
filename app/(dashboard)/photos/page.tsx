import { auth } from "@/lib/auth";
import { db, bodyPhotos } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PhotoTimelineClient } from "@/components/photos/photo-timeline-client";
import { Camera } from "lucide-react";

export const revalidate = 0;

export default async function PhotosPage() {
  const session = await auth();
  const userId = session!.user.id;

  const photos = await db.query.bodyPhotos.findMany({
    where: eq(bodyPhotos.userId, userId),
    orderBy: [desc(bodyPhotos.date)],
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Body Photo Timeline</h1>
        <p className="text-gray-500 text-sm mt-1">
          Track your visual progress over time
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-purple-400" />
            <CardTitle>Photos ({photos.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <PhotoTimelineClient initialPhotos={photos} />
        </CardContent>
      </Card>
    </div>
  );
}
