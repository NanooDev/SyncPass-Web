-- ============================================================
-- SYNCPASS — DDL Script
-- Sistema de Acreditación Digital para Vinculación Comunitaria
-- Asignatura: DSY1105 · Duoc UC · 2026
-- Base de datos: PostgreSQL (Supabase)
-- ============================================================
--
-- INSTRUCCIONES PARA ORACLE SQL DEVELOPER DATA MODELER:
--   1. Abrir Data Modeler
--   2. Ir a: File > Import > DDL File...
--   3. Seleccionar este archivo (.sql)
--   4. Elegir tipo de DB: "PostgreSQL" (o Generic si no está)
--   5. Confirmar importación → el diagrama ER se genera automáticamente
--   6. Usar View > Fit to Window para centrar el diagrama
--   7. Arrastrar las entidades para organizar el layout
--
-- NOTA OFFLINE-FIRST:
--   Los campos is_synced, created_locally_at, device_id, synced_at
--   son clave para la arquitectura offline. Se gestionan con Room/SQLite
--   en Android y se sincronizan por batch hacia Supabase vía API REST.
-- ============================================================


-- ============================================================
-- LIMPIAR ESQUEMA (solo en entorno de desarrollo)
-- ============================================================

DROP TABLE IF EXISTS sync_log              CASCADE;
DROP TABLE IF EXISTS encuesta_valoracion   CASCADE;
DROP TABLE IF EXISTS registro_asistencia   CASCADE;
DROP TABLE IF EXISTS evento_taller         CASCADE;
DROP TABLE IF EXISTS proyecto_comunitario  CASCADE;
DROP TABLE IF EXISTS beneficiario          CASCADE;
DROP TABLE IF EXISTS estudiante_voluntario CASCADE;
DROP TABLE IF EXISTS docente               CASCADE;
DROP TABLE IF EXISTS usuario               CASCADE;


-- ============================================================
-- 1. USUARIO  (superentidad — autenticación via Supabase Auth)
-- ============================================================

