// src/utils/openReportWindow.js

export const openReportWindow = ({ title, html }) => {
  const win = window.open("", "_blank");

  if (!win) {
    alert("Bloqueador de ventanas emergentes activo.");
    return;
  }

  win.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 24px;
            color: #111;
          }

          h1, h2, h3 {
            color: #b91c1c;
            margin-bottom: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          th, td {
            border: 1px solid #ccc;
            padding: 8px;
            font-size: 12px;
          }

          th {
            background: #fee2e2;
            text-align: left;
          }

          .box {
            border: 2px solid #b91c1c;
            padding: 12px;
            margin: 12px 0;
            background: #fef2f2;
          }

          @media print {
            button {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        ${html}
        <br />
        <button onclick="window.print()">Descargar / Imprimir PDF</button>
      </body>
    </html>
  `);

  win.document.close();
};
