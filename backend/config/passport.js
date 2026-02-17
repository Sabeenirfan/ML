const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/User");

// Configure the Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by Google ID
        let user = await User.findOne({ googleId: profile.id });

        // If not found by Google ID, check by email
        if (!user) {
          const email = profile.emails?.[0]?.value;
          user = await User.findOne({ email });

          if (user) {
            // Link existing user with Google account
            user.googleId = profile.id;
            user.profilePicture = profile.photos?.[0]?.value;
            await user.save();
          } else {
            // Create a new user
            user = await User.create({
              googleId: profile.id,
              name: profile.displayName,
              email,
              profilePicture: profile.photos?.[0]?.value,
            });
          }
        }

        // Return user object (Passport handles req.user)
        return done(null, user);
      } catch (error) {
        console.error("Google OAuth error:", error);
        return done(error, null);
      }
    }
  )
);

// For serverless APIs, export a function that ensures strategy is registered
module.exports = passport;
