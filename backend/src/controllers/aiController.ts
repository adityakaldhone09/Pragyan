import { Request, Response } from 'express';
import {
  getCareerRecommendation
} from '@/services/aiService';

export const recommendCareer =
async (
  req: Request,
  res: Response
) => {

  try {

    const { skills } =
      req.body;

    if (
      !skills ||
      !Array.isArray(skills)
    ) {

      return res
        .status(400)
        .json({
          success: false,
          message:
            "Skills array required"
        });
    }

    const recommendations =
      await getCareerRecommendation(
        skills
      );

    return res
      .status(200)
      .json({
        success: true,
        data:
          recommendations
      });

  } catch (error) {

    console.error(error);

    return res
      .status(500)
      .json({
        success: false,
        message:
          "AI recommendation failed"
      });
  }
};
