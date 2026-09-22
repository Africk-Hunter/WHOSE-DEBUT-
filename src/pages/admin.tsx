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
