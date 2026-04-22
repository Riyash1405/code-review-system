import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import db from './db';

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackURL: process.env.GITHUB_CALLBACK_URL || '',
      scope: ['user:email', 'repo', 'read:org'],
      passReqToCallback: true,
    },
    async (req: any, accessToken: string, refreshToken: string, profile: any, done: Function) => {
      try {
        const githubId = String(profile.id);
        const username = profile.username || profile.displayName || '';
        const avatarUrl = profile._json?.avatar_url || null;
        const email = profile.emails?.[0]?.value || `${username}@github.local`;

        // Check if this GitHub account is already linked
        let ghAccount = await db.gitHubAccount.findUnique({
          where: { githubId },
          include: { user: true }
        });

        if (ghAccount) {
          // Update the token
          ghAccount = await db.gitHubAccount.update({
            where: { id: ghAccount.id },
            data: { accessToken, username, avatarUrl },
            include: { user: true }
          });
          return done(null, { ...ghAccount.user, _ghAccountId: ghAccount.id });
        }

        // Check if the currently logged-in user is linking a new account
        const linkingUserId = req.session?.linkingUserId;

        if (linkingUserId) {
          // Linking mode: add this GitHub account to existing user
          const newAccount = await db.gitHubAccount.create({
            data: {
              userId: linkingUserId,
              githubId,
              username,
              avatarUrl,
              accessToken,
              isPrimary: false,
            },
            include: { user: true }
          });
          // Clear the linking flag
          delete req.session.linkingUserId;
          return done(null, { ...newAccount.user, _ghAccountId: newAccount.id });
        }

        // First-time GitHub quick-start: create User + GitHubAccount in one go
        const user = await db.user.create({
          data: {
            email,
            displayName: username,
            avatarUrl,
            githubAccounts: {
              create: {
                githubId,
                username,
                avatarUrl,
                accessToken,
                isPrimary: true,
              }
            }
          },
          include: { githubAccounts: true }
        });

        return done(null, { ...user, _ghAccountId: user.githubAccounts[0]?.id });
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
