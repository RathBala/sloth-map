import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase-config';

function Register() {
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    // const [loginEmail, setloginEmail] = useState('');
    // const [loginPassword, setLoginPassword] = useState('');

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

    // const login = async () => {};

    // const logout = async () => {};

    return (
        <div className="register">
            <div>
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
        </div>
    );
}

export default Register;
