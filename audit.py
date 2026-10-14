#!/usr/bin/env python3
"""فحص جودة ابو حوده — شغّله قبل كل تسليم:  python3 audit.py index.html
يفحص: ١) صياغة كل بلوكات السكريبت  ٢) اتساق رقم النسخة  ٣) دوال بتسجّل/بتحرّك فلوس ومش في __ONCE_GUARDED
٤) حسابات مالية خام (qty*price / paid>=total) برّه الطبقة المشتركة  ٥) أنماط حسابية لسه مكررة ٣+ مرات"""
import re,sys,subprocess,json,collections,tempfile,os
path=sys.argv[1] if len(sys.argv)>1 else 'index.html'
s=open(path,encoding='utf-8').read(); L=s.split('\n'); bad=0
def head(t): print('\n== '+t)
head('١) صياغة السكريبت')
for i,b in enumerate(re.findall(r'<script(?![^>]*\bsrc=)[^>]*>(.*?)</script>',s,re.S)):
    f=tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8');f.write(b);f.close()
    r=subprocess.run(['node','--check',f.name],capture_output=True,text=True);os.unlink(f.name)
    print(' بلوك',i,'OK' if r.returncode==0 else 'خطأ: '+r.stderr[:200]); bad+=r.returncode!=0
head('٢) رقم النسخة')
t=re.search(r'<title>[^<]*v(\d+)</title>',s); b=re.search(r'BUILD_STAMP="[^"]*v(\d+)"',s); a=re.search(r'APP_VERSION=(\d+)',s)
vs=[x.group(1) for x in (t,b,a) if x]; print(' ',vs, 'متسقة' if len(set(vs))==1 and len(vs)==3 else '⚠️ مختلفة'); bad+=len(set(vs))!=1 or len(vs)!=3
head('٣) دوال تسجيل/فلوس مش محروسة')
pat=re.compile(r'^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(',re.M); ms=list(pat.finditer(s)); funcs={}
for i,m in enumerate(ms): funcs[m.group(1)]=s[m.start():(ms[i+1].start() if i+1<len(ms) else len(s))]
g=re.search(r'var __ONCE_GUARDED=(\[.*?\]);',s,re.S); guarded=set(json.loads(g.group(1))) if g else set()
tok=lambda n: re.compile(r'(?<![A-Za-z0-9_$.])'+re.escape(n)+r'(?![A-Za-z0-9_$])')
handlers=' '.join(m.group(0) for m in re.finditer(r'on(?:click|keydown|keypress|keyup|change|submit)=(?:\\)?"[^"]{0,600}',s))+' '.join(m.group(0) for m in re.finditer(r'confirmAction\([^\n]{0,400}',s))
miss=[]
for n,b in funcs.items():
    c=(re.search(r'genId\(\)',b) and re.search(r'dbUpsert|dbInsert|unshift\(|\.push\(',b)) or (re.search(r'dbUpdate\(|dbUpsert\(|dbDelete\(|persist\(',b) and re.search(r'\bpaid\b|payments|\.balance|amount|\.qty|total',b))
    if c and n not in guarded and tok(n).search(handlers): miss.append(n)
print(' ',len(guarded),'محروسة؛ مش محروسة:',miss or 'لا يوجد'); 
head('٤) حسابات مالية خام (المفروض من الطبقة المشتركة)')
raw=[]
for i,l in enumerate(L):
    if re.search(r'(\.qty|\bqty)\s*\*\s*\(?\s*[\w\.]*(price|buy_price|buyPrice|cost)\b',l) and 'function lineTotal' not in l and 'function sale' not in l and 'function purch' not in l and 'function inv' not in l and 'function saleCost' not in l and not l.strip().startswith('//'):
        raw.append((i+1,l.strip()[:110]))
print(' ',len(raw),'سطر فيه qty*price خام'); [print('   ',*r) for r in raw[:12]]
head('٥) أنماط حسابية لسه مكررة ٣+ مرات')
c=collections.defaultdict(list)
for i,l in enumerate(L):
    t=re.sub(r'\s+','',l)
    if len(t)<60 or t.startswith('//') or 'style=' in l or 'class="' in l: continue
    t=re.sub(r"'[^']*'|\"[^\"]*\"",'S',t)
    if re.search(r'\b(reduce)\(function',t): c[t].append(i+1)
d=sorted([(len(v),v[:4],k[:90]) for k,v in c.items() if len(v)>=3],reverse=True)
print(' ',len(d),'نمط'); [print('   ',*x) for x in d[:8]]
print('\nالنتيجة:', '✅ نظيف' if not bad and not miss else '⚠️ فيه ملاحظات'); sys.exit(1 if bad or miss else 0)
