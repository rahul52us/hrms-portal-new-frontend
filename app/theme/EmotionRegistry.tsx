"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { ReactNode, useState } from "react";

export default function EmotionRegistry({ children }: { children: ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: "chakra" });
    cache.compat = true;
    const insert = cache.insert;
    let pending: Array<{ name: string; global: boolean }> = [];
    cache.insert = (...args) => {
      const [selector, serialized] = args;
      if (cache.inserted[serialized.name] === undefined) pending.push({ name: serialized.name, global: !selector });
      return insert(...args);
    };
    return { cache, flush: () => { const inserted = pending; pending = []; return inserted; } };
  });

  // Flush Emotion's SSR styles into the head instead of interleaving them with hydrated content.
  useServerInsertedHTML(() => {
    const inserted = flush();
    if (!inserted.length) return null;
    let styles = "";
    const names: string[] = [];
    const globals: Array<{ name: string; css: string }> = [];
    for (const item of inserted) {
      const css = cache.inserted[item.name];
      if (typeof css !== "string") continue;
      if (item.global) globals.push({ name: item.name, css });
      else { styles += css; names.push(item.name); }
    }
    return <>
      {globals.map((item) => <style key={item.name} data-emotion={`${cache.key}-global ${item.name}`} dangerouslySetInnerHTML={{ __html: item.css }} />)}
      {names.length > 0 && <style data-emotion={`${cache.key} ${names.join(" ")}`} dangerouslySetInnerHTML={{ __html: styles }} />}
    </>;
  });
  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
