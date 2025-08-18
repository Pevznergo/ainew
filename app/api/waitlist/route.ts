import { NextResponse } from "next/server";
import resend from "@/lib/resend";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: "Aporto <noreply@aporto.tech>",
      to: ["hey@aporto.tech"],
      subject: "Новая заявка в waitlist",
      replyTo: email,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #06b6d4; margin-bottom: 20px;">Новая заявка в waitlist</h2>
          <div style="background: #0b1220; color:#e5e7eb; padding: 16px; border-radius: 10px; border:1px solid rgba(255,255,255,0.08);">
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Source:</strong> /rewards</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString('ru-RU')}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend send error", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Заявка отправлена" });
  } catch (err) {
    console.error("/api/waitlist error", err);
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}

