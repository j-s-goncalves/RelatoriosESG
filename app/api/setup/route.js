import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { countUsers, createUser, createUndertaking, setUserUndertakings } from "@/lib/db";

const SetupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  undertaking_name: z.string().min(1),
});

export async function POST(request) {
  const count = await countUsers();
  if (count > 0) {
    return NextResponse.json({ error: "Setup already completed." }, { status: 403 });
  }

  const body = await request.json();
  const result = SetupSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.errors }, { status: 422 });
  }

  const { name, email, password, undertaking_name } = result.data;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await createUser(email, name, passwordHash);
  const undertaking = await createUndertaking(undertaking_name);
  await setUserUndertakings(user.id, [undertaking.id]);

  return NextResponse.json({ ok: true });
}
