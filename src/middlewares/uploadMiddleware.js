import multer from "multer";
import path from "path";
import fs from "fs";

// 1. Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "public", "uploads");

    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const filename = `${file.fieldname}_${Date.now()}${extension}`;
    cb(null, filename);
  },
});

// 2. Filtro de archivos (solo imágenes)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true); // Aceptar archivo
  } else {
    cb(new Error("Solo se permiten archivos de imagen (JPEG/PNG/GIF)."), false); // Rechazar archivo
  }
};

// Filtro para documentos de verificación (Imágenes + PDF)
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Formato no válido. Solo se permiten imágenes y PDF."), false);
  }
};

// 3. Inicializar Multer para múltiples imágenes (Artículos)
export const uploadImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // Límite de 5MB por archivo
  },
}).array("imageFiles", 5);

// 4. Inicializar Multer para documentos de verificación
// AHORA USA .fields() PARA SEPARAR DNI Y OTROS DOCS
export const uploadDocuments = multer({
  storage: storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // Límite de 10MB
  },
}).fields([
  { name: "dniFront", maxCount: 1 },
  { name: "dniBack", maxCount: 1 },
  { name: "documents", maxCount: 5 },
]);
