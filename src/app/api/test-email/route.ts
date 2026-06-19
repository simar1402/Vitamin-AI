import { NextResponse } from "next/server";
import { getResendClient, getResendFromAddress } from "@/lib/resend";

export const dynamic = "force-dynamic";

const TEST_RECIPIENT = "mesimarpreet@gmail.com";

const SUBJECT = "VitaminAI Test Email";

const TEXT_BODY = `☀️ Good Morning, Simar

This is a test email from VitaminAI.

If you received this email, Resend is connected successfully.`;

export async function GET() {
  try {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: getResendFromAddress(),
      to: [TEST_RECIPIENT],
      subject: SUBJECT,
      text: TEXT_BODY,
      html: TEXT_BODY.replace(/\n/g, "<br />"),
    });

    if (error) {
      console.error("[api/test-email]", error);
      return NextResponse.json(
        {
          result: "ERROR",
          message: "Failed to send test email",
          error: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      result: "SUCCESS",
      message: `Test email sent to ${TEST_RECIPIENT}`,
      data: { id: data?.id ?? null },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    console.error("[api/test-email]", message);

    const status = message.includes("RESEND_API_KEY") ? 503 : 500;

    return NextResponse.json(
      {
        result: "ERROR",
        message,
      },
      { status },
    );
  }
}
