const passport=require('passport');
const GitHubStrategy = require( 'passport-github2' ).Strategy;
passport.use(new GitHubStrategy({
    clientID: "Ov23liVD8eepKqeCzYuM",
    clientSecret: "2fa5ffa4445ad25deb171274f371d680329bff7b",
    callbackURL: "https://collab-space.vercel.app/github/callback/",
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