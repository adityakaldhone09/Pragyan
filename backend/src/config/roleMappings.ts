export const roleMappings = {
  government: {
    defence: {
      default: ['NDA', 'Agniveer Army', 'Agniveer Navy', 'Agniveer Air Force', 'Coast Guard'],
      army: ['NDA', 'Agniveer Army', 'Technical Entry Scheme'],
      navy: ['NDA', 'Agniveer Navy', 'Indian Navy SSR'],
      airforce: ['NDA', 'Agniveer Air Force'],
    },
    banking: ['Bank PO', 'Clerk', 'Specialist Officer'],
    railways: ['Railways Engineer', 'Railway Technical Officer'],
    upsc: ['Civil Services (IAS/IPS/IFS)'],
    statepsc: ['State PSC Officer'],
    teaching: ['School Teacher', 'College Lecturer'],
    judiciary: ['Judicial Services'],
  },
  private: {
    software_engineer: ['Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Mobile Developer'],
    ai_engineer: ['AI Engineer', 'ML Engineer', 'NLP Engineer', 'Computer Vision Engineer'],
    data_scientist: ['Data Scientist', 'ML Engineer', 'Applied Scientist'],
    cyber_security: ['Security Analyst', 'Penetration Tester', 'SOC Analyst', 'Security Engineer'],
    cloud_engineer: ['Cloud Engineer', 'Site Reliability Engineer'],
    devops_engineer: ['DevOps Engineer', 'SRE'],
    uiux_designer: ['UI/UX Designer', 'Product Designer'],
  },
  higher_studies: {
    mba: ['MBA'],
    mtech: ['MTech'],
    ms_abroad: ['MS Abroad'],
    research: ['Research Scholar'],
    phd: ['PhD'],
  },
};

export const eligibilityRules = [
  {
    role: 'NDA',
    qualification: ['12th'],
    stream: ['Science'],
    minAge: 16.5,
    maxAge: 19.5,
  },
  {
    role: 'Bank PO',
    qualification: ["Bachelor's Degree"],
    stream: [],
    minAge: 18,
    maxAge: 35,
  }
];
