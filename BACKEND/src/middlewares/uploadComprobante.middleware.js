const multer = require("multer");
const path   = require("path");
const fs     = require("fs");

const UPLOAD_DIR = path.join(__dirname, "../public/uploads/comprobantes");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_MAP = {
  "image/jpeg":     ".jpg",
  "image/png":      ".png",
  "application/pdf": ".pdf",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = EXT_MAP[file.mimetype] || ".bin";
    cb(null, `comprobante_${req.params.id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (EXT_MAP[file.mimetype]) return cb(null, true);
  cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Tipo no permitido"));
};

const uploader = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

function uploadComprobanteMiddleware(req, res, next) {
  uploader.single("comprobante")(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE")
        return res.status(400).json({ error: "El archivo supera el límite de 5 MB." });
      return res.status(400).json({ error: "Tipo de archivo no permitido. Solo JPG, PNG o PDF." });
    }
    return res.status(400).json({ error: err.message || "Error al procesar el archivo." });
  });
}

module.exports = uploadComprobanteMiddleware;
