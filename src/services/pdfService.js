// src/services/pdfService.js
import { generarPDFSuperadmin } from "./pdf/pdfSuperadmin";

export const generarPDF = (params) => {
  const { currentUser } = params;

  if (!currentUser) {
    alert("Usuario no válido");
    return;
  }

  if (currentUser.role === "superadmin") {
    return generarPDFSuperadmin(params);
  }

  alert("Reporte aún no disponible para este rol.");
};
