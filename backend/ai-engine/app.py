from flask import Flask
from flask import request
from flask import jsonify

from recommendation_engine import (
    recommend_jobs
)

app = Flask(__name__)


@app.route("/")
def home():
    return "AI Recommendation Engine Running"


@app.route(
    "/recommend",
    methods=["POST"]
)
def recommend():

    data = request.json

    user_skills = data.get(
        "skills",
        []
    )

    result = recommend_jobs(
        user_skills
    )

    return jsonify(result)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5001,
        debug=True
    )