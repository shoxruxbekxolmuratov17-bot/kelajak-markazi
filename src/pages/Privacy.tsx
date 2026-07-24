export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-surface p-6">
      <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
        <h1 className="text-2xl font-bold text-dark">Maxfiylik siyosati</h1>
        <p className="text-sm text-muted">
          Kelajak Markazi (Qamashi tumani) boshqaruv tizimi foydalanuvchi ma'lumotlarini faqat ta'lim
          jarayonini tashkil etish maqsadida qayta ishlaydi.
        </p>
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3 text-sm text-dark leading-relaxed">
          <p><strong>1. Yig'iladigan ma'lumotlar.</strong> FIO, telefon, maktab, to'garak, davomat va to'lov holati.</p>
          <p><strong>2. Maqsad.</strong> Ro'yxatga olish, davomat, to'lov nazorati va ota-ona bilan aloqa.</p>
          <p><strong>3. Saqlash.</strong> Ma'lumotlar markaz serverida saqlanadi; demo rejimida lokal qurilmada ham nusxa bo'lishi mumkin.</p>
          <p><strong>4. Ulashish.</strong> Uchinchi tomonga sotilmaydi. Faqat qonun talabi yoki markaz ehtiyoji bo'yicha.</p>
          <p><strong>5. Huquqlar.</strong> Ota-ona o'z farzandi ma'lumotlarini ko'rish va aniqlashtirishni so'rashi mumkin.</p>
          <p><strong>6. Aloqa.</strong> kelajak.qamashi@edu.uz · +998 (75) 123-45-67</p>
        </div>
        <a href="/login" className="text-sm text-primary hover:underline">← Tizimga qaytish</a>
      </div>
    </div>
  );
}
