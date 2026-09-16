export async function sendTelegramMessageToChat(
  chatId: string | number,
  text: string,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token || !chatId) return false;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: String(chatId),
          text,
          parse_mode: 'HTML',
        }),
      },
    );

    if (!response.ok) {
      const body = await response.text();
      console.error(`Telegram send failed (${response.status}): ${body}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Telegram send error: ${String(error)}`);
    return false;
  }
}

export function telegramCodeMessage(
  code: string,
  purpose: 'login' | 'reset',
) {
  const subject =
    purpose === 'reset' ? 'Password Reset Code' : 'Login Verification Code';
  return `${subject}\n\nYour Rona ERP code is: <b>${code}</b>\n\nIt expires in 10 minutes.`;
}

export async function sendTelegramCredentialsToChat(
  chatId: string | number,
  email: string,
  password: string,
  fullName?: string,
) {
  return sendTelegramMessageToChat(
    chatId,
    `Your Rona ERP Account Credentials\n\nName: ${fullName ?? ''}\nEmail: <b>${email}</b>\nOne-time password: <b>${password}</b>\n\nYou must change this password after your first sign-in.`,
  );
}