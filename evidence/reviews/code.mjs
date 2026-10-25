import fs from 'fs';
const all=JSON.parse(fs.readFileSync('all.json'));const now=new Date('2026-10-25');
const C={
 A_payment_trust:/(\bpa(y|id|yment)\b|₹|\brs\.?\s?\d|\d+\s?(rs|rupees?)\b|rupee|refund|auto ?pay|mandate|mendate|deduct|charg|subscri|premium|\bpro\b|money|paise|pese)/i,
 B_no_response:/(no response|not? (got|get|getting) any (call|response|reply)|didn'?t (get|even get) (any |the )?(call|response|reply)|none of|didn'?t even (see|saw)|no update|not .*viewed|selected by none|no one (select|respond)|no response from (the )?(recruiter|compan)|not even (a )?single (people )?select|recruiter.*(not|n't)|applied (for|to) (\d+|many|nearly|more than))/i,
 C_irrelevant_listings:/(no (real )?(job|opening|internship|opportunit)|not (even )?(one|a single) job|less job|few jobs|very (less|limited) job|limited job|(ir)?relevant|outdated|not available|my (domain|field|city|location|skills|profession)|only (sales|marketing|for big)|sales only|filter|no .*(pharma|medical|hospitality|hotel|automobile|photograph|data analyst)|data analyst|no new job|last job post|rarely shows|no option (for|of) finding|in my city|location)/i,
 D_resume_upload:/(resume|\bcv\b)/i,
 E_fake_reviews_influencer:/(fake review|reviews (are|seem|here are) fake|reviews are from|influencer|interns? .*promot|promot.*intern|to take reviews|5 star reviews)/i,
 F_login_app_open:/(otp|sign ?in|sign ?up|log ?in|not open|nahi hai|khulta|create my account|country code)/i,
};
const win=r=>(now-new Date(r.date))/864e5<=730;
const neg=all.filter(r=>r.score<=2&&win(r)), recentAll=all.filter(win);
const out={};
for(const [k,re] of Object.entries(C)){
 const m=neg.filter(r=>re.test(r.text));
 out[k]={neg2y:m.length,share:(100*m.length/neg.length).toFixed(0)+'%',play:m.filter(r=>r.src=='play').length,ios:m.filter(r=>r.src=='ios').length,last12m:m.filter(r=>(now-new Date(r.date))/864e5<=365).length};
}
console.log('neg 2y',neg.length,'of',recentAll.length,'reviews in window; positive(4-5)',recentAll.filter(r=>r.score>=4).length);
console.table(out);
// also positive mentions of application-prep needs across all ratings in 2y
const want=/(resume|interview|apply|application|skill gap|ats|cover letter|prepare)/i;
console.log('2y reviews mentioning resume/interview/apply/ATS (any rating):',recentAll.filter(r=>want.test(r.text)).length);
fs.writeFileSync('coded_neg_2y.json',JSON.stringify(neg.map(r=>({...r,codes:Object.entries(C).filter(([k,re])=>re.test(r.text)).map(([k])=>k)})),null,1));
// csv of all coded negatives
const esc=s=>'"'+String(s).replace(/"/g,'""').replace(/\s+/g,' ')+'"';
fs.writeFileSync('coded_neg_2y.csv','source,date,stars,codes,text\n'+neg.map(r=>[r.src,r.date.slice(0,10),r.score,Object.entries(C).filter(([k,re])=>re.test(r.text)).map(([k])=>k).join('|'),esc(r.text)].join(',')).join('\n'));
