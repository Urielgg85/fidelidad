import PhoneCheckinForm from '@/components/PhoneCheckinForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-primario text-white flex items-center justify-center">
      <div className="bg-white text-black p-6 rounded-lg shadow max-w-md w-full">
        <h1 className="text-xl font-bold text-center mb-4">Bienvenido</h1>
        <PhoneCheckinForm />
      </div>
    </div>
  );
}
