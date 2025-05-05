import { useNavigate } from "react-router-dom";

interface LinkButtonProps {
  buttonName: string;
  linkPath: string;
}

function LinkButton({ buttonName, linkPath }: LinkButtonProps) {
  const navigate = useNavigate();
  return (
    <button
      className="border-2 rounded-md bg-secondary px-2 py-1 cursor-pointer hover:bg-primary hover:text-secondary transition-colors"
      onClick={() => navigate(linkPath)}
    >
      {buttonName}
    </button>
  );
}

export default LinkButton;
