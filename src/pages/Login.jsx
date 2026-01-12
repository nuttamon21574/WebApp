import { useState } from 'react'
import Cardclass from '../components/Card/Cardclass.jsx'
import AuthForm from '../components/Form/AuthForm.jsx'
import SubmitButton from '../components/Button/SubmitButton.jsx'
import ToSignup from '../components/Button/ToSignup.jsx'


export default function Login() {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-tr from-[#CFCADD] to-[#4A318C]">
      
      <div className="absolute top-4 left-4">
        <ToSignup />
      </div>

    <div
            className="w-full px-8
          sm:max-w-[340px]
          md:max-w-[380px]
          lg:max-w-[420px]
          xl:max-w-[440px]
          2xl:max-w-[480px]
        "
          >
            <Cardclass
              className="
                max-h-[90vh]
                overflow-y-auto
                py-4 sm:py-6 md:py-8
              "
            >
          <p className="text-3xl font-bold text-center">Sign In</p>

          <AuthForm type="login" />

          <p className="text-sm text-left text-gray-600 mb-4">
            Forgot your password?
            <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ml-1">
              Click here!
            </span>
          </p>

          <SubmitButton />
        </Cardclass>
      </div>

    </div>
  );
}
