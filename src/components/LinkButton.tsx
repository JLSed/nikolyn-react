import { useNavigate } from "react-router-dom";

import { ReactNode } from "react";
interface LinkButtonProps {
  buttonName: string;
  linkPath: string;
  iconComponent: ReactNode;
}

function LinkButton({ buttonName, linkPath, iconComponent }: LinkButtonProps) {
  const navigate = useNavigate();

  return (
    <button
      className="flex items-center gap-2 font-outfit rounded-md bg-secondary px-2 py-1 cursor-pointer hover:bg-accent3 hover:text-primary transition-colors"
      onClick={() => navigate(linkPath)}
    >
      {iconComponent}
      {buttonName}
    </button>
  );
}

export default LinkButton;
