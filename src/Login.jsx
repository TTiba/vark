import React, { useState, useEffect } from 'react';
import { LogIn, User } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        /* global google */
        if (window.google) {
            google.accounts.id.initialize({
                client_id: "739830653809-vh6djiiio5o8rm0dmcjj813vqnl5cic1.apps.googleusercontent.com",
                callback: handleCredentialResponse
            });
            google.accounts.id.renderButton(
                document.getElementById("buttonDiv"),
                { theme: "outline", size: "large" }
            );
        }
    }, []);

    const handleCredentialResponse = (response) => {
        setLoading(true);
        setError('');
        try {
            const responsePayload = decodeJwt(response.credential);

            // Check domain if needed, e.g., @escola.pr.gov.br
            if (!responsePayload.email.endsWith('@escola.pr.gov.br')) {
                throw new Error('Acesso restrito a e-mails @escola.pr.gov.br');
            }

            const user = {
                email: responsePayload.email,
                name: responsePayload.name,
                picture: responsePayload.picture
            };

            // Save to local storage
            localStorage.setItem('vark_user_session', JSON.stringify(user));

            // Notify parent to update state
            if (onLoginSuccess) {
                onLoginSuccess(user);
            }

        } catch (e) {
            console.error("Login Error:", e);
            setError(e.message || "Erro ao processar login.");
        } finally {
            setLoading(false);
        }
    };

    const handleGuestLogin = () => {
        const guestUser = {
            email: 'guest',
            name: 'Visitante',
            picture: null,
            isGuest: true
        };
        localStorage.setItem('vark_user_session', JSON.stringify(guestUser));

        if (onLoginSuccess) {
            onLoginSuccess(guestUser);
        }
    };

    const decodeJwt = (token) => {
        var base64Url = token.split('.')[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-slate-100 text-center space-y-8">

                <div className="space-y-2">
                    <div className="bg-violet-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogIn className="text-violet-500" size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-800">Bem-vindo ao VARK</h1>
                    <p className="text-slate-500">
                        Entre para descobrir seu estilo de aprendizagem e salvar seus resultados.
                    </p>
                </div>

                <div className="flex flex-col gap-4 w-full">
                    <div id="buttonDiv" className="w-full h-[40px] flex justify-center"></div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-slate-200"></div>
                        <span className="flex-shrink mx-4 text-slate-400 text-sm">ou</span>
                        <div className="flex-grow border-t border-slate-200"></div>
                    </div>

                    <button
                        onClick={handleGuestLogin}
                        className="w-full bg-white hover:bg-slate-50 text-slate-600 font-semibold py-2.5 px-4 rounded border border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                        <User size={20} />
                        Continuar como Visitante
                    </button>
                </div>

                {error && (
                    <p className="text-red-500 text-sm font-medium bg-red-50 p-2 rounded border border-red-100">
                        {error}
                    </p>
                )}

                <p className="text-xs text-slate-400">
                    Ao entrar, você concorda em compartilhar seu nome e e-mail para identificação dos resultados.
                </p>
            </div>
        </div>
    );
};

export default Login;
