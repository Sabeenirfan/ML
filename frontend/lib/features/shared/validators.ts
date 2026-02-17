export const gmailRegex = /^[\w.+-]+@gmail\.com$/i;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const isValidGmail = (email: string) => gmailRegex.test(email.trim());

export const isStrongPassword = (password: string) => passwordRegex.test(password);

export const isNonEmpty = (value: string) => value.trim().length > 0;
