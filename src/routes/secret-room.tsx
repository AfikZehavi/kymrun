import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Check, X, Gift, RotateCcw, Trophy } from "lucide-react";

import { SiteFooter } from "@/components/site-footer";
import {
  pickRound,
  triviaQuestions,
  ROUND_SIZE,
  PASS_SCORE,
  type TriviaQuestion,
} from "@/lib/trivia";
import { saveSecretGift, useSecretGift } from "@/lib/use-secret-gift";

export const Route = createFileRoute("/secret-room")({
  head: () => ({
    meta: [
      { title: "החדר הסודי — טריוויית יין ווויסקי | KYMRUN" },
      {
        name: "description",
        content:
          "משחק טריוויה על שימור יין, טעמי יין ווויסקי. עונים נכון — מקבלים מתנה בהזמנה הבאה ב-KYMRUN.",
      },
      { property: "og:title", content: "החדר הסודי — טריוויית יין ווויסקי" },
      {
        property: "og:description",
        content: "56 שאלות, סבב של 7 — וזוכים במתנה בעת רכישה.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SecretRoom,
});

type Stage = "intro" | "play" | "done";

function SecretRoom() {
  const { gift, setGift } = useSecretGift();
  const [stage, setStage] = useState<Stage>("intro");
  const [round, setRound] = useState<TriviaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const current = round[index];

  function start() {
    setRound(pickRound());
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStage("play");
  }

  function choose(i: number) {
    if (picked !== null || !current) return;
    setPicked(i);
    if (i === current.answer) setScore((s) => s + 1);
  }

  function next() {
    const last = index + 1 >= round.length;
    const finalScore = score;
    if (last) {
      if (finalScore >= PASS_SCORE) setGift(saveSecretGift(finalScore));
      setStage("done");
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_40%_at_50%_0%,hsl(var(--primary)/0.18),transparent_70%)]"
      />

      <main className="relative mx-auto max-w-md px-5 pt-10 md:max-w-2xl md:px-8 lg:max-w-3xl">
        <Link
          to="/"
          className="text-xs tracking-widest text-muted-foreground hover:text-foreground"
        >
          → חזרה לחנות
        </Link>

        <div className="mt-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-card/70 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary backdrop-blur-md">
            <Sparkles className="size-3.5" />
            החדר הסודי
          </span>
        </div>

        {stage === "intro" && (
          <Intro
            onStart={start}
            hasGift={!!gift}
            giftCode={gift?.code ?? null}
          />
        )}

        {stage === "play" && current && (
          <Play
            question={current}
            index={index}
            total={round.length}
            picked={picked}
            score={score}
            onChoose={choose}
            onNext={next}
          />
        )}

        {stage === "done" && (
          <Done
            score={score}
            code={score >= PASS_SCORE ? (gift?.code ?? null) : null}
            onRetry={start}
          />
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function Intro({
  onStart,
  hasGift,
  giftCode,
}: {
  onStart: () => void;
  hasGift: boolean;
  giftCode: string | null;
}) {
  return (
    <div className="pb-16">
      <h1 className="mt-4 font-display text-3xl font-bold leading-tight lg:text-5xl">
        טריוויית הבקבוקים
        <br />
        <span className="text-primary">ענה נכון — קבל מתנה</span>
      </h1>
      <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed text-muted-foreground">
        {triviaQuestions.length} שאלות על שימור יין, טעמי יין ועולם הוויסקי. כל
        סבב מגריל {ROUND_SIZE} שאלות — {PASS_SCORE} תשובות נכונות ומעלה פותחות
        מתנה שתצורף להזמנה הבאה שלך.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { t: "שימור", d: "מרתף, טמפרטורה ופקקים" },
          { t: "יין", d: "טאנינים, ארומות והתאמות" },
          { t: "וויסקי", d: "חביות, פיט וסינגל מאלט" },
        ].map((c) => (
          <div
            key={c.t}
            className="rounded-2xl border border-border bg-card/70 p-5 backdrop-blur-md"
          >
            <p className="font-display text-lg font-bold">{c.t}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>

      {hasGift && giftCode && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-primary/35 bg-primary/10 p-4">
          <Gift className="size-5 shrink-0 text-primary" />
          <p className="text-sm">
            כבר ניצחת — קוד המתנה שלך{" "}
            <span className="font-mono font-bold">{giftCode}</span> שמור ויחכה
            לך בסל.
          </p>
        </div>
      )}

      <button
        onClick={onStart}
        className="mt-8 w-full rounded-2xl bg-primary px-6 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.01] active:scale-[0.98] sm:w-auto sm:px-10"
      >
        {hasGift ? "לשחק שוב" : "מתחילים"}
      </button>
    </div>
  );
}

function Play({
  question,
  index,
  total,
  picked,
  score,
  onChoose,
  onNext,
}: {
  question: TriviaQuestion;
  index: number;
  total: number;
  picked: number | null;
  score: number;
  onChoose: (i: number) => void;
  onNext: () => void;
}) {
  const answered = picked !== null;
  const correct = picked === question.answer;

  return (
    <div className="pb-16">
      <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
        <span>
          שאלה {index + 1} מתוך {total} · {question.topic}
        </span>
        <span className="inline-flex items-center gap-1.5 font-mono">
          <Trophy className="size-3.5 text-primary" />
          {score}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div
        key={question.id}
        className="mt-6 animate-in fade-in slide-in-from-bottom-4 rounded-3xl border border-border bg-card/80 p-6 backdrop-blur-md lg:p-8"
      >
        <h1 className="font-display text-xl font-bold leading-snug lg:text-3xl">
          {question.q}
        </h1>

        <div className="mt-6 grid gap-3">
          {question.options.map((opt, i) => {
            const isAnswer = i === question.answer;
            const state = !answered
              ? "idle"
              : isAnswer
                ? "right"
                : i === picked
                  ? "wrong"
                  : "dim";
            return (
              <button
                key={opt}
                onClick={() => onChoose(i)}
                disabled={answered}
                className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-right text-sm font-medium transition-all ${
                  state === "idle"
                    ? "border-border bg-background hover:border-primary/40 hover:-translate-y-0.5 active:scale-[0.99]"
                    : state === "right"
                      ? "border-primary bg-primary/12 text-foreground"
                      : state === "wrong"
                        ? "border-destructive/60 bg-destructive/10"
                        : "border-border/60 opacity-50"
                }`}
              >
                <span className="min-w-0">{opt}</span>
                {answered && isAnswer && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
                {answered && state === "wrong" && (
                  <X className="size-4 shrink-0 text-destructive" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-5 animate-in fade-in rounded-2xl bg-muted/60 p-4">
            <p className="text-sm font-semibold">
              {correct ? "יפה מאוד 🍷" : "כמעט —"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {question.fact}
            </p>
            <button
              onClick={onNext}
              className="mt-4 w-full rounded-2xl bg-primary py-3.5 text-base font-semibold text-primary-foreground active:scale-[0.98]"
            >
              {index + 1 >= total ? "לתוצאה" : "לשאלה הבאה"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Done({
  score,
  code,
  onRetry,
}: {
  score: number;
  code: string | null;
  onRetry: () => void;
}) {
  const won = score >= PASS_SCORE;
  return (
    <div className="pb-16">
      <div className="mt-6 animate-in fade-in zoom-in-95 rounded-3xl border border-primary/30 bg-gradient-to-bl from-card via-card to-primary/10 p-7 text-center lg:p-10">
        <div className="mx-auto grid size-14 place-items-center rounded-full bg-primary/15">
          {won ? (
            <Gift className="size-7 text-primary" />
          ) : (
            <RotateCcw className="size-7 text-primary" />
          )}
        </div>

        <h1 className="mt-5 font-display text-2xl font-bold lg:text-4xl">
          {won ? "פתחת את המתנה" : "עוד סיבוב אחד?"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {score} תשובות נכונות מתוך {ROUND_SIZE}
        </p>

        {won && code && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-primary/40 bg-background/70 p-5">
            <p className="text-xs tracking-widest text-muted-foreground">
              קוד המתנה שלך
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-primary">
              {code}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              המתנה תצורף אוטומטית להזמנה הבאה שלך — הקוד מופיע גם בעמוד הסל.
            </p>
          </div>
        )}

        {!won && (
          <p className="mx-auto mt-4 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
            צריך {PASS_SCORE} תשובות נכונות כדי לזכות. השאלות מוגרלות מחדש בכל
            סבב — נסה שוב.
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={onRetry}
            className="rounded-2xl border border-border bg-background px-6 py-3.5 text-base font-semibold transition-colors hover:border-primary/40"
          >
            סבב נוסף
          </button>
          <Link
            to="/"
            hash="shelf"
            className="rounded-2xl bg-primary px-6 py-3.5 text-center text-base font-semibold text-primary-foreground active:scale-[0.98]"
          >
            למדף הבקבוקים
          </Link>
        </div>
      </div>
    </div>
  );
}
