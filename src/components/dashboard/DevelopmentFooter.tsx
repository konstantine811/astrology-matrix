import { useEffect, useState } from "react";
const FEEDBACK_EMAIL = "constainabrams@gmail.com";
const FEEDBACK_WEBHOOK_URL = import.meta.env.VITE_FEEDBACK_WEBHOOK_URL as
  | string
  | undefined;

export function DevelopmentFooter() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState("");

  const closeModal = () => {
    setIsOpen(false);
    setError("");
    setSuccess("");
  };

  const clearForm = () => {
    setName("");
    setComment("");
    setError("");
    setSuccess("");
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setError("Коментар обов'язковий для відправки.");
      return;
    }

    setError("");

    const subject = "MetaSense: баг/порада по функціоналу";
    const body = [
      `Ім'я: ${name.trim() || "(не вказано)"}`,
      `Дата: ${new Date().toLocaleString("uk-UA")}`,
      "",
      "Коментар:",
      trimmedComment,
    ].join("\n");

    setIsSending(true);
    try {
      if (FEEDBACK_WEBHOOK_URL) {
        const response = await fetch(FEEDBACK_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: FEEDBACK_EMAIL,
            subject,
            name: name.trim() || null,
            comment: trimmedComment,
            timestamp: new Date().toISOString(),
            page: window.location.href,
          }),
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status}`);
        }

        clearForm();
        setSuccess("Повідомлення відправлено. Дякую за фідбек!");
        window.setTimeout(() => closeModal(), 800);
        return;
      }

      // Fallback: open Gmail compose in browser (works even without local mail client).
      const gmailComposeUrl =
        `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
          FEEDBACK_EMAIL,
        )}` +
        `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailComposeUrl, "_blank", "noopener,noreferrer");

      clearForm();
      setSuccess(
        "Відкрито чернетку в Gmail. Натисніть «Надіслати» у вкладці пошти.",
      );
      window.setTimeout(() => closeModal(), 1200);
    } catch {
      const mailtoUrl = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;
      clearForm();
      setSuccess(
        "Відкрито поштовий клієнт. Якщо лист не відправився, перевірте налаштування пошти.",
      );
      window.setTimeout(() => closeModal(), 1200);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <footer className="pointer-events-none fixed inset-x-0 bottom-0 z-[120]">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,10,14,0.84) 0%, rgba(3,5,8,0.95) 48%, rgba(2,3,6,0.98) 100%)",
          boxShadow: "0 -18px 38px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08)",
          borderTop: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(14px) saturate(130%)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 pointer-events-auto">
        <p className="text-xs sm:text-sm" style={{ color: "#d1d5db" }}>
          Додаток на стадії розробки і буде доповнюватись. Якщо помітили баги або
          маєте ідеї покращення, напишіть на пошту.
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition"
          style={{
            color: "#f8fafc",
            borderColor: "rgba(255,255,255,0.32)",
            background: "rgba(255,255,255,0.06)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.18)",
          }}
        >
          Написати
        </button>
      </div>

      {isOpen && (
        <div
          className="pointer-events-auto fixed inset-0 z-[140] flex items-end justify-end bg-black/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center"
          onClick={closeModal}
        >
          <form
            className="grid w-[min(680px,calc(100vw-24px))] gap-0 overflow-hidden rounded-2xl border backdrop-blur-xl"
            onSubmit={handleSubmit}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Надіслати зворотний зв'язок"
            style={{
              borderColor: "rgba(255,255,255,0.2)",
              background:
                "linear-gradient(180deg, rgba(10,12,16,0.96) 0%, rgba(7,9,13,0.98) 100%)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,0.58), inset 0 1px 0 rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="flex items-center justify-between border-b px-3 py-2"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              <p
                className="text-xs font-medium uppercase tracking-[0.14em]"
                style={{ color: "#a1a1aa" }}
              >
                Command Feedback
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border px-2 py-0.5 text-xs transition"
                style={{
                  color: "#e2e8f0",
                  borderColor: "rgba(255,255,255,0.26)",
                  background: "rgba(255,255,255,0.06)",
                }}
                aria-label="Закрити форму"
                title="Закрити"
              >
                Esc
              </button>
            </div>
            <div className="grid gap-2 p-3">
              <label className="grid gap-1">
                <span className="text-xs" style={{ color: "#cbd5e1" }}>
                  Ім'я (за бажанням)
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    color: "#f8fafc",
                    borderColor: "rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                  placeholder="Введіть ім'я..."
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs" style={{ color: "#cbd5e1" }}>
                  Коментар (обов'язково)
                </span>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="min-h-32 rounded-lg border px-3 py-2 text-sm outline-none"
                  style={{
                    color: "#f8fafc",
                    borderColor: "rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.04)",
                  }}
                  placeholder="Опишіть баг, недорахунок або ідею покращення..."
                  required
                />
              </label>
            </div>

            {error && (
              <p className="px-3 text-sm" style={{ color: "#ef4444" }}>
                {error}
              </p>
            )}
            {success && (
              <p className="px-3 text-sm" style={{ color: "#22c55e" }}>
                {success}
              </p>
            )}

            <div
              className="mt-1 flex items-center justify-between gap-2 border-t px-3 py-2"
              style={{ borderColor: "rgba(255,255,255,0.12)" }}
            >
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                {FEEDBACK_WEBHOOK_URL
                  ? `Відправка напряму на: ${FEEDBACK_EMAIL}`
                  : `Відкриття чернетки: ${FEEDBACK_EMAIL}`}
              </p>
              <button
                type="submit"
                disabled={isSending}
                className="rounded-full border px-4 py-1.5 text-sm font-semibold transition"
                style={{
                  color: "#f8fafc",
                  borderColor: "rgba(255,255,255,0.32)",
                  background: isSending
                    ? "rgba(255,255,255,0.14)"
                    : "rgba(255,255,255,0.08)",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                {isSending ? "Відправка..." : "Відправити"}
              </button>
            </div>
          </form>
        </div>
      )}
    </footer>
  );
}
