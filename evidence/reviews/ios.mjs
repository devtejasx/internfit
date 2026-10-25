import fs from 'fs';
let out=[];
for(let p=1;p<=10;p++){try{const j=JSON.parse(fs.readFileSync(`ios_${p}.json`));const e=j.feed.entry||[];for(const x of (Array.isArray(e)?e:[e])){if(!x['im:rating'])continue;out.push({id:x.id.label,date:x.updated.label,score:+x['im:rating'].label,title:x.title.label,text:x.content.label,version:x['im:version'].label})}}catch(err){}}
fs.writeFileSync('ios_reviews.json',JSON.stringify(out,null,1));console.log('ios',out.length,out.at(-1)?.date,'->',out[0]?.date);
