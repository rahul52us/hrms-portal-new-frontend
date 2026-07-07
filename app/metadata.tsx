// metadata.tsx
export interface PageMetadata {
  title: string;
  description: string;
}

interface MetadataMap {
  [key: string]: PageMetadata;
}

export const METADATA_MAP: MetadataMap = {
  '/': {
    title: 'LMS',
    description: 'LMS'
  },
  '/therapist': {
    title: 'Choose The Right Therapist For You | Dental Health',
    description: 'Find the perfect therapist for your mental health journey with Dental Health. Our expert professionals offer personalized therapy sessions to help you overcome stress, anxiety, depression, and more. Get the support you need with a compassionate and experienced therapist. Book a consultation today!'
  },
  '/contact-us': {
    title: 'Contact Us | LMS',
    description: 'Get in touch with LMS for expert mental health support. Call us at 9899 129943 or visit our clinic for personalized therapy and counseling services. We are here to help you on your journey to better mental well-being. Contact us today!'
  },
  '/about-us': {
    title: 'About Us | LMS',
    description: 'LMS is dedicated to providing expert mental health care through personalized therapy and counseling. Our team of experienced therapists helps individuals overcome stress, anxiety, depression, and other mental health challenges. Learn more about our mission, values, and services.'
  },
  '/blogs': {
    title: 'Dental Healthcare Blog | Expert Mental Health Insights & Tips',
    description: 'Explore expert mental health insights, tips, and resources on the Dental Healthcare Blog. Get guidance on stress management, anxiety, depression, therapy, and overall well-being. Stay informed and take a step toward better mental health today!'
  },
  '/service': {
    title: 'Services We Offer | LMS',
    description: 'Explore the wide range of mental health services offered at LMS, including therapy for individuals, couples, families, and more. Achieve emotional well-being with expert care.'
  },
  '/terms-condition': {
    title: 'Terms & Conditions | LMS',
    description: 'Read the Terms & Conditions of LMS for a clear understanding of our services, policies, and user agreements. Your privacy and rights are our priority.'
  },
  '/assessment': {
    title: 'Comprehensive Mental Health Assessments at LMS',
    description: 'Get accurate mental health assessments at LMS. Our expert evaluations help diagnose conditions like depression, anxiety, ADHD, and more—guiding personalized treatment plans.'
  },
  '/supervision': {
    title: 'Professional Therapist Supervision Services | LMS',
    description: 'At LMS, our clinical supervision ensures quality and ethical care for every patient. We maintain the highest standards in therapy through ongoing expert review and collaboration.'
  },
  '/self-assessment': {
    title: 'Psychological Assessment Noida | Comprehensive Mental Health Assessments',
    description: 'Take a short, confidential self-assessment to understand what you might be going through.'
  },
  '/dashboard/approvals': {
    title: 'Approval Dashboard | Workflow',
    description: 'Review pending approvals, inspect dynamic document data, and track approved or rejected workflow actions in one dashboard.'
  }
};

export const getMetadataForPath = (path: string): PageMetadata => {
  // Try to get exact path match
  if (METADATA_MAP[path]) {
    return METADATA_MAP[path];
  }

  // For dynamic paths or nested routes, try to find a parent path
  for (const key in METADATA_MAP) {
    if (path.startsWith(key) && key !== '/') {
      return METADATA_MAP[key];
    }
  }

  // Default fallback
  return METADATA_MAP['/'];
};
