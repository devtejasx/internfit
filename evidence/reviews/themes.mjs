import fs from 'fs';
const play=JSON.parse(fs.readFileSync('play_reviews.json')).map(r=>({...r,src:'play'}));
const ios=JSON.parse(fs.readFileSync('ios_reviews.json')).map(r=>({...r,text:(r.title+'. '+r.text),src:'ios'}));
const all=[...play,...ios].filter(r=>r.text);
const T={
 fake_irrelevant_listings:/\b(fake|scam|fraud|spam|not genuine|irrelevant|no response|never (got|get|heard)|no reply|ghost|no call|not (getting|got|get) (any )?(call|response|reply|interview|selected)|didn'?t get (any )?(response|call|reply)|no one (responds|replied|reply))/i,
 paywall_premium:/\b(premium|paid|pay|payment|money|subscription|refund|charge|rs\.?|₹|rupee|fees?|cost|price|free trial)\b/i,
 notifications:/\bnotification|spam(ming)? notif|too many (messages|notifs)/i,
 login_otp_onboarding:/\b(otp|login|log in|sign ?up|signin|sign in|register|verification|verify|account (deleted|blocked|delete))/i,
 bugs_crash:/\b(crash|bug|lag|slow|not (opening|working|loading)|hang|stuck|glitch|error|freez)/i,
 resume_profile:/\b(resume|cv|profile|portfolio)\b/i,
 interview_prep:/\binterview/i,
 skills_certificate:/\b(certificat|skill|test|assessment|quiz|course)/i,
 internship_job_finding:/\b(internship|intern|job|opportunit|placement|hiring)/i,
 apply_application:/\b(appl(y|ied|ication)|shortlist|selected|rejected)/i,
};
const now=new Date('2026-10-25');
const res={};
for(const [k,re] of Object.entries(T)){
 const m=all.filter(r=>re.test(r.text));
 const neg=m.filter(r=>r.score<=2), recent=m.filter(r=>(now-new Date(r.date))/864e5<=730), recentNeg=recent.filter(r=>r.score<=2);
 res[k]={all:m.length,neg:neg.length,recent2y:recent.length,recent2yNeg:recentNeg.length};
}
console.table(res);
const recent=all.filter(r=>(now-new Date(r.date))/864e5<=730);
console.log('total',all.length,'neg',all.filter(r=>r.score<=2).length,'recent2y',recent.length,'recent2yNeg',recent.filter(r=>r.score<=2).length);
const byYear={};for(const r of all){const y=new Date(r.date).getFullYear();byYear[y]=byYear[y]||{n:0,neg:0};byYear[y].n++;if(r.score<=2)byYear[y].neg++}console.log(JSON.stringify(byYear));
fs.writeFileSync('all.json',JSON.stringify(all));
