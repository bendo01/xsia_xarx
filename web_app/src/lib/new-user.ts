// Rules for an account created by the administrator (pure; the form and the server share them).
import { isUuid } from './validation';

export type NewUserError = 'required' | 'invalid' | 'tooShort' | 'tooLong';

export interface NewUser {
  name: string;
  email: string;
  password: string;
  individual_id: string;
  is_active: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** The API accepts six characters; accounts made by hand need a few more. */
export const MIN_PASSWORD = 8;

export type NewUserParse = { ok: true; user: NewUser } | { ok: false; errors: Record<string, NewUserError> };

export function parseNewUser(input: Record<string, unknown>): NewUserParse {
  const errors: Record<string, NewUserError> = {};
  const text = (k: string) => (typeof input[k] === 'string' ? (input[k] as string).trim() : '');
  const name = text('name');
  const email = text('email').toLowerCase();
  const password = typeof input.password === 'string' ? input.password : '';
  const individual = text('individual_id');

  if (!name) errors.name = 'required';
  else if (name.length > 200) errors.name = 'tooLong';
  if (!email) errors.email = 'required';
  else if (email.length > 254 || !EMAIL.test(email)) errors.email = 'invalid';
  if (!password) errors.password = 'required';
  else if (password.length < MIN_PASSWORD) errors.password = 'tooShort';
  else if (password.length > 128) errors.password = 'tooLong';
  if (!individual) errors.individual_id = 'required';
  else if (!isUuid(individual)) errors.individual_id = 'invalid';

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, user: { name, email, password, individual_id: individual, is_active: input.is_active === true || input.is_active === 'true' } };
}
