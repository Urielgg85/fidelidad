import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, updateDoc, arrayUnion
} from 'firebase/firestore';
import { Card, SectionTitle, PrimaryButton } from '@/components/ui';

export default function VistaEmpresa() {
  const router = useRouter();
  const { phone, empresaId } = router.query;

  const [usuario, setUsuario] = useState(null);
  const [empresa, setEmpresa] = useState(null);
  const [puntosEmpresa, setPuntosEmpresa] = useState(0);
  const [reclamados, setReclamados] = useState([]);

  useEffect(() => {
    if (!phone || !empresaId) return;

    const fetchData = async () => {
      const userRef = doc(db, 'usuarios', phone);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const empresaRef = doc(db, 'empresas', empresaId);
      const empresaSnap = await getDoc(empresaRef);
      const empresaData = empresaSnap.data();

      const checkins = userData.historial?.filter(h => h.empresaId === empresaId) || [];
      const reclamados = userData.premiosReclamados?.filter(p => p.empresaId === empresaId) || [];

      setUsuario(userData);
      setEmpresa(empresaData);
      setPuntosEmpresa(checkins.length);
      setReclamados(reclamados);
    };

    fetchData();
  }, [phone, empresaId]);

  const handleReclamar = async (premio) => {
    if (!usuario || !empresa || puntosEmpresa < premio.puntos) return;

    const yaReclamado = reclamados.some(r => r.premioDescripcion === premio.descripcion && !premio.recurrente);
    if (yaReclamado) return alert('Este premio ya fue reclamado.');

    const nuevaEntrada = {
      empresaId,
      premioDescripcion: premio.descripcion,
      puntosUsados: premio.puntos,
      fecha: new Date().toISOString(),
      recurrente: premio.recurrente
    };

    const userRef = doc(db, 'usuarios', phone);
    await updateDoc(userRef, {
      premiosReclamados: arrayUnion(nuevaEntrada)
    });

    alert('🎉 Premio reclamado exitosamente.');
    router.reload();
  };

  if (!usuario || !empresa) return <p className="text-white p-4">Cargando...</p>;

  return (
    <div className="min-h-screen bg-primario text-white flex justify-center py-10 px-4">
      <Card className="w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center">{empresa.nombre}</h1>
        <p className="text-center text-sm">Check-ins acumulados: {puntosEmpresa}</p>

        <SectionTitle>🎁 Premios de la empresa</SectionTitle>
        {empresa.premios?.map((premio, index) => {
            const yaReclamado = reclamados.filter(r => r.premioDescripcion === premio.descripcion);
            const vecesReclamado = yaReclamado.length;
            const siguienteMultiplo = premio.puntos * (vecesReclamado + 1);
            const puedeReclamar =
                premio.recurrente
                ? puntosEmpresa >= siguienteMultiplo
                : vecesReclamado === 0 && puntosEmpresa >= premio.puntos;

            return (
                <div key={index} className="bg-gray-100 text-black p-4 rounded mb-4">
                <p className="font-semibold">{premio.descripcion}</p>
                <p className="text-sm">Requiere: {premio.puntos} puntos</p>
                <p className="text-xs">{premio.recurrente ? '🔁 Recurrente' : '🔒 Único'}</p>

                {premio.recurrente && vecesReclamado > 0 && (
                    <p className="text-xs text-gray-600">
                    Ya reclamado {vecesReclamado} vez{vecesReclamado > 1 ? 'es' : ''} — próximo a los {siguienteMultiplo} puntos
                    </p>
                )}

                {puedeReclamar ? (
                    <PrimaryButton onClick={() => handleReclamar(premio)} className="mt-2">
                    Reclamar premio
                    </PrimaryButton>
                ) : (
                    <p className="text-sm text-gray-700 mt-2">
                    Te faltan {premio.recurrente
                        ? siguienteMultiplo - puntosEmpresa
                        : premio.puntos - puntosEmpresa} puntos
                    </p>
                )}
                </div>
            );
})}

      </Card>
    </div>
  );
}
