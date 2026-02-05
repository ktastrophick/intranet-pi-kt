import React from "react"

type EstadoProps = {
  // Actualizamos los tipos para que coincidan con lo que realmente recibes
  estado: string 
}

export const StateColorButton: React.FC<EstadoProps> = ({ estado }) => {
  let bgColor = ''
  let textColor = ''

  switch (estado) {
    // Agrupamos los casos de Aprobación (masculino y femenino)
    case "Aprobado":
    case "Aprobada":
      bgColor = "bg-green-100"
      textColor = "text-green-800"
      break

    // Agrupamos los casos de Pendiente (incluyendo los de jefatura y dirección)
    case "Pendiente":
    case "Pendiente Jefatura":
    case "Pendiente Dirección":
      bgColor = "bg-yellow-100"
      textColor = "text-yellow-800"
      break

    // Agrupamos los casos de Rechazo
    case "Rechazado":
    case "Rechazada":
      bgColor = "bg-red-100"
      textColor = "text-red-800"
      break

    // Por defecto para Anuladas o cualquier otro
    default:
      bgColor = "bg-gray-100"
      textColor = "text-gray-800"
  }

  return (
    <span className={`${bgColor} ${textColor} px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap`}>
      {estado}
    </span>
  )
}