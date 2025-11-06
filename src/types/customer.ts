export interface Customer {
  id?: string;
  nombre: string;
  apellido: string;
  numero: string;
  direccion: string;
  referencia: string;
  distrito: string;
  provincia: string;
  departamento: string;
  dni?: string; // DNI opcional para envíos a provincia
}
