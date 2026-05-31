import { z } from 'zod';

const optionalUrl = z.union([z.string().trim().url(), z.literal('')]).optional().transform((value) => (value === '' ? undefined : value));

export const portfolioProjectSchema = z.object({
  title: z.string().trim().min(2, 'Project title is required').max(120),
  description: z.string().trim().max(2000).optional(),
  techStack: z.array(z.string().trim().min(1)).max(20).default([]),
  highlights: z.array(z.string().trim().min(1)).max(10).default([]),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  featured: z.boolean().optional().default(false),
});

export const certificationSchema = z.object({
  title: z.string().trim().min(2, 'Certification title is required').max(120),
  issuer: z.string().trim().min(2, 'Issuer is required').max(120),
  credentialId: z.string().trim().max(120).optional(),
  credentialUrl: optionalUrl,
  issuedAt: z.coerce.date().optional(),
  expiresAt: z.coerce.date().optional(),
  description: z.string().trim().max(2000).optional(),
});

export const githubImportSchema = z.object({
  repoIds: z.array(z.string().trim().min(1)).min(1, 'Select at least one repository to import'),
});

export const profileBuilderQuerySchema = z.object({
  includeGithub: z.coerce.boolean().optional().default(true),
});

export type PortfolioProjectInput = z.infer<typeof portfolioProjectSchema>;
export type CertificationInput = z.infer<typeof certificationSchema>;
export type GithubImportInput = z.infer<typeof githubImportSchema>;
export type ProfileBuilderQueryInput = z.infer<typeof profileBuilderQuerySchema>;
