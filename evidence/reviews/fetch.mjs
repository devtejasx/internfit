import gplay from 'google-play-scraper';
import fs from 'fs';
const appId='com.eventbeep.android';
const app = await gplay.app({appId, lang:'en', country:'in'});
fs.writeFileSync('play_app.json', JSON.stringify(app,null,1));
console.log(app.title, '|', app.developer, '|', app.score, '|', app.ratings, 'ratings |', app.reviews,'reviews |', app.installs, '| updated', new Date(app.updated).toISOString(), '| hist', JSON.stringify(app.histogram));
let all=[]; let token;
for (const sort of [gplay.sort.NEWEST]) {
  token=undefined;
  for (let i=0;i<30;i++){
    const r = await gplay.reviews({appId, lang:'en', country:'in', sort, num:150, paginate:true, nextPaginationToken:token});
    all.push(...r.data); token=r.nextPaginationToken; if(!token) break;
  }
}
const seen=new Map(); for(const r of all) seen.set(r.id,r);
const rev=[...seen.values()].map(r=>({id:r.id,date:r.date,score:r.score,text:r.text,thumbs:r.thumbsUp,version:r.version,reply:!!r.replyText}));
fs.writeFileSync('play_reviews.json', JSON.stringify(rev,null,1));
console.log('reviews', rev.length, 'range', rev.at(-1)?.date, '->', rev[0]?.date);