CREATE TABLE usuario (
    id_usuario        UUID         PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    correo            VARCHAR(150) NOT NULL UNIQUE,
    rol               VARCHAR(30)  NOT NULL
                        CHECK (rol IN ('docente', 'estudiante_voluntario', 'administrador')),
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  usuario          IS 'Superentidad de usuarios. id_usuario = UUID de Supabase Auth.';
COMMENT ON COLUMN usuario.rol      IS 'Rol: docente (coordinador), estudiante_voluntario (operador), administrador.';


-- ============================================================
-- 2. DOCENTE  (especialización de USUARIO)
-- ============================================================

CREATE TABLE docente (
    id_usuario        UUID         PRIMARY KEY
                        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    codigo_docente    VARCHAR(20)  UNIQUE,
    especialidad      VARCHAR(100)
);

COMMENT ON TABLE docente IS 'Docente o coordinador de proyectos comunitarios. Especialización de USUARIO.';


-- ============================================================
-- 3. ESTUDIANTE_VOLUNTARIO  (especialización de USUARIO)
-- ============================================================

CREATE TABLE estudiante_voluntario (
    id_usuario        UUID         PRIMARY KEY
                        REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    rut               VARCHAR(12)  NOT NULL UNIQUE,
    carrera           VARCHAR(100),
    seccion           VARCHAR(20),
    semestre          SMALLINT     CHECK (semestre BETWEEN 1 AND 12)
);

COMMENT ON TABLE  estudiante_voluntario     IS 'Estudiante que opera la app en terreno. Especialización de USUARIO.';
COMMENT ON COLUMN estudiante_voluntario.rut IS 'RUT ficticio — sin datos personales reales (restricción del caso).';


-- ============================================================
-- 4. BENEFICIARIO  (asistente comunitario — sin cuenta en sistema)
-- ============================================================

CREATE TABLE beneficiario (
    id_beneficiario         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    identificador_sintetico VARCHAR(20)  NOT NULL UNIQUE,
    nombre_ficticio         VARCHAR(100) NOT NULL,
    tipo                    VARCHAR(20)  NOT NULL DEFAULT 'vecino'
                                CHECK (tipo IN ('vecino', 'estudiante_externo', 'otro')),
    qr_code                 TEXT         UNIQUE,
    activo                  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  beneficiario                         IS 'Participante comunitario. Sin cuenta en el sistema. Identificado con QR sintético.';
COMMENT ON COLUMN beneficiario.identificador_sintetico IS 'Código ficticio (ej: BEN-00123). Nunca datos personales reales.';
COMMENT ON COLUMN beneficiario.qr_code                 IS 'Contenido del QR personal del beneficiario para acreditación.';


-- ============================================================
-- 5. PROYECTO_COMUNITARIO
-- ============================================================

CREATE TABLE proyecto_comunitario (
    id_proyecto       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    id_docente        UUID         NOT NULL
                        REFERENCES docente(id_usuario) ON DELETE RESTRICT,
    titulo            VARCHAR(200) NOT NULL,
    descripcion       TEXT,
    area_tematica     VARCHAR(100),
    unidad_vecinal    VARCHAR(200),
    fecha_inicio      DATE         NOT NULL,
    fecha_termino     DATE         NOT NULL,
    estado            VARCHAR(20)  NOT NULL DEFAULT 'planificado'
                        CHECK (estado IN ('planificado', 'activo', 'finalizado', 'cancelado')),
    created_at        TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_proyecto_fechas CHECK (fecha_termino >= fecha_inicio)
);

COMMENT ON TABLE proyecto_comunitario IS 'Proyecto de vinculación comunitaria gestionado por un docente.';


-- ============================================================
-- 6. EVENTO_TALLER
-- ============================================================

CREATE TABLE evento_taller (
    id_evento              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    id_proyecto            UUID         NOT NULL
                             REFERENCES proyecto_comunitario(id_proyecto) ON DELETE CASCADE,
    id_coordinador         UUID         NOT NULL
                             REFERENCES estudiante_voluntario(id_usuario) ON DELETE RESTRICT,
    nombre_actividad       VARCHAR(200) NOT NULL,
    fecha_hora_programada  TIMESTAMP    NOT NULL,
    fecha_hora_inicio_real TIMESTAMP,
    fecha_hora_fin_real    TIMESTAMP,
    cupos_maximos          SMALLINT     NOT NULL CHECK (cupos_maximos > 0),
    recinto                VARCHAR(200),
    direccion              VARCHAR(300),
    latitud                DECIMAL(10,8),
    longitud               DECIMAL(11,8),
    radio_geofence_metros  SMALLINT     DEFAULT 150,
    qr_evento              TEXT         UNIQUE,
    estado                 VARCHAR(20)  NOT NULL DEFAULT 'programado'
                             CHECK (estado IN ('programado', 'en_curso', 'finalizado', 'cancelado')),
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  evento_taller                       IS 'Taller o actividad específica dentro de un proyecto comunitario.';
COMMENT ON COLUMN evento_taller.latitud               IS 'Coordenadas GPS del recinto para geofencing.';
COMMENT ON COLUMN evento_taller.radio_geofence_metros IS 'Radio en metros para validar que la marcación ocurre en el recinto.';
COMMENT ON COLUMN evento_taller.qr_evento             IS 'QR del evento para identificar el contexto de acreditación.';


-- ============================================================
-- 7. REGISTRO_ASISTENCIA  ← TABLA CENTRAL / OFFLINE-FIRST
-- ============================================================

CREATE TABLE registro_asistencia (
    id_registro           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    id_evento             UUID         NOT NULL
                            REFERENCES evento_taller(id_evento) ON DELETE RESTRICT,
    id_beneficiario       UUID         NOT NULL
                            REFERENCES beneficiario(id_beneficiario) ON DELETE RESTRICT,
    id_voluntario         UUID         NOT NULL
                            REFERENCES estudiante_voluntario(id_usuario) ON DELETE RESTRICT,

    -- Datos de la marcación
    timestamp_marcacion   TIMESTAMP    NOT NULL,
    latitud_marcacion     DECIMAL(10,8),
    longitud_marcacion    DECIMAL(11,8),
    distancia_recinto_m   INT,
    estado_validacion     VARCHAR(20)  NOT NULL DEFAULT 'valido'
                            CHECK (estado_validacion IN ('valido', 'invalido', 'fuera_de_rango', 'duplicado')),

    -- Campos OFFLINE-FIRST (gestionados por Room en Android)
    is_synced             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_locally_at    TIMESTAMP    NOT NULL,
    sync_attempt_at       TIMESTAMP,
    synced_at             TIMESTAMP,
    device_id             VARCHAR(100),

    CONSTRAINT uq_asistencia_evento_beneficiario UNIQUE (id_evento, id_beneficiario)
);

COMMENT ON TABLE  registro_asistencia                    IS 'Registro de asistencia. Tabla central. Diseño offline-first.';
COMMENT ON COLUMN registro_asistencia.is_synced          IS 'FALSE = dato solo en dispositivo local. TRUE = sincronizado con Supabase.';
COMMENT ON COLUMN registro_asistencia.created_locally_at IS 'Timestamp del reloj local del dispositivo Android al marcar.';
COMMENT ON COLUMN registro_asistencia.device_id          IS 'ID del dispositivo Android que generó el registro.';


-- ============================================================
-- 8. ENCUESTA_VALORACION  ← OFFLINE-FIRST
-- ============================================================

CREATE TABLE encuesta_valoracion (
    id_encuesta           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    id_evento             UUID         NOT NULL
                            REFERENCES evento_taller(id_evento) ON DELETE RESTRICT,
    id_beneficiario       UUID         NOT NULL
                            REFERENCES beneficiario(id_beneficiario) ON DELETE RESTRICT,

    estrellas             SMALLINT     NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    nivel_utilidad        SMALLINT              CHECK (nivel_utilidad BETWEEN 1 AND 5),
    comentarios           TEXT,

    -- Campos OFFLINE-FIRST
    is_synced             BOOLEAN      NOT NULL DEFAULT FALSE,
    created_locally_at    TIMESTAMP    NOT NULL,
    synced_at             TIMESTAMP,
    device_id             VARCHAR(100),

    CONSTRAINT uq_encuesta_evento_beneficiario UNIQUE (id_evento, id_beneficiario)
);

COMMENT ON TABLE  encuesta_valoracion           IS 'Encuesta de satisfacción post-acreditación. Diseño offline-first.';
COMMENT ON COLUMN encuesta_valoracion.estrellas IS 'Satisfacción general: 1 (muy malo) a 5 (excelente).';
COMMENT ON COLUMN encuesta_valoracion.is_synced IS 'FALSE = dato en dispositivo local. TRUE = enviado a Supabase.';


-- ============================================================
-- 9. SYNC_LOG  (auditoría de sincronizaciones batch)
-- ============================================================

CREATE TABLE sync_log (
    id_sync               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tabla_origen          VARCHAR(50)  NOT NULL,
    id_registro_origen    UUID         NOT NULL,
    device_id             VARCHAR(100),
    resultado             VARCHAR(20)  NOT NULL
                            CHECK (resultado IN ('exitoso', 'fallido', 'conflicto', 'duplicado')),
    mensaje_error         TEXT,
    timestamp_sync        TIMESTAMP    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sync_log IS 'Log de auditoría de operaciones de sincronización offline->online.';


-- ============================================================
-- ÍNDICES DE RENDIMIENTO
-- ============================================================

CREATE INDEX idx_asistencia_not_synced
    ON registro_asistencia (is_synced, device_id) WHERE is_synced = FALSE;

CREATE INDEX idx_encuesta_not_synced
    ON encuesta_valoracion (is_synced, device_id) WHERE is_synced = FALSE;

CREATE INDEX idx_evento_proyecto
    ON evento_taller (id_proyecto, estado);

CREATE INDEX idx_proyecto_docente
    ON proyecto_comunitario (id_docente, estado);

CREATE INDEX idx_asistencia_beneficiario
    ON registro_asistencia (id_beneficiario, timestamp_marcacion);

CREATE INDEX idx_sync_log_device
    ON sync_log (device_id, timestamp_sync);


-- ============================================================
-- DATOS DE EJEMPLO (100% ficticios — restricción del caso)
-- ============================================================

INSERT INTO usuario VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Nelson Melo (Ficticio)', 'nmelo.ficticio@duocuc.cl',
    'docente', TRUE, NOW(), NOW()
);
INSERT INTO docente VALUES (
    '00000000-0000-0000-0000-000000000001',
    'DOC-NM-001', 'Informática y Telecomunicaciones'
);

INSERT INTO usuario VALUES (
    '00000000-0000-0000-0000-000000000002',
    'Mariano R. (Ficticio)', 'mrodzf.ficticio@duocuc.cl',
    'estudiante_voluntario', TRUE, NOW(), NOW()
);
INSERT INTO estudiante_voluntario VALUES (
    '00000000-0000-0000-0000-000000000002',
    '23.205.464-F', 'Ing. Informática', 'DYA4101', 4
);

INSERT INTO proyecto_comunitario VALUES (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Alfabetización Digital 2026',
    'Talleres de uso básico de smartphone para adultos mayores.',
    'Tecnología', 'Junta de Vecinos Villa El Roble',
    '2026-08-01', '2026-12-15', 'activo', NOW(), NOW()
);

INSERT INTO evento_taller VALUES (
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000002',
    'Taller: Uso de WhatsApp y videollamadas',
    '2026-10-15 09:00:00', '2026-10-15 09:05:00', NULL,
    40, 'Sede Social Villa El Roble',
    'Av. Las Flores 1234, Lo Espejo',
    -33.5012, -70.6890, 150, 'EVT-2026-001',
    'en_curso', NOW(), NOW()
);

INSERT INTO beneficiario VALUES
    ('00000000-0000-0000-0003-000000000001','BEN-00101','María González (F)','vecino','QR-BEN-00101',TRUE,NOW()),
    ('00000000-0000-0000-0003-000000000002','BEN-00102','Carlos Soto (F)',    'vecino','QR-BEN-00102',TRUE,NOW()),
    ('00000000-0000-0000-0003-000000000003','BEN-00103','Rosa Díaz (F)',      'vecino','QR-BEN-00103',TRUE,NOW());

INSERT INTO registro_asistencia VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0003-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '2026-10-15 09:08:32',
    -33.5015, -70.6887, 35, 'valido',
    FALSE, '2026-10-15 09:08:32', NULL, NULL, 'DEVICE-PIXEL7-MRZ'
);

INSERT INTO encuesta_valoracion VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0002-000000000001',
    '00000000-0000-0000-0003-000000000001',
    5, 4, 'Muy claro, aprendí bastante',
    FALSE, '2026-10-15 09:09:10', NULL, 'DEVICE-PIXEL7-MRZ'
);

-- ============================================================
-- FIN DEL SCRIPT
-- Tablas: 9 | Relaciones FK: 13 | Índices: 6
-- ============================================================
