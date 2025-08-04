const admin = require('firebase-admin');
async function authenticate(req,res,next){
  try{
    const [,token]=(req.headers.authorization||'').split(' ');
    if(!token) return res.status(401).json({error:'Missing bearer token'});
    req.user = await admin.auth().verifyIdToken(token, true);
    next();
  }catch{ res.status(401).json({error:'Invalid/expired token'}); }
}
function requireAdmin(req,res,next){
  return req.user?.admin === true ? next() : res.status(403).json({error:'Admin only'});
}
module.exports = { authenticate, requireAdmin };
