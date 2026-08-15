import { profileUpdateSchema } from '@/validators/auth';

describe('profileUpdateSchema', () => {
  it('preserves extended profile fields for update requests', () => {
    const result = profileUpdateSchema.parse({
      firstName: 'Asha',
      lastName: 'Patel',
      phone: '+919999999999',
      bio: 'Building products for learners',
      githubUrl: 'https://github.com/asha',
      portfolioWebsite: 'https://ashapatel.dev',
      username: 'ashapatel',
      preferredCareerDomain: 'Full Stack Development',
      dateOfBirth: '1998-04-12',
    });

    expect(result).toMatchObject({
      firstName: 'Asha',
      bio: 'Building products for learners',
      githubUrl: 'https://github.com/asha',
      portfolioWebsite: 'https://ashapatel.dev',
      username: 'ashapatel',
      preferredCareerDomain: 'Full Stack Development',
    });
    expect(result.dateOfBirth).toBe('1998-04-12');
  });
});
