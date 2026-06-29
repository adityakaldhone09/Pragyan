import joblib
import numpy as np

from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


# Load dataset
df = joblib.load(
    "model_files/jobs_dataset.pkl"
)

# Load embeddings
job_embeddings = joblib.load(
    "model_files/job_embeddings.pkl"
)

# Load semantic model
model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)


def recommend_jobs(user_skills):

    user_text = " ".join(user_skills)

    user_embedding = model.encode(
        [user_text]
    )

    similarity_scores = cosine_similarity(
        user_embedding,
        job_embeddings
    )[0]

    top_indices = np.argsort(
        similarity_scores
    )[::-1]

    recommendations = []
    added_jobs = set()

    for idx in top_indices:

        job = df.iloc[idx]

        job_title = str(
            job["Job Title"]
        )

        # Avoid duplicates
        if job_title in added_jobs:
            continue

        added_jobs.add(job_title)

        required_skills = str(
            job["Skills"]
        ).split(",")

        missing_skills = list(
            set(required_skills)
            - set(user_skills)
        )

        recommendations.append({

            "job_title":
            job_title,

            "match_score":
            float(round(
                similarity_scores[idx]
                * 100,
                2
            )),

            "required_skills":
            [
                str(skill.strip())
                for skill in required_skills
            ],

            "missing_skills":
            [
                str(skill.strip())
                for skill in missing_skills[:5]
            ]
        })

        if len(recommendations) == 5:
            break

    return recommendations