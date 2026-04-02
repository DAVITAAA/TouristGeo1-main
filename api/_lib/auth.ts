// Simple Token Helper (matching the existing server.ts implementation)
export const createToken = (user: any) => {
  const payload = Buffer.from(
    JSON.stringify({ id: user.id, email: user.email, exp: Date.now() + 86400000 })
  ).toString('base64');
  return payload;
};

export const verifyToken = (token: string) => {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
};

export const getPayloadFromRequest = (authHeader: string | undefined) => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
};
