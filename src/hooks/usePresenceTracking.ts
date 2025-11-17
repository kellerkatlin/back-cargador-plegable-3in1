import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface LocationData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
}

export const usePresenceTracking = () => {
  const sessionIdRef = useRef<string | undefined>(undefined);
  const locationDataRef = useRef<LocationData | null>(null);

  useEffect(() => {
    // Solo trackear si NO estamos en rutas de admin
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      return; // No trackear rutas de admin
    }

    // Generar ID único de sesión
    if (!sessionIdRef.current) {
      sessionIdRef.current = crypto.randomUUID();
    }

    const sessionId = sessionIdRef.current;
    const userAgent = navigator.userAgent;

    // Obtener ubicación por IP (solo una vez)
    const fetchLocation = async () => {
      if (locationDataRef.current) return;

      try {
        const response = await fetch('https://ipapi.co/json/');
        const data: LocationData = await response.json();
        locationDataRef.current = data;
      } catch (error) {
        console.error('Error fetching location:', error);
        locationDataRef.current = {
          ip: 'Unknown',
          city: 'Unknown',
          region: 'Unknown',
          country_name: 'Unknown',
        };
      }
    };

    // Función para actualizar presencia
    const updatePresence = async () => {
      // Verificar nuevamente que no estamos en admin
      const path = window.location.pathname;
      if (path.startsWith('/admin')) {
        return;
      }

      // Esperar a tener datos de ubicación
      if (!locationDataRef.current) {
        await fetchLocation();
      }

      try {
        await supabase.from('user_presence').upsert({
          session_id: sessionId,
          page_path: path,
          last_seen: new Date().toISOString(),
          user_agent: userAgent,
          ip_address: locationDataRef.current?.ip,
          city: locationDataRef.current?.city,
          region: locationDataRef.current?.region,
          country: locationDataRef.current?.country_name,
        }, {
          onConflict: 'session_id'
        });
      } catch (error) {
        console.error('Error updating presence:', error);
      }
    };

    // Actualizar al montar
    updatePresence();

    // Actualizar cada 30 segundos
    const interval = setInterval(updatePresence, 30000);

    // Actualizar al cambiar de página
    const handlePageChange = () => {
      // Solo actualizar si no es ruta de admin
      if (!window.location.pathname.startsWith('/admin')) {
        updatePresence();
      }
    };
    window.addEventListener('popstate', handlePageChange);

    // Limpiar al desmontar
    return () => {
      clearInterval(interval);
      window.removeEventListener('popstate', handlePageChange);
      
      // Eliminar presencia al cerrar
      supabase.from('user_presence')
        .delete()
        .eq('session_id', sessionId)
        .then(() => console.log('Presencia eliminada'));
    };
  }, []);
};
