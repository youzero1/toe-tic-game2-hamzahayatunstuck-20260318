import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export interface ScoresRow {
  id: number;
  x_wins: number;
  o_wins: number;
  draws: number;
}

export async function GET() {
  try {
    const db = getDb();
    const row = db.prepare("SELECT * FROM scores WHERE id = 1").get() as ScoresRow;
    return NextResponse.json({
      xWins: row.x_wins,
      oWins: row.o_wins,
      draws: row.draws,
    });
  } catch (error) {
    console.error("GET /api/scores error:", error);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { result } = body as { result: "X" | "O" | "draw" };

    if (!result || !["X", "O", "draw"].includes(result)) {
      return NextResponse.json({ error: "Invalid result" }, { status: 400 });
    }

    const db = getDb();

    if (result === "X") {
      db.prepare("UPDATE scores SET x_wins = x_wins + 1 WHERE id = 1").run();
    } else if (result === "O") {
      db.prepare("UPDATE scores SET o_wins = o_wins + 1 WHERE id = 1").run();
    } else {
      db.prepare("UPDATE scores SET draws = draws + 1 WHERE id = 1").run();
    }

    const row = db.prepare("SELECT * FROM scores WHERE id = 1").get() as ScoresRow;
    return NextResponse.json({
      xWins: row.x_wins,
      oWins: row.o_wins,
      draws: row.draws,
    });
  } catch (error) {
    console.error("POST /api/scores error:", error);
    return NextResponse.json({ error: "Failed to update scores" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = getDb();
    db.prepare("UPDATE scores SET x_wins = 0, o_wins = 0, draws = 0 WHERE id = 1").run();
    return NextResponse.json({ xWins: 0, oWins: 0, draws: 0 });
  } catch (error) {
    console.error("DELETE /api/scores error:", error);
    return NextResponse.json({ error: "Failed to reset scores" }, { status: 500 });
  }
}
