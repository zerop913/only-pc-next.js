import Link from "next/link";
import Image from "next/image";

const Logo = () => {
  return (
    <Link href="/" className="flex items-center justify-center">
      <Image
        src="/logo.svg"
        alt="Logo"
        width={24}
        height={24}
        className="w-auto h-auto max-w-[80%]"
      />
    </Link>
  );
};

export default Logo;
