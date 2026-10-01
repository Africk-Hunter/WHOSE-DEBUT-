import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../utilities/database/firebaseAuth';

const AdminPanel: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState<string | null>(null);
    const [authSuccess, setAuthSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/admin/dashboard');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setAuthError(null);

        if (email && password) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                setAuthSuccess(true);
            } catch (error) {
                setAuthError(error instanceof Error ? error.message : 'Login failed');
                setLoading(false);
            }
        } else {
            setAuthError('Please enter both email and password');
            setLoading(false);
        }
    };

    return (
        <div className="about adminPage">
            <section className="topBar">
                <button className="backArrow backArrow--visible" onClick={() => navigate('/')}>
                    <img src="/images/Arrow.svg" alt="Back" className="arrowImage" />
                </button>
                <h1 className="pageHeader pageHeader--about">ADMIN</h1>
            </section>
            <div className="divider"></div>

            <main className="adminContent adminContent--login">
                {authSuccess ? (
                    <p className="adminLoginStatus">Signed in. Redirecting&hellip;</p>
                ) : (
                    <form onSubmit={handleLogin} className="adminLogin">
                        <label className="formGroup">
                            <span>Email</span>
                            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
                        </label>
                        <label className="formGroup">
                            <span>Password</span>
                            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
                        </label>
                        {authError && <p className="adminError">{authError}</p>}
                        <button type="submit" className="adminButton adminButton--primary" disabled={loading}>
                            {loading ? 'Signing In…' : 'Sign In'}
                        </button>
                    </form>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;
