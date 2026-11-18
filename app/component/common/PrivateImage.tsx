"use client";
import axios from "axios";
import { Avatar, AvatarProps, Image, ImageProps } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import stores from "@/app/store/stores";

export const isPrivateCompanyLogoUrl = (url: string) => /^\/company\/logos\/[a-f0-9]{24}\/[a-f0-9]{24}$/i.test(url);
export const isPrivateProfilePhotoUrl = (url: string) => /^\/user\/profile-photos\/[a-f0-9]{24}\/[a-f0-9]{24}$/i.test(url);
const isPrivateImageUrl = (url: string) => isPrivateCompanyLogoUrl(url) || isPrivateProfilePhotoUrl(url);

/** Native img requests cannot carry our Bearer token. Fetch only known internal image routes, then expose a local blob. */
export function usePrivateImage(source?: string) {
  const actorId = stores.auth.user?._id || "";
  const [resolved, setResolved] = useState<{ key: string; url: string } | null>(null);
  const key = `${actorId}:${source || ""}`;
  useEffect(() => {
    if (!source || !isPrivateImageUrl(source)) return;
    const controller = new AbortController();
    let objectUrl: string | undefined;
    axios.get<Blob>(source, { responseType: "blob", signal: controller.signal }).then(({ data }) => {
      const profilePhoto = isPrivateProfilePhotoUrl(source);
      const allowedTypes = profilePhoto ? ["image/png", "image/jpeg", "image/webp"] : ["image/png", "image/jpeg"];
      if (controller.signal.aborted || !data.size || data.size > (profilePhoto ? 5 * 1024 * 1024 : 2_000_000) || !allowedTypes.includes(data.type)) return;
      objectUrl = URL.createObjectURL(data); setResolved({ key, url: objectUrl });
    }).catch(() => { if (!controller.signal.aborted) setResolved(null); });
    // Do not retain another account's blob or leak object URLs when a photo/company/preview changes.
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [key, source]);
  if (!source || !isPrivateImageUrl(source)) return source;
  return resolved?.key === key ? resolved.url : undefined;
}

export const PrivateImage = observer(function PrivateImage({ src, ...props }: ImageProps) {
  const source = usePrivateImage(src);
  return <Image {...props} src={source} />;
});

export const PrivateAvatar = observer(function PrivateAvatar({ src, ...props }: AvatarProps) {
  const source = usePrivateImage(src);
  return <Avatar {...props} src={source} />;
});
