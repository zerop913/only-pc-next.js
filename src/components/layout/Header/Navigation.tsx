import { CogIcon, FolderIcon } from "@heroicons/react/24/outline";
import Button from "@/components/common/Button/Button";
import { useRouter } from "next/navigation";

interface NavigationProps {
  isTablet?: boolean;
  isMobile?: boolean;
}

const Navigation = ({ isTablet, isMobile }: NavigationProps) => {
  const router = useRouter();

  const handleConfiguratorClick = () => {
    router.push("/configurator");
  };

  const handleCatalogClick = () => {
    router.push("/catalog");
  };

  return (
    <nav className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 lg:space-x-4">
      <Button
        icon={CogIcon}
        isTablet={isTablet}
        variant={isMobile ? "mobile" : "default"}
        onClick={handleConfiguratorClick}
      >
        Конфигуратор
      </Button>
      <Button
        icon={FolderIcon}
        isTablet={isTablet}
        variant={isMobile ? "mobile" : "default"}
        onClick={handleCatalogClick}
      >
        Каталог
      </Button>
    </nav>
  );
};

export default Navigation;
