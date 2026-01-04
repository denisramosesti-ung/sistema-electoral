// src/services/pdfService.js

import { generarPDFSuperadmin } from "./pdf/pdfSuperadmin";
import { generarPDFCoordinador } from "./pdf/pdfCoordinador";
import { generarPDFSubcoordinador } from "./pdf/pdfSubcoordinador";

export const generarPDF = async (params) => {
  const { currentUser } = params;

  if (!currentUser || !currentUser.role) {
    console.error("Usuario no válido para generar PDF");
    return;
  }

  if (currentUser.role === "superadmin") {
    return await generarPDFSuperadmin(params);
  }

  if (currentUser.role === "coordinador") {
    return await generarPDFCoordinador(params);
  }

  if (currentUser.role === "subcoordinador") {
    return await generarPDFSubcoordinador(params);
  }

  console.error("Rol no reconocido para PDF:", currentUser.role);
};
