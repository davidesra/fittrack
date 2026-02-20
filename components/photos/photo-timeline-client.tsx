"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, CheckSquare, Square, X, Scale, StickyNote } from "lucide-react";
import { formatDate, todayString } from "@/lib/utils";
import type { BodyPhoto } from "@/lib/db/schema";

interface PhotoTimelineClientProps {
  initialPhotos: BodyPhoto[];
}

export function PhotoTimelineClient({ initialPhotos }: PhotoTimelineClientProps) {
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayString());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("date", date);
    if (weight) fd.append("weightKg", weight);
    if (note) fd.append("note", note);

    const res = await fetch("/api/photos/upload", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Upload failed");
      setUploading(false);
      return;
    }

    setPhotos((prev) => [data.photo, ...prev]);
    setWeight("");
    setNote("");
    setUploading(false);
    router.refresh();
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 2
        ? [...prev, id]
        : [prev[1], id] // replace oldest selection
    );
  }

  const comparePhotos = selectedIds.length === 2
    ? selectedIds.map((id) => photos.find((p) => p.id === id)).filter(Boolean) as BodyPhoto[]
    : [];

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="bg-[#111114] rounded-xl p-4 space-y-3">
        <p className="text-sm font-medium text-gray-300">Upload Progress Photo</p>

        {/* Date + weight + note */}
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            label="Date"
          />
          <Input
            type="number"
            step="0.1"
            placeholder="75.5"
            label="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
          <Input
            placeholder="Optional note"
            label="Note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-[#2a2a32] rounded-xl py-8 flex flex-col items-center gap-2.5 hover:border-purple-500/50 transition-colors group"
          disabled={uploading}
        >
          {uploading ? (
            <div className="w-7 h-7 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Upload className="w-7 h-7 text-gray-600 group-hover:text-purple-400 transition-colors" />
          )}
          <span className="text-sm text-gray-500 group-hover:text-gray-400">
            {uploading ? "Uploading…" : "Click to upload progress photo"}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadPhoto(f);
          }}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Photo grid */}
      {photos.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-300">
              Timeline ({photos.length} photos)
            </h3>
            <Button
              variant={compareMode ? "secondary" : "ghost"}
              size="sm"
              onClick={() => {
                setCompareMode(!compareMode);
                setSelectedIds([]);
              }}
            >
              {compareMode ? "Done" : "Compare"}
            </Button>
          </div>

          {/* Side-by-side comparison */}
          {compareMode && comparePhotos.length === 2 && (
            <div className="mb-5 bg-[#111114] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-purple-400">Side-by-Side Comparison</p>
                <button
                  onClick={() => setSelectedIds([])}
                  className="text-gray-600 hover:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {comparePhotos.map((photo) => (
                  <div key={photo.id} className="space-y-2">
                    <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden">
                      <Image
                        src={photo.cloudinaryUrl}
                        alt={`Progress photo ${photo.date}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 300px"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-400">{formatDate(photo.date)}</p>
                    {photo.weightKg && (
                      <p className="text-xs text-center text-gray-500">{photo.weightKg}kg</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {compareMode && comparePhotos.length < 2 && (
            <p className="text-xs text-gray-500 mb-3 text-center">
              Select {2 - selectedIds.length} more photo{selectedIds.length === 0 ? "s" : ""} to compare
            </p>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {photos.map((photo) => {
              const isSelected = selectedIds.includes(photo.id);
              return (
                <div
                  key={photo.id}
                  className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                    compareMode
                      ? isSelected
                        ? "border-purple-500"
                        : "border-transparent hover:border-purple-500/50"
                      : "border-transparent"
                  }`}
                  onClick={() => compareMode && toggleSelect(photo.id)}
                >
                  <div className="relative aspect-[3/4] w-full bg-[#111114]">
                    <Image
                      src={photo.cloudinaryUrl}
                      alt={`Progress photo ${photo.date}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                    />
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    {/* Date badge */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-xs text-white font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatDate(photo.date)}
                      </p>
                    </div>
                    {/* Compare checkbox */}
                    {compareMode && (
                      <div className="absolute top-2 right-2">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-purple-400" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-2 bg-[#1a1a1f]">
                    <p className="text-xs text-gray-400 font-medium">{formatDate(photo.date)}</p>
                    {photo.weightKg && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                        <Scale className="w-3 h-3" />
                        {photo.weightKg}kg
                      </p>
                    )}
                    {photo.note && (
                      <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5 truncate">
                        <StickyNote className="w-3 h-3 flex-shrink-0" />
                        {photo.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {photos.length === 0 && (
        <div className="text-center py-12">
          <Camera className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No photos yet. Upload your first progress photo!</p>
        </div>
      )}
    </div>
  );
}
