import { neon } from "@neondatabase/serverless";

function getSql() {
  return neon(process.env.DATABASE_URL);
}

// ── Blocks ────────────────────────────────────────────────────────────────────

export async function getBlockFull(periodId, questionnaireCode) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, content, state, provenance, previous_block_id
    FROM blocks
    WHERE period_id = ${periodId} AND questionnaire_code = ${questionnaireCode}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getBlock(periodId, questionnaireCode) {
  const block = await getBlockFull(periodId, questionnaireCode);
  return block?.content ?? null;
}

export async function getBlocksForPeriod(periodId) {
  const sql = getSql();
  return sql`
    SELECT questionnaire_code, block_type, content, state, provenance, updated_at
    FROM blocks
    WHERE period_id = ${periodId}
    ORDER BY questionnaire_code
  `;
}

export async function upsertBlock(undertakingId, periodId, questionnaireCode, blockType, content) {
  const sql = getSql();
  await sql`
    INSERT INTO blocks (block_type, questionnaire_code, undertaking_id, period_id, content, state, provenance, updated_at)
    VALUES (${blockType}, ${questionnaireCode}, ${undertakingId}, ${periodId}, ${JSON.stringify(content)}, 'elaboracao', 'novo', now())
    ON CONFLICT (period_id, questionnaire_code)
    DO UPDATE SET
      content = EXCLUDED.content,
      block_type = EXCLUDED.block_type,
      provenance = CASE
        WHEN blocks.provenance = 'herdado_sem_alteracao' THEN 'herdado_e_editado'
        ELSE blocks.provenance
      END,
      updated_at = now()
  `;
}

export async function transitionBlockState(periodId, questionnaireCode, newState) {
  const sql = getSql();
  await sql`
    UPDATE blocks SET state = ${newState}, updated_at = now()
    WHERE period_id = ${periodId} AND questionnaire_code = ${questionnaireCode}
  `;
}

// ── Undertakings ──────────────────────────────────────────────────────────────

export async function getUndertakings() {
  const sql = getSql();
  return sql`SELECT id, name, created_at FROM undertakings ORDER BY name`;
}

export async function createUndertaking(name) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO undertakings (name) VALUES (${name}) RETURNING id, name, created_at
  `;
  return rows[0];
}

export async function updateUndertaking(id, name) {
  const sql = getSql();
  const rows = await sql`
    UPDATE undertakings SET name = ${name} WHERE id = ${id} RETURNING id, name
  `;
  return rows[0] ?? null;
}

export async function deleteUndertaking(id) {
  const sql = getSql();
  await sql`DELETE FROM undertakings WHERE id = ${id}`;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export async function countUsers() {
  const sql = getSql();
  const rows = await sql`SELECT COUNT(*) AS count FROM users`;
  return Number(rows[0].count);
}

export async function getUsers() {
  const sql = getSql();
  return sql`SELECT id, email, name, created_at FROM users ORDER BY name`;
}

export async function getUserById(id) {
  const sql = getSql();
  const rows = await sql`SELECT id, email, name FROM users WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createUser(email, name, passwordHash) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO users (email, name, password_hash)
    VALUES (${email}, ${name}, ${passwordHash})
    RETURNING id, email, name, created_at
  `;
  return rows[0];
}

export async function updateUser(id, { name, email }) {
  const sql = getSql();
  const rows = await sql`
    UPDATE users SET name = ${name}, email = ${email} WHERE id = ${id}
    RETURNING id, email, name
  `;
  return rows[0] ?? null;
}

export async function updateUserPassword(id, passwordHash) {
  const sql = getSql();
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${id}`;
}

export async function deleteUser(id) {
  const sql = getSql();
  await sql`DELETE FROM users WHERE id = ${id}`;
}

// ── Reporting Periods ─────────────────────────────────────────────────────────

export async function getPeriods(undertakingId) {
  const sql = getSql();
  return sql`
    SELECT id, label, start_date, end_date, created_at
    FROM reporting_periods
    WHERE undertaking_id = ${undertakingId}
    ORDER BY start_date DESC
  `;
}

export async function getPeriodById(id) {
  const sql = getSql();
  const rows = await sql`SELECT id, undertaking_id, label, start_date, end_date FROM reporting_periods WHERE id = ${id}`;
  return rows[0] ?? null;
}

export async function createPeriod(undertakingId, { label, start_date, end_date }) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO reporting_periods (undertaking_id, label, start_date, end_date)
    VALUES (${undertakingId}, ${label}, ${start_date}, ${end_date})
    RETURNING id, label, start_date, end_date, created_at
  `;
  return rows[0];
}

export async function cloneBlocksToPeriod(sourcePeriodId, targetPeriodId, undertakingId) {
  const sql = getSql();
  const blocks = await sql`
    SELECT questionnaire_code, block_type, content, id
    FROM blocks
    WHERE period_id = ${sourcePeriodId} AND state = 'aprovado'
  `;
  for (const block of blocks) {
    await sql`
      INSERT INTO blocks (undertaking_id, period_id, block_type, questionnaire_code, content, state, provenance, previous_block_id, updated_at)
      VALUES (${undertakingId}, ${targetPeriodId}, ${block.block_type}, ${block.questionnaire_code}, ${JSON.stringify(block.content)}, 'elaboracao', 'herdado_sem_alteracao', ${block.id}, now())
      ON CONFLICT (period_id, questionnaire_code) DO NOTHING
    `;
  }
}

// ── Undertaking Master (SCD2) ─────────────────────────────────────────────────

export async function getMasterCurrent(undertakingId) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, content, valid_from
    FROM undertaking_master
    WHERE undertaking_id = ${undertakingId} AND valid_to IS NULL
    ORDER BY valid_from DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getMasterAtDate(undertakingId, date) {
  const sql = getSql();
  const rows = await sql`
    SELECT id, content, valid_from, valid_to
    FROM undertaking_master
    WHERE undertaking_id = ${undertakingId}
      AND valid_from <= ${date}
      AND (valid_to IS NULL OR valid_to > ${date})
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getMasterHistory(undertakingId) {
  const sql = getSql();
  return sql`
    SELECT id, valid_from, valid_to
    FROM undertaking_master
    WHERE undertaking_id = ${undertakingId}
    ORDER BY valid_from DESC
  `;
}

export async function createMasterVersion(undertakingId, content) {
  const sql = getSql();
  const now = new Date().toISOString();
  await sql`
    UPDATE undertaking_master
    SET valid_to = ${now}
    WHERE undertaking_id = ${undertakingId} AND valid_to IS NULL
  `;
  const rows = await sql`
    INSERT INTO undertaking_master (undertaking_id, content, valid_from)
    VALUES (${undertakingId}, ${JSON.stringify(content)}, ${now})
    RETURNING id, content, valid_from
  `;
  return rows[0];
}

// ── User ↔ Undertaking ────────────────────────────────────────────────────────

export async function getUserAuthorizedUndertakings(userId) {
  const sql = getSql();
  return sql`
    SELECT u.id, u.name FROM undertakings u
    JOIN user_undertakings uu ON uu.undertaking_id = u.id
    WHERE uu.user_id = ${userId}
    ORDER BY u.name
  `;
}

export async function setUserUndertakings(userId, undertakingIds) {
  const sql = getSql();
  await sql`DELETE FROM user_undertakings WHERE user_id = ${userId}`;
  for (const uid of undertakingIds) {
    await sql`INSERT INTO user_undertakings (user_id, undertaking_id) VALUES (${userId}, ${uid})`;
  }
}
