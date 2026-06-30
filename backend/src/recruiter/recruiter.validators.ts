import { z } from 'zod';

const stringList = z.array(z.string().trim().min(1)).max(40).default([]);

export const recruiterRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  recruiterName: z.string().trim().min(2).max(100),
  designation: z.string().trim().max(120).optional(),
  companyName: z.string().trim().min(2).max(160),
  industry: z.string().trim().max(120).optional(),
  website: z.string().trim().max(300).optional(),
  companySize: z.string().trim().max(80).optional(),
  location: z.string().trim().max(120).optional(),
  logo: z.string().trim().max(200000).optional(),
  description: z.string().trim().max(2000).optional(),
  hiringDomains: stringList.optional(),
  socialLinks: z.record(z.string().trim().max(300)).optional(),
});

export const recruiterLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const companySchema = recruiterRegisterSchema
  .pick({
    companyName: true,
    industry: true,
    website: true,
    companySize: true,
    location: true,
    recruiterName: true,
    designation: true,
    logo: true,
    description: true,
    hiringDomains: true,
    socialLinks: true,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'At least one company field is required');

export const jobSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(5000),
  salary: z.string().trim().max(120).optional(),
  experience: z.string().trim().max(120).optional(),
  skills: stringList,
  location: z.string().trim().max(120).optional(),
  deadline: z.string().datetime().optional(),
  community: z.string().trim().max(120).optional(),
  assessmentRequired: z.boolean().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const jobStatusSchema = z.object({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
});

export const candidateSearchSchema = z.object({
  query: z.string().trim().max(500).optional(),
  skills: z.string().trim().max(500).optional(),
  college: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  availability: z.string().trim().max(80).optional(),
  minAssessmentScore: z.coerce.number().min(0).max(100).optional(),
  minProjects: z.coerce.number().int().min(0).max(50).optional(),
  minCertificates: z.coerce.number().int().min(0).max(50).optional(),
  minResumeScore: z.coerce.number().min(0).max(100).optional(),
  minGithubScore: z.coerce.number().min(0).max(100).optional(),
  minRoadmapProgress: z.coerce.number().min(0).max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const aiSearchSchema = z.object({
  query: z.string().trim().min(2).max(500),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  candidateId: z.string().min(1),
  stage: z.enum(['APPLIED', 'SCREENING', 'ASSESSMENT', 'INTERVIEW', 'SELECTED', 'OFFER', 'JOINED']).optional(),
  notes: z.string().trim().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const applicationStageSchema = applicationSchema.pick({ stage: true, notes: true, rating: true });

export const interviewSchema = z.object({
  candidateId: z.string().min(1),
  jobId: z.string().min(1).optional(),
  scheduledAt: z.string().datetime(),
  mode: z.string().trim().min(2).max(80),
  notes: z.string().trim().max(2000).optional(),
});

export const interviewFeedbackSchema = z.object({
  notes: z.string().trim().max(4000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
});

export const messageSchema = z.object({
  candidateId: z.string().min(1).optional(),
  community: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(2).max(160),
  body: z.string().trim().min(2).max(4000),
}).refine((data) => data.candidateId || data.community, 'Message requires a candidate or community');

export const bookmarkSchema = z.object({
  candidateId: z.string().min(1),
  notes: z.string().trim().max(1000).optional(),
});

export type RecruiterRegisterInput = z.infer<typeof recruiterRegisterSchema>;
export type RecruiterLoginInput = z.infer<typeof recruiterLoginSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type JobInput = z.infer<typeof jobSchema>;
export type CandidateSearchInput = z.infer<typeof candidateSearchSchema>;
export type AiSearchInput = z.infer<typeof aiSearchSchema>;
