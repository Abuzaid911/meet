// app/page.tsx
import Image from 'next/image';
import GoogleButton from '../../components/GoogleButton';
import welcomeIllustration from '../../../public/images/welcome-illustration.png';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-center">
      <h1 className="text-4xl font-bold mb-2">Welcome!</h1>
      <p className="text-gray-500 text-lg mb-8">Sign in or create a new account</p>

      <Image
        src={welcomeIllustration}
        alt="Welcome"
        width={320}
        height={320}
        className="mb-10"
      />

      <GoogleButton />
    </main>
  );
}