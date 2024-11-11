// Auth.jsx
import { useState } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase-config';

function Authentication() {
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const register = async () => {
        try {
            const user = await createUserWithEmailAndPassword(
                auth,
                registerEmail,
                registerPassword
            );
            console.log(user);
        } catch (error) {
            console.log(error.message);
        }
    };

    const login = async () => {
        try {
            const user = await signInWithEmailAndPassword(
                auth,
                loginEmail,
                loginPassword
            );
            console.log(user);
        } catch (error) {
            console.log(error.message);
            alert(error.message);
        }
    };

    return (
        <div className="authentication">
            <div className="register">
                <h3>Create an account</h3>
                <input
                    placeholder="Email"
                    onChange={(event) => {
                        setRegisterEmail(event.target.value);
                    }}
                />
                <input
                    placeholder="Password"
                    onChange={(event) => {
                        setRegisterPassword(event.target.value);
                    }}
                />
                <button onClick={register}>Create</button>
            </div>

            <div className="log__in">
                <h3>Log in</h3>
                <input
                    data-cy="login-email"
                    placeholder="Email"
                    onChange={(event) => {
                        setLoginEmail(event.target.value);
                    }}
                />
                <input
                    data-cy="login-password"
                    placeholder="Password"
                    onChange={(event) => {
                        setLoginPassword(event.target.value);
                    }}
                />
                <button data-cy="login-button" onClick={login}>
                    Log in
                </button>
            </div>
        </div>
    );
}

export default Authentication;
