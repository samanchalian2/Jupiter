export function App() {
  return (
    <main className="shell">
      <section aria-labelledby="jupiter-title" className="hero">
        <p className="eyebrow">پایهٔ توسعه MVP</p>
        <h1 id="jupiter-title">ژوپیتر</h1>
        <p>
          سامانه تیکتینگ هوشمند سازمانی؛ این پوسته فقط برای تأیید مسیر توسعه
          و پشتیبانی راست‌به‌چپ ساخته شده است.
        </p>
      </section>
      <section aria-label="وضعیت پایه" className="status-card">
        <span aria-hidden="true" className="status-dot" />
        <div>
          <h2>محیط پایه آماده است</h2>
          <p>قابلیت‌های محصول در Goalهای بعدی اضافه می‌شوند.</p>
        </div>
      </section>
    </main>
  );
}
