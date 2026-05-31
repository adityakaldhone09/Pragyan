import { prisma } from '@/lib/prisma';
import { assessmentTree } from '@/data/assessmentTree';
import { AssessmentResult, DecisionInput } from '@/types/assessment';
import { getCareerByRole } from '@/data/careerCatalog';
import { roleMappings, eligibilityRules } from '@/config/roleMappings';
import { dashboardMapping } from '@/config/dashboardMapping';

export class AssessmentDecisionTreeService {
  static getNode(nodeId: string) {
    if (assessmentTree.id === nodeId) return assessmentTree;
    return (assessmentTree.nodes as any)?.[nodeId];
  }

  static async startSession(userId: string, sessionId?: string) {
    // Create an AssessmentPath record to persist selections
    const created = await prisma.assessmentPath.create({
      data: {
        userId,
        assessmentSessionId: sessionId,
        finalCareerPath: '',
      }
    });

    // Return first question
    const first = {
      id: assessmentTree.id,
      question: assessmentTree.question,
      options: assessmentTree.options
    };

    return { session: created, question: first };
  }

  static async recordAnswer(assessmentPathId: string, key: string, value: string) {
    // Persist selected fields based on key mapping
    const updateData: any = {};

    if (key === 'career_category') updateData.selectedCategory = value;
    if (key === 'government_sector') updateData.selectedSector = value;
    if (key === 'defence_branches') updateData.selectedBranch = value;
    if (key === 'qualification') updateData.selectedQualification = value;
    if (key === 'qualification_finish' || key === 'finish_defence') updateData.selectedBranch = value;
    if (key === 'private_roles' || key === 'private_domain') updateData.selectedRole = value;
    if (key === 'higher_studies_options') updateData.selectedRole = value;
    if (key === 'private_roles' && value) updateData.selectedRole = value;

    await prisma.assessmentPath.update({ where: { id: assessmentPathId }, data: updateData });
  }

  static async getNext(nodeId: string, answerValue?: string) {
    // If nodeId is a decision node, fetch its mapped next
    const node = this.getNode(nodeId);
    if (!node) return null;

    // If answerValue provided, find option and its next
    if (answerValue) {
      const option = (node.options || []).find((o: any) => o.value === answerValue);
      if (!option) return null;
      const next = option.next;
      const nextNode = this.getNode(next);
      if (!nextNode) return { id: 'finish', question: 'Complete', options: [] };
      return { id: nextNode.id, question: nextNode.question, options: nextNode.options };
    }

    // Otherwise return current node
    return { id: node.id, question: node.question, options: node.options };
  }

  static async finishAssessment(assessmentPathId: string) {
    const ap = await prisma.assessmentPath.findUnique({ where: { id: assessmentPathId } });
    if (!ap) throw new Error('AssessmentPath not found');

    const input: DecisionInput = {
      category: ap.selectedCategory || undefined,
      sector: ap.selectedSector || undefined,
      qualification: ap.selectedQualification || undefined,
      branch: ap.selectedBranch || undefined,
      selectedRole: ap.selectedRole || undefined,
    };

    const resolved = this.resolveCareerPath(input);

    await prisma.assessmentPath.update({ where: { id: assessmentPathId }, data: { finalCareerPath: resolved.careerPath, confidence: resolved.confidence } });

    return {
      careerCategory: ap.selectedCategory,
      careerPath: resolved.careerPath,
      recommendedRoles: resolved.recommendedRoles,
      confidence: resolved.confidence,
      eligibleOpportunities: resolved.recommendedRoles,
      roadmapTemplate: null
    };
  }

  static resolveCareerPath(input: DecisionInput): AssessmentResult {
    // Deterministic resolver based on configuration-driven inputs
    const category = input.category || '';
    const sector = input.sector || '';
    const qualification = input.qualification || '';
    const branch = input.branch || '';
    const selectedRole = input.selectedRole || '';

    const recommendedRoles: string[] = [];
    let careerPath = 'General';

    if (category === 'government') {
      careerPath = sector || 'Government';
      const gov = (roleMappings as any).government || {};
      if (sector && gov[sector]) {
        if (sector === 'defence') {
          careerPath = 'Defence';
          const defMap = gov.defence || {};
          if (branch && defMap[branch]) recommendedRoles.push(...defMap[branch]);
          else if (defMap.default) recommendedRoles.push(...defMap.default);
        } else {
          recommendedRoles.push(...(gov as any)[sector]);
        }
      }
    } else if (category === 'private') {
      const pm = (roleMappings as any).private || {};
      // sector param for private is the domain key like 'software_engineer' or 'ai_engineer'
      if (selectedRole && typeof selectedRole === 'string') {
        recommendedRoles.push(selectedRole);
        careerPath = selectedRole;
      } else if (sector && pm[sector]) {
        recommendedRoles.push(...pm[sector]);
        careerPath = sector;
      } else {
        // default software pool
        recommendedRoles.push(...(pm.software_engineer || []));
        careerPath = 'Software Development';
      }
    } else if (category === 'higher_studies') {
      const hm = (roleMappings as any).higher_studies || {};
      if (selectedRole && hm[selectedRole]) {
        recommendedRoles.push(...hm[selectedRole]);
        careerPath = selectedRole;
      } else if (qualification && hm[qualification]) {
        recommendedRoles.push(...hm[qualification]);
        careerPath = qualification;
      } else {
        recommendedRoles.push('MBA');
        careerPath = 'Higher Studies';
      }
    }

    const confidence = 95;

    // Use eligibility rules to annotate roles with eligibility info when available
    const matchedEligibility = (eligibilityRules || []).filter((rule: any) => recommendedRoles.includes(rule.role));

    // Attach metadata if available (e.g., roadmap template)
    const metadata = recommendedRoles.map((role) => getCareerByRole(role)).filter((item): item is NonNullable<typeof item> => Boolean(item));
    const roadmapTemplate = metadata.length ? metadata[0]?.roadmapTemplate || null : null;

    return { careerPath, recommendedRoles, confidence, roadmapTemplate, eligibility: matchedEligibility };
  }

  static getDashboardType(role: string) {
    return (dashboardMapping as any)[role] || 'default-dashboard';
  }

  static async generateRoadmapIfNeeded(assessmentPathId: string, userId?: string) {
    const ap = await prisma.assessmentPath.findUnique({ where: { id: assessmentPathId } });
    if (!ap) return null;
    if (ap.selectedRole) {
      // trigger existing roadmap generator for the selected role
      try {
        // default skill level 'Beginner' — caller may override
        const { aiRecommendationService } = await import('@/services/ai-recommendation');
        const roadmap = await aiRecommendationService.generatePersonalizedRoadmap(userId || ap.userId, ap.selectedRole, 'Beginner');
        return roadmap;
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}
