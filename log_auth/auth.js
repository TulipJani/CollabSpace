const passport=require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const GOOGLE_CLIENT_ID='22969257365-5m9d29n65ot918nvj90q5er2m0ku9e72.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET='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';
passport.use(new GoogleStrategy({
    clientID:GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://collab-space.vercel.app/google/callback",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
   return done(null,profile);
  }
));
passport.serializeUser(function(user,done){
    done(null,user);
});
passport.deserializeUser(function(user,done){
    done(null,user);
})

