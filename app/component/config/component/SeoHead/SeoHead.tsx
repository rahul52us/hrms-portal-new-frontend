"use client";

import Head from "next/head";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SITE_URL, WEBSITE_TITLE, KEYWORDS, WEBSITE_DESCRIPTION } from "../../../../config/utils/variables";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  keywords?: string;
}

const SeoHead = ({ title, description, image, url, keywords }: SeoProps) => {
  const pathname = usePathname();
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(`${SITE_URL}${pathname}`);
  }, [pathname]);

  useEffect(() => {
    document.title = title ? `${title} | ${WEBSITE_TITLE}` : WEBSITE_TITLE;

    const metaDescription = document.querySelector("meta[name='description']");
    if (metaDescription) metaDescription.setAttribute("content", description || WEBSITE_DESCRIPTION);

    const metaKeywords = document.querySelector("meta[name='keywords']");
    if (metaKeywords) metaKeywords.setAttribute("content", keywords || KEYWORDS);
  }, [title, description, keywords]);
  return (
    <Head>
      {/* Basic SEO */}
      <meta name="description" content={description || WEBSITE_DESCRIPTION} />
      <meta name="keywords" content={keywords || KEYWORDS} />
      <link rel="canonical" href={url || currentUrl} />
      <meta name="robots" content="index, follow" />

      {/* Open Graph */}
      <meta property="og:title" content={title || WEBSITE_TITLE} />
      <meta property="og:description" content={description || WEBSITE_DESCRIPTION} />
      <meta property="og:image" content={image || `${SITE_URL}/images/logo.png`} />
      <meta property="og:url" content={url || currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={WEBSITE_TITLE} />

      {/* Twitter Meta Tags */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title || WEBSITE_TITLE} />
      <meta property="twitter:description" content={description || WEBSITE_DESCRIPTION} />
      <meta property="twitter:image" content={image || `${SITE_URL}/images/logo.png`} />
    </Head>
  );
};

export default SeoHead;
