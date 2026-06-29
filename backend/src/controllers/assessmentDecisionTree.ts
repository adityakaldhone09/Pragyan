import { Request, Response } from 'express';
import { AssessmentDecisionTreeService } from '@/services/assessmentDecisionTreeService';
import { prisma } from '@/lib/prisma';

export async function startDecision(req: Request, res: Response) {
  try {
    const userId = req.user?.id || req.query.userId || req.body.userId || null;
    if (!userId) return res.status(400).json({ success: false, error: 'userId required' });

    const { session, question } = await AssessmentDecisionTreeService.startSession(userId, undefined);
    return res.json({ success: true, data: { assessmentPathId: session.id, question } });
  } catch (error) {
    console.error('startDecision error', error);
    return res.status(500).json({ success: false, error: 'Failed to start decision assessment' });
  }
}

export async function answerDecision(req: Request, res: Response) {
  try {
    const { assessmentPathId, nodeId, answer } = req.body;
    if (!assessmentPathId || !nodeId || !answer) return res.status(400).json({ success: false, error: 'assessmentPathId, nodeId and answer required' });

    await AssessmentDecisionTreeService.recordAnswer(assessmentPathId, nodeId, answer);
    const next = await AssessmentDecisionTreeService.getNext(nodeId, answer);

    return res.json({ success: true, data: { next } });
  } catch (error) {
    console.error('answerDecision error', error);
    return res.status(500).json({ success: false, error: 'Failed to record answer' });
  }
}

export async function finishDecision(req: Request, res: Response) {
  try {
    const { assessmentPathId } = req.body;
    if (!assessmentPathId) return res.status(400).json({ success: false, error: 'assessmentPathId required' });

    const result = await AssessmentDecisionTreeService.finishAssessment(assessmentPathId);
    // Attempt to generate personalized roadmap if selectedRole exists
    const userId = req.user?.id || undefined;
    const roadmap = await AssessmentDecisionTreeService.generateRoadmapIfNeeded(assessmentPathId, userId);

    return res.json({ success: true, data: { result, roadmap } });
  } catch (error) {
    console.error('finishDecision error', error);
    return res.status(500).json({ success: false, error: 'Failed to finish decision assessment' });
  }
}

export async function getResult(req: Request, res: Response) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) return res.status(400).json({ success: false, error: 'sessionId required' });

    const ap = await prisma.assessmentPath.findUnique({ where: { id: sessionId } });
    if (!ap) return res.status(404).json({ success: false, error: 'AssessmentPath not found' });

    const resolved = AssessmentDecisionTreeService.resolveCareerPath({
      category: ap.selectedCategory || undefined,
      sector: ap.selectedSector || undefined,
      qualification: ap.selectedQualification || undefined,
      branch: ap.selectedBranch || undefined,
      selectedRole: ap.selectedRole || undefined,
    });

    return res.json({ success: true, data: { assessmentPath: ap, resolved } });
  } catch (error) {
    console.error('getResult error', error);
    return res.status(500).json({ success: false, error: 'Failed to get result' });
  }
}
