import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeFeedbackContent } from "@/lib/ai";
import Papa from "papaparse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;
    console.log("Workspace ID:", workspaceId);
    console.log("File:", file?.name);

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: "CSV file is required",
        },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace ID is required",
        },
        { status: 400 }
      );
    }

    const csvText = await file.text();

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid CSV format",
          errors: parsed.errors,
        },
        { status: 400 }
      );
    }

    const rows = parsed.data as Array<Record<string, string>>;

    const normalizeKey = (key: string) => key.trim().toLowerCase();
    const matchesField = (key: string, names: string[]) => {
      const normalized = normalizeKey(key);
      return names.some((name) => normalized === name || normalized.includes(name));
    };

    const getField = (
      row: Record<string, string>,
      names: string[]
    ) => {
      for (const key of Object.keys(row)) {
        if (matchesField(key, names)) {
          return String(row[key] ?? "").trim();
        }
      }
      return "";
    };

    const customerNames = ["customer", "customer name", "customerlabel", "name"];
    const channelNames = ["channel", "source", "medium"];
    const feedbackNames = ["feedback", "message", "content", "comments", "comment"];

    let count = 0;
    const skippedRows: number[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      if (typeof row !== "object" || row === null) {
        skippedRows.push(index + 1);
        continue;
      }

      const customerLabel = getField(row, customerNames);
      const channel = getField(row, channelNames);
      const content = getField(row, feedbackNames);

      if (!customerLabel || !channel || !content) {
        skippedRows.push(index + 1);
        continue;
      }

      const analysis = await analyzeFeedbackContent(content);

      await prisma.feedback.create({
        data: {
          customerLabel,
          channel,
          content,
          workspaceId,
          ...analysis,
        },
      });

      count++;
    }

    if (count === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            skippedRows.length > 0
              ? `No valid rows found. Skipped rows: ${skippedRows.join(", ")}`
              : "No valid feedback rows were found in the CSV.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "CSV uploaded successfully",
      count,
    });
  } catch (error) {
    console.error("UPLOAD ERROR:",error);

    return NextResponse.json(
      {
        success: false,
        message: String(error),
      },
      { status: 500 }
    );
  }
}
