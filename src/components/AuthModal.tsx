import React, { useState, useRef, useCallback } from 'react';
import { translations, Language } from '../translations';
import { User, loginUser, googleLogin, initiateRegistration, completeRegistration, setToken, initiateGuestPasswordReset, verifyGuestPasswordResetCode, completeGuestPasswordReset } from '../api';

declare const google: any;

interface AuthModalProps {
    language: Language;
    onClose: () => void;
    onSuccess: (user: User) => void;
}

export default function AuthModal({ language, onClose, onSuccess }: AuthModalProps) {
    const t = translations[language];
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', company_name: '', phone: '', role: 'tourist' });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const [step, setStep] = useState<'form' | 'verify' | 'forgot_email' | 'forgot_verify' | 'forgot_new_password' | 'forgot_success'>('form');
    const [verificationCode, setVerificationCode] = useState('');

    const isPasswordValid = {
        length: formData.password.length >= 8,
        uppercase: /[A-Z]/.test(formData.password),
        number: /[0-9]/.test(formData.password),
    };
    const allPasswordValid = Object.values(isPasswordValid).every(Boolean);

    const handleTabSwitch = (login: boolean) => {
        setIsLogin(login);
        setStep('form');
        setError(null);
        setSuccess(null);
        setFormData({ name: '', email: '', password: '', company_name: '', phone: '', role: 'tourist' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 'verify') {
            await handleVerify();
            return;
        }
        if (step === 'forgot_email') {
            await handleForgotEmailSubmit(e);
            return;
        }
        if (step === 'forgot_verify') {
            await handleForgotVerify();
            return;
        }
        if (step === 'forgot_new_password') {
            await handleForgotNewPasswordSubmit(e);
            return;
        }

        if (!isLogin && !allPasswordValid) {
            setError(language === 'ka' ? 'გთხოვთ დააკმოყოფილოთ პაროლის ყველა მოთხოვნა' : 'Please complete all password requirements');
            return;
        }

        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (isLogin) {
                const result = await loginUser({
                    email: formData.email,
                    password: formData.password,
                });
                setToken(result.token);
                onSuccess(result.user);
            } else {
                const result = await initiateRegistration(formData);
                if (result.token) {
                    setToken(result.token, true);
                    onSuccess(result.user);
                } else {
                    setSuccess(language === 'ka' ? 'ვერიფიკაციის კოდი გამოგზავნილია!' : 'Verification code sent!');
                    setStep('verify');
                    setVerificationCode('');
                }
            }
        } catch (err: any) {
            let msg = err.message || t.auth_error;
            if (msg.includes('401')) msg = (t as any).login_failed || 'Invalid credentials';
            if (msg.includes('404')) msg = (t as any).user_not_found || 'User not found';
            if (msg.includes('failed to fetch') || msg.toLowerCase().includes('json')) {
                msg = (t as any).server_offline || 'Server is temporarily offline';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        if (verificationCode.length !== 4) {
            setError(language === 'ka' ? 'შეიყვანეთ 4-ნიშნა კოდი' : 'Enter 4-digit code');
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const result = await completeRegistration(formData.email, verificationCode);
            setToken(result.token, true);
            onSuccess(result.user);
        } catch (err: any) {
            setError(err.message || 'Verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await initiateGuestPasswordReset(formData.email);
            setSuccess(language === 'ka' ? 'ვერიფიკაციის კოდი გაიგზავნა' : 'Verification code sent');
            setStep('forgot_verify');
            setVerificationCode('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotVerify = async () => {
        if (verificationCode.length !== 4) return;
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await verifyGuestPasswordResetCode(formData.email, verificationCode);
            setSuccess(language === 'ka' ? 'ვერიფიკაცია წარმატებულია' : 'Identity verified');
            setStep('forgot_new_password');
            setFormData({ ...formData, password: '' });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allPasswordValid) {
            setError(language === 'ka' ? 'გთხოვთ დააკმოყოფილოთ პაროლის ყველა მოთხოვნა' : 'Please complete all password requirements');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await completeGuestPasswordReset(formData.email, verificationCode, formData.password);
            setSuccess(language === 'ka' ? 'პაროლი წარმატებით შეიცვალა' : 'Password changed successfully');
            setStep('forgot_success');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const googleBtnRef = useRef<HTMLDivElement>(null);

    const handleGoogleCallback = useCallback(async (response: { credential: string }) => {
        setLoading(true);
        setError(null);
        try {
            const result = await googleLogin(response.credential, formData.role);
            setToken(result.token, true);
            onSuccess(result.user);
        } catch (err: any) {
            setError(err.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    }, [onSuccess, formData.role]);

    React.useEffect(() => {
        const scriptId = 'google-gsi-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => initGoogleButton();
            document.head.appendChild(script);
        } else {
            initGoogleButton();
        }

        function initGoogleButton() {
            if (typeof google === 'undefined' || !googleBtnRef.current) return;
            googleBtnRef.current.innerHTML = '';
            google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                callback: handleGoogleCallback as any,
            });
            google.accounts.id.renderButton(googleBtnRef.current, {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                width: 300,
            });
        }
    }, [language, isLogin, handleGoogleCallback]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-surface-dark/60 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up max-h-[95vh] flex flex-col">
                {step === 'form' && (
                    <div className="flex border-b border-border-light relative">
                        <button className={`flex-1 py-4 font-bold text-sm transition-colors ${isLogin ? 'text-primary' : 'text-text-muted hover:text-text-main'}`} onClick={() => handleTabSwitch(true)}>{t.login}</button>
                        <button className={`flex-1 py-4 font-bold text-sm transition-colors ${!isLogin ? 'text-primary' : 'text-text-muted hover:text-text-main'}`} onClick={() => handleTabSwitch(false)}>{t.register}</button>
                        <div className="absolute bottom-0 left-0 w-1/2 h-0.5 bg-primary transition-transform duration-300 ease-out" style={{ transform: `translateX(${isLogin ? '0%' : '100%'})` }} />
                    </div>
                )}

                <div className="p-8 overflow-y-auto flex-1">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {step === 'verify' ? (
                            <div className="animate-fade-in space-y-4">
                                <div className="text-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-primary mb-2">mail</span>
                                    <h3 className="text-lg font-black text-text-main">{t.verification_code}</h3>
                                    <p className="text-xs font-bold text-text-muted">{language === 'ka' ? 'შეიყვანეთ 4-ნიშნა კოდი, რომელიც გაიგზავნა ელ-ფოსტაზე:' : 'Enter the 4-digit code sent to your email:'}</p>
                                    <p className="text-sm font-black text-primary mt-1">{formData.email}</p>
                                </div>
                                <input required type="text" maxLength={4} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-2xl font-black tracking-[1em] px-4 py-4 rounded-2xl border-2 border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-border-light" placeholder="0000" autoFocus />
                                <button type="button" onClick={() => setStep('form')} className="w-full text-xs font-bold text-text-muted hover:text-primary transition-colors text-center">{language === 'ka' ? 'ელ-ფოსტის შეცვლა' : 'Change Email'}</button>
                            </div>
                        ) : step === 'forgot_email' ? (
                            <div className="animate-fade-in space-y-4">
                                <div className="text-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-primary mb-2">lock_reset</span>
                                    <h3 className="text-lg font-black text-text-main">{language === 'ka' ? 'პაროლის აღდგენა' : 'Reset Password'}</h3>
                                    <p className="text-xs font-bold text-text-muted mt-1">{language === 'ka' ? 'შეიყვანეთ ელ-ფოსტა ვერიფიკაციისთვის' : 'Enter your email for verification'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1.5">{t.email}</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-text-main text-sm" placeholder="john@example.com" autoFocus />
                                </div>
                                <button type="button" onClick={() => setStep('form')} className="w-full text-xs font-bold text-text-muted hover:text-primary transition-colors text-center">{language === 'ka' ? 'უკან დაბრუნება' : 'Back to Login'}</button>
                            </div>
                        ) : step === 'forgot_verify' ? (
                            <div className="animate-fade-in space-y-4">
                                <div className="text-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-primary mb-2">mail</span>
                                    <h3 className="text-lg font-black text-text-main">{t.verification_code}</h3>
                                    <p className="text-xs font-bold text-text-muted">{language === 'ka' ? 'შეიყვანეთ 4-ნიშნა კოდი, რომელიც გაიგზავნა ელ-ფოსტაზე:' : 'Enter the 4-digit code sent to your email:'}</p>
                                    <p className="text-sm font-black text-primary mt-1">{formData.email}</p>
                                </div>
                                <input required type="text" maxLength={4} value={verificationCode} onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} className="w-full text-center text-2xl font-black tracking-[1em] px-4 py-4 rounded-2xl border-2 border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all placeholder:text-border-light" placeholder="0000" autoFocus />
                                <button type="button" onClick={handleForgotVerify} disabled={loading || verificationCode.length !== 4} className="w-full py-3.5 bg-primary text-primary-content font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2">
                                    {loading ? <div className="w-5 h-5 border-2 border-primary-content border-t-transparent rounded-full animate-spin" /> : (language === 'ka' ? 'დადასტურება' : 'Verify')}
                                </button>
                                <button type="button" onClick={() => setStep('forgot_email')} className="w-full text-xs font-bold text-text-muted hover:text-primary transition-colors text-center">{language === 'ka' ? 'ელ-ფოსტის შეცვლა' : 'Change Email'}</button>
                            </div>
                        ) : step === 'forgot_new_password' ? (
                            <div className="animate-fade-in space-y-4">
                                <div className="text-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-green-500 mb-2">check_circle</span>
                                    <h3 className="text-lg font-black text-text-main">{language === 'ka' ? 'ვერიფიკაცია წარმატებულია' : 'Identity Verified'}</h3>
                                    <p className="text-xs font-bold text-text-muted">{language === 'ka' ? 'შეიყვანეთ ახალი პაროლი' : 'Enter your new password'}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1.5">{language === 'ka' ? 'ახალი პაროლი' : 'New Password'}</label>
                                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-text-main text-sm" placeholder="••••••••" autoFocus minLength={8} />
                                    <div className="mt-3 space-y-2 animate-fade-in p-4 bg-surface-dark/5 rounded-2xl border border-border-light">
                                        <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.length ? 'text-green-600' : 'text-text-muted'}`}>
                                            <span className="material-symbols-outlined text-[16px]">{isPasswordValid.length ? 'check_circle' : 'radio_button_unchecked'}</span>
                                            {language === 'ka' ? 'მინიმუმ 8 სიმბოლო' : 'At least 8 characters'}
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.uppercase ? 'text-green-600' : 'text-text-muted'}`}>
                                            <span className="material-symbols-outlined text-[16px]">{isPasswordValid.uppercase ? 'check_circle' : 'radio_button_unchecked'}</span>
                                            {language === 'ka' ? 'მინიმუმ 1 დიდი ასო (A-Z)' : '1 uppercase letter (A-Z)'}
                                        </div>
                                        <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.number ? 'text-green-600' : 'text-text-muted'}`}>
                                            <span className="material-symbols-outlined text-[16px]">{isPasswordValid.number ? 'check_circle' : 'radio_button_unchecked'}</span>
                                            {language === 'ka' ? 'მინიმუმ 1 ციფრი (0-9)' : '1 number (0-9)'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : step === 'forgot_success' ? (
                            <div className="animate-fade-in space-y-4 py-6 text-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
                                </div>
                                <h3 className="text-xl font-black text-text-main">{language === 'ka' ? 'პაროლი შეიცვალა' : 'Password Changed'}</h3>
                                <p className="text-sm font-medium text-text-muted">{language === 'ka' ? 'ახლა შეგიძლიათ სისტემაში შესვლა ახალი პაროლით.' : 'You can now log in with your new password.'}</p>
                                <button type="button" onClick={() => { setStep('form'); handleTabSwitch(true); }} className="mt-4 w-full py-3.5 bg-primary/10 text-primary font-black rounded-xl hover:bg-primary/20 transition-all">
                                    {language === 'ka' ? 'შესვლა' : 'Log In'}
                                </button>
                            </div>
                        ) : (
                            <>
                                {!isLogin && (
                                    <div className="animate-fade-in stagger-children">
                                        <div className="mb-2 p-1 bg-surface-dark/5 rounded-xl flex items-center justify-between">
                                            <button type="button" onClick={() => setFormData({ ...formData, role: 'tourist' })} className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${formData.role === 'tourist' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'}`}>{language === 'ka' ? 'ტურისტი' : 'Tourist'}</button>
                                            <button type="button" onClick={() => setFormData({ ...formData, role: 'operator' })} className={`flex-1 py-2 text-xs font-bold transition-all rounded-lg ${formData.role === 'operator' ? 'bg-white shadow-sm text-primary' : 'text-text-muted hover:text-text-main'}`}>{language === 'ka' ? 'ტურ ოპერატორი' : 'Tour Organizer'}</button>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-text-muted mb-1.5">{t.name}</label>
                                            <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-text-main text-sm" placeholder="John Doe" />
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1.5">{t.email}</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-text-main text-sm" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-muted mb-1.5">{t.password}</label>
                                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-text-main text-sm" placeholder="••••••••" minLength={isLogin ? undefined : 8} />
                                    {!isLogin && (
                                        <div className="mt-3 space-y-2 animate-fade-in p-4 bg-surface-dark/5 rounded-2xl border border-border-light">
                                            <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.length ? 'text-green-600' : 'text-text-muted'}`}>
                                                <span className="material-symbols-outlined text-[16px]">{isPasswordValid.length ? 'check_circle' : 'radio_button_unchecked'}</span>
                                                {language === 'ka' ? 'მინიმუმ 8 სიმბოლო' : 'At least 8 characters'}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.uppercase ? 'text-green-600' : 'text-text-muted'}`}>
                                                <span className="material-symbols-outlined text-[16px]">{isPasswordValid.uppercase ? 'check_circle' : 'radio_button_unchecked'}</span>
                                                {language === 'ka' ? 'მინიმუმ 1 დიდი ასო (A-Z)' : '1 uppercase letter (A-Z)'}
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs font-bold transition-all ${isPasswordValid.number ? 'text-green-600' : 'text-text-muted'}`}>
                                                <span className="material-symbols-outlined text-[16px]">{isPasswordValid.number ? 'check_circle' : 'radio_button_unchecked'}</span>
                                                {language === 'ka' ? 'მინიმუმ 1 ციფრი (0-9)' : '1 number (0-9)'}
                                            </div>
                                        </div>
                                    )}
                                            <div className="flex justify-end mt-3">
                                                <button type="button" onClick={() => { setStep('forgot_email'); setError(null); setSuccess(null); }} className="text-xs font-bold text-primary hover:underline outline-none">{language === 'ka' ? 'დაგავიწყდათ პაროლი?' : 'Forgot Password?'}</button>
                                            </div>
                                </div>
                                {!isLogin && formData.role === 'operator' && (
                                    <div>
                                        <label className="block text-xs font-bold text-text-muted mb-1.5 mt-2">{t.company_name} <span className="text-[10px] font-medium text-gray-400">({language === 'ka' ? 'არასავალდებულო' : 'Optional'})</span></label>
                                        <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-border-light bg-background-light focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-text-main text-sm" placeholder="My Trips LLC" />
                                    </div>
                                )}
                            </>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium animate-fade-in border border-red-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">error</span>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium animate-fade-in border border-green-100 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                {success}
                            </div>
                        )}

                        {step !== 'forgot_verify' && step !== 'forgot_success' && (
                            <button disabled={loading || (step === 'forgot_new_password' && !allPasswordValid)} type="submit" className="mt-4 w-full py-3.5 bg-primary text-primary-content font-black rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center gap-2">
                                {loading ? <div className="w-5 h-5 border-2 border-primary-content border-t-transparent rounded-full animate-spin" /> : (
                                    step === 'verify' ? t.verify_button 
                                    : step === 'forgot_email' ? (language === 'ka' ? 'კოდის გაგზავნა' : 'Send Code')
                                    : step === 'forgot_new_password' ? (language === 'ka' ? 'პაროლის შეცვლა' : 'Change Password')
                                    : (isLogin ? t.login_button : t.register_button)
                                )}
                            </button>
                        )}

                        {step === 'form' && (
                            <>
                                <div className="relative flex items-center my-2">
                                    <div className="flex-grow border-t border-border-light"></div>
                                    <span className="px-4 text-xs font-bold text-text-muted">{language === 'ka' ? 'ან' : 'or'}</span>
                                    <div className="flex-grow border-t border-border-light"></div>
                                </div>
                                <div className="relative w-full h-[52px] rounded-xl overflow-hidden">
                                    <div className="absolute inset-0 bg-white border-2 border-border-light rounded-xl flex items-center justify-center gap-3 hover:border-primary hover:shadow-md transition-all cursor-pointer">
                                        <svg width="20" height="20" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                        </svg>
                                        <span className="font-bold text-sm text-text-main">{isLogin ? (language === 'ka' ? 'Google-ით შესვლა' : 'Sign in with Google') : (language === 'ka' ? 'Google-ით რეგისტრაცია' : 'Sign up with Google')}</span>
                                    </div>
                                    <div ref={googleBtnRef} className="absolute inset-0 w-full h-full opacity-[0.01] z-10 [&>div]:!w-full [&>div]:!h-full [&_iframe]:!w-full [&_iframe]:!h-full" />
                                </div>
                            </>
                        )}
                    </form>

                    {step === 'form' && (
                        <p className="mt-6 text-center text-xs font-bold text-text-muted">
                            {isLogin ? t.no_account : t.already_have_account}{' '}
                            <button onClick={() => handleTabSwitch(!isLogin)} className="text-primary hover:text-primary-hover transition-colors ml-1">{isLogin ? t.register : t.login}</button>
                        </p>
                    )}
                </div>

                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-background-light flex items-center justify-center text-text-muted hover:text-text-main hover:bg-border-light transition-all">
                    <span className="material-symbols-outlined text-sm font-black">close</span>
                </button>
            </div>
        </div>
    );
}
