// The old client had a separate "JWT" login that kept the token in browser
// storage. The token now lives only in the httpOnly session cookie, so there is
// one sign-in flow: this route renders the same page.
export { default } from './login_with_session';
