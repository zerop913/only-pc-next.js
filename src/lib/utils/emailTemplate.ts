export default function emailTemplate(code: string) {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Arial', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      </style>
    </head>
    <body style="margin: 0; padding: 20px; background-color: #1a1b23; font-family: Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto;">
        <tr>
          <td>
            <div style="text-align: center; padding: 20px 0;">
              <h1 style="color: #3b82f6; font-size: 28px; margin: 0; font-weight: bold;">OnlyPC</h1>
              <p style="color: #ffffff; margin-top: 10px; font-size: 16px;">Подтверждение входа в систему</p>
            </div>
            
            <div style="background-color: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 30px; margin: 20px 0;">
              <div style="text-align: center;">
                <p style="color: #ffffff; margin-bottom: 20px; font-size: 16px;">Ваш код подтверждения:</p>
                <div style="background-color: rgba(26, 27, 35, 0.8); border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <span style="color: #3b82f6; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${code}</span>
                </div>
                <p style="color: rgba(255, 255, 255, 0.6); font-size: 14px;">Код действителен в течение 5 минут</p>
              </div>
            </div>
            
            <div style="text-align: center; padding-top: 20px; border-top: 1px solid rgba(59, 130, 246, 0.2);">
              <p style="color: rgba(255, 255, 255, 0.6); font-size: 13px; margin-bottom: 10px;">
                Если вы не запрашивали этот код, просто проигнорируйте это письмо.
              </p>
              <p style="color: rgba(255, 255, 255, 0.8); font-size: 14px; margin-bottom: 15px;">
                С уважением, команда OnlyPC
              </p>
              <p style="color: rgba(255, 255, 255, 0.6); font-size: 12px;">
                © ${new Date().getFullYear()} OnlyPC. Все права защищены.
              </p>
            </div>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
}
