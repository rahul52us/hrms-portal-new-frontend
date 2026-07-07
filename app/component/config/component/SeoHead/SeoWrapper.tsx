
// components/SeoWrapper.tsx
import { NextSeo } from 'next-seo';
import { usePathname } from 'next/navigation';
import { METADATA_MAP } from '../../../../metadata';

export default function SeoWrapper() {
  const pathname = usePathname();
  const meta = METADATA_MAP[pathname] || METADATA_MAP['/'];

  return (
    <NextSeo
      title={meta.title}
      description={meta.description}
      openGraph={{
        url: `https://Dentalhealth.com${pathname}`,
        title: meta.title,
        description: meta.description,
        images: [
          {
            url: 'https://Dentalhealth.com/images/logo.png',
            width: 1200,
            height: 630,
            alt: meta.title,
          },
        ],
        siteName: 'Dental Health',
      }}
    />
  );
}
