const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs').promises;
const slugify = require('slugify');
const cors = require('cors'); 

const app = express();
const PORT = process.env.PORT || 3000;
const corsOptions = {
    origin: '*', // Permitir todas las solicitudes de cualquier origen
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'domain']
};
app.use(cors(corsOptions));
const DIRECTORY_BASE = 'media-static.creceidea.pe';

const ensureDirectoriesExist = async (DIR_DOMAIN) => {
    try {
        await fs.access(`../${DIRECTORY_BASE}/${DIR_DOMAIN}`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(`../${DIRECTORY_BASE}/${DIR_DOMAIN}`, { recursive: true });
        } else {
            console.error('Error al acceder al directorio:', err);
            throw err;
        }
    }
};

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB in bytes

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, `../${DIRECTORY_BASE}`);
    },
    filename: function (req, file, cb) {
        const originalName = file.originalname;
        const extension = originalName.split('.').pop();
        const fileName = slugify(originalName.split('.')[0], { lower: true, remove: /[*+~.()'"!:@]/g }).replace(/\s+/g, '-') + '-' + Date.now() + '.' + extension;
        cb(null, fileName);
    }
});

const upload = multer({
    storage: storage
});

app.post('/image/banner', upload.single('image'), async (req, res) => {
    const domain = req.headers['domain'];

    if (!domain) {
        return res.status(400).json({ error: 'Domain header is required' });
    }


    const DIR_DOMAIN = domain + '/images/banner';
    try {
        await ensureDirectoriesExist(DIR_DOMAIN);

        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ninguna imagen.' });
        }


        if (req.file.size > MAX_IMAGE_SIZE_BYTES) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'La imagen excede el tamaño máximo permitido (2MB).' });
        }


        const allowedFormats = ['image/jpeg', 'image/png'];
        if (!allowedFormats.includes(req.file.mimetype)) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'Formato de imagen no permitido.' });
        }
        const NAME_FILE = slugify(req.file.originalname.split('.')[0], { lower: true, remove: /[*+~.()'"!:@]/g }).replace(/\s+/g, '-');
        const outputPath = `../${DIRECTORY_BASE}/${DIR_DOMAIN}/${NAME_FILE}.webp`;
        await sharp(req.file.path).toFormat('webp').toFile(outputPath);
        await fs.unlink(req.file.path);

        res.json({ imageUrl: `https://${DIRECTORY_BASE}/${DIR_DOMAIN}/${NAME_FILE}.webp` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/image/product', upload.single('image'), async (req, res) => {
    const domain = req.headers['domain'];

    if (!domain) {
        return res.status(400).json({ error: 'Domain header is required' });
    }

    const DIR_DOMAIN = domain + '/images/products';


    try {
        await ensureDirectoriesExist(DIR_DOMAIN);

        if (req.file.size > MAX_IMAGE_SIZE_BYTES) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'La imagen excede el tamaño máximo permitido (2MB).' });
        }


        if (!req.file) {
            return res.status(400).json({ error: 'No se ha subido ninguna imagen.' });
        }

        const allowedFormats = ['image/jpeg', 'image/png'];
        if (!allowedFormats.includes(req.file.mimetype)) {
            await fs.unlink(req.file.path);
            return res.status(400).json({ error: 'Formato de imagen no permitido.' });
        }
        const NAME_FILE = slugify(req.file.originalname.split('.')[0], { lower: true, remove: /[*+~.()'"!:@]/g }).replace(/\s+/g, '-');
        const outputPath = `../${DIRECTORY_BASE}/${DIR_DOMAIN}/${NAME_FILE}.webp`;
        await sharp(req.file.path).toFormat('webp').toFile(outputPath);
        await fs.unlink(req.file.path);

        res.json({ imageUrl: `https://${DIRECTORY_BASE}/${DIR_DOMAIN}/${NAME_FILE}.webp` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.use(express.static(DIRECTORY_BASE));

app.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en http://localhost:${PORT}`);
});