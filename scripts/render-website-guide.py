from pathlib import Path
import re,html,markdown
root=Path(__file__).resolve().parent.parent
source=(root/'deploy/arandi-guide/src/content/jupiter-guide.fa.md').read_text(encoding='utf-8')
parts=re.split(r'^## ',source,flags=re.M)
sections={p.split('\n',1)[0].strip():p.split('\n',1)[1].strip() for p in parts[1:]}
font=root/'apps/web/node_modules/shabnam-font/dist/Shabnam.woff2'
bold=root/'apps/web/node_modules/shabnam-font/dist/Shabnam-Bold.woff2'
logo=root/'apps/web/public/jupiter-logo.png'
selected=[x for x in sections if x not in ('Hero','CTA پایانی')]
toc=''.join(f'<li><a href="#section-{i}">{html.escape(t)}</a></li>' for i,t in enumerate(selected))
body=''
for i,title in enumerate(selected):
 text=sections[title].removesuffix('---').strip()
 if title=='امکانات ژوپیتر در یک نگاه':text=text.split('### مسیر مناسب من کدام است؟')[0]
 content=markdown.markdown(text,extensions=['tables','sane_lists'])
 body+=f'<section id="section-{i}"><h2>{html.escape(title)}</h2>{content}</section>'
template='''<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><title>راهنمای کامل ژوپیتر</title><style>
@font-face{font-family:Shabnam;src:url('__FONT__')}@font-face{font-family:Shabnam;src:url('__BOLD__');font-weight:700}
@page{size:A4;margin:18mm 18mm 20mm}*{box-sizing:border-box}body{font-family:Shabnam,sans-serif;color:#252435;font-size:10.5pt;line-height:1.95;margin:0}a{color:#014348;text-decoration:none}p{margin:7pt 0}strong{font-weight:700}h1{font-size:28pt;line-height:1.6;color:#014348}h2{font-size:19pt;color:#014348;border-bottom:2pt solid #d8c3a6;padding-bottom:8pt;line-height:1.7;margin:0 0 15pt}h3{font-size:13pt;color:#63546f;margin:17pt 0 7pt;line-height:1.8}h4{font-size:11.5pt;color:#63546f}h2,h3,h4{break-after:avoid}p,li{orphans:3;widows:3}section{break-before:page}li{margin:4pt 0}ul,ol{padding-inline-start:22pt}code{font-family:Shabnam;background:#f5f0e9;border-radius:3px;padding:1pt 4pt;overflow-wrap:anywhere}table{border-collapse:collapse;width:100%;font-size:9pt}th,td{border:1px solid #d8c3a6;padding:5pt;text-align:right}tr{break-inside:avoid}blockquote{border-right:3pt solid #867c98;padding-right:12pt;background:#f7f4f0}hr{border:0;border-top:1px solid #ddd;margin:14pt 0}.cover{min-height:245mm;display:flex;flex-direction:column;justify-content:center;break-after:page}.cover img{width:70mm;max-height:38mm;object-fit:contain;align-self:flex-start}.cover .lead{font-size:14pt;color:#63546f}.tag{color:#014348;font-size:10pt}.note{padding:12pt;background:#f7f4f0;border-right:3pt solid #d8c3a6}.toc{break-after:page}.toc li{margin:10pt 0}.closing{break-before:page}
</style><body><div class="cover"><img src="__LOGO__" alt="Jupiter"><p class="tag">آرندی | راهنمای رسمی محصول</p><h1>راهنمای کامل راه‌اندازی<br>و استفاده از ژوپیتر</h1><p class="lead">از اولین تیکت شخصی تا راه‌اندازی سازمان<br>و پایش هوشمند نرم‌افزار</p><p>نسخه به‌روز: ۳ آبان ۱۴۰۵ / ۲۵ اکتبر ۲۰۲۶<br>هم‌راستا با قابلیت‌های منتشرشده GOAL-069</p><div class="note">مسیر مناسب خود را بخوانید: کاربر مستقل، عضو سازمان یا مدیر سازمان. بخش تخصصی پایش فقط برای مسئول دارای مجوز است؛ برای شروع استفاده شخصی یا ثبت تیکت نیازی به آن ندارید.</div><p><a href="https://arandi.io/knowledge/jupiter-guide?lang=fa">نسخه آنلاین راهنما در arandi.io</a><br><a href="https://jupiter.arandi.io">ورود به ژوپیتر: jupiter.arandi.io</a></p></div><div class="toc"><h2>در این راهنما</h2><ol>__TOC__</ol><p class="note">مقادیر سهمیه، قیمت، دسترسی و سرویس فعال را از پنل خود بررسی کنید. این راهنما وعده فعال‌بودن همه خدمات یا پاسخ فوری نمی‌دهد. رمز، کد ورود و اطلاعات محرمانه را در تیکت یا گزارش وارد نکنید.</p></div>__BODY__<div class="closing"><h2>آماده شروع هستید؟</h2><p>وارد ژوپیتر شوید و فضای کاری درست را انتخاب کنید. برای استفاده شخصی ثبت سازمان لازم نیست؛ برای راه‌اندازی سازمان، درخواست رسمی آن را دنبال کنید.</p><p><a href="https://jupiter.arandi.io">ورود به ژوپیتر</a> | <a href="https://arandi.io/knowledge/jupiter-guide?lang=fa">آخرین نسخه آنلاین راهنما</a></p></div></body></html>'''
out=root/'tmp/pdfs';out.mkdir(parents=True,exist_ok=True)
template=template.replace('__FONT__',font.as_uri()).replace('__BOLD__',bold.as_uri()).replace('__LOGO__',logo.as_uri()).replace('__TOC__',toc).replace('__BODY__',body)
(out/'jupiter-guide.html').write_text(template,encoding='utf-8')
print('HTML created; sections:',len(selected))
