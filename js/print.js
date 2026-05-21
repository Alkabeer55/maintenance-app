// ===== PRINT INVOICE =====
function printInvoice(id){
  var s=DB.sales.find(function(x){return x.id===id;});if(!s)return;
  var w=window.open('','_blank','width=420,height=650');
  var rows=s.items.map(function(i){
    return '<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">'+esc(i.name)+'</td>'+
      '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">'+i.qty+'</td>'+
      '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">'+i.price+' ج</td>'+
      '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">'+(i.qty*i.price)+' ج</td></tr>';
  }).join('');
  var srvRows=s.services&&s.services.length?s.services.map(function(sv){
    return '<tr style="background:#fff7ed"><td colspan="3" style="padding:6px 8px;border-bottom:1px solid #eee">🔧 '+esc(sv.name)+'</td>'+
      '<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:left">'+sv.price+' ج</td></tr>';
  }).join(''):'';
  var shopName=LS.get('mc8_shop_name','مركز الصيانة');
  w.document.write(
    '<html dir="rtl"><head><meta charset="UTF-8"><title>فاتورة</title>'+
    '<style>body{font-family:Tahoma,sans-serif;padding:20px;max-width:400px;margin:0 auto;font-size:14px}'+
    'h2{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px}'+
    'table{width:100%;border-collapse:collapse}th{background:#f1f5f9;padding:7px 8px;text-align:right;font-size:13px}'+
    '.info-row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:13px}'+
    '@media print{button{display:none}}</style></head><body>'+
    '<h2>'+esc(shopName)+'</h2>'+
    '<div class="info-row"><span><b>العميل:</b></span><span>'+esc(s.customer)+'</span></div>'+
    '<div class="info-row"><span><b>التاريخ:</b></span><span>'+esc(s.date)+'</span></div>'+
    (s.serial?'<div class="info-row"><span><b>السيريال:</b></span><span>'+esc(s.serial)+'</span></div>':'')+
    (s.model?'<div class="info-row"><span><b>الموديل:</b></span><span>'+esc(s.model)+'</span></div>':'')+
    (s.counter?'<div class="info-row"><span><b>العداد:</b></span><span>'+esc(s.counter)+(s.colorCounter?' | ألوان: '+esc(s.colorCounter):'')+'</span></div>':'')+
    '<br>'+
    (rows||srvRows?
      '<table><thead><tr><th>البند</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>'+
      '<tbody>'+rows+srvRows+'</tbody></table>':'')+'<hr>'+
    '<div class="info-row" style="font-size:16px;font-weight:900"><span>الإجمالي</span><span>'+s.total+' ج</span></div>'+
    '<div class="info-row"><span>المدفوع</span><span style="color:green">'+( s.paid||0)+' ج</span></div>'+
    ((s.total-(s.paid||0))>0?'<div class="info-row"><span>المتبقي</span><span style="color:red">'+(s.total-(s.paid||0))+' ج</span></div>':'')+
    (s.note?'<div style="margin-top:10px;padding:8px;background:#f8fafc;border-radius:8px;font-size:12px"><b>ملاحظة:</b> '+esc(s.note)+'</div>':'')+
    '<br><button onclick="window.print()" style="width:100%;padding:12px;background:#0f172a;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer;font-family:Tahoma">🖨️ طباعة</button>'+
    '</body></html>'
  );
  w.document.close();
}
