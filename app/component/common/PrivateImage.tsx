"use client";
import axios from "axios";
import { Avatar, AvatarProps, Image, ImageProps } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import stores from "@/app/store/stores";

export const isPrivateCompanyLogoUrl = (url: string) => /^\/company\/logos\/[a-f0-9]{24}\/[a-f0-9]{24}$/i.test(url);

/** Native img requests cannot carry our Bearer token. Fetch only known internal image routes, then expose a local blob. */
export function usePrivateImage(source?: string) {
  const actorId = stores.auth.user?._id || "";
  const [resolved, setResolved] = useState<{ key: string; url: string } | null>(null);
  const key = `${actorId}:${source || ""}`;
  useEffect(() => {
    if (!source || !isPrivateCompanyLogoUrl(source)) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    axios.get<Blob>(source, { responseType: "blob", signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted || data.size > 2_000_000 || !["image/png", "image/jpeg"].includes(data.type)) return;
      objectUrl = URL.createObjectURL(data); setResolved({ key, url: objectUrl });
    }).catch(() => { if (!controller.signal.aborted) setResolved(null); });
    // Do not retain another account's blob or leak object URLs when a company/preview changes.
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [key, source]);
  if (!source || !isPrivateCompanyLogoUrl(source)) return source;
  return resolved?.key === key ? resolved.url : undefined;
}

export function PrivateImage({ src, ...props }: ImageProps) {
  const source = usePrivateImage(src);
  return <Image {...props} src={source} />;
}

export function PrivateAvatar({ src, ...props }: AvatarProps) {
  const source = usePrivateImage(src);
  return <Avatar {...props} src={source} />;
}
