import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-4">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-2 md:mb-0">
            <Link href="/" className="text-white hover:text-gray-300">
              © {new Date().getFullYear()} SaaSinaSnap
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-gray-400 hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">
              Terms
            </Link>
            <Link href="/support" className="text-gray-400 hover:text-white">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;