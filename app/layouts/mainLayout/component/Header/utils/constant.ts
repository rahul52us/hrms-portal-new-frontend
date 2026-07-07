export const navItems = [
  { title: 'Home', link: '/' },
  { title: 'About', link: '/about-us' },
  { title: 'Course', link: '/course' },
  { title: 'Therapist', link: '/therapist' },
  {
    title: 'Services',
    link: '/services',
    dropdown: true,
    links: [
      { name: 'Individual Therapy', href: '/services/individual-therapy' },
      { name: 'Teen Therapy', href: '/services/teen-therapy' },
      { name: "Couple's Therapy", href: '/services/couple-therapy' },
      { name: 'Family Therapy', href: '/services/family-therapy' },
      { name: 'Psychological Assessment', href: '/assessment' },
      {
        name: 'Speciality Services',
        dropdown: true,
        links: [
          { name: 'Psychodynamic Psychotherapy', href: '/services/psychodynamic-therapy' },
          { name: 'Supervision', href: '/supervision' },
          { name: 'Eating Disorder (Upcoming)', href: '' },
          { name: 'MATS (Upcoming)', href: '' }
        ]
      },
      {
        name: 'Conditions',
        dropdown: true,
        links: [
          { name: 'Depression', href: '/condition/depression' },
          { name: 'Anxiety', href: '/condition/anxiety' },
          { name: 'ADHD', href: '/condition/adhd' },
          { name: 'Bipolar Disorder', href: '/condition/bipolar-disorder' },
          { name: 'OCD', href: '/condition/ocd' },
          { name: 'Trauma', href: '/condition/trauma' }
        ]
      },
      { name: 'Explore all services', href: '/services' }
    ]
  },
  {
    title: 'Resources',
    link: '/blogs',
    dropdown: true,
    links: [
      { name: 'Blogs', href: '/blogs' },
      { name: 'Self Assessment', href: '/self-assessment' }
    ]
  },
  { title: 'Contact us', link: '/contact-us' },
  {
    title: 'Login',
    link: 'https://secure.therasoft.in/tsi/clientportal.aspx',
    external: true
  }
];
