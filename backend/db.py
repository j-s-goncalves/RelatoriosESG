import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor


def get_connection():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_block(questionnaire_code: str) -> dict | None:
    with get_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT content FROM blocks WHERE questionnaire_code = %s ORDER BY updated_at DESC LIMIT 1",
                (questionnaire_code,),
            )
            row = cur.fetchone()
            return dict(row["content"]) if row else None


def upsert_block(questionnaire_code: str, content: dict) -> None:
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO blocks (block_type, questionnaire_code, content, updated_at)
                VALUES ('mini_questionnaire', %s, %s, now())
                ON CONFLICT (questionnaire_code)
                DO UPDATE SET content = EXCLUDED.content, updated_at = now()
                """,
                (questionnaire_code, json.dumps(content)),
            )
        conn.commit()
