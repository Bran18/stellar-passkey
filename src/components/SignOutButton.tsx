import { useStellar } from "../hooks/useStellar/useStellar";

interface SignOutButtonProps {
  className?: string;
}

export const SignOutButton = ({ className = "" }: SignOutButtonProps) => {
  const { signOut } = useStellar();

  return (
    <button
      onClick={signOut}
      type="button"
      className={`py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors ${className}`}
      aria-label="Sign out"
    >
      Sign Out
    </button>
  );
}; 