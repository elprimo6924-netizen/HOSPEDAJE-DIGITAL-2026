-- ============================================================
-- Seed de imagenes para servicios
-- ============================================================
USE hospedaje;

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?spa,massage'
WHERE NombreServicio = 'Spa y Masajes';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?restaurant,food'
WHERE NombreServicio = 'Restaurante';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?pool,swimming'
WHERE NombreServicio = 'Piscina';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?wifi,network'
WHERE NombreServicio = 'WiFi';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?gym,fitness'
WHERE NombreServicio = 'Gimnasio';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?room-service,hotel'
WHERE NombreServicio = 'Servicio a la Habitación';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?city,tour'
WHERE NombreServicio = 'Tour Guiado';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?laundry,clean'
WHERE NombreServicio = 'Lavandería';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?transport,airport'
WHERE NombreServicio = 'Transporte';

UPDATE servicio
SET imagen_url = 'https://source.unsplash.com/featured/?bar,cocktail'
WHERE NombreServicio = 'Bar y Cocktails';

SELECT IDServicio, NombreServicio, imagen_url
FROM servicio
WHERE NombreServicio IN (
    'Spa y Masajes',
    'Restaurante',
    'Piscina',
    'WiFi',
    'Gimnasio',
    'Servicio a la Habitación',
    'Tour Guiado',
    'Lavandería',
    'Transporte',
    'Bar y Cocktails'
);
