const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises; // Importar fs con promesas
const slugify = require('slugify');

const app = express();
const PORT = process.env.PORT || 3000;

const BRIAMZSPORT_DIR = '../media-static.creceidea.pe';

const ensureDirectoriesExist = async (DIR_DOMAIN) => {
    try {
        await fs.access(`${BRIAMZSPORT_DIR}/${DIR_DOMAIN}`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(`${BRIAMZSPORT_DIR}/${DIR_DOMAIN}`, { recursive: true });
        } else {
            console.error('Error al acceder al directorio:', err);
            throw err; // Lanzar el error para que sea manejado en la ruta /upload
        }
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, BRIAMZSPORT_DIR);
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const extension = originalName.split('.').pop();
        const fileName = slugify(originalName.split('.')[0], { lower: true, remove: /[*+~.()'"!:@]/g }).replace(/\s+/g, '-') + '-' + Date.now() + '.' + extension;
        cb(null, fileName);
    }
});
const upload = multer({ storage: storage });

app.post('/upload', upload.single('image'), async (req, res) => {
    const DIR_DOMAIN = 'fiberstar';
    try {
        await ensureDirectoriesExist(DIR_DOMAIN); // Esperar a que se aseguren los directorios existan

        if (!req.file) {
            return res.status(400).send('No se ha subido ninguna imagen.');
        }

        const allowedFormats = ['image/jpeg', 'image/png'];
        if (!allowedFormats.includes(req.file.mimetype)) {
            await fs.unlink(req.file.path); // Usar fs.promises para eliminar el archivo
            return res.status(400).send('Formato de imagen no permitido.');
        }

        const outputPath = `${BRIAMZSPORT_DIR}/${DIR_DOMAIN}/${slugify(req.file.originalname.split('.')[0], { lower: true, remove: /[*+~.()'"!:@]/g }).replace(/\s+/g, '-')}.webp`;
        await sharp(req.file.path).toFormat('webp').toFile(outputPath);
        await fs.unlink(req.file.path); // Eliminar el archivo original con fs.promises

        res.send({ imageUrl: `http://localhost:${PORT}/${outputPath}` });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error interno del servidor.');
    }
});

app.use(express.static(BRIAMZSPORT_DIR));

app.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${PORT}`);
});
