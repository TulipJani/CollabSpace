const passport=require('passport');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const GOOGLE_CLIENT_ID='22969257365-afucoeoo72keso4glrcaa04cqr1gu92p.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET='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';
passport.use(new GoogleStrategy({
    clientID:     GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "https://collab-space.vercel.app/google/callback/",
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

