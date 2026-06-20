import axios from "axios";

export const getCareerRecommendation =
async (skills: string[]) => {

  try {

    const response =
      await axios.post(
        "http://127.0.0.1:5001/recommend",
        {
          skills
        }
      );

    return response.data;

  } catch (error) {

    console.error(
      "Career AI Error:",
      error
    );

    throw new Error(
      "Career recommendation failed"
    );
  }
};