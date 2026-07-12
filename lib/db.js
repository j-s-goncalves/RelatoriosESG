import { neon } from "@neondatabase/serverless";

function getSql() {
  return neon(process.env.DATABASE_URL);
}

export async function getBlock(questionnaireCode) {
  const sql = getSql();
  const rows = await sql`
    SELECT content FROM blocks
    WHERE questionnaire_code = ${questionnaireCode}
    ORDER BY updated_at DESC
    LIMIT 1
  `;
  return rows.length > 0 ? rows[0].content : null;
}

export async function upsertBlock(questionnaireCode, content) {
  const sql = getSql();
  await sql`
    INSERT INTO blocks (block_type, questionnaire_code, content, updated_at)
    VALUES ('mini_questionnaire', ${questionnaireCode}, ${JSON.stringify(content)}, now())
    ON CONFLICT (questionnaire_code)
    DO UPDATE SET content = EXCLUDED.content, updated_at = now()
  `;
}
