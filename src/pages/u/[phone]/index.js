// src/pages/u/[phone]/index.js

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { Card, SectionTitle, PrimaryButton, InputField } from '@/components/ui';
import { UserIcon } from 'lucide-react';

export default function TarjetaUsuario() {
  const router = useRouter();
  const { phone } = router.query;

  const [userData, setUserData] = useState(null);
  const [empresas, setEmpresas] = useState([]);
  const [sucursales, setSucursales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autenticado, setAutenticado] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [fotoURL, setFotoURL] = useState('');

  useEffect(() => {
    if (!phone) return;

    const sesion = localStorage.getItem('usuarioAutenticado');
    if (sesion === phone) setAutenticado(true);

    const fetchData = async () => {
      try {
        const userRef = doc(db, 'usuarios', phone);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const empresaSnap = await getDocs(collection(db, 'empresas'));
        const sucursalSnap = await getDocs(collection(db, 'sucursales'));

        const data = userSnap.data();
        setUserData(data);
        setNombre(data.nombre || '');
        setDireccion(data.direccion || '');
        setFotoURL(data.foto || '');

        setEmpresas(empresaSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSucursales(sucursalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [phone]);

  const handleVerificarPin = () => {
    if (pinInput === userData?.pin) {
      localStorage.setItem('usuarioAutenticado', phone);
      setAutenticado(true);
    } else {
      alert('PIN incorrecto');
    }
  };

  const handleGuardarPerfil = async () => {
    try {
      const userRef = doc(db, 'usuarios', phone);
      await updateDoc(userRef, {
        nombre,
        direccion,
        foto: fotoURL
      });
      setUserData(prev => ({ ...prev, nombre, direccion, foto: fotoURL }));
      setEditando(false);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      alert('No se pudo guardar.');
    }
  };

  if (loading || !userData) return <p className="text-white text-center mt-10">Cargando...</p>;

  if (!autenticado) {
    return (
      <div className="min-h-screen bg-primario text-white flex items-center justify-center">
        <Card>
          <SectionTitle>🔒 Protegido con PIN</SectionTitle>
          <InputField
            type="password"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Ingresa tu PIN"
          />
          <PrimaryButton onClick={handleVerificarPin}>Acceder</PrimaryButton>
        </Card>
      </div>
    );
  }

  const totalCheckins = userData.historial?.length || 0;
  const referidos = userData.referidos?.length || 0;

  const getInsignia = () => {
    if (totalCheckins >= 20) return '🥇 Jugador Legendario';
    if (totalCheckins >= 10) return '🏅 Jugador Persistente';
    if (totalCheckins >= 5) return '🔥 Fiel Cliente';
    return '🎉 Recién Comenzando';
  };

  const compartirLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/u/public/${userData.uidPublico}`;

  return (
    <div className="min-h-screen bg-primario text-white flex flex-col items-center py-10 px-4 relative">
      <div className="absolute top-4 right-6 cursor-pointer" onClick={() => setEditando(!editando)}>
        <UserIcon className="text-white" />
      </div>

      {editando && (
        <Card className="absolute top-16 right-4 z-50 w-72">
          <SectionTitle>Editar Perfil</SectionTitle>
          <InputField
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
          />
          <InputField
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Dirección"
          />
          <InputField
            value={fotoURL}
            onChange={(e) => setFotoURL(e.target.value)}
            placeholder="URL de la foto"
          />
          <PrimaryButton onClick={handleGuardarPerfil}>Guardar</PrimaryButton>
        </Card>
      )}

      <Card>
        {fotoURL && <img src={fotoURL} alt="Foto usuario" className="mx-auto w-24 h-24 rounded-full object-cover mb-2" />}
        <h1 className="text-2xl font-bold text-center mb-2">Mi Tarjeta Digital</h1>
        <p className="text-center text-lg">{userData.nombre || phone}</p>
        <p className="text-center text-sm mt-2">{getInsignia()}</p>
        <div className="text-center text-sm text-gray-600 mt-1">
          Check-ins: {totalCheckins} | Referidos: {referidos}
        </div>
        <div className="mt-6 space-y-4">
          <SectionTitle>Empresas Visitadas</SectionTitle>
          {empresas
  .filter(empresa =>
    userData.historial?.some(h => h.empresaId === empresa.id)
  )
  .map((empresa) => {
    const visitas = userData.historial?.filter(h => h.empresaId === empresa.id) || [];
    const totalPuntos = visitas.length;
    const premios = empresa.premios || [];

    const premiosRender = premios.map((premio, i) => {
      if (premio.recurrente) {
        const puntosParaSiguiente = premio.puntos - (totalPuntos % premio.puntos);
        const puedeReclamar = totalPuntos >= premio.puntos && totalPuntos % premio.puntos === 0;

        return (
          <p key={i} className="text-sm text-black">
            🎁 {premio.descripcion} — {
              puedeReclamar
                ? '¡Puedes reclamarlo nuevamente!'
                : `Te faltan ${puntosParaSiguiente} puntos para el siguiente`
            }
          </p>
        );
      } else {
        const puntosRestantes = premio.puntos - totalPuntos;
        return (
          <p key={i} className="text-sm text-black">
            🎁 {premio.descripcion} — {
              puntosRestantes > 0
                ? `Te faltan ${puntosRestantes} puntos`
                : '✅ Ya reclamado'
            }
          </p>
        );
      }
    });

    return (
      <div key={empresa.id} className="bg-gray-100 text-black p-3 rounded space-y-2">
        <p className="font-semibold">{empresa.nombre}</p>
        {premiosRender}
        <PrimaryButton onClick={() => router.push(`/u/${phone}/${empresa.id}`)}>Ver detalles</PrimaryButton>
      </div>
    );
  })}


        </div>
        <div className="mt-8">
          <SectionTitle>🎁 Invita y gana</SectionTitle>
          <p className="text-sm text-gray-700 text-center mb-2">Comparte tu tarjeta pública con amigos:</p>
          <p className="text-center text-xs text-gray-500 bg-gray-200 text-black px-2 py-1 rounded">
            {compartirLink}
          </p>
        </div>
      </Card>
    </div>
  );
}
