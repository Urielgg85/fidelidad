// src/components/PhoneCheckinForm.jsx

import { useState } from 'react';
import { useRouter } from 'next/router';
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs
} from 'firebase/firestore';

import { InputField, PrimaryButton } from '@/components/ui';

const RADIO_DEFAULT_METROS = 100;

function generarUidPublico() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let uid = '';
  for (let i = 0; i < 8; i++) {
    uid += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return uid;
}

function calcularDistancia(lat1, lng1, lat2, lng2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function PhoneCheckinForm() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Por favor, ingresa un número válido.');
      return;
    }

    setLoading(true);

    try {
      const userRef = doc(db, 'usuarios', cleanPhone);
      const userSnap = await getDoc(userRef);

      let isNewUser = false;
      let generatedPin = '';
      let uidPublico = '';

      if (!userSnap.exists()) {
        isNewUser = true;
        generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
        uidPublico = generarUidPublico();
        await setDoc(userRef, {
          telefono: cleanPhone,
          puntos: 0,
          creado: new Date(),
          nombre: '',
          direccion: '',
          tipo: 'normal',
          historial: [],
          premiosObtenidos: [],
          referidos: [],
          pin: generatedPin,
          premiosReclamados: [],
          uidPublico
        });
      } else {
        uidPublico = userSnap.data().uidPublico || '';
      }

      if (!navigator.geolocation) {
        alert('Tu navegador no soporta geolocalización.');
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          const sucursalesSnap = await getDocs(collection(db, 'sucursales'));
          const sucursales = sucursalesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          const sucursalCercana = sucursales.find(s => {
            const dist = calcularDistancia(latitude, longitude, s.lat, s.lng);
            return dist <= (s.radio || RADIO_DEFAULT_METROS);
          });

          if (!sucursalCercana) {
            alert('📍 No estás cerca de ninguna sucursal.');
            setLoading(false);
            return;
          }

          await updateDoc(userRef, {
            puntos: userSnap.exists() ? (userSnap.data().puntos || 0) + 1 : 1,
            historial: arrayUnion({
              fecha: new Date().toISOString(),
              lat: latitude,
              lng: longitude,
              empresaId: sucursalCercana.empresaId,
              sucursalId: sucursalCercana.id
            })
          });

          if (isNewUser) {
            router.push(`/bienvenido?phone=${cleanPhone}&pin=${generatedPin}`);
          } else {
            router.push(`/u/${cleanPhone}`);
          }
        },
        (error) => {
          console.error(error);
          alert('No se pudo obtener tu ubicación.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error:', error);
      alert('Algo salió mal. Intenta de nuevo.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Ingresa tu número"
        required
      />
      <PrimaryButton type="submit" disabled={loading}>
        {loading ? 'Cargando...' : 'Iniciar'}
      </PrimaryButton>
    </form>
  );
}