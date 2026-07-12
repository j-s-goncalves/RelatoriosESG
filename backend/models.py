from __future__ import annotations
from typing import Literal
from pydantic import BaseModel


class ChecklistAnswer(BaseModel):
    item_code: str
    value: Literal["YES", "NO"] | None = None
    specify: str | None = None


class MiniQuestionnaire(BaseModel):
    questionnaire_code: str
    answers: list[ChecklistAnswer]
