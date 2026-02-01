import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utilities/database/supabaseClient';
import { Session } from '@supabase/supabase-js';

const AdminPanel: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [_session, setSession] = useState<Session | null>(null);
    const [authError, setAuthError] = useState<string | null>(null);
    const [authSuccess, setAuthSuccess] = useState(false);
    const navigate = useNavigate();

    const params = new URLSearchParams(window.location.search);
    const hasTokenHash = params.get("token_hash");
    const [verifying, setVerifying] = useState(!!hasTokenHash);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token_hash = params.get("token_hash");
        const type = params.get("type");
        if (token_hash && type) {
            supabase.auth.verifyOtp({
                token_hash,
                type: type as any,
            }).then(({ error }) => {
                if (error) {
                    setAuthError(error.message);
                } else {
                    setAuthSuccess(true);
                    window.history.replaceState({}, document.title, "/");
                }
                setVerifying(false);
            });
        }
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                navigate('/admin/dashboard');
            }
        });
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) {
                navigate('/admin/dashboard');
            }
        });
        return () => subscription.unsubscribe();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);

        if (email && password) {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                setAuthError(error.message);
                setLoading(false);
            } else {
                setAuthSuccess(true);
            }
        } else {
            setAuthError('Please enter both email and password');
            setLoading(false);
        }
    };

    if (verifying) {
        return <div className="admin">Verifying...</div>;
    }

    if (authSuccess) {
        return <div className="admin">Login successful! Redirecting...</div>;
    }

    return (
        <form onSubmit={handleLogin} className='admin'>
            {authError && <p className="error-message">{authError}</p>}
            <p className="inputLabel">Email</p>
            <input type="email" className="admininput" placeholder='Email' value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
            <p className="inputLabel">Password</p>
            <input type="password" className="admininput" placeholder='Password' value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
            <button type="submit" className="adminSubmit" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
            </button>
        </form>
    );
};

export default AdminPanel;