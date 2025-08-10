import { NextResponse } from 'next/server';
import resend from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const { phone, blogUrl, name, email, message } = await request.json();

    // Валидация: требуем телефон и хотя бы один из полей (email | message | blogUrl)
    if (!phone || (!email && !message && !blogUrl)) {
      return NextResponse.json(
        { error: 'Phone and one of email/message/blogUrl are required' },
        { status: 400 },
      );
    }

    // Отправляем email через Resend
    const { data, error } = await resend.emails.send({
      from: 'Aporto <noreply@aporto.tech>',
      to: ['hey@aporto.tech'],
      subject: 'Новая заявка с сайта Aporto',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1; margin-bottom: 20px;">Новая заявка на сотрудничество</h2>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <p><strong>Имя:</strong> ${name || 'Не указано'}</p>
            <p><strong>Телефон:</strong> ${phone}</p>
            ${email ? `<p><strong>Email:</strong> ${email}</p>` : ''}
            ${blogUrl ? `<p><strong>Блог/канал:</strong> <a href="${blogUrl}" target="_blank">${blogUrl}</a></p>` : ''}
            ${message ? `<p><strong>Сообщение:</strong> ${message}</p>` : ''}
          </div>
          
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; font-size: 14px; color: #64748b;">
            <p><strong>Дата:</strong> ${new Date().toLocaleString('ru-RU')}</p>
            <p><strong>IP:</strong> ${request.headers.get('x-forwarded-for') || 'Неизвестно'}</p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.',
    });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send contact form' },
      { status: 500 },
    );
  }
}
