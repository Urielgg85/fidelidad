// src/pages/bienvenido.js

import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Card, SectionTitle, PrimaryButton } from '@/components/ui';

export default function Bienvenido() {
  const router = useRouter();
  const { phone, pin } = router.query;

  useEffect(() => {
    if (phone) {
      localStorage.setItem('usuarioAutenticado', phone);
    }
  }, [phone]);

  if (!phone || !pin) {
    return <p className="text-white text-center mt-10">Cargando...</p>;
  }

  return (
    <div className="min-h-screen bg-primario text-white flex flex-col items-center justify-center px-4">
      <Card>
        <SectionTitle>🎉 ¡Bienvenido!</SectionTitle>
        <p className="text-center mb-4">Tu cuenta ha sido creada exitosamente.</p>
        <p className="text-center text-sm text-gray-700 bg-gray-200 text-black px-3 py-2 rounded mb-4">
          Tu PIN de acceso es: <span className="font-bold">{pin}</span>
        </p>
        <PrimaryButton onClick={() => router.push(`/u/${phone}`)}>
          Ir a mi tarjeta
        </PrimaryButton>
      </Card>
    </div>
  );
}