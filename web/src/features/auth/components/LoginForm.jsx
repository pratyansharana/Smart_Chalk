import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Loader2, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ReusableInput } from '../../../components/forms/ReusableInput';
import { firebaseReady } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { getUserProfile } from '../../../services/firebase/usersService';
import { getDefaultRouteForRole } from '../../../utils/authRedirects';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export function LoginForm() {
  const navigate = useNavigate();
  const { login, checkGoogleUserProfile, completeGoogleSignup } = useAuth();
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleUserPending, setGoogleUserPending] = useState(null);
  const [roleSelectOpen, setRoleSelectOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values) {
    setFormError('');
    setSuccess('');
    try {
      const user = await login(values.email, values.password);
      const profile = await getUserProfile(user.uid);
      setSuccess('Signed in. Redirecting to your workspace...');
      navigate(getDefaultRouteForRole(profile?.role), { replace: true });
    } catch (error) {
      setFormError(error.message);
    }
  }

  async function handleGoogleLogin() {
    setFormError('');
    setSuccess('');
    setGoogleLoading(true);
    try {
      const { user, existingProfile } = await checkGoogleUserProfile();
      if (!existingProfile) {
        setGoogleUserPending(user);
        setRoleSelectOpen(true);
      } else {
        setSuccess('Signed in with Google. Redirecting...');
        navigate(getDefaultRouteForRole(existingProfile.role), { replace: true });
      }
    } catch (error) {
      setFormError(error.message);
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleRoleConfirm(selectedRole) {
    if (!googleUserPending) return;
    setGoogleLoading(true);
    setRoleSelectOpen(false);
    try {
      await completeGoogleSignup(googleUserPending, selectedRole);
      setSuccess('Account created successfully. Redirecting...');
      navigate(getDefaultRouteForRole(selectedRole), { replace: true });
    } catch (error) {
      setFormError(error.message);
    } finally {
      setGoogleLoading(false);
      setGoogleUserPending(null);
    }
  }

  if (roleSelectOpen) {
    return (
      <div className="glass-card grid gap-5 p-6 text-center">
        <h3 className="font-heading text-lg font-bold text-white">Choose Account Type</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          This is your first time logging in with Google. Please select whether you are a Student or a Teacher to configure your SmartChalk workspace.
        </p>
        <div className="grid gap-3 mt-2">
          <button
            className="apex-button-primary w-full py-2.5"
            onClick={() => handleRoleConfirm('student')}
            type="button"
          >
            I am a Student
          </button>
          <button
            className="apex-button-secondary w-full py-2.5 border-purple-500/20 text-purple-300 hover:bg-purple-500/10"
            onClick={() => handleRoleConfirm('teacher')}
            type="button"
          >
            I am a Teacher
          </button>
        </div>
        <button
          className="text-xs text-slate-500 hover:text-slate-300 mt-2 underline"
          onClick={() => {
            setRoleSelectOpen(false);
            setGoogleUserPending(null);
          }}
          type="button"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <form className="glass-card grid gap-5 p-6" onSubmit={handleSubmit(onSubmit)}>
      {!firebaseReady && (
        <div className="flex gap-3 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-3 text-sm text-amber-100">
          <AlertCircle className="mt-0.5 shrink-0 text-amber-400" size={18} />
          Add Firebase environment values before using live authentication.
        </div>
      )}
      <button
        aria-label="Continue with Google"
        className="apex-button-secondary w-full"
        disabled={isSubmitting || googleLoading || !firebaseReady}
        onClick={handleGoogleLogin}
        type="button"
      >
        {googleLoading ? <Loader2 className="animate-spin" size={18} /> : <GoogleMark />}
        Continue with Google
      </button>
      <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        <span className="h-px flex-1 bg-white/10" />
        or use email
        <span className="h-px flex-1 bg-white/10" />
      </div>
      <ReusableInput label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <ReusableInput
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {formError && <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{formError}</p>}
      {success && <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">{success}</p>}
      <button className="apex-button-primary" disabled={isSubmitting || !firebaseReady} type="submit">
        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} />}
        Login
      </button>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="size-4" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}
