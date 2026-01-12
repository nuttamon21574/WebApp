import InputForm from "./InputForm";

export default function AuthForm({ type }) {
  const isRegister = type === "register";

  return (
  
    <form className="flex flex-col mt-6">
      <InputForm id="username" label="Username" type="text" required />
      
      <InputForm id="email" label="Email" type="email" placeholder="name@example.com" required />
      
      <InputForm id="password" label="Password" type="password" required />

      {isRegister && (
        <InputForm id="confirm" label="Confirm Password" type="password" required />
      )}
    </form>
    
  );
}
