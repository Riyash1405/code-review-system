import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import db from './db';

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '',
      scope: ['user:email', 'repo', 'read:org']
    },
    async (accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        let user = await db.user.findUnique({
          where: { githubId: String(profile.id) },
        });

        if (user) {
          user = await db.user.update({
            where: { id: user.id },
            data: {
              accessToken,     // updating the token
              username: profile.username || profile.displayName || '',
              avatarUrl: profile._json?.avatar_url || null,
            },
          });
        } else {
          user = await db.user.create({
            data: {
              githubId: String(profile.id),
              username: profile.username || profile.displayName || '',
              avatarUrl: profile._json?.avatar_url || null,
              accessToken,
            },
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
