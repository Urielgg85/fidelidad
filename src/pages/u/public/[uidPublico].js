import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { Card, SectionTitle } from '@/components/ui';

export default function TarjetaPublica() {
  const router = useRouter();
  const { uidPublico } = router.query;

  const [userData, setUserData] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uidPublico) return;

    const fetchData = async () => {
      const usuariosSnap = await getDocs(collection(db, 'usuarios'));
      const userMatch = usuariosSnap.docs.find(doc => doc.data().uidPublico === uidPublico);
      if (!userMatch) return;

      const empresaSnap = await getDocs(collection(db, 'empresas'));
      const sucursalSnap = await getDocs(collection(db, 'sucursales'));

      setEmpresas(empresaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSucursales(sucursalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUserData({ id: userMatch.id, ...userMatch.data() });
      setLoading(false);
    };

    fetchData();
  }, [uidPublico]);

  if (loading || !userData) return <p className="text-white text-center mt-10">Cargando...</p>;

  const historial = userData.historial || [];
  const primerasVisitas = historial.slice(0, 4);

  return (
    <div className="min-h-screen bg-primario text-white flex flex-col items-center py-10 px-4">
      <Card>
        <h1 className="text-2xl font-bold text-center mb-2">🎉 Tarjeta Pública</h1>
        <p className="text-center text-lg">{userData.nombre || 'Usuario sin nombre'}</p>
        <p className="text-center text-sm mt-1">Check-ins: {historial.length}</p>

        <div className="mt-6 space-y-4">
          <SectionTitle>🗺️ Últimas visitas</SectionTitle>
          {primerasVisitas.map((item, index) => {
            const empresa = empresas.find(e => e.id === item.empresaId);
            const sucursal = sucursales.find(s => s.id === item.sucursalId);
            const mapLink = `https://maps.google.com/?q=${item.lat},${item.lng}`;
            return (
              <div key={index} className="bg-gray-100 text-black p-3 rounded">
                <p className="font-semibold">{empresa?.nombre || 'Empresa desconocida'}</p>
                <p className="text-sm">{sucursal?.nombre || 'Sucursal'}</p>
                <p className="text-xs text-gray-700">{new Date(item.fecha).toLocaleDateString()}</p>
                <a
                  href={mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block mt-1 text-blue-600 underline text-xs"
                >
                  Ver en Google Maps
                </a>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
