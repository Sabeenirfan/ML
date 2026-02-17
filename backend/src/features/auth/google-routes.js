const express = require('express');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');

const router = express.Router();

const googleAudiences = (process.env.GOOGLE_CLIENT_ID || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

if (!googleAudiences.length) {
  console.warn('Google authentication is not fully configured. Set GOOGLE_CLIENT_ID with your OAuth client IDs.');
}

// Initialize OAuth2Client with the client ID for verification
const googleClient = new OAuth2Client(googleAudiences[0] || undefined);

router.post('/', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;

    console.log('[Google Auth] Received request with idToken:', idToken ? 'present' : 'missing', 'accessToken:', accessToken ? 'present' : 'missing');

    if (!idToken && !accessToken) {
      console.error('[Google Auth] Neither idToken nor accessToken provided');
      return res.status(400).json({ message: 'Google token is required' });
    }

    let payload;

    if (idToken) {
      // Handle idToken (traditional flow)
      console.log('[Google Auth] Using idToken flow...');
      console.log('[Google Auth] Verifying idToken with Google...');
      console.log('[Google Auth] Using audiences:', googleAudiences);

      // Add a timeout wrapper for the verification
      const verifyPromise = (async () => {
        try {
          console.log('[Google Auth] Calling verifyIdToken...');
          const ticket = await googleClient.verifyIdToken({
            idToken,
            audience: googleAudiences.length ? googleAudiences : undefined,
          });
          console.log('[Google Auth] verifyIdToken completed');
          return ticket;
        } catch (verifyError) {
          console.error('[Google Auth] verifyIdToken error:', verifyError.message);
          throw verifyError;
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => {
          console.error('[Google Auth] Verification timed out after 10 seconds');
          reject(new Error('Google token verification timed out'));
        }, 10000)
      );

      const ticket = await Promise.race([verifyPromise, timeoutPromise]);
      payload = ticket.getPayload();

      if (!payload) {
        console.error('[Google Auth] Invalid payload from Google');
        return res.status(401).json({ message: 'Invalid Google token' });
      }
    } else {
      // Handle accessToken (web flow)
      console.log('[Google Auth] Using accessToken flow...');
      try {
        console.log('[Google Auth] Fetching user info from Google with accessToken...');
        const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!response.ok) {
          throw new Error(`Google API returned ${response.status}`);
        }

        const userInfo = await response.json();
        console.log('[Google Auth] Got user info from Google:', {
          email: userInfo.email,
          name: userInfo.name,
          id: userInfo.id
        });

        payload = {
          sub: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
          picture: userInfo.picture
        };
      } catch (fetchError) {
        console.error('[Google Auth] Failed to fetch user info:', fetchError.message);
        return res.status(401).json({ message: 'Failed to verify Google token' });
      }
    }

    if (!payload) {
      console.error('[Google Auth] Invalid payload from Google');
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    console.log('[Google Auth] Token verified, payload:', {
      email: payload.email,
      name: payload.name,
      sub: payload.sub
    });

    const {
      sub: googleId,
      email,
      name,
      given_name: givenName,
      family_name: familyName,
      picture,
    } = payload;

    if (!email) {
      return res.status(400).json({ message: 'Google account must include an email address' });
    }

    const normalizedEmail = email.toLowerCase();
    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Check if user was previously deleted
      const deletedUser = await User.findOne({ email: normalizedEmail, isDeleted: true });
      if (deletedUser) {
        return res.status(400).json({
          message: 'This email was previously registered and cannot be used again'
        });
      }

      user = await User.create({
        name: name || `${givenName || ''} ${familyName || ''}`.trim() || normalizedEmail,
        email: normalizedEmail,
        googleId,
        profilePicture: picture,
      });
    } else {
      // Check if user is deleted
      if (user.isDeleted) {
        return res.status(400).json({
          message: 'This account has been deleted and cannot be accessed'
        });
      }

      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (picture && user.profilePicture !== picture) {
        user.profilePicture = picture;
      }
      if (!user.name && name) {
        user.name = name;
      }
      await user.save();
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('[Google Auth] Authentication successful for user:', user.email);
    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        isAdmin: user.isAdmin || false,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('[Google Auth] Authentication failed:', error.message, error.stack);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

module.exports = router;
