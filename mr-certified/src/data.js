export const PRODUCTS =[
 {id:1,seller:'Urban Kicks Kenya',rating:4.8,orders:127,delivery:96,repeat:42,city:'Nairobi',name:'Nike Air Force 1',colors:['White'],price:3500,cat:'Shoes',g:['#3a4a3f','#1c241f'],sizes:[39,40,41,42,43],profit:14200,desc:'Classic white low-top, true to size, comes with box.'},
 {id:2,seller:'Urban Kicks Kenya',rating:4.8,orders:127,delivery:96,repeat:42,city:'Nairobi',name:'Adidas Superstar',colors:['White','Black'],price:4200,cat:'Shoes',g:['#2d3550','#171b2b'],sizes:[38,39,40,41,42],profit:9800,desc:'Shell-toe icon, black stripes, unisex fit.'},
 {id:3,seller:'Maré Streetwear',rating:4.6,orders:64,delivery:91,repeat:30,city:'Mombasa',name:'Oversized Hoodie',colors:['Black','Grey'],price:2800,cat:'Men',g:['#4a3320','#241a10'],sizes:['S','M','L','XL'],profit:11100,desc:'Heavyweight cotton fleece, boxy fit, brushed interior.'},
 {id:4,seller:'Amara Beauty',rating:4.9,orders:203,delivery:98,repeat:55,city:'Nairobi',name:'Shea Glow Set',colors:['Natural'],price:1600,cat:'Beauty',g:['#5a2e3d','#2a1520'],sizes:['1 set'],profit:6400,desc:'Whipped shea body butter + lip balm, handmade weekly batches.'},
 {id:5,seller:'Urban Kicks Kenya',rating:4.8,orders:127,delivery:96,repeat:42,city:'Nairobi',name:'Vans Old Skool',colors:['Black','White'],price:3800,cat:'Shoes',g:['#1f3a45','#0f1c22'],sizes:[38,39,40,41,42,43],profit:12700,desc:'Signature side stripe, canvas + suede, everyday wear.'},
 {id:6,seller:'Zuri Kids Closet',rating:4.7,orders:88,delivery:94,repeat:38,city:'Kisumu',name:'Kids Denim Jacket',colors:['Blue'],price:2200,cat:'Kids',g:['#33475a','#17222c'],sizes:['2-3y','4-5y','6-7y'],profit:5300,desc:'Durable denim, soft lining, easy machine wash.'},
];
export const DASH ={sales:86400,expenses:31200,profit:55200,orders:27,customers:83,bars:[40,55,35,70,50,90,60]};
export const AI_PRESETS ={
 'profit':`Nike Air Force 1 made the most profit this month — KSh ${PRODUCTS[0].profit.toLocaleString()} from ${PRODUCTS[0].orders} sales. Vans Old Skool is close behind at KSh ${PRODUCTS[4].profit.toLocaleString()}.`,
 'sales falling':"Your sales dipped slightly this week. Views on your posts are steady, but conversion is down — try adding a styling video to your top product.",
 'advertise':'Advertise Vans Old Skool next — high margin and rising search interest for "size 41 sneakers" in Nairobi.',
 'stock':"Rule of thumb: reorder when a size drops below 3 pairs. Track fast movers weekly so you never sell what you don't have.",
 'target':"To hit KSh 50,000 profit, at your average margin you'd need about 18 more Air Force 1 sales, or a mix across your top 3 products."
};
export const money =n=>'KSh '+n.toLocaleString();
export const initials =s=>s.split(' ').map(w=>w[0]).slice(0,2).join('');
export const THEMES =[{n:'Gold',c:'#E7B84E'},{n:'Green',c:'#2FBF71'},{n:'Coral',c:'#E8615A'},{n:'Sky',c:'#4EA8E7'},{n:'Violet',c:'#9B7EE8'}];
export const BUYER_STAT ={rating:4.6,badRatings:2};
export const INIT_TX =[
 {id:1,type:'sale',channel:'online',amount:3500,note:'Nike Air Force 1 — order #1042',date:'Sep 22'},
 {id:2,type:'sale',channel:'offline',amount:4200,note:'Adidas Superstar — walk-in',date:'Sep 21'},
 {id:3,type:'expense',channel:'offline',amount:1800,note:'Restock — Vans supplier',date:'Sep 20'},
 {id:4,type:'sale',channel:'online',amount:3800,note:'Vans Old Skool — order #1039',date:'Sep 19'},
 {id:5,type:'expense',channel:'online',amount:900,note:'Delivery & courier fees',date:'Sep 18'},
];
export const ORDER_STAGES =['Placed','Packed','Shipped','Out for delivery','Delivered'];
export const ORDERS =[
 {id:1,name:'Nike Air Force 1',seller:'Urban Kicks Kenya',stage:4},
 {id:2,name:'Shea Glow Set',seller:'Amara Beauty',stage:2},
];
