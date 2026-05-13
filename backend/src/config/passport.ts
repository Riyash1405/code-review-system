import passport from 'passport';
import { Strategy as GitHubStrategy, Profile } from 'passport-github2';
import { env } from './env.js';
import db from './db.js';
import { logger } from '../utils/logger.js';
import { encrypt } from '../utils/crypto.js';

passport.use(
  new GitHubStrategy(
    {
      clientID: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
      callbackURL: env.GITHUB_CALLBACK_URL,
      scope: ['user:email', 'repo', 'read:org'],
      passReqToCallback: true,
    },
    async (
      req: Express.Request,
      accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: (err: Error | null, user?: Express.User | null) => void,
    ) => {
      try {
        const githubId = String(profile.id);
        const username = profile.username || profile.displayName || '';
        const avatarUrl = (profile as unknown as Record<string, unknown>)._json
          ? ((profile as unknown as Record<string, unknown>)._json as Record<string, string>)?.avatar_url ?? null
          : null;
        const email =
          profile.emails?.[0]?.value || `${username}@github.local`;

        // Check if this GitHub account is already linked
        let ghAccount = await db.gitHubAccount.findUnique({
          where: { githubId },
          include: { user: true },
        });

        if (ghAccount) {
          // Update the token (encrypted)
          ghAccount = await db.gitHubAccount.update({
            where: { id: ghAccount.id },
            data: { accessToken: encrypt(accessToken), username, avatarUrl },
            include: { user: true },
          });
          return done(null, { ...ghAccount.user, _ghAccountId: ghAccount.id } as unknown as Express.User);
        }

        // Check if the currently logged-in user is linking a new account
        const linkingUserId = (req as unknown as { session?: { linkingUserId?: string } }).session?.linkingUserId;

        if (linkingUserId) {
          // Linking mode: add this GitHub account to existing user
          const newAccount = await db.gitHubAccount.create({
            data: {
              userId: linkingUserId,
              githubId,
              username,
              avatarUrl,
              accessToken: encrypt(accessToken),
              isPrimary: false,
            },
            include: { user: true },
          });
          // Clear the linking flag
          const session = (req as unknown as { session?: { linkingUserId?: string } }).session;
          if (session) delete session.linkingUserId;
          return done(null, { ...newAccount.user, _ghAccountId: newAccount.id } as unknown as Express.User);
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
                accessToken: encrypt(accessToken),
                isPrimary: true,
              },
            },
          },
          include: { githubAccounts: true },
        });

        return done(null, { ...user, _ghAccountId: user.githubAccounts[0]?.id } as unknown as Express.User);
      } catch (err) {
        logger.error({ err }, 'GitHub OAuth strategy error');
        return done(err as Error, null);
      }
    },
  ),
);

export default passport;
