from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from pydantic import ValidationError

from models import MiniQuestionnaire, ChecklistAnswer
from b8_definition import B8_ITEMS
from db import get_block, upsert_block
from xhtml import render_xhtml

app = Flask(__name__)
CORS(app)


def empty_b8() -> dict:
    return MiniQuestionnaire(
        questionnaire_code="B8",
        answers=[ChecklistAnswer(item_code=item.item_code) for item in B8_ITEMS],
    ).model_dump()


@app.get("/api/block/b8")
def get_b8():
    data = get_block("B8")
    if data is None:
        data = empty_b8()
    return jsonify(data)


@app.put("/api/block/b8")
def put_b8():
    try:
        questionnaire = MiniQuestionnaire.model_validate(request.get_json(force=True))
    except ValidationError as e:
        return jsonify({"error": e.errors()}), 422

    upsert_block("B8", questionnaire.model_dump())
    return jsonify({"ok": True})


@app.get("/api/block/b8/xhtml")
def get_b8_xhtml():
    data = get_block("B8")
    if data is None:
        data = empty_b8()
    questionnaire = MiniQuestionnaire.model_validate(data)
    return Response(render_xhtml(questionnaire), mimetype="application/xhtml+xml")


if __name__ == "__main__":
    app.run(debug=True)
