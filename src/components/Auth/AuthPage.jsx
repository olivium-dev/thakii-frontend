import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Thakii Lecture2PDF
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Convert your lecture videos into readable PDFs
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isLogin ? (
          <LoginForm switchToSignUp={() => setIsLogin(false)} />
        ) : (
          <SignUpForm switchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
}