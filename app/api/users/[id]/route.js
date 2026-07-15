import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { updateUser, updateUserPassword, deleteUser } from "@/lib/db";

const UpdateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

export async function PUT(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt((await params).id, 10);
  const body = await request.json();
  const result = UpdateUserSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: result.error.errors }, { status: 422 });
  const { name, email, password } = result.data;
  const updated = await updateUser(id, { name, email });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await updateUserPassword(id, passwordHash);
  }
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = parseInt((await params).id, 10);
  if (id === parseInt(session.user.id, 10)) {
    return NextResponse.json({ error: "Cannot delete own account." }, { status: 400 });
  }
  await deleteUser(id);
  return NextResponse.json({ ok: true });
}
