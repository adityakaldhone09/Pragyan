export const assessmentTree = {
  id: 'career_category',
  question: 'What type of career path are you interested in?',
  options: [
    { value: 'government', label: 'Government Job', next: 'government_sector' },
    { value: 'private', label: 'Private Job', next: 'private_domain' },
    { value: 'higher_studies', label: 'Higher Studies', next: 'higher_studies_options' },
  ],

  nodes: {
    government_sector: {
      id: 'government_sector',
      question: 'Which government sector interests you?',
      options: [
        { value: 'defence', label: 'Defence', next: 'defence_branches' },
        { value: 'banking', label: 'Banking', next: 'finish' },
        { value: 'railways', label: 'Railways', next: 'finish' },
        { value: 'upsc', label: 'UPSC / Civil Services', next: 'finish' },
        { value: 'statepsc', label: 'State PSC', next: 'finish' },
        { value: 'teaching', label: 'Teaching', next: 'finish' },
        { value: 'judiciary', label: 'Judiciary', next: 'finish' },
      ]
    },

    defence_branches: {
      id: 'defence_branches',
      question: 'Which defence branch?',
      options: [
        { value: 'army', label: 'Army', next: 'finish' },
        { value: 'navy', label: 'Navy', next: 'finish' },
        { value: 'airforce', label: 'Air Force', next: 'finish' },
        { value: 'all', label: 'All of the above', next: 'finish' },
      ]
    },

    private_domain: {
      id: 'private_domain',
      question: 'Which private domain interests you most?',
      options: [
        { value: 'software_engineer', label: 'Software Engineer', next: 'private_roles' },
        { value: 'ai_engineer', label: 'AI Engineer', next: 'private_roles' },
        { value: 'data_scientist', label: 'Data Scientist', next: 'private_roles' },
        { value: 'cyber_security', label: 'Cyber Security', next: 'private_roles' },
        { value: 'cloud_engineer', label: 'Cloud Engineer', next: 'private_roles' },
        { value: 'devops_engineer', label: 'DevOps Engineer', next: 'private_roles' },
        { value: 'uiux_designer', label: 'UI/UX Designer', next: 'private_roles' },
      ]
    },

    private_roles: {
      id: 'private_roles',
      question: 'Which role specifically?',
      options: [
        { value: 'frontend', label: 'Frontend Developer', next: 'finish' },
        { value: 'backend', label: 'Backend Developer', next: 'finish' },
        { value: 'fullstack', label: 'Full Stack Developer', next: 'finish' },
        { value: 'mobile', label: 'Mobile App Developer', next: 'finish' },
      ]
    },

    higher_studies_options: {
      id: 'higher_studies_options',
      question: 'Which higher study are you targeting?',
      options: [
        { value: 'mba', label: 'MBA', next: 'finish' },
        { value: 'mtech', label: 'MTech', next: 'finish' },
        { value: 'ms_abroad', label: 'MS Abroad', next: 'finish' },
        { value: 'research', label: 'Research', next: 'finish' },
        { value: 'phd', label: 'PhD', next: 'finish' },
      ]
    },

    finish: {
      id: 'finish',
      question: 'Complete',
      options: []
    }
  }
};
