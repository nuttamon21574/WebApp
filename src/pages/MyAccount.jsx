import Sidebar from "../components/Sidebar/Sidebar";
import FormContainer from "../components/Form/FormContainer";
import UserName from "../components/Header/UserName";

export default function MyAccount() {
  return (
    <div className="min-h-screen w-screen bg-purple-950 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-full">
        
        {/* Sidebar */}
        <Sidebar activeTab="My Account" />

        {/* Main Content */}
        <div className="flex flex-col gap-4 w-full">

          {/* Header row */}
          <div className="flex flex-col mt-10 lg:mt-0">
            <UserName />
          </div>

          {/* White Card */}
          <div
            className="
              bg-white
              rounded-3xl
              w-full
              p-4
              sm:p-6
              lg:p-10
            "
          >
            <FormContainer />
          </div>

        </div>
      </div>
    </div>
  );
}
