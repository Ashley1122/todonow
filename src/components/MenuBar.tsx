import Link from "next/link";
import { useAuth } from "@/firebase/auth";
import { Button } from "@/components/ui/button";

const AuthMenuBar: React.FC = () => {
  const { user, signOut } = useAuth();
  return (
    <nav className="bg-gray-100 p-4 flex justify-end space-x-4">
      {user ? (
        <Button
          onClick={signOut}
          key="signOut"
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-700"
        >
          Sign Out
        </Button>      
      ) : (
        <>
          <Link href="/signin">
            <Button key="signIn" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button key="signUp" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-700">
              Sign Up
            </Button>
          </Link>
        </>
      )}
    </nav>
  );
};

export default AuthMenuBar;