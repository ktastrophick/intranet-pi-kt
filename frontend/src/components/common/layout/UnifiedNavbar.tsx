// frontend/src/components/common/layout/UnifiedNavbar.tsx

import React from "react";
import { Link } from "react-router-dom";
import { PerfilIconButton } from "../buttons/PerfilIconButton";
import { useAuth } from "@/api/contexts/AuthContext";
import { usePermissions } from "@/hooks/userPermissions"; // Asegúrate de que la ruta sea correcta
import cesfamLogo from '@/components/images/cesfamsta.png';

export const UnifiedNavbar: React.FC = () => {
  const { user } = useAuth();
  const permisos = usePermissions(); // Usamos tu hook aquí

  const userAvatarUrl = user?.avatar;
  const userInitials = user 
    ? `${user.nombre.charAt(0)}${user.apellido_paterno.charAt(0)}`
    : "U";
  
  const userNameComplete = user?.nombre_completo || "Usuario";
  const userDisplayName = user ? `${user.nombre} ${user.apellido_paterno}` : "Usuario";
  const userJobTitle = user?.cargo || "Funcionario";

  return (
    <div className="fixed top-0 left-0 w-full h-16 shadow flex items-center justify-between px-6 z-50 bg-white">
      
      {/* LOGO */}
      <Link to="/home" className="flex items-center gap-3 group select-none">
        <img 
          src={cesfamLogo} 
          alt="Logo CESFAM" 
          className="h-12 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
        />
        <div className="font-semibold text-lg text-gray-700 flex gap-1.5">
          <span className="transition-colors duration-300 group-hover:text-[#F19106]">CESFAM</span>
          <span className="transition-colors duration-300 group-hover:text-[#95C122]">Intranet</span>
        </div>
      </Link>

      {/* NAVEGACIÓN CENTRAL */}
      <nav className="flex gap-5 items-center">
        <Link to="/home" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-orange-500 transition">
          Inicio
        </Link>

        {(permisos.esFuncionario || permisos.esJefatura) && (
          <Link to="/vacaciones" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-blue-500 transition">
            Mis Solicitudes
          </Link>
        )}

        {permisos.puedeAprobarSolicitudes && (
          <Link to="/aprobaciones" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-blue-600 transition">
            Aprobaciones
          </Link>
        )}

        <Link to="/repositorio" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-yellow-500 transition">
          Archivos
        </Link>

        {/* 1. LINK PARA TODOS: Mis Licencias (Vista personal) */}
        <Link to="/licencias" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-indigo-500 transition">
          Mis Licencias
        </Link>

        {/* 2. LINK PARA ADMIN: Validar (Usa el permiso de tu hook) */}
        {permisos.puedeGestionarLicencias && (
          <Link to="/admin/licencias" className="text-indigo-600 font-bold text-sm xl:text-base hover:text-indigo-800 transition flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Validar
          </Link>
        )}

        <Link to="/anuncios" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-red-500 transition">
          Anuncios
        </Link>

        <Link to="/actividades" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-purple-500 transition">
          Actividades
        </Link>

        <Link to="/calendario" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-green-500 transition">
          Calendario
        </Link>

        <Link to="/directorio" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-pink-500 transition">
          Directorio
        </Link>

        <Link to="/soporte" className="text-gray-700 font-semibold text-sm xl:text-base hover:text-gray-500 transition">
          Soporte
        </Link>
      </nav>

      {/* SECCIÓN DERECHA */}
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden lg:flex flex-col items-end mr-1">
            <span className="text-xs font-bold text-gray-700 leading-tight">{userDisplayName}</span>
            <span className="text-[10px] text-gray-500 font-normal uppercase tracking-tighter">{userJobTitle}</span>
          </div>
        )}
        <PerfilIconButton
          userName={userNameComplete}
          userInitials={userInitials}
          userAvatarUrl={userAvatarUrl}
        />
      </div>
    </div>
  );
};

export default UnifiedNavbar;