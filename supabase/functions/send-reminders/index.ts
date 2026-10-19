// Chamada a cada minuto pelo pg_cron (ver supabase/migrations/20261021000000_push.sql). Manda os lembretes de estudo
// 1 hora antes, 30 minutos antes e na hora, no fuso de cada aparelho, só nos dias de estudo.
import { adminClient, env, failure, json } from "../_shared/server.ts";
import { sendPush, type VapidKeys } from "../_shared/webpush.ts";

const OFFSETS = [60, 30, 0] as const;
// O cron pode atrasar um pouco: um aviso ainda sai até 4 minutos depois da hora certa, uma vez só.
const LATE_MINUTES = 4;

interface Subscription {
  endpoint: string;
  p256dh: string;
  auth: string;
  reminder_time: string;
  time_zone: string;
  study_days: boolean[];
  last_sent: string | null;
}

interface LocalNow {
  dateKey: string;
  minutes: number;
  // 0 = segunda, como em studyDays.
  weekday: number;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localNow(now: Date, timeZone: string, dayShift = 0): LocalNow {
  const shifted = new Date(now.getTime() + dayShift * 86_400_000);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(shifted)
      .map((part) => [part.type, part.value]),
  );
  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    weekday: WEEKDAYS.indexOf(parts.weekday),
  };
}

function message(offset: number, time: string) {
  if (offset === 60) return { title: "Daqui a 1 hora", body: `Seu horário de estudo começa às ${time}. Separe o material.` };
  if (offset === 30) return { title: "Faltam 30 minutos", body: `Seu horário de estudo começa às ${time}.` };
  return { title: "Hora de estudar", body: "Abra o Flow e comece pela matéria do dia. Sem pressa." };
}

// O aviso que vence agora para esta inscrição, se houver. Um horário perto da meia-noite pode avisar no dia anterior.
function dueReminder(subscription: Subscription, now: Date) {
  const time = subscription.reminder_time.slice(0, 5);
  const [hours, minutes] = time.split(":").map(Number);
  const today = localNow(now, subscription.time_zone);
  for (const offset of OFFSETS) {
    const target = hours * 60 + minutes - offset;
    const studyDay = target < 0 ? localNow(now, subscription.time_zone, 1) : today;
    const at = (target + 1440) % 1440;
    const late = (today.minutes - at + 1440) % 1440;
    if (late > LATE_MINUTES || !subscription.study_days[studyDay.weekday]) continue;
    const tag = `flow-lembrete-${studyDay.dateKey}-${offset}`;
    if (subscription.last_sent === tag) continue;
    return { tag, offset, time };
  }
  return null;
}

Deno.serve(async (request) => {
  if (request.headers.get("x-reminders-secret") !== env("REMINDERS_SECRET")) return failure("Não autorizado.", 401);
  const vapid: VapidKeys = { publicKey: env("VAPID_PUBLIC_KEY"), privateKey: env("VAPID_PRIVATE_KEY"), subject: env("VAPID_SUBJECT") };
  const admin = adminClient();
  const { data, error } = await admin.from("push_subscriptions").select("*");
  if (error) return failure("Não foi possível ler as inscrições.", 500);

  const now = new Date();
  let sent = 0;
  for (const subscription of (data ?? []) as Subscription[]) {
    const due = dueReminder(subscription, now);
    if (!due) continue;
    // Marca antes de enviar: se o envio falhar no meio, o aviso não se repete no minuto seguinte.
    await admin.from("push_subscriptions").update({ last_sent: due.tag }).eq("endpoint", subscription.endpoint);
    try {
      const status = await sendPush(subscription, { ...message(due.offset, due.time), tag: due.tag, url: "/painel" }, vapid);
      if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("endpoint", subscription.endpoint);
      else if (status < 300) sent++;
    } catch {
      // Um serviço de push fora do ar não pode travar os avisos das outras pessoas.
    }
  }
  return json({ sent });
});
