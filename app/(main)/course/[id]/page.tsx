'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Center, Spinner } from '@chakra-ui/react';

export default function CourseDetailsRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      router.replace(`/course?courseId=${id}`);
    } else {
      router.replace('/course');
    }
  }, [id, router]);

  return (
    <Center minH="100vh">
      <Spinner size="xl" color="brand.500" />
    </Center>
  );
}
