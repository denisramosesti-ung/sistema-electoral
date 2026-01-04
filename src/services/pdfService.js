// src/services/pdfService.js

import { generarPDFSuperadmin } from "./pdf/pdfSuperadmin";
import { generarPDFCoordinador } from "./pdf/pdfCoordinador";
import { generarPDFSubcoordinador } from "./pdf/pdfSubcoordinador";

export const generarPDF = (params) => {
  const { currentUser } = params;

  if (!currentUser || !currentUser.role) {
    console.error("Usuario no válido para generar PDF");
    return;
  }

  // ================= SUPERADMIN =================
  if (currentUser.role === "superadmin") {
    return generarPDFSuperadmin(params);
  }

  // ================= COORDINADOR =================
  if (currentUser.role === "coordinador") {
    return generarPDFCoordinador(params);
  }

  // ================= SUBCOORDINADOR =================
  if (currentUser.role === "subcoordinador") {
    return generarPDFSubcoordinador(params);
  }

  console.error("Rol no reconocido para PDF:", currentUser.role);
};
