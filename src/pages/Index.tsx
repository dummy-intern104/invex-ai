
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to auth page instead of dashboard directly
    navigate("/auth");
  }, [navigate]);
  
  return null;
};

export default Index;
