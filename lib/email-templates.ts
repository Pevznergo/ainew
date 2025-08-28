import { createVerificationUrl } from './email-verification';

interface WelcomeEmailProps {
  userEmail: string;
  verificationToken: string;
}

export function createWelcomeEmailTemplate({
  userEmail,
  verificationToken,
}: WelcomeEmailProps): string {
  const verificationUrl = createVerificationUrl(verificationToken);

  return `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Добро пожаловать в Aporto!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #0b0b0f; color: #e5e7eb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #0b0b0f;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
            Добро пожаловать в Aporto!
          </h1>
          <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
            Ваш AI-помощник готов к работе
          </p>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 20px; background-color: #1a1a1f;">
          <h2 style="color: #6366f1; font-size: 24px; margin-bottom: 20px;">
            Подтвердите ваш email
          </h2>
          
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 30px; color: #d1d5db;">
            Привет! Спасибо за регистрацию в Aporto. Чтобы начать получать токены за выполнение заданий, 
            пожалуйста, подтвердите ваш email адрес.
          </p>

          <!-- Verification Button -->
          <div style="text-align: center; margin: 40px 0;">
            <a href="${verificationUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #06b6d4 100%); 
                      color: white; text-decoration: none; padding: 15px 30px; border-radius: 12px; 
                      font-weight: bold; font-size: 16px; box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);">
              ✉️ Подтвердить email
            </a>
          </div>

          <p style="font-size: 14px; color: #9ca3af; text-align: center; margin: 20px 0;">
            Ссылка действительна в течение 24 часов
          </p>

          <!-- Tasks Section -->
          <div style="background-color: #2d2d35; border-radius: 16px; padding: 30px; margin-top: 40px; border: 1px solid rgba(99, 102, 241, 0.2);">
            <h3 style="color: #6366f1; font-size: 20px; margin-bottom: 20px; text-align: center;">
              🎯 Выполняйте задания и получайте токены!
            </h3>
            
            <p style="color: #d1d5db; text-align: center; margin-bottom: 30px;">
              Максимум — <strong style="color: #06b6d4;">30 800 токенов</strong>!
            </p>

            <!-- Task List -->
            <div style="space-y: 20px;">
              <!-- Basic Tasks -->
              <div style="border-left: 4px solid #22c55e; padding-left: 15px; margin-bottom: 20px;">
                <h4 style="color: #22c55e; margin: 0 0 10px 0; font-size: 16px;">Базовые задания:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                  <li style="margin-bottom: 8px;">✅ Подтвердить email — <strong>+100 токенов</strong></li>
                  <li style="margin-bottom: 8px;">📝 Заполнить профиль (никнейм + биография) — <strong>+100 токенов</strong></li>
                  <li style="margin-bottom: 8px;">💬 Задать первый вопрос ИИ — <strong>+100 токенов</strong></li>
                  <li>📤 Опубликовать чат — <strong>+100 токенов</strong></li>
                </ul>
              </div>

              <!-- Social Tasks -->
              <div style="border-left: 4px solid #3b82f6; padding-left: 15px; margin-bottom: 20px;">
                <h4 style="color: #3b82f6; margin: 0 0 10px 0; font-size: 16px;">Социальные задания:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                  <li style="margin-bottom: 8px;">🐦 Поделиться в Twitter — <strong>+300 токенов</strong></li>
                  <li style="margin-bottom: 8px;">📘 Поделиться в Facebook — <strong>+300 токенов</strong></li>
                  <li style="margin-bottom: 8px;">🌐 Поделиться ВКонтакте — <strong>+300 токенов</strong></li>
                  <li>💌 Поделиться в Telegram — <strong>+300 токенов</strong></li>
                </ul>
              </div>

              <!-- Referral Tasks -->
              <div style="border-left: 4px solid #f59e0b; padding-left: 15px;">
                <h4 style="color: #f59e0b; margin: 0 0 10px 0; font-size: 16px;">Реферальная программа:</h4>
                <ul style="margin: 0; padding-left: 20px; color: #d1d5db;">
                  <li>👥 Пригласить друга — <strong>+200 токенов</strong> за каждого</li>
                </ul>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite" 
                 style="display: inline-block; background-color: rgba(99, 102, 241, 0.1); 
                        color: #6366f1; text-decoration: none; padding: 12px 24px; border-radius: 8px; 
                        font-weight: 600; border: 1px solid rgba(99, 102, 241, 0.3);">
                📋 Посмотреть все задания
              </a>
            </div>
          </div>

          <!-- Tips Section -->
          <div style="background-color: rgba(99, 102, 241, 0.05); border-radius: 12px; padding: 20px; margin-top: 30px; border: 1px solid rgba(99, 102, 241, 0.1);">
            <h4 style="color: #6366f1; margin: 0 0 15px 0;">💡 Полезные советы:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #d1d5db; font-size: 14px;">
              <li style="margin-bottom: 8px;">Используйте токены для доступа к премиум AI моделям</li>
              <li style="margin-bottom: 8px;">Задания можно выполнять в любом порядке</li>
              <li>Приглашайте друзей и получайте бонусы за каждого нового пользователя</li>
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #0b0b0f; padding: 30px 20px; text-align: center; border-top: 1px solid #2d2d35;">
          <p style="margin: 0 0 15px 0; color: #9ca3af; font-size: 14px;">
            Начните с подтверждения email и получите ваши первые 100 токенов!
          </p>
          
          <div style="margin-bottom: 20px;">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}" 
               style="color: #6366f1; text-decoration: none; margin: 0 15px;">Aporto.tech</a>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/profile" 
               style="color: #6366f1; text-decoration: none; margin: 0 15px;">Профиль</a>
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/invite" 
               style="color: #6366f1; text-decoration: none; margin: 0 15px;">Задания</a>
          </div>
          
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            © 2025 Aporto. AI для всех.
          </p>
          
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">
            Если у вас есть вопросы, напишите нам: 
            <a href="mailto:hey@aporto.tech" style="color: #6366f1; text-decoration: none;">hey@aporto.tech</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
