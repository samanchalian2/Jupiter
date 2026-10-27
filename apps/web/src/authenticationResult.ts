import type { Session } from './App';

export type PasswordChangeChallenge={passwordChangeRequired:true;passwordChangeToken:string;expiresAt:string};
export function isPasswordChangeChallenge(value:unknown):value is PasswordChangeChallenge {
  if(!value||typeof value!=='object')return false;
  const result=value as Partial<PasswordChangeChallenge>;
  return result.passwordChangeRequired===true&&typeof result.passwordChangeToken==='string'&&typeof result.expiresAt==='string';
}
export function isSessionResponse(value:unknown):value is Session {
  if(!value||typeof value!=='object'||isPasswordChangeChallenge(value))return false;
  const session=value as Partial<Session>;
  return typeof session.accessToken==='string'&&Boolean(session.user)&&typeof session.user?.displayName==='string'&&Array.isArray(session.user.memberships);
}

export function canApplyRefreshedSession(owner:Session|null,current:Session|null,next:Session) {
  if(current?.accessToken!==owner?.accessToken)return false;
  if(!owner)return true;
  return owner.user.id ? next.user.id===owner.user.id : Boolean(owner.user.email)&&next.user.email===owner.user.email;
}
